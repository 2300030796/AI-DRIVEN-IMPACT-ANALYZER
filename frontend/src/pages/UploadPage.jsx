import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, GitBranch, GitPullRequest, X, FileCode, Play } from 'lucide-react'
import { useAnalysis } from '../hooks/useAnalysis.js'
import AnalysisResultPanel from '../components/AnalysisResultPanel.jsx'
import ProgressIndicator from '../components/ProgressIndicator.jsx'

const MODES = [
  { id: 'upload', label: 'Upload Files', icon: <Upload size={14} /> },
  { id: 'repo', label: 'Git Repository', icon: <GitBranch size={14} /> },
  { id: 'pr', label: 'Pull Request', icon: <GitPullRequest size={14} /> },
]

const ACCEPTED_TYPES = {
  'text/plain': ['.txt'],
  'text/x-java-source': ['.java'],
  'application/javascript': ['.js'],
  'text/javascript': ['.js', '.ts', '.jsx', '.tsx'],
  'application/typescript': ['.ts'],
  'text/x-python': ['.py'],
  'text/x-kotlin': ['.kt'],
  'text/x-go': ['.go'],
  'text/x-csharp': ['.cs'],
  'application/xml': ['.xml'],
  'text/yaml': ['.yaml', '.yml'],
}

export default function UploadPage() {
  const [mode, setMode] = useState('upload')
  const [files, setFiles] = useState([])
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [prUrl, setPrUrl] = useState('')

  const { result, loading, error, progress, reset, runFileAnalysis, runRepoAnalysis, runPrAnalysis } = useAnalysis()

  const onDrop = useCallback((accepted) => {
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      const newFiles = accepted.filter(f => !existing.has(f.name))
      return [...prev, ...newFiles]
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
    maxSize: 52428800, // 50MB
  })

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name))

  const handleModeChange = (newMode) => {
    setMode(newMode)
    reset()
    setFiles([])
  }

  const handleSubmit = async () => {
    reset()
    if (mode === 'upload') {
      if (files.length === 0) return
      await runFileAnalysis(files)
    } else if (mode === 'repo') {
      if (!repoUrl.trim()) return
      await runRepoAnalysis(repoUrl.trim(), branch.trim() || 'main')
    } else if (mode === 'pr') {
      if (!prUrl.trim()) return
      await runPrAnalysis(prUrl.trim())
    }
  }

  const canSubmit = !loading && (
    (mode === 'upload' && files.length > 0) ||
    (mode === 'repo' && repoUrl.trim().length > 0) ||
    (mode === 'pr' && prUrl.trim().length > 0)
  )

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI-Driven Impact Analyzer</h1>
        <p className="page-subtitle">
          Predict impacted modules and recommended regression tests using AI
        </p>
      </div>

      {/* Mode Toggle */}
      <div style={{
        display: 'inline-flex',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '4px',
        gap: '2px',
        marginBottom: '20px',
      }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '7px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '500',
              background: mode === m.id ? 'var(--color-primary)' : 'transparent',
              color: mode === m.id ? '#fff' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Mode: File Upload */}
      {mode === 'upload' && (
        <div className="card">
          <div className="card-title">Upload Source Files</div>
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius)',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <input {...getInputProps()} />
            <Upload size={32} color={isDragActive ? 'var(--color-primary)' : 'var(--color-text-faint)'} style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>
              {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to browse'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Supports: .java, .js, .ts, .jsx, .tsx, .py, .kt, .go, .cs, .txt, .xml, .yaml
            </div>
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: '600' }}>
                SELECTED FILES ({files.length})
              </div>
              {files.map(f => (
                <div key={f.name} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '7px 12px',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCode size={14} color="var(--color-primary)" />
                    <span style={{ fontSize: '12.5px', color: 'var(--color-text)' }}>{f.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>
                      {(f.size / 1024).toFixed(1)}KB
                    </span>
                  </div>
                  <button onClick={() => removeFile(f.name)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-faint)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode: Repository */}
      {mode === 'repo' && (
        <div className="card">
          <div className="card-title">Git Repository Analysis</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="input-label">Repository URL</label>
              <input
                className="input-field"
                type="url"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo.git"
              />
            </div>
            <div>
              <label className="input-label">Branch</label>
              <input
                className="input-field"
                type="text"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                placeholder="main"
              />
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '5px' }}>
                Analyzes changed files between the latest commit and its parent on this branch.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode: Pull Request */}
      {mode === 'pr' && (
        <div className="card">
          <div className="card-title">Pull Request Analysis</div>
          <div>
            <label className="input-label">GitHub Pull Request URL</label>
            <input
              className="input-field"
              type="url"
              value={prUrl}
              onChange={e => setPrUrl(e.target.value)}
              placeholder="https://github.com/owner/repo/pull/123"
            />
            <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '5px' }}>
              Public repositories only. No GitHub token required.
              The system will clone the repo and fetch the PR diff automatically.
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{ marginTop: '16px', minWidth: '160px' }}
      >
        {loading ? (
          <>
            <div className="loading-spinner" />
            Analyzing...
          </>
        ) : (
          <>
            <Play size={14} />
            Run Analysis
          </>
        )}
      </button>

      {/* Progress */}
      {loading && progress && <ProgressIndicator message={progress} />}

      {/* Error */}
      {error && !loading && (
        <div className="error-box" style={{ marginTop: '16px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Result */}
      {result && !loading && <AnalysisResultPanel result={result} />}
    </div>
  )
}
