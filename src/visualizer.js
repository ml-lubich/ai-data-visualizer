/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * Executes LLM-generated Plotly.js code and forces charts to fit the container.
 */

const TARGET_ID = "visualization-target";

/**
 * Execute generated Plotly.js JavaScript code.
 * After execution, force-resizes all Plotly charts to fit the container.
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

    requestAnimationFrame(() => {
      fitChartsToContainer();
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Force every Plotly chart inside the target to match the container's actual pixel size.
 * This overrides any fixed width/height the LLM may have set.
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
    Plotly.relayout(plot, { width: w, height: h, autosize: false });
    Plotly.Plots.resize(plot);
  }
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitChartsToContainer, 150);
});
