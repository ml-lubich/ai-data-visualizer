"""
Aigis Data Platform Components Monitor
AIGIS Platform Team
Copyright 2025, Polaris Wireless Inc
Proprietary and Confidential

Benchmark evaluation runner for AI chart generation.
Runs the 10 benchmark questions against the backend and reports results.

Usage:
    python tests/evaluate.py [--model claude] [--base-url http://localhost:5001]
"""

import argparse
import csv
import json
import sys
import time
from pathlib import Path

import requests

BENCHMARK_FILE = Path(__file__).parent / "benchmark_questions.json"
SAMPLE_DATA = Path(__file__).parent.parent / "sample_data" / "sales.csv"


def load_benchmark():
    """Load the benchmark questions JSON."""
    with open(BENCHMARK_FILE) as f:
        return json.load(f)


def load_csv_data(csv_path: Path) -> tuple[list[str], int, list[dict]]:
    """Load CSV and return (columns, row_count, sample_rows)."""
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    columns = list(rows[0].keys()) if rows else []
    return columns, len(rows), rows[:5]


def run_question(base_url: str, question: str, columns: list[str],
                 row_count: int, sample_rows: list[dict]) -> dict:
    """Send a single question to the API and return the result."""
    start = time.time()
    try:
        resp = requests.post(
            f"{base_url}/api/visualize",
            json={
                "question": question,
                "columns": columns,
                "row_count": row_count,
                "sample_rows": sample_rows,
            },
            timeout=60,
        )
        elapsed = time.time() - start
        data = resp.json()
        return {
            "status": "ok" if resp.ok and data.get("code") else "error",
            "model": data.get("model", "unknown"),
            "code_length": len(data.get("code", "")),
            "error": data.get("error"),
            "elapsed_seconds": round(elapsed, 2),
        }
    except Exception as exc:
        return {
            "status": "error",
            "model": "unknown",
            "code_length": 0,
            "error": str(exc),
            "elapsed_seconds": round(time.time() - start, 2),
        }


def main():
    parser = argparse.ArgumentParser(description="Run benchmark evaluation")
    parser.add_argument("--base-url", default="http://localhost:5001")
    parser.add_argument("--model", default="claude", help="Model label for reporting")
    args = parser.parse_args()

    benchmark = load_benchmark()
    columns, row_count, sample_rows = load_csv_data(SAMPLE_DATA)

    print(f"Running {len(benchmark['questions'])} benchmark questions against {args.base_url}")
    print(f"Model: {args.model} | Dataset: {benchmark['dataset']}")
    print("-" * 70)

    results = []
    passed = 0

    for q in benchmark["questions"]:
        result = run_question(args.base_url, q["question"], columns, row_count, sample_rows)
        result["id"] = q["id"]
        result["question"] = q["question"]
        result["difficulty"] = q["difficulty"]
        results.append(result)

        status_icon = "PASS" if result["status"] == "ok" else "FAIL"
        if result["status"] == "ok":
            passed += 1
        print(f"  [{status_icon}] {q['id']}: {q['question'][:50]}... "
              f"({result['elapsed_seconds']}s, {result['code_length']} chars)")

    print("-" * 70)
    print(f"Results: {passed}/{len(results)} passed")

    output_path = Path(__file__).parent / f"eval_results_{args.model}_{int(time.time())}.json"
    with open(output_path, "w") as f:
        json.dump({"model": args.model, "results": results, "passed": passed,
                    "total": len(results)}, f, indent=2)
    print(f"Detailed results saved to {output_path}")

    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
