import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["actualPoints"] > 0
    assert data["windforRecords"] > 0

def test_summary():
    res = client.get("/api/summary?gate_closure_hour=12")
    assert res.status_code == 200
    data = res.json()
    assert data["mae"] > 0
    assert data["rmse"] > data["mae"]
    assert "bias" in data
    assert 0 <= data["r2"] <= 1.0
    assert len(data["availableDates"]) == 31

def test_forecasts():
    res = client.get("/api/forecasts?date=2026-01-15&gate_closure_hour=12")
    assert res.status_code == 200
    data = res.json()
    assert len(data["timeline"]) == 24
    assert data["summary"]["totalForecastMWh"] > 0
    assert "evolution" in data

def test_metrics():
    res = client.get("/api/metrics?gate_closure_hour=12")
    assert res.status_code == 200
    data = res.json()
    assert len(data["daily"]) == 31
    assert len(data["diurnal"]) == 24
    assert len(data["regimes"]) == 3
    assert "p10" in data["percentiles"]
    assert len(data["histogram"]) > 0

if __name__ == "__main__":
    test_health()
    test_summary()
    test_forecasts()
    test_metrics()
    print("All backend tests passed successfully!")
