/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * CSV parsing via PapaParse.
 */

import Papa from "papaparse";

/**
 * @typedef {Object} ParsedData
 * @property {string[]} columns - Column names.
 * @property {object[]} rows - Array of row objects.
 * @property {number} rowCount - Total number of data rows.
 * @property {object[]} sampleRows - First 5 rows for the LLM prompt.
 */

/**
 * Parse a CSV File object.
 * @param {File} file
 * @returns {Promise<ParsedData>}
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete(results) {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parse error: ${results.errors[0].message}`));
          return;
        }
        const columns = results.meta.fields || [];
        const rows = results.data;
        resolve({
          columns,
          rows,
          rowCount: rows.length,
          sampleRows: rows.slice(0, 5),
        });
      },
      error(err) {
        reject(err);
      },
    });
  });
}
