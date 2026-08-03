/**
 * spectral.js（v3）は型定義を同梱していないため、使う範囲だけ宣言する。
 */
declare module 'spectral.js' {
  export class Color {
    constructor(color: string)
    /** 顔料の強さ。1 が既定で、小さくすると混色での主張が弱まる */
    tintingStrength: number
    toString(options?: {
      format?: 'hex' | 'rgb'
      method?: 'map' | 'clip'
    }): string
  }

  /** 色と混合比の組を任意個受け取り、混ぜた結果の Color を返す */
  export function mix(...colors: [Color, number][]): Color
}
