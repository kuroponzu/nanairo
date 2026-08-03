import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages のプロジェクトページ（/nanairo/）で配信するため base を指定する
export default defineConfig({
  base: '/nanairo/',
  plugins: [react(), tailwindcss()],
})
