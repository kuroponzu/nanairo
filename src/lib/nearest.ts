/**
 * 任意の色に最も近いパレットの色を探し、言葉での説明に使う。
 *
 * 近さの区分（closenessOf）は逆引きの候補の説明にも使うので、
 * 「どれくらい近ければ同じ色と呼べるか」の基準をここ一箇所に集めている。
 */
import { deltaE2000, hexToLab } from './color'
import { PALETTE, type PaletteColor } from '../data/palette'

const PALETTE_LABS = PALETTE.map((c) => ({ color: c, lab: hexToLab(c.hex) }))

/** 色差から「どれくらい近いか」の区分を返す。画面での言い回しに使う */
export type Closeness = 'almost' | 'close' | 'similar' | 'far'

export function closenessOf(deltaE: number): Closeness {
  if (deltaE < 3) return 'almost'
  if (deltaE < 8) return 'close'
  if (deltaE < 16) return 'similar'
  return 'far'
}

export function nearestColor(hex: string): {
  color: PaletteColor
  deltaE: number
} {
  const lab = hexToLab(hex)
  let best = PALETTE_LABS[0]
  let bestDE = Infinity
  for (const entry of PALETTE_LABS) {
    const dE = deltaE2000(lab, entry.lab)
    if (dE < bestDE) {
      bestDE = dE
      best = entry
    }
  }
  return { color: best.color, deltaE: bestDE }
}

/** 明るい色の上には黒文字、暗い色の上には白文字を載せる */
export function textColorOn(hex: string): string {
  return hexToLab(hex).l > 62 ? '#231815' : '#FFFFFF'
}
