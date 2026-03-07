import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, '../../'),
  plugins: [react()],
  server: {
    port: 3001
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom/client']
  }
})
