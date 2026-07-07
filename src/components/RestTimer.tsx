import { useEffect, useRef, useState } from 'react'
import { formatClock } from '../lib/formulas'

export interface RestTimerState {
  endsAt: number
  totalSec: number
}

// iOS WebKit은 사용자 제스처 밖에서 만든 AudioContext를 suspended로 묶어 두므로
// 컨텍스트 하나를 공유하고, 세트 완료 탭(제스처) 시점에 resume해 잠금을 푼다.
let sharedCtx: AudioContext | null = null

function getAudioCtx(): AudioContext | null {
  if (sharedCtx) return sharedCtx
  try {
    const Ctx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    sharedCtx = new Ctx()
    return sharedCtx
  } catch {
    return null
  }
}

function unlockAudio() {
  const ctx = getAudioCtx()
  if (ctx && ctx.state === 'suspended') void ctx.resume()
}

function beep() {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
    osc.start()
    osc.stop(ctx.currentTime + 0.7)
  } catch {
    // 오디오 미지원 환경은 무시
  }
}

export function useRestTimer() {
  const [timer, setTimer] = useState<RestTimerState | null>(null)
  const [, setTick] = useState(0)
  // 만료 알림을 이미 울린 마감 시각 — endsAt이 바뀌면(연장) 자동으로 재무장된다
  const firedForRef = useRef<number | null>(null)

  useEffect(() => {
    if (!timer) return
    const iv = setInterval(() => setTick((t) => t + 1), 500)
    return () => clearInterval(iv)
  }, [timer])

  const remaining = timer ? Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000)) : 0

  useEffect(() => {
    if (!timer) {
      firedForRef.current = null
      return
    }
    if (remaining <= 0 && firedForRef.current !== timer.endsAt) {
      firedForRef.current = timer.endsAt
      beep()
      if (navigator.vibrate) navigator.vibrate([250, 100, 250])
      const to = setTimeout(() => setTimer(null), 1200)
      return () => clearTimeout(to)
    }
  }, [remaining, timer])

  return {
    timer,
    remaining,
    start(sec: number) {
      unlockAudio() // 세트 완료 탭 = 사용자 제스처
      firedForRef.current = null
      setTimer({ endsAt: Date.now() + sec * 1000, totalSec: sec })
    },
    stop() {
      setTimer(null)
    },
    add(deltaSec: number) {
      unlockAudio()
      setTimer((t) => {
        if (!t) return t
        const newEnd = Math.max(Date.now() + 1000, t.endsAt + deltaSec * 1000)
        return { endsAt: newEnd, totalSec: Math.max(1, t.totalSec + deltaSec) }
      })
    },
  }
}

export function RestTimerBar({
  remaining,
  totalSec,
  onAdd,
  onSkip,
}: {
  remaining: number
  totalSec: number
  onAdd: (d: number) => void
  onSkip: () => void
}) {
  const pct = totalSec > 0 ? Math.max(0, Math.min(100, (remaining / totalSec) * 100)) : 0
  return (
    <div className="rest-bar" data-testid="rest-bar">
      <div className="rest-time">{formatClock(remaining)}</div>
      <div className="rest-progress">
        <div style={{ width: `${pct}%` }} />
      </div>
      <button className="btn btn-secondary btn-sm" onClick={() => onAdd(-15)}>
        -15
      </button>
      <button className="btn btn-secondary btn-sm" onClick={() => onAdd(15)}>
        +15
      </button>
      <button className="btn btn-primary btn-sm" onClick={onSkip}>
        건너뛰기
      </button>
    </div>
  )
}
