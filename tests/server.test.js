const http = require("http");
const app = require("../server");

let server;
let baseUrl;

beforeAll((done) => {
  server = http.createServer(app);
  server.listen(0, () => {
    const { port } = server.address();
    baseUrl = `http://localhost:${port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

describe("GET /api/health", () => {
  test("returns 200 with status ok", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });
});

describe("POST /api/chat", () => {
  test("returns 400 when messages is missing", async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/messages/i);
  });

  test("returns 400 when messages is not an array", async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: "not-an-array" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/messages/i);
  });

  test("returns 500 when API key is not configured", async () => {
    // API key is not set in test environment
    const original = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/OPENROUTER_API_KEY/);

    // Restore
    if (original) process.env.OPENROUTER_API_KEY = original;
  });
});

describe("Static files", () => {
  test("serves index.html at root", async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("AI Data Visualizer");
  });

  test("serves CSS file", async () => {
    const res = await fetch(`${baseUrl}/css/style.css`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("chart-area");
  });

  test("serves JS file", async () => {
    const res = await fetch(`${baseUrl}/js/app.js`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("extractCodeBlock");
  });
});
