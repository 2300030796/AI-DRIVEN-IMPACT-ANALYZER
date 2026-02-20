import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getReports, getReport } from '../services/api.js'
import RiskBadge from '../components/RiskBadge.jsx'
import { Network, ArrowRight, FileCode, Layers, FlaskConical, RefreshCw } from 'lucide-react'

export default function TraceabilityPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getReports(0, 10)
        const list = data.reports || []
        setReports(list)
        if (list.length > 0) {
          await loadDetail(list[0].id)
          setSelectedReport(list[0].id)
        }
      } catch (err) {
        setError(err.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function loadDetail(id) {
    setDetailLoading(true)
    try {
      const data = await getReport(id)
      setDetail(data)
    } catch (err) {
      setError('Failed to load report details')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSelect = async (id) => {
    setSelectedReport(id)
    await loadDetail(id)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Traceability Map</h1>
        <p className="page-subtitle">
          Visual mapping: Changed File → Impacted Module → Recommended Test
        </p>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '16px' }}>{error}</div>}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)' }}>
          <div className="loading-spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }} />
          Loading...
        </div>
      )}

      {!loading && reports.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"><Network size={40} /></div>
          <div className="empty-state-text">No reports available. Run an analysis first.</div>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>
          {/* Report Selector */}
          <div className="card" style={{ padding: '12px', height: 'fit-content' }}>
            <div className="card-title" style={{ marginBottom: '10px' }}>Select Report</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {reports.map(r => (
                <button key={r.id}
                  onClick={() => handleSelect(r.id)}
                  style={{
                    background: selectedReport === r.id ? 'var(--color-primary-light)' : 'transparent',
                    border: `1px solid ${selectedReport === r.id ? 'var(--color-primary)' : 'transparent'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: selectedReport === r.id ? 'var(--color-primary)' : 'var(--color-text)' }}>
                    Report #{r.id}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                    {r.analysisMode} · <RiskBadge level={r.riskLevel} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Traceability Matrix */}
          <div>
            {detailLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', padding: '20px 0' }}>
                <div className="loading-spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }} />
                Loading traceability data...
              </div>
            )}

            {!detailLoading && detail && (
              <>
                {/* Legend */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <Legend color="var(--color-primary)" icon={<FileCode size={13} />} label="Changed File" />
                  <Legend color="var(--color-warning)" icon={<Layers size={13} />} label="Impacted Module" />
                  <Legend color="var(--color-success)" icon={<FlaskConical size={13} />} label="Recommended Test" />
                </div>

                {/* Flow: Files → Modules → Tests */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr auto 1fr',
                  gap: '0',
                  alignItems: 'start',
                }}>
                  {/* Changed Files Column */}
                  <div>
                    <ColumnHeader color="var(--color-primary)" icon={<FileCode size={14} />} label="Changed Files" count={detail.fileNames?.length} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      {detail.fileNames?.map((f, i) => (
                        <TraceCell key={i} color="var(--color-primary)" bgColor="var(--color-primary-light)">
                          <code style={{ fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{f}</code>
                        </TraceCell>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ padding: '42px 10px 0', color: 'var(--color-text-faint)' }}>
                    <ArrowRight size={18} />
                  </div>

                  {/* Modules Column */}
                  <div>
                    <ColumnHeader color="var(--color-warning)" icon={<Layers size={14} />} label="Impacted Modules" count={detail.impactedModules?.length} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      {detail.impactedModules?.map((m, i) => (
                        <TraceCell key={i} color="var(--color-warning)" bgColor="var(--color-warning-light)">
                          <span style={{ fontSize: '12px' }}>{m}</span>
                        </TraceCell>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div style={{ padding: '42px 10px 0', color: 'var(--color-text-faint)' }}>
                    <ArrowRight size={18} />
                  </div>

                  {/* Tests Column */}
                  <div>
                    <ColumnHeader color="var(--color-success)" icon={<FlaskConical size={14} />} label="Recommended Tests" count={detail.recommendedTests?.length} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      {detail.recommendedTests?.map((t, i) => (
                        <TraceCell key={i} color="var(--color-success)" bgColor="var(--color-success-light)">
                          <div>
                            <div style={{ fontSize: '11.5px', fontWeight: '600' }}>{t.testName || `Test ${i + 1}`}</div>
                            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {t.module} · {t.reason}
                            </div>
                          </div>
                        </TraceCell>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Reasoning Summary */}
                <div className="card" style={{ marginTop: '20px' }}>
                  <div className="card-title">AI Impact Explanation</div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {detail.reasoning}
                  </p>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <RiskBadge level={detail.riskLevel} />
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Confidence: <strong style={{ color: 'var(--color-text)' }}>{detail.confidenceScore}%</strong>
                    </span>
                    <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={() => navigate(`/report/${detail.id}`)}>
                      View Full Report
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ColumnHeader({ color, icon, label, count }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      padding: '8px 12px',
      background: `color-mix(in srgb, ${color} 10%, transparent)`,
      borderRadius: 'var(--radius-sm)',
      border: `1px solid ${color}33`,
    }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: '12px', fontWeight: '700', color }}>{label}</span>
      {count !== undefined && (
        <span style={{
          marginLeft: 'auto',
          fontSize: '11px',
          background: color,
          color: '#fff',
          borderRadius: '999px',
          padding: '1px 7px',
          fontWeight: '700',
        }}>{count}</span>
      )}
    </div>
  )
}

function TraceCell({ children, color, bgColor }) {
  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${color}33`,
      borderRadius: 'var(--radius-sm)',
      padding: '8px 12px',
      color: 'var(--color-text)',
    }}>
      {children}
    </div>
  )
}

function Legend({ color, icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
      <span style={{ color }}>{icon}</span>
      {label}
    </div>
  )
}
