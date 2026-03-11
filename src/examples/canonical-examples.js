/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * 10 canonical interactive BokehJS chart examples.
 * Each returns executable JS code targeting #visualization-target
 * with data from window.__chartData.
 */

export const CANONICAL_EXAMPLES = [
  {
    id: "Q01",
    question: "Show me a bar chart of total revenue by region",
    type: "Interactive Bar Chart",
    interactions: "Hover tooltips, pan, zoom, tap to highlight",
    code: `
const data = window.__chartData;
const target = document.getElementById("visualization-target");
target.innerHTML = "";

const grouped = {};
for (const row of data) {
  const key = row["region"];
  if (!grouped[key]) grouped[key] = 0;
  grouped[key] += parseFloat(row["revenue"]) || 0;
}
const labels = Object.keys(grouped);
const values = Object.values(grouped);
const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const source = new Bokeh.ColumnDataSource({
  data: { x: labels, top: values, color: colors.slice(0, labels.length) }
});

const fig = Bokeh.Plotting.figure({
  title: "Total Revenue by Region",
  x_range: labels,
  width: 750, height: 420,
  toolbar_location: "above",
  tools: "pan,wheel_zoom,box_zoom,reset,save,hover,tap",
});

const hover = fig.select_one(Bokeh.HoverTool);
hover.tooltips = [["Region", "@x"], ["Revenue", "$@{top}{0,0.00}"]];

fig.vbar({ x: { field: "x" }, top: { field: "top" }, width: 0.7, source: source,
  fill_color: { field: "color" }, line_color: "#1e293b", fill_alpha: 0.85 });

Bokeh.Plotting.show(fig, "#visualization-target");
`,
  },
  {
    id: "Q02",
    question: "Show me a sortable data table of all sales",
    type: "Interactive Data Table",
    interactions: "Click column headers to sort, scroll through rows",
    code: `
const data = window.__chartData;
const target = document.getElementById("visualization-target");
target.innerHTML = "";

const columns_data = { date: [], region: [], product: [], units_sold: [], revenue: [], cost: [], profit: [] };
for (const row of data) {
  columns_data.date.push(row.date);
  columns_data.region.push(row.region);
  columns_data.product.push(row.product);
  columns_data.units_sold.push(row.units_sold);
  columns_data.revenue.push(parseFloat(row.revenue));
  columns_data.cost.push(parseFloat(row.cost));
  columns_data.profit.push((parseFloat(row.revenue) - parseFloat(row.cost)).toFixed(2));
}

const source = new Bokeh.ColumnDataSource({ data: columns_data });

const columns = [
  new Bokeh.Tables.TableColumn({ field: "date", title: "Date", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "region", title: "Region", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "product", title: "Product", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "units_sold", title: "Units Sold", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "revenue", title: "Revenue ($)", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "cost", title: "Cost ($)", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "profit", title: "Profit ($)", sortable: true }),
];

const table = new Bokeh.Tables.DataTable({
  source: source,
  columns: columns,
  width: 750,
  height: 420,
  sortable: true,
  selectable: true,
  index_position: null,
});

Bokeh.Plotting.show(table, "#visualization-target");
`,
  },
  {
    id: "Q03",
    question: "Show me a line chart of monthly revenue trends over time",
    type: "Interactive Line Chart",
    interactions: "Hover for values, wheel-zoom, pan, box-zoom on time axis",
    code: `
const data = window.__chartData;
const target = document.getElementById("visualization-target");
target.innerHTML = "";

const monthly = {};
for (const row of data) {
  const month = row.date.substring(0, 7);
  if (!monthly[month]) monthly[month] = 0;
  monthly[month] += parseFloat(row.revenue) || 0;
}
const months = Object.keys(monthly).sort();
const revenues = months.map(m => monthly[m]);
const indices = months.map((_, i) => i);

const source = new Bokeh.ColumnDataSource({
  data: { x: indices, y: revenues, month: months }
});

const fig = Bokeh.Plotting.figure({
  title: "Monthly Revenue Trend",
  width: 750, height: 420,
  toolbar_location: "above",
  tools: "pan,wheel_zoom,box_zoom,reset,save,hover,crosshair",
  x_range: [-0.5, months.length - 0.5],
});

const hover = fig.select_one(Bokeh.HoverTool);
hover.tooltips = [["Month", "@month"], ["Revenue", "$@{y}{0,0.00}"]];
hover.mode = "vline";

fig.line({ x: { field: "x" }, y: { field: "y" }, source: source,
  line_width: 3, line_color: "#3b82f6" });
fig.scatter({ x: { field: "x" }, y: { field: "y" }, source: source,
  size: 10, fill_color: "#3b82f6", line_color: "#1e293b" });

Bokeh.Plotting.show(fig, "#visualization-target");
`,
  },
  {
    id: "Q04",
    question: "Show me a scatter plot of units sold vs revenue, colored by product",
    type: "Interactive Scatter Plot",
    interactions: "Hover for details, box-select points, lasso-select, tap to highlight",
    code: `
const data = window.__chartData;
const target = document.getElementById("visualization-target");
target.innerHTML = "";

const colorMap = { "Widget A": "#3b82f6", "Widget B": "#10b981", "Widget C": "#f59e0b" };
const xs = [], ys = [], products = [], regions = [], colors = [];
for (const row of data) {
  xs.push(row.units_sold);
  ys.push(parseFloat(row.revenue));
  products.push(row.product);
  regions.push(row.region);
  colors.push(colorMap[row.product] || "#94a3b8");
}

const source = new Bokeh.ColumnDataSource({
  data: { x: xs, y: ys, product: products, region: regions, color: colors }
});

const fig = Bokeh.Plotting.figure({
  title: "Units Sold vs Revenue (by Product)",
  width: 750, height: 420,
  toolbar_location: "above",
  tools: "pan,wheel_zoom,box_zoom,box_select,lasso_select,reset,save,hover,tap",
});

const hover = fig.select_one(Bokeh.HoverTool);
hover.tooltips = [
  ["Product", "@product"], ["Region", "@region"],
  ["Units", "@x"], ["Revenue", "$@{y}{0,0.00}"]
];

fig.scatter({ x: { field: "x" }, y: { field: "y" }, source: source,
  size: 14, fill_color: { field: "color" }, line_color: "#1e293b",
  fill_alpha: 0.8, selection_fill_alpha: 1.0,
  nonselection_fill_alpha: 0.2, nonselection_fill_color: "#94a3b8" });

Bokeh.Plotting.show(fig, "#visualization-target");
`,
  },
  {
    id: "Q05",
    question: "Show me a pie chart of revenue share by product",
    type: "Interactive Pie / Wedge Chart",
    interactions: "Hover for percentage and amount",
    code: `
const data = window.__chartData;
const target = document.getElementById("visualization-target");
target.innerHTML = "";

const grouped = {};
for (const row of data) {
  if (!grouped[row.product]) grouped[row.product] = 0;
  grouped[row.product] += parseFloat(row.revenue) || 0;
}
const labels = Object.keys(grouped);
const values = Object.values(grouped);
const total = values.reduce((a, b) => a + b, 0);
const percents = values.map(v => ((v / total) * 100).toFixed(1));
const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const starts = [0];
const ends = [];
for (let i = 0; i < values.length; i++) {
  const angle = (values[i] / total) * 2 * Math.PI;
  ends.push(starts[i] + angle);
  if (i < values.length - 1) starts.push(ends[i]);
}

const source = new Bokeh.ColumnDataSource({
  data: {
    start: starts, end: ends,
    color: colors.slice(0, labels.length),
    label: labels, value: values, percent: percents,
  }
});

const fig = Bokeh.Plotting.figure({
  title: "Revenue Share by Product",
  width: 550, height: 450,
  toolbar_location: "above",
  tools: "hover,save,reset",
  x_range: [-1.2, 1.8],
  y_range: [-1.2, 1.2],
});

const hover = fig.select_one(Bokeh.HoverTool);
hover.tooltips = [["Product", "@label"], ["Revenue", "$@{value}{0,0.00}"], ["Share", "@percent%"]];

fig.wedge({ x: 0, y: 0, radius: 0.95,
  start_angle: { field: "start" }, end_angle: { field: "end" },
  fill_color: { field: "color" }, line_color: "#1e293b",
  fill_alpha: 0.85, source: source });

Bokeh.Plotting.show(fig, "#visualization-target");
`,
  },
  {
    id: "Q06",
    question: "Show me a stacked bar chart of revenue by month, broken down by product",
    type: "Interactive Stacked Bar Chart",
    interactions: "Hover for breakdown values, pan, zoom",
    code: `
const data = window.__chartData;
const target = document.getElementById("visualization-target");
target.innerHTML = "";

const products = [...new Set(data.map(r => r.product))].sort();
const months = [...new Set(data.map(r => r.date.substring(0, 7)))].sort();
const colorMap = { "Widget A": "#3b82f6", "Widget B": "#10b981", "Widget C": "#f59e0b" };

const stacked = {};
for (const m of months) stacked[m] = {};
for (const row of data) {
  const m = row.date.substring(0, 7);
  if (!stacked[m][row.product]) stacked[m][row.product] = 0;
  stacked[m][row.product] += parseFloat(row.revenue) || 0;
}

const fig = Bokeh.Plotting.figure({
  title: "Monthly Revenue by Product (Stacked)",
  x_range: months, width: 750, height: 420,
  toolbar_location: "above",
  tools: "pan,wheel_zoom,box_zoom,reset,save,hover",
});

const hover = fig.select_one(Bokeh.HoverTool);
hover.tooltips = [["Month", "@month"], ["Product", "@product"], ["Revenue", "$@{top}{0,0.00}"]];

let bottoms = months.map(() => 0);
for (const prod of products) {
  const tops = months.map((m, i) => bottoms[i] + (stacked[m][prod] || 0));
  const vals = months.map(m => stacked[m][prod] || 0);
  const src = new Bokeh.ColumnDataSource({
    data: { x: months, bottom: [...bottoms], top: tops, month: months,
      product: months.map(() => prod), topval: vals }
  });
  fig.vbar({ x: { field: "x" }, bottom: { field: "bottom" }, top: { field: "top" },
    width: 0.7, source: src, fill_color: colorMap[prod] || "#94a3b8",
    line_color: "#1e293b", fill_alpha: 0.85,
    legend_label: prod });
  bottoms = tops;
}

fig.legend.click_policy = "hide";
fig.legend.location = "top_left";

Bokeh.Plotting.show(fig, "#visualization-target");
`,
  },
  {
    id: "Q07",
    question: "Show me a histogram of individual sale revenue amounts",
    type: "Interactive Histogram",
    interactions: "Hover for bin range and count, zoom into distribution",
    code: `
const data = window.__chartData;
const target = document.getElementById("visualization-target");
target.innerHTML = "";

const revenues = data.map(r => parseFloat(r.revenue));
const min = Math.min(...revenues);
const max = Math.max(...revenues);
const binCount = 8;
const binWidth = (max - min) / binCount;

const bins = [];
for (let i = 0; i < binCount; i++) {
  const lo = min + i * binWidth;
  const hi = lo + binWidth;
  const count = revenues.filter(v => v >= lo && (i === binCount - 1 ? v <= hi : v < hi)).length;
  bins.push({ left: lo, right: hi, top: count,
    range: "$" + lo.toFixed(0) + " - $" + hi.toFixed(0) });
}

const source = new Bokeh.ColumnDataSource({
  data: {
    left: bins.map(b => b.left), right: bins.map(b => b.right),
    top: bins.map(b => b.top), range: bins.map(b => b.range),
  }
});

const fig = Bokeh.Plotting.figure({
  title: "Distribution of Sale Revenue Amounts",
  width: 750, height: 420,
  toolbar_location: "above",
  tools: "pan,wheel_zoom,box_zoom,reset,save,hover",
});

const hover = fig.select_one(Bokeh.HoverTool);
hover.tooltips = [["Range", "@range"], ["Count", "@top"]];

fig.quad({ left: { field: "left" }, right: { field: "right" },
  top: { field: "top" }, bottom: 0, source: source,
  fill_color: "#818cf8", line_color: "#1e293b", fill_alpha: 0.8 });

Bokeh.Plotting.show(fig, "#visualization-target");
`,
  },
  {
    id: "Q08",
    question: "Show me a multi-line chart of monthly revenue per product (click legend to toggle)",
    type: "Interactive Multi-Line with Legend Toggle",
    interactions: "Click legend entries to show/hide lines, hover for values",
    code: `
const data = window.__chartData;
const target = document.getElementById("visualization-target");
target.innerHTML = "";

const products = [...new Set(data.map(r => r.product))].sort();
const months = [...new Set(data.map(r => r.date.substring(0, 7)))].sort();
const colorMap = { "Widget A": "#3b82f6", "Widget B": "#10b981", "Widget C": "#f59e0b" };
const indices = months.map((_, i) => i);

const fig = Bokeh.Plotting.figure({
  title: "Monthly Revenue per Product (Click Legend to Toggle)",
  width: 750, height: 420,
  toolbar_location: "above",
  tools: "pan,wheel_zoom,box_zoom,reset,save,crosshair",
  x_range: [-0.5, months.length - 0.5],
});

for (const prod of products) {
  const monthly = {};
  for (const row of data) {
    if (row.product !== prod) continue;
    const m = row.date.substring(0, 7);
    if (!monthly[m]) monthly[m] = 0;
    monthly[m] += parseFloat(row.revenue) || 0;
  }
  const ys = months.map(m => monthly[m] || 0);
  const src = new Bokeh.ColumnDataSource({
    data: { x: indices, y: ys, month: months, product: months.map(() => prod) }
  });
  fig.line({ x: { field: "x" }, y: { field: "y" }, source: src,
    line_width: 3, line_color: colorMap[prod], legend_label: prod });
  fig.scatter({ x: { field: "x" }, y: { field: "y" }, source: src,
    size: 8, fill_color: colorMap[prod], line_color: "#1e293b", legend_label: prod });
}

fig.legend.click_policy = "hide";
fig.legend.location = "top_left";

const ht = new Bokeh.HoverTool({ tooltips: [["Product", "@product"], ["Month", "@month"], ["Revenue", "$@{y}{0,0.00}"]], mode: "mouse" });
fig.add_tools(ht);

Bokeh.Plotting.show(fig, "#visualization-target");
`,
  },
  {
    id: "Q09",
    question: "Show me a horizontal bar chart of the top regions by total units sold, sorted",
    type: "Interactive Horizontal Bar Chart (Sorted)",
    interactions: "Hover for exact values, sorted descending",
    code: `
const data = window.__chartData;
const target = document.getElementById("visualization-target");
target.innerHTML = "";

const grouped = {};
for (const row of data) {
  if (!grouped[row.region]) grouped[row.region] = 0;
  grouped[row.region] += parseInt(row.units_sold) || 0;
}

const sorted = Object.entries(grouped).sort((a, b) => a[1] - b[1]);
const labels = sorted.map(e => e[0]);
const values = sorted.map(e => e[1]);
const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"];

const source = new Bokeh.ColumnDataSource({
  data: { y: labels, right: values, color: colors.slice(0, labels.length) }
});

const fig = Bokeh.Plotting.figure({
  title: "Regions by Total Units Sold (Sorted)",
  y_range: labels,
  width: 750, height: 420,
  toolbar_location: "above",
  tools: "pan,wheel_zoom,box_zoom,reset,save,hover",
});

const hover = fig.select_one(Bokeh.HoverTool);
hover.tooltips = [["Region", "@y"], ["Units Sold", "@right{0,0}"]];

fig.hbar({ y: { field: "y" }, right: { field: "right" }, height: 0.6, source: source,
  fill_color: { field: "color" }, line_color: "#1e293b", fill_alpha: 0.85 });

Bokeh.Plotting.show(fig, "#visualization-target");
`,
  },
  {
    id: "Q10",
    question: "Show me profit margin by product as a bar chart with a summary stats table below",
    type: "Interactive Dashboard (Chart + Table)",
    interactions: "Hover chart bars, sort the table, linked data",
    code: `
const data = window.__chartData;
const target = document.getElementById("visualization-target");
target.innerHTML = "";

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
const margins = products.map(p => ((stats[p].revenue - stats[p].cost) / stats[p].revenue * 100).toFixed(1));
const colors = profits.map(p => p >= 0 ? "#10b981" : "#ef4444");

const barSrc = new Bokeh.ColumnDataSource({
  data: { x: products, top: profits, margin: margins, color: colors }
});

const fig = Bokeh.Plotting.figure({
  title: "Total Profit by Product",
  x_range: products, width: 750, height: 300,
  toolbar_location: "above",
  tools: "pan,wheel_zoom,box_zoom,reset,save,hover",
});

const hover = fig.select_one(Bokeh.HoverTool);
hover.tooltips = [["Product", "@x"], ["Profit", "$@{top}{0,0.00}"], ["Margin", "@margin%"]];

fig.vbar({ x: { field: "x" }, top: { field: "top" }, width: 0.6, source: barSrc,
  fill_color: { field: "color" }, line_color: "#1e293b", fill_alpha: 0.85 });

const tableSrc = new Bokeh.ColumnDataSource({
  data: {
    product: products,
    revenue: products.map(p => stats[p].revenue.toFixed(2)),
    cost: products.map(p => stats[p].cost.toFixed(2)),
    profit: profits.map(p => p.toFixed(2)),
    margin: margins.map(m => m + "%"),
    units: products.map(p => stats[p].units),
    transactions: products.map(p => stats[p].count),
  }
});

const cols = [
  new Bokeh.Tables.TableColumn({ field: "product", title: "Product", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "revenue", title: "Revenue ($)", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "cost", title: "Cost ($)", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "profit", title: "Profit ($)", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "margin", title: "Margin", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "units", title: "Units", sortable: true }),
  new Bokeh.Tables.TableColumn({ field: "transactions", title: "Txns", sortable: true }),
];

const table = new Bokeh.Tables.DataTable({
  source: tableSrc, columns: cols,
  width: 750, height: 150,
  sortable: true, selectable: true, index_position: null,
});

const layout = new Bokeh.Column({ children: [fig, table] });
Bokeh.Plotting.show(layout, "#visualization-target");
`,
  },
];
