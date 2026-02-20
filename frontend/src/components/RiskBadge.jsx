import React from 'react'

export default function RiskBadge({ level }) {
  if (!level) return null
  const normalized = level.toUpperCase()
  const cls =
    normalized === 'HIGH' ? 'badge badge-high' :
    normalized === 'MEDIUM' ? 'badge badge-medium' :
    normalized === 'LOW' ? 'badge badge-low' : 'badge badge-neutral'
  return <span className={cls}>{normalized}</span>
}
