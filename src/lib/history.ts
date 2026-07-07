import type { SetEntry, Workout } from '../types'
import { estimate1RM, exerciseVolume, setVolume } from './formulas'

// 완료된 워크아웃을 최신순으로
export function sortedWorkouts(workouts: Workout[]): Workout[] {
  return [...workouts].sort((a, b) => b.startedAt - a.startedAt)
}

// 해당 운동의 가장 최근 세션 세트들 (로깅 화면 미리 채움용)
export function previousSets(workouts: Workout[], exerciseId: string): SetEntry[] | null {
  for (const w of sortedWorkouts(workouts)) {
    for (const we of w.exercises) {
      if (we.exerciseId === exerciseId) {
        const done = we.sets.filter((s) => s.done)
        if (done.length > 0) return done
      }
    }
  }
  return null
}

export interface TopRecords {
  max1RM: number
  maxVolume: number // 단일 세션 최대 볼륨
  maxWeight: number
  sessionCount: number
}

export function topRecords(workouts: Workout[], exerciseId: string): TopRecords {
  let max1RM = 0
  let maxVolume = 0
  let maxWeight = 0
  let sessionCount = 0
  for (const w of workouts) {
    // 같은 운동이 한 워크아웃에 여러 번 있어도 세션 1회·볼륨 합산으로 집계
    let sessionVolume = 0
    let touched = false
    for (const we of w.exercises) {
      if (we.exerciseId !== exerciseId) continue
      const doneSets = we.sets.filter((s) => s.done && s.type !== 'warmup')
      if (doneSets.length === 0) continue
      touched = true
      sessionVolume += exerciseVolume(we)
      for (const s of doneSets) {
        maxWeight = Math.max(maxWeight, s.weight)
        max1RM = Math.max(max1RM, estimate1RM(s.weight, s.reps))
      }
    }
    if (touched) {
      sessionCount++
      maxVolume = Math.max(maxVolume, sessionVolume)
    }
  }
  return { max1RM, maxVolume, maxWeight, sessionCount }
}

export interface ChartPoint {
  t: number
  value: number
}

// 세션별 베스트 세트 e1RM 추이
export function e1rmSeries(workouts: Workout[], exerciseId: string): ChartPoint[] {
  const pts: ChartPoint[] = []
  for (const w of sortedWorkouts(workouts).reverse()) {
    let best = 0
    for (const we of w.exercises) {
      if (we.exerciseId !== exerciseId) continue
      for (const s of we.sets) {
        if (!s.done || s.type === 'warmup') continue
        best = Math.max(best, estimate1RM(s.weight, s.reps))
      }
    }
    if (best > 0) pts.push({ t: w.startedAt, value: Math.round(best * 10) / 10 })
  }
  return pts
}

// 세션별 볼륨 추이 (특정 운동)
export function volumeSeries(workouts: Workout[], exerciseId: string): ChartPoint[] {
  const pts: ChartPoint[] = []
  for (const w of sortedWorkouts(workouts).reverse()) {
    let vol = 0
    for (const we of w.exercises) {
      if (we.exerciseId === exerciseId) vol += exerciseVolume(we)
    }
    if (vol > 0) pts.push({ t: w.startedAt, value: vol })
  }
  return pts
}

export interface WeekBar {
  label: string // 'M/D' (주 시작일)
  volume: number
  workouts: number
}

// 최근 n주 주간 볼륨 (월요일 시작). 고정 ms 산술 대신 달력 산술 — DST 시간대에서도 경계가 자정 유지
export function weeklyVolume(workouts: Workout[], weeks: number, now: number): WeekBar[] {
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)) // 월=0
  const weekStarts: number[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const s = new Date(monday)
    s.setDate(s.getDate() - i * 7)
    weekStarts.push(s.getTime())
  }
  return weekStarts.map((start) => {
    const e = new Date(start)
    e.setDate(e.getDate() + 7)
    const end = e.getTime()
    let volume = 0
    let count = 0
    for (const w of workouts) {
      if (w.startedAt >= start && w.startedAt < end) {
        count++
        for (const we of w.exercises) volume += exerciseVolume(we)
      }
    }
    const sd = new Date(start)
    return { label: `${sd.getMonth() + 1}/${sd.getDate()}`, volume, workouts: count }
  })
}

export type PrKind = 'weight' | 'e1rm' | 'volume' | 'reps'

export const PR_LABELS: Record<PrKind, string> = {
  weight: '최고 무게',
  e1rm: '최고 1RM',
  volume: '최고 볼륨',
  reps: '최다 횟수',
}

// 이 워크아웃에서 갱신된 PR 계산 (해당 워크아웃 이전 기록과 비교).
// 결과 키는 WorkoutExercise.id — 같은 운동이 두 번 들어가도 배지는 운동당 한 번, 볼륨은 합산 비교.
export function detectPRs(allWorkouts: Workout[], target: Workout): Map<string, PrKind[]> {
  const prior = allWorkouts.filter((w) => w.id !== target.id && w.startedAt < target.startedAt)
  const result = new Map<string, PrKind[]>()

  // exerciseId별로 이 워크아웃 내 모든 엔트리를 합쳐 집계
  const byExercise = new Map<string, { firstEntryId: string; sets: typeof target.exercises[number]['sets'] }>()
  for (const we of target.exercises) {
    const doneSets = we.sets.filter((s) => s.done && s.type !== 'warmup')
    if (doneSets.length === 0) continue
    const cur = byExercise.get(we.exerciseId)
    if (cur) cur.sets = [...cur.sets, ...doneSets]
    else byExercise.set(we.exerciseId, { firstEntryId: we.id, sets: doneSets })
  }

  for (const [exerciseId, { firstEntryId, sets }] of byExercise) {
    const prev = topRecords(prior, exerciseId)
    if (prev.sessionCount === 0) continue // 첫 수행은 전부 신기록이므로 배지 생략
    const kinds: PrKind[] = []
    const myWeight = Math.max(...sets.map((s) => s.weight))
    const my1RM = Math.max(...sets.map((s) => estimate1RM(s.weight, s.reps)))
    const myVol = sets.reduce((a, s) => a + setVolume(s), 0)
    const myReps = Math.max(...sets.map((s) => s.reps))
    if (myWeight > prev.maxWeight) kinds.push('weight')
    if (my1RM > prev.max1RM) kinds.push('e1rm')
    if (myVol > prev.maxVolume) kinds.push('volume')
    if (myReps > maxReps(prior, exerciseId)) kinds.push('reps')
    if (kinds.length > 0) result.set(firstEntryId, kinds)
  }
  return result
}

function maxReps(workouts: Workout[], exerciseId: string): number {
  let max = 0
  for (const w of workouts) {
    for (const we of w.exercises) {
      if (we.exerciseId !== exerciseId) continue
      for (const s of we.sets) {
        if (s.done && s.type !== 'warmup') max = Math.max(max, s.reps)
      }
    }
  }
  return max
}

// MET 기반 칼로리 추정
export function estimateCalories(durationMs: number, bodyWeightKg: number): number {
  const MET = 5.0
  return Math.round(MET * bodyWeightKg * (durationMs / 3_600_000))
}

// 캘린더: 해당 월의 날짜별 워크아웃 수 (key: 'YYYY-M-D')
export function workoutsByDay(workouts: Workout[]): Map<string, Workout[]> {
  const map = new Map<string, Workout[]>()
  for (const w of sortedWorkouts(workouts)) {
    const d = new Date(w.startedAt)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const list = map.get(key) ?? []
    list.push(w)
    map.set(key, list)
  }
  return map
}

export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${month}-${day}`
}
