/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * Hardened execution of LLM-generated Plotly.js code.
 * Forces charts to fit containers. Captures detailed error context.
 */

const TARGET_ID = "visualization-target";

/**
 * Execute generated Plotly.js JavaScript code.
 * Wraps execution with detailed error capture for retry pipeline.
 * @param {string} code - JavaScript code string to execute.
 * @param {object[]} data - Full parsed dataset.
 * @returns {{ success: boolean, error: string|null, code: string }}
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

    const hasPlotly = target && target.querySelector(".js-plotly-plot");
    const hasTable = target && target.querySelector(".cell-text-content, table");
    const hasContent = target && target.children.length > 0;

    if (!hasPlotly && !hasTable && !hasContent) {
      return {
        success: false,
        error: "Code executed without error but produced no visible chart. Ensure Plotly.newPlot('visualization-target', ...) is called.",
        code,
      };
    }

    const target2 = document.getElementById(TARGET_ID);
    if (target2) target2.classList.add("has-chart");

    requestAnimationFrame(() => {
      fitChartsToContainer();
    });

    return { success: true, error: null, code };
  } catch (err) {
    const errorDetail = err.stack
      ? `${err.message} (at ${err.stack.split("\n")[1]?.trim() || "unknown location"})`
      : err.message;
    return { success: false, error: errorDetail, code };
  }
}

/**
 * Force every Plotly chart inside the target to match the container size.
 */
function fitChartsToContainer() {
  const target = document.getElementById(TARGET_ID);
  if (!target || typeof Plotly === "undefined") return;

  const rect = target.getBoundingClientRect();
  const pad = 16;
  const w = Math.floor(rect.width - pad);
  const h = Math.floor(rect.height - pad);

  if (w <= 0 || h <= 0) return;

  const plots = target.querySelectorAll(".js-plotly-plot");
  for (const plot of plots) {
    try {
      Plotly.relayout(plot, { width: w, height: h, autosize: false });
      Plotly.Plots.resize(plot);
    } catch (_e) {
      /* resize failure is non-critical */
    }
  }
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitChartsToContainer, 150);
});
