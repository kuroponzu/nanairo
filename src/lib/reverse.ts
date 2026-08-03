/**
 * 逆引き探索：「この色を作るには何色と何色を混ぜればいいか」を求める。
 *
 * 24色の全ペア × 混合比を総当たりして混色エンジンに通し、
 * 目標色との CIEDE2000 の色差が小さいものを返す。
 * 組合せ数は 276ペア × 9段階 ＝ 2,484 通りで、総当たりでも数ミリ秒で終わる。
 *
 * 順引き（lib/mix.ts）と同じエンジンを使うので、
 * 「候補として出た組合せをまぜるタブで試すと違う色になる」ことが起きない。
 */
import { deltaE2000, hexToLab } from './color'
import { mixColors } from './mix'
import { PALETTE, type PaletteColor } from '../data/palette'

/** 逆引きの候補1件 */
export type Recipe = {
  /** 混ぜる色（2色以上）。ratio は最も簡単な整数比に約分済み */
  parts: { color: PaletteColor; ratio: number }[]
  /** 混ぜた結果の色 */
  resultHex: string
  /** 目標色との色差（小さいほど近い） */
  deltaE: number
}

/** 探索で試す混合比。1:9 から 9:1 まで */
const RATIO_STEPS = 9

/**
 * 目標色に近い混色の組合せを探す。
 *
 * @param targetHex 作りたい色
 * @param options.limit 返す候補の最大数
 * @param options.excludeIds 材料に使わない色のID（目標色そのものを除くのに使う）
 */
export function findRecipes(
  targetHex: string,
  options: { limit?: number; excludeIds?: string[] } = {},
): Recipe[] {
  const limit = options.limit ?? 5
  const excluded = new Set(options.excludeIds ?? [])
  const targetLab = hexToLab(targetHex)
  const materials = PALETTE.filter((c) => !excluded.has(c.id))

  const candidates: Recipe[] = []

  for (let i = 0; i < materials.length; i++) {
    for (let j = i + 1; j < materials.length; j++) {
      const a = materials[i]
      const b = materials[j]

      // このペアの中で最も目標に近い比率だけを候補に残す。
      // そうしないと同じペアの近い比率が候補を埋め尽くしてしまう。
      let best: Recipe | null = null

      for (let w = 1; w < RATIO_STEPS + 1; w++) {
        const wa = w
        const wb = RATIO_STEPS + 1 - w
        const resultHex = mixColors([
          { hex: a.hex, weight: wa, colorId: a.id },
          { hex: b.hex, weight: wb, colorId: b.id },
        ])
        const dE = deltaE2000(targetLab, hexToLab(resultHex))
        if (best === null || dE < best.deltaE) {
          const [ra, rb] = simplifyRatio(wa, wb)
          best = {
            parts: [
              { color: a, ratio: ra },
              { color: b, ratio: rb },
            ],
            resultHex,
            deltaE: dE,
          }
        }
      }

      if (best) candidates.push(best)
    }
  }

  candidates.sort((x, y) => x.deltaE - y.deltaE)
  return candidates.slice(0, limit)
}

/** 色差から「どれくらい近いか」の区分を返す。画面での言い回しに使う */
export type Closeness = 'almost' | 'close' | 'similar' | 'far'

export function closenessOf(deltaE: number): Closeness {
  if (deltaE < 3) return 'almost'
  if (deltaE < 8) return 'close'
  if (deltaE < 16) return 'similar'
  return 'far'
}

/** 比を最も簡単な整数比に約分する（4:8 → 1:2） */
function simplifyRatio(a: number, b: number): [number, number] {
  const g = gcd(a, b)
  return [a / g, b / g]
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}
