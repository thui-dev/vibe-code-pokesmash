import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: resolve('./src'),
  base: '/static/game/react/',
  build: {
    // outDir: resolve('../../game/static/game/react'),
    outDir: 'dist',
    assetsDir: '',
    manifest: true,
    emptyOutDir: true,
  },
})
