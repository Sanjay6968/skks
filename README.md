# UK Day-Ahead Renewable Generation Procurement & Accuracy Platform

A full-stack platform designed for UK energy utility trading desks to optimize power procurement decisions in the UK Day-Ahead wholesale market (EPEX SPOT GB / Nord Pool) using Elexon BMRS renewable wind forecasts (`WINDFOR`) and actual generation outturns (`FUELHH`) for January 2026.

---

## 1. Project Overview & Business Value

UK energy utilities must procure power on Day $D-1$ before gate closure (11:00 or 12:00 GMT) to balance customer demand on delivery day $D$. Intermittent wind generation reduces the need to purchase expensive thermal power (CCGT peakers, imports). 

- **Over-forecasting risk**: Utility under-procures thermal power and faces punitive System Buy Price (SBP) cash-out imbalance penalties.
- **Under-forecasting risk**: Utility over-procures thermal power and spills excess energy at discounted System Sell Prices (SSP).

This platform delivers:
1. **Day-Ahead Procurement Workspace**: Visualizes the latest wind forecast available at decision time (D-1 gate closure), tracks forecast revisions across publication updates, recommends statistical safety buffers, and generates hourly procurement schedules.
2. **Quantitative Accuracy Evaluation**: Evaluates forecast error metrics (MAE, RMSE, WAPE, Mean Bias, R²) across all of January 2026, analyzes diurnal error patterns by settlement period, breaks down performance by wind generation regime, and models empirical error distributions.

---

## 2. Directory & File Structure

```
.
├── Dockerfile
├── docker-compose.yml
├── Procfile
├── vercel.json
├── PRESENTATION.md
├── VIDEO_GUIDE.md
├── README.md
├── backend/
│   ├── main.py
│   ├── test_app.py
│   ├── verify.py
│   ├── probe_server.py
│   ├── requirements.txt
│   └── data/
│       ├── fuelhh_jan2026.json
│       └── windfor_jan2026.json
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── index.css
        └── main.jsx
```

---

## 3. How to Start the Application

### Option A: Docker (Recommended - One Command)

Prerequisites: [Docker Desktop](https://www.docker.com/)

```bash
docker compose up --build
```

Access the application in your browser at:
`http://localhost:8000`

### Option B: Local Development

#### 1. Backend (Python 3.10+)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API and Swagger docs will be live at `http://localhost:8000/docs`.

#### 2. Frontend (Node.js 18+)

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be live at `http://localhost:3000` (auto-proxies API calls to port 8000).

#### 3. Run Automated Tests

```bash
python backend/test_app.py
```

---

## 4. Live Deployment

The application is containerized and configured for one-click deployment:
- **Heroku / Render / Railway**: Configured via `Dockerfile` and `Procfile`.
- **Vercel**: Configured via `vercel.json`.
- **Live Demo URL**: [https://uk-wind-procurement.vercel.app](https://uk-wind-procurement.vercel.app)

---

## 5. Elexon Datasets & Methodology

- **Actual Generation (`FUELHH`)**: Half-hourly generation outturn for `fuelType="WIND"`. Sourced directly from `https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream`.
- **Forecasted Generation (`WINDFOR`)**: National wind forecasts published periodically (approx. 2-4 hours cadence) covering up to 72 hours ahead. Sourced directly from `https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream`.
- **Day-Ahead Decision Logic**: For any delivery date $D$, wholesale purchase decisions occur on Day $D-1$ prior to gate closure (default: 12:00 GMT, configurable to 09:00, 11:00, 14:00, 17:00). For each target settlement hour on delivery day $D$, the system selects the latest forecast record published on or before the cutoff time.
- **Accuracy Metrics**:
  - $\text{MAE} = \frac{1}{N}\sum |F_i - A_i|$
  - $\text{RMSE} = \sqrt{\frac{1}{N}\sum (F_i - A_i)^2}$
  - $\text{Mean Bias} = \frac{1}{N}\sum (F_i - A_i)$
  - $\text{WAPE} = \frac{\sum |F_i - A_i|}{\sum A_i} \times 100\%$

---

## 6. Disclosure of AI Tools

In accordance with assignment requirements:
- AI tools (Anthropic Claude / Google DeepMind Gemini coding agents) were utilized to assist with API research, architectural design, data ingestion scripts, frontend component construction, and documentation structuring.
