/**
 * Minimal RFC 4180 CSV reader.
 *
 * The bulk upload used to read its CSV with content.split("\n"), which treats
 * every newline as a row boundary. WhatsApp campaigns keep their line breaks
 * inside one quoted field, so the second line of a message looked like a row
 * without a comma and the upload failed with "Invalid row format".
 *
 * A newline only ends a record when it sits outside a quoted field.
 */

const DELIMITER = ",";
const QUOTE = '"';

/**
 * Excel writes a UTF-8 BOM when it saves a CSV. Left in place it becomes part
 * of the first header name, so a lookup for "to" would no longer find it.
 */
const BYTE_ORDER_MARK = 0xfeff;

/**
 * Parses CSV text into records of unescaped fields.
 *
 * Surrounding quotes are removed and doubled quotes collapse into one, so the
 * returned values are ready to use. Blank records are dropped, and a CR that
 * ends a line is normalized to LF so callers never see stray carriage returns.
 *
 * @param content Raw CSV text
 * @returns One array of field values per record
 */
export const parseCsvRecords = (content: string): string[][] => {
  if (!content) return [];

  const text = content.charCodeAt(0) === BYTE_ORDER_MARK ? content.slice(1) : content;
  const records: string[][] = [];
  let fields: string[] = [];
  let field = "";
  let insideQuotes = false;

  const endField = () => {
    fields.push(field);
    field = "";
  };

  const endRecord = () => {
    endField();
    // A record is blank when it holds nothing but empty fields, which is what
    // a trailing newline or a stray blank line produces.
    if (fields.some((value) => value.trim() !== "")) records.push(fields);
    fields = [];
  };

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (char === QUOTE) {
      // A doubled quote inside a quoted field is an escaped quote: it belongs
      // to the value and must not close the field.
      if (insideQuotes && text[index + 1] === QUOTE) {
        field += QUOTE;
        index++;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (insideQuotes) {
      // Normalize CRLF that lives inside a quoted message to a plain LF.
      if (char === "\r" && text[index + 1] === "\n") continue;
      field += char;
      continue;
    }

    if (char === DELIMITER) {
      endField();
      continue;
    }

    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index++;
      endRecord();
      continue;
    }

    field += char;
  }

  endRecord();

  return records;
};
