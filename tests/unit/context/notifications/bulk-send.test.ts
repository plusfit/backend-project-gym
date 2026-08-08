import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationsService } from "../../../../src/context/notifications/notifications.service";

vi.mock("axios");

/**
 * bulkSend replaces the CSV download/upload round trip. The dashboard sends the
 * client ids it selected; this service owns turning those into E.164 phones,
 * reporting who could not be reached, and proxying JSON to the notifications
 * service. No file is written, uploaded or parsed anywhere in the flow.
 */
describe("NotificationsService.bulkSend", () => {
  const SERVICE_URL = "http://localhost:3000";
  const API_KEY = "pf_test_key";
  const BULK_DIRECT_URL = `${SERVICE_URL}/notifications/bulk-direct`;

  const ID_A = "507f1f77bcf86cd799439011";
  const ID_B = "507f1f77bcf86cd799439012";
  const ID_C = "507f1f77bcf86cd799439013";
  const MISSING_ID = "507f1f77bcf86cd7994390ff";

  const CAMPAIGN = ["*PLUSFIT A CORRER!!!*", "", "-Todos vamos por los 7 km"].join("\r\n");
  const NORMALIZED_CAMPAIGN = [
    "*PLUSFIT A CORRER!!!*",
    "",
    "- Todos vamos por los 7 km",
  ].join("\n");

  /** Shaped like a lean Client document: phone lives at userInfo.phone. */
  function client(id: string, phone?: string, name = "Ana Perez") {
    return { _id: id, email: `${name.split(" ")[0]}@mail.com`, userInfo: { name, phone } };
  }

  function createService(clients: ReturnType<typeof client>[], configured = true) {
    const clientModel = {
      find: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(clients) }),
    };
    const configService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (!configured) return undefined;
        if (key === "NOTIFICATIONS_SERVICE_URL") return SERVICE_URL;
        if (key === "NOTIFICATIONS_SERVICE_API_KEY") return API_KEY;
        return undefined;
      }),
    };

    const service = new NotificationsService(
      {} as never,
      configService as never,
      clientModel as never,
    );

    return { service, clientModel, configService };
  }

  function acceptWith(batchId = "batch-1", total = 1) {
    vi.mocked(axios.post).mockResolvedValue({ data: { batchId, total } });
  }

  /** Mirrors an axios error: the real reason lives in response.data.message. */
  function rejectWith(status: number, message: string) {
    vi.mocked(axios.post).mockRejectedValue({
      message: `Request failed with status code ${status}`,
      response: { status, data: { message } },
    });
  }

  function postedBody() {
    return vi.mocked(axios.post).mock.calls[0][1] as {
      to?: string[];
      message?: string;
      items?: { to: string; message: string }[];
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * {nombre} personalization. When the template carries the token, the payload
   * switches to per-recipient items with the name already interpolated — the
   * notifications service never sees the token or knows any client's name.
   */
  describe("personalizing with {nombre}", () => {
    it("posts per-recipient items with each client's name", async () => {
      acceptWith("batch-1", 2);
      const { service } = createService([
        client(ID_A, "099123456", "Ana Perez"),
        client(ID_B, "099123457", "Beto Diaz"),
      ]);

      await service.bulkSend({ clientIds: [ID_A, ID_B], message: "Hola {nombre}!" });

      expect(postedBody().items).toEqual([
        { to: "+59899123456", message: "Hola Ana Perez!" },
        { to: "+59899123457", message: "Hola Beto Diaz!" },
      ]);
      expect(postedBody().to).toBeUndefined();
      expect(postedBody().message).toBeUndefined();
    });

    it("replaces every occurrence of the token", async () => {
      acceptWith();
      const { service } = createService([client(ID_A, "099123456", "Ana")]);

      await service.bulkSend({
        clientIds: [ID_A],
        message: "{nombre}, tu plan {nombre} vence",
      });

      expect(postedBody().items?.[0].message).toBe("Ana, tu plan Ana vence");
    });

    it("falls back to the email when the client has no name", async () => {
      acceptWith();
      const noName = {
        _id: ID_A,
        email: "ana@mail.com",
        userInfo: { phone: "099123456" },
      };
      const { service } = createService([noName as never]);

      await service.bulkSend({ clientIds: [ID_A], message: "Hola {nombre}" });

      expect(postedBody().items?.[0].message).toBe("Hola ana@mail.com");
    });

    it("normalizes the template before interpolating", async () => {
      acceptWith();
      const { service } = createService([client(ID_A, "099123456", "Ana")]);

      await service.bulkSend({
        clientIds: [ID_A],
        message: "Hola {nombre}\r\n-Corremos el sabado",
      });

      expect(postedBody().items?.[0].message).toBe("Hola Ana\n- Corremos el sabado");
    });

    it("keeps the shared-message shape when the template has no token", async () => {
      acceptWith();
      const { service } = createService([client(ID_A, "099123456")]);

      await service.bulkSend({ clientIds: [ID_A], message: "Hola a todos" });

      expect(postedBody().items).toBeUndefined();
      expect(postedBody().to).toEqual(["+59899123456"]);
      expect(postedBody().message).toBe("Hola a todos");
    });

    /** A "$" in a name must never trigger replace()'s $-pattern expansion. */
    it("keeps dollar signs in names literal", async () => {
      acceptWith();
      const { service } = createService([client(ID_A, "099123456", "Ana $orteo")]);

      await service.bulkSend({ clientIds: [ID_A], message: "Hola {nombre}" });

      expect(postedBody().items?.[0].message).toBe("Hola Ana $orteo");
    });
  });

  describe("resolving the selection into recipients", () => {
    it("posts the normalized phone of every selected client", async () => {
      acceptWith("batch-1", 2);
      const { service } = createService([
        client(ID_A, "099123456"),
        client(ID_B, "+59899123457"),
      ]);

      const result = await service.bulkSend({ clientIds: [ID_A, ID_B], message: "Hola" });

      expect(postedBody().to).toEqual(["+59899123456", "+59899123457"]);
      expect(result.batchId).toBe("batch-1");
      expect(result.total).toBe(2);
      expect(result.skipped).toEqual([]);
    });

    it("normalizes the messy formats the gym database actually holds", async () => {
      acceptWith("batch-1", 4);
      const { service } = createService([
        client(ID_A, "099 123 456"),
        client(ID_B, "(099) 123-457"),
        client(ID_C, "59899123458"),
        client(MISSING_ID, "99123459"),
      ]);

      await service.bulkSend({
        clientIds: [ID_A, ID_B, ID_C, MISSING_ID],
        message: "Hola",
      });

      expect(postedBody().to).toEqual([
        "+59899123456",
        "+59899123457",
        "+59899123458",
        "+59899123459",
      ]);
    });

    it("queries only the selected ids", async () => {
      acceptWith();
      const { service, clientModel } = createService([client(ID_A, "099123456")]);

      await service.bulkSend({ clientIds: [ID_A], message: "Hola" });

      expect(clientModel.find).toHaveBeenCalledWith({ _id: { $in: [ID_A] } });
    });

    it("reports how many clients were requested alongside what was sent", async () => {
      acceptWith("batch-1", 1);
      const { service } = createService([client(ID_A, "099123456"), client(ID_B)]);

      const result = await service.bulkSend({ clientIds: [ID_A, ID_B], message: "Hola" });

      expect(result.requested).toBe(2);
      expect(result.total).toBe(1);
    });
  });

  /**
   * The notifications service rejects an entire upload on the first unusable
   * phone, so unreachable clients are dropped here — but never silently. The
   * admin needs names to go fix the records.
   */
  describe("reporting who could not be reached", () => {
    it("skips a client that has no phone at all", async () => {
      acceptWith("batch-1", 1);
      const { service } = createService([
        client(ID_A, "099123456"),
        client(ID_B, undefined, "Juan Gomez"),
      ]);

      const result = await service.bulkSend({ clientIds: [ID_A, ID_B], message: "Hola" });

      expect(postedBody().to).toEqual(["+59899123456"]);
      expect(result.skipped).toEqual([
        { clientId: ID_B, name: "Juan Gomez", reason: "no_phone" },
      ]);
    });

    it("skips a phone that cannot become a valid E.164 number", async () => {
      acceptWith("batch-1", 1);
      const { service } = createService([
        client(ID_A, "099123456"),
        client(ID_B, "123", "Juan Gomez"),
      ]);

      const result = await service.bulkSend({ clientIds: [ID_A, ID_B], message: "Hola" });

      expect(postedBody().to).toEqual(["+59899123456"]);
      expect(result.skipped).toEqual([
        { clientId: ID_B, name: "Juan Gomez", reason: "invalid_phone" },
      ]);
    });

    it("skips an id that no longer exists in the database", async () => {
      acceptWith("batch-1", 1);
      const { service } = createService([client(ID_A, "099123456")]);

      const result = await service.bulkSend({
        clientIds: [ID_A, MISSING_ID],
        message: "Hola",
      });

      expect(result.skipped).toEqual([
        { clientId: MISSING_ID, name: null, reason: "not_found" },
      ]);
    });

    /**
     * Two clients sharing a phone would otherwise receive the campaign twice on
     * the same handset. The first one wins and the collapse is reported, so the
     * admin understands why 50 selected became 49 sent.
     */
    it("collapses two clients that share the same phone", async () => {
      acceptWith("batch-1", 1);
      const { service } = createService([
        client(ID_A, "099123456", "Ana Perez"),
        client(ID_B, "099 123 456", "Juan Gomez"),
      ]);

      const result = await service.bulkSend({ clientIds: [ID_A, ID_B], message: "Hola" });

      expect(postedBody().to).toEqual(["+59899123456"]);
      expect(result.skipped).toEqual([
        { clientId: ID_B, name: "Juan Gomez", reason: "duplicate_phone" },
      ]);
    });

    it("falls back to the email when the client has no name", async () => {
      acceptWith("batch-1", 1);
      const nameless = { _id: ID_B, email: "sinnombre@mail.com", userInfo: {} };
      const { service } = createService([client(ID_A, "099123456"), nameless as never]);

      const result = await service.bulkSend({ clientIds: [ID_A, ID_B], message: "Hola" });

      expect(result.skipped[0].name).toBe("sinnombre@mail.com");
    });

    it("refuses to send when every selected client is unreachable", async () => {
      const { service } = createService([client(ID_A), client(ID_B, "123")]);

      await expect(
        service.bulkSend({ clientIds: [ID_A, ID_B], message: "Hola" }),
      ).rejects.toThrow("No reachable recipients");

      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe("preparing the message", () => {
    it("normalizes the message before proxying it", async () => {
      acceptWith();
      const { service } = createService([client(ID_A, "099123456")]);

      await service.bulkSend({ clientIds: [ID_A], message: CAMPAIGN });

      expect(postedBody().message).toBe(NORMALIZED_CAMPAIGN);
    });

    it("keeps the line breaks of a multiline campaign", async () => {
      acceptWith();
      const { service } = createService([client(ID_A, "099123456")]);

      await service.bulkSend({ clientIds: [ID_A], message: CAMPAIGN });

      expect(postedBody().message?.split("\n")).toHaveLength(3);
      expect(postedBody().message).not.toContain("\r");
    });

    it("sends one message for the whole batch, not one per client", async () => {
      acceptWith("batch-1", 2);
      const { service } = createService([
        client(ID_A, "099123456"),
        client(ID_B, "099123457"),
      ]);

      await service.bulkSend({ clientIds: [ID_A, ID_B], message: "Hola" });

      expect(typeof postedBody().message).toBe("string");
      expect(postedBody().to).toHaveLength(2);
    });
  });

  describe("talking to the notifications service", () => {
    it("posts to the bulk-direct endpoint with the api key", async () => {
      acceptWith();
      const { service } = createService([client(ID_A, "099123456")]);

      await service.bulkSend({ clientIds: [ID_A], message: "Hola" });

      expect(axios.post).toHaveBeenCalledWith(
        BULK_DIRECT_URL,
        expect.objectContaining({ to: ["+59899123456"], message: "Hola" }),
        expect.objectContaining({
          headers: expect.objectContaining({ "X-Api-Key": API_KEY }),
        }),
      );
    });

    it("fails clearly when the notifications service is not configured", async () => {
      const { service } = createService([client(ID_A, "099123456")], false);

      await expect(
        service.bulkSend({ clientIds: [ID_A], message: "Hola" }),
      ).rejects.toThrow("Notifications service not configured");

      expect(axios.post).not.toHaveBeenCalled();
    });

    /**
     * The WhatsApp status proxy swallowed the real reason behind axios's
     * generic "Request failed with status code 401", which made a scope
     * mismatch undiagnosable. This path must surface the service's own message.
     */
    it("surfaces the real reason instead of the generic axios message", async () => {
      rejectWith(401, "Insufficient scopes (requires one of: bulk, admin)");
      const { service } = createService([client(ID_A, "099123456")]);

      await expect(
        service.bulkSend({ clientIds: [ID_A], message: "Hola" }),
      ).rejects.toThrow("Insufficient scopes");
    });

    it("surfaces the daily cap rejection", async () => {
      rejectWith(429, "Daily message cap reached");
      const { service } = createService([client(ID_A, "099123456")]);

      await expect(
        service.bulkSend({ clientIds: [ID_A], message: "Hola" }),
      ).rejects.toThrow("Daily message cap reached");
    });

    it("falls back to the axios message when the service sends no body", async () => {
      vi.mocked(axios.post).mockRejectedValue({ message: "connect ECONNREFUSED" });
      const { service } = createService([client(ID_A, "099123456")]);

      await expect(
        service.bulkSend({ clientIds: [ID_A], message: "Hola" }),
      ).rejects.toThrow("connect ECONNREFUSED");
    });

    /**
     * Contract fixtures shared with the notifications service, whose
     * BulkDirectDto spec asserts these exact values. They are duplicated on
     * purpose: neither test runner can import across the two repos, so the
     * boundary is pinned from both sides. If one drifts, one suite goes red.
     */
    it("emits the exact payload shape the notifications service accepts", async () => {
      acceptWith("batch-1", 6);
      const { service } = createService([
        client(ID_A, "099 123 456"),
        client(ID_B, "(099) 123-457"),
        client(ID_C, "+59899123458"),
        { _id: "507f1f77bcf86cd799439014", email: "d@mail.com", userInfo: { name: "D", phone: "099123459" } },
        { _id: "507f1f77bcf86cd799439015", email: "e@mail.com", userInfo: { name: "E", phone: "59899123460" } },
        { _id: "507f1f77bcf86cd799439016", email: "f@mail.com", userInfo: { name: "F", phone: "99123461" } },
      ]);

      await service.bulkSend({
        clientIds: [
          ID_A,
          ID_B,
          ID_C,
          "507f1f77bcf86cd799439014",
          "507f1f77bcf86cd799439015",
          "507f1f77bcf86cd799439016",
        ],
        message: "Hola",
      });

      expect(postedBody().to).toEqual([
        "+59899123456",
        "+59899123457",
        "+59899123458",
        "+59899123459",
        "+59899123460",
        "+59899123461",
      ]);
    });

    it("still reports the skipped clients when the send succeeds", async () => {
      acceptWith("batch-9", 1);
      const { service } = createService([
        client(ID_A, "099123456"),
        client(ID_B, undefined, "Juan Gomez"),
      ]);

      const result = await service.bulkSend({ clientIds: [ID_A, ID_B], message: "Hola" });

      expect(result).toEqual({
        batchId: "batch-9",
        total: 1,
        requested: 2,
        skipped: [{ clientId: ID_B, name: "Juan Gomez", reason: "no_phone" }],
      });
    });
  });
});
