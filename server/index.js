const express = require("express");
const path = require("path");
const chatRouter = require("./routes/chat");
const uploadRouter = require("./routes/upload");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/chat", chatRouter);
app.use("/api/upload", uploadRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AI Data Visualizer running at http://localhost:${PORT}`);
  });
}

module.exports = app;
