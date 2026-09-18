/**
 * Which subroutine a client trains today.
 *
 * The gym does not store a day-to-subroutine map. What it stores is (a) the
 * days a client enrolled in, as schedules, and (b) the ordered subroutines of
 * their routine. The rule the team has always worked by is that the order maps
 * onto the attended days in sequence: a client who comes Tuesday, Wednesday and
 * Thursday does subroutine A, B and C on those days.
 *
 * This resolver is the first place that rule exists in code. It is pure so the
 * reminder cron and, later, the client app's home screen can share it without
 * either owning it.
 */

/** Monday-first because that is how a training week is planned. */
const WEEKDAYS_FROM_SUNDAY = [
	"domingo",
	"lunes",
	"martes",
	"miercoles",
	"jueves",
	"viernes",
	"sabado",
] as const;

/** Lowercases and strips diacritics so "Miércoles" and "miercoles" both match. */
const normalize = (value: string): string =>
	value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.trim()
		.toLowerCase();

/**
 * Turns a Spanish day name into a JavaScript weekday (0 = Sunday).
 * Returns null for anything unrecognized rather than guessing.
 */
export function weekdayFromSpanishName(name: string): number | null {
	if (!name) return null;

	const index = WEEKDAYS_FROM_SUNDAY.indexOf(
		normalize(name) as (typeof WEEKDAYS_FROM_SUNDAY)[number],
	);

	return index === -1 ? null : index;
}

/** Monday = 0 … Sunday = 6, so a week is ordered the way a gym plans one. */
const mondayFirst = (weekday: number): number => (weekday + 6) % 7;

export interface TodaySubRoutineInput {
	/** Spanish day names taken from the client's schedules. */
	attendedDays: string[];
	/** The routine's subroutine ids, in the order the admin arranged them. */
	subRoutineIds: string[];
	/** Today, already expressed in the gym's timezone. */
	today: Date;
}

export interface TodaySubRoutine {
	subRoutineId: string;
	/** Which training day of the week this is, counted from the first. */
	position: number;
}

export function resolveTodaySubRoutine({
	attendedDays,
	subRoutineIds,
	today,
}: TodaySubRoutineInput): TodaySubRoutine | null {
	if (!subRoutineIds?.length || !attendedDays?.length) {
		return null;
	}

	// Unreadable names are dropped, not defaulted: a wrong weekday would shift
	// every later day and silently tell people the wrong workout.
	const orderedDays = [
		...new Set(
			attendedDays
				.map(weekdayFromSpanishName)
				.filter((weekday): weekday is number => weekday !== null),
		),
	].sort((a, b) => mondayFirst(a) - mondayFirst(b));

	const position = orderedDays.indexOf(today.getDay());

	if (position === -1) {
		return null;
	}

	// More training days than subroutines means the routine repeats.
	return {
		subRoutineId: subRoutineIds[position % subRoutineIds.length],
		position,
	};
}
