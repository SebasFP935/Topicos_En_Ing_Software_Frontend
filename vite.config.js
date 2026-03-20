import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Topicos_En_Ing_Software_Frontend/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: false,
      }
    }
  }
})