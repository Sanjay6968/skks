import React, { useState, useEffect } from 'react'
import {
  Wind,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  BarChart2,
  ShieldAlert,
  CheckCircle2,
  Zap,
  Layers,
  FileSpreadsheet
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts'

export default function App() {
  const [activeTab, setActiveTab] = useState('dayAhead')
  const [selectedDate, setSelectedDate] = useState('2026-01-15')
  const [gateClosureHour, setGateClosureHour] = useState(12)
  const [summary, setSummary] = useState(null)
  const [forecastData, setForecastData] = useState(null)
  const [metricsData, setMetricsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showEvolution, setShowEvolution] = useState(false)

  useEffect(() => {
    fetchSummary()
    fetchForecast(selectedDate, gateClosureHour)
    fetchMetrics(gateClosureHour)
  }, [gateClosureHour])

  useEffect(() => {
    fetchForecast(selectedDate, gateClosureHour)
  }, [selectedDate])

  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/summary?gate_closure_hour=${gateClosureHour}`)
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchForecast = async (date, gc) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/forecasts?date=${date}&gate_closure_hour=${gc}`)
      if (res.ok) {
        const data = await res.json()
        setForecastData(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async (gc) => {
    try {
      const res = await fetch(`/api/metrics?gate_closure_hour=${gc}`)
      if (res.ok) {
        const data = await res.json()
        setMetricsData(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const exportCSV = () => {
    if (!forecastData?.timeline) return
    const headers = ['Hour', 'Settlement Periods', 'Forecast (MW)', 'Actual (MW)', 'Error (MW)', 'Publish Timestamp']
    const rows = forecastData.timeline.map(t => [
      t.time,
      t.settlementPeriods,
      t.forecast ?? '',
      t.actual ?? '',
      t.error ?? '',
      t.publishTime ?? ''
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `wind_forecast_${selectedDate}_GC${gateClosureHour}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const combinedTimelineData = forecastData?.timeline?.map((item, idx) => {
    const evo = forecastData?.evolution || {}
    const rec = { ...item }
    Object.keys(evo).forEach(k => {
      rec[`rev_${k}`] = evo[k][idx]
    })
    return rec
  }) || []

  return (
    <div className="min-h-screen bg-[#1c1712] text-[#FBF5EA] flex flex-col font-sans">
      <header className="border-b border-[#3d3126] bg-[#241e18] px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-[#302720] border border-[#8C5A2B] flex items-center justify-center text-[#E8B04A] shadow-inner">
              <Wind className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold tracking-tight text-[#FBF5EA]">UK Wind Day-Ahead Procurement Desk</h1>
                <span className="bg-[#302720] text-[#E8B04A] border border-[#8C5A2B]/60 text-[11px] px-2 py-0.5 rounded font-mono font-medium">
                  Elexon BMRS Live
                </span>
              </div>
              <p className="text-xs text-[#F2C9A0]/80">
                National Wind Forecast (WINDFOR) vs Actual Outturn (FUELHH) | Scope: January 2026
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-[#2a221b] border border-[#3d3126] rounded-lg px-3 py-1.5 space-x-2">
              <Clock className="h-4 w-4 text-[#E8B04A]" />
              <span className="text-xs text-[#F2C9A0] font-semibold">Gate Closure (D-1):</span>
              <select
                value={gateClosureHour}
                onChange={e => setGateClosureHour(Number(e.target.value))}
                className="bg-[#1c1712] border border-[#8C5A2B]/70 text-xs rounded px-2.5 py-1 text-[#FBF5EA] font-mono font-medium focus:outline-none focus:border-[#D98E32]"
              >
                <option value={9}>09:00 GMT (Early Draft)</option>
                <option value={11}>11:00 GMT (EPEX SPOT GB)</option>
                <option value={12}>12:00 GMT (Standard Midday)</option>
                <option value={14}>14:00 GMT (Afternoon Auction)</option>
                <option value={17}>17:00 GMT (Day-Ahead Final)</option>
              </select>
            </div>

            <div className="flex bg-[#241e18] p-1 rounded-lg border border-[#3d3126]">
              <button
                onClick={() => setActiveTab('dayAhead')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'dayAhead'
                    ? 'bg-[#D98E32] text-[#1c1712] shadow-sm'
                    : 'text-[#F2C9A0] hover:text-[#FBF5EA]'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Day-Ahead Decision</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'analytics'
                    ? 'bg-[#D98E32] text-[#1c1712] shadow-sm'
                    : 'text-[#F2C9A0] hover:text-[#FBF5EA]'
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                <span>Accuracy & Risk Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 space-y-6">
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-3.5 shadow-sm">
            <span className="text-[11px] text-[#F2C9A0]/80 uppercase tracking-wider font-semibold">Monthly MAE</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-[#FBF5EA]">{summary?.mae?.toLocaleString() ?? '-'}</span>
              <span className="text-[11px] text-[#8C5A2B] font-mono">MW</span>
            </div>
            <span className="text-[10px] text-[#F2C9A0]/60">Mean absolute error</span>
          </div>

          <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-3.5 shadow-sm">
            <span className="text-[11px] text-[#F2C9A0]/80 uppercase tracking-wider font-semibold">Monthly RMSE</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-[#E8B04A]">{summary?.rmse?.toLocaleString() ?? '-'}</span>
              <span className="text-[11px] text-[#8C5A2B] font-mono">MW</span>
            </div>
            <span className="text-[10px] text-[#F2C9A0]/60">Quadratic variance penalty</span>
          </div>

          <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-3.5 shadow-sm">
            <span className="text-[11px] text-[#F2C9A0]/80 uppercase tracking-wider font-semibold">Mean Forecast Bias</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className={`text-xl font-bold font-mono ${summary?.bias > 0 ? 'text-[#D98E32]' : 'text-emerald-400'}`}>
                {summary?.bias > 0 ? `+${summary?.bias}` : summary?.bias ?? '-'}
              </span>
              <span className="text-[11px] text-[#8C5A2B] font-mono">MW</span>
            </div>
            <span className="text-[10px] text-[#F2C9A0]/80 font-medium">
              {summary?.bias > 0 ? 'Over-forecast (Short Risk)' : 'Under-forecast (Long)'}
            </span>
          </div>

          <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-3.5 shadow-sm">
            <span className="text-[11px] text-[#F2C9A0]/80 uppercase tracking-wider font-semibold">WAPE</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-[#FBF5EA]">{summary?.wape ?? '-'}%</span>
              <span className="text-[11px] text-[#8C5A2B] font-mono">rel</span>
            </div>
            <span className="text-[10px] text-[#F2C9A0]/60">Weighted volume error</span>
          </div>

          <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-3.5 shadow-sm">
            <span className="text-[11px] text-[#F2C9A0]/80 uppercase tracking-wider font-semibold">Correlation (R²)</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-[#E8B04A]">{summary?.r2 ?? '-'}</span>
              <span className="text-[11px] text-[#8C5A2B] font-mono">coef</span>
            </div>
            <span className="text-[10px] text-[#F2C9A0]/60">Profile linearity</span>
          </div>

          <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-3.5 shadow-sm">
            <span className="text-[11px] text-[#F2C9A0]/80 uppercase tracking-wider font-semibold">P90 Reserve Buffer</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-[#D98E32]">+{summary?.p90ReserveBufferMW?.toLocaleString() ?? '-'}</span>
              <span className="text-[11px] text-[#8C5A2B] font-mono">MW</span>
            </div>
            <span className="text-[10px] text-[#F2C9A0]/80 font-medium">90% short-fall protection</span>
          </div>
        </section>

        {activeTab === 'dayAhead' ? (
          <div className="space-y-6">
            <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#3d3126] gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-[#E8B04A]" />
                  <div>
                    <h2 className="text-base font-bold text-[#FBF5EA]">Delivery Schedule & Auction Cutoff</h2>
                    <p className="text-xs text-[#F2C9A0]/80">
                      Wholesale Day-Ahead order cutoff on Day D-1 before {gateClosureHour}:00 GMT
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-[#F2C9A0] font-semibold">Delivery Date:</label>
                    <select
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="bg-[#1c1712] border border-[#8C5A2B]/70 text-xs rounded-lg px-3 py-1.5 text-[#FBF5EA] font-mono font-medium focus:outline-none focus:border-[#D98E32]"
                    >
                      {summary?.availableDates?.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setShowEvolution(!showEvolution)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      showEvolution
                        ? 'bg-[#8C5A2B] border-[#D98E32] text-[#FBF5EA] shadow-sm'
                        : 'bg-[#1c1712] border-[#3d3126] text-[#F2C9A0] hover:text-[#FBF5EA]'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Forecast Waterfall</span>
                  </button>

                  <button
                    onClick={exportCSV}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1c1712] hover:bg-[#302720] border border-[#3d3126] text-[#FBF5EA] transition"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#E8B04A]" />
                    <span>Export Schedule</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-[#3d3126]">
                <div>
                  <span className="text-[11px] text-[#F2C9A0]/80 uppercase font-semibold">Expected Generation</span>
                  <div className="text-xl font-bold font-mono text-[#FBF5EA]">
                    {forecastData?.summary?.totalForecastMWh?.toLocaleString() ?? 0} <span className="text-xs text-[#F2C9A0]/70 font-normal">MWh</span>
                  </div>
                  <span className="text-[11px] text-[#F2C9A0]/60">Actual Outturn: {forecastData?.summary?.totalActualMWh?.toLocaleString() ?? 0} MWh</span>
                </div>

                <div>
                  <span className="text-[11px] text-[#F2C9A0]/80 uppercase font-semibold">Peak Forecast Wind</span>
                  <div className="text-xl font-bold font-mono text-[#E8B04A]">
                    {forecastData?.summary?.peakForecastMW?.toLocaleString() ?? 0} <span className="text-xs text-[#F2C9A0]/70 font-normal">MW</span>
                  </div>
                  <span className="text-[11px] text-[#F2C9A0]/60">Actual Peak: {forecastData?.summary?.peakActualMW?.toLocaleString() ?? 0} MW</span>
                </div>

                <div>
                  <span className="text-[11px] text-[#F2C9A0]/80 uppercase font-semibold">Day Outturn Bias</span>
                  <div className={`text-xl font-bold font-mono ${forecastData?.summary?.dayBias > 0 ? 'text-[#D98E32]' : 'text-emerald-400'}`}>
                    {forecastData?.summary?.dayBias > 0 ? `+${forecastData?.summary?.dayBias}` : forecastData?.summary?.dayBias ?? 0} <span className="text-xs text-[#F2C9A0]/70 font-normal">MW</span>
                  </div>
                  <span className="text-[11px] text-[#F2C9A0]/80 font-medium">{forecastData?.summary?.procurementRisk}</span>
                </div>

                <div>
                  <span className="text-[11px] text-[#F2C9A0]/80 uppercase font-semibold">P90 Operational Buffer</span>
                  <div className="text-xl font-bold font-mono text-[#D98E32]">
                    +{forecastData?.summary?.recommendedBufferMW?.toLocaleString() ?? 0} <span className="text-xs text-[#F2C9A0]/70 font-normal">MW</span>
                  </div>
                  <span className="text-[11px] text-[#F2C9A0]/60">Recommended thermal safety volume</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#FBF5EA] flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-[#E8B04A]" />
                    <span>Day-Ahead Profile vs Actual Outturn (Hourly / 48 Settlement Periods)</span>
                  </span>
                  <span className="text-[11px] text-[#8C5A2B] font-mono">Megawatts (MW)</span>
                </div>

                <div className={`h-80 w-full transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={combinedTimelineData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3a2f25" />
                      <XAxis dataKey="time" stroke="#8C5A2B" tick={{ fontSize: 11, fill: '#F2C9A0' }} />
                      <YAxis stroke="#8C5A2B" tick={{ fontSize: 11, fill: '#F2C9A0' }} unit=" MW" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#241e18', borderColor: '#8C5A2B', borderRadius: '0.5rem', fontSize: '12px', color: '#FBF5EA', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)' }}
                        labelStyle={{ color: '#E8B04A', fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        name={`Day-Ahead Forecast (Cutoff ${gateClosureHour}:00)`}
                        stroke="#E8B04A"
                        strokeWidth={2.8}
                        dot={{ r: 3, fill: '#E8B04A' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="Actual Generation (Outturn)"
                        stroke="#FBF5EA"
                        strokeWidth={2.2}
                        strokeDasharray="4 4"
                        dot={{ r: 2.5, fill: '#FBF5EA' }}
                      />
                      {showEvolution && (
                        <>
                          <Line type="monotone" dataKey="rev_06:00" name="Revision 06:00" stroke="#524234" strokeWidth={1.2} dot={false} />
                          <Line type="monotone" dataKey="rev_09:00" name="Revision 09:00" stroke="#8C5A2B" strokeWidth={1.2} dot={false} />
                          <Line type="monotone" dataKey="rev_15:00" name="Revision 15:00" stroke="#D98E32" strokeWidth={1.2} dot={false} />
                          <Line type="monotone" dataKey="rev_18:00" name="Revision 18:00" stroke="#F2C9A0" strokeWidth={1.2} dot={false} />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-6">
                <span className="text-xs font-bold text-[#FBF5EA] block mb-2">Hourly Imbalance / Forecast Error (MW)</span>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={combinedTimelineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3a2f25" />
                      <XAxis dataKey="time" stroke="#8C5A2B" tick={{ fontSize: 10, fill: '#F2C9A0' }} />
                      <YAxis stroke="#8C5A2B" tick={{ fontSize: 10, fill: '#F2C9A0' }} unit=" MW" />
                      <ReferenceLine y={0} stroke="#8C5A2B" />
                      <Tooltip contentStyle={{ backgroundColor: '#241e18', borderColor: '#8C5A2B', borderRadius: '0.5rem', fontSize: '11px', color: '#FBF5EA' }} />
                      <Bar dataKey="error" name="Forecast Error (Forecast - Actual)" fill="#D98E32" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#FBF5EA] mb-3 flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-[#E8B04A]" />
                <span>Trading Desk Action Plan & Procurement Rules</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-[#1c1712] border border-[#3d3126] rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center space-x-2 text-[#FBF5EA] font-bold">
                    <CheckCircle2 className="h-4 w-4 text-[#E8B04A]" />
                    <span>Baseload Volume Floor</span>
                  </div>
                  <p className="text-[#F2C9A0]/80 leading-relaxed">
                    Minimum forecasted generation for this date is <strong className="text-[#FBF5EA] font-mono">{forecastData?.summary?.minForecastMW?.toLocaleString()} MW</strong>. The desk can safely treat this as non-dispatchable baseload credit when sizing day-ahead thermal commitments.
                  </p>
                </div>

                <div className="bg-[#1c1712] border border-[#3d3126] rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center space-x-2 text-[#FBF5EA] font-bold">
                    <AlertTriangle className="h-4 w-4 text-[#D98E32]" />
                    <span>Imbalance Exposure & Hedging</span>
                  </div>
                  <p className="text-[#F2C9A0]/80 leading-relaxed">
                    With an expected bias of <strong className="text-[#FBF5EA] font-mono">{forecastData?.summary?.dayBias} MW</strong>, contract a risk buffer of <strong className="text-[#FBF5EA] font-mono">+{forecastData?.summary?.recommendedBufferMW?.toLocaleString()} MW</strong> in the day-ahead auction to hedge against peak cash-out short penalties.
                  </p>
                </div>

                <div className="bg-[#1c1712] border border-[#3d3126] rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center space-x-2 text-[#FBF5EA] font-bold">
                    <TrendingUp className="h-4 w-4 text-[#E8B04A]" />
                    <span>Waterfall Trajectory Check</span>
                  </div>
                  <p className="text-[#F2C9A0]/80 leading-relaxed">
                    Examine revisions leading to gate closure. When morning runs show consecutive downgrades across the day, wind fronts are lagging forecast models; increase thermal reserve allocations.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#262019] border border-[#3d3126] rounded-lg overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-[#3d3126] flex items-center justify-between bg-[#201a14]">
                <div>
                  <h3 className="text-sm font-bold text-[#FBF5EA]">Settlement Period Breakdown Table</h3>
                  <p className="text-xs text-[#F2C9A0]/80">Target delivery settlement periods 1 to 48</p>
                </div>
                <span className="text-xs text-[#E8B04A] font-mono font-semibold">Delivery Date: {selectedDate}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1c1712] text-[#F2C9A0] font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Hour</th>
                      <th className="py-2.5 px-4">Settlement Periods</th>
                      <th className="py-2.5 px-4 text-right">Forecast (MW)</th>
                      <th className="py-2.5 px-4 text-right">Actual Avg (MW)</th>
                      <th className="py-2.5 px-4 text-right">Error (MW)</th>
                      <th className="py-2.5 px-4">Risk Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3d3126] font-mono">
                    {forecastData?.timeline?.map(t => {
                      const isHighErr = t.error !== null && Math.abs(t.error) > 2000
                      return (
                        <tr key={t.hour} className="hover:bg-[#302820] transition">
                          <td className="py-2.5 px-4 font-semibold text-[#FBF5EA]">{t.time}</td>
                          <td className="py-2.5 px-4 text-[#F2C9A0]/80">{t.settlementPeriods}</td>
                          <td className="py-2.5 px-4 text-right text-[#E8B04A] font-bold">{t.forecast?.toLocaleString() ?? '-'}</td>
                          <td className="py-2.5 px-4 text-right text-[#FBF5EA] font-semibold">{t.actual?.toLocaleString() ?? '-'}</td>
                          <td className={`py-2.5 px-4 text-right font-bold ${t.error > 0 ? 'text-[#D98E32]' : 'text-emerald-400'}`}>
                            {t.error !== null ? (t.error > 0 ? `+${t.error}` : t.error) : '-'}
                          </td>
                          <td className="py-2.5 px-4 font-sans">
                            {isHighErr ? (
                              <span className="bg-[#4a261f] text-[#fca5a5] border border-[#7f1d1d] px-2 py-0.5 rounded text-[10px] font-semibold">
                                High Deviation
                              </span>
                            ) : (
                              <span className="bg-[#1e3323] text-[#86efac] border border-[#14532d] px-2 py-0.5 rounded text-[10px] font-semibold">
                                Normal Tolerance
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-[#FBF5EA]">Daily Forecast Performance Across January 2026</h2>
                  <p className="text-xs text-[#F2C9A0]/80">Mean Absolute Error (MAE) and Mean Forecast Bias per delivery day</p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center space-x-1.5 text-[#FBF5EA] font-semibold">
                    <span className="h-2.5 w-2.5 rounded bg-[#E8B04A] inline-block"></span>
                    <span>Daily MAE</span>
                  </span>
                  <span className="flex items-center space-x-1.5 text-[#FBF5EA] font-semibold">
                    <span className="h-2.5 w-2.5 rounded bg-[#8C5A2B] inline-block"></span>
                    <span>Daily Bias</span>
                  </span>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData?.daily} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3a2f25" />
                    <XAxis
                      dataKey="date"
                      stroke="#8C5A2B"
                      tick={{ fontSize: 10, fill: '#F2C9A0' }}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis stroke="#8C5A2B" tick={{ fontSize: 11, fill: '#F2C9A0' }} unit=" MW" />
                    <Tooltip contentStyle={{ backgroundColor: '#241e18', borderColor: '#8C5A2B', borderRadius: '0.5rem', fontSize: '12px', color: '#FBF5EA' }} />
                    <Bar dataKey="mae" name="MAE (MW)" fill="#E8B04A" />
                    <Bar dataKey="bias" name="Bias (MW)" fill="#8C5A2B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[#FBF5EA]">Diurnal Error Profile (By Hour of Day)</h3>
                  <p className="text-xs text-[#F2C9A0]/80">Identifies peak intraday error windows and ramp uncertainty</p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData?.diurnal} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3a2f25" />
                      <XAxis dataKey="time" stroke="#8C5A2B" tick={{ fontSize: 10, fill: '#F2C9A0' }} />
                      <YAxis stroke="#8C5A2B" tick={{ fontSize: 10, fill: '#F2C9A0' }} unit=" MW" />
                      <Tooltip contentStyle={{ backgroundColor: '#241e18', borderColor: '#8C5A2B', borderRadius: '0.5rem', fontSize: '11px', color: '#FBF5EA' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="mae" name="MAE (MW)" stroke="#E8B04A" strokeWidth={2.2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="bias" name="Bias (MW)" stroke="#D98E32" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="p90" name="P90 Error Band" stroke="#F2C9A0" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[#FBF5EA]">Forecast Error Distribution (MW Buckets)</h3>
                  <p className="text-xs text-[#F2C9A0]/80">Histogram of over- and under-forecast magnitudes</p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricsData?.histogram} margin={{ top: 5, right: 15, left: 5, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3a2f25" />
                      <XAxis dataKey="range" stroke="#8C5A2B" tick={{ fontSize: 9, fill: '#F2C9A0' }} angle={-35} textAnchor="end" height={40} />
                      <YAxis stroke="#8C5A2B" tick={{ fontSize: 10, fill: '#F2C9A0' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#241e18', borderColor: '#8C5A2B', borderRadius: '0.5rem', fontSize: '11px', color: '#FBF5EA' }} />
                      <Bar dataKey="count" name="Frequency Count" fill="#D98E32" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-5 shadow-sm lg:col-span-1">
                <h3 className="text-sm font-bold text-[#FBF5EA] mb-1">Empirical Error Percentiles</h3>
                <p className="text-xs text-[#F2C9A0]/80 mb-4">Sample quantiles across January 2026</p>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded bg-[#1c1712] border border-[#3d3126]">
                    <span className="text-[#F2C9A0]/80">P10 (Extreme Under)</span>
                    <span className="font-bold text-emerald-400">{metricsData?.percentiles?.p10} MW</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-[#1c1712] border border-[#3d3126]">
                    <span className="text-[#F2C9A0]/80">P25 (Q1)</span>
                    <span className="font-bold text-[#FBF5EA]">{metricsData?.percentiles?.p25} MW</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-[#1c1712] border border-[#3d3126]">
                    <span className="text-[#F2C9A0]/80">P50 (Median)</span>
                    <span className="font-bold text-[#E8B04A]">{metricsData?.percentiles?.p50} MW</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-[#1c1712] border border-[#3d3126]">
                    <span className="text-[#F2C9A0]/80">P75 (Q3)</span>
                    <span className="font-bold text-[#FBF5EA]">{metricsData?.percentiles?.p75} MW</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-[#1c1712] border border-[#3d3126]">
                    <span className="text-[#F2C9A0]/80">P90 (Extreme Over)</span>
                    <span className="font-bold text-[#D98E32]">{metricsData?.percentiles?.p90} MW</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#262019] border border-[#3d3126] rounded-lg p-5 shadow-sm lg:col-span-2">
                <h3 className="text-sm font-bold text-[#FBF5EA] mb-1">Accuracy Stratified by Wind Generation Regime</h3>
                <p className="text-xs text-[#F2C9A0]/80 mb-4">Evaluation across low, medium, and high wind conditions</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#201a14] text-[#F2C9A0] uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Wind Regime</th>
                        <th className="py-2.5 px-3 text-right">Periods</th>
                        <th className="py-2.5 px-3 text-right">Actual Avg</th>
                        <th className="py-2.5 px-3 text-right">Forecast Avg</th>
                        <th className="py-2.5 px-3 text-right">MAE</th>
                        <th className="py-2.5 px-3 text-right">Bias</th>
                        <th className="py-2.5 px-3 text-right">WAPE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3d3126]">
                      {metricsData?.regimes?.map(r => (
                        <tr key={r.regime} className="hover:bg-[#302820] transition">
                          <td className="py-3 px-3 font-semibold text-[#FBF5EA] font-sans">{r.regime}</td>
                          <td className="py-3 px-3 text-right text-[#F2C9A0]/80">{r.count}</td>
                          <td className="py-3 px-3 text-right text-[#FBF5EA]">{r.avgActual?.toLocaleString()} MW</td>
                          <td className="py-3 px-3 text-right text-[#E8B04A] font-semibold">{r.avgForecast?.toLocaleString()} MW</td>
                          <td className="py-3 px-3 text-right text-[#FBF5EA] font-bold">{r.mae?.toLocaleString()} MW</td>
                          <td className={`py-3 px-3 text-right font-bold ${r.bias > 0 ? 'text-[#D98E32]' : 'text-emerald-400'}`}>
                            {r.bias > 0 ? `+${r.bias}` : r.bias} MW
                          </td>
                          <td className="py-3 px-3 text-right text-[#F2C9A0] font-semibold">{r.wape}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#3d3126] bg-[#1c1712] py-3.5 px-6 text-center text-xs text-[#8C5A2B]">
        UK Day-Ahead Energy Procurement Desk | Data Source: Elexon BMRS WINDFOR & FUELHH APIs | Scope: January 2026
      </footer>
    </div>
  )
}
