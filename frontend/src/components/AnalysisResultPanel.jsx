import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RiskBadge from './RiskBadge.jsx'
import ConfidenceBar from './ConfidenceBar.jsx'
import { CheckCircle, AlertTriangle, FileCode, Layers, FlaskConical, BrainCircuit, ArrowRight, ExternalLink } from 'lucide-react'

export default function AnalysisResultPanel({ result }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  if (!result) return null

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tests', label: `Tests (${result.recommendedTests?.length || 0})` },
    { id: 'ai', label: 'AI Reasoning' },
  ]

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Result Header */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {result.fallback ? (
            <AlertTriangle size={20} color="var(--color-warning)" />
          ) : (
            <CheckCircle size={20} color="var(--color-success)" />
          )}
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--color-text)' }}>
              Analysis Complete {result.fallback && '(Fallback Mode)'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Report #{result.id} · {result.analysisMode} · {result.processingTimeMs}ms
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RiskBadge level={result.riskLevel} />
          <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={() => navigate(`/report/${result.id}`)}>
            Full Report <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Fallback Warning */}
      {result.fallback && (
        <div className="error-box" style={{ marginBottom: '16px' }}>
          <strong>Fallback mode active:</strong> Ollama LLM is unreachable. Start it with{' '}
          <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '3px' }}>
            ollama serve
          </code>{' '}
          and ensure model <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '3px' }}>
            llama3
          </code>{' '}
          is pulled. Results below are generic.
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <StatCard icon={<FileCode size={16} />} label="Changed Files" value={result.fileNames?.length || 0} />
        <StatCard icon={<Layers size={16} />} label="Impacted Modules" value={result.impactedModules?.length || 0} />
        <StatCard icon={<FlaskConical size={16} />} label="Recommended Tests" value={result.recommendedTests?.length || 0} />
        <StatCard icon={<BrainCircuit size={16} />} label="AI Confidence" value={
          <ConfidenceBar score={result.confidenceScore} />
        } compact />
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '2px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: '16px',
      }}>
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '500',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: '-1px',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <div className="card-title">Changed Files</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {result.fileNames?.length > 0 ? result.fileNames.map((f, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--color-text)' }}>
                  <FileCode size={13} color="var(--color-text-muted)" />
                  <code style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{f}</code>
                </li>
              )) : <li style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No files recorded</li>}
            </ul>
          </div>
          <div className="card">
            <div className="card-title">Impacted Modules</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {result.impactedModules?.length > 0 ? result.impactedModules.map((m, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--color-text)' }}>
                  <ArrowRight size={13} color="var(--color-primary)" />
                  {m}
                </li>
              )) : <li style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No modules identified</li>}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'tests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {result.recommendedTests?.length > 0 ? result.recommendedTests.map((test, i) => (
            <TestCaseCard key={i} test={test} index={i} confidence={result.confidenceScore} />
          )) : (
            <div className="empty-state">
              <div className="empty-state-text">No test cases recommended</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="card">
          <div className="card-title">AI Reasoning</div>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
            {result.reasoning || 'No reasoning provided'}
          </p>
          <div className="divider" />
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Confidence Score: <strong style={{ color: 'var(--color-text)' }}>{result.confidenceScore}/100</strong>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, compact }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}>
        {icon}
        <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
      </div>
      {compact ? (
        <div style={{ marginTop: '2px' }}>{value}</div>
      ) : (
        <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>{value}</div>
      )}
    </div>
  )
}

function TestCaseCard({ test, index, confidence }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '12px',
      alignItems: 'start',
    }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
          <FlaskConical size={13} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--color-primary)' }} />
          {test.testName || `Test Case ${index + 1}`}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          <span style={{ fontWeight: '500', color: 'var(--color-text-faint)' }}>Reason: </span>
          {test.reason || 'Regression coverage required'}
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--color-text-faint)', marginTop: '4px' }}>
          Module: {test.module || 'Core'}
        </div>
      </div>
      <ConfidenceBar score={confidence} />
    </div>
  )
}
