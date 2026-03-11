const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { parseCSV, detectDelimiter, coerceValue } = require("../server/services/parser");

describe("CSV Parser", () => {
  it("parses simple comma-delimited CSV", () => {
    const csv = "name,age,score\nAlice,30,95.5\nBob,25,88";
    const { columns, rows } = parseCSV(csv);
    assert.deepStrictEqual(columns, ["name", "age", "score"]);
    assert.equal(rows.length, 2);
    assert.deepStrictEqual(rows[0], { name: "Alice", age: 30, score: 95.5 });
    assert.deepStrictEqual(rows[1], { name: "Bob", age: 25, score: 88 });
  });

  it("parses semicolon-delimited CSV", () => {
    const csv = "city;population\nParis;2161000\nBerlin;3748148";
    const { columns, rows } = parseCSV(csv);
    assert.deepStrictEqual(columns, ["city", "population"]);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].population, 2161000);
  });

  it("parses tab-delimited CSV", () => {
    const csv = "x\ty\n1\t10\n2\t20";
    const { columns, rows } = parseCSV(csv);
    assert.deepStrictEqual(columns, ["x", "y"]);
    assert.equal(rows.length, 2);
    assert.equal(rows[1].y, 20);
  });

  it("handles quoted fields with commas", () => {
    const csv = 'name,description\nAlice,"Likes cats, dogs"\nBob,"No pets"';
    const { rows } = parseCSV(csv);
    assert.equal(rows[0].description, "Likes cats, dogs");
  });

  it("handles escaped quotes inside quoted fields", () => {
    const csv = 'title\n"She said ""hello"""\n"Normal"';
    const { rows } = parseCSV(csv);
    assert.equal(rows[0].title, 'She said "hello"');
  });

  it("skips empty lines", () => {
    const csv = "a,b\n1,2\n\n3,4\n";
    const { rows } = parseCSV(csv);
    assert.equal(rows.length, 2);
  });

  it("handles Windows line endings", () => {
    const csv = "a,b\r\n1,2\r\n3,4";
    const { rows } = parseCSV(csv);
    assert.equal(rows.length, 2);
  });

  it("throws on empty CSV", () => {
    assert.throws(() => parseCSV(""), /empty/i);
  });

  it("coerces numeric values", () => {
    assert.equal(coerceValue("42"), 42);
    assert.equal(coerceValue("3.14"), 3.14);
    assert.equal(coerceValue("hello"), "hello");
    assert.equal(coerceValue(""), null);
  });

  it("detects delimiters correctly", () => {
    assert.equal(detectDelimiter("a,b,c"), ",");
    assert.equal(detectDelimiter("a;b;c"), ";");
    assert.equal(detectDelimiter("a\tb\tc"), "\t");
  });
});
