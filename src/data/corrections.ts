/**
 * 混色計算の補正。
 *
 * spectral.js の tintingStrength を色ごとに指定する。これは
 * 「同じ量を混ぜたときにどれだけ強く色を変えるか」で、実際の絵の具でも
 * 顔料によって大きく違う（黒はごく少量で全体を暗くするが、白は同じ量では
 * 大して明るくならない）。既定は 1.0 で、小さくすると主張が弱まる。
 *
 * 混合比に掛かるかたちで効くので、スライダーを動かしたときの結果が
 * なめらかに変化する性質と、A＋B と B＋A が同じになる性質は保たれる。
 *
 * 実装の当初は補正なし（全て 1.0）で始め、実際の色鉛筆と見比べて
 * ズレる色だけを登録していく方針にしている。
 */
export const TINT_STRENGTH: Record<string, number> = {}

/** 指定した色の着色力を返す。未登録の色は補正なし（1.0） */
export function tintStrength(colorId: string | undefined): number {
  if (!colorId) return 1
  return TINT_STRENGTH[colorId] ?? 1
}
