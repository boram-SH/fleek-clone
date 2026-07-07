import { useMemo, useState } from 'react'
import type { Workout } from '../types'
import { useStore } from '../store'
import { exerciseLookup } from '../lib/exerciseIndex'
import { dayKey, workoutsByDay } from '../lib/history'
import { formatDuration, formatVolume, parseNum, workoutVolume } from '../lib/formulas'
import Sheet from '../components/Sheet'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

export default function HistoryScreen({ onRepeat }: { onRepeat: (w: Workout) => void }) {
  const { data, updateWorkout, deleteWorkout } = useStore()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate())
  const [detail, setDetail] = useState<Workout | null>(null)

  const byDay = useMemo(() => workoutsByDay(data.workouts), [data.workouts])

  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // 월=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const nav = (dir: -1 | 1) => {
    const d = new Date(year, month + dir, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
    setSelectedDay(null)
  }

  const dayWorkouts = selectedDay !== null ? byDay.get(dayKey(year, month, selectedDay)) ?? [] : []

  return (
    <div className="screen" data-testid="history-screen">
      <div className="screen-title">기록</div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => nav(-1)} data-testid="cal-prev">
            ◀
          </button>
          <div style={{ fontWeight: 800 }}>
            {year}년 {month + 1}월
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => nav(1)} data-testid="cal-next">
            ▶
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {WEEKDAYS.map((d) => (
            <div key={d} className="muted" style={{ textAlign: 'center', fontSize: 11, padding: '4px 0' }}>
              {d}
            </div>
          ))}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const has = byDay.has(dayKey(year, month, day))
            const isToday = year === now.getFullYear() && month === now.getMonth() && day === now.getDate()
            const isSel = selectedDay === day
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                data-testid={`cal-day-${day}`}
                style={{
                  aspectRatio: '1',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: isToday ? 800 : 500,
                  background: isSel ? 'var(--accent)' : 'transparent',
                  color: isSel ? 'var(--accent-text)' : isToday ? 'var(--accent)' : 'var(--text)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                {day}
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: has ? (isSel ? 'var(--accent-text)' : 'var(--accent)') : 'transparent',
                  }}
                />
              </button>
            )
          })}
        </div>
      </div>

      {selectedDay !== null && (
        <>
          <div className="section-label">
            {month + 1}월 {selectedDay}일
          </div>
          {dayWorkouts.length === 0 && <div className="empty-state">이 날의 기록이 없습니다</div>}
          {dayWorkouts.map((w) => (
            <div className="card clickable" key={w.id} onClick={() => setDetail(w)} data-testid={`history-${w.id}`}>
              <div className="row between">
                <div style={{ fontWeight: 700 }}>{w.name}</div>
                <div className="muted">
                  {new Date(w.startedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="muted" style={{ marginTop: 4 }}>
                {formatDuration((w.endedAt ?? w.startedAt) - w.startedAt)} · {formatVolume(workoutVolume(w))} ·{' '}
                운동 {w.exercises.length}개
              </div>
            </div>
          ))}
        </>
      )}

      {detail && (
        <WorkoutDetailSheet
          workout={detail}
          onClose={() => setDetail(null)}
          onSave={(w) => {
            updateWorkout(w)
            setDetail(null)
          }}
          onDelete={() => {
            if (confirm('이 워크아웃 기록을 삭제할까요?')) {
              deleteWorkout(detail.id)
              setDetail(null)
            }
          }}
          onRepeat={() => {
            setDetail(null)
            onRepeat(detail)
          }}
        />
      )}
    </div>
  )
}

function WorkoutDetailSheet({
  workout,
  onClose,
  onSave,
  onDelete,
  onRepeat,
}: {
  workout: Workout
  onClose: () => void
  onSave: (w: Workout) => void
  onDelete: () => void
  onRepeat: () => void
}) {
  const { data } = useStore()
  const lookup = useMemo(() => exerciseLookup(data), [data])
  const [draft, setDraft] = useState<Workout>(workout)
  const [editing, setEditing] = useState(false)

  const patchSet = (weId: string, setId: string, field: 'weight' | 'reps', value: number) =>
    setDraft((d) => ({
      ...d,
      exercises: d.exercises.map((we) =>
        we.id !== weId
          ? we
          : { ...we, sets: we.sets.map((s) => (s.id !== setId ? s : { ...s, [field]: value })) }
      ),
    }))

  return (
    <Sheet
      title={draft.name}
      onClose={onClose}
      confirmClose={() => !editing || draft === workout || confirm('저장하지 않은 수정사항이 있습니다. 닫을까요?')}
    >
      <div className="muted" style={{ marginBottom: 10 }}>
        {new Date(draft.startedAt).toLocaleString('ko-KR')} ·{' '}
        {formatDuration((draft.endedAt ?? draft.startedAt) - draft.startedAt)} · {formatVolume(workoutVolume(draft))}
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={onRepeat} data-testid="repeat-workout">
          🔁 이 워크아웃 반복
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
          onClick={() => setEditing((e) => !e)}
          data-testid="edit-workout"
        >
          {editing ? '편집 중…' : '✏ 수정'}
        </button>
        <button className="btn btn-danger btn-sm" onClick={onDelete} aria-label="삭제">
          🗑
        </button>
      </div>

      {draft.exercises.map((we) => {
        const ex = lookup(we.exerciseId)
        return (
          <div className="card" key={we.id} style={{ padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{ex?.name ?? '?'}</div>
            {we.memo && <div className="muted" style={{ marginBottom: 8 }}>메모: {we.memo}</div>}
            {we.sets.map((s, i) =>
              editing ? (
                <div className="set-row" key={s.id}>
                  <div className="set-num">{i + 1}</div>
                  <input
                    type="number"
                    min={0}
                    value={s.weight}
                    onChange={(e) => patchSet(we.id, s.id, 'weight', parseNum(e.target.value))}
                  />
                  <input
                    type="number"
                    min={0}
                    value={s.reps}
                    onChange={(e) => patchSet(we.id, s.id, 'reps', Math.floor(parseNum(e.target.value, 500)))}
                  />
                  <div />
                </div>
              ) : (
                <div className="row between" key={s.id} style={{ padding: '3px 0' }}>
                  <span className="muted">
                    {i + 1}세트{s.type !== 'normal' ? ` (${s.type})` : ''}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {s.weight}kg × {s.reps}
                  </span>
                </div>
              )
            )}
          </div>
        )
      })}

      {editing && (
        <button className="btn btn-primary btn-block" onClick={() => onSave(draft)} data-testid="save-edit">
          수정 저장
        </button>
      )}
    </Sheet>
  )
}
