/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * Executes LLM-generated Plotly.js code in the browser.
 * Captures errors for multi-shot retry pipeline.
 */

const TARGET_ID = "visualization-target";

/**
 * Execute generated Plotly.js JavaScript code.
 * @param {string} code - JavaScript code string to execute.
 * @param {object[]} data - Full parsed dataset.
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

    resizePlotlyCharts();

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Force all Plotly charts in the target to fill their container.
 */
function resizePlotlyCharts() {
  const target = document.getElementById(TARGET_ID);
  if (!target || typeof Plotly === "undefined") return;

  const plots = target.querySelectorAll(".js-plotly-plot");
  for (const plot of plots) {
    Plotly.relayout(plot, {
      autosize: true,
    });
  }
}

window.addEventListener("resize", resizePlotlyCharts);
