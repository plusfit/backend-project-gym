import { ReminderRuleKey } from "@/src/context/reminders/rule-keys";

/** Per-rule configuration the admin controls from the dashboard. */
export interface RuleSettings {
	enabled: boolean;
	/** Hour of day, in the gym's timezone, when this reminder goes out. */
	sendHour: number;
	/** Rule-specific thresholds, e.g. daysThreshold or pointsMargin. */
	[param: string]: boolean | number;
}

/** Describes a tunable so both front ends can render a control for it. */
export interface RuleParamSpec {
	name: string;
	label: string;
	type: "number";
	min: number;
	max: number;
}

/** Everything about one client a rule may look at. */
export interface ClientContext {
	id: string;
	name: string;
	availableDays: number;
	availablePoints: number;
	/** Subroutine ids of the client's routine, in the admin's order. */
	subRoutineIds: string[];
	/** Spanish day names of the schedules the client enrolled in. */
	attendedDays: string[];
	/** Device tokens to deliver to. A client with none is never evaluated. */
	tokens: string[];
	/** Effective opt-ins, already resolved from stored opt-outs. */
	preferences: Record<ReminderRuleKey, boolean>;
}

/**
 * Shared data sources a rule may depend on.
 *
 * Declared so a pass can keep running the rules whose data loaded fine when
 * one source is unavailable, instead of dying as a whole.
 */
export type ReminderDataSource = "subRoutines" | "rewards";

/** Shared, gym-wide data loaded once per cron pass instead of per client. */
export interface RuleContext {
	/** Today, in the gym's timezone. */
	today: Date;
	/** Display data for subroutines, keyed by id. */
	subRoutines: Map<string, { name: string; category: string }>;
	/** Enabled rewards, cheapest first. */
	rewards: { name: string; pointsRequired: number }[];
}

/** What a rule decides to say. Rendering happens here, delivery elsewhere. */
export interface ReminderIntent {
	title: string;
	body: string;
	/** Carried to the device; `url` becomes the deep link. */
	data?: Record<string, string>;
}

/**
 * One reminder rule.
 *
 * Rules are pure: they read a client and shared context and return what to say,
 * or null to stay quiet. They never query, never send, and never look at the
 * clock beyond the `today` they are handed, which is what makes them cheap to
 * test and safe to run in a batch.
 */
export interface ReminderRule {
	readonly key: ReminderRuleKey;
	/** Human label for the dashboard and the client settings screen. */
	readonly label: string;
	readonly description: string;
	readonly params: RuleParamSpec[];
	readonly defaultSettings: RuleSettings;
	/** Shared data this rule cannot decide without. */
	readonly requires: ReminderDataSource[];

	evaluate(client: ClientContext, context: RuleContext, settings: RuleSettings):
		| ReminderIntent
		| null;
}
