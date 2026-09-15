import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReminderSettingsService } from "@/src/context/reminders/reminder-settings.service";

/**
 * Settings are the admin's kill switch. They must survive a rule being added
 * later, and a partial save must never silently reset another rule.
 */
describe("ReminderSettingsService", () => {
	let settingsModel: any;
	let service: ReminderSettingsService;

	const storedRules = (rules: Record<string, unknown> | undefined) => {
		settingsModel.findOne.mockReturnValue({
			lean: vi.fn().mockReturnValue({
				exec: vi.fn().mockResolvedValue(rules ? { rules } : null),
			}),
		});
	};

	beforeEach(() => {
		settingsModel = {
			findOne: vi.fn(),
			updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
		};
		storedRules(undefined);
		service = new ReminderSettingsService(settingsModel);
	});

	describe("getSettings", () => {
		it("returns every rule disabled when nothing was ever saved", async () => {
			const settings = await service.getSettings();

			expect(Object.keys(settings).sort()).toEqual(
				["paymentDue", "pointsNearReward", "routineDay"].sort(),
			);
			expect(Object.values(settings).every((rule) => rule.enabled === false)).toBe(true);
		});

		it("keeps a rule's default threshold when only enabled was saved", async () => {
			storedRules({ paymentDue: { enabled: true } });

			const settings = await service.getSettings();

			expect(settings.paymentDue.enabled).toBe(true);
			expect(settings.paymentDue.daysThreshold).toBe(3);
		});

		it("resolves a rule that the stored document never heard of", async () => {
			storedRules({ paymentDue: { enabled: true } });

			expect((await service.getSettings()).pointsNearReward.enabled).toBe(false);
		});
	});

	describe("updateSettings", () => {
		it("persists the merged map", async () => {
			await service.updateSettings({ paymentDue: { enabled: true, daysThreshold: 5 } });

			const [, update, options] = settingsModel.updateOne.mock.calls[0];
			expect(update.$set.rules.paymentDue).toMatchObject({
				enabled: true,
				daysThreshold: 5,
			});
			expect(options).toEqual({ upsert: true });
		});

		it("leaves other rules untouched", async () => {
			storedRules({ routineDay: { enabled: true, sendHour: 7 } });

			await service.updateSettings({ paymentDue: { enabled: true } });

			const [, update] = settingsModel.updateOne.mock.calls[0];
			expect(update.$set.rules.routineDay).toMatchObject({ enabled: true, sendHour: 7 });
		});

		it("rejects an unknown rule", async () => {
			await expect(service.updateSettings({ notARule: { enabled: true } })).rejects.toThrow(
				BadRequestException,
			);
			expect(settingsModel.updateOne).not.toHaveBeenCalled();
		});

		it.each([-1, 24, 9.5])("rejects sendHour %s", async (sendHour) => {
			await expect(
				service.updateSettings({ routineDay: { sendHour } as never }),
			).rejects.toThrow(BadRequestException);
		});

		it("accepts the boundary hours", async () => {
			await expect(
				service.updateSettings({ routineDay: { sendHour: 0 } as never }),
			).resolves.toBeDefined();
			await expect(
				service.updateSettings({ routineDay: { sendHour: 23 } as never }),
			).resolves.toBeDefined();
		});

		it("rejects a threshold outside the rule's declared range", async () => {
			await expect(
				service.updateSettings({ paymentDue: { daysThreshold: 0 } as never }),
			).rejects.toThrow(BadRequestException);
			await expect(
				service.updateSettings({ paymentDue: { daysThreshold: 31 } as never }),
			).rejects.toThrow(BadRequestException);
		});
	});
});
