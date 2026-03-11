const express = require("express");
const { generateVisualization } = require("../services/llm");

const router = express.Router();

/**
 * POST /api/chat
 * Body: { message: string, data: object[] | null, columns: string[] | null }
 * Returns: { reply: string, code: string | null }
 *
 * Sends the user message and optional dataset context to the LLM,
 * which returns BokehJS JavaScript code to render the requested chart.
 */
router.post("/", async (req, res) => {
  const { message, data, columns } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const result = await generateVisualization({ message, data, columns });
    return res.json(result);
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: "Failed to generate visualization" });
  }
});

module.exports = router;
