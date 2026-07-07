import { useEffect, useRef, useState } from 'react'
import type { Routine, Workout } from './types'
import { useStore } from './store'
import { uid } from './lib/formulas'
import HomeScreen from './screens/HomeScreen'
import RoutinesScreen from './screens/RoutinesScreen'
import HistoryScreen from './screens/HistoryScreen'
import StatsScreen from './screens/StatsScreen'
import ExercisesScreen from './screens/ExercisesScreen'
import WorkoutScreen from './screens/WorkoutScreen'
import SummarySheet from './components/SummarySheet'
import { RestTimerBar, useRestTimer } from './components/RestTimer'

type Tab = 'home' | 'routines' | 'history' | 'stats' | 'exercises'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'home', label: '홈', icon: '🏠' },
  { key: 'routines', label: '루틴', icon: '📋' },
  { key: 'history', label: '기록', icon: '📅' },
  { key: 'stats', label: '통계', icon: '📊' },
  { key: 'exercises', label: '운동', icon: '💪' },
]

export default function App() {
  const { data, saveFailed, startWorkout } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [inWorkout, setInWorkout] = useState(false)
  const [finished, setFinished] = useState<Workout | null>(null)
  const rest = useRestTimer()
  const prevActive = useRef(data.activeWorkout)

  // 워크아웃이 새로 시작되면 로깅 화면으로 진입, 종료되면 빠져나오고 타이머 정리
  useEffect(() => {
    if (data.activeWorkout && !prevActive.current) setInWorkout(true)
    if (!data.activeWorkout) {
      setInWorkout(false)
      rest.stop()
    }
    prevActive.current = data.activeWorkout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.activeWorkout])

  // 이미 진행 중이면 새로 시작하는 대신 진행 중인 워크아웃으로 복귀 (조용한 무시 방지)
  const tryStart = (routine?: Routine) => {
    if (data.activeWorkout) {
      setInWorkout(true)
      return
    }
    startWorkout(routine)
  }

  const repeatWorkout = (w: Workout) => {
    if (data.activeWorkout) {
      alert('이미 진행 중인 워크아웃이 있습니다.')
      setInWorkout(true)
      return
    }
    // 원본 루틴이 남아 있으면 링크를 유지해 운동별 휴식 시간이 살아있게 한다
    const linkedId = w.routineId && data.routines.some((r) => r.id === w.routineId) ? w.routineId : uid()
    const pseudo: Routine = {
      id: linkedId,
      name: w.name,
      createdAt: Date.now(),
      exercises: w.exercises.map((we) => ({
        exerciseId: we.exerciseId,
        sets: we.sets.map((s) => ({ type: s.type, targetWeight: s.weight, targetReps: s.reps })),
      })),
    }
    startWorkout(pseudo)
  }

  const restBar = rest.timer && (
    <RestTimerBar remaining={rest.remaining} totalSec={rest.timer.totalSec} onAdd={rest.add} onSkip={rest.stop} />
  )

  const saveWarning = saveFailed && (
    <div
      style={{
        position: 'fixed',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        background: 'var(--danger)',
        color: '#fff',
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      ⚠ 저장 공간이 부족해 변경사항이 저장되지 않습니다
    </div>
  )

  if (inWorkout && data.activeWorkout) {
    return (
      <>
        <WorkoutScreen
          onFinish={(w) => setFinished(w)}
          onRest={(sec) => rest.start(sec)}
          onMinimize={() => setInWorkout(false)}
        />
        {restBar}
        {saveWarning}
        {finished && <SummarySheet workout={finished} onClose={() => setFinished(null)} />}
      </>
    )
  }

  return (
    <>
      {tab === 'home' && (
        <HomeScreen
          onStartEmpty={() => tryStart()}
          onStartRoutine={(r) => tryStart(r)}
          onGoRoutines={() => setTab('routines')}
        />
      )}
      {tab === 'routines' && <RoutinesScreen onStart={(r) => tryStart(r)} />}
      {tab === 'history' && <HistoryScreen onRepeat={repeatWorkout} />}
      {tab === 'stats' && <StatsScreen />}
      {tab === 'exercises' && <ExercisesScreen />}

      {data.activeWorkout && (
        <button
          className="btn btn-primary"
          style={{
            position: 'fixed',
            bottom: 74,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
          }}
          onClick={() => setInWorkout(true)}
          data-testid="resume-workout"
        >
          ▶ 진행 중인 워크아웃 이어가기
        </button>
      )}

      {/* 최소화 상태에서도 휴식 타이머가 계속 보이도록 */}
      {!data.activeWorkout ? null : restBar}
      {saveWarning}

      {finished && <SummarySheet workout={finished} onClose={() => setFinished(null)} />}

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key)}
            data-testid={`tab-${t.key}`}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </>
  )
}
