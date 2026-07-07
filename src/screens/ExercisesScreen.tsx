import { useMemo, useState } from 'react'
import type { Exercise, MuscleId } from '../types'
import { useStore } from '../store'
import { EQUIPMENT_NAMES, searchExercises } from '../lib/exerciseIndex'
import { e1rmSeries, sortedWorkouts, topRecords, volumeSeries } from '../lib/history'
import { formatDate, formatVolume } from '../lib/formulas'
import { ALL_MUSCLES, MUSCLE_NAMES } from '../data/muscles'
import type { MuscleValues } from '../lib/fatigue'
import BodyMap from '../components/BodyMap'
import LineChart from '../components/LineChart'
import Sheet from '../components/Sheet'

export default function ExercisesScreen() {
  const { data } = useStore()
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<MuscleId | null>(null)
  const [detail, setDetail] = useState<Exercise | null>(null)

  const list = searchExercises(data, query, muscle)

  return (
    <div className="screen" data-testid="exercises-screen">
      <div className="screen-title">운동 라이브러리</div>
      <input placeholder="운동 검색 (한/영)" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="lib-search" />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 0' }}>
        <button className={`chip ${muscle === null ? 'accent' : ''}`} onClick={() => setMuscle(null)}>
          전체
        </button>
        {ALL_MUSCLES.map((m) => (
          <button
            key={m}
            className={`chip ${muscle === m ? 'accent' : ''}`}
            onClick={() => setMuscle(m)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {MUSCLE_NAMES[m]}
          </button>
        ))}
      </div>

      <div className="muted" style={{ marginBottom: 6 }}>
        {list.length}개 종목
      </div>
      {list.map((ex) => (
        <div key={ex.id} className="list-item" onClick={() => setDetail(ex)} data-testid={`lib-${ex.id}`}>
          <div>
            <div style={{ fontWeight: 600 }}>
              {ex.name}
              {ex.isCustom && <span className="chip accent" style={{ marginLeft: 6 }}>커스텀</span>}
            </div>
            <div className="muted">
              {ex.nameEn} · {EQUIPMENT_NAMES[ex.equipment]}
            </div>
          </div>
          <span className="muted">›</span>
        </div>
      ))}

      {detail && <ExerciseDetailSheet exercise={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function ExerciseDetailSheet({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const { data } = useStore()
  const [tab, setTab] = useState<'records' | 'chart'>('records')

  const muscles: MuscleValues = useMemo(() => {
    const out: MuscleValues = {}
    for (const m of exercise.primaryMuscles) out[m] = 1
    for (const m of exercise.secondaryMuscles) out[m] = 0.45
    return out
  }, [exercise])

  const records = useMemo(() => topRecords(data.workouts, exercise.id), [data.workouts, exercise.id])
  const e1rm = useMemo(() => e1rmSeries(data.workouts, exercise.id), [data.workouts, exercise.id])
  const vol = useMemo(() => volumeSeries(data.workouts, exercise.id), [data.workouts, exercise.id])

  // 최근 기록: 이 운동이 포함된 최근 세션들
  const recent = useMemo(() => {
    const out: { date: number; sets: { weight: number; reps: number }[] }[] = []
    for (const w of sortedWorkouts(data.workouts)) {
      for (const we of w.exercises) {
        if (we.exerciseId !== exercise.id) continue
        const sets = we.sets.filter((s) => s.done && s.type !== 'warmup')
        if (sets.length > 0) out.push({ date: w.startedAt, sets })
      }
      if (out.length >= 5) break
    }
    return out
  }, [data.workouts, exercise.id])

  return (
    <Sheet title={exercise.name} onClose={onClose}>
      <div className="muted" style={{ marginBottom: 8 }}>
        {exercise.nameEn} · {EQUIPMENT_NAMES[exercise.equipment]}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {exercise.primaryMuscles.map((m) => (
          <span className="chip accent" key={m}>
            {MUSCLE_NAMES[m]}
          </span>
        ))}
        {exercise.secondaryMuscles.map((m) => (
          <span className="chip" key={m}>
            {MUSCLE_NAMES[m]}
          </span>
        ))}
      </div>

      <BodyMap intensity={muscles} />

      <div className="seg" style={{ marginTop: 12 }}>
        <button className={tab === 'records' ? 'active' : ''} onClick={() => setTab('records')}>
          기록
        </button>
        <button className={tab === 'chart' ? 'active' : ''} onClick={() => setTab('chart')} data-testid="tab-chart">
          차트
        </button>
      </div>

      {tab === 'records' && (
        <>
          <div className="stat-grid" data-testid="top-records">
            <div className="stat-box">
              <div className="stat-value" style={{ fontSize: 18 }}>
                {records.max1RM > 0 ? `${Math.round(records.max1RM * 10) / 10}kg` : '—'}
              </div>
              <div className="stat-label">1RM MAX (추정)</div>
            </div>
            <div className="stat-box">
              <div className="stat-value" style={{ fontSize: 18 }}>
                {records.maxWeight > 0 ? `${records.maxWeight}kg` : '—'}
              </div>
              <div className="stat-label">WEIGHT MAX</div>
            </div>
            <div className="stat-box">
              <div className="stat-value" style={{ fontSize: 18 }}>
                {records.maxVolume > 0 ? formatVolume(records.maxVolume) : '—'}
              </div>
              <div className="stat-label">VOLUME MAX (세션)</div>
            </div>
            <div className="stat-box">
              <div className="stat-value" style={{ fontSize: 18 }}>{records.sessionCount}</div>
              <div className="stat-label">수행 세션</div>
            </div>
          </div>

          <div className="section-label">최근 기록</div>
          {recent.length === 0 && <div className="empty-state">아직 기록이 없습니다</div>}
          {recent.map((r, i) => (
            <div className="card" key={i} style={{ padding: 12 }}>
              <div className="muted" style={{ marginBottom: 6 }}>
                {formatDate(r.date)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {r.sets.map((s, j) => (
                  <span className="chip" key={j}>
                    {s.weight}×{s.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'chart' && (
        <>
          <div className="section-label">추정 1RM 추이</div>
          <div className="card">
            <LineChart points={e1rm} unit="kg" />
          </div>
          <div className="section-label">세션 볼륨 추이</div>
          <div className="card">
            <LineChart points={vol} unit="kg" />
          </div>
        </>
      )}
    </Sheet>
  )
}
