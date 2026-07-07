import { useMemo, useState } from 'react'
import type { Exercise, Routine, RoutineExercise } from '../types'
import { useStore } from '../store'
import { exerciseLookup } from '../lib/exerciseIndex'
import { uid } from '../lib/formulas'
import { MUSCLE_NAMES } from '../data/muscles'
import { usageIntensity } from '../lib/fatigue'
import type { MuscleValues } from '../lib/fatigue'
import BodyMap from '../components/BodyMap'
import ExercisePicker from '../components/ExercisePicker'
import Sheet from '../components/Sheet'

export default function RoutinesScreen({ onStart }: { onStart: (r: Routine) => void }) {
  const { data, saveRoutine, deleteRoutine } = useStore()
  const [editing, setEditing] = useState<Routine | null>(null)

  const newRoutine = () =>
    setEditing({ id: uid(), name: '', exercises: [], createdAt: Date.now() })

  return (
    <div className="screen" data-testid="routines-screen">
      <div className="row between">
        <div className="screen-title" style={{ marginBottom: 0 }}>루틴</div>
        <button className="btn btn-primary btn-sm" onClick={newRoutine} data-testid="new-routine">
          + 새 루틴
        </button>
      </div>
      <div className="muted" style={{ margin: '4px 0 16px' }}>
        운동 순서와 목표 세트를 템플릿으로 저장하세요
      </div>

      {data.routines.length === 0 && (
        <div className="empty-state">
          <div className="big">📋</div>
          루틴이 없습니다. 첫 루틴을 만들어 보세요.
        </div>
      )}

      {data.routines.map((r) => (
        <RoutineCard
          key={r.id}
          routine={r}
          onStart={() => onStart(r)}
          onEdit={() => setEditing(r)}
          onDelete={() => {
            if (confirm(`'${r.name}' 루틴을 삭제할까요?`)) deleteRoutine(r.id)
          }}
        />
      ))}

      {editing && (
        <RoutineEditor
          initial={editing}
          onSave={(r) => {
            saveRoutine(r)
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function RoutineCard({
  routine,
  onStart,
  onEdit,
  onDelete,
}: {
  routine: Routine
  onStart: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { data } = useStore()
  const lookup = useMemo(() => exerciseLookup(data), [data])

  return (
    <div className="card" data-testid={`routine-${routine.name}`}>
      <div className="row between">
        <div style={{ fontWeight: 800, fontSize: 16 }}>{routine.name}</div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>
            편집
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onDelete} aria-label="루틴 삭제">
            🗑
          </button>
        </div>
      </div>
      <div style={{ margin: '8px 0' }}>
        {routine.exercises.map((re, i) => {
          const ex = lookup(re.exerciseId)
          return (
            <div className="muted" key={i} style={{ padding: '3px 0' }}>
              {ex?.name ?? '?'} — {re.sets.length}세트
              {ex && ` (${ex.primaryMuscles.map((m) => MUSCLE_NAMES[m]).join(', ')})`}
            </div>
          )
        })}
        {routine.exercises.length === 0 && <div className="muted">운동 없음</div>}
      </div>
      <button
        className="btn btn-primary btn-block btn-sm"
        onClick={onStart}
        disabled={routine.exercises.length === 0}
        data-testid={`start-${routine.name}`}
      >
        이 루틴으로 시작 ▶
      </button>
    </div>
  )
}

function RoutineEditor({
  initial,
  onSave,
  onClose,
}: {
  initial: Routine
  onSave: (r: Routine) => void
  onClose: () => void
}) {
  const { data } = useStore()
  const lookup = useMemo(() => exerciseLookup(data), [data])
  const [routine, setRoutine] = useState<Routine>(initial)
  const [picking, setPicking] = useState(false)

  // 루틴 타깃 근육 미리보기 (Fleek 루틴 상세 화면의 해부도)
  const muscles: MuscleValues = useMemo(() => {
    const usages = routine.exercises.flatMap((re) => {
      const ex = lookup(re.exerciseId)
      if (!ex) return []
      return [
        ...ex.primaryMuscles.map((m) => ({ muscle: m, sets: re.sets.length * 1.0, volume: 0 })),
        ...ex.secondaryMuscles.map((m) => ({ muscle: m, sets: re.sets.length * 0.5, volume: 0 })),
      ]
    })
    const merged = new Map<string, { muscle: (typeof usages)[number]['muscle']; sets: number; volume: number }>()
    for (const u of usages) {
      const cur = merged.get(u.muscle)
      if (cur) cur.sets += u.sets
      else merged.set(u.muscle, { ...u })
    }
    return usageIntensity([...merged.values()])
  }, [routine, lookup])

  const addExercise = (ex: Exercise) => {
    const re: RoutineExercise = {
      exerciseId: ex.id,
      sets: [
        { type: 'normal', targetReps: 10 },
        { type: 'normal', targetReps: 10 },
        { type: 'normal', targetReps: 10 },
      ],
    }
    setRoutine((r) => ({ ...r, exercises: [...r.exercises, re] }))
    setPicking(false)
  }

  const patchExercise = (idx: number, patch: Partial<RoutineExercise>) =>
    setRoutine((r) => ({
      ...r,
      exercises: r.exercises.map((re, i) => (i === idx ? { ...re, ...patch } : re)),
    }))

  const move = (idx: number, dir: -1 | 1) =>
    setRoutine((r) => {
      const arr = [...r.exercises]
      const j = idx + dir
      if (j < 0 || j >= arr.length) return r
      ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
      return { ...r, exercises: arr }
    })

  return (
    <Sheet
      title={initial.name ? '루틴 편집' : '새 루틴'}
      onClose={onClose}
      confirmClose={() => routine === initial || confirm('저장하지 않은 변경사항이 있습니다. 닫을까요?')}
    >
      <input
        placeholder="루틴 이름 (예: 푸시 데이)"
        value={routine.name}
        onChange={(e) => setRoutine((r) => ({ ...r, name: e.target.value }))}
        data-testid="routine-name"
      />

      {Object.keys(muscles).length > 0 && (
        <div style={{ margin: '10px 0' }}>
          <BodyMap intensity={muscles} />
        </div>
      )}

      {routine.exercises.map((re, i) => {
        const ex = lookup(re.exerciseId)
        return (
          <div className="card" key={i} style={{ padding: 12 }}>
            <div className="row between">
              <div style={{ fontWeight: 700 }}>{ex?.name ?? '?'}</div>
              <div className="row" style={{ gap: 4 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => move(i, -1)} aria-label="위로">
                  ↑
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => move(i, 1)} aria-label="아래로">
                  ↓
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setRoutine((r) => ({ ...r, exercises: r.exercises.filter((_, j) => j !== i) }))}
                  aria-label="운동 삭제"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <div className="muted" style={{ marginBottom: 4 }}>세트 수</div>
                <input
                  type="number"
                  value={re.sets.length}
                  min={1}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(12, Math.floor(Number(e.target.value) || 1)))
                    const first = re.sets[0] ?? { type: 'normal' as const, targetReps: 10 }
                    patchExercise(i, { sets: Array.from({ length: n }, (_, k) => re.sets[k] ?? { ...first }) })
                  }}
                  data-testid={`routine-sets-${i}`}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="muted" style={{ marginBottom: 4 }}>목표 횟수</div>
                <input
                  type="number"
                  value={re.sets[0]?.targetReps ?? 10}
                  onChange={(e) => {
                    const v = Math.max(1, Math.floor(Number(e.target.value) || 1))
                    patchExercise(i, { sets: re.sets.map((s) => ({ ...s, targetReps: v })) })
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="muted" style={{ marginBottom: 4 }}>목표 kg</div>
                <input
                  type="number"
                  value={re.sets[0]?.targetWeight ?? ''}
                  placeholder="—"
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    patchExercise(i, {
                      sets: re.sets.map((s) => ({ ...s, targetWeight: v > 0 ? v : undefined })),
                    })
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div className="muted" style={{ marginBottom: 4 }}>휴식(초)</div>
                <input
                  type="number"
                  value={re.restSec ?? ''}
                  placeholder={`${data.settings.defaultRestSec}`}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    patchExercise(i, { restSec: v > 0 ? v : undefined })
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}

      <button className="btn btn-secondary btn-block" onClick={() => setPicking(true)} data-testid="routine-add-exercise">
        + 운동 추가
      </button>
      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 8 }}
        disabled={!routine.name.trim() || routine.exercises.length === 0}
        onClick={() => onSave({ ...routine, name: routine.name.trim() })}
        data-testid="routine-save"
      >
        저장
      </button>

      {picking && <ExercisePicker onPick={addExercise} onClose={() => setPicking(false)} />}
    </Sheet>
  )
}
