import type { WeekBar } from '../lib/history'
import { formatVolume } from '../lib/formulas'

// 주간 볼륨 SVG 바 차트
export default function BarChart({ bars, height = 150 }: { bars: WeekBar[]; height?: number }) {
  const W = 440
  const H = height
  const PAD = { top: 20, bottom: 22, side: 10 }
  const max = Math.max(1, ...bars.map((b) => b.volume))
  const bw = (W - PAD.side * 2) / bars.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="주간 볼륨 차트">
      {bars.map((b, i) => {
        const h = b.volume === 0 ? 2 : Math.max(3, (b.volume / max) * (H - PAD.top - PAD.bottom))
        const x = PAD.side + i * bw + bw * 0.18
        const y = H - PAD.bottom - h
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw * 0.64} height={h} rx="4" fill={b.volume > 0 ? '#c8f542' : '#2a2d3a'} />
            {b.volume > 0 && (
              <text x={x + bw * 0.32} y={y - 5} fontSize="9.5" fill="#9a9eae" textAnchor="middle">
                {formatVolume(b.volume)}
              </text>
            )}
            <text x={x + bw * 0.32} y={H - 8} fontSize="9.5" fill="#9a9eae" textAnchor="middle">
              {b.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
