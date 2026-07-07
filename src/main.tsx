import React, { Component, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { StoreProvider } from './store'
import { STORAGE_KEY } from './lib/storage'
import './styles.css'

// 손상된 상태가 앱 전체를 먹통으로 만들지 않도록 하는 최후 방어선
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  exportRaw = () => {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '{}'
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fleek-clone-raw-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  reset = () => {
    if (confirm('저장된 모든 데이터를 삭제하고 초기화할까요? 필요하면 먼저 백업을 내려받으세요.')) {
      localStorage.removeItem(STORAGE_KEY)
      location.reload()
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h2 style={{ margin: '40px 0 8px' }}>문제가 발생했습니다</h2>
          <p style={{ color: '#9a9eae', marginBottom: 20 }}>
            앱 데이터에 오류가 있을 수 있습니다. 백업 후 초기화를 시도해 보세요.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={this.exportRaw}>
              원본 데이터 백업
            </button>
            <button className="btn btn-danger" onClick={this.reset}>
              데이터 초기화
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
