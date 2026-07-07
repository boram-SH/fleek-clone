import type { SetEntry, Workout, WorkoutExercise } from '../types'

// Epley 공식으로 1RM 추정. reps=1이면 무게 그대로.
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export function setVolume(s: SetEntry): number {
  if (!s.done || s.type === 'warmup') return 0
  if (s.weight < 0 || s.reps < 0) return 0 // 과거에 저장된 비정상 값 방어
  return s.weight * s.reps
}

// 입력 문자열 → 0 이상 유한수로 클램프 (음수/Infinity/NaN 차단)
export function parseNum(raw: string, max = 2000): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 0
  return Math.min(max, Math.max(0, n))
}

export function exerciseVolume(we: WorkoutExercise): number {
  return we.sets.reduce((acc, s) => acc + setVolume(s), 0)
}

export function workoutVolume(w: Workout): number {
  return w.exercises.reduce((acc, we) => acc + exerciseVolume(we), 0)
}

export function workoutSetCount(w: Workout): number {
  return w.exercises.reduce((acc, we) => acc + we.sets.filter((s) => s.done && s.type !== 'warmup').length, 0)
}

export function bestSet1RM(we: WorkoutExercise): number {
  return Math.max(0, ...we.sets.filter((s) => s.done && s.type !== 'warmup').map((s) => estimate1RM(s.weight, s.reps)))
}

export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}시간 ${m}분`
  if (m > 0) return `${m}분 ${s}초`
  return `${s}초`
}

export function formatClock(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${Math.round(kg)}kg`
}

export function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
