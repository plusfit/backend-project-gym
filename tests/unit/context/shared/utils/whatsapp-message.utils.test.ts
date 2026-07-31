import { describe, expect, it } from "vitest";

import {
	normalizeWhatsAppMessage,
	toCsvField,
	toUruguayE164,
} from "../../../../../src/context/shared/utils/whatsapp-message.utils";

const NBSP = " ";
const ZERO_WIDTH_SPACE = "​";
const BYTE_ORDER_MARK = "﻿";

/**
 * The bulk export used to flatten every message to a single line, which is why
 * campaigns arrived on WhatsApp as one unreadable paragraph. These specs pin the
 * opposite contract: line structure survives the export, and the CSV field is
 * quoted so the notifications service can read it back.
 */
describe("normalizeWhatsAppMessage", () => {
	it("keeps the line breaks the user typed", () => {
		expect(normalizeWhatsAppMessage("Primera\nSegunda\nTercera")).toBe("Primera\nSegunda\nTercera");
	});

	it("keeps a single blank line between paragraphs", () => {
		expect(normalizeWhatsAppMessage("Titulo\n\nCuerpo")).toBe("Titulo\n\nCuerpo");
	});

	it("normalizes Windows and classic Mac line endings to LF", () => {
		expect(normalizeWhatsAppMessage("uno\r\ndos\rtres")).toBe("uno\ndos\ntres");
	});

	it("collapses runs of blank lines down to one", () => {
		expect(normalizeWhatsAppMessage("uno\n\n\n\n\ndos")).toBe("uno\n\ndos");
	});

	it("trims trailing spaces that survive a copy-paste", () => {
		expect(normalizeWhatsAppMessage("uno   \n  dos  ")).toBe("uno\ndos");
	});

	it("collapses runs of spaces and tabs inside a line", () => {
		expect(normalizeWhatsAppMessage("hola\t\t  mundo")).toBe("hola mundo");
	});

	it("drops leading and trailing blank lines", () => {
		expect(normalizeWhatsAppMessage("\n\n  hola  \n\n")).toBe("hola");
	});

	/**
	 * WhatsApp only renders a bullet when the marker is followed by a space.
	 * "-Todos nosotros" stays literal text, which is exactly how the Sierra Trail
	 * campaign shipped.
	 */
	it("adds the space WhatsApp needs after a hyphen bullet", () => {
		expect(normalizeWhatsAppMessage("-Todos vamos por los 7 km")).toBe(
			"- Todos vamos por los 7 km",
		);
	});

	it("adds the space after a round bullet", () => {
		expect(normalizeWhatsAppMessage("•Medallas para todos")).toBe(
			"• Medallas para todos",
		);
	});

	it("adds the space after a numbered list marker", () => {
		expect(normalizeWhatsAppMessage("1.Inscribirse\n2.Pagar")).toBe("1. Inscribirse\n2. Pagar");
	});

	it("leaves an already well formed bullet untouched", () => {
		expect(normalizeWhatsAppMessage("- Circuito renovado")).toBe("- Circuito renovado");
	});

	/**
	 * A leading hyphen followed by a digit is a negative number or a discount,
	 * not a bullet. Turning "-15% off" into a list item would change the meaning.
	 */
	it("does not turn a negative number into a bullet", () => {
		expect(normalizeWhatsAppMessage("-15% de descuento")).toBe("-15% de descuento");
	});

	/**
	 * An asterisk at the start of a line is WhatsApp's bold marker far more often
	 * than it is a bullet, so treating it as a list marker would break "*TITULO*".
	 */
	it("never touches an asterisk so bold markup survives", () => {
		expect(normalizeWhatsAppMessage("*PLUSFIT A CORRER!!!*")).toBe("*PLUSFIT A CORRER!!!*");
	});

	it("replaces non-breaking spaces with plain ones", () => {
		expect(normalizeWhatsAppMessage(`hola${NBSP}mundo`)).toBe("hola mundo");
	});

	it("strips zero-width characters that come from rich text editors", () => {
		expect(normalizeWhatsAppMessage(`ho${ZERO_WIDTH_SPACE}la${BYTE_ORDER_MARK}`)).toBe("hola");
	});

	it("returns an empty string for empty input", () => {
		expect(normalizeWhatsAppMessage("")).toBe("");
		expect(normalizeWhatsAppMessage(null as unknown as string)).toBe("");
		expect(normalizeWhatsAppMessage(undefined as unknown as string)).toBe("");
	});

	it("preserves a multi-paragraph campaign end to end", () => {
		const raw = [
			"*PLUSFIT A CORRER!!!*",
			"",
			"La Sierra Trail 2026 es una carrera de Trail Running.",
			"",
			"-Todos nosotros vamos por los 7 km",
			"- Circuito totalmente renovado.",
			"",
			"https://encarrera.uy/formulario",
		].join("\r\n");

		expect(normalizeWhatsAppMessage(raw)).toBe(
			[
				"*PLUSFIT A CORRER!!!*",
				"",
				"La Sierra Trail 2026 es una carrera de Trail Running.",
				"",
				"- Todos nosotros vamos por los 7 km",
				"- Circuito totalmente renovado.",
				"",
				"https://encarrera.uy/formulario",
			].join("\n"),
		);
	});
});

describe("toCsvField", () => {
	it("always quotes so a multiline value stays inside one field", () => {
		expect(toCsvField("uno\ndos")).toBe('"uno\ndos"');
	});

	it("doubles embedded quotes per RFC 4180", () => {
		expect(toCsvField('di "hola"')).toBe('"di ""hola"""');
	});

	it("keeps commas and semicolons inside the field", () => {
		expect(toCsvField("uno,dos;tres")).toBe('"uno,dos;tres"');
	});

	it("quotes an empty value", () => {
		expect(toCsvField("")).toBe('""');
		expect(toCsvField(null as unknown as string)).toBe('""');
	});
});

/**
 * The notifications service rejects the whole upload on the first row whose
 * phone fails /^\+[1-9]\d{1,14}$/, so a single "099 123 456" in the database
 * used to break the entire campaign. Invalid numbers must be dropped at export
 * time instead of being written into the file.
 */
describe("toUruguayE164", () => {
	const E164 = /^\+[1-9]\d{1,14}$/;

	it("adds the country code to a national mobile number", () => {
		expect(toUruguayE164("099123456")).toBe("+59899123456");
	});

	it("strips spaces, dashes and parentheses", () => {
		expect(toUruguayE164("099 123 456")).toBe("+59899123456");
		expect(toUruguayE164("099-123-456")).toBe("+59899123456");
		expect(toUruguayE164("(099) 123 456")).toBe("+59899123456");
	});

	it("accepts a number that already carries the country code", () => {
		expect(toUruguayE164("+59899123456")).toBe("+59899123456");
		expect(toUruguayE164("+598 99 123 456")).toBe("+59899123456");
		expect(toUruguayE164("59899123456")).toBe("+59899123456");
	});

	it("accepts a number without the trunk zero", () => {
		expect(toUruguayE164("99123456")).toBe("+59899123456");
	});

	it("rejects anything that cannot become a valid number", () => {
		expect(toUruguayE164("")).toBeNull();
		expect(toUruguayE164("   ")).toBeNull();
		expect(toUruguayE164("sin telefono")).toBeNull();
		expect(toUruguayE164("123")).toBeNull();
		expect(toUruguayE164("0991234567890123")).toBeNull();
		expect(toUruguayE164(null as unknown as string)).toBeNull();
	});

	it("only ever emits values the notifications service accepts", () => {
		const inputs = ["099123456", "+598 99 123 456", "99123456", "(099) 123-456", "59899123456"];

		for (const input of inputs) {
			expect(toUruguayE164(input)).toMatch(E164);
		}
	});
});
