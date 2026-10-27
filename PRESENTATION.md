# Quick Video Presentation Script (5–6 Minutes Total)

A concise, simple script designed for fast, effortless recording. Keep your browser open at `http://localhost:8000`.

---

## Part 1: Client Pitch (~2.5 to 3 Minutes)
**Role**: Presenting the pilot portal to the UK Energy Utility Day-Ahead Trading Desk.

### 1. The Business Problem (30 seconds)
- **On Screen**: Application header at `http://localhost:8000`
- **Say**:
  > *"Every morning before 11:00 GMT, your trading desk must buy thermal electricity in the Day-Ahead auction to cover customer demand. 
  > Wind generation reduces your thermal costs, but wind is volatile. If the forecast over-predicts wind, you under-buy power and get penalized with expensive cash-out imbalance charges. 
  > This platform gives your traders instant visibility into the latest forecast published right before auction gate closure, backed by quantified risk buffers."*

### 2. Day-Ahead Decision Dashboard (1 minute)
- **On Screen**: `Day-Ahead Decision` tab (Gate Closure: `11:00 GMT`, Delivery Date: `2026-01-15`)
- **Say**:
  > *"Here on the dashboard, the trader selects delivery date January 15 and the 11:00 GMT EPEX Spot gate closure.
  > - Top cards show expected wind generation: 280,272 MWh, with a peak of 15,828 MW.
  > - On the chart: the gold line is the official National Grid WINDFOR forecast published before 11:00 GMT. The white dashed line is the actual outturn from FUELHH.
  > - Click 'Forecast Waterfall': this reveals earlier morning forecast runs (06:00, 09:00), allowing traders to see whether weather models were trending up or down before the auction.
  > - Click 'Export Schedule' to download the 48 settlement periods directly to CSV."*

### 3. Quantitative Risk & Procurement Buffer (1 minute)
- **On Screen**: Click `Accuracy & Risk Analytics` tab
- **Say**:
  > *"In the Analytics tab, we evaluate the full month of January 2026:
  > - Monthly MAE is 2,107 MW, and Mean Forecast Bias is +1,839 MW.
  > - That positive bias is critical: the forecast systematically over-predicted wind, mainly due to transmission grid curtailment across the Scottish B6 border.
  > - To protect your book, our platform computes a P90 Risk Buffer (+1,421 MW on January 15). Traders simply add this buffer to their thermal purchases to achieve 90% statistical safety against cash-out penalties.
  > - Below, you can see daily error trends, hourly diurnal profiles, and performance by wind regime."*

---

## Part 2: Tech Lead Code Walkthrough (~2.5 to 3 Minutes)
**Role**: Technical walkthrough for internal code review.

### 1. Architecture & Stack (30 seconds)
- **On Screen**: Show project folder structure in VS Code / IDE
- **Say**:
  > *"For the tech stack:
  > - Backend: Python 3.11 with FastAPI, providing fast async REST endpoints and statistical analysis.
  > - Frontend: React 18 built with Vite, styled with Tailwind CSS, and Recharts for responsive visualizations.
  > - Data: Sourced directly from Elexon BMRS API—FUELHH for actual wind outturn, and WINDFOR for forecasts. We pre-bundled January 2026 data in `backend/data/` for instant, offline execution."*

### 2. Core Day-Ahead Matching Logic (1 minute)
- **On Screen**: Open `backend/main.py` and show `get_day_ahead_matches` and `get_forecasts`
- **Say**:
  > *"The core algorithm handles temporal causality:
  > - In `get_day_ahead_matches`, we set a strict cutoff at `(delivery_date - 1 day) at gate_closure_hour`.
  > - For each target hour, we filter WINDFOR records where `publishTime <= cutoff` and take the latest published forecast. This guarantees zero future data leakage.
  > - Because WINDFOR has hourly resolution while FUELHH has 30-minute settlement periods, `get_forecasts` averages the two half-hours (e.g., SP 23 and 24) to compare against the hourly forecast."*

### 3. Analytics Engine, Docker & Testing (1 minute)
- **On Screen**: Show `Dockerfile` and run `python backend/test_app.py` in terminal
- **Say**:
  > *"The analytics engine calculates MAE, RMSE, WAPE, Mean Bias, and non-parametric percentiles (P10 to P90) in-memory.
  > - For deployment, our multi-stage `Dockerfile` compiles the React frontend with Node 20, copies static assets into the Python image, and serves both API and frontend on port 8000. Running `docker compose up` starts the entire system in one command.
  > - Running `python backend/test_app.py` executes our automated test suite in under 2 seconds, verifying API health, calculation bounds, and data structures.
  > - The codebase is fully verified, comment-free, and ready for production."*
