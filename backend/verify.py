import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def run_verification():
    print("=== 1. Checking API Health ===")
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health failed: {r.status_code}"
    health_data = r.json()
    print("Health OK:", health_data)

    print("\n=== 2. Checking Summary Endpoint ===")
    r = client.get("/api/summary?gate_closure_hour=12")
    assert r.status_code == 200, f"Summary failed: {r.status_code}"
    s = r.json()
    print(f"Summary OK: MAE={s['mae']} MW, RMSE={s['rmse']} MW, Bias={s['bias']} MW, WAPE={s['wape']}%, R2={s['r2']}, P90Buffer={s['p90ReserveBufferMW']} MW")
    assert len(s["availableDates"]) == 31, f"Expected 31 days, got {len(s['availableDates'])}"

    print("\n=== 3. Checking Forecast Endpoints across Multiple Days ===")
    test_dates = ["2026-01-01", "2026-01-15", "2026-01-31"]
    for td in test_dates:
        r = client.get(f"/api/forecasts?date={td}&gate_closure_hour=12")
        assert r.status_code == 200, f"Forecast for {td} failed"
        f = r.json()
        assert len(f["timeline"]) == 24, f"Timeline length {len(f['timeline'])} != 24"
        assert f["summary"]["totalForecastMWh"] > 0
        print(f"Date {td}: Forecast={f['summary']['totalForecastMWh']} MWh, Actual={f['summary']['totalActualMWh']} MWh, DayMAE={f['summary']['dayMae']} MW")

    print("\n=== 4. Checking Metrics & Distribution ===")
    r = client.get("/api/metrics?gate_closure_hour=12")
    assert r.status_code == 200, f"Metrics failed: {r.status_code}"
    m = r.json()
    assert len(m["daily"]) == 31
    assert len(m["diurnal"]) == 24
    assert len(m["regimes"]) == 3
    assert len(m["histogram"]) > 0
    print(f"Metrics OK: Daily points={len(m['daily'])}, Diurnal hours={len(m['diurnal'])}, Regimes={len(m['regimes'])}, Hist buckets={len(m['histogram'])}")
    for reg in m["regimes"]:
        print(f"  Regime {reg['regime']}: Count={reg['count']}, ActualAvg={reg['avgActual']} MW, MAE={reg['mae']} MW, WAPE={reg['wape']}%")

    print("\n=== 5. Checking Frontend Static Asset Serving ===")
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.status_code}"
    assert "<!doctype html>" in r.text or "<html" in r.text
    print(f"Frontend root HTML served successfully! (Length: {len(r.text)} bytes)")

    print("\n>>> ALL 5 VERIFICATION CHECKS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    run_verification()
