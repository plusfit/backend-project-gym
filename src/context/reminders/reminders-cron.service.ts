import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Client } from "@/src/context/clients/schemas/client.schema";
import { PushRecipient } from "@/src/context/notifications/dto/push-recipient.dto";
import { NotificationsService } from "@/src/context/notifications/notifications.service";
import { effectivePreferences } from "@/src/context/reminders/rule-keys";
import { ReminderSettingsService } from "@/src/context/reminders/reminder-settings.service";
import { REMINDER_RULES } from "@/src/context/reminders/rules/registry";
import {
	ClientContext,
	ReminderDataSource,
	ReminderIntent,
	ReminderRule,
	RuleContext,
	RuleSettings,
} from "@/src/context/reminders/rules/reminder-rule";
import {
	ReminderDispatch,
	ReminderDispatchStatus,
} from "@/src/context/reminders/schemas/reminder-dispatch.schema";
import { Reward } from "@/src/context/rewards/schemas/reward.schema";
import { Routine } from "@/src/context/routines/schemas/routine.schema";
import { SubRoutine } from "@/src/context/routines/schemas/sub-routine.schema";
import { Schedule } from "@/src/context/schedules/schemas/schedule.schema";
import { formatDateAsAccessDay, getUruguayTime } from "@/src/context/shared/utils/date.utils";

export interface RuleRunSummary {
	ruleKey: string;
	evaluated: number;
	sent: number;
	skipped: number;
	failed: number;
}

/**
 * Decides who gets reminded and hands the finished notifications to the
 * notifications service.
 *
 * It ticks every 15 minutes rather than hourly so a pass that fails — the
 * notifications service being briefly down, say — can recover the same day.
 * Sending more than once is prevented by a dispatch record claimed BEFORE the
 * send, not by how often the cron runs.
 */
@Injectable()
export class RemindersCronService {
	private readonly logger = new Logger(RemindersCronService.name);

	constructor(
		@InjectModel(Client.name) private readonly clientModel: Model<Client>,
		@InjectModel(Schedule.name) private readonly scheduleModel: Model<Schedule>,
		@InjectModel(Routine.name) private readonly routineModel: Model<Routine>,
		@InjectModel(SubRoutine.name) private readonly subRoutineModel: Model<SubRoutine>,
		@InjectModel(Reward.name) private readonly rewardModel: Model<Reward>,
		@InjectModel(ReminderDispatch.name)
		private readonly dispatchModel: Model<ReminderDispatch>,
		private readonly settingsService: ReminderSettingsService,
		private readonly notificationsService: NotificationsService,
	) {}

	@Cron("*/15 * * * *", { name: "reminders.dispatch", timeZone: "America/Montevideo" })
	async handleCron(): Promise<void> {
		await this.runDueRules(getUruguayTime());
	}

	/** Runs every rule whose configured hour is the current one. */
	async runDueRules(now: Date): Promise<RuleRunSummary[]> {
		const settings = await this.settingsService.getSettings();

		const dueRules = REMINDER_RULES.filter((rule) => {
			const ruleSettings = settings[rule.key];
			return ruleSettings?.enabled && Number(ruleSettings.sendHour) === now.getHours();
		});

		if (dueRules.length === 0) {
			return [];
		}

		const clients = await this.loadClients();
		if (clients.length === 0) {
			return [];
		}

		const { context, degraded } = await this.loadContext(now, dueRules);
		const summaries: RuleRunSummary[] = [];

		for (const rule of dueRules) {
			// A rule whose data could not be loaded is reported as failed rather
			// than quietly deciding "nothing to say" from empty inputs.
			const missing = rule.requires.filter((source) => degraded.has(source));
			if (missing.length > 0) {
				this.logger.error(
					`Skipping rule ${rule.key}: could not load ${missing.join(", ")}`,
				);
				summaries.push({
					ruleKey: rule.key,
					evaluated: 0,
					sent: 0,
					skipped: 0,
					failed: clients.length,
				});
				continue;
			}

			try {
				summaries.push(await this.runRule(rule, settings[rule.key], clients, context, now));
			} catch (error: any) {
				// One broken rule must not silence the others.
				this.logger.error(`Rule ${rule.key} failed: ${error?.message}`, error?.stack);
				summaries.push({
					ruleKey: rule.key,
					evaluated: 0,
					sent: 0,
					skipped: 0,
					failed: clients.length,
				});
			}
		}

		return summaries;
	}

	private async runRule(
		rule: ReminderRule,
		settings: RuleSettings,
		clients: ClientContext[],
		context: RuleContext,
		now: Date,
	): Promise<RuleRunSummary> {
		const dateKey = formatDateAsAccessDay(now);
		const summary: RuleRunSummary = {
			ruleKey: rule.key,
			evaluated: 0,
			sent: 0,
			skipped: 0,
			failed: 0,
		};

		const items: PushRecipient[] = [];
		const claimedClientIds: string[] = [];

		for (const client of clients) {
			if (!client.preferences[rule.key]) {
				summary.skipped += 1;
				continue;
			}

			summary.evaluated += 1;

			let intent: ReminderIntent | null;
			try {
				intent = rule.evaluate(client, context, settings);
			} catch (error: any) {
				// A single client's bad data must not abort the whole rule.
				this.logger.warn(`Rule ${rule.key} failed for client ${client.id}: ${error?.message}`);
				summary.failed += 1;
				continue;
			}

			if (!intent) {
				summary.skipped += 1;
				continue;
			}

			// Claim first: if the row already exists this client was told today.
			if (!(await this.claim(client.id, rule.key, dateKey))) {
				summary.skipped += 1;
				continue;
			}

			claimedClientIds.push(client.id);
			for (const token of client.tokens) {
				items.push({
					to: token,
					title: intent.title,
					message: intent.body,
					data: intent.data,
				});
			}
		}

		if (items.length === 0) {
			return summary;
		}

		try {
			const { batchId } = await this.notificationsService.bulkPush(items);

			await this.dispatchModel.updateMany(
				{ clientId: { $in: claimedClientIds }, ruleKey: rule.key, dateKey },
				{ $set: { status: ReminderDispatchStatus.SENT, batchId } },
			);

			summary.sent = claimedClientIds.length;
		} catch (error: any) {
			// The claim is only valid if the send happened. Releasing it lets the
			// next 15-minute tick try again instead of losing the day.
			await this.dispatchModel.deleteMany({
				clientId: { $in: claimedClientIds },
				ruleKey: rule.key,
				dateKey,
				status: ReminderDispatchStatus.PENDING,
			});

			this.logger.error(`Could not send ${rule.key} reminders: ${error?.message}`);
			summary.failed = claimedClientIds.length;
		}

		this.logger.log(
			`Rule ${rule.key}: evaluated ${summary.evaluated}, sent ${summary.sent}, skipped ${summary.skipped}, failed ${summary.failed}`,
		);

		return summary;
	}

	/**
	 * Reserves the right to notify this client about this rule today.
	 * Returns false when the unique index rejects a duplicate.
	 */
	private async claim(clientId: string, ruleKey: string, dateKey: string): Promise<boolean> {
		try {
			await this.dispatchModel.create({
				clientId,
				ruleKey,
				dateKey,
				status: ReminderDispatchStatus.PENDING,
			});
			return true;
		} catch (error: any) {
			if (error?.code === 11000) {
				return false;
			}
			throw error;
		}
	}

	/** Only clients who can actually receive a push are worth evaluating. */
	private async loadClients(): Promise<ClientContext[]> {
		const clients = await this.clientModel
			.find({ disabled: { $ne: true }, "pushTokens.0": { $exists: true } })
			.select("_id userInfo email routineId availableDays availablePoints pushTokens notificationPreferences")
			.lean()
			.exec();

		if (clients.length === 0) {
			return [];
		}

		const attendedDays = await this.loadAttendedDays(clients.map((c: any) => String(c._id)));
		const subRoutineIds = await this.loadRoutineSubRoutines(clients);

		return clients.map((client: any) => ({
			id: String(client._id),
			name: client.userInfo?.name || client.email || "",
			availableDays: client.availableDays ?? 0,
			availablePoints: client.availablePoints ?? 0,
			subRoutineIds: subRoutineIds.get(String(client.routineId)) ?? [],
			attendedDays: attendedDays.get(String(client._id)) ?? [],
			tokens: (client.pushTokens ?? []).map((t: any) => t.token).filter(Boolean),
			preferences: effectivePreferences(client.notificationPreferences),
		}));
	}

	/**
	 * Which weekdays each client enrolled in. One aggregation for everyone,
	 * because asking per client would be hundreds of round trips per pass.
	 */
	private async loadAttendedDays(clientIds: string[]): Promise<Map<string, string[]>> {
		const schedules = await this.scheduleModel
			.find({ disabled: { $ne: true }, clients: { $exists: true, $ne: [] } })
			.select("day clients")
			.lean()
			.exec();

		const wanted = new Set(clientIds);
		const byClient = new Map<string, string[]>();

		for (const schedule of schedules as any[]) {
			for (const clientId of schedule.clients ?? []) {
				const id = String(clientId);
				if (!wanted.has(id)) continue;

				const days = byClient.get(id) ?? [];
				days.push(schedule.day);
				byClient.set(id, days);
			}
		}

		return byClient;
	}

	private async loadRoutineSubRoutines(clients: any[]): Promise<Map<string, string[]>> {
		const routineIds = [
			...new Set(clients.map((c) => c.routineId).filter(Boolean).map(String)),
		];

		if (routineIds.length === 0) {
			return new Map();
		}

		const routines = await this.routineModel
			.find({ _id: { $in: routineIds } })
			.select("subRoutines")
			.lean()
			.exec();

		return new Map(
			(routines as any[]).map((routine) => [
				String(routine._id),
				(routine.subRoutines ?? []).map(String),
			]),
		);
	}

	/**
	 * Shared data loaded once per pass, and only for the sources the due rules
	 * actually need. Each source is loaded independently so one failure does not
	 * take down the rules that do not depend on it.
	 */
	private async loadContext(
		now: Date,
		dueRules: ReminderRule[],
	): Promise<{ context: RuleContext; degraded: Set<ReminderDataSource> }> {
		const needed = new Set(dueRules.flatMap((rule) => rule.requires));
		const degraded = new Set<ReminderDataSource>();

		const subRoutines = needed.has("subRoutines")
			? await this.safeLoad("subRoutines", degraded, new Map(), async () => {
					const subs = (await this.subRoutineModel
						.find()
						.select("name category")
						.lean()
						.exec()) as any[];

					return new Map(
						subs.map((sub) => [
							String(sub._id),
							{ name: sub.name, category: sub.category },
						]),
					);
				})
			: new Map();

		const rewards = needed.has("rewards")
			? await this.safeLoad<{ name: string; pointsRequired: number }[]>(
					"rewards",
					degraded,
					[],
					async () => {
						const found = (await this.rewardModel
							.find({ disabled: { $ne: true } })
							.select("name pointsRequired")
							.lean()
							.exec()) as any[];

						return found.map((reward) => ({
							name: reward.name,
							pointsRequired: reward.pointsRequired,
						}));
					},
				)
			: [];

		return { context: { today: now, subRoutines, rewards }, degraded };
	}

	private async safeLoad<T>(
		source: ReminderDataSource,
		degraded: Set<ReminderDataSource>,
		fallback: T,
		load: () => Promise<T>,
	): Promise<T> {
		try {
			return await load();
		} catch (error: any) {
			this.logger.error(`Could not load ${source}: ${error?.message}`);
			degraded.add(source);
			return fallback;
		}
	}
}
