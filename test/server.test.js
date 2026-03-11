const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const app = require("../server/index");

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: options.method || "GET",
      headers: options.headers || {},
    };
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

describe("Server API", () => {
  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("GET /health returns ok", async () => {
    const res = await request("/health");
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, "ok");
  });

  it("GET / serves index.html", async () => {
    const res = await request("/");
    assert.equal(res.status, 200);
    assert.ok(res.body.includes("AI Data Visualizer"));
  });

  it("POST /api/chat requires message", async () => {
    const res = await request("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400);
  });

  it("POST /api/chat returns visualization (fallback mode)", async () => {
    const res = await request("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Show a scatter plot",
        data: [{ x: 1, y: 2 }, { x: 3, y: 4 }],
        columns: ["x", "y"],
      }),
    });
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.reply);
    assert.ok(body.code);
    assert.ok(body.code.includes("Bokeh"));
  });

  it("POST /api/upload rejects missing file", async () => {
    const res = await request("/api/upload", { method: "POST" });
    assert.equal(res.status, 400);
  });
});
