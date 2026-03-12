import { describe, it, expect, beforeEach } from "vitest";
import { executeChartCode } from "../src/visualizer.js";

describe("executeChartCode", () => {
  beforeEach(() => {
    const target = document.createElement("div");
    target.id = "visualization-target";
    document.body.innerHTML = "";
    document.body.appendChild(target);
  });

  it("sets window.__chartData before executing code", () => {
    const testData = [{ a: 1 }, { a: 2 }];
    executeChartCode("", testData);
    expect(window.__chartData).toEqual(testData);
  });

  it("returns success:true when code produces visible content", () => {
    const code = 'document.getElementById("visualization-target").innerHTML = "<div>chart</div>";';
    const result = executeChartCode(code, []);
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  it("returns success:false with error detail for throwing code", () => {
    const result = executeChartCode("throw new Error('test failure');", []);
    expect(result.success).toBe(false);
    expect(result.error).toContain("test failure");
  });

  it("clears the target element before execution", () => {
    const target = document.getElementById("visualization-target");
    target.innerHTML = "<p>old content</p>";
    executeChartCode("", []);
    expect(target.innerHTML).toBe("");
  });

  it("detects when code produces no visible output", () => {
    const result = executeChartCode("const x = 1;", []);
    expect(result.success).toBe(false);
    expect(result.error).toContain("no visible chart");
  });
});
