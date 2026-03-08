import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
    envDir: path.resolve(__dirname, '../../'),
    plugins: [react()],
    resolve: {
        alias: {
            '@restaurant-saas/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
            '@restaurant-saas/supabase': path.resolve(__dirname, '../../packages/supabase/src/index.ts'),
        },
        dedupe: ['react', 'react-dom']
    },
    server: {
        port: 3003,
        hmr: {
            overlay: true
        }
    },
})

