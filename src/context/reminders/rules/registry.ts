import { ReminderRuleKey } from "@/src/context/reminders/rule-keys";

import { paymentDueRule } from "./payment-due.rule";
import { pointsNearRewardRule } from "./points-near-reward.rule";
import { ReminderRule } from "./reminder-rule";
import { routineDayRule } from "./routine-day.rule";

/**
 * Every rule the system can run.
 *
 * This array is the only place a new rule has to be registered: the cron
 * iterates it, the settings document is seeded from it, and both front ends
 * render their toggles from the catalog built on top of it.
 */
export const REMINDER_RULES: ReminderRule[] = [
	routineDayRule,
	paymentDueRule,
	pointsNearRewardRule,
];

export const ruleByKey = (key: ReminderRuleKey): ReminderRule | undefined =>
	REMINDER_RULES.find((rule) => rule.key === key);

/** Shape both front ends use to render controls without hardcoding rules. */
export const reminderCatalog = () =>
	REMINDER_RULES.map((rule) => ({
		key: rule.key,
		label: rule.label,
		description: rule.description,
		params: rule.params,
		defaultSettings: rule.defaultSettings,
	}));
