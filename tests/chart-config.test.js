import { describe, it, expect } from "vitest";
import { generateRandomData, buildChartConfig } from "../src/chart-config.js";

describe("generateRandomData", () => {
  it("returns 7 data points by default", () => {
    const result = generateRandomData();
    expect(result.labels).toHaveLength(7);
    expect(result.values).toHaveLength(7);
  });

  it("returns the requested number of data points", () => {
    const result = generateRandomData(3);
    expect(result.labels).toHaveLength(3);
    expect(result.values).toHaveLength(3);
  });

  it("generates values in the range [10, 109]", () => {
    const result = generateRandomData();
    for (const value of result.values) {
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(109);
    }
  });

  it("uses day-of-week labels", () => {
    const result = generateRandomData();
    expect(result.labels[0]).toBe("Mon");
    expect(result.labels[6]).toBe("Sun");
  });
});

describe("buildChartConfig", () => {
  it("creates a bar chart configuration", () => {
    const data = generateRandomData();
    const config = buildChartConfig(data);
    expect(config.type).toBe("bar");
  });

  it("includes the provided data in the dataset", () => {
    const data = { labels: ["A", "B"], values: [10, 20] };
    const config = buildChartConfig(data);
    expect(config.data.labels).toEqual(["A", "B"]);
    expect(config.data.datasets[0].data).toEqual([10, 20]);
  });

  it("has responsive option enabled", () => {
    const data = generateRandomData();
    const config = buildChartConfig(data);
    expect(config.options.responsive).toBe(true);
  });

  it("starts y-axis at zero", () => {
    const data = generateRandomData();
    const config = buildChartConfig(data);
    expect(config.options.scales.y.beginAtZero).toBe(true);
  });
});
