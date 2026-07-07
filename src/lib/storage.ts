import type {
  AppData,
  Equipment,
  Exercise,
  MuscleId,
  Routine,
  RoutineExercise,
  RoutineSet,
  SetEntry,
  SetType,
  Workout,
  WorkoutExercise,
} from '../types'
import { ALL_MUSCLES } from '../data/muscles'
import { uid } from './formulas'

export const STORAGE_KEY = 'fleek-clone-data-v1'

export function defaultData(): AppData {
  return {
    version: 1,
    customExercises: [],
    routines: [],
    workouts: [],
    activeWorkout: null,
    settings: { defaultRestSec: 90, bodyWeightKg: 70 },
  }
}

// ── 런타임 검증: localStorage/가져오기 파일은 신뢰할 수 없으므로 형태를 강제한다
function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function num(x: unknown, fallback: number): number {
  return typeof x === 'number' && Number.isFinite(x) ? x : fallback
}

function str(x: unknown, fallback: string): string {
  return typeof x === 'string' ? x : fallback
}

const SET_TYPES: SetType[] = ['normal', 'warmup', 'drop', 'failure']
const EQUIPMENTS: Equipment[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'other']
const MUSCLE_SET = new Set<string>(ALL_MUSCLES)

function muscles(x: unknown): MuscleId[] {
  if (!Array.isArray(x)) return []
  return x.filter((m): m is MuscleId => typeof m === 'string' && MUSCLE_SET.has(m))
}

function sanitizeSet(x: unknown): SetEntry | null {
  if (!isObj(x)) return null
  return {
    id: str(x.id, '') || uid(),
    weight: Math.max(0, num(x.weight, 0)),
    reps: Math.max(0, Math.floor(num(x.reps, 0))),
    type: SET_TYPES.includes(x.type as SetType) ? (x.type as SetType) : 'normal',
    done: x.done === true,
    doneAt: typeof x.doneAt === 'number' && Number.isFinite(x.doneAt) ? x.doneAt : undefined,
  }
}

function sanitizeWorkoutExercise(x: unknown): WorkoutExercise | null {
  if (!isObj(x) || typeof x.exerciseId !== 'string' || !x.exerciseId) return null
  const sets = Array.isArray(x.sets) ? x.sets.map(sanitizeSet).filter((s): s is SetEntry => s !== null) : []
  return {
    id: str(x.id, '') || uid(),
    exerciseId: x.exerciseId,
    sets,
    memo: typeof x.memo === 'string' ? x.memo : undefined,
  }
}

function sanitizeWorkout(x: unknown): Workout | null {
  if (!isObj(x)) return null
  const startedAt = num(x.startedAt, NaN)
  if (!Number.isFinite(startedAt)) return null
  return {
    id: str(x.id, '') || uid(),
    name: str(x.name, '워크아웃'),
    routineId: typeof x.routineId === 'string' ? x.routineId : undefined,
    startedAt,
    endedAt: typeof x.endedAt === 'number' && Number.isFinite(x.endedAt) ? x.endedAt : undefined,
    exercises: Array.isArray(x.exercises)
      ? x.exercises.map(sanitizeWorkoutExercise).filter((e): e is WorkoutExercise => e !== null)
      : [],
  }
}

function sanitizeRoutineSet(x: unknown): RoutineSet {
  const o = isObj(x) ? x : {}
  const tw = num(o.targetWeight, NaN)
  const tr = num(o.targetReps, NaN)
  return {
    type: SET_TYPES.includes(o.type as SetType) ? (o.type as SetType) : 'normal',
    targetWeight: Number.isFinite(tw) && tw > 0 ? tw : undefined,
    targetReps: Number.isFinite(tr) && tr > 0 ? Math.floor(tr) : undefined,
  }
}

function sanitizeRoutineExercise(x: unknown): RoutineExercise | null {
  if (!isObj(x) || typeof x.exerciseId !== 'string' || !x.exerciseId) return null
  const rest = num(x.restSec, NaN)
  return {
    exerciseId: x.exerciseId,
    restSec: Number.isFinite(rest) && rest > 0 ? rest : undefined,
    sets: Array.isArray(x.sets) && x.sets.length > 0 ? x.sets.map(sanitizeRoutineSet) : [{ type: 'normal' }],
  }
}

function sanitizeRoutine(x: unknown): Routine | null {
  if (!isObj(x) || typeof x.name !== 'string' || !x.name) return null
  return {
    id: str(x.id, '') || uid(),
    name: x.name,
    exercises: Array.isArray(x.exercises)
      ? x.exercises.map(sanitizeRoutineExercise).filter((e): e is RoutineExercise => e !== null)
      : [],
    createdAt: num(x.createdAt, Date.now()),
    lastUsedAt: typeof x.lastUsedAt === 'number' && Number.isFinite(x.lastUsedAt) ? x.lastUsedAt : undefined,
  }
}

function sanitizeExercise(x: unknown): Exercise | null {
  if (!isObj(x) || typeof x.name !== 'string' || !x.name) return null
  const primary = muscles(x.primaryMuscles)
  if (primary.length === 0) return null
  return {
    id: str(x.id, '') || `custom-${uid()}`,
    name: x.name,
    nameEn: str(x.nameEn, x.name),
    equipment: EQUIPMENTS.includes(x.equipment as Equipment) ? (x.equipment as Equipment) : 'other',
    primaryMuscles: primary,
    secondaryMuscles: muscles(x.secondaryMuscles),
    isCustom: true,
  }
}

// 알 수 없는 입력을 유효한 AppData로 복구. 문서 자체가 성립 불가하면 null.
export function sanitizeData(parsed: unknown): AppData | null {
  if (!isObj(parsed) || parsed.version !== 1) return null
  const d = defaultData()
  const s = isObj(parsed.settings) ? parsed.settings : {}
  const active = sanitizeWorkout(parsed.activeWorkout)
  return {
    version: 1,
    customExercises: Array.isArray(parsed.customExercises)
      ? parsed.customExercises.map(sanitizeExercise).filter((e): e is Exercise => e !== null)
      : [],
    routines: Array.isArray(parsed.routines)
      ? parsed.routines.map(sanitizeRoutine).filter((r): r is Routine => r !== null)
      : [],
    workouts: Array.isArray(parsed.workouts)
      ? parsed.workouts.map(sanitizeWorkout).filter((w): w is Workout => w !== null)
      : [],
    activeWorkout: active && active.exercises.length > 0 ? active : null,
    settings: {
      defaultRestSec: Math.max(5, num(s.defaultRestSec, d.settings.defaultRestSec)),
      bodyWeightKg: Math.max(1, num(s.bodyWeightKg, d.settings.bodyWeightKg)),
    },
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    return sanitizeData(JSON.parse(raw)) ?? defaultData()
  } catch {
    return defaultData()
  }
}

// 저장 실패(쿼터 초과 등) 시 false — 호출부에서 사용자에게 알린다
export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function exportJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}
