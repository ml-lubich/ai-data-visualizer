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
 * @returns {Promise<object>}
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Request chart code generation (shot 1-2: generate + auto-validate).
 * @param {string} question
 * @param {string[]} columns
 * @param {number} rowCount
 * @param {object[]} sampleRows
 * @returns {Promise<{code: string, model: string, error: string|null, attempts: number}>}
 */
export async function requestVisualization(question, columns, rowCount, sampleRows) {
  const res = await fetch(`${API_BASE}/api/visualize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      columns,
      row_count: rowCount,
      sample_rows: sampleRows,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `API error: ${res.status}`);
  }
  return data;
}

/**
 * Shot 3: Send runtime error back to LLM for a fix attempt.
 * @param {string} question
 * @param {string[]} columns
 * @param {number} rowCount
 * @param {object[]} sampleRows
 * @param {string} failedCode
 * @param {string} runtimeError
 * @returns {Promise<{code: string, model: string, error: string|null, attempts: number}>}
 */
export async function requestRetry(question, columns, rowCount, sampleRows,
                                    failedCode, runtimeError) {
  const res = await fetch(`${API_BASE}/api/visualize/retry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      columns,
      row_count: rowCount,
      sample_rows: sampleRows,
      failed_code: failedCode,
      runtime_error: runtimeError,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Retry API error: ${res.status}`);
  }
  return data;
}
