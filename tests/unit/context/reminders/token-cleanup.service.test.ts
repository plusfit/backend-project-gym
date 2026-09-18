import { beforeEach, describe, expect, it, vi } from "vitest";

import { TokenCleanupService } from "@/src/context/reminders/token-cleanup.service";

/**
 * Only a permanently rejected token may be deleted. Removing one on a
 * transient provider error would silently unsubscribe a working device, and the
 * client would never know why the reminders stopped.
 */
describe("TokenCleanupService", () => {
	const NOW = new Date(2026, 8, 14, 12, 0, 0);

	let clientModel: any;
	let dispatchModel: any;
	let notificationsService: any;
	let service: TokenCleanupService;

	const dispatches = (rows: unknown[]) => {
		dispatchModel.find.mockReturnValue({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(rows) }),
			}),
		});
	};

	beforeEach(() => {
		clientModel = { updateMany: vi.fn().mockResolvedValue({ modifiedCount: 1 }) };
		dispatchModel = { find: vi.fn(), updateMany: vi.fn().mockResolvedValue({}) };
		notificationsService = { getBatchFailures: vi.fn().mockResolvedValue([]) };
		dispatches([{ batchId: "batch-1" }]);
		service = new TokenCleanupService(clientModel, dispatchModel, notificationsService);
	});

	it("does nothing when there are no batches to check", async () => {
		dispatches([]);

		expect(await service.pruneDeadTokens(NOW)).toBe(0);
		expect(notificationsService.getBatchFailures).not.toHaveBeenCalled();
	});

	it("removes tokens the provider reported as unregistered", async () => {
		notificationsService.getBatchFailures.mockResolvedValue([
			{ to: "dead-1", failureCode: "UNREGISTERED" },
			{ to: "dead-2", failureCode: "UNREGISTERED" },
		]);

		expect(await service.pruneDeadTokens(NOW)).toBe(2);
		expect(clientModel.updateMany).toHaveBeenCalledWith(
			{ "pushTokens.token": { $in: ["dead-1", "dead-2"] } },
			{ $pull: { pushTokens: { token: { $in: ["dead-1", "dead-2"] } } } },
		);
	});

	it("keeps tokens that failed for a transient reason", async () => {
		notificationsService.getBatchFailures.mockResolvedValue([
			{ to: "flaky", failureCode: "TRANSIENT" },
			{ to: "bad-payload", failureCode: "INVALID_ARGUMENT" },
			{ to: "unknown", failureCode: undefined },
		]);

		expect(await service.pruneDeadTokens(NOW)).toBe(0);
		expect(clientModel.updateMany).not.toHaveBeenCalled();
	});

	it("marks a batch as checked so it is not read again", async () => {
		await service.pruneDeadTokens(NOW);

		expect(dispatchModel.updateMany).toHaveBeenCalledWith(
			{ batchId: "batch-1" },
			{ $set: { failuresCheckedAt: NOW } },
		);
	});

	it("leaves a batch unchecked when it could not be read", async () => {
		notificationsService.getBatchFailures.mockRejectedValue(new Error("service down"));

		expect(await service.pruneDeadTokens(NOW)).toBe(0);
		expect(dispatchModel.updateMany).not.toHaveBeenCalled();
	});

	it("only looks at sent batches old enough to have drained", async () => {
		await service.pruneDeadTokens(NOW);

		const [filter] = dispatchModel.find.mock.calls[0];
		expect(filter.status).toBe("sent");
		expect(filter.failuresCheckedAt).toEqual({ $exists: false });
		expect(filter.createdAt.$lte.getTime()).toBe(NOW.getTime() - 5 * 60 * 1000);
	});

	it("reads each batch once even when many dispatches share it", async () => {
		dispatches([{ batchId: "batch-1" }, { batchId: "batch-1" }, { batchId: "batch-2" }]);

		await service.pruneDeadTokens(NOW);

		expect(notificationsService.getBatchFailures).toHaveBeenCalledTimes(2);
	});
});
