const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  buildUserPrompt,
  parseLLMResponse,
  buildFallbackResponse,
} = require("../server/services/llm");

describe("LLM Service", () => {
  describe("buildUserPrompt", () => {
    it("includes user message", () => {
      const prompt = buildUserPrompt("Show a bar chart", null, null);
      assert.ok(prompt.includes("Show a bar chart"));
    });

    it("includes columns when provided", () => {
      const prompt = buildUserPrompt("Chart", null, ["x", "y"]);
      assert.ok(prompt.includes('"x"'));
      assert.ok(prompt.includes('"y"'));
    });

    it("includes data sample when provided", () => {
      const data = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
      const prompt = buildUserPrompt("Chart", data, ["x", "y"]);
      assert.ok(prompt.includes("Data sample"));
      assert.ok(prompt.includes("Total rows: 2"));
    });

    it("limits data sample to 50 rows", () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ x: i }));
      const prompt = buildUserPrompt("Chart", data, ["x"]);
      assert.ok(prompt.includes("first 50 rows"));
      assert.ok(prompt.includes("Total rows: 100"));
    });
  });

  describe("parseLLMResponse", () => {
    it("parses valid JSON response", () => {
      const raw = JSON.stringify({
        content: [{ type: "text", text: '{"reply":"A chart","code":"console.log(1)"}' }],
      });
      const result = parseLLMResponse(raw);
      assert.equal(result.reply, "A chart");
      assert.equal(result.code, "console.log(1)");
    });

    it("strips markdown fencing", () => {
      const raw = JSON.stringify({
        content: [{ type: "text", text: '```json\n{"reply":"ok","code":"x"}\n```' }],
      });
      const result = parseLLMResponse(raw);
      assert.equal(result.reply, "ok");
    });

    it("throws on empty content", () => {
      const raw = JSON.stringify({ content: [{ type: "text", text: "" }] });
      assert.throws(() => parseLLMResponse(raw));
    });
  });

  describe("buildFallbackResponse", () => {
    it("returns demo chart when no data provided", () => {
      const result = buildFallbackResponse("Show something", null, null);
      assert.ok(result.reply.includes("sample data"));
      assert.ok(result.code.includes("Bokeh.Plotting"));
    });

    it("returns bar chart when message mentions bar", () => {
      const data = [{ region: "A", sales: 10 }];
      const result = buildFallbackResponse("bar chart", data, ["region", "sales"]);
      assert.ok(result.reply.includes("bar"));
      assert.ok(result.code.includes("vbar"));
    });

    it("returns line chart when message mentions trend", () => {
      const data = [{ date: "2024-01", value: 10 }];
      const result = buildFallbackResponse("trend over time", data, ["date", "value"]);
      assert.ok(result.code.includes("line"));
    });

    it("returns scatter chart by default with data", () => {
      const data = [{ x: 1, y: 2 }];
      const result = buildFallbackResponse("visualize this", data, ["x", "y"]);
      assert.ok(result.code.includes("scatter"));
    });
  });
});
