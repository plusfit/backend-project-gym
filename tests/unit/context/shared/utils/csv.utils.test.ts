import { describe, expect, it } from "vitest";

import { parseCsvRecords } from "../../../../../src/context/shared/utils/csv.utils";

/**
 * The bulk upload used to parse its CSV with content.split("\n"), which treats
 * every newline as a row boundary. A WhatsApp message keeps its line breaks
 * inside one quoted field, so the second line of a message looked like a row
 * with no comma and the upload died with 'Invalid row format at line 3'.
 */
describe("parseCsvRecords", () => {
  it("parses plain rows into fields", () => {
    expect(parseCsvRecords("to,message\n+59899123456,hola")).toEqual([
      ["to", "message"],
      ["+59899123456", "hola"],
    ]);
  });

  it("keeps a quoted multiline field in a single record", () => {
    const content = 'to,message\n+59899123456,"linea uno\nlinea dos\nlinea tres"';

    expect(parseCsvRecords(content)).toEqual([
      ["to", "message"],
      ["+59899123456", "linea uno\nlinea dos\nlinea tres"],
    ]);
  });

  it("strips the surrounding quotes from a quoted field", () => {
    expect(parseCsvRecords('to,message\n+59899123456,"hola"')[1]).toEqual([
      "+59899123456",
      "hola",
    ]);
  });

  it("unescapes doubled quotes into a single quote", () => {
    expect(parseCsvRecords('to,message\n+59899123456,"di ""hola"" fuerte"')[1]).toEqual([
      "+59899123456",
      'di "hola" fuerte',
    ]);
  });

  it("keeps a comma that lives inside a quoted field", () => {
    expect(parseCsvRecords('to,message\n+59899123456,"uno, dos, tres"')[1]).toEqual([
      "+59899123456",
      "uno, dos, tres",
    ]);
  });

  it("handles CRLF row separators", () => {
    expect(parseCsvRecords('to,message\r\n+59899123456,"hola"')).toEqual([
      ["to", "message"],
      ["+59899123456", "hola"],
    ]);
  });

  it("preserves a CRLF that lives inside a quoted field as a line break", () => {
    expect(parseCsvRecords('to,message\n+59899123456,"uno\r\ndos"')[1][1]).toBe("uno\ndos");
  });

  it("skips blank rows so a trailing newline adds nothing", () => {
    expect(parseCsvRecords("to,message\n+59899123456,hola\n\n")).toEqual([
      ["to", "message"],
      ["+59899123456", "hola"],
    ]);
  });

  it("returns an empty list for empty content", () => {
    expect(parseCsvRecords("")).toEqual([]);
    expect(parseCsvRecords("\n\n")).toEqual([]);
  });

  it("keeps an empty field as an empty string", () => {
    expect(parseCsvRecords("to,message\n+59899123456,")[1]).toEqual(["+59899123456", ""]);
  });

  /**
   * Excel and Google Sheets are the two tools a gym admin will open the export
   * with, and both change the file on save. These cover what comes back.
   */
  describe("files that went through a spreadsheet", () => {
    const BYTE_ORDER_MARK = "﻿";

    it("strips a UTF-8 BOM so the first column is still named to", () => {
      const records = parseCsvRecords(`${BYTE_ORDER_MARK}to,message\n+59899123456,hola`);

      expect(records[0]).toEqual(["to", "message"]);
      expect(records[1]).toEqual(["+59899123456", "hola"]);
    });

    it("strips a BOM in front of a multiline message", () => {
      const records = parseCsvRecords(
        `${BYTE_ORDER_MARK}to,message\n+59899123456,"uno\ndos"`,
      );

      expect(records[0][0]).toBe("to");
      expect(records[1][1]).toBe("uno\ndos");
    });

    it("handles a lone CR as a row separator", () => {
      expect(parseCsvRecords("to,message\r+59899123456,hola")).toEqual([
        ["to", "message"],
        ["+59899123456", "hola"],
      ]);
    });

    it("keeps the column order the file declares", () => {
      expect(parseCsvRecords('message,to\n"hola",+59899123456')).toEqual([
        ["message", "to"],
        ["hola", "+59899123456"],
      ]);
    });

    it("keeps extra columns instead of dropping them", () => {
      expect(parseCsvRecords("to,message,nombre\n+59899123456,hola,Ana")[1]).toEqual([
        "+59899123456",
        "hola",
        "Ana",
      ]);
    });
  });

  describe("border cases", () => {
    it("returns a single field when the row has no delimiter", () => {
      expect(parseCsvRecords("to,message\n+59899123456")[1]).toEqual(["+59899123456"]);
    });

    it("reads an empty quoted field as an empty string", () => {
      expect(parseCsvRecords('to,message\n+59899123456,""')[1]).toEqual([
        "+59899123456",
        "",
      ]);
    });

    it("keeps a message made only of line breaks as whitespace", () => {
      expect(parseCsvRecords('to,message\n+59899123456,"\n\n"')[1]).toEqual([
        "+59899123456",
        "\n\n",
      ]);
    });

    it("keeps a quoted field that is only spaces", () => {
      expect(parseCsvRecords('to,message\n+59899123456,"   "')[1]).toEqual([
        "+59899123456",
        "   ",
      ]);
    });

    it("recovers the value from an unterminated quote instead of throwing", () => {
      expect(parseCsvRecords('to,message\n+59899123456,"hola sin cerrar')[1]).toEqual([
        "+59899123456",
        "hola sin cerrar",
      ]);
    });

    it("drops a row made only of delimiters", () => {
      expect(parseCsvRecords("to,message\n,,\n+59899123456,hola")).toEqual([
        ["to", "message"],
        ["+59899123456", "hola"],
      ]);
    });

    it("keeps emoji and accents intact", () => {
      const message = "Vamos! 🏃‍♂️ inscripción abierta — ñandú";

      expect(parseCsvRecords(`to,message\n+59899123456,"${message}"`)[1][1]).toBe(message);
    });

    it("handles a message longer than a thousand characters", () => {
      const message = `${"linea\n".repeat(200)}fin`;

      const records = parseCsvRecords(`to,message\n+59899123456,"${message}"`);

      expect(records.length).toBe(2);
      expect(records[1][1]).toBe(message);
    });

    it("keeps a url with its slashes and query string", () => {
      const url = "https://encarrera.uy/form?grupo=fit&ref=1";

      expect(parseCsvRecords(`to,message\n+59899123456,"Anotate: ${url}"`)[1][1]).toBe(
        `Anotate: ${url}`,
      );
    });

    it("parses two hundred recipients with multiline messages", () => {
      const message = '"uno\ndos\ntres"';
      const rows = Array.from({ length: 200 }, (_, i) => `+5989912${i},${message}`);

      const records = parseCsvRecords(["to,message", ...rows].join("\n"));

      expect(records.length).toBe(201);
      expect(records.every((record) => record.length === 2)).toBe(true);
    });
  });

  describe("simple messages", () => {
    it("parses a one-word unquoted message", () => {
      expect(parseCsvRecords("to,message\n+59899123456,Hola")[1]).toEqual([
        "+59899123456",
        "Hola",
      ]);
    });

    it("parses an unquoted message with spaces", () => {
      expect(parseCsvRecords("to,message\n+59899123456,Hola como estas")[1]).toEqual([
        "+59899123456",
        "Hola como estas",
      ]);
    });

    it("parses several single-line recipients", () => {
      const records = parseCsvRecords(
        ["to,message", "+59899123456,Hola", "+59899123457,Chau", "+59899123458,Buenas"].join(
          "\n",
        ),
      );

      expect(records.slice(1).map((record) => record[1])).toEqual([
        "Hola",
        "Chau",
        "Buenas",
      ]);
    });

    it("parses a mix of quoted and unquoted messages in one file", () => {
      const records = parseCsvRecords(
        ["to,message", "+59899123456,Hola", '+59899123457,"uno\ndos"', "+59899123458,Chau"].join(
          "\n",
        ),
      );

      expect(records.length).toBe(4);
      expect(records.slice(1).map((record) => record[1])).toEqual([
        "Hola",
        "uno\ndos",
        "Chau",
      ]);
    });
  });

  it("counts one record per recipient across a full campaign export", () => {
    const message = '"*PLUSFIT A CORRER!!!*\n\n- Todos vamos por los 7 km\n- Medallas"';
    const content = [
      "to,message",
      `+59899123456,${message}`,
      `+59899123457,${message}`,
      `+59899123458,${message}`,
    ].join("\n");

    const records = parseCsvRecords(content);

    expect(records.length).toBe(4);
    expect(records.slice(1).map((record) => record[0])).toEqual([
      "+59899123456",
      "+59899123457",
      "+59899123458",
    ]);
    expect(records[1][1]).toBe("*PLUSFIT A CORRER!!!*\n\n- Todos vamos por los 7 km\n- Medallas");
  });
});
