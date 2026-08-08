import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationsService } from "../../../../src/context/notifications/notifications.service";

vi.mock("axios");

/**
 * testSend backs the "Probame a mí primero" button: it ships the exact body a
 * client would receive, but to the admin's own phone, through the individual
 * send endpoint of the notifications service. It exists so a typo is caught on
 * one handset instead of on three hundred.
 */
describe("NotificationsService.testSend", () => {
    const SERVICE_URL = "http://localhost:3000";
    const API_KEY = "pf_test_key";
    const SEND_URL = `${SERVICE_URL}/notifications/send`;

    function createService(configured = true) {
        const configService = {
            get: vi.fn().mockImplementation((key: string) => {
                if (!configured) return undefined;
                if (key === "NOTIFICATIONS_SERVICE_URL") return SERVICE_URL;
                if (key === "NOTIFICATIONS_SERVICE_API_KEY") return API_KEY;
                return undefined;
            }),
        };

        return new NotificationsService({} as never, configService as never, {} as never);
    }

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("posts a whatsapp send with the normalized phone and message", async () => {
        vi.mocked(axios.post).mockResolvedValue({
            data: { jobId: "job-1", status: "queued", scheduledFor: "2026-08-08T16:00:00Z" },
        });
        const service = createService();

        const result = await service.testSend({
            phone: "099 123 456",
            message: "Hola Ana\r\n-Corremos el sabado",
        });

        expect(axios.post).toHaveBeenCalledWith(
            SEND_URL,
            {
                channel: "whatsapp",
                to: "+59899123456",
                message: "Hola Ana\n- Corremos el sabado",
            },
            expect.objectContaining({ headers: { "X-Api-Key": API_KEY } }),
        );
        expect(result).toEqual({
            jobId: "job-1",
            status: "queued",
            scheduledFor: "2026-08-08T16:00:00Z",
        });
    });

    it("rejects an unusable phone before any request leaves", async () => {
        const service = createService();

        await expect(
            service.testSend({ phone: "12", message: "Hola" }),
        ).rejects.toThrow(/phone/i);

        expect(axios.post).not.toHaveBeenCalled();
    });

    it("surfaces the reason the notifications service gave", async () => {
        vi.mocked(axios.post).mockRejectedValue({
            message: "Request failed with status code 401",
            response: { status: 401, data: { message: "Insufficient scopes" } },
        });
        const service = createService();

        await expect(
            service.testSend({ phone: "099123456", message: "Hola" }),
        ).rejects.toThrow("Insufficient scopes");
    });

    it("fails loudly when the notifications service is not configured", async () => {
        const service = createService(false);

        await expect(
            service.testSend({ phone: "099123456", message: "Hola" }),
        ).rejects.toThrow(/not configured/i);

        expect(axios.post).not.toHaveBeenCalled();
    });
});
