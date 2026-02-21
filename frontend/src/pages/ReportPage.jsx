// import React, { useEffect, useState } from 'react'
// import { useParams, useNavigate } from 'react-router-dom'
// import { getReport } from '../services/api.js'
// import RiskBadge from '../components/RiskBadge.jsx'
// import ConfidenceBar from '../components/ConfidenceBar.jsx'
// import {
//   ArrowLeft, FileCode, Layers, FlaskConical, BrainCircuit,
//   Clock, GitBranch, Link, AlertTriangle
// } from 'lucide-react'



// export default function ReportPage() {
//   const { id } = useParams()
//   const navigate = useNavigate()
//   const [report, setReport] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState(null)

//   useEffect(() => {
//     async function fetchReport() {
//       try {
//         const data = await getReport(id)
//         setReport(data)
//       } catch (err) {
//         setError(err.message || 'Failed to load report')
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchReport()
//   }, [id])

//   if (loading) {
//     return (
//       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
//         <div className="loading-spinner" style={{ borderTopColor: 'var(--color-primary)', borderColor: 'var(--color-border)' }} />
//         <span style={{ color: 'var(--color-text-muted)' }}>Loading report...</span>
//       </div>
//     )
//   }

//   if (error) {
//     return (
//       <div>
//         <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
//           <ArrowLeft size={14} /> Back
//         </button>
//         <div className="error-box">{error}</div>
//       </div>
//     )
//   }

//   if (!report) return null









//   return (
//     <div>
//       {/* Header */}
//       <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
//         <ArrowLeft size={14} /> Back
//       </button>

//       <div className="page-header">
//         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
//           <div>
//             <h1 className="page-title">Report #{report.id}</h1>
//             <p className="page-subtitle">
//               {report.analysisMode} · {formatDate(report.createdAt)} · {report.processingTimeMs}ms
//             </p>
//           </div>
//           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
//             <RiskBadge level={report.riskLevel} />
//             {report.fallback && (
//               <span className="badge badge-neutral">
//                 <AlertTriangle size={10} style={{ marginRight: '4px' }} />
//                 Fallback
//               </span>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Meta Info */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
//         {report.sourceReference && report.sourceReference !== 'file-upload' && (
//           <MetaCard icon={<Link size={14} />} label="Source" value={
//             <a href={report.sourceReference} target="_blank" rel="noreferrer"
//                style={{ fontSize: '12px', wordBreak: 'break-all' }}>
//               {report.sourceReference}
//             </a>
//           } />
//         )}
//         {report.branchName && (
//           <MetaCard icon={<GitBranch size={14} />} label="Branch" value={report.branchName} />
//         )}
//         <MetaCard icon={<Clock size={14} />} label="Created" value={formatDate(report.createdAt)} />
//         <MetaCard icon={<BrainCircuit size={14} />} label="Confidence" value={<ConfidenceBar score={report.confidenceScore} />} />
//       </div>

//       {/* Two-Column Layout */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
//         {/* Changed Files */}
//         <div className="card">
//           <div className="card-title">
//             <FileCode size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
//             Changed Files ({report.fileNames?.length || 0})
//           </div>
//           <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
//             {report.fileNames?.length > 0 ? report.fileNames.map((f, i) => (
//               <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--color-text)' }}>
//                 <FileCode size={12} color="var(--color-text-faint)" style={{ marginTop: '2px', flexShrink: 0 }} />
//                 <code style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{f}</code>
//               </li>
//             )) : <li style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>No files</li>}
//           </ul>
//         </div>

//         {/* Impacted Modules */}
//         <div className="card">
//           <div className="card-title">
//             <Layers size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
//             Impacted Modules ({report.impactedModules?.length || 0})
//           </div>
//           <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
//             {report.impactedModules?.length > 0 ? report.impactedModules.map((m, i) => (
//               <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--color-text)' }}>
//                 <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
//                 {m}
//               </li>
//             )) : <li style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>No modules identified</li>}
//           </ul>
//         </div>
//       </div>

//       {/* Recommended Tests — Explainable AI Panel */}
//       <div className="card" style={{ marginBottom: '16px' }}>
//         <div className="card-title">
//           <FlaskConical size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
//           Recommended Tests — Explainable AI
//         </div>
//         {report.recommendedTests?.length > 0 ? (
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//             {report.recommendedTests.map((test, i) => (
//               <ExplainableTestRow key={i} test={test} index={i} confidence={report.confidenceScore} />
//             ))}
//           </div>
//         ) : (
//           <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No tests recommended</div>
//         )}
//       </div>

//       {/* AI Reasoning */}
//       <div className="card">
//         <div className="card-title">
//           <BrainCircuit size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
//           AI Reasoning & Explanation
//         </div>
//         <p style={{ fontSize: '13.5px', color: 'var(--color-text)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
//           {report.reasoning || 'No reasoning provided'}
//         </p>
//         <div className="divider" />
//         <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
//           <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
//             Risk Level: <RiskBadge level={report.riskLevel} />
//           </span>
//           <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
//             Confidence: <strong style={{ color: 'var(--color-text)' }}>{report.confidenceScore}/100</strong>
//           </span>
//         </div>
//       </div>
//     </div>
//   )
// }

// function ExplainableTestRow({ test, index, confidence }) {
//   return (
//     <div style={{
//       display: 'grid',
//       gridTemplateColumns: '1fr auto auto',
//       gap: '12px',
//       alignItems: 'center',
//       background: 'var(--color-surface-2)',
//       border: '1px solid var(--color-border)',
//       borderRadius: 'var(--radius-sm)',
//       padding: '12px 14px',
//     }}>
//       <div>
//         <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '2px' }}>
//           {test.testName || `Test ${index + 1}`}
//         </div>
//         <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
//           {test.reason || 'Regression coverage required'}
//         </div>
//       </div>
//       <div style={{
//         fontSize: '11px',
//         background: 'var(--color-primary-light)',
//         color: 'var(--color-primary)',
//         padding: '3px 9px',
//         borderRadius: '999px',
//         fontWeight: '600',
//         whiteSpace: 'nowrap',
//       }}>
//         {test.module || 'Core'}
//       </div>
//       <div style={{ width: '80px' }}>
//         <ConfidenceBar score={confidence} />
//       </div>
//     </div>
//   )
// }

// function MetaCard({ icon, label, value }) {
//   return (
//     <div className="card" style={{ padding: '14px' }}>
//       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
//         {icon}
//         <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
//       </div>
//       <div style={{ fontSize: '12.5px', color: 'var(--color-text)' }}>{value}</div>
//     </div>
//   )
// }



// function formatDate(str) {
//   if (!str) return '—'
//   try {
//     return new Date(str).toLocaleString()
//   } catch {
//     return str
//   }
// }




import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReport } from '../services/api.js'
import RiskBadge from '../components/RiskBadge.jsx'
import ConfidenceBar from '../components/ConfidenceBar.jsx'
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts'


import StageDonut3D from '../components/StageDonut3D.jsx'


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


  const [animatedScore, setAnimatedScore] = useState(0)

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



  useEffect(() => {
  if (!report) return

  const target = Math.max(0, Math.min(100, Number(report.confidenceScore || 0)))
  let start = 0

  const duration = 1200
  const startTime = performance.now()

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // smooth ease-out
    const value = Math.round(eased * target)

    setAnimatedScore(value)

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}, [report])





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

  // if (!report) return null


  // const confidenceDonut = [
  //   { name: 'Confidence', value: Number(report.confidenceScore || 0) },
  //   { name: 'Remaining', value: Math.max(0, 100 - Number(report.confidenceScore || 0)) },
  // ]

// const pct = animatedScore

// const donutData = [
//   { label: 'Confidence', value: pct, color: '#3c15ba' },
//   { label: 'Remaining', value: 100 - pct, color: '#d1d5db' },
// ]


const pct = animatedScore

const mainColor =
  report.riskLevel?.toUpperCase() === 'HIGH' ? '#ef4444' :
  report.riskLevel?.toUpperCase() === 'MEDIUM' ? '#f59e0b' :
  '#10b981'

const donutData = [
  { label: 'Confidence', value: pct, color: mainColor },
  { label: 'Remaining', value: 100 - pct, color: '#8fd0de' },
]








  const confidenceDonut = [
  { name: 'Confidence', value: animatedScore },
  { name: 'Remaining', value: 100 - animatedScore },
]

  // const pct = Math.max(0, Math.min(100, Number(report.confidenceScore || 0)))
  
  // const pct = animatedScore
  
  
  const risk = (report.riskLevel || '').toUpperCase()
  const ringColor =
    risk === 'HIGH' ? 'var(--color-danger)' :
    risk === 'MEDIUM' ? 'var(--color-warning)' :
    'var(--color-success)'

  const remainderColor = 'var(--color-surface-2)'

  return (
    <div>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
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

      <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BrainCircuit size={14} style={{ opacity: 0.9 }} />
            <span>Confidence Overview</span>
          </div>
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '999px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            color: 'var(--color-text)'
          }}>
            {pct}%
           
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: '16px',
          alignItems: 'center',
          marginTop: '12px'
        }}>
          <div style={{
            width: '140px',
            height: '140px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* <ResponsiveContainer width="100%" height="100%">
              <PieChart> */}
                {/* <Pie
                  data={confidenceDonut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={62}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                >
                  <Cell fill={ringColor} />
                  <Cell fill={remainderColor} />
                </Pie> */}

                {/* <Pie
  data={confidenceDonut}
  dataKey="value"
  nameKey="name"
  innerRadius={44}
  outerRadius={56}
  startAngle={90}
  endAngle={-270}
  isAnimationActive={false}
>
</Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer> */}


                  <StageDonut3D
  data={donutData}
  size={190}
  thickness={44}
  depth={14}
  gapDeg={4}
  explode={6}
  rotationDeg={-70}
  centerLabel={`${pct}%`}
  animate
/>




          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '8px' }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>
                {pct}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                AI confidence score
              </div>
            </div>

            <ConfidenceBar score={report.confidenceScore} />

            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: 1.6 }}>
              Higher confidence means the AI is more certain about the risk level and recommended tests.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
            Confidence: <strong style={{ color: 'var(--color-text)' }}>{pct}/100</strong>
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