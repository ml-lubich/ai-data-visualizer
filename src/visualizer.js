/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * Executes LLM-generated BokehJS code in the browser.
 */

const TARGET_ID = "visualization-target";

/**
 * Execute generated BokehJS JavaScript code.
 * The code expects:
 *   - `window.__chartData` to be set with the parsed data array
 *   - A DOM element with id "visualization-target" to render into
 *
 * @param {string} code - JavaScript code string to execute.
 * @param {object[]} data - Full parsed dataset (array of row objects).
 * @returns {{ success: boolean, error: string|null }}
 */
export function executeChartCode(code, data) {
  window.__chartData = data;

  const target = document.getElementById(TARGET_ID);
  if (target) {
    target.innerHTML = "";
  }

  try {
    const fn = new Function(code);
    fn();
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
