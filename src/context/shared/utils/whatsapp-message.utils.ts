/**
 * Helpers for turning a message typed in the dashboard into a CSV row the
 * notifications service can hand straight to WhatsApp.
 *
 * The export used to flatten every message onto a single line. That was a
 * workaround for a CSV splitter that could not read quoted multiline records,
 * and the cost was that every campaign reached WhatsApp as one long paragraph.
 * Line structure is now preserved here and quoted properly on the way out.
 */

/**
 * Built from codepoints on purpose: these characters are invisible, so writing
 * them literally into a regex leaves the next reader guessing what it matches.
 */
const characterClass = (...codePoints: number[]): RegExp =>
  new RegExp(`[${codePoints.map((code) => String.fromCharCode(code)).join("")}]`, "g");

/** Invisible padding that rich text editors inject on copy-paste. */
const ZERO_WIDTH_CHARACTERS = characterClass(0x200b, 0x200c, 0x200d, 0xfeff);

/** Fixed-width spaces that look like a space but break WhatsApp's wrapping. */
const NON_BREAKING_SPACES = characterClass(0x00a0, 0x2007, 0x202f);

/** Horizontal whitespace only. Never matches \n, so line structure survives. */
const HORIZONTAL_WHITESPACE = /[^\S\n]+/g;

/** Three or more newlines, i.e. more than one blank line between paragraphs. */
const REPEATED_BLANK_LINES = /\n{3,}/g;

/**
 * A hyphen opening a line and glued to its text. The digit lookahead keeps
 * "-15% de descuento" a discount instead of promoting it to a list item.
 */
const GLUED_HYPHEN_BULLET = /^-(?=[^\s\d])/;

/** A round bullet glued to its text. Unlike "-", it is never a minus sign. */
const GLUED_ROUND_BULLET = /^•(?=\S)/;

/**
 * A numbered marker glued to its text. The digit lookahead keeps "3.5 km" a
 * distance instead of splitting it into a numbered item.
 */
const GLUED_NUMBERED_MARKER = /^(\d{1,2}\.)(?=[^\s\d])/;

const URUGUAY_COUNTRY_CODE = "598";

/** Uruguayan subscriber numbers are 8 digits once the trunk 0 is dropped. */
const NATIONAL_NUMBER_LENGTH = 8;

/**
 * WhatsApp only renders a bullet or a numbered item when the marker is followed
 * by a space, so "-Todos" stays literal text while "- Todos" becomes a list.
 * Asterisks are deliberately left alone: at the start of a line "*" is the bold
 * marker far more often than a bullet, and rewriting it would break "*TITULO*".
 */
const normalizeLine = (line: string): string =>
  line
    .replace(HORIZONTAL_WHITESPACE, " ")
    .trim()
    .replace(GLUED_HYPHEN_BULLET, "- ")
    .replace(GLUED_ROUND_BULLET, "• ")
    .replace(GLUED_NUMBERED_MARKER, "$1 ");

/**
 * Cleans a message for WhatsApp while keeping the line structure the user
 * typed: paragraphs, bullet lists and single blank lines all survive.
 *
 * @param raw The message as pasted into the dashboard
 * @returns The message ready to be sent, or an empty string for empty input
 */
export const normalizeWhatsAppMessage = (raw: string): string => {
  if (!raw) return "";

  return String(raw)
    .replace(/\r\n?/g, "\n")
    .replace(ZERO_WIDTH_CHARACTERS, "")
    .replace(NON_BREAKING_SPACES, " ")
    .split("\n")
    .map(normalizeLine)
    .join("\n")
    .replace(REPEATED_BLANK_LINES, "\n\n")
    .trim();
};

/**
 * Wraps a value as an RFC 4180 CSV field. Quoting is unconditional so newlines,
 * commas and semicolons all stay inside a single field.
 *
 * @param value The raw value to place in the CSV
 * @returns The quoted, escaped field
 */
export const toCsvField = (value: string): string =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

/**
 * Converts a stored phone number to E.164, accepting the formats the gym
 * database actually holds: "099123456", "099 123 456", "+598 99 123 456".
 *
 * The notifications service rejects an entire upload on the first row that
 * fails /^\+[1-9]\d{1,14}$/, so anything unconvertible returns null and is
 * dropped from the export rather than breaking the whole campaign.
 *
 * @param raw The phone number as stored on the client
 * @returns The E.164 number, or null when it cannot be made valid
 */
export const toUruguayE164 = (raw: string): string | null => {
  if (!raw) return null;

  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;

  // Only strip the country code when doing so can still leave a full number,
  // so a bare 8-digit national number is never mistaken for a prefixed one.
  const withoutCountryCode =
    digits.startsWith(URUGUAY_COUNTRY_CODE) && digits.length > NATIONAL_NUMBER_LENGTH
      ? digits.slice(URUGUAY_COUNTRY_CODE.length)
      : digits;

  const national = withoutCountryCode.replace(/^0+/, "");
  if (national.length !== NATIONAL_NUMBER_LENGTH) return null;

  return `+${URUGUAY_COUNTRY_CODE}${national}`;
};

/** The one personalization token the campaign composer understands. */
export const NAME_TOKEN = "{nombre}";

/**
 * Replaces every {nombre} token with the recipient's display name.
 *
 * Uses split/join instead of String.replace on purpose: a name containing "$&"
 * or "$'" would trigger replace()'s dollar-pattern expansion and corrupt the
 * message.
 *
 * @param template The campaign body, already normalized
 * @param name The recipient's display name
 * @returns The personalized message
 */
export const interpolateName = (template: string, name: string): string =>
  template.split(NAME_TOKEN).join(name);
