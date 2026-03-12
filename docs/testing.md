# Testing Strategy

> Aigis Data Platform Components Monitor
> AIGIS Platform Team
> Copyright 2025, Polaris Wireless Inc
> Proprietary and Confidential

## Overview

Testing spans three layers: unit tests (Vitest), integration tests (Python pytest),
and benchmark evaluation (10 curated questions).

## Unit Tests (Frontend)

- **Runner**: Vitest
- **Location**: `tests/*.test.js`
- **Scope**: Pure functions in `src/` (data parsing, prompt formatting, code extraction).
- **Run**: `npm run test`

## Integration Tests (Backend)

- **Runner**: pytest
- **Location**: `tests/test_*.py`
- **Scope**: Flask routes, LLM client (with mocked API), prompt template rendering.
- **Run**: `cd server && python -m pytest ../tests/`

## Benchmark Evaluation

- **File**: `tests/benchmark_questions.json`
- **Runner**: `tests/evaluate.py`
- **Scope**: 10 high-quality questions run against each model.
- **Metrics**: Code executes without error, chart type matches request, data accuracy.
- **Models to compare**:
  1. Claude (Anthropic) - frontier baseline
  2. Qwen 80B
  3. GPT 120B OSS
- **Run**: `python tests/evaluate.py --model claude`

## Code Validation and Retry

Generated Plotly.js code is validated and retried on failure:

1. **Backend syntax check**: Before returning, the backend validates JS syntax via
   `scripts/validate-js-syntax.js` (Node). Invalid syntax triggers up to 3 LLM retries
   with the error message fed back into the prompt.
2. **Frontend execution retry**: When `executeChartCode` throws (syntax or runtime),
   the client calls the API again with `previous_code` and `previous_error`, up to 3
   attempts total. The LLM receives the error and previous code to produce a fix.

## Benchmark Questions (Draft - Align with Rodrigo)

See `tests/benchmark_questions.json` for the current set.
Questions cover: bar charts, line charts, scatter plots, pie charts, histograms,
sorted/filtered views, multi-series, time series, aggregations, and combined operations.
