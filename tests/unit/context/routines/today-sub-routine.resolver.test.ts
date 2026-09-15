import { describe, expect, it } from "vitest";

import {
	resolveTodaySubRoutine,
	weekdayFromSpanishName,
} from "@/src/context/routines/today-sub-routine.resolver";

/**
 * "Today is leg day" is derived, not stored: the days a client attends come
 * from their schedules, and the routine's subroutine order maps onto those days
 * in sequence. This is the only new domain rule in the reminder feature, so it
 * is kept pure and covered hard.
 */
describe("weekdayFromSpanishName", () => {
	it.each([
		["Domingo", 0],
		["Lunes", 1],
		["Martes", 2],
		["Miércoles", 3],
		["Jueves", 4],
		["Viernes", 5],
		["Sábado", 6],
	])("maps %s to %i", (name, expected) => {
		expect(weekdayFromSpanishName(name)).toBe(expected);
	});

	it.each(["Miercoles", "miercoles", "MIÉRCOLES", "  miércoles  "])(
		"tolerates the accent and casing variant %s",
		(name) => {
			expect(weekdayFromSpanishName(name)).toBe(3);
		},
	);

	it.each(["Sabado", "sábado", "SABADO"])("tolerates %s", (name) => {
		expect(weekdayFromSpanishName(name)).toBe(6);
	});

	it.each(["", "Funday", "Monday", undefined as unknown as string])(
		"returns null for an unusable name %s",
		(name) => {
			expect(weekdayFromSpanishName(name)).toBeNull();
		},
	);
});

describe("resolveTodaySubRoutine", () => {
	// 2026-09-14 is a Monday, so the week that follows is easy to reason about.
	const MONDAY = new Date(2026, 8, 14);
	const TUESDAY = new Date(2026, 8, 15);
	const WEDNESDAY = new Date(2026, 8, 16);
	const THURSDAY = new Date(2026, 8, 17);
	const FRIDAY = new Date(2026, 8, 18);
	const SUNDAY = new Date(2026, 8, 20);

	const ABC = ["sub-a", "sub-b", "sub-c"];

	const resolve = (attendedDays: string[], subRoutineIds: string[], today: Date) =>
		resolveTodaySubRoutine({ attendedDays, subRoutineIds, today });

	it("maps the subroutine order onto the attended days in sequence", () => {
		const days = ["Martes", "Miércoles", "Jueves"];

		expect(resolve(days, ABC, TUESDAY)).toEqual({ subRoutineId: "sub-a", position: 0 });
		expect(resolve(days, ABC, WEDNESDAY)).toEqual({ subRoutineId: "sub-b", position: 1 });
		expect(resolve(days, ABC, THURSDAY)).toEqual({ subRoutineId: "sub-c", position: 2 });
	});

	it("orders the week from Monday, not from Sunday", () => {
		// Sunday is the LAST training day of the week, not the first.
		const days = ["Domingo", "Lunes"];

		expect(resolve(days, ABC, MONDAY)).toEqual({ subRoutineId: "sub-a", position: 0 });
		expect(resolve(days, ABC, SUNDAY)).toEqual({ subRoutineId: "sub-b", position: 1 });
	});

	it("ignores the order the days arrive in", () => {
		const scrambled = ["Jueves", "Martes", "Miércoles"];

		expect(resolve(scrambled, ABC, TUESDAY)).toEqual({ subRoutineId: "sub-a", position: 0 });
	});

	it("returns null on a rest day", () => {
		expect(resolve(["Martes", "Jueves"], ABC, WEDNESDAY)).toBeNull();
	});

	it("cycles when the client attends more days than the routine has subroutines", () => {
		const days = ["Lunes", "Martes", "Miércoles", "Jueves"];
		const twoSubs = ["sub-a", "sub-b"];

		expect(resolve(days, twoSubs, MONDAY)).toEqual({ subRoutineId: "sub-a", position: 0 });
		expect(resolve(days, twoSubs, TUESDAY)).toEqual({ subRoutineId: "sub-b", position: 1 });
		expect(resolve(days, twoSubs, WEDNESDAY)).toEqual({ subRoutineId: "sub-a", position: 2 });
		expect(resolve(days, twoSubs, THURSDAY)).toEqual({ subRoutineId: "sub-b", position: 3 });
	});

	it("leaves the trailing subroutines unused when the client attends fewer days", () => {
		const days = ["Lunes", "Martes"];

		expect(resolve(days, ABC, MONDAY)).toEqual({ subRoutineId: "sub-a", position: 0 });
		expect(resolve(days, ABC, TUESDAY)).toEqual({ subRoutineId: "sub-b", position: 1 });
		expect(resolve(days, ABC, FRIDAY)).toBeNull();
	});

	it("returns null when the client has no schedules", () => {
		expect(resolve([], ABC, MONDAY)).toBeNull();
	});

	it("returns null when the routine has no subroutines", () => {
		expect(resolve(["Lunes"], [], MONDAY)).toBeNull();
	});

	it("skips day names it cannot understand instead of shifting the sequence", () => {
		const days = ["Lunes", "Funday", "Martes"];

		expect(resolve(days, ABC, MONDAY)).toEqual({ subRoutineId: "sub-a", position: 0 });
		expect(resolve(days, ABC, TUESDAY)).toEqual({ subRoutineId: "sub-b", position: 1 });
	});

	it("counts a duplicated day only once", () => {
		const days = ["Lunes", "lunes", "Martes"];

		expect(resolve(days, ABC, TUESDAY)).toEqual({ subRoutineId: "sub-b", position: 1 });
	});
});
