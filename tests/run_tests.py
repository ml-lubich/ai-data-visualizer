"""
Test automation for AI Data Visualizer.

Runs 10 predefined questions from test_questions.json against a running server
(default: http://localhost:5000) using sample_data.csv, and reports results.

Usage:
    # Start the server first:
    #   cd .. && python server.py
    python run_tests.py [--server http://localhost:5000] [--out results.json]
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import requests

SCRIPT_DIR   = Path(__file__).parent
QUESTIONS    = SCRIPT_DIR / "test_questions.json"
SAMPLE_DATA  = SCRIPT_DIR / "sample_data.csv"
RESULTS_DIR  = SCRIPT_DIR / "results"


def upload_data(base_url: str) -> bool:
    """Upload sample_data.csv to the server."""
    with open(SAMPLE_DATA, "rb") as f:
        resp = requests.post(
            f"{base_url}/api/upload",
            files={"file": ("sample_data.csv", f, "text/csv")},
            timeout=30,
        )
    if resp.status_code == 200 and resp.json().get("success"):
        data = resp.json()
        print(f"✅ Data uploaded: {data['rows']} rows, {len(data['columns'])} columns")
        return True
    print(f"❌ Upload failed: {resp.text}")
    return False


def run_question(base_url: str, question: dict) -> dict:
    """Run a single test question and return the result."""
    qid  = question["id"]
    text = question["question"]
    print(f"  [{qid:02d}] {text[:70]}{'…' if len(text) > 70 else ''}", end=" ", flush=True)

    t0 = time.time()
    try:
        resp = requests.post(
            f"{base_url}/api/visualize",
            json={"message": text},
            timeout=60,
        )
        elapsed = round(time.time() - t0, 2)
        body    = resp.json()

        if resp.status_code == 200 and body.get("success"):
            has_plot = bool(body.get("plot"))
            print(f"✅  ({elapsed}s)")
            return {
                "id": qid,
                "status": "pass",
                "elapsed_s": elapsed,
                "has_plot": has_plot,
                "code_lines": len(body.get("code", "").splitlines()),
            }
        else:
            error = body.get("error", "unknown error")
            print(f"❌  ({elapsed}s) {error}")
            return {
                "id": qid,
                "status": "fail",
                "elapsed_s": elapsed,
                "error": error,
                "code": body.get("code", ""),
            }
    except requests.exceptions.Timeout:
        print("⏱  (timeout)")
        return {"id": qid, "status": "timeout", "elapsed_s": 60}
    except Exception as exc:
        print(f"💥  {exc}")
        return {"id": qid, "status": "error", "error": str(exc)}


def main():
    parser = argparse.ArgumentParser(description="Run AI Data Visualizer test suite")
    parser.add_argument("--server", default="http://localhost:5000", help="Server base URL")
    parser.add_argument("--out", default="", help="Path to save JSON results (optional)")
    args = parser.parse_args()

    base_url = args.server.rstrip("/")

    # Check server is up
    try:
        resp = requests.get(f"{base_url}/api/status", timeout=5)
        resp.raise_for_status()
    except Exception as exc:
        print(f"❌ Cannot reach server at {base_url}: {exc}")
        print("   Start the server with:  python server.py")
        sys.exit(1)

    print(f"\n🚀 AI Data Visualizer — Test Suite")
    print(f"   Server : {base_url}")
    print(f"   Model  : {resp.json().get('model', 'unknown')}")
    print(f"   Data   : {SAMPLE_DATA.name}\n")

    # Upload data
    if not upload_data(base_url):
        sys.exit(1)

    # Load questions
    questions = json.loads(QUESTIONS.read_text())
    print(f"\nRunning {len(questions)} questions…\n")

    results = []
    for q in questions:
        result = run_question(base_url, q)
        result["description"] = q["description"]
        results.append(result)

    # Summary
    passed  = sum(1 for r in results if r["status"] == "pass")
    failed  = sum(1 for r in results if r["status"] == "fail")
    errored = sum(1 for r in results if r["status"] in ("error", "timeout"))
    total   = len(results)
    avg_t   = round(
        sum(r.get("elapsed_s", 0) for r in results if r["status"] == "pass") / max(passed, 1),
        2,
    )

    print(f"\n{'─'*50}")
    print(f"  Results:  {passed}/{total} passed  |  {failed} failed  |  {errored} errors")
    print(f"  Avg time: {avg_t}s per successful question")
    print(f"{'─'*50}\n")

    # Save results
    out_path = args.out or str(RESULTS_DIR / f"results_{int(time.time())}.json")
    out_dir = os.path.dirname(os.path.abspath(out_path))
    os.makedirs(out_dir, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump({
            "server": base_url,
            "total": total,
            "passed": passed,
            "failed": failed,
            "errored": errored,
            "avg_elapsed_s": avg_t,
            "questions": results,
        }, f, indent=2)
    print(f"📄 Results saved to: {out_path}")

    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
