import React, { useEffect, useMemo, useState } from 'react'
import { getReports } from '../services/api.js'
import {
  PieChart, Pie, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts'

export default function DashboardPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getReports(0, 50)
        setReports(data.reports || [])
      } catch (e) {
        setError(e.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const riskPieData = useMemo(() => {
    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 }
    reports.forEach(r => {
      const k = (r.riskLevel || 'LOW').toUpperCase()
      if (counts[k] !== undefined) counts[k] += 1
    })
    return [
      { name: 'HIGH', value: counts.HIGH },
      { name: 'MEDIUM', value: counts.MEDIUM },
      { name: 'LOW', value: counts.LOW },
    ]
  }, [reports])

  const trendData = useMemo(() => {
    const sorted = [...reports].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    return sorted.slice(-15).map(r => ({
      name: `#${r.id}`,
      confidence: Number(r.confidenceScore || 0),
      files: Number(r.fileCount || 0),
      modules: Number(r.impactedModuleCount || 0),
      tests: Number(r.recommendedTestCount || 0),
    }))
  }, [reports])

  // const CHART = {
  //   grid: 'rgba(109, 40, 217, 0.12)',
  //   axis: '#475569',
  //   tooltipBg: 'rgba(255,255,255,0.95)',
  //   tooltipBorder: 'rgba(231, 227, 255, 1)',
  //   pie: {
  //     HIGH: '#ef4444',
  //     MEDIUM: '#f59e0b',
  //     LOW: '#22c55e',
  //   },
  //   line: '#6d28d9',
  //   bars: {
  //     files: '#8b5cf6',
  //     modules: '#22c55e',
  //     tests: '#ec4899',
  //   }
  // }
const CHART = {
  grid: 'rgba(109, 40, 217, 0.10)',
  axis: '#64748b',
  tooltipBg: 'rgba(255,255,255,0.96)',
  tooltipBorder: 'rgba(231, 227, 255, 1)',

  pie: {
    HIGH: '#f87171',     // soft coral red
    MEDIUM: '#fbbf24',   // warm pastel amber
    LOW: '#86efac',      // soft mint green
  },

  line: '#7c3aed',

  bars: {
    files: '#a78bfa',     // soft purple
    modules: '#86efac',   // mint green
    tests: '#f9a8d4',     // soft pink
  }
}
  const tooltipStyle = {
    background: CHART.tooltipBg,
    border: `1px solid ${CHART.tooltipBorder}`,
    borderRadius: 12,
    boxShadow: '0 14px 30px rgba(15, 23, 42, 0.10)',
    color: '#0f172a',
    fontWeight: 700
  }

  if (loading) {
    return (
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="page-title">Dashboard</h1>
        <div className="error-box">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visual summary of impact analyses</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="chart-card" style={{ gridColumn: 'span 4', minHeight: 280 }}>
          <div className="chart-head">
            <div>
              <div className="chart-title">Risk Distribution</div>
              <div className="chart-subtitle">HIGH / MEDIUM / LOW split</div>
            </div>
          </div>

          <div className="legend-pills">
            <div className="pill">
              <span className="pill-dot" style={{ background: CHART.pie.HIGH }} />
              HIGH
            </div>
            <div className="pill">
              <span className="pill-dot" style={{ background: CHART.pie.MEDIUM }} />
              MEDIUM
            </div>
            <div className="pill">
              <span className="pill-dot" style={{ background: CHART.pie.LOW }} />
              LOW
            </div>
          </div>

          <div className="chart-body">
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Pie
                    data={riskPieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={82}
                    innerRadius={48}
                    paddingAngle={3}
                  >
                    {riskPieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CHART.pie[entry.name] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="chart-card" style={{ gridColumn: 'span 8', minHeight: 280 }}>
          <div className="chart-head">
            <div>
              <div className="chart-title">Confidence Trend</div>
              <div className="chart-subtitle">Last 15 reports (0–100)</div>
            </div>
          </div>

          <div className="chart-body">
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="4 6" />
                  <XAxis dataKey="name" tick={{ fill: CHART.axis, fontSize: 12 }} axisLine={{ stroke: CHART.grid }} tickLine={{ stroke: CHART.grid }} />
                  <YAxis domain={[0, 100]} tick={{ fill: CHART.axis, fontSize: 12 }} axisLine={{ stroke: CHART.grid }} tickLine={{ stroke: CHART.grid }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke={CHART.line}
                    strokeWidth={3}
                    dot={{ r: 3.5, strokeWidth: 2, fill: '#ffffff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="chart-card" style={{ gridColumn: 'span 12', minHeight: 320 }}>
          <div className="chart-head">
            <div>
              <div className="chart-title">Files / Modules / Tests</div>
              <div className="chart-subtitle">Last 15 reports comparison</div>
            </div>
          </div>

          <div className="legend-pills">
            <div className="pill">
              <span className="pill-dot" style={{ background: CHART.bars.files }} />
              Files
            </div>
            <div className="pill">
              <span className="pill-dot" style={{ background: CHART.bars.modules }} />
              Modules
            </div>
            <div className="pill">
              <span className="pill-dot" style={{ background: CHART.bars.tests }} />
              Tests
            </div>
          </div>

          <div className="chart-body">
            <div className="chart-frame tall">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} barCategoryGap={18}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="4 6" />
                  <XAxis dataKey="name" tick={{ fill: CHART.axis, fontSize: 12 }} axisLine={{ stroke: CHART.grid }} tickLine={{ stroke: CHART.grid }} />
                  <YAxis tick={{ fill: CHART.axis, fontSize: 12 }} axisLine={{ stroke: CHART.grid }} tickLine={{ stroke: CHART.grid }} />
                  <Tooltip contentStyle={tooltipStyle} />

                  <Bar dataKey="files" fill={CHART.bars.files} radius={[10, 10, 4, 4]} />
                  <Bar dataKey="modules" fill={CHART.bars.modules} radius={[10, 10, 4, 4]} />
                  <Bar dataKey="tests" fill={CHART.bars.tests} radius={[10, 10, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}