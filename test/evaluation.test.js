/**
 * Evaluation Test Harness
 *
 * 10 high-quality visualization questions used to evaluate LLM performance.
 * Each question has a description, sample data, and expected chart characteristics.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node test/evaluation.test.js
 *
 * Without an API key, tests run against the fallback generator to verify the
 * harness structure. With an API key, tests validate real LLM outputs.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { generateVisualization } = require("../server/services/llm");

const EVALUATION_QUESTIONS = [
  {
    id: 1,
    message: "Create a bar chart showing sales by region",
    columns: ["region", "sales"],
    data: [
      { region: "North", sales: 120 },
      { region: "South", sales: 95 },
      { region: "East", sales: 150 },
      { region: "West", sales: 110 },
    ],
    expect: { chartType: "bar", mentionsColumns: ["region", "sales"] },
  },
  {
    id: 2,
    message: "Show me a line chart of monthly revenue over time",
    columns: ["month", "revenue"],
    data: [
      { month: "Jan", revenue: 4000 },
      { month: "Feb", revenue: 4200 },
      { month: "Mar", revenue: 3800 },
      { month: "Apr", revenue: 5100 },
      { month: "May", revenue: 4800 },
      { month: "Jun", revenue: 5500 },
    ],
    expect: { chartType: "line", mentionsColumns: ["month", "revenue"] },
  },
  {
    id: 3,
    message: "Create a scatter plot of height vs weight",
    columns: ["height_cm", "weight_kg"],
    data: [
      { height_cm: 160, weight_kg: 55 },
      { height_cm: 170, weight_kg: 65 },
      { height_cm: 180, weight_kg: 80 },
      { height_cm: 175, weight_kg: 72 },
      { height_cm: 165, weight_kg: 60 },
    ],
    expect: { chartType: "scatter", mentionsColumns: ["height_cm", "weight_kg"] },
  },
  {
    id: 4,
    message: "Show the top 5 products by quantity sold as a horizontal bar chart",
    columns: ["product", "quantity"],
    data: [
      { product: "Widget A", quantity: 340 },
      { product: "Widget B", quantity: 220 },
      { product: "Widget C", quantity: 510 },
      { product: "Gadget X", quantity: 180 },
      { product: "Gadget Y", quantity: 420 },
      { product: "Tool Z", quantity: 290 },
    ],
    expect: { chartType: "bar", mentionsColumns: ["product", "quantity"] },
  },
  {
    id: 5,
    message: "Plot temperature and humidity on the same chart with dual axes",
    columns: ["date", "temperature", "humidity"],
    data: [
      { date: "2024-01-01", temperature: 5, humidity: 80 },
      { date: "2024-02-01", temperature: 7, humidity: 75 },
      { date: "2024-03-01", temperature: 12, humidity: 65 },
      { date: "2024-04-01", temperature: 18, humidity: 60 },
      { date: "2024-05-01", temperature: 22, humidity: 55 },
    ],
    expect: { chartType: "line", mentionsColumns: ["temperature", "humidity"] },
  },
  {
    id: 6,
    message: "Filter the data to only show entries where score > 80 and plot as a bar chart",
    columns: ["name", "score"],
    data: [
      { name: "Alice", score: 92 },
      { name: "Bob", score: 75 },
      { name: "Carol", score: 88 },
      { name: "Dave", score: 65 },
      { name: "Eve", score: 95 },
    ],
    expect: { chartType: "bar", mentionsColumns: ["name", "score"] },
  },
  {
    id: 7,
    message: "Sort by population descending and show the top 5 countries as a bar chart",
    columns: ["country", "population"],
    data: [
      { country: "China", population: 1400000000 },
      { country: "India", population: 1380000000 },
      { country: "USA", population: 331000000 },
      { country: "Indonesia", population: 273000000 },
      { country: "Pakistan", population: 220000000 },
      { country: "Brazil", population: 212000000 },
      { country: "Nigeria", population: 206000000 },
    ],
    expect: { chartType: "bar", mentionsColumns: ["country", "population"] },
  },
  {
    id: 8,
    message: "Show a grouped comparison of Q1 and Q2 revenue by department",
    columns: ["department", "q1_revenue", "q2_revenue"],
    data: [
      { department: "Engineering", q1_revenue: 50000, q2_revenue: 55000 },
      { department: "Marketing", q1_revenue: 30000, q2_revenue: 35000 },
      { department: "Sales", q1_revenue: 70000, q2_revenue: 80000 },
      { department: "HR", q1_revenue: 20000, q2_revenue: 22000 },
    ],
    expect: { chartType: "bar", mentionsColumns: ["department", "q1_revenue"] },
  },
  {
    id: 9,
    message: "Visualize the distribution of exam scores using a histogram",
    columns: ["student_id", "score"],
    data: Array.from({ length: 30 }, (_, i) => ({
      student_id: i + 1,
      score: Math.round(50 + Math.random() * 50),
    })),
    expect: { chartType: "bar", mentionsColumns: ["score"] },
  },
  {
    id: 10,
    message: "Create a chart that shows the relationship between advertising spend and conversions with a trend line",
    columns: ["ad_spend", "conversions"],
    data: [
      { ad_spend: 100, conversions: 10 },
      { ad_spend: 200, conversions: 18 },
      { ad_spend: 300, conversions: 25 },
      { ad_spend: 400, conversions: 35 },
      { ad_spend: 500, conversions: 42 },
      { ad_spend: 600, conversions: 48 },
    ],
    expect: { chartType: "scatter", mentionsColumns: ["ad_spend", "conversions"] },
  },
];

describe("Evaluation Questions", () => {
  for (const q of EVALUATION_QUESTIONS) {
    it(`Q${q.id}: ${q.message}`, async () => {
      const result = await generateVisualization({
        message: q.message,
        data: q.data,
        columns: q.columns,
      });

      // Basic structural assertions
      assert.ok(result.reply, "Should have a reply");
      assert.ok(typeof result.reply === "string", "Reply should be a string");
      assert.ok(result.code, "Should have generated code");
      assert.ok(result.code.includes("Bokeh"), "Code should reference Bokeh");
      assert.ok(
        result.code.includes("chart-output"),
        "Code should target the chart-output element"
      );
    });
  }
});

// Export for programmatic use
module.exports = { EVALUATION_QUESTIONS };
