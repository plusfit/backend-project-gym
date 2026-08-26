import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";

import { BulkSendDto } from "../../../../src/context/notifications/dto/bulk-send.dto";

/**
 * Contract for the file-less bulk send. The dashboard posts the client ids it
 * selected plus the message; the backend owns resolving those ids to phones, so
 * the browser never gets to name a phone number itself.
 */
describe("BulkSendDto", () => {
  const ID_A = "507f1f77bcf86cd799439011";
  const ID_B = "507f1f77bcf86cd799439012";

  async function errorsFor(payload: Record<string, unknown>) {
    return validate(plainToInstance(BulkSendDto, payload));
  }

  function propertiesInError(errors: { property: string }[]) {
    return errors.map((error) => error.property);
  }

  it("accepts client ids and a message", async () => {
    const errors = await errorsFor({ clientIds: [ID_A, ID_B], message: "Hola" });

    expect(errors).toHaveLength(0);
  });

  it("accepts a multiline campaign message", async () => {
    const message = ["*PLUSFIT A CORRER!!!*", "", "- Todos vamos por los 7 km"].join("\n");

    const errors = await errorsFor({ clientIds: [ID_A], message });

    expect(errors).toHaveLength(0);
  });

  it("rejects an empty selection", async () => {
    const errors = await errorsFor({ clientIds: [], message: "Hola" });

    expect(propertiesInError(errors)).toContain("clientIds");
  });

  it("rejects a missing selection", async () => {
    const errors = await errorsFor({ message: "Hola" });

    expect(propertiesInError(errors)).toContain("clientIds");
  });

  /**
   * Guards the Mongo query: an id that is not a valid ObjectId would make
   * find({ _id: { $in: ids } }) throw a CastError deep in the service.
   */
  it("rejects an id that is not a valid mongo id", async () => {
    const errors = await errorsFor({ clientIds: [ID_A, "not-an-id"], message: "Hola" });

    expect(propertiesInError(errors)).toContain("clientIds");
  });

  it("rejects a selection over a thousand clients", async () => {
    const clientIds = Array.from({ length: 1001 }, () => ID_A);

    const errors = await errorsFor({ clientIds, message: "Hola" });

    expect(propertiesInError(errors)).toContain("clientIds");
  });

  it("rejects an empty message", async () => {
    const errors = await errorsFor({ clientIds: [ID_A], message: "" });

    expect(propertiesInError(errors)).toContain("message");
  });

  it("rejects a whitespace-only message", async () => {
    const errors = await errorsFor({ clientIds: [ID_A], message: "   \n  " });

    expect(propertiesInError(errors)).toContain("message");
  });

  it("rejects a message over 4096 characters", async () => {
    const errors = await errorsFor({ clientIds: [ID_A], message: "a".repeat(4097) });

    expect(propertiesInError(errors)).toContain("message");
  });

  it("accepts a message of exactly 4096 characters", async () => {
    const errors = await errorsFor({ clientIds: [ID_A], message: "a".repeat(4096) });

    expect(errors).toHaveLength(0);
  });
});
