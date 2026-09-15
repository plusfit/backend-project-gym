import { describe, expect, it } from "vitest";

import { REMINDER_RULE_KEYS } from "@/src/context/reminders/rule-keys";
import { paymentDueRule } from "@/src/context/reminders/rules/payment-due.rule";
import { pointsNearRewardRule } from "@/src/context/reminders/rules/points-near-reward.rule";
import {
	ClientContext,
	RuleContext,
} from "@/src/context/reminders/rules/reminder-rule";
import { REMINDER_RULES } from "@/src/context/reminders/rules/registry";
import { routineDayRule } from "@/src/context/reminders/rules/routine-day.rule";

/**
 * Rules are pure decisions: given a client and today's shared context, either
 * say something or stay quiet. Boundaries matter most, because a threshold that
 * is off by one either spams people daily or never fires at all.
 */
const MONDAY = new Date(2026, 8, 14);

const baseClient = (overrides: Partial<ClientContext> = {}): ClientContext => ({
	id: "client-1",
	name: "Ana",
	availableDays: 30,
	availablePoints: 0,
	subRoutineIds: [],
	attendedDays: [],
	tokens: ["token-1"],
	preferences: { routineDay: true, paymentDue: true, pointsNearReward: true },
	...overrides,
});

const baseContext = (overrides: Partial<RuleContext> = {}): RuleContext => ({
	today: MONDAY,
	subRoutines: new Map(),
	rewards: [],
	...overrides,
});

describe("REMINDER_RULES registry", () => {
	it("registers exactly the declared rule keys", () => {
		expect(REMINDER_RULES.map((rule) => rule.key).sort()).toEqual(
			[...REMINDER_RULE_KEYS].sort(),
		);
	});

	it("ships every rule disabled so nothing fires on deploy", () => {
		expect(REMINDER_RULES.every((rule) => rule.defaultSettings.enabled === false)).toBe(true);
	});

	it("gives every rule a label and description for the catalog", () => {
		for (const rule of REMINDER_RULES) {
			expect(rule.label.length).toBeGreaterThan(0);
			expect(rule.description.length).toBeGreaterThan(0);
		}
	});
});

describe("routineDayRule", () => {
	const settings = { enabled: true, sendHour: 9 };

	const client = baseClient({
		subRoutineIds: ["sub-a", "sub-b"],
		attendedDays: ["Lunes", "Miércoles"],
	});

	const context = baseContext({
		subRoutines: new Map([
			["sub-a", { name: "Tren inferior", category: "Piernas" }],
			["sub-b", { name: "Tren superior", category: "Espalda" }],
		]),
	});

	it("names today's muscle group", () => {
		const intent = routineDayRule.evaluate(client, context, settings);

		expect(intent?.title).toContain("Piernas");
		expect(intent?.body).toContain("Tren inferior");
		expect(intent?.data?.url).toBe("/routine");
	});

	it("stays quiet on a rest day", () => {
		const wednesdayOff = baseClient({ ...client, attendedDays: ["Martes"] });

		expect(routineDayRule.evaluate(wednesdayOff, context, settings)).toBeNull();
	});

	it("stays quiet when the client has no routine", () => {
		expect(
			routineDayRule.evaluate(baseClient({ ...client, subRoutineIds: [] }), context, settings),
		).toBeNull();
	});

	it("stays quiet when the subroutine is missing from the context", () => {
		expect(routineDayRule.evaluate(client, baseContext(), settings)).toBeNull();
	});
});

describe("paymentDueRule", () => {
	const settings = { enabled: true, sendHour: 10, daysThreshold: 3 };

	it("fires exactly at the threshold", () => {
		const intent = paymentDueRule.evaluate(
			baseClient({ availableDays: 3 }),
			baseContext(),
			settings,
		);

		expect(intent?.body).toContain("3");
		expect(intent?.data?.url).toBe("/plans");
	});

	it("fires below the threshold", () => {
		expect(
			paymentDueRule.evaluate(baseClient({ availableDays: 1 }), baseContext(), settings),
		).not.toBeNull();
	});

	it("stays quiet above the threshold", () => {
		expect(
			paymentDueRule.evaluate(baseClient({ availableDays: 4 }), baseContext(), settings),
		).toBeNull();
	});

	it("stays quiet once the plan is already exhausted", () => {
		// Zero days is no longer a reminder, it is a lapsed membership.
		expect(
			paymentDueRule.evaluate(baseClient({ availableDays: 0 }), baseContext(), settings),
		).toBeNull();
	});

	it("uses the singular for the last day", () => {
		const intent = paymentDueRule.evaluate(
			baseClient({ availableDays: 1 }),
			baseContext(),
			settings,
		);

		expect(intent?.body).toContain("1 día");
		expect(intent?.body).not.toContain("días");
	});
});

describe("pointsNearRewardRule", () => {
	const settings = { enabled: true, sendHour: 11, pointsMargin: 50 };

	const context = baseContext({
		rewards: [
			{ name: "Batido gratis", pointsRequired: 100 },
			{ name: "Remera", pointsRequired: 300 },
		],
	});

	it("names the closest reward still out of reach", () => {
		const intent = pointsNearRewardRule.evaluate(
			baseClient({ availablePoints: 60 }),
			context,
			settings,
		);

		expect(intent?.body).toContain("40");
		expect(intent?.body).toContain("Batido gratis");
		expect(intent?.data?.url).toBe("/rewards");
	});

	it("fires exactly at the margin", () => {
		expect(
			pointsNearRewardRule.evaluate(baseClient({ availablePoints: 50 }), context, settings),
		).not.toBeNull();
	});

	it("stays quiet when every reward is still far away", () => {
		expect(
			pointsNearRewardRule.evaluate(baseClient({ availablePoints: 49 }), context, settings),
		).toBeNull();
	});

	it("skips rewards the client can already claim", () => {
		// With 120 points the shake is affordable; the shirt is the next target.
		const intent = pointsNearRewardRule.evaluate(
			baseClient({ availablePoints: 280 }),
			context,
			settings,
		);

		expect(intent?.body).toContain("Remera");
	});

	it("stays quiet when there are no rewards configured", () => {
		expect(
			pointsNearRewardRule.evaluate(baseClient({ availablePoints: 90 }), baseContext(), settings),
		).toBeNull();
	});
});
