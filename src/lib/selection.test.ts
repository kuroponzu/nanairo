import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SELECTION,
  WEIGHT_TOTAL,
  clampWeight,
  selectionFromRecipe,
} from './selection'
import { findRecipes } from './reverse'
import { mixColors } from './mix'
import { deltaE2000, hexToLab } from './color'
import { PALETTE } from '../data/palette'

describe('clampWeight', () => {
  it('1〜9 の範囲に収める', () => {
    expect(clampWeight(5)).toBe(5)
    expect(clampWeight(1)).toBe(1)
    expect(clampWeight(9)).toBe(9)
  })

  it('範囲外は端に寄せる。0 や 10 は「混ぜていない」状態なので許さない', () => {
    expect(clampWeight(0)).toBe(1)
    expect(clampWeight(-3)).toBe(1)
    expect(clampWeight(10)).toBe(9)
    expect(clampWeight(99)).toBe(9)
  })
})

describe('DEFAULT_SELECTION', () => {
  it('あお と きいろ が半々で、パレットに実在する色である', () => {
    expect(DEFAULT_SELECTION.colorA.id).toBe('ao')
    expect(DEFAULT_SELECTION.colorB.id).toBe('kiiro')
    expect(DEFAULT_SELECTION.weightA).toBe(5)
    for (const color of [DEFAULT_SELECTION.colorA, DEFAULT_SELECTION.colorB]) {
      expect(PALETTE).toContain(color)
    }
  })
})

describe('selectionFromRecipe', () => {
  it('候補の2色と比率がそのまま選択状態になる', () => {
    const recipe = findRecipes('#7B2E8E', { limit: 1, excludeIds: ['murasaki'] })[0]
    const selection = selectionFromRecipe(recipe)
    expect(selection.colorA).toBe(recipe.parts[0].color)
    expect(selection.colorB).toBe(recipe.parts[1].color)
    expect(selection.weightA).toBeGreaterThanOrEqual(1)
    expect(selection.weightA).toBeLessThanOrEqual(WEIGHT_TOTAL - 1)
  })

  it('約分された比率がスライダーの目盛りにぴたりと戻る', () => {
    // 探索は必ず w:(10-w) で試すので、約分してから割合に直せば元に戻るはず。
    // ここが崩れると「ためす」で開いた画面の色が候補と違う色になる
    for (const target of PALETTE) {
      for (const recipe of findRecipes(target.hex, {
        limit: 4,
        excludeIds: [target.id],
      })) {
        const [a, b] = recipe.parts
        const { weightA } = selectionFromRecipe(recipe)
        const label = `${target.name}: ${a.color.name}${a.ratio}:${b.ratio}${b.color.name}`
        expect(weightA / WEIGHT_TOTAL, label).toBeCloseTo(
          a.ratio / (a.ratio + b.ratio),
          10,
        )
      }
    }
  })

  it('「ためす」で開いた画面の色が、候補に表示された色と一致する', () => {
    // このアプリの中核の約束。逆引きの結果と順引きの結果が食い違わないこと
    for (const target of PALETTE) {
      for (const recipe of findRecipes(target.hex, {
        limit: 4,
        excludeIds: [target.id],
      })) {
        const { colorA, colorB, weightA } = selectionFromRecipe(recipe)
        const shown = mixColors([
          { hex: colorA.hex, weight: weightA, colorId: colorA.id },
          {
            hex: colorB.hex,
            weight: WEIGHT_TOTAL - weightA,
            colorId: colorB.id,
          },
        ])
        expect(shown, `${target.name} / ${colorA.name}+${colorB.name}`).toBe(
          recipe.resultHex,
        )
      }
    }
  })

  it('開いた画面の色は、もともと作りたかった色に近いままである', () => {
    for (const target of PALETTE) {
      const recipe = findRecipes(target.hex, {
        limit: 1,
        excludeIds: [target.id],
      })[0]
      const { colorA, colorB, weightA } = selectionFromRecipe(recipe)
      const shown = mixColors([
        { hex: colorA.hex, weight: weightA, colorId: colorA.id },
        { hex: colorB.hex, weight: WEIGHT_TOTAL - weightA, colorId: colorB.id },
      ])
      const dE = deltaE2000(hexToLab(target.hex), hexToLab(shown))
      expect(dE, target.name).toBeCloseTo(recipe.deltaE, 10)
    }
  })
})
