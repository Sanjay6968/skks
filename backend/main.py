from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
from pathlib import Path
import json
import math
import os

app = FastAPI(title="UK Day-Ahead Renewable Generation Procurement & Accuracy Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).parent / "data"
FUELHH_FILE = DATA_DIR / "fuelhh_jan2026.json"
WINDFOR_FILE = DATA_DIR / "windfor_jan2026.json"

_fhh_data = []
_wf_data = []
_actual_by_start = {}

def load_data():
    global _fhh_data, _wf_data, _actual_by_start
    if FUELHH_FILE.exists():
        with open(FUELHH_FILE, "r", encoding="utf-8") as f:
            _fhh_data = json.load(f)
            _actual_by_start = {
                d["startTime"]: d["generation"]
                for d in _fhh_data
                if d.get("fuelType") == "WIND"
            }
    if WINDFOR_FILE.exists():
        with open(WINDFOR_FILE, "r", encoding="utf-8") as f:
            _wf_data = json.load(f)

load_data()

def compute_percentile(values, p):
    if not values:
        return 0.0
    sorted_v = sorted(values)
    k = (len(sorted_v) - 1) * (p / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return float(sorted_v[int(k)])
    return float(sorted_v[f] * (c - k) + sorted_v[c] * (k - f))

def get_day_ahead_matches(gate_closure_hour: int = 12):
    results = []
    delivery_dates = sorted(list(set(d["settlementDate"] for d in _fhh_data if "settlementDate" in d)))
    
    for d_str in delivery_dates:
        try:
            delivery_date = datetime.strptime(d_str, "%Y-%m-%d")
        except ValueError:
            continue
        decision_date = delivery_date - timedelta(days=1)
        cutoff = f"{decision_date.strftime('%Y-%m-%d')}T{gate_closure_hour:02d}:00:00Z"
        
        for hour in range(24):
            st = f"{d_str}T{hour:02d}:00:00Z"
            actual = _actual_by_start.get(st)
            if actual is None:
                continue
            candidates = [w for w in _wf_data if w["startTime"] == st and w["publishTime"] <= cutoff]
            if candidates:
                latest = max(candidates, key=lambda x: x["publishTime"])
                err = latest["generation"] - actual
                results.append({
                    "deliveryDate": d_str,
                    "startTime": st,
                    "hour": hour,
                    "forecast": latest["generation"],
                    "actual": actual,
                    "publishTime": latest["publishTime"],
                    "error": err,
                    "absError": abs(err)
                })
    return results

@app.get("/api/health")
def health():
    return {"status": "ok", "actualPoints": len(_actual_by_start), "windforRecords": len(_wf_data)}

@app.get("/api/summary")
def get_summary(gate_closure_hour: int = Query(12, ge=0, le=23)):
    matches = get_day_ahead_matches(gate_closure_hour)
    if not matches:
        return {"error": "No matched data"}
    
    errors = [m["error"] for m in matches]
    abs_errors = [m["absError"] for m in matches]
    actuals = [m["actual"] for m in matches]
    forecasts = [m["forecast"] for m in matches]
    
    n = len(matches)
    mae = sum(abs_errors) / n
    rmse = math.sqrt(sum(e * e for e in errors) / n)
    bias = sum(errors) / n
    total_actual = sum(actuals)
    total_forecast = sum(forecasts)
    wape = (sum(abs_errors) / total_actual * 100) if total_actual > 0 else 0.0
    
    mean_a = total_actual / n
    mean_f = total_forecast / n
    cov = sum((a - mean_a) * (f - mean_f) for a, f in zip(actuals, forecasts))
    var_a = sum((a - mean_a) ** 2 for a in actuals)
    var_f = sum((f - mean_f) ** 2 for f in forecasts)
    r2 = (cov ** 2) / (var_a * var_f) if (var_a * var_f) > 0 else 0.0
    
    available_dates = sorted(list(set(m["deliveryDate"] for m in matches)))
    
    return {
        "gateClosureHour": gate_closure_hour,
        "sampleCount": n,
        "mae": round(mae, 1),
        "rmse": round(rmse, 1),
        "bias": round(bias, 1),
        "wape": round(wape, 2),
        "r2": round(r2, 4),
        "totalActualGWh": round(total_actual / 1000, 1),
        "totalForecastGWh": round(total_forecast / 1000, 1),
        "p90ReserveBufferMW": round(compute_percentile([max(0, -e) for e in errors], 90), 1),
        "availableDates": available_dates
    }

@app.get("/api/forecasts")
def get_forecasts(date: str = Query("2026-01-15"), gate_closure_hour: int = Query(12, ge=0, le=23)):
    try:
        del_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        return {"error": "Invalid date format"}
    
    dec_date = del_date - timedelta(days=1)
    cutoff = f"{dec_date.strftime('%Y-%m-%d')}T{gate_closure_hour:02d}:00:00Z"
    
    timeline = []
    for h in range(24):
        st = f"{date}T{h:02d}:00:00Z"
        sp1 = h * 2 + 1
        sp2 = h * 2 + 2
        act1 = _actual_by_start.get(f"{date}T{h:02d}:00:00Z")
        act2 = _actual_by_start.get(f"{date}T{h:02d}:30:00Z")
        act_avg = None
        if act1 is not None and act2 is not None:
            act_avg = round((act1 + act2) / 2.0, 1)
        elif act1 is not None:
            act_avg = float(act1)
        
        candidates = [w for w in _wf_data if w["startTime"] == st and w["publishTime"] <= cutoff]
        latest_fc = max(candidates, key=lambda x: x["publishTime"]) if candidates else None
        
        fc_val = latest_fc["generation"] if latest_fc else None
        pub_time = latest_fc["publishTime"] if latest_fc else None
        
        err = (fc_val - act_avg) if (fc_val is not None and act_avg is not None) else None
        
        timeline.append({
            "hour": h,
            "time": f"{h:02d}:00",
            "startTime": st,
            "settlementPeriods": f"{sp1}-{sp2}",
            "forecast": fc_val,
            "actual": act_avg,
            "actualSP1": act1,
            "actualSP2": act2,
            "error": round(err, 1) if err is not None else None,
            "publishTime": pub_time
        })
    
    valid_points = [t for t in timeline if t["forecast"] is not None and t["actual"] is not None]
    day_mae = sum(abs(p["error"]) for p in valid_points) / len(valid_points) if valid_points else 0.0
    day_bias = sum(p["error"] for p in valid_points) / len(valid_points) if valid_points else 0.0
    forecast_sum = sum(p["forecast"] for p in timeline if p["forecast"] is not None)
    actual_sum = sum(p["actual"] for p in timeline if p["actual"] is not None)
    
    evolution_cutoffs = [6, 9, 12, 15, 18]
    evolution_series = {}
    for c_hour in evolution_cutoffs:
        c_time = f"{dec_date.strftime('%Y-%m-%d')}T{c_hour:02d}:00:00Z"
        c_curve = []
        for h in range(24):
            st = f"{date}T{h:02d}:00:00Z"
            cands = [w for w in _wf_data if w["startTime"] == st and w["publishTime"] <= c_time]
            if cands:
                c_curve.append(max(cands, key=lambda x: x["publishTime"])["generation"])
            else:
                c_curve.append(None)
        evolution_series[f"{c_hour:02d}:00"] = c_curve

    return {
        "date": date,
        "gateClosureHour": gate_closure_hour,
        "timeline": timeline,
        "summary": {
            "totalForecastMWh": int(forecast_sum),
            "totalActualMWh": int(actual_sum),
            "peakForecastMW": max([t["forecast"] for t in timeline if t["forecast"] is not None], default=0),
            "peakActualMW": max([t["actual"] for t in timeline if t["actual"] is not None], default=0),
            "minForecastMW": min([t["forecast"] for t in timeline if t["forecast"] is not None], default=0),
            "minActualMW": min([t["actual"] for t in timeline if t["actual"] is not None], default=0),
            "dayMae": round(day_mae, 1),
            "dayBias": round(day_bias, 1),
            "procurementRisk": "Under-generation risk" if day_bias > 500 else ("Over-generation surplus" if day_bias < -500 else "Balanced"),
            "recommendedBufferMW": round(max(0, day_mae * 1.28), 1)
        },
        "evolution": evolution_series
    }

@app.get("/api/metrics")
def get_metrics(gate_closure_hour: int = Query(12, ge=0, le=23)):
    matches = get_day_ahead_matches(gate_closure_hour)
    if not matches:
        return {"error": "No matched data"}
    
    daily_groups = {}
    for m in matches:
        d = m["deliveryDate"]
        daily_groups.setdefault(d, []).append(m)
    
    daily_stats = []
    for d_str, pts in sorted(daily_groups.items()):
        errs = [p["error"] for p in pts]
        abs_errs = [p["absError"] for p in pts]
        acts = [p["actual"] for p in pts]
        fcs = [p["forecast"] for p in pts]
        total_act = sum(acts)
        d_mae = sum(abs_errs) / len(abs_errs)
        d_rmse = math.sqrt(sum(e * e for e in errs) / len(errs))
        d_bias = sum(errs) / len(errs)
        d_wape = (sum(abs_errs) / total_act * 100) if total_act > 0 else 0.0
        daily_stats.append({
            "date": d_str,
            "mae": round(d_mae, 1),
            "rmse": round(d_rmse, 1),
            "bias": round(d_bias, 1),
            "wape": round(d_wape, 2),
            "avgActual": round(total_act / len(acts), 1),
            "avgForecast": round(sum(fcs) / len(fcs), 1),
            "peakActual": max(acts),
            "peakForecast": max(fcs)
        })
    
    hourly_groups = {}
    for m in matches:
        h = m["hour"]
        hourly_groups.setdefault(h, []).append(m)
    
    diurnal_stats = []
    for h in range(24):
        pts = hourly_groups.get(h, [])
        if not pts:
            continue
        errs = [p["error"] for p in pts]
        abs_errs = [p["absError"] for p in pts]
        acts = [p["actual"] for p in pts]
        fcs = [p["forecast"] for p in pts]
        diurnal_stats.append({
            "hour": h,
            "time": f"{h:02d}:00",
            "meanActual": round(sum(acts) / len(acts), 1),
            "meanForecast": round(sum(fcs) / len(fcs), 1),
            "mae": round(sum(abs_errs) / len(abs_errs), 1),
            "rmse": round(math.sqrt(sum(e * e for e in errs) / len(errs)), 1),
            "bias": round(sum(errs) / len(errs), 1),
            "p10": round(compute_percentile(errs, 10), 1),
            "p50": round(compute_percentile(errs, 50), 1),
            "p90": round(compute_percentile(errs, 90), 1)
        })
    
    regimes = {
        "Low (< 5 GW)": [m for m in matches if m["actual"] < 5000],
        "Medium (5 - 12 GW)": [m for m in matches if 5000 <= m["actual"] <= 12000],
        "High (> 12 GW)": [m for m in matches if m["actual"] > 12000]
    }
    regime_stats = []
    for name, r_matches in regimes.items():
        if not r_matches:
            continue
        r_errs = [m["error"] for m in r_matches]
        r_abs = [m["absError"] for m in r_matches]
        r_acts = [m["actual"] for m in r_matches]
        r_fcs = [m["forecast"] for m in r_matches]
        tot_act = sum(r_acts)
        regime_stats.append({
            "regime": name,
            "count": len(r_matches),
            "avgActual": round(tot_act / len(r_acts), 1),
            "avgForecast": round(sum(r_fcs) / len(r_fcs), 1),
            "mae": round(sum(r_abs) / len(r_abs), 1),
            "rmse": round(math.sqrt(sum(e * e for e in r_errs) / len(r_errs)), 1),
            "bias": round(sum(r_errs) / len(r_errs), 1),
            "wape": round((sum(r_abs) / tot_act * 100) if tot_act > 0 else 0, 2)
        })
    
    all_errors = [m["error"] for m in matches]
    percentiles = {
        "p5": round(compute_percentile(all_errors, 5), 1),
        "p10": round(compute_percentile(all_errors, 10), 1),
        "p25": round(compute_percentile(all_errors, 25), 1),
        "p50": round(compute_percentile(all_errors, 50), 1),
        "p75": round(compute_percentile(all_errors, 75), 1),
        "p90": round(compute_percentile(all_errors, 90), 1),
        "p95": round(compute_percentile(all_errors, 95), 1)
    }
    
    bucket_size = 500
    buckets = {}
    for e in all_errors:
        b = int(math.floor(e / bucket_size) * bucket_size)
        buckets[b] = buckets.get(b, 0) + 1
    
    histogram = [
        {"range": f"{b} to {b + bucket_size}", "min": b, "max": b + bucket_size, "count": count}
        for b, count in sorted(buckets.items())
    ]
    
    scatter_sample = [
        {"actual": m["actual"], "forecast": m["forecast"], "error": m["error"], "date": m["deliveryDate"], "hour": m["hour"]}
        for m in matches[::3]
    ]

    return {
        "daily": daily_stats,
        "diurnal": diurnal_stats,
        "regimes": regime_stats,
        "percentiles": percentiles,
        "histogram": histogram,
        "scatter": scatter_sample
    }

STATIC_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if STATIC_DIST.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIST), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
