import { Chart, registerables } from "chart.js";
import { generateRandomData, buildChartConfig } from "./chart-config.js";

Chart.register(...registerables);

function initApp() {
  const canvas = document.getElementById("chart");
  const randomizeBtn = document.getElementById("randomize-btn");

  const data = generateRandomData();
  const config = buildChartConfig(data);
  const chart = new Chart(canvas, config);

  randomizeBtn.addEventListener("click", () => {
    const newData = generateRandomData();
    chart.data.labels = newData.labels;
    chart.data.datasets[0].data = newData.values;
    chart.update();
  });
}

document.addEventListener("DOMContentLoaded", initApp);
