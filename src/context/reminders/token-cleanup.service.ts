import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model } from "mongoose";

import { Client } from "@/src/context/clients/schemas/client.schema";
import { NotificationsService } from "@/src/context/notifications/notifications.service";
import {
	ReminderDispatch,
	ReminderDispatchStatus,
} from "@/src/context/reminders/schemas/reminder-dispatch.schema";

/** A push batch needs a moment to drain before its failures mean anything. */
const MIN_BATCH_AGE_MS = 5 * 60 * 1000;
const LOOKBACK_MS = 24 * 60 * 60 * 1000;

/**
 * Removes device tokens the push provider has rejected as gone.
 *
 * Delivery is asynchronous, so failures cannot be read at send time. This runs
 * behind the sender, reads each batch once, and prunes only the tokens the
 * provider called permanently unregistered. Anything else is treated as
 * temporary and left alone: deleting a token on a transient error would
 * silently unsubscribe a working device.
 */
@Injectable()
export class TokenCleanupService {
	private readonly logger = new Logger(TokenCleanupService.name);

	constructor(
		@InjectModel(Client.name) private readonly clientModel: Model<Client>,
		@InjectModel(ReminderDispatch.name)
		private readonly dispatchModel: Model<ReminderDispatch>,
		private readonly notificationsService: NotificationsService,
	) {}

	@Cron("*/30 * * * *", { name: "reminders.token-cleanup" })
	async handleCron(): Promise<void> {
		await this.pruneDeadTokens();
	}

	/** Returns how many tokens were removed. */
	async pruneDeadTokens(now: Date = new Date()): Promise<number> {
		const dispatches = await this.dispatchModel
			.find({
				status: ReminderDispatchStatus.SENT,
				batchId: { $exists: true, $ne: null },
				failuresCheckedAt: { $exists: false },
				createdAt: {
					$gte: new Date(now.getTime() - LOOKBACK_MS),
					$lte: new Date(now.getTime() - MIN_BATCH_AGE_MS),
				},
			})
			.select("batchId")
			.lean()
			.exec();

		const batchIds = [
			...new Set((dispatches as any[]).map((d) => d.batchId).filter(Boolean)),
		];

		if (batchIds.length === 0) {
			return 0;
		}

		let removed = 0;

		for (const batchId of batchIds) {
			try {
				const failures = await this.notificationsService.getBatchFailures(batchId);

				const dead = failures
					.filter((failure) => failure.failureCode === "UNREGISTERED")
					.map((failure) => failure.to);

				if (dead.length > 0) {
					const result = await this.clientModel.updateMany(
						{ "pushTokens.token": { $in: dead } },
						{ $pull: { pushTokens: { token: { $in: dead } } } },
					);
					removed += dead.length;
					this.logger.log(
						`Pruned ${dead.length} dead tokens from ${result.modifiedCount ?? 0} clients (batch ${batchId})`,
					);
				}

				await this.dispatchModel.updateMany({ batchId }, { $set: { failuresCheckedAt: now } });
			} catch (error: any) {
				// Leave the batch unchecked so the next pass retries it.
				this.logger.warn(`Could not read batch ${batchId}: ${error?.message}`);
			}
		}

		return removed;
	}
}
