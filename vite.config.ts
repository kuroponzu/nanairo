// test の設定を含むので vitest 側の defineConfig を使う（vite の型には test がない）
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages のプロジェクトページ（/nanairo/）で配信するため base を指定する
export default defineConfig({
  base: '/nanairo/',
  plugins: [react(), tailwindcss()],
  test: {
    // 色の計算だけの lib のテストに jsdom の起動コストは掛けたくないので
    // 既定は node のまま。DOM が必要なコンポーネントのテストは
    // ファイル先頭の `@vitest-environment jsdom` で個別に指定している
    setupFiles: ['./src/test/setup.ts'],
  },
})
