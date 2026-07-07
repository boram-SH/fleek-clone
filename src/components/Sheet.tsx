import { useRef, type ReactNode } from 'react'

export default function Sheet({
  title,
  onClose,
  confirmClose,
  children,
}: {
  title: string
  onClose: () => void
  // 닫기 전 확인이 필요하면 제공 — false를 반환하면 닫지 않는다
  confirmClose?: () => boolean
  children: ReactNode
}) {
  const downOnBackdrop = useRef(false)

  const requestClose = () => {
    if (!confirmClose || confirmClose()) onClose()
  }

  return (
    <div
      className="sheet-backdrop"
      // 시트 안에서 드래그를 시작해 백드롭에서 떼는 경우(click이 백드롭에서 발생)를 무시:
      // 누르기 시작한 지점이 백드롭일 때만 닫는다
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && downOnBackdrop.current) requestClose()
      }}
    >
      <div className="sheet">
        <div className="row between" style={{ marginBottom: 4 }}>
          <div className="sheet-title" style={{ marginBottom: 0 }}>
            {title}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={requestClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
