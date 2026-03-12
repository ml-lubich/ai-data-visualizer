/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * 10 canonical interactive Plotly.js chart examples.
 * Each returns executable JS code targeting #visualization-target
 * with data from window.__chartData.
 */

export const CANONICAL_EXAMPLES = [
  {
    id: "Q01",
    question: "Show me a bar chart of total revenue by region",
    type: "Interactive Bar Chart",
    interactions: "Hover tooltips, zoom, pan, click to isolate",
    code: `
const data = window.__chartData;
const grouped = {};
for (const row of data) {
  if (!grouped[row.region]) grouped[row.region] = 0;
  grouped[row.region] += parseFloat(row.revenue) || 0;
}
const regions = Object.keys(grouped);
const revenues = Object.values(grouped);

Plotly.newPlot("visualization-target", [{
  x: regions, y: revenues, type: "bar",
  marker: { color: ["#3b82f6","#10b981","#f59e0b","#ef4444"] },
  hovertemplate: "<b>%{x}</b><br>Revenue: $%{y:,.2f}<extra></extra>",
}], {
  title: "Total Revenue by Region",
  autosize: true,
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0" },
  xaxis: { title: "Region", automargin: true }, yaxis: { title: "Revenue ($)", automargin: true },
}, { responsive: true });
`,
  },
  {
    id: "Q02",
    question: "Show me a sortable data table of all sales",
    type: "Interactive Data Table",
    interactions: "Scroll, hover rows, styled headers",
    code: `
const data = window.__chartData;
const cols = ["date","region","product","units_sold","revenue","cost"];
const headers = ["Date","Region","Product","Units Sold","Revenue ($)","Cost ($)"];
const values = cols.map(c => data.map(r => c === "revenue" || c === "cost" ? parseFloat(r[c]).toFixed(2) : r[c]));

Plotly.newPlot("visualization-target", [{
  type: "table",
  header: {
    values: headers.map(h => "<b>" + h + "</b>"),
    fill: { color: "#1e293b" },
    font: { color: "#e2e8f0", size: 13 },
    align: "center", height: 32,
  },
  cells: {
    values: values,
    fill: { color: [values[0].map((_, i) => i % 2 === 0 ? "#1e293b" : "#0f172a")] },
    font: { color: "#cbd5e1", size: 12 },
    align: ["left","left","left","right","right","right"],
    height: 28,
  },
}], {
  title: "Sales Data Table (24 rows)",
  autosize: true,
  paper_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0" },
  margin: { t: 40, l: 10, r: 10, b: 10 },
}, { responsive: true });
`,
  },
  {
    id: "Q03",
    question: "Show me a line chart of monthly revenue trends over time",
    type: "Interactive Line Chart",
    interactions: "Hover for values, drag-zoom, double-click to reset, rangeslider",
    code: `
const data = window.__chartData;
const monthly = {};
for (const row of data) {
  const m = row.date.substring(0, 7);
  if (!monthly[m]) monthly[m] = 0;
  monthly[m] += parseFloat(row.revenue) || 0;
}
const months = Object.keys(monthly).sort();
const revenues = months.map(m => monthly[m]);

Plotly.newPlot("visualization-target", [{
  x: months, y: revenues, type: "scatter", mode: "lines+markers",
  line: { color: "#3b82f6", width: 3 },
  marker: { size: 10, color: "#3b82f6", line: { color: "#1e293b", width: 2 } },
  hovertemplate: "<b>%{x}</b><br>Revenue: $%{y:,.2f}<extra></extra>",
}], {
  title: "Monthly Revenue Trend",
  autosize: true,
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0" },
  xaxis: { title: "Month", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
  yaxis: { title: "Revenue ($)", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
}, { responsive: true });
`,
  },
  {
    id: "Q04",
    question: "Show me a scatter plot of units sold vs revenue, colored by product",
    type: "Interactive Scatter Plot",
    interactions: "Hover for details, box-select, lasso-select, click legend to toggle",
    code: `
const data = window.__chartData;
const colorMap = { "Widget A": "#3b82f6", "Widget B": "#10b981", "Widget C": "#f59e0b" };
const products = [...new Set(data.map(r => r.product))];

const traces = products.map(prod => {
  const rows = data.filter(r => r.product === prod);
  return {
    x: rows.map(r => r.units_sold),
    y: rows.map(r => parseFloat(r.revenue)),
    text: rows.map(r => r.region),
    type: "scatter", mode: "markers", name: prod,
    marker: { size: 14, color: colorMap[prod], opacity: 0.85,
      line: { color: "#1e293b", width: 1.5 } },
    hovertemplate: "<b>%{fullData.name}</b><br>Region: %{text}<br>Units: %{x}<br>Revenue: $%{y:,.2f}<extra></extra>",
  };
});

Plotly.newPlot("visualization-target", traces, {
  title: "Units Sold vs Revenue (by Product)",
  autosize: true,
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0" },
  xaxis: { title: "Units Sold", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
  yaxis: { title: "Revenue ($)", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
  legend: { bgcolor: "rgba(30,41,59,0.8)" },
  dragmode: "lasso",
}, { responsive: true });
`,
  },
  {
    id: "Q05",
    question: "Show me a pie chart of revenue share by product",
    type: "Interactive Pie Chart",
    interactions: "Hover for percentage and amount, click to pull out slice",
    code: `
const data = window.__chartData;
const grouped = {};
for (const row of data) {
  if (!grouped[row.product]) grouped[row.product] = 0;
  grouped[row.product] += parseFloat(row.revenue) || 0;
}

Plotly.newPlot("visualization-target", [{
  labels: Object.keys(grouped),
  values: Object.values(grouped),
  type: "pie",
  marker: { colors: ["#3b82f6","#10b981","#f59e0b"] },
  textinfo: "label+percent",
  textfont: { color: "#fff", size: 14 },
  hovertemplate: "<b>%{label}</b><br>Revenue: $%{value:,.2f}<br>Share: %{percent}<extra></extra>",
  pull: [0.03, 0.03, 0.03],
}], {
  title: "Revenue Share by Product",
  autosize: true,
  paper_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0" },
  showlegend: true,
  legend: { bgcolor: "rgba(30,41,59,0.8)" },
}, { responsive: true });
`,
  },
  {
    id: "Q06",
    question: "Show me a stacked bar chart of revenue by month, broken down by product",
    type: "Interactive Stacked Bar Chart",
    interactions: "Hover for breakdown, click legend to toggle products, zoom",
    code: `
const data = window.__chartData;
const products = [...new Set(data.map(r => r.product))].sort();
const months = [...new Set(data.map(r => r.date.substring(0, 7)))].sort();
const colorMap = { "Widget A": "#3b82f6", "Widget B": "#10b981", "Widget C": "#f59e0b" };

const traces = products.map(prod => {
  const vals = months.map(m => {
    return data.filter(r => r.product === prod && r.date.startsWith(m))
      .reduce((sum, r) => sum + (parseFloat(r.revenue) || 0), 0);
  });
  return {
    x: months, y: vals, name: prod, type: "bar",
    marker: { color: colorMap[prod] },
    hovertemplate: "<b>%{fullData.name}</b><br>Month: %{x}<br>Revenue: $%{y:,.2f}<extra></extra>",
  };
});

Plotly.newPlot("visualization-target", traces, {
  title: "Monthly Revenue by Product (Stacked)",
  autosize: true,
  barmode: "stack",
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0" },
  xaxis: { title: "Month", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
  yaxis: { title: "Revenue ($)", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
  legend: { bgcolor: "rgba(30,41,59,0.8)" },
}, { responsive: true });
`,
  },
  {
    id: "Q07",
    question: "Show me a histogram of individual sale revenue amounts",
    type: "Interactive Histogram",
    interactions: "Hover for bin count, drag-zoom into distribution tails",
    code: `
const data = window.__chartData;
const revenues = data.map(r => parseFloat(r.revenue));

Plotly.newPlot("visualization-target", [{
  x: revenues, type: "histogram",
  nbinsx: 10,
  marker: { color: "#818cf8", line: { color: "#1e293b", width: 1 } },
  hovertemplate: "Range: %{x}<br>Count: %{y}<extra></extra>",
}], {
  title: "Distribution of Sale Revenue Amounts",
  autosize: true,
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0" },
  xaxis: { title: "Revenue ($)", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
  yaxis: { title: "Count", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
  bargap: 0.05,
}, { responsive: true });
`,
  },
  {
    id: "Q08",
    question: "Show me a multi-line chart of monthly revenue per product (click legend to toggle)",
    type: "Interactive Multi-Line with Legend Toggle",
    interactions: "Click legend to show/hide lines, hover for values, drag-zoom",
    code: `
const data = window.__chartData;
const products = [...new Set(data.map(r => r.product))].sort();
const months = [...new Set(data.map(r => r.date.substring(0, 7)))].sort();
const colorMap = { "Widget A": "#3b82f6", "Widget B": "#10b981", "Widget C": "#f59e0b" };

const traces = products.map(prod => {
  const vals = months.map(m =>
    data.filter(r => r.product === prod && r.date.startsWith(m))
      .reduce((sum, r) => sum + (parseFloat(r.revenue) || 0), 0)
  );
  return {
    x: months, y: vals, name: prod, type: "scatter", mode: "lines+markers",
    line: { color: colorMap[prod], width: 3 },
    marker: { size: 9, color: colorMap[prod], line: { color: "#1e293b", width: 1.5 } },
    hovertemplate: "<b>%{fullData.name}</b><br>%{x}<br>Revenue: $%{y:,.2f}<extra></extra>",
  };
});

Plotly.newPlot("visualization-target", traces, {
  title: "Monthly Revenue per Product (Click Legend to Toggle)",
  autosize: true,
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0" },
  xaxis: { title: "Month", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
  yaxis: { title: "Revenue ($)", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
  legend: { bgcolor: "rgba(30,41,59,0.8)" },
  hovermode: "x unified",
}, { responsive: true });
`,
  },
  {
    id: "Q09",
    question: "Show me a horizontal bar chart of the top regions by total units sold, sorted",
    type: "Interactive Horizontal Bar Chart (Sorted)",
    interactions: "Hover for exact values, sorted ascending for readability",
    code: `
const data = window.__chartData;
const grouped = {};
for (const row of data) {
  if (!grouped[row.region]) grouped[row.region] = 0;
  grouped[row.region] += parseInt(row.units_sold) || 0;
}
const sorted = Object.entries(grouped).sort((a, b) => a[1] - b[1]);
const regions = sorted.map(e => e[0]);
const units = sorted.map(e => e[1]);

Plotly.newPlot("visualization-target", [{
  y: regions, x: units, type: "bar", orientation: "h",
  marker: { color: ["#ef4444","#f59e0b","#10b981","#3b82f6"] },
  hovertemplate: "<b>%{y}</b><br>Units Sold: %{x:,}<extra></extra>",
}], {
  title: "Regions by Total Units Sold (Sorted)",
  autosize: true,
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0" },
  xaxis: { title: "Units Sold", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
  yaxis: { title: "", automargin: true },
  margin: { l: 80 },
}, { responsive: true });
`,
  },
  {
    id: "Q10",
    question: "Show me profit margin by product as a bar chart with a summary stats table below",
    type: "Interactive Dashboard (Chart + Table)",
    interactions: "Hover bars for margin %, table shows full breakdown",
    code: `
const data = window.__chartData;
const stats = {};
for (const row of data) {
  if (!stats[row.product]) stats[row.product] = { revenue: 0, cost: 0, units: 0, count: 0 };
  stats[row.product].revenue += parseFloat(row.revenue) || 0;
  stats[row.product].cost += parseFloat(row.cost) || 0;
  stats[row.product].units += parseInt(row.units_sold) || 0;
  stats[row.product].count += 1;
}
const products = Object.keys(stats).sort();
const profits = products.map(p => stats[p].revenue - stats[p].cost);
const margins = products.map(p => ((stats[p].revenue - stats[p].cost) / stats[p].revenue * 100));

const target = document.getElementById("visualization-target");
target.innerHTML = '<div id="viz-chart"></div><div id="viz-table" style="margin-top:1rem"></div>';

Plotly.newPlot("viz-chart", [{
  x: products, y: profits, type: "bar",
  marker: { color: profits.map(p => p >= 0 ? "#10b981" : "#ef4444") },
  text: margins.map(m => m.toFixed(1) + "%"),
  textposition: "outside", textfont: { color: "#e2e8f0" },
  hovertemplate: "<b>%{x}</b><br>Profit: $%{y:,.2f}<br>Margin: %{text}<extra></extra>",
}], {
  title: "Total Profit by Product",
  autosize: true,
  paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e2e8f0" },
  yaxis: { title: "Profit ($)", gridcolor: "rgba(148,163,184,0.15)", automargin: true },
  margin: { t: 50, b: 30 }, height: 300,
}, { responsive: true });

Plotly.newPlot("viz-table", [{
  type: "table",
  header: {
    values: ["<b>Product</b>","<b>Revenue</b>","<b>Cost</b>","<b>Profit</b>","<b>Margin</b>","<b>Units</b>","<b>Txns</b>"],
    fill: { color: "#1e293b" }, font: { color: "#e2e8f0", size: 13 }, align: "center", height: 30,
  },
  cells: {
    values: [
      products,
      products.map(p => "$" + stats[p].revenue.toFixed(2)),
      products.map(p => "$" + stats[p].cost.toFixed(2)),
      profits.map(p => "$" + p.toFixed(2)),
      margins.map(m => m.toFixed(1) + "%"),
      products.map(p => stats[p].units),
      products.map(p => stats[p].count),
    ],
    fill: { color: [["#0f172a","#1e293b","#0f172a"]] },
    font: { color: "#cbd5e1", size: 12 }, align: ["left","right","right","right","right","right","right"], height: 28,
  },
}], {
  autosize: true,
  paper_bgcolor: "rgba(0,0,0,0)", font: { color: "#e2e8f0" },
  margin: { t: 5, l: 10, r: 10, b: 5 }, height: 160,
}, { responsive: true });
`,
  },
];
