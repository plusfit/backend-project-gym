import { NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PushTokensService } from "@/src/context/clients/services/push-tokens.service";

/**
 * Device tokens are per-device, not per-person: the same phone can be handed to
 * another account, and the same person can carry several devices. Registration
 * therefore has to move a token rather than duplicate it.
 */
describe("PushTokensService", () => {
	const CLIENT_ID = "6a7750c1b72fe93a346d1675";
	const OTHER_ID = "6a7750c1b72fe93a346d9999";
	const TOKEN = "fGx9_kQ2:APA91bH-device-token";

	let clientModel: any;
	let service: PushTokensService;

	const clientDoc = (overrides: Record<string, unknown> = {}) => ({
		_id: CLIENT_ID,
		notificationPreferences: {},
		pushTokens: [],
		...overrides,
	});

	beforeEach(() => {
		clientModel = {
			updateMany: vi.fn().mockResolvedValue({ modifiedCount: 0 }),
			updateOne: vi.fn().mockResolvedValue({ matchedCount: 0 }),
			findById: vi.fn().mockReturnValue({
				lean: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(clientDoc()) }),
			}),
		};
		service = new PushTokensService(clientModel);
	});

	describe("registerToken", () => {
		it("detaches the token from any other client first", async () => {
			await service.registerToken(CLIENT_ID, TOKEN);

			expect(clientModel.updateMany).toHaveBeenCalledWith(
				{ _id: { $ne: CLIENT_ID }, "pushTokens.token": TOKEN },
				{ $pull: { pushTokens: { token: TOKEN } } },
			);
		});

		it("adds the token when the client does not have it yet", async () => {
			clientModel.updateOne.mockResolvedValue({ matchedCount: 0 });

			await service.registerToken(CLIENT_ID, TOKEN, "Chrome/Android");

			const push = clientModel.updateOne.mock.calls.at(-1);
			expect(push[0]).toEqual({ _id: CLIENT_ID });
			expect(push[1].$push.pushTokens).toMatchObject({
				token: TOKEN,
				userAgent: "Chrome/Android",
			});
			expect(push[1].$push.pushTokens.createdAt).toBeInstanceOf(Date);
			expect(push[1].$push.pushTokens.lastSeenAt).toBeInstanceOf(Date);
		});

		it("refreshes lastSeenAt instead of duplicating an existing token", async () => {
			clientModel.updateOne.mockResolvedValue({ matchedCount: 1 });

			await service.registerToken(CLIENT_ID, TOKEN);

			expect(clientModel.updateOne).toHaveBeenCalledTimes(1);
			const [filter, update] = clientModel.updateOne.mock.calls[0];
			expect(filter).toEqual({ _id: CLIENT_ID, "pushTokens.token": TOKEN });
			expect(update.$set["pushTokens.$.lastSeenAt"]).toBeInstanceOf(Date);
		});

		it("rejects a blank token", async () => {
			await expect(service.registerToken(CLIENT_ID, "   ")).rejects.toThrow();
			expect(clientModel.updateMany).not.toHaveBeenCalled();
		});
	});

	describe("removeToken", () => {
		it("pulls the token from the client", async () => {
			await service.removeToken(CLIENT_ID, TOKEN);

			expect(clientModel.updateOne).toHaveBeenCalledWith(
				{ _id: CLIENT_ID },
				{ $pull: { pushTokens: { token: TOKEN } } },
			);
		});
	});

	describe("getPreferences", () => {
		it("treats a rule with no stored value as enabled", async () => {
			const prefs = await service.getPreferences(CLIENT_ID);

			expect(prefs).toEqual({
				routineDay: true,
				paymentDue: true,
				pointsNearReward: true,
			});
		});

		it("reports an explicit opt-out", async () => {
			clientModel.findById.mockReturnValue({
				lean: vi.fn().mockReturnValue({
					exec: vi
						.fn()
						.mockResolvedValue(clientDoc({ notificationPreferences: { paymentDue: false } })),
				}),
			});

			expect(await service.getPreferences(CLIENT_ID)).toMatchObject({
				paymentDue: false,
				routineDay: true,
			});
		});

		it("fails for an unknown client", async () => {
			clientModel.findById.mockReturnValue({
				lean: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(null) }),
			});

			await expect(service.getPreferences(OTHER_ID)).rejects.toThrow(NotFoundException);
		});
	});

	describe("updatePreferences", () => {
		it("stores only the rules it was given", async () => {
			await service.updatePreferences(CLIENT_ID, { paymentDue: false });

			expect(clientModel.updateOne).toHaveBeenCalledWith(
				{ _id: CLIENT_ID },
				{ $set: { "notificationPreferences.paymentDue": false } },
			);
		});

		it("rejects a rule key that does not exist", async () => {
			await expect(
				service.updatePreferences(CLIENT_ID, { notARule: false } as never),
			).rejects.toThrow(/notARule/);

			expect(clientModel.updateOne).not.toHaveBeenCalled();
		});

		it("returns the effective preferences after the update", async () => {
			clientModel.findById.mockReturnValue({
				lean: vi.fn().mockReturnValue({
					exec: vi
						.fn()
						.mockResolvedValue(clientDoc({ notificationPreferences: { routineDay: false } })),
				}),
			});

			expect(await service.updatePreferences(CLIENT_ID, { routineDay: false })).toMatchObject({
				routineDay: false,
				paymentDue: true,
			});
		});
	});
});
