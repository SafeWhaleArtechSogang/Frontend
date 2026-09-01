import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/files': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      // 안전고래 백엔드 (Spring Boot) — /api/v1/** → 백엔드로 프록시 (CORS 회피)
      // 백엔드 포트/주소가 다르면 target만 수정
      '/api/v1': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
