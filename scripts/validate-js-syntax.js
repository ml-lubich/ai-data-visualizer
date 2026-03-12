#!/usr/bin/env node
/**
 * Validate JavaScript syntax.
 * Reads code from file path (argv[1]). Exits 0 if valid, 1 with error message if invalid.
 * Uses Node's Function constructor to parse without executing.
 */

import { readFileSync } from "fs";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node validate-js-syntax.js <file>");
  process.exit(2);
}

try {
  const code = readFileSync(path, "utf8");
  new Function(code);
  process.exit(0);
} catch (err) {
  console.error(err.message || String(err));
  process.exit(1);
}
