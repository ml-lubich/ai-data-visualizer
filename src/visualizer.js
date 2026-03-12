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

    /* Force Plotly to resize to container after render (prevents cut-off) */
    if (typeof Plotly !== "undefined") {
      const el = document.getElementById(TARGET_ID);
      if (el?.querySelector(".plotly")) {
        requestAnimationFrame(() => {
          Plotly.Plots.resize(TARGET_ID);
        });
      }
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
