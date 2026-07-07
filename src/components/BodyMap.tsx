// BodyMap — 전면/후면 근육 히트맵 (Fleek/MuscleWiki 스타일)
// intensity(0..1)에 따라 dim base(#2a2d3a) → 네온 라임(#c8f542)으로 보간

import type { CSSProperties, ReactNode } from 'react'
import type { MuscleId } from '../types'

interface BodyMapProps {
  intensity: Partial<Record<MuscleId, number>>
  onSelect?: (m: MuscleId) => void
}

const KO: Record<MuscleId, string> = {
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

// #2a2d3a → #c8f542 RGB 보간
const BASE_RGB = [42, 45, 58] as const
const ACCENT_RGB = [200, 245, 66] as const

function heat(v: number): string {
  const t = Math.min(1, Math.max(0, v))
  const r = Math.round(BASE_RGB[0] + (ACCENT_RGB[0] - BASE_RGB[0]) * t)
  const g = Math.round(BASE_RGB[1] + (ACCENT_RGB[1] - BASE_RGB[1]) * t)
  const b = Math.round(BASE_RGB[2] + (ACCENT_RGB[2] - BASE_RGB[2]) * t)
  return `rgb(${r}, ${g}, ${b})`
}

// x=80 세로축 기준 좌우 반전 (좌측 도형을 우측에 복제)
const MIRROR = 'translate(160 0) scale(-1 1)'

const labelStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  fontWeight: 700,
  color: '#9a9eae',
  textAlign: 'center',
  letterSpacing: '0.5px',
}

// 몸 실루엣 (머리·목·몸통·팔·다리) — 근육 도형 뒤에 깔리는 배경
function Silhouette() {
  const limbs = (
    <g>
      {/* 팔: 상완 캡슐 + 전완 캡슐 + 손 */}
      <rect x={37} y={48} width={13} height={48} rx={6.5} />
      <rect x={33} y={94} width={11} height={50} rx={5.5} />
      <circle cx={37} cy={149} r={4.5} />
      {/* 다리: 허벅지 + 종아리 + 발 */}
      <rect x={56} y={122} width={21} height={84} rx={10} />
      <rect x={58} y={198} width={17} height={64} rx={8} />
      <ellipse cx={65} cy={266} rx={8} ry={4.5} />
    </g>
  )
  return (
    <g fill="#14151b" stroke="#2a2d3a" strokeWidth={1} strokeLinejoin="round">
      <circle cx={80} cy={20} r={10} />
      <rect x={75} y={27} width={10} height={15} rx={3} />
      {/* 몸통: 어깨(반폭 31) → 허리(반폭 20) → 골반(반폭 23) */}
      <path d="M 49 45 Q 80 39 111 45 C 110 68 105 84 100 96 C 99 108 102 116 103 126 L 57 126 C 58 116 61 108 60 96 C 55 84 50 68 49 45 Z" />
      {limbs}
      <g transform={MIRROR}>{limbs}</g>
    </g>
  )
}

export default function BodyMap({ intensity, onSelect }: BodyMapProps) {
  const region = (muscle: MuscleId, shapes: ReactNode): ReactNode => {
    const v = Math.min(1, Math.max(0, intensity[muscle] ?? 0))
    return (
      <g
        fill={heat(v)}
        stroke={v > 0 ? 'rgba(200, 245, 66, 0.5)' : 'none'}
        strokeWidth={v > 0 ? 0.75 : 0}
        onClick={onSelect ? () => onSelect(muscle) : undefined}
        style={onSelect ? { cursor: 'pointer' } : undefined}
      >
        <title>{KO[muscle]}</title>
        {shapes}
      </g>
    )
  }

  const detailLine = (x1: number, y1: number, x2: number, y2: number) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0e0f13" strokeWidth={1} opacity={0.5} />
  )

  return (
    <div style={{ display: 'flex', width: '100%', gap: 8, justifyContent: 'center' }}>
      {/* ───────── 전면 ───────── */}
      <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: 220 }}>
        <svg viewBox="0 0 160 300" width="100%" style={{ display: 'block' }} role="img" aria-label="전면 근육 히트맵">
          <Silhouette />

          {/* 승모 (목 옆 상단 일부만 보임) */}
          {region(
            'traps',
            <>
              <path d="M 69 41 Q 59 42.5 53 48 L 69 48 Z" />
              <path d="M 69 41 Q 59 42.5 53 48 L 69 48 Z" transform={MIRROR} />
            </>,
          )}

          {/* 전면 어깨 */}
          {region(
            'front_delts',
            <>
              <ellipse cx={46.5} cy={55} rx={7} ry={8.5} />
              <ellipse cx={46.5} cy={55} rx={7} ry={8.5} transform={MIRROR} />
            </>,
          )}

          {/* 측면 어깨 */}
          {region(
            'side_delts',
            <>
              <ellipse cx={40} cy={59} rx={4.5} ry={8} />
              <ellipse cx={40} cy={59} rx={4.5} ry={8} transform={MIRROR} />
            </>,
          )}

          {/* 가슴 (좌우 대흉근) */}
          {region(
            'chest',
            <>
              <path d="M 79 52 C 68 50.5 58.5 53.5 55.5 59.5 C 53.5 67.5 57.5 74.5 63.5 77 C 70.5 79.5 77 78 79 76.5 Z" />
              <path d="M 79 52 C 68 50.5 58.5 53.5 55.5 59.5 C 53.5 67.5 57.5 74.5 63.5 77 C 70.5 79.5 77 78 79 76.5 Z" transform={MIRROR} />
            </>,
          )}

          {/* 이두 */}
          {region(
            'biceps',
            <>
              <ellipse cx={43.5} cy={80} rx={6} ry={13.5} />
              <ellipse cx={43.5} cy={80} rx={6} ry={13.5} transform={MIRROR} />
            </>,
          )}

          {/* 전완 (앞면) */}
          {region(
            'forearms',
            <>
              <ellipse cx={38.5} cy={117} rx={5} ry={17.5} />
              <ellipse cx={38.5} cy={117} rx={5} ry={17.5} transform={MIRROR} />
            </>,
          )}

          {/* 복근 (중앙 칼럼 + 식스팩 구분선) */}
          {region(
            'abs',
            <>
              <rect x={71.5} y={83} width={17} height={41} rx={6} />
              {detailLine(80, 86, 80, 121)}
              {detailLine(73.5, 94, 86.5, 94)}
              {detailLine(73.5, 104, 86.5, 104)}
              {detailLine(73.5, 114, 86.5, 114)}
            </>,
          )}

          {/* 복사근 (복근 양옆) */}
          {region(
            'obliques',
            <>
              <path d="M 69.5 87 Q 63.5 91 62.5 102 Q 62 114 66 123 L 69.5 122 Z" />
              <path d="M 69.5 87 Q 63.5 91 62.5 102 Q 62 114 66 123 L 69.5 122 Z" transform={MIRROR} />
            </>,
          )}

          {/* 대퇴사두 (바깥 헤드 + 안쪽 내측광근) */}
          {region(
            'quads',
            <>
              <ellipse cx={66} cy={165} rx={10} ry={33} />
              <ellipse cx={73.5} cy={180} rx={3.5} ry={15} />
              <ellipse cx={66} cy={165} rx={10} ry={33} transform={MIRROR} />
              <ellipse cx={73.5} cy={180} rx={3.5} ry={15} transform={MIRROR} />
            </>,
          )}

          {/* 종아리 (앞/안쪽) */}
          {region(
            'calves',
            <>
              <ellipse cx={66.5} cy={228} rx={7} ry={22} />
              <ellipse cx={66.5} cy={228} rx={7} ry={22} transform={MIRROR} />
            </>,
          )}
        </svg>
        <div style={labelStyle}>전면</div>
      </div>

      {/* ───────── 후면 ───────── */}
      <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: 220 }}>
        <svg viewBox="0 0 160 300" width="100%" style={{ display: 'block' }} role="img" aria-label="후면 근육 히트맵">
          <Silhouette />

          {/* 등 상부 (승모 연 좌우 패널) */}
          {region(
            'upper_back',
            <>
              <path d="M 59 53 Q 68 56 74 63 L 75 80 Q 66 73 59 71 Q 56.5 61 59 53 Z" />
              <path d="M 59 53 Q 68 56 74 63 L 75 80 Q 66 73 59 71 Q 56.5 61 59 53 Z" transform={MIRROR} />
            </>,
          )}

          {/* 광배 (날개 모양) */}
          {region(
            'lats',
            <>
              <path d="M 58 74 Q 54 86 58.5 98 Q 64 110 76.5 114 L 77.5 84 Q 68 78 58 74 Z" />
              <path d="M 58 74 Q 54 86 58.5 98 Q 64 110 76.5 114 L 77.5 84 Q 68 78 58 74 Z" transform={MIRROR} />
            </>,
          )}

          {/* 승모 (목→어깨→등 중앙 연 모양, 맨 위 레이어) */}
          {region(
            'traps',
            <path d="M 80 36 Q 66 40 54 48.5 Q 68 51 74.5 59 Q 79 66 80 78 Q 81 66 85.5 59 Q 92 51 106 48.5 Q 94 40 80 36 Z" />,
          )}

          {/* 후면 어깨 */}
          {region(
            'rear_delts',
            <>
              <ellipse cx={46} cy={56} rx={7} ry={8.5} />
              <ellipse cx={46} cy={56} rx={7} ry={8.5} transform={MIRROR} />
            </>,
          )}

          {/* 측면 어깨 (뒤에서 일부 보임) */}
          {region(
            'side_delts',
            <>
              <ellipse cx={39.5} cy={59} rx={4} ry={7.5} />
              <ellipse cx={39.5} cy={59} rx={4} ry={7.5} transform={MIRROR} />
            </>,
          )}

          {/* 삼두 */}
          {region(
            'triceps',
            <>
              <ellipse cx={43.5} cy={81} rx={6} ry={14} />
              <ellipse cx={43.5} cy={81} rx={6} ry={14} transform={MIRROR} />
            </>,
          )}

          {/* 전완 (뒷면) */}
          {region(
            'forearms',
            <>
              <ellipse cx={38.5} cy={117} rx={5} ry={17.5} />
              <ellipse cx={38.5} cy={117} rx={5} ry={17.5} transform={MIRROR} />
            </>,
          )}

          {/* 허리 (기립근 하부, 중앙 칼럼) */}
          {region(
            'lower_back',
            <path d="M 74 106 Q 80 104.5 86 106 L 87.5 126 Q 80 129.5 72.5 126 Z" />,
          )}

          {/* 둔근 */}
          {region(
            'glutes',
            <>
              <ellipse cx={69} cy={140} rx={11.5} ry={13.5} />
              <ellipse cx={69} cy={140} rx={11.5} ry={13.5} transform={MIRROR} />
            </>,
          )}

          {/* 햄스트링 */}
          {region(
            'hamstrings',
            <>
              <ellipse cx={66.5} cy={181} rx={9.5} ry={26} />
              <ellipse cx={66.5} cy={181} rx={9.5} ry={26} transform={MIRROR} />
            </>,
          )}

          {/* 종아리 (뒷면 비복근) */}
          {region(
            'calves',
            <>
              <ellipse cx={66.5} cy={229} rx={7.5} ry={23} />
              <ellipse cx={66.5} cy={229} rx={7.5} ry={23} transform={MIRROR} />
            </>,
          )}
        </svg>
        <div style={labelStyle}>후면</div>
      </div>
    </div>
  )
}
