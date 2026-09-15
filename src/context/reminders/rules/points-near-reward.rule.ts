import {
	ClientContext,
	ReminderIntent,
	ReminderRule,
	RuleContext,
	RuleSettings,
} from "./reminder-rule";

/**
 * "You are 40 points away from a free shake."
 *
 * The reward that motivates is the nearest one still out of reach. Rewards the
 * client can already claim are skipped: telling someone they are 0 points from
 * a prize they already earned is noise, not encouragement.
 */
export const pointsNearRewardRule: ReminderRule = {
	key: "pointsNearReward",
	label: "Cerca de un premio",
	description:
		"Avisa cuando al cliente le faltan pocos puntos para alcanzar el próximo premio disponible.",
	params: [
		{
			name: "pointsMargin",
			label: "Avisar cuando falten N puntos o menos",
			type: "number",
			min: 1,
			max: 1000,
		},
	],
	requires: ["rewards"],
	defaultSettings: { enabled: false, sendHour: 11, pointsMargin: 50 },

	evaluate(
		client: ClientContext,
		context: RuleContext,
		settings: RuleSettings,
	): ReminderIntent | null {
		const margin = Number(settings.pointsMargin ?? 50);

		const nextReward = context.rewards
			.filter((reward) => reward.pointsRequired > client.availablePoints)
			.sort((a, b) => a.pointsRequired - b.pointsRequired)[0];

		if (!nextReward) {
			return null;
		}

		const missing = nextReward.pointsRequired - client.availablePoints;

		if (missing > margin) {
			return null;
		}

		return {
			title: "Estás cerca de tu premio",
			body: `${client.name}, te ${missing === 1 ? "falta" : "faltan"} ${missing} ${missing === 1 ? "punto" : "puntos"} para ${nextReward.name}.`,
			data: { url: "/rewards", ruleKey: this.key },
		};
	},
};
