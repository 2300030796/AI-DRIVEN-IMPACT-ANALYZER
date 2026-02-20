import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReport } from '../services/api.js'
import RiskBadge from '../components/RiskBadge.jsx'
import ConfidenceBar from '../components/ConfidenceBar.jsx'
import {
  ArrowLeft, FileCode, Layers, FlaskConical, BrainCircuit,
  Clock, GitBranch, Link, AlertTriangle
} from 'lucide-react'

export default function ReportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await getReport(id)
        setReport(data)
      } catch (err) {
        setError(err.message || 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
        <div className="loading-spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }} />
        <span style={{ color: 'var(--color-text-muted)' }}>Loading report...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="error-box">{error}</div>
      </div>
    )
  }

  if (!report) return null

  return (
    <div>
      {/* Header */}
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Report #{report.id}</h1>
            <p className="page-subtitle">
              {report.analysisMode} · {formatDate(report.createdAt)} · {report.processingTimeMs}ms
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RiskBadge level={report.riskLevel} />
            {report.fallback && (
              <span className="badge badge-neutral">
                <AlertTriangle size={10} style={{ marginRight: '4px' }} />
                Fallback
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {report.sourceReference && report.sourceReference !== 'file-upload' && (
          <MetaCard icon={<Link size={14} />} label="Source" value={
            <a href={report.sourceReference} target="_blank" rel="noreferrer"
               style={{ fontSize: '12px', wordBreak: 'break-all' }}>
              {report.sourceReference}
            </a>
          } />
        )}
        {report.branchName && (
          <MetaCard icon={<GitBranch size={14} />} label="Branch" value={report.branchName} />
        )}
        <MetaCard icon={<Clock size={14} />} label="Created" value={formatDate(report.createdAt)} />
        <MetaCard icon={<BrainCircuit size={14} />} label="Confidence" value={<ConfidenceBar score={report.confidenceScore} />} />
      </div>

      {/* Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Changed Files */}
        <div className="card">
          <div className="card-title">
            <FileCode size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Changed Files ({report.fileNames?.length || 0})
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {report.fileNames?.length > 0 ? report.fileNames.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--color-text)' }}>
                <FileCode size={12} color="var(--color-text-faint)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <code style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{f}</code>
              </li>
            )) : <li style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>No files</li>}
          </ul>
        </div>

        {/* Impacted Modules */}
        <div className="card">
          <div className="card-title">
            <Layers size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Impacted Modules ({report.impactedModules?.length || 0})
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {report.impactedModules?.length > 0 ? report.impactedModules.map((m, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--color-text)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                {m}
              </li>
            )) : <li style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>No modules identified</li>}
          </ul>
        </div>
      </div>

      {/* Recommended Tests — Explainable AI Panel */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-title">
          <FlaskConical size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Recommended Tests — Explainable AI
        </div>
        {report.recommendedTests?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {report.recommendedTests.map((test, i) => (
              <ExplainableTestRow key={i} test={test} index={i} confidence={report.confidenceScore} />
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No tests recommended</div>
        )}
      </div>

      {/* AI Reasoning */}
      <div className="card">
        <div className="card-title">
          <BrainCircuit size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          AI Reasoning & Explanation
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--color-text)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
          {report.reasoning || 'No reasoning provided'}
        </p>
        <div className="divider" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Risk Level: <RiskBadge level={report.riskLevel} />
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Confidence: <strong style={{ color: 'var(--color-text)' }}>{report.confidenceScore}/100</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

function ExplainableTestRow({ test, index, confidence }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
      gap: '12px',
      alignItems: 'center',
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 14px',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '2px' }}>
          {test.testName || `Test ${index + 1}`}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {test.reason || 'Regression coverage required'}
        </div>
      </div>
      <div style={{
        fontSize: '11px',
        background: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        padding: '3px 9px',
        borderRadius: '999px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
      }}>
        {test.module || 'Core'}
      </div>
      <div style={{ width: '80px' }}>
        <ConfidenceBar score={confidence} />
      </div>
    </div>
  )
}

function MetaCard({ icon, label, value }) {
  return (
    <div className="card" style={{ padding: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
      </div>
      <div style={{ fontSize: '12.5px', color: 'var(--color-text)' }}>{value}</div>
    </div>
  )
}

function formatDate(str) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleString()
  } catch {
    return str
  }
}
