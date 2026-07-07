import { useState } from 'react'
import type { Equipment, Exercise, MuscleId } from '../types'
import { useStore } from '../store'
import { EQUIPMENT_NAMES, searchExercises } from '../lib/exerciseIndex'
import { ALL_MUSCLES, MUSCLE_NAMES } from '../data/muscles'
import Sheet from './Sheet'

// 운동 검색/필터/선택 + 커스텀 운동 추가 시트
export default function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (ex: Exercise) => void
  onClose: () => void
}) {
  const { data, addCustomExercise } = useStore()
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<MuscleId | null>(null)
  const [creating, setCreating] = useState(false)

  const list = searchExercises(data, query, muscle)

  return (
    <Sheet title="운동 선택" onClose={onClose}>
      {creating ? (
        <CustomExerciseForm
          onCancel={() => setCreating(false)}
          onCreate={(ex) => {
            const created = addCustomExercise(ex)
            onPick(created)
          }}
        />
      ) : (
        <>
          <input
            placeholder="운동 검색 (한/영)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="exercise-search"
          />
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
          <button className="btn btn-secondary btn-block btn-sm" onClick={() => setCreating(true)}>
            + 커스텀 운동 만들기
          </button>
          <div style={{ marginTop: 8 }}>
            {list.map((ex) => (
              <div key={ex.id} className="list-item" onClick={() => onPick(ex)} data-testid={`pick-${ex.id}`}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {ex.name}
                    {ex.isCustom && <span className="chip accent" style={{ marginLeft: 6 }}>커스텀</span>}
                  </div>
                  <div className="muted">
                    {EQUIPMENT_NAMES[ex.equipment]} · {ex.primaryMuscles.map((m) => MUSCLE_NAMES[m]).join(', ')}
                  </div>
                </div>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>+</span>
              </div>
            ))}
            {list.length === 0 && <div className="empty-state">검색 결과가 없습니다</div>}
          </div>
        </>
      )}
    </Sheet>
  )
}

function CustomExerciseForm({
  onCreate,
  onCancel,
}: {
  onCreate: (ex: Omit<Exercise, 'id' | 'isCustom'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState<Equipment>('barbell')
  const [primary, setPrimary] = useState<MuscleId[]>([])

  const toggleMuscle = (m: MuscleId) =>
    setPrimary((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]))

  return (
    <div>
      <div className="section-label" style={{ marginTop: 0 }}>이름</div>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 랜드마인 프레스" data-testid="custom-name" />
      <div className="section-label">기구</div>
      <select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
        {(Object.keys(EQUIPMENT_NAMES) as Equipment[]).map((eq) => (
          <option key={eq} value={eq}>
            {EQUIPMENT_NAMES[eq]}
          </option>
        ))}
      </select>
      <div className="section-label">주동근 (1개 이상 선택)</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ALL_MUSCLES.map((m) => (
          <button key={m} className={`chip ${primary.includes(m) ? 'accent' : ''}`} onClick={() => toggleMuscle(m)}>
            {MUSCLE_NAMES[m]}
          </button>
        ))}
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
          취소
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={!name.trim() || primary.length === 0}
          onClick={() =>
            onCreate({ name: name.trim(), nameEn: name.trim(), equipment, primaryMuscles: primary, secondaryMuscles: [] })
          }
          data-testid="custom-create"
        >
          만들기
        </button>
      </div>
    </div>
  )
}
