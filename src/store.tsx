import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AppData, Exercise, Routine, SetEntry, Settings, Workout } from './types'
import { loadData, saveData, STORAGE_KEY } from './lib/storage'
import { previousSets } from './lib/history'
import { uid } from './lib/formulas'

interface Store {
  data: AppData
  saveFailed: boolean
  update: (fn: (d: AppData) => AppData) => void
  addCustomExercise: (ex: Omit<Exercise, 'id' | 'isCustom'>) => Exercise
  saveRoutine: (r: Routine) => void
  deleteRoutine: (id: string) => void
  startWorkout: (routine?: Routine) => boolean
  updateActiveWorkout: (fn: (w: Workout) => Workout) => void
  finishWorkout: () => Workout | null
  discardWorkout: () => void
  updateWorkout: (w: Workout) => void
  deleteWorkout: (id: string) => void
  updateSettings: (s: Partial<Settings>) => void
  replaceAll: (d: AppData) => void
}

const StoreContext = createContext<Store | null>(null)

function buildInitialSets(
  targets: { targetWeight?: number; targetReps?: number; type: SetEntry['type'] }[],
  prev: SetEntry[] | null
): SetEntry[] {
  if (targets.length > 0) {
    // 목표와 짝지을 때는 웜업을 제외한 본 세트끼리 위치를 맞춘다
    const work = prev?.filter((p) => p.type !== 'warmup') ?? null
    return targets.map((t, i) => ({
      id: uid(),
      weight: t.targetWeight ?? work?.[i]?.weight ?? 0,
      reps: t.targetReps ?? work?.[i]?.reps ?? 0,
      type: t.type,
      done: false,
    }))
  }
  if (prev && prev.length > 0) {
    return prev.map((p) => ({ id: uid(), weight: p.weight, reps: p.reps, type: p.type, done: false }))
  }
  return [{ id: uid(), weight: 0, reps: 0, type: 'normal', done: false }]
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())
  const [saveFailed, setSaveFailed] = useState(false)
  const skipNextSave = useRef(false)

  // 상태 → localStorage 영속화 (업데이터 밖에서 수행: StrictMode/쿼터 예외에 안전)
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    setSaveFailed(!saveData(data))
  }, [data])

  // 다른 탭/창의 쓰기를 반영해 last-write-wins 데이터 손실을 방지
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        skipNextSave.current = true // 방금 읽은 것을 곧바로 되쓰지 않는다
        setData(loadData())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData(fn)
  }, [])

  const store = useMemo<Store>(() => {
    return {
      data,
      saveFailed,
      update,
      addCustomExercise(ex) {
        const created: Exercise = { ...ex, id: `custom-${uid()}`, isCustom: true }
        update((d) => ({ ...d, customExercises: [...d.customExercises, created] }))
        return created
      },
      saveRoutine(r) {
        update((d) => {
          const exists = d.routines.some((x) => x.id === r.id)
          return { ...d, routines: exists ? d.routines.map((x) => (x.id === r.id ? r : x)) : [...d.routines, r] }
        })
      },
      deleteRoutine(id) {
        update((d) => ({ ...d, routines: d.routines.filter((r) => r.id !== id) }))
      },
      startWorkout(routine) {
        if (data.activeWorkout) return false
        const w: Workout = {
          id: uid(),
          name: routine ? routine.name : '워크아웃',
          routineId: routine?.id,
          startedAt: Date.now(),
          exercises: (routine?.exercises ?? []).map((re) => ({
            id: uid(),
            exerciseId: re.exerciseId,
            sets: buildInitialSets(re.sets, previousSets(data.workouts, re.exerciseId)),
          })),
        }
        update((d) => {
          if (d.activeWorkout) return d
          const routines = routine
            ? d.routines.map((r) => (r.id === routine.id ? { ...r, lastUsedAt: w.startedAt } : r))
            : d.routines
          return { ...d, activeWorkout: w, routines }
        })
        return true
      },
      updateActiveWorkout(fn) {
        update((d) => (d.activeWorkout ? { ...d, activeWorkout: fn(d.activeWorkout) } : d))
      },
      finishWorkout() {
        const aw = data.activeWorkout
        if (!aw) return null
        const finished: Workout = {
          ...aw,
          endedAt: Date.now(),
          // 완료 체크된 세트만 남기고, 세트가 없는 운동은 정리
          exercises: aw.exercises
            .map((we) => ({ ...we, sets: we.sets.filter((s) => s.done) }))
            .filter((we) => we.sets.length > 0),
        }
        update((d) =>
          d.activeWorkout ? { ...d, activeWorkout: null, workouts: [...d.workouts, finished] } : d
        )
        return finished
      },
      discardWorkout() {
        update((d) => ({ ...d, activeWorkout: null }))
      },
      updateWorkout(w) {
        update((d) => ({ ...d, workouts: d.workouts.map((x) => (x.id === w.id ? w : x)) }))
      },
      deleteWorkout(id) {
        update((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) }))
      },
      updateSettings(s) {
        update((d) => ({ ...d, settings: { ...d.settings, ...s } }))
      },
      replaceAll(next) {
        update(() => next)
      },
    }
  }, [data, saveFailed, update])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const s = useContext(StoreContext)
  if (!s) throw new Error('StoreProvider missing')
  return s
}
