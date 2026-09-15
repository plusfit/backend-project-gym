import {
	ClientContext,
	ReminderIntent,
	ReminderRule,
	RuleContext,
	RuleSettings,
} from "./reminder-rule";

/**
 * "Your plan is running out."
 *
 * Billing here is prepaid days, not a due date, so the trigger is a threshold
 * on the days left rather than a calendar comparison. Zero days is deliberately
 * excluded: at that point the membership has lapsed and the client needs a
 * different conversation than a reminder.
 */
export const paymentDueRule: ReminderRule = {
	key: "paymentDue",
	label: "Plan por vencer",
	description:
		"Avisa cuando al cliente le quedan pocos días de plan disponibles, para que renueve antes de quedarse sin acceso.",
	params: [
		{
			name: "daysThreshold",
			label: "Avisar cuando queden N días o menos",
			type: "number",
			min: 1,
			max: 30,
		},
	],
	requires: [],
	defaultSettings: { enabled: false, sendHour: 10, daysThreshold: 3 },

	evaluate(
		client: ClientContext,
		_context: RuleContext,
		settings: RuleSettings,
	): ReminderIntent | null {
		const threshold = Number(settings.daysThreshold ?? 3);
		const daysLeft = client.availableDays;

		if (daysLeft <= 0 || daysLeft > threshold) {
			return null;
		}

		const unit = daysLeft === 1 ? "1 día" : `${daysLeft} días`;

		return {
			title: "Tu plan está por vencer",
			body: `${client.name}, te ${daysLeft === 1 ? "queda" : "quedan"} ${unit} de plan. Renoválo para no perder tu lugar.`,
			data: { url: "/plans", ruleKey: this.key },
		};
	},
};
