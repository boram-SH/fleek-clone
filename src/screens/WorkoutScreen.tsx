import { useEffect, useMemo, useState } from 'react'
import type { Exercise, SetEntry, SetType, Workout } from '../types'
import { useStore } from '../store'
import { exerciseLookup } from '../lib/exerciseIndex'
import { previousSets } from '../lib/history'
import { formatClock, formatVolume, parseNum, uid, workoutVolume } from '../lib/formulas'
import { MUSCLE_NAMES } from '../data/muscles'
import ExercisePicker from '../components/ExercisePicker'

const SET_TYPE_LABEL: Record<SetType, string> = { normal: '', warmup: 'W', drop: 'D', failure: 'F' }
const SET_TYPE_NEXT: Record<SetType, SetType> = { normal: 'warmup', warmup: 'drop', drop: 'failure', failure: 'normal' }
const SET_TYPE_COLOR: Record<SetType, string> = {
  normal: 'var(--text-dim)',
  warmup: 'var(--warn)',
  drop: '#7ecbff',
  failure: 'var(--danger)',
}

export default function WorkoutScreen({
  onFinish,
  onRest,
  onMinimize,
}: {
  onFinish: (w: Workout) => void
  onRest: (sec: number) => void
  onMinimize: () => void
}) {
  const { data, updateActiveWorkout, finishWorkout, discardWorkout } = useStore()
  const w = data.activeWorkout
  const lookup = useMemo(() => exerciseLookup(data), [data])
  const [picking, setPicking] = useState(false)
  const [, setTick] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  // 운동별 이전 세션 세트 (미리보기 열)
  const prevMap = useMemo(() => {
    const m = new Map<string, SetEntry[] | null>()
    if (w) for (const we of w.exercises) m.set(we.exerciseId, previousSets(data.workouts, we.exerciseId))
    return m
  }, [w, data.workouts])

  if (!w) return null

  const elapsed = Date.now() - w.startedAt
  const doneSets = w.exercises.reduce((a, we) => a + we.sets.filter((s) => s.done).length, 0)

  const routine = w.routineId ? data.routines.find((r) => r.id === w.routineId) : undefined
  const restSecFor = (exerciseId: string): number => {
    const re = routine?.exercises.find((x) => x.exerciseId === exerciseId)
    return re?.restSec ?? data.settings.defaultRestSec
  }

  const setField = (weId: string, setId: string, patch: Partial<SetEntry>) =>
    updateActiveWorkout((cur) => ({
      ...cur,
      exercises: cur.exercises.map((we) =>
        we.id !== weId ? we : { ...we, sets: we.sets.map((s) => (s.id !== setId ? s : { ...s, ...patch })) }
      ),
    }))

  const toggleDone = (weId: string, s: SetEntry, exerciseId: string) => {
    const nowDone = !s.done
    setField(weId, s.id, { done: nowDone, doneAt: nowDone ? Date.now() : undefined })
    if (nowDone) onRest(restSecFor(exerciseId))
  }

  const addSet = (weId: string) =>
    updateActiveWorkout((cur) => ({
      ...cur,
      exercises: cur.exercises.map((we) => {
        if (we.id !== weId) return we
        const last = we.sets[we.sets.length - 1]
        return {
          ...we,
          sets: [
            ...we.sets,
            { id: uid(), weight: last?.weight ?? 0, reps: last?.reps ?? 0, type: 'normal', done: false },
          ],
        }
      }),
    }))

  const removeSet = (weId: string) =>
    updateActiveWorkout((cur) => ({
      ...cur,
      exercises: cur.exercises.map((we) =>
        we.id !== weId || we.sets.length === 0 ? we : { ...we, sets: we.sets.slice(0, -1) }
      ),
    }))

  const removeExercise = (weId: string) => {
    if (!confirm('이 운동을 목록에서 제거할까요?')) return
    updateActiveWorkout((cur) => ({ ...cur, exercises: cur.exercises.filter((we) => we.id !== weId) }))
  }

  const addExercise = (ex: Exercise) => {
    const prev = previousSets(data.workouts, ex.id)
    updateActiveWorkout((cur) => ({
      ...cur,
      exercises: [
        ...cur.exercises,
        {
          id: uid(),
          exerciseId: ex.id,
          sets: (prev ?? [{ id: '', weight: 0, reps: 0, type: 'normal' as SetType, done: false }]).map((p) => ({
            id: uid(),
            weight: p.weight,
            reps: p.reps,
            type: p.type,
            done: false,
          })),
        },
      ],
    }))
    setPicking(false)
  }

  const finish = () => {
    // 통계에 집계되는 것은 웜업 제외 본 세트 — 완료 기준도 동일하게 맞춘다
    const countingSets = w.exercises.reduce(
      (a, we) => a + we.sets.filter((s) => s.done && s.type !== 'warmup').length,
      0
    )
    if (countingSets === 0) {
      const msg =
        doneSets > 0
          ? '본 세트 없이 웜업만 완료했습니다. 워크아웃을 버릴까요?'
          : '완료한 세트가 없습니다. 워크아웃을 버릴까요?'
      if (!confirm(msg)) return
      discardWorkout()
      return
    }
    const finished = finishWorkout()
    if (finished) onFinish(finished)
  }

  return (
    <div className="screen" data-testid="workout-screen">
      <div className="workout-header">
        <div className="row between">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onMinimize}
            aria-label="워크아웃 최소화"
            data-testid="minimize-workout"
            title="잠시 다른 화면 보기 (워크아웃은 계속 진행됩니다)"
          >
            ⌄
          </button>
          <input
            value={w.name}
            onChange={(e) => updateActiveWorkout((cur) => ({ ...cur, name: e.target.value }))}
            style={{ fontSize: 19, fontWeight: 800, background: 'none', border: 'none', padding: 0, flex: 1 }}
            data-testid="workout-name"
          />
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              if (confirm('진행 중인 워크아웃을 버릴까요? 기록이 저장되지 않습니다.')) discardWorkout()
            }}
          >
            취소
          </button>
          <button className="btn btn-primary btn-sm" onClick={finish} data-testid="finish-workout">
            완료
          </button>
        </div>
        <div className="row" style={{ marginTop: 8, gap: 14 }}>
          <span className="chip accent">⏱ {formatClock(Math.floor(elapsed / 1000))}</span>
          <span className="chip">볼륨 {formatVolume(workoutVolume(w))}</span>
          <span className="chip">세트 {doneSets}</span>
        </div>
      </div>

      {w.exercises.map((we) => {
        const ex = lookup(we.exerciseId)
        const prev = prevMap.get(we.exerciseId) ?? null
        // 자리 맞춤용 이전 기록은 웜업 제외 본 세트 기준
        const prevWork = prev?.filter((p) => p.type !== 'warmup') ?? null
        return (
          <div className="card" key={we.id} data-testid={`we-${we.exerciseId}`}>
            <div className="row between" style={{ marginBottom: 4 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{ex?.name ?? '알 수 없는 운동'}</div>
                <div className="muted">{ex?.primaryMuscles.map((m) => MUSCLE_NAMES[m]).join(' · ')}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => removeExercise(we.id)} aria-label="운동 제거">
                ✕
              </button>
            </div>
            <input
              placeholder="메모"
              value={we.memo ?? ''}
              onChange={(e) =>
                updateActiveWorkout((cur) => ({
                  ...cur,
                  exercises: cur.exercises.map((x) => (x.id === we.id ? { ...x, memo: e.target.value } : x)),
                }))
              }
              style={{ margin: '6px 0 10px', fontSize: 13, padding: '7px 10px' }}
            />
            <div className="set-row" style={{ marginBottom: 4 }}>
              <div className="set-num muted">세트</div>
              <div className="muted" style={{ textAlign: 'center', fontSize: 12 }}>
                kg (이전)
              </div>
              <div className="muted" style={{ textAlign: 'center', fontSize: 12 }}>
                횟수
              </div>
              <div className="muted" style={{ textAlign: 'center', fontSize: 12 }}>
                ✓
              </div>
            </div>
            {we.sets.map((s, i) => (
              <div className={`set-row ${s.done ? 'done' : ''}`} key={s.id}>
                <button
                  className="set-num"
                  style={{ color: SET_TYPE_COLOR[s.type] }}
                  onClick={() => setField(we.id, s.id, { type: SET_TYPE_NEXT[s.type] })}
                  title="탭하여 세트 타입 변경 (W 웜업 / D 드롭 / F 실패)"
                >
                  {SET_TYPE_LABEL[s.type] || i + 1}
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={s.weight === 0 ? '' : s.weight}
                  placeholder={prevWork?.[i] ? `${prevWork[i].weight}` : '0'}
                  onChange={(e) => setField(we.id, s.id, { weight: parseNum(e.target.value) })}
                  data-testid={`weight-${we.exerciseId}-${i}`}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={s.reps === 0 ? '' : s.reps}
                  placeholder={prevWork?.[i] ? `${prevWork[i].reps}` : '0'}
                  onChange={(e) => setField(we.id, s.id, { reps: Math.floor(parseNum(e.target.value, 500)) })}
                  data-testid={`reps-${we.exerciseId}-${i}`}
                />
                <button
                  className={`check-btn ${s.done ? 'on' : ''}`}
                  onClick={() => toggleDone(we.id, s, we.exerciseId)}
                  data-testid={`done-${we.exerciseId}-${i}`}
                >
                  ✓
                </button>
              </div>
            ))}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => addSet(we.id)}>
                + 세트
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => removeSet(we.id)}>
                − 세트
              </button>
            </div>
          </div>
        )
      })}

      <button className="btn btn-secondary btn-block" onClick={() => setPicking(true)} data-testid="add-exercise">
        + 운동 추가
      </button>

      {picking && <ExercisePicker onPick={addExercise} onClose={() => setPicking(false)} />}
    </div>
  )
}
