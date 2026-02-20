import React from 'react'

const STEPS = [
  'Fetching pull request...',
  'Cloning repository...',
  'Comparing PR changes vs target branch...',
  'Uploading files...',
  'Extracting changed files...',
  'Analyzing with AI...',
]

export default function ProgressIndicator({ message }) {
  if (!message) return null

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      marginTop: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
    }}>
      <div className="loading-spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }} />
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
          {message}
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
          AI analysis with local Ollama may take 30–120 seconds depending on your hardware.
        </div>
      </div>
    </div>
  )
}
