// 도메인 타입 정의 — 모든 데이터는 localStorage에 저장되는 로컬 우선 모델

export type MuscleId =
  | 'chest'
  | 'front_delts'
  | 'side_delts'
  | 'rear_delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'lats'
  | 'traps'
  | 'upper_back'
  | 'lower_back'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'other'

export interface Exercise {
  id: string
  name: string // 한국어 이름
  nameEn: string
  equipment: Equipment
  primaryMuscles: MuscleId[]
  secondaryMuscles: MuscleId[]
  isCustom?: boolean
}

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure'

export interface SetEntry {
  id: string
  weight: number // kg (0 = 맨몸)
  reps: number
  type: SetType
  done: boolean
  doneAt?: number // 세트 완료 시각 (피로도 계산에 사용)
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  sets: SetEntry[]
  memo?: string
}

export interface Workout {
  id: string
  name: string
  routineId?: string // 루틴에서 시작한 경우
  startedAt: number // epoch ms
  endedAt?: number // 없으면 진행 중
  exercises: WorkoutExercise[]
}

export interface RoutineSet {
  type: SetType
  targetWeight?: number
  targetReps?: number
}

export interface RoutineExercise {
  exerciseId: string
  restSec?: number // 없으면 설정의 기본값 사용
  sets: RoutineSet[]
}

export interface Routine {
  id: string
  name: string
  exercises: RoutineExercise[]
  createdAt: number
  lastUsedAt?: number
}

export interface Settings {
  defaultRestSec: number
  bodyWeightKg: number // 칼로리 추정에 사용
}

export interface AppData {
  version: 1
  customExercises: Exercise[]
  routines: Routine[]
  workouts: Workout[] // 완료된 워크아웃 (최신순 아님, 저장순)
  activeWorkout: Workout | null
  settings: Settings
}
