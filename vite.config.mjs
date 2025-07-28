import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ← Add this back so `/api/auth/*` hits your Next.js server
  server: {
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },

  optimizeDeps: {
    include: ['date-fns-tz'],
  },
})
