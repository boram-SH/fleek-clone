import { useMemo } from 'react'
import type { Workout } from '../types'
import { useStore } from '../store'
import { exerciseLookup } from '../lib/exerciseIndex'
import { detectPRs, estimateCalories, PR_LABELS } from '../lib/history'
import { workoutMuscles } from '../lib/fatigue'
import {
  bestSet1RM,
  formatDuration,
  formatVolume,
  workoutSetCount,
  workoutVolume,
} from '../lib/formulas'
import BodyMap from './BodyMap'
import Sheet from './Sheet'

// 워크아웃 완료 요약 — Fleek 요약 화면 재구성 (회차/칼로리/시간/볼륨/운동/세트/렙/강도)
export default function SummarySheet({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const { data } = useStore()
  const lookup = useMemo(() => exerciseLookup(data), [data])

  const ordinal = useMemo(
    () => data.workouts.filter((w) => w.startedAt <= workout.startedAt).length,
    [data.workouts, workout]
  )
  const prs = useMemo(() => detectPRs(data.workouts, workout), [data.workouts, workout])
  const muscles = useMemo(() => workoutMuscles(workout, lookup), [workout, lookup])

  const durationMs = (workout.endedAt ?? workout.startedAt) - workout.startedAt
  const volume = workoutVolume(workout)
  const sets = workoutSetCount(workout)
  const reps = workout.exercises.reduce(
    (a, we) => a + we.sets.filter((s) => s.done && s.type !== 'warmup').reduce((x, s) => x + s.reps, 0),
    0
  )
  const durationMin = Math.max(1, Math.round(durationMs / 60_000))
  const intensity = Math.round(volume / durationMin)

  return (
    <Sheet title="워크아웃 완료 🎉" onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span className="chip accent">{ordinal}번째 워크아웃</span>
        <div style={{ fontWeight: 800, fontSize: 18, marginTop: 6 }}>{workout.name}</div>
      </div>

      <BodyMap intensity={muscles} />

      <div className="stat-grid" style={{ marginTop: 12 }} data-testid="summary-stats">
        <StatBox value={formatDuration(durationMs)} label="운동 시간" />
        <StatBox value={formatVolume(volume)} label="총 볼륨" />
        <StatBox value={`${estimateCalories(durationMs, data.settings.bodyWeightKg)} kcal`} label="칼로리 (추정)" />
        <StatBox value={`${intensity} kg/min`} label="강도" />
        <StatBox value={`${workout.exercises.length}`} label="운동" />
        <StatBox value={`${sets} / ${reps}`} label="세트 / 렙" />
      </div>

      <div className="section-label">운동별 기록</div>
      {workout.exercises.map((we) => {
        const ex = lookup(we.exerciseId)
        const done = we.sets.filter((s) => s.done)
        const maxW = Math.max(0, ...done.filter((s) => s.type !== 'warmup').map((s) => s.weight))
        const kinds = prs.get(we.id) ?? []
        return (
          <div className="card" key={we.id} style={{ padding: 12 }}>
            <div className="row between">
              <div style={{ fontWeight: 700 }}>{ex?.name ?? '?'}</div>
              <div className="muted">
                MAX {maxW}kg · 1RM {Math.round(bestSet1RM(we))}kg
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {done.map((s) => (
                <span className="chip" key={s.id}>
                  {s.weight}×{s.reps}
                </span>
              ))}
              {kinds.map((k) => (
                <span className="chip accent" key={k}>
                  🏅 {PR_LABELS[k]}
                </span>
              ))}
            </div>
          </div>
        )
      })}

      <button className="btn btn-primary btn-block" onClick={onClose} style={{ marginTop: 8 }} data-testid="summary-close">
        확인
      </button>
    </Sheet>
  )
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-box">
      <div className="stat-value" style={{ fontSize: 17 }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
