import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages 서브패스(/fleek-clone/) 배포를 위해 상대 경로 사용
  base: './',
  plugins: [react()],
  server: {
    port: 5199,
    strictPort: true,
  },
})
