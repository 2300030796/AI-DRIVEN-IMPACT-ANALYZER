import React from 'react'

// export default function ConfidenceBar({ score }) {
//   const pct = Math.max(0, Math.min(100, score || 0))
//   const color =
//     pct >= 70 ? 'var(--color-success)' :
//     pct >= 40 ? 'var(--color-warning)' :
//     'var(--color-danger)'

//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//       <div style={{
//         flex: 1,
//         height: '6px',
//         background: 'var(--color-surface-2)',
//         borderRadius: '999px',
//         overflow: 'hidden',
//       }}>
//         <div style={{
//           width: `${pct}%`,
//           height: '100%',
//           background: color,
//           borderRadius: '999px',
//           transition: 'width 0.5s ease',
//         }} />
//       </div>
//       <span style={{ fontSize: '12px', fontWeight: '700', color, minWidth: '36px', textAlign: 'right' }}>
//         {pct}%
//       </span>
//     </div>
//   )
// }



export default function ConfidenceBar({ score }) {
  const value = Number(score)
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const color =
    pct >= 70 ? 'var(--color-success)' :
    pct >= 40 ? 'var(--color-warning)' :
    'var(--color-danger)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        flex: 1,
        height: '6px',
        background: 'var(--color-surface-2)',
        borderRadius: '999px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: '999px',
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: '700', color, minWidth: '36px', textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  )
}