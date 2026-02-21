import React, { useMemo, useState } from 'react'

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function polar(cx, cy, r, ang) {
  return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) }
}

function ringSegmentPath(cx, cy, rOuter, rInner, a0, a1) {
  const p0 = polar(cx, cy, rOuter, a0)
  const p1 = polar(cx, cy, rOuter, a1)
  const p2 = polar(cx, cy, rInner, a1)
  const p3 = polar(cx, cy, rInner, a0)
  const large = a1 - a0 > Math.PI ? 1 : 0

  return [
    `M ${p0.x} ${p0.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${p3.x} ${p3.y}`,
    'Z',
  ].join(' ')
}

function rotatePoint(x, y, cx, cy, ang) {
  const dx = x - cx
  const dy = y - cy
  const c = Math.cos(ang)
  const s = Math.sin(ang)
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c }
}

function darken(hex, amt = 18) {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const d = (v) => clamp(v - amt, 0, 255)
  const to = (v) => v.toString(16).padStart(2, '0')
  return `#${to(d(r))}${to(d(g))}${to(d(b))}`
}

export default function StageDonut3D({
  data,
  size = 220,
  thickness = 44,
  depth = 14,
  gapDeg = 3,
  rotationDeg = -70,
  explode = 6,
  centerLabel,
  animate = true,
}) {
  const [hoverIdx, setHoverIdx] = useState(-1)
  const hoveredSlice = hoverIdx >= 0 ? data[hoverIdx] : null

  const safeData = useMemo(() => {
    const arr = (data || []).filter(Boolean).map(d => ({
      label: String(d.label ?? ''),
      value: Number(d.value ?? 0),
      color: String(d.color ?? '#7c3aed'),
      icon: d.icon ?? null,
    }))
    const sum = arr.reduce((a, b) => a + Math.max(0, b.value), 0)
    return { arr, sum: sum || 1 }
  }, [data])

  const w = size
  const h = size
  const cx = w / 2
  const cy = h / 2 - depth * 0.2

  const rOuter = (size * 0.46)
  const rInner = rOuter - thickness

  const gap = (gapDeg * Math.PI) / 180
  const rotation = (rotationDeg * Math.PI) / 180

  const slices = useMemo(() => {
    let a = 0
    return safeData.arr.map((d, i) => {
      const portion = Math.max(0, d.value) / safeData.sum
      const span = portion * Math.PI * 2
      const a0 = a + rotation
      const a1 = a + span + rotation
      a += span
      return { ...d, i, a0, a1 }
    })
  }, [safeData, rotation])

  const viewBoxH = size + depth + 26
  const viewBoxW = size + 26
  const vbX = -13
  const vbY = -13
  const vbW = viewBoxW
  const vbH = viewBoxH

  return (
    <svg
      width={size}
      height={size + depth}
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="ds" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodOpacity="0.28" />
        </filter>

        {slices.map(s => (
          <linearGradient
            key={`g-${s.i}`}
            id={`grad-${s.i}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={s.color} stopOpacity="0.95" />
            <stop offset="55%" stopColor={s.color} stopOpacity="0.85" />
            <stop offset="100%" stopColor={darken(s.color, 26)} stopOpacity="0.95" />
          </linearGradient>
        ))}
      </defs>

      <g filter="url(#ds)">
        {slices.map(s => {
          const mid = (s.a0 + s.a1) / 2
          const dir = polar(0, 0, 1, mid)
          const isHover = hoverIdx === s.i
          const push = (isHover ? explode + 2 : explode)
          const dx = dir.x * push
          const dy = dir.y * push

          const a0 = s.a0 + gap / 2
          const a1 = s.a1 - gap / 2

          const topPath = ringSegmentPath(cx + dx, cy + dy, rOuter, rInner, a0, a1)
          const bottomPath = ringSegmentPath(cx + dx, cy + dy + depth, rOuter, rInner, a0, a1)

          return (
            <g
              key={s.i}
              style={{
                cursor: 'pointer',
                transformOrigin: `${cx}px ${cy}px`,
                transition: animate ? 'transform 650ms ease, filter 200ms ease' : undefined,
                transform: animate ? 'translateZ(0)' : undefined,
              }}
              onMouseEnter={() => setHoverIdx(s.i)}
              onMouseLeave={() => setHoverIdx(-1)}
            >
              <path d={bottomPath} fill={darken(s.color, 32)} opacity="0.85" />
              <path
                d={topPath}
                fill={`url(#grad-${s.i})`}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="1"
                opacity={isHover ? 1 : 0.98}
              />
              <circle cx={cx + dx} cy={cy + dy} r={rInner - 1} fill="rgba(255,255,255,0.02)" />
            </g>
          )
        })}

        <circle cx={cx} cy={cy} r={rInner - 10} fill="rgba(0,0,0,0.0)" />
      </g>

      {/* {centerLabel ? (
        <g>
          <text
            x={cx}
            y={cy + 6}
            textAnchor="middle"
            style={{
              fontSize: '20px',
              fontWeight: 900,
              fill: 'var(--color-text)',
            }}
          >
            {centerLabel}
          </text>
        </g>
      ) : null} */}

Replace it with this:
<g>
  <text
    x={cx}
    y={cy - 2}
    textAnchor="middle"
    style={{
      fontSize: '14px',
      fontWeight: 600,
      fill: 'var(--color-text)',
      opacity: 0.7,
    }}
  >
    {hoveredSlice ? hoveredSlice.label : 'Confidence'}
  </text>

  <text
    x={cx}
    y={cy + 20}
    textAnchor="middle"
    style={{
      fontSize: '22px',
      fontWeight: 900,
      fill: 'var(--color-text)',
    }}
  >
    {hoveredSlice ? `${hoveredSlice.value}%` : centerLabel}
  </text>
</g>

    </svg>
  )
}