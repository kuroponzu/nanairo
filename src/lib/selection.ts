/**
 * 「まぜる」タブで選んでいる状態と、逆引きの候補からそこへ移すための変換。
 *
 * 「つくる」で出した候補をタップしたら「まぜる」で同じ色が出る、というのが
 * このアプリの中核の約束なので、比率の変換はコンポーネントから切り離して
 * 単体でテストできるようにしている。
 */
import { PALETTE, type PaletteColor } from '../data/palette'
import type { Recipe } from './reverse'

export type MixSelection = {
  colorA: PaletteColor
  colorB: PaletteColor
  /** A の割合（1〜9）。B は WEIGHT_TOTAL - weightA */
  weightA: number
}

/** スライダーの目盛りの合計。A が w なら B は 10 - w */
export const WEIGHT_TOTAL = 10

/** 初期表示。青と黄を混ぜると緑になるのがこのアプリの一番の見どころなので最初に見せる */
export const DEFAULT_SELECTION: MixSelection = {
  colorA: PALETTE.find((c) => c.id === 'ao')!,
  colorB: PALETTE.find((c) => c.id === 'kiiro')!,
  weightA: 5,
}

/**
 * 逆引きの候補を「まぜる」タブの選択状態に変換する。
 *
 * 候補の比率は約分済み（4:6 なら 2:3）なので、スライダーの 1〜9 の
 * 目盛りに戻す必要がある。探索は必ず w:(10-w) の比で試しているので、
 * 約分してから割合に直せば元の目盛りにぴたりと戻る
 * （selection.test.ts で全候補について確認している）。
 */
export function selectionFromRecipe(recipe: Recipe): MixSelection {
  const [a, b] = recipe.parts
  const total = a.ratio + b.ratio
  const weightA = clampWeight(Math.round((a.ratio / total) * WEIGHT_TOTAL))
  return { colorA: a.color, colorB: b.color, weightA }
}

/** スライダーが取れる範囲（1〜9）に収める。0 や 10 は「混ぜていない」状態になるので除く */
export function clampWeight(weight: number): number {
  return Math.min(WEIGHT_TOTAL - 1, Math.max(1, weight))
}
