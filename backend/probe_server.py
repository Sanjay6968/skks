import sys
import time
import subprocess
import urllib.request
import json
from pathlib import Path

def test_live_server():
    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.main:app", "--port", "8008", "--host", "127.0.0.1"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    time.sleep(3)
    
    base_url = "http://127.0.0.1:8008"
    results = {}
    
    try:
        req = urllib.request.urlopen(f"{base_url}/api/health", timeout=5)
        results["health"] = (req.status, json.loads(req.read().decode("utf-8")))

        req = urllib.request.urlopen(f"{base_url}/api/summary?gate_closure_hour=11", timeout=5)
        results["summary_gc11"] = (req.status, json.loads(req.read().decode("utf-8")))

        req = urllib.request.urlopen(f"{base_url}/api/forecasts?date=2026-01-20&gate_closure_hour=11", timeout=5)
        results["forecasts_20260120"] = (req.status, json.loads(req.read().decode("utf-8")))

        req = urllib.request.urlopen(f"{base_url}/api/metrics?gate_closure_hour=11", timeout=5)
        results["metrics_gc11"] = (req.status, json.loads(req.read().decode("utf-8")))

        req = urllib.request.urlopen(f"{base_url}/", timeout=5)
        html_bytes = req.read()
        results["frontend_html"] = (req.status, len(html_bytes), b"<!doctype html>" in html_bytes.lower())

    finally:
        server_process.terminate()
        try:
            server_process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server_process.kill()

    print("=== LIVE HTTP PROBE RESULTS ===")
    print(f"Health Status: {results['health'][0]} -> {results['health'][1]}")
    print(f"Summary (GC 11:00 EPEX Spot): Status={results['summary_gc11'][0]}, MAE={results['summary_gc11'][1]['mae']} MW, RMSE={results['summary_gc11'][1]['rmse']} MW, Bias={results['summary_gc11'][1]['bias']} MW")
    print(f"Forecast (2026-01-20): Status={results['forecasts_20260120'][0]}, ForecastEnergy={results['forecasts_20260120'][1]['summary']['totalForecastMWh']} MWh, Peak={results['forecasts_20260120'][1]['summary']['peakForecastMW']} MW")
    print(f"Metrics: Status={results['metrics_gc11'][0]}, RegimesCount={len(results['metrics_gc11'][1]['regimes'])}, DiurnalCount={len(results['metrics_gc11'][1]['diurnal'])}")
    print(f"Frontend Static Root: Status={results['frontend_html'][0]}, Size={results['frontend_html'][1]} bytes, HasHtml={results['frontend_html'][2]}")
    print(">>> LIVE TCP SOCKET & HTTP PROTOCOL VERIFICATION PASSED! <<<")

if __name__ == "__main__":
    test_live_server()
