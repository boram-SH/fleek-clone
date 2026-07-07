import type { Exercise, MuscleId, Workout } from '../types'
import { ALL_MUSCLES } from '../data/muscles'

// 근육 피로도 엔진 — PLAN.md 3장 알고리즘.
// 세트 임펄스(주동근 1.0 / 협응근 0.5 × K)를 지수 감쇠로 누적. 7일 창 밖은 0.

const LARGE_MUSCLES: ReadonlySet<MuscleId> = new Set<MuscleId>([
  'quads',
  'hamstrings',
  'glutes',
  'lats',
  'chest',
  'lower_back',
])

const TAU_LARGE_H = 34
const TAU_SMALL_H = 22
const K = 100 / 6 // 하드세트 6개 ≈ 피로도 100
const WINDOW_H = 168 // 7일

function tau(m: MuscleId): number {
  return LARGE_MUSCLES.has(m) ? TAU_LARGE_H : TAU_SMALL_H
}

export type MuscleValues = Partial<Record<MuscleId, number>>

// at 시점의 근육별 피로도(0~100)
export function muscleFatigue(
  workouts: Workout[],
  exerciseOf: (id: string) => Exercise | undefined,
  at: number
): MuscleValues {
  const fatigue: MuscleValues = {}
  for (const w of workouts) {
    for (const we of w.exercises) {
      const ex = exerciseOf(we.exerciseId)
      if (!ex) continue
      for (const s of we.sets) {
        if (!s.done || s.type === 'warmup') continue
        const t = s.doneAt ?? w.endedAt ?? w.startedAt
        const dtH = (at - t) / 3_600_000
        if (dtH < 0 || dtH > WINDOW_H) continue
        for (const m of ex.primaryMuscles) {
          fatigue[m] = (fatigue[m] ?? 0) + K * Math.exp(-dtH / tau(m))
        }
        for (const m of ex.secondaryMuscles) {
          fatigue[m] = (fatigue[m] ?? 0) + 0.5 * K * Math.exp(-dtH / tau(m))
        }
      }
    }
  }
  for (const m of Object.keys(fatigue) as MuscleId[]) {
    fatigue[m] = Math.min(100, fatigue[m] ?? 0)
  }
  return fatigue
}

export interface MuscleUsage {
  muscle: MuscleId
  sets: number // 분수 세트 (주동 1.0 / 협응 0.5)
  volume: number // kg (같은 가중치 적용)
}

// 기간 내 사용 근육 통계. sinceMs가 null이면 전체 기간.
export function usedMuscles(
  workouts: Workout[],
  exerciseOf: (id: string) => Exercise | undefined,
  sinceMs: number | null,
  now: number
): MuscleUsage[] {
  const acc = new Map<MuscleId, { sets: number; volume: number }>()
  const add = (m: MuscleId, w: number, vol: number) => {
    const cur = acc.get(m) ?? { sets: 0, volume: 0 }
    cur.sets += w
    cur.volume += vol * w
    acc.set(m, cur)
  }
  for (const w of workouts) {
    const t = w.endedAt ?? w.startedAt
    if (sinceMs !== null && (t < sinceMs || t > now)) continue
    for (const we of w.exercises) {
      const ex = exerciseOf(we.exerciseId)
      if (!ex) continue
      for (const s of we.sets) {
        if (!s.done || s.type === 'warmup') continue
        const vol = s.weight * s.reps
        for (const m of ex.primaryMuscles) add(m, 1, vol)
        for (const m of ex.secondaryMuscles) add(m, 0.5, vol)
      }
    }
  }
  return ALL_MUSCLES.filter((m) => acc.has(m))
    .map((m) => ({ muscle: m, ...acc.get(m)! }))
    .sort((a, b) => b.sets - a.sets)
}

// 사용 근육 → 상대 강도(0~1) 히트맵 값
export function usageIntensity(usages: MuscleUsage[]): MuscleValues {
  const max = Math.max(0, ...usages.map((u) => u.sets))
  if (max === 0) return {}
  const out: MuscleValues = {}
  for (const u of usages) out[u.muscle] = u.sets / max
  return out
}

// 워크아웃 1개가 자극한 근육 히트맵 (요약 화면용)
export function workoutMuscles(
  w: Workout,
  exerciseOf: (id: string) => Exercise | undefined
): MuscleValues {
  return usageIntensity(usedMuscles([w], exerciseOf, null, Number.MAX_SAFE_INTEGER))
}
