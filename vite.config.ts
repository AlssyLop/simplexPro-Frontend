import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/problema': 'http://localhost:8000',
      '/problemas': 'http://localhost:8000',
    },
  },
})
