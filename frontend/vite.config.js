import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/shorten': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
      '/urls': 'http://localhost:5000',
      '^/(?!dashboard|not-found|burned-out|@|src|node_modules|assets|favicon|$)[a-zA-Z0-9_-]+$': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
