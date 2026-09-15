/**
 * Reminder rules the system can send.
 *
 * Adding a rule means adding its key here and registering its class. Client
 * preferences are stored by key rather than as fixed columns, so no schema
 * change or migration is needed when this list grows.
 */
export const REMINDER_RULE_KEYS = [
	"routineDay",
	"paymentDue",
	"pointsNearReward",
] as const;

export type ReminderRuleKey = (typeof REMINDER_RULE_KEYS)[number];

export const isReminderRuleKey = (key: string): key is ReminderRuleKey =>
	(REMINDER_RULE_KEYS as readonly string[]).includes(key);

/**
 * Preferences are opt-out: a rule the client never touched is enabled.
 * Storing only the exceptions keeps old documents valid as rules are added.
 */
export type NotificationPreferences = Partial<Record<ReminderRuleKey, boolean>>;

export const effectivePreferences = (
	stored: NotificationPreferences | undefined,
): Record<ReminderRuleKey, boolean> =>
	Object.fromEntries(
		REMINDER_RULE_KEYS.map((key) => [key, stored?.[key] !== false]),
	) as Record<ReminderRuleKey, boolean>;
