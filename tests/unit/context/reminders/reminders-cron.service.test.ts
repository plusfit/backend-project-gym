import { beforeEach, describe, expect, it, vi } from "vitest";

import { RemindersCronService } from "@/src/context/reminders/reminders-cron.service";

/**
 * The cron is where idempotency lives. Running it twice in the same day must
 * produce one notification per client per rule, and a failed send must release
 * its claim so the next tick can retry instead of losing the day.
 */
describe("RemindersCronService", () => {
	// 10:00 on a Monday.
	const NOW = new Date(2026, 8, 14, 10, 0, 0);

	const CLIENT = {
		_id: "client-1",
		userInfo: { name: "Ana" },
		email: "ana@example.com",
		availableDays: 2,
		availablePoints: 0,
		pushTokens: [{ token: "token-a" }, { token: "token-b" }],
		notificationPreferences: {},
		routineId: undefined,
	};

	let clientModel: any;
	let scheduleModel: any;
	let routineModel: any;
	let subRoutineModel: any;
	let rewardModel: any;
	let dispatchModel: any;
	let settingsService: any;
	let notificationsService: any;
	let service: RemindersCronService;

	const chain = (result: unknown) => ({
		find: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(result) }),
			}),
			lean: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(result) }),
		}),
	});

	const settingsWith = (overrides: Record<string, unknown>) => ({
		routineDay: { enabled: false, sendHour: 9 },
		paymentDue: { enabled: false, sendHour: 10, daysThreshold: 3 },
		pointsNearReward: { enabled: false, sendHour: 11, pointsMargin: 50 },
		...overrides,
	});

	beforeEach(() => {
		clientModel = chain([CLIENT]);
		scheduleModel = chain([]);
		routineModel = chain([]);
		subRoutineModel = chain([]);
		rewardModel = chain([]);
		dispatchModel = {
			create: vi.fn().mockResolvedValue({}),
			updateMany: vi.fn().mockResolvedValue({}),
			deleteMany: vi.fn().mockResolvedValue({}),
		};
		settingsService = {
			getSettings: vi
				.fn()
				.mockResolvedValue(settingsWith({ paymentDue: { enabled: true, sendHour: 10, daysThreshold: 3 } })),
		};
		notificationsService = {
			bulkPush: vi.fn().mockResolvedValue({ batchId: "batch-1", total: 2 }),
		};

		service = new RemindersCronService(
			clientModel,
			scheduleModel,
			routineModel,
			subRoutineModel,
			rewardModel,
			dispatchModel,
			settingsService,
			notificationsService,
		);
	});

	it("runs nothing when no rule is scheduled for this hour", async () => {
		settingsService.getSettings.mockResolvedValue(
			settingsWith({ paymentDue: { enabled: true, sendHour: 7, daysThreshold: 3 } }),
		);

		expect(await service.runDueRules(NOW)).toEqual([]);
		expect(notificationsService.bulkPush).not.toHaveBeenCalled();
	});

	it("runs nothing when the due rule is disabled", async () => {
		settingsService.getSettings.mockResolvedValue(settingsWith({}));

		expect(await service.runDueRules(NOW)).toEqual([]);
		expect(notificationsService.bulkPush).not.toHaveBeenCalled();
	});

	it("sends one notification per device token of the client", async () => {
		await service.runDueRules(NOW);

		const [items] = notificationsService.bulkPush.mock.calls[0];
		expect(items).toHaveLength(2);
		expect(items.map((i: any) => i.to)).toEqual(["token-a", "token-b"]);
		expect(items[0].title).toBe("Tu plan está por vencer");
		expect(items[0].data.url).toBe("/plans");
	});

	it("claims the dispatch before sending", async () => {
		await service.runDueRules(NOW);

		expect(dispatchModel.create).toHaveBeenCalledWith({
			clientId: "client-1",
			ruleKey: "paymentDue",
			dateKey: "2026-09-14",
			status: "pending",
		});

		const claimOrder = dispatchModel.create.mock.invocationCallOrder[0];
		const sendOrder = notificationsService.bulkPush.mock.invocationCallOrder[0];
		expect(claimOrder).toBeLessThan(sendOrder);
	});

	it("marks the dispatch sent with the batch id", async () => {
		await service.runDueRules(NOW);

		expect(dispatchModel.updateMany).toHaveBeenCalledWith(
			{ clientId: { $in: ["client-1"] }, ruleKey: "paymentDue", dateKey: "2026-09-14" },
			{ $set: { status: "sent", batchId: "batch-1" } },
		);
	});

	it("does not send twice when the claim is already taken", async () => {
		dispatchModel.create.mockRejectedValue(Object.assign(new Error("dup"), { code: 11000 }));

		const [summary] = await service.runDueRules(NOW);

		expect(notificationsService.bulkPush).not.toHaveBeenCalled();
		expect(summary.skipped).toBe(1);
	});

	it("releases the claim when the send fails, so the next tick can retry", async () => {
		notificationsService.bulkPush.mockRejectedValue(new Error("service down"));

		const [summary] = await service.runDueRules(NOW);

		expect(dispatchModel.deleteMany).toHaveBeenCalledWith({
			clientId: { $in: ["client-1"] },
			ruleKey: "paymentDue",
			dateKey: "2026-09-14",
			status: "pending",
		});
		expect(summary.failed).toBe(1);
		expect(summary.sent).toBe(0);
	});

	it("skips a client who opted out of that rule", async () => {
		clientModel.find.mockReturnValue({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockReturnValue({
					exec: vi
						.fn()
						.mockResolvedValue([{ ...CLIENT, notificationPreferences: { paymentDue: false } }]),
				}),
			}),
		});

		const [summary] = await service.runDueRules(NOW);

		expect(notificationsService.bulkPush).not.toHaveBeenCalled();
		expect(summary.skipped).toBe(1);
		expect(summary.evaluated).toBe(0);
	});

	it("skips a client the rule has nothing to say to", async () => {
		clientModel.find.mockReturnValue({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockReturnValue({
					exec: vi.fn().mockResolvedValue([{ ...CLIENT, availableDays: 30 }]),
				}),
			}),
		});

		const [summary] = await service.runDueRules(NOW);

		expect(notificationsService.bulkPush).not.toHaveBeenCalled();
		expect(summary.evaluated).toBe(1);
		expect(summary.skipped).toBe(1);
	});

	it("only queries clients that have at least one device token", async () => {
		await service.runDueRules(NOW);

		expect(clientModel.find).toHaveBeenCalledWith({
			disabled: { $ne: true },
			"pushTokens.0": { $exists: true },
		});
	});

	it("keeps other rules running when one of them throws", async () => {
		settingsService.getSettings.mockResolvedValue(
			settingsWith({
				paymentDue: { enabled: true, sendHour: 10, daysThreshold: 3 },
				pointsNearReward: { enabled: true, sendHour: 10, pointsMargin: 50 },
			}),
		);
		// Rewards blow up, so pointsNearReward cannot be evaluated.
		rewardModel.find.mockImplementation(() => {
			throw new Error("rewards unavailable");
		});

		const summaries = await service.runDueRules(NOW);

		const paymentDue = summaries.find((s) => s.ruleKey === "paymentDue");
		const pointsNearReward = summaries.find((s) => s.ruleKey === "pointsNearReward");

		// The rule that needs rewards is reported as failed, not as "nothing to say".
		expect(pointsNearReward?.failed).toBe(1);
		expect(pointsNearReward?.sent).toBe(0);
		// The rule that does not need them still delivers.
		expect(paymentDue?.sent).toBe(1);
		expect(notificationsService.bulkPush).toHaveBeenCalledTimes(1);
	});
});
