import { useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { sortedWorkouts, weeklyVolume } from '../lib/history'
import { formatDate, formatDuration, formatVolume, workoutVolume } from '../lib/formulas'
import { exportJson, sanitizeData } from '../lib/storage'
import type { Routine } from '../types'
import Sheet from '../components/Sheet'

export default function HomeScreen({
  onStartEmpty,
  onStartRoutine,
  onGoRoutines,
}: {
  onStartEmpty: () => void
  onStartRoutine: (r: Routine) => void
  onGoRoutines: () => void
}) {
  const { data, updateSettings, replaceAll } = useStore()
  const [showSettings, setShowSettings] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const thisWeek = useMemo(() => weeklyVolume(data.workouts, 1, Date.now())[0], [data.workouts])
  const recent = useMemo(() => sortedWorkouts(data.workouts).slice(0, 3), [data.workouts])
  const quickRoutines = useMemo(
    () => [...data.routines].sort((a, b) => (b.lastUsedAt ?? b.createdAt) - (a.lastUsedAt ?? a.createdAt)).slice(0, 3),
    [data.routines]
  )

  const doExport = () => {
    const blob = new Blob([exportJson(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fleek-clone-backup-${formatDate(Date.now()).replaceAll('.', '')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result))
        // 형태 검증·복구 후에만 교체 — 잘못된 파일이 기존 데이터를 파괴하지 않도록
        const sanitized =
          typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { workouts?: unknown }).workouts)
            ? sanitizeData(parsed)
            : null
        if (!sanitized) throw new Error('bad format')
        if (confirm('현재 데이터를 가져온 데이터로 교체할까요?')) replaceAll(sanitized)
      } catch {
        alert('올바른 백업 파일이 아닙니다.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="screen" data-testid="home-screen">
      <div className="row between">
        <div className="screen-title" style={{ marginBottom: 0 }}>
          FLEEK <span style={{ color: 'var(--accent)' }}>CLONE</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(true)} data-testid="open-settings">
          ⚙ 설정
        </button>
      </div>
      <div className="muted" style={{ margin: '4px 0 18px' }}>
        Logging Maketh Muscle — 로컬 오프라인 운동 기록
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">{thisWeek?.workouts ?? 0}</div>
          <div className="stat-label">이번 주 워크아웃</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{formatVolume(thisWeek?.volume ?? 0)}</div>
          <div className="stat-label">이번 주 볼륨</div>
        </div>
      </div>

      <button className="btn btn-primary btn-block" onClick={onStartEmpty} style={{ margin: '8px 0 4px' }} data-testid="start-empty">
        + 빈 워크아웃 시작
      </button>

      <div className="section-label">루틴으로 시작</div>
      {quickRoutines.length === 0 && (
        <div className="card clickable" onClick={onGoRoutines}>
          <div className="muted">아직 루틴이 없습니다. 루틴 탭에서 첫 루틴을 만들어 보세요 →</div>
        </div>
      )}
      {quickRoutines.map((r) => (
        <div className="card clickable" key={r.id} onClick={() => onStartRoutine(r)} data-testid={`quickstart-${r.name}`}>
          <div className="row between">
            <div>
              <div style={{ fontWeight: 700 }}>{r.name}</div>
              <div className="muted">운동 {r.exercises.length}개</div>
            </div>
            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>시작 ▶</span>
          </div>
        </div>
      ))}

      <div className="section-label">최근 워크아웃</div>
      {recent.length === 0 && <div className="empty-state">아직 기록이 없습니다</div>}
      {recent.map((w) => (
        <div className="card" key={w.id}>
          <div className="row between">
            <div style={{ fontWeight: 600 }}>{w.name}</div>
            <div className="muted">{formatDate(w.startedAt)}</div>
          </div>
          <div className="muted" style={{ marginTop: 4 }}>
            {formatDuration((w.endedAt ?? w.startedAt) - w.startedAt)} · {formatVolume(workoutVolume(w))}
          </div>
        </div>
      ))}

      {showSettings && (
        <Sheet title="설정" onClose={() => setShowSettings(false)}>
          <div className="section-label" style={{ marginTop: 0 }}>체중 (kg) — 칼로리 추정에 사용</div>
          <NumberSetting
            value={data.settings.bodyWeightKg}
            min={1}
            max={300}
            onCommit={(v) => updateSettings({ bodyWeightKg: v })}
            testId="setting-bodyweight"
          />
          <div className="section-label">기본 휴식 시간 (초)</div>
          <NumberSetting
            value={data.settings.defaultRestSec}
            min={5}
            max={900}
            onCommit={(v) => updateSettings({ defaultRestSec: Math.round(v) })}
            testId="setting-rest"
          />
          <div className="section-label">데이터</div>
          <div className="row">
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={doExport}>
              JSON 내보내기
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => fileRef.current?.click()}>
              가져오기
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) doImport(f)
                e.target.value = ''
              }}
            />
          </div>
          <div className="muted" style={{ marginTop: 14 }}>
            모든 데이터는 이 기기 브라우저(localStorage)에만 저장됩니다.
          </div>
        </Sheet>
      )}
    </div>
  )
}

// 입력 중에는 자유롭게 두고, 포커스가 떠날 때만 검증·저장하는 숫자 설정 인풋
function NumberSetting({
  value,
  min,
  max,
  onCommit,
  testId,
}: {
  value: number
  min: number
  max: number
  onCommit: (v: number) => void
  testId: string
}) {
  const [draft, setDraft] = useState(String(value))

  const commit = () => {
    const n = Number(draft)
    const v = Number.isFinite(n) && n >= min ? Math.min(max, n) : value
    onCommit(v)
    setDraft(String(v))
  }

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      data-testid={testId}
    />
  )
}
