import type { ChartPoint } from '../lib/history'
import { formatDate } from '../lib/formulas'

// 외부 의존성 없는 SVG 라인 차트
export default function LineChart({
  points,
  unit,
  height = 160,
}: {
  points: ChartPoint[]
  unit: string
  height?: number
}) {
  const W = 440
  const H = height
  const PAD = { top: 14, right: 12, bottom: 24, left: 40 }

  if (points.length === 0) {
    return <div className="empty-state">데이터가 없습니다</div>
  }

  const xs = points.map((p) => p.t)
  const ys = points.map((p) => p.value)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys) * 1.1 || 1
  const minY = Math.max(0, Math.min(...ys) * 0.85)
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1

  const px = (t: number) =>
    points.length === 1
      ? W / 2
      : PAD.left + ((t - minX) / spanX) * (W - PAD.left - PAD.right)
  const py = (v: number) => PAD.top + (1 - (v - minY) / spanY) * (H - PAD.top - PAD.bottom)

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.t).toFixed(1)},${py(p.value).toFixed(1)}`).join(' ')
  const gridYs = [0.25, 0.5, 0.75, 1].map((f) => minY + f * spanY)
  const last = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="추이 차트">
      {gridYs.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={py(v)} y2={py(v)} stroke="#2a2d3a" strokeWidth="1" />
          <text x={PAD.left - 6} y={py(v) + 4} fontSize="10" fill="#9a9eae" textAnchor="end">
            {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#c8f542" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={px(p.t)} cy={py(p.value)} r="3.5" fill="#0e0f13" stroke="#c8f542" strokeWidth="2" />
      ))}
      <text x={px(points[0].t)} y={H - 8} fontSize="10" fill="#9a9eae" textAnchor="start">
        {formatDate(points[0].t)}
      </text>
      {points.length > 1 && (
        <text x={px(last.t)} y={H - 8} fontSize="10" fill="#9a9eae" textAnchor="end">
          {formatDate(last.t)}
        </text>
      )}
      <text x={px(last.t)} y={py(last.value) - 8} fontSize="11" fontWeight="700" fill="#c8f542" textAnchor="middle">
        {last.value}
        {unit}
      </text>
    </svg>
  )
}
