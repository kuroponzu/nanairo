/**
 * 減法混色（絵の具・色鉛筆の混色）の計算。
 *
 * RGB を単純平均すると「青＋黄＝灰色」になってしまい実物と全く合わない。
 * 絵の具は光を吸収して混ざるので Kubelka-Munk 理論に基づく必要がある。
 *
 * ただし K/S を RGB の3チャンネルで近似すると「赤＋青＝紫」が成立しない。
 * 赤も青も sRGB 上ではチャンネルが2つほぼ 0 なので、混ぜると全チャンネルが
 * 0 に近づいて黒く沈んでしまう。実際の赤い顔料は紫の波長（400〜430nm）にも
 * わずかな反射を持ち、それが青と生き残って紫になる。3チャンネルには
 * その情報が存在しないため、個別ペアの補正では埋められない。
 *
 * そこで spectral.js（MIT）を使う。hex から 380〜750nm のスペクトル反射率を
 * 復元したうえで Kubelka-Munk 混色を行うので、この問題が起きない。
 * 顔料ごとの効きの強さは tintingStrength で調整する（data/corrections.ts）。
 */
import { Color, mix as spectralMix } from 'spectral.js'
import { hexToSrgb, srgbToHex } from './color'
import { tintStrength } from '../data/corrections'

/**
 * 混ぜる1色ぶん。
 * weight は混合比（相対値でよい）。colorId を渡すと着色力の補正がかかる。
 */
export type MixInput = { hex: string; weight: number; colorId?: string }

/**
 * 複数の色を混合比で混ぜた結果の hex を返す。
 * 実質的に1色しか混ざらない場合はその色をそのまま返す。
 */
export function mixColors(inputs: MixInput[]): string {
  const active = inputs.filter((i) => i.weight > 0)
  if (active.length === 0) {
    return inputs.length > 0 ? normalizeHex(inputs[0].hex) : '#FFFFFF'
  }
  if (active.length === 1) return normalizeHex(active[0].hex)

  const total = active.reduce((sum, i) => sum + i.weight, 0)
  const entries = active.map((input): [Color, number] => {
    const color = new Color(input.hex)
    color.tintingStrength = tintStrength(input.colorId)
    return [color, input.weight / total]
  })

  return normalizeHex(spectralMix(...entries).toString())
}

/** 2色を混ぜる */
export function mixTwo(a: MixInput, b: MixInput): string {
  return mixColors([a, b])
}

/** 大文字の #RRGGBB に揃える */
function normalizeHex(hex: string): string {
  return srgbToHex(hexToSrgb(hex))
}
