import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getReports } from '../services/api.js'
import RiskBadge from '../components/RiskBadge.jsx'
import { Clock, FileCode, Layers, FlaskConical, RefreshCw, ExternalLink } from 'lucide-react'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)

  const fetchReports = async (p = 0) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getReports(p, 20)
      setReports(data.reports || [])
      setPage(p)
    } catch (err) {
      setError(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports(0) }, [])

  const MODE_LABELS = {
    FILE_UPLOAD: 'File Upload',
    REPOSITORY: 'Repository',
    PULL_REQUEST: 'Pull Request',
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Analysis History</h1>
          <p className="page-subtitle">All past regression impact analyses</p>
        </div>
        <button className="btn btn-secondary" onClick={() => fetchReports(0)} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '16px' }}>{error}</div>}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', padding: '20px 0' }}>
          <div className="loading-spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }} />
          Loading reports...
        </div>
      )}

      {!loading && reports.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-state-icon"><Clock size={40} /></div>
          <div className="empty-state-text">No analyses yet. Run your first analysis on the Analyze page.</div>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reports.map(report => (
            <div key={report.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
              onClick={() => navigate(`/report/${report.id}`)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text)' }}>
                      Report #{report.id}
                    </span>
                    <RiskBadge level={report.riskLevel} />
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--color-primary)',
                      background: 'var(--color-primary-light)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: '600',
                    }}>
                      {MODE_LABELS[report.analysisMode] || report.analysisMode}
                    </span>
                  </div>
                  {report.sourceReference && report.sourceReference !== 'file-upload' && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', wordBreak: 'break-all' }}>
                      {report.sourceReference}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <StatChip icon={<FileCode size={11} />} label={`${report.fileCount} files`} />
                    <StatChip icon={<Layers size={11} />} label={`${report.impactedModuleCount} modules`} />
                    <StatChip icon={<FlaskConical size={11} />} label={`${report.recommendedTestCount} tests`} />
                    <StatChip icon={<Clock size={11} />} label={formatDate(report.createdAt)} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Confidence</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text)' }}>
                      {report.confidenceScore}%
                    </div>
                  </div>
                  <ExternalLink size={16} color="var(--color-text-faint)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && reports.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={() => fetchReports(Math.max(0, page - 1))} disabled={page === 0 || loading}>
            Previous
          </button>
          <span style={{ padding: '8px 12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Page {page + 1}
          </span>
          <button className="btn btn-secondary" onClick={() => fetchReports(page + 1)} disabled={reports.length < 20 || loading}>
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function StatChip({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
      {icon} {label}
    </div>
  )
}

function formatDate(str) {
  if (!str) return '—'
  try { return new Date(str).toLocaleString() }
  catch { return str }
}
