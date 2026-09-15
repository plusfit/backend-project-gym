import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Client } from "@/src/context/clients/schemas/client.schema";
import {
	effectivePreferences,
	isReminderRuleKey,
	NotificationPreferences,
	ReminderRuleKey,
} from "@/src/context/reminders/rule-keys";

/**
 * Owns the device tokens and notification preferences of a client.
 *
 * Kept apart from ClientsService because its unit of work is a device, not a
 * person: the same token can move between accounts when a phone changes hands.
 */
@Injectable()
export class PushTokensService {
	constructor(
		@InjectModel(Client.name) private readonly clientModel: Model<Client>,
	) {}

	/**
	 * Registers a device for a client.
	 *
	 * The token is first detached from any other client: a device that logged
	 * into another account must stop receiving the previous person's reminders.
	 */
	async registerToken(clientId: string, token: string, userAgent?: string): Promise<void> {
		const trimmed = token?.trim();
		if (!trimmed) {
			throw new BadRequestException("A push token is required");
		}

		await this.clientModel.updateMany(
			{ _id: { $ne: clientId }, "pushTokens.token": trimmed },
			{ $pull: { pushTokens: { token: trimmed } } },
		);

		const now = new Date();

		const refreshed = await this.clientModel.updateOne(
			{ _id: clientId, "pushTokens.token": trimmed },
			{
				$set: {
					"pushTokens.$.lastSeenAt": now,
					...(userAgent ? { "pushTokens.$.userAgent": userAgent } : {}),
				},
			},
		);

		if (refreshed.matchedCount > 0) {
			return;
		}

		await this.clientModel.updateOne(
			{ _id: clientId },
			{ $push: { pushTokens: { token: trimmed, userAgent, createdAt: now, lastSeenAt: now } } },
		);
	}

	async removeToken(clientId: string, token: string): Promise<void> {
		await this.clientModel.updateOne(
			{ _id: clientId },
			{ $pull: { pushTokens: { token } } },
		);
	}

	/** Effective preferences: every known rule, with absent meaning enabled. */
	async getPreferences(clientId: string): Promise<Record<ReminderRuleKey, boolean>> {
		const client = await this.clientModel.findById(clientId).lean().exec();

		if (!client) {
			throw new NotFoundException(`Client ${clientId} not found`);
		}

		return effectivePreferences(
			(client as { notificationPreferences?: NotificationPreferences })
				.notificationPreferences,
		);
	}

	async updatePreferences(
		clientId: string,
		preferences: Record<string, boolean>,
	): Promise<Record<ReminderRuleKey, boolean>> {
		const unknown = Object.keys(preferences).filter((key) => !isReminderRuleKey(key));
		if (unknown.length > 0) {
			throw new BadRequestException(`Unknown reminder rules: ${unknown.join(", ")}`);
		}

		// Only the given rules are touched, so a client's other opt-outs survive.
		const $set = Object.fromEntries(
			Object.entries(preferences).map(([key, value]) => [
				`notificationPreferences.${key}`,
				value,
			]),
		);

		if (Object.keys($set).length > 0) {
			await this.clientModel.updateOne({ _id: clientId }, { $set });
		}

		return this.getPreferences(clientId);
	}
}
