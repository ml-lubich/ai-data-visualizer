/**
 * Generates a random dataset for visualization.
 * @param {number} size - Number of data points.
 * @returns {{ labels: string[], values: number[] }}
 */
export function generateRandomData(size = 7) {
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const labels = dayLabels.slice(0, size);
  const values = labels.map(() => Math.floor(Math.random() * 100) + 10);
  return { labels, values };
}

/**
 * Builds a Chart.js configuration object.
 * @param {{ labels: string[], values: number[] }} data
 * @returns {object} Chart.js config
 */
export function buildChartConfig(data) {
  return {
    type: "bar",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "AI-Generated Metrics",
          data: data.values,
          backgroundColor: [
            "rgba(56, 189, 248, 0.7)",
            "rgba(129, 140, 248, 0.7)",
            "rgba(52, 211, 153, 0.7)",
            "rgba(251, 191, 36, 0.7)",
            "rgba(248, 113, 113, 0.7)",
            "rgba(167, 139, 250, 0.7)",
            "rgba(94, 234, 212, 0.7)",
          ],
          borderColor: [
            "rgb(56, 189, 248)",
            "rgb(129, 140, 248)",
            "rgb(52, 211, 153)",
            "rgb(251, 191, 36)",
            "rgb(248, 113, 113)",
            "rgb(167, 139, 250)",
            "rgb(94, 234, 212)",
          ],
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#e2e8f0" },
        },
      },
      scales: {
        x: {
          ticks: { color: "#94a3b8" },
          grid: { color: "rgba(148, 163, 184, 0.1)" },
        },
        y: {
          ticks: { color: "#94a3b8" },
          grid: { color: "rgba(148, 163, 184, 0.1)" },
          beginAtZero: true,
        },
      },
    },
  };
}
