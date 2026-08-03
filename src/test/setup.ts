/**
 * テストの共通後始末。
 *
 * 各テストのあとに描画したコンポーネントを片付ける。これがないと
 * 前のテストの DOM が残り、getByRole が「複数見つかった」で落ちる。
 * node 環境のテストでも読み込まれるので、DOM がないときは何もしない。
 */
import { afterEach } from 'vitest'

afterEach(async () => {
  if (typeof document === 'undefined') return
  const { cleanup } = await import('@testing-library/react')
  cleanup()
})
