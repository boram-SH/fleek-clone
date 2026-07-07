import type { AppData, Equipment, Exercise, MuscleId } from '../types'
import { SEED_EXERCISES } from '../data/exercises'

export function allExercises(data: AppData): Exercise[] {
  return [...SEED_EXERCISES, ...data.customExercises]
}

export function exerciseLookup(data: AppData): (id: string) => Exercise | undefined {
  const map = new Map<string, Exercise>()
  for (const e of allExercises(data)) map.set(e.id, e)
  return (id) => map.get(id)
}

export const EQUIPMENT_NAMES: Record<Equipment, string> = {
  barbell: '바벨',
  dumbbell: '덤벨',
  machine: '머신',
  cable: '케이블',
  bodyweight: '맨몸',
  kettlebell: '케틀벨',
  band: '밴드',
  other: '기타',
}

export function searchExercises(
  data: AppData,
  query: string,
  muscle: MuscleId | null
): Exercise[] {
  const q = query.trim().toLowerCase()
  return allExercises(data).filter((e) => {
    if (muscle && !e.primaryMuscles.includes(muscle) && !e.secondaryMuscles.includes(muscle)) return false
    if (!q) return true
    return e.name.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q)
  })
}
