import { describe, expect, it } from "vitest";

import { NotificationsService } from "../../../../src/context/notifications/notifications.service";

/**
 * Exercises the real parseCSV through the public bulkUpload seam.
 *
 * bulkUpload parses and validates the file BEFORE it reads its configuration,
 * so an unconfigured service is a clean way to prove parsing succeeded: the
 * request gets as far as "not configured" instead of dying on the file. That is
 * exactly the regression that shipped — a multiline campaign was rejected with
 * 'Invalid row format at line 3' before it ever left the gym backend.
 */
describe("NotificationsService.bulkUpload", () => {
  const NOT_CONFIGURED = "Notifications service not configured";
  const BYTE_ORDER_MARK = "﻿";
  const CAMPAIGN = [
    "*PLUSFIT A CORRER!!!*",
    "",
    "- Todos nosotros CARRERAS FIT vamos por los 7 km",
    "- Circuito totalmente renovado.",
    "",
    "https://encarrera.uy/formulario",
  ].join("\n");

  /** Unconfigured on purpose, so parsing is what gets tested. */
  function createService() {
    return new NotificationsService({} as never, { get: () => undefined } as never);
  }

  function upload(csv: string, originalname = "campania.csv", mimetype = "text/csv") {
    return createService().bulkUpload({
      originalname,
      mimetype,
      buffer: Buffer.from(csv, "utf-8"),
    });
  }

  function csvWith(message: string, phones = ["+59899123456"]) {
    const quoted = `"${message.replace(/"/g, '""')}"`;
    return ["to,message", ...phones.map((phone) => `${phone},${quoted}`)].join("\n");
  }

  describe("accepts what the dashboard exports", () => {
    it("accepts a multiline campaign instead of rejecting the row format", async () => {
      await expect(upload(csvWith(CAMPAIGN))).rejects.toThrow(NOT_CONFIGURED);
    });

    it("accepts a multiline campaign for many recipients", async () => {
      const phones = Array.from({ length: 45 }, (_, i) => `+5989912${String(i).padStart(4, "0")}`);

      await expect(upload(csvWith(CAMPAIGN, phones))).rejects.toThrow(NOT_CONFIGURED);
    });

    it("accepts a file Excel saved with a UTF-8 BOM", async () => {
      await expect(upload(`${BYTE_ORDER_MARK}${csvWith(CAMPAIGN)}`)).rejects.toThrow(
        NOT_CONFIGURED,
      );
    });

    it("accepts a CRLF file", async () => {
      await expect(upload(csvWith(CAMPAIGN).replace(/\n/g, "\r\n"))).rejects.toThrow(
        NOT_CONFIGURED,
      );
    });

    it("accepts a message holding commas, semicolons and quotes", async () => {
      const message = 'Uno, dos; tres. Escribi "hola" al referente.';

      await expect(upload(csvWith(message))).rejects.toThrow(NOT_CONFIGURED);
    });

    it("accepts a trailing newline after the last recipient", async () => {
      await expect(upload(`${csvWith(CAMPAIGN)}\n`)).rejects.toThrow(NOT_CONFIGURED);
    });
  });

  describe("accepts simple messages", () => {
    it("accepts a one-word unquoted message", async () => {
      await expect(upload("to,message\n+59899123456,Hola")).rejects.toThrow(NOT_CONFIGURED);
    });

    it("accepts an unquoted message with spaces", async () => {
      await expect(upload("to,message\n+59899123456,Hola como estas")).rejects.toThrow(
        NOT_CONFIGURED,
      );
    });

    it("accepts several single-line recipients", async () => {
      const csv = ["to,message", "+59899123456,Hola", "+59899123457,Chau"].join("\n");

      await expect(upload(csv)).rejects.toThrow(NOT_CONFIGURED);
    });

    it("accepts a file mixing quoted multiline and plain messages", async () => {
      const csv = [
        "to,message",
        "+59899123456,Hola",
        '+59899123457,"uno\ndos"',
        "+59899123458,Chau",
      ].join("\n");

      await expect(upload(csv)).rejects.toThrow(NOT_CONFIGURED);
    });
  });

  describe("still rejects genuinely broken files", () => {
    it("rejects a file with no rows", async () => {
      await expect(upload("")).rejects.toThrow("File is empty");
    });

    it("rejects a file whose columns are wrong", async () => {
      await expect(upload("telefono,texto\n+59899123456,hola")).rejects.toThrow(
        "Missing required column",
      );
    });

    it("rejects a row with a phone but no message", async () => {
      await expect(upload("to,message\n+59899123456,")).rejects.toThrow("Invalid row 1");
    });

    it("rejects a row whose message is only whitespace", async () => {
      await expect(upload('to,message\n+59899123456,"   "')).rejects.toThrow("Invalid row 1");
    });

    it("rejects a national phone that never got normalized", async () => {
      await expect(upload("to,message\n099123456,Hola")).rejects.toThrow("Invalid phone format");
    });

    it("names the offending phone so the admin can fix the client", async () => {
      await expect(upload("to,message\n+5491112345678,Hola")).rejects.toThrow("+5491112345678");
    });

    it("rejects a file over the thousand row limit", async () => {
      const phones = Array.from({ length: 1001 }, (_, i) => `+5989912${String(i).padStart(4, "0")}`);

      await expect(upload(csvWith("Hola", phones))).rejects.toThrow("exceeds 1000 row limit");
    });

    it("rejects a file that is neither named nor typed as csv", async () => {
      await expect(
        upload("to,message\n+59899123456,Hola", "campania.txt", "text/plain"),
      ).rejects.toThrow("Only CSV files are allowed");
    });

    /**
     * The extension and the mime type are checked with AND, so either one being
     * csv is enough. Browsers do send application/vnd.ms-excel for a .csv, so
     * relying on the mime type alone would reject legitimate uploads.
     */
    it("accepts a .csv whose mime type the browser got wrong", async () => {
      await expect(
        upload("to,message\n+59899123456,Hola", "campania.csv", "application/vnd.ms-excel"),
      ).rejects.toThrow(NOT_CONFIGURED);
    });

    it("accepts a csv mime type even when the name lacks the extension", async () => {
      await expect(
        upload("to,message\n+59899123456,Hola", "campania", "text/csv"),
      ).rejects.toThrow(NOT_CONFIGURED);
    });
  });
});
