const express = require("express");
const multer = require("multer");
const { parseCSV } = require("../services/parser");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/upload
 * Accepts a CSV file upload and returns the parsed data as JSON.
 */
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const text = req.file.buffer.toString("utf-8");
    const { columns, rows } = parseCSV(text);
    return res.json({ columns, rows, filename: req.file.originalname });
  } catch (err) {
    console.error("Upload parse error:", err);
    return res.status(400).json({ error: "Failed to parse CSV file" });
  }
});

module.exports = router;
