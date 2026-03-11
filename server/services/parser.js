/**
 * Simple CSV parser — handles quoted fields and common delimiters.
 * Returns { columns: string[], rows: object[] }.
 */
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  if (nonEmptyLines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Detect delimiter (comma, semicolon, tab)
  const firstLine = nonEmptyLines[0];
  const delimiter = detectDelimiter(firstLine);

  const columns = parseLine(firstLine, delimiter);
  if (columns.length === 0) {
    throw new Error("No columns found in CSV header");
  }

  const rows = [];
  for (let i = 1; i < nonEmptyLines.length; i++) {
    const line = nonEmptyLines[i].trim();
    if (line.length === 0) continue;

    const values = parseLine(line, delimiter);
    const row = {};
    for (let j = 0; j < columns.length; j++) {
      const raw = values[j] !== undefined ? values[j] : "";
      row[columns[j]] = coerceValue(raw);
    }
    rows.push(row);
  }

  return { columns, rows };
}

function detectDelimiter(line) {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  for (const ch of line) {
    if (ch in counts) counts[ch]++;
  }
  if (counts["\t"] > counts[","] && counts["\t"] > counts[";"]) return "\t";
  if (counts[";"] > counts[","]) return ";";
  return ",";
}

function parseLine(line, delimiter) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function coerceValue(raw) {
  if (raw === "") return null;
  const num = Number(raw);
  if (!isNaN(num) && raw.trim() !== "") return num;
  return raw;
}

module.exports = { parseCSV, detectDelimiter, parseLine, coerceValue };
