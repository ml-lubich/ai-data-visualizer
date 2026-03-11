import { describe, it, expect } from "vitest";

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
