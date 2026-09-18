import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { isReminderRuleKey, ReminderRuleKey } from "@/src/context/reminders/rule-keys";
import { REMINDER_RULES } from "@/src/context/reminders/rules/registry";
import { RuleSettings } from "@/src/context/reminders/rules/reminder-rule";
import {
	REMINDER_SETTINGS_SCOPE,
	ReminderSettings,
} from "@/src/context/reminders/schemas/reminder-settings.schema";

export type ResolvedSettings = Record<ReminderRuleKey, RuleSettings>;

/**
 * Reads and writes the gym-wide reminder configuration.
 *
 * Stored values are always merged over the rule's own defaults, so a rule added
 * after the document was written still resolves, and an admin who saved only
 * `enabled` does not lose the thresholds.
 */
@Injectable()
export class ReminderSettingsService {
	constructor(
		@InjectModel(ReminderSettings.name)
		private readonly settingsModel: Model<ReminderSettings>,
	) {}

	async getSettings(): Promise<ResolvedSettings> {
		const stored = await this.settingsModel
			.findOne({ scope: REMINDER_SETTINGS_SCOPE })
			.lean()
			.exec();

		return this.mergeWithDefaults(stored?.rules);
	}

	/**
	 * Applies a partial update. Only the rules and fields provided are touched,
	 * so turning one reminder off never resets another one's threshold.
	 */
	async updateSettings(
		update: Record<string, Partial<RuleSettings>>,
	): Promise<ResolvedSettings> {
		const unknown = Object.keys(update).filter((key) => !isReminderRuleKey(key));
		if (unknown.length > 0) {
			throw new BadRequestException(`Unknown reminder rules: ${unknown.join(", ")}`);
		}

		this.assertValidValues(update);

		const current = await this.getSettings();
		const merged: Record<string, RuleSettings> = { ...current };

		for (const [key, patch] of Object.entries(update)) {
			// Explicit undefined means "not provided", not "clear this field".
			const provided = Object.fromEntries(
				Object.entries(patch).filter(([, value]) => value !== undefined),
			);

			merged[key] = {
				...current[key as ReminderRuleKey],
				...provided,
			} as RuleSettings;
		}

		await this.settingsModel.updateOne(
			{ scope: REMINDER_SETTINGS_SCOPE },
			{ $set: { rules: merged } },
			{ upsert: true },
		);

		return this.mergeWithDefaults(merged);
	}

	private mergeWithDefaults(
		stored: Record<string, RuleSettings> | undefined,
	): ResolvedSettings {
		return Object.fromEntries(
			REMINDER_RULES.map((rule) => [
				rule.key,
				{ ...rule.defaultSettings, ...(stored?.[rule.key] ?? {}) },
			]),
		) as ResolvedSettings;
	}

	private assertValidValues(update: Record<string, Partial<RuleSettings>>): void {
		for (const [key, patch] of Object.entries(update)) {
			if (patch.sendHour !== undefined) {
				const hour = Number(patch.sendHour);
				if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
					throw new BadRequestException(`${key}.sendHour must be an hour between 0 and 23`);
				}
			}

			const rule = REMINDER_RULES.find((candidate) => candidate.key === key);
			for (const spec of rule?.params ?? []) {
				const value = patch[spec.name];
				if (value === undefined) continue;

				const numeric = Number(value);
				if (!Number.isFinite(numeric) || numeric < spec.min || numeric > spec.max) {
					throw new BadRequestException(
						`${key}.${spec.name} must be between ${spec.min} and ${spec.max}`,
					);
				}
			}
		}
	}
}
