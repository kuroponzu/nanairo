/**
 * 任意の色に最も近いパレットの色を探す。
 * 混色の結果を「〜に近い色」と言葉で説明するために使う。
 */
import { deltaE2000, hexToLab } from './color'
import { PALETTE, type PaletteColor } from '../data/palette'

const PALETTE_LABS = PALETTE.map((c) => ({ color: c, lab: hexToLab(c.hex) }))

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
