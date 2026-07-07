import type { MuscleId } from '../types'

export const MUSCLE_NAMES: Record<MuscleId, string> = {
  chest: '가슴',
  front_delts: '전면 어깨',
  side_delts: '측면 어깨',
  rear_delts: '후면 어깨',
  biceps: '이두',
  triceps: '삼두',
  forearms: '전완',
  abs: '복근',
  obliques: '복사근',
  quads: '대퇴사두',
  hamstrings: '햄스트링',
  glutes: '둔근',
  calves: '종아리',
  lats: '광배',
  traps: '승모',
  upper_back: '등 상부',
  lower_back: '허리',
}

export const ALL_MUSCLES = Object.keys(MUSCLE_NAMES) as MuscleId[]
