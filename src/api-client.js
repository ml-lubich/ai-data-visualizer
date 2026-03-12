/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * HTTP client for the Python backend API.
 */

const API_BASE = "http://localhost:5001";

/**
 * Check backend health.
 * @returns {Promise<{status: string, llm_configured: boolean}>}
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Request chart code generation from the backend.
 * @param {string} question - Natural language visualization request.
 * @param {string[]} columns - Column names from the dataset.
 * @param {number} rowCount - Total number of rows.
 * @param {object[]} sampleRows - First N rows of data.
 * @param {{ previousCode?: string, previousError?: string }} [retry] - For retry when previous execution failed.
 * @returns {Promise<{code: string, model: string, error: string|null}>}
 */
export async function requestVisualization(question, columns, rowCount, sampleRows, retry = {}) {
  const payload = {
    question,
    columns,
    row_count: rowCount,
    sample_rows: sampleRows,
  };
  if (retry.previousCode != null && retry.previousError != null) {
    payload.previous_code = retry.previousCode;
    payload.previous_error = retry.previousError;
  }

  const res = await fetch(`${API_BASE}/api/visualize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error: ${res.status}`);
  }

  return data;
}
