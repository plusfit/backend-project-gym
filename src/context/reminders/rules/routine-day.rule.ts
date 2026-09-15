import { resolveTodaySubRoutine } from "@/src/context/routines/today-sub-routine.resolver";

import {
	ClientContext,
	ReminderIntent,
	ReminderRule,
	RuleContext,
	RuleSettings,
} from "./reminder-rule";

/**
 * "Today is leg day."
 *
 * The workout is derived from the client's schedules and their routine order,
 * so a client with no routine, no schedules, or a rest day today simply gets
 * nothing. Silence is the correct output far more often than a message is.
 */
export const routineDayRule: ReminderRule = {
	key: "routineDay",
	label: "Día de entrenamiento",
	description:
		"Avisa al cliente qué subrutina le toca hoy, según los días que asiste y el orden de su rutina.",
	params: [],
	requires: ["subRoutines"],
	defaultSettings: { enabled: false, sendHour: 9 },

	evaluate(
		client: ClientContext,
		context: RuleContext,
		_settings: RuleSettings,
	): ReminderIntent | null {
		const today = resolveTodaySubRoutine({
			attendedDays: client.attendedDays,
			subRoutineIds: client.subRoutineIds,
			today: context.today,
		});

		if (!today) {
			return null;
		}

		const subRoutine = context.subRoutines.get(today.subRoutineId);

		// A routine pointing at a subroutine that no longer exists is a data
		// problem, not a reason to send a reminder with a blank workout.
		if (!subRoutine) {
			return null;
		}

		return {
			title: `Hoy toca ${subRoutine.category}`,
			body: `${client.name}, tu rutina de hoy es ${subRoutine.name}. Te esperamos.`,
			data: { url: "/routine", ruleKey: this.key },
		};
	},
};
