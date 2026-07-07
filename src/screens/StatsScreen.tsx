import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { exerciseLookup } from '../lib/exerciseIndex'
import { muscleFatigue, usageIntensity, usedMuscles } from '../lib/fatigue'
import { weeklyVolume } from '../lib/history'
import { formatVolume } from '../lib/formulas'
import { MUSCLE_NAMES } from '../data/muscles'
import BodyMap from '../components/BodyMap'
import BarChart from '../components/BarChart'

const PERIODS = [
  { label: '7일', days: 7 },
  { label: '30일', days: 30 },
  { label: '90일', days: 90 },
  { label: '전체', days: null },
] as const

export default function StatsScreen() {
  const { data } = useStore()
  const lookup = useMemo(() => exerciseLookup(data), [data])
  const [scrubDays, setScrubDays] = useState(0) // 0 = 현재, n = n일 전
  const [periodIdx, setPeriodIdx] = useState(0)

  const now = Date.now()
  const at = now - scrubDays * 86_400_000

  const fatigue = useMemo(
    () => muscleFatigue(data.workouts, lookup, at),
    [data.workouts, lookup, at]
  )
  const fatigueIntensity = useMemo(() => {
    const out: typeof fatigue = {}
    for (const [m, v] of Object.entries(fatigue)) out[m as keyof typeof fatigue] = (v ?? 0) / 100
    return out
  }, [fatigue])

  const period = PERIODS[periodIdx]
  const usages = useMemo(
    () => usedMuscles(data.workouts, lookup, period.days ? now - period.days * 86_400_000 : null, now),
    [data.workouts, lookup, period, now]
  )
  const usageMap = useMemo(() => usageIntensity(usages), [usages])

  const weeks = useMemo(() => weeklyVolume(data.workouts, 8, now), [data.workouts, now])

  const fatigued = Object.entries(fatigue)
    .filter(([, v]) => (v ?? 0) >= 1)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))

  return (
    <div className="screen" data-testid="stats-screen">
      <div className="screen-title">통계</div>

      <div className="section-label" style={{ marginTop: 0 }}>근육 피로도</div>
      <div className="card">
        <BodyMap intensity={fatigueIntensity} />
        <div className="row" style={{ marginTop: 10 }}>
          <span className="muted" style={{ whiteSpace: 'nowrap' }}>
            {scrubDays === 0 ? '현재' : `${scrubDays}일 전`}
          </span>
          <input
            type="range"
            min={0}
            max={14}
            value={14 - scrubDays}
            onChange={(e) => setScrubDays(14 - Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent)' }}
            data-testid="fatigue-slider"
          />
        </div>
        {fatigued.length === 0 ? (
          <div className="muted" style={{ marginTop: 8 }}>
            모든 근육이 회복된 상태입니다 💪
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {fatigued.slice(0, 6).map(([m, v]) => (
              <div className="row between" key={m} style={{ padding: '3px 0' }}>
                <span className="muted">{MUSCLE_NAMES[m as keyof typeof MUSCLE_NAMES]}</span>
                <span style={{ fontWeight: 700, color: (v ?? 0) > 60 ? 'var(--danger)' : 'var(--accent)' }}>
                  피로 {Math.round(v ?? 0)}% · 회복 {100 - Math.round(v ?? 0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-label">사용 근육 (Used Muscle)</div>
      <div className="seg" data-testid="period-seg">
        {PERIODS.map((p, i) => (
          <button key={p.label} className={i === periodIdx ? 'active' : ''} onClick={() => setPeriodIdx(i)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="card">
        <BodyMap intensity={usageMap} />
        {usages.length === 0 ? (
          <div className="muted" style={{ marginTop: 8 }}>
            이 기간의 기록이 없습니다
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            {usages.slice(0, 8).map((u) => (
              <div className="row between" key={u.muscle} style={{ padding: '3px 0' }}>
                <span className="muted">{MUSCLE_NAMES[u.muscle]}</span>
                <span style={{ fontWeight: 600 }}>
                  {u.sets % 1 === 0 ? u.sets : u.sets.toFixed(1)}세트 · {formatVolume(u.volume)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-label">주간 볼륨 (최근 8주)</div>
      <div className="card">
        <BarChart bars={weeks} />
      </div>
    </div>
  )
}
