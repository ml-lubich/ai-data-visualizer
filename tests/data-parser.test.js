import { describe, it, expect } from "vitest";
import { parseCSVString } from "../src/data-parser.js";

describe("parseCSVString", () => {
  it("parses CSV string and returns columns, rows, rowCount, sampleRows", () => {
    const csv = "a,b\n1,2\n3,4\n5,6";
    const result = parseCSVString(csv);
    expect(result.columns).toEqual(["a", "b"]);
    expect(result.rows).toHaveLength(3);
    expect(result.rowCount).toBe(3);
    expect(result.sampleRows).toHaveLength(3);
    expect(result.rows[0]).toEqual({ a: 1, b: 2 });
  });
});

describe("parseCSV contract", () => {
  it("PapaParse is importable", async () => {
    const Papa = await import("papaparse");
    expect(Papa.default).toBeDefined();
    expect(typeof Papa.default.parse).toBe("function");
  });

  it("parses a CSV string with header", async () => {
    const Papa = await import("papaparse");
    const csv = "name,value\nAlpha,10\nBeta,20";
    const result = Papa.default.parse(csv, { header: true, dynamicTyping: true });
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe("Alpha");
    expect(result.data[0].value).toBe(10);
    expect(result.meta.fields).toEqual(["name", "value"]);
  });
});
