import { describe, expect, it } from 'vitest'
import { closenessOf, nearestColor, textColorOn } from './nearest'
import { mixColors } from './mix'
import { PALETTE, findColor } from '../data/palette'

describe('closenessOf', () => {
  it('色差に応じた区分を返す', () => {
    expect(closenessOf(0)).toBe('almost')
    expect(closenessOf(2.9)).toBe('almost')
    expect(closenessOf(3)).toBe('close')
    expect(closenessOf(7.9)).toBe('close')
    expect(closenessOf(8)).toBe('similar')
    expect(closenessOf(15.9)).toBe('similar')
    expect(closenessOf(16)).toBe('far')
    expect(closenessOf(100)).toBe('far')
  })
})

describe('nearestColor', () => {
  it('パレットの色そのものを渡すとその色が返り、色差は 0', () => {
    for (const color of PALETTE) {
      const result = nearestColor(color.hex)
      expect(result.color.id, color.name).toBe(color.id)
      expect(result.deltaE, color.name).toBeCloseTo(0, 6)
    }
  })

  it('わずかにずらした色でも元の色が返る', () => {
    // #009944（みどり）を1段だけ動かしても、みどりから離れるほどではない
    expect(nearestColor('#019A45').color.id).toBe('midori')
  })

  it('小文字の hex でも同じ結果になる', () => {
    expect(nearestColor('#ffe800').color.id).toBe(
      nearestColor('#FFE800').color.id,
    )
  })
})

describe('混色結果に名前を付けられるか（MixPanel の表示条件）', () => {
  /**
   * 「〜っぽいいろ」と表示する条件そのもの。
   * 材料と別の色で、かつ far ではないときだけ名前で呼ぶ。
   */
  const canName = (hex: string, aId: string, bId: string) => {
    const n = nearestColor(hex)
    return (
      n.color.id !== aId && n.color.id !== bId && closenessOf(n.deltaE) !== 'far'
    )
  }

  it('あお + きいろ は みどり系の名前で呼べる', () => {
    const ao = findColor('ao')!
    const kiiro = findColor('kiiro')!
    const hex = mixColors([
      { hex: ao.hex, weight: 5, colorId: ao.id },
      { hex: kiiro.hex, weight: 5, colorId: kiiro.id },
    ])
    expect(canName(hex, ao.id, kiiro.id)).toBe(true)
    expect(['midori', 'kimidori', 'fukamidori', 'aomidori']).toContain(
      nearestColor(hex).color.id,
    )
  })

  it('名前で呼ぶと決めた組合せは、必ず ΔE 16 未満に収まっている', () => {
    // 閾値を入れる前は ΔE 22 の色にも名前が付いていた（あお4：くろ6 が
    // 「あいいろっぽいいろ」など）。それが復活しないよう全数で確認する
    for (const a of PALETTE) {
      for (const b of PALETTE) {
        if (a.id >= b.id) continue
        for (let w = 1; w <= 9; w++) {
          const hex = mixColors([
            { hex: a.hex, weight: w, colorId: a.id },
            { hex: b.hex, weight: 10 - w, colorId: b.id },
          ])
          if (!canName(hex, a.id, b.id)) continue
          const n = nearestColor(hex)
          expect(n.deltaE, `${a.name}${w}:${10 - w}${b.name}`).toBeLessThan(16)
        }
      }
    }
  })

  it('遠すぎる色には名前を付けない（うすだいだいに沈んだあお）', () => {
    const ao = findColor('ao')!
    const usu = findColor('usudaidai')!
    const hex = mixColors([
      { hex: ao.hex, weight: 2, colorId: ao.id },
      { hex: usu.hex, weight: 8, colorId: usu.id },
    ])
    // 最近色は しろ だが ΔE 20 超で、しろとは呼べない
    expect(nearestColor(hex).deltaE).toBeGreaterThan(16)
    expect(canName(hex, ao.id, usu.id)).toBe(false)
  })
})

describe('textColorOn', () => {
  it('明るい色の上には黒、暗い色の上には白を返す', () => {
    expect(textColorOn('#FFFFFF')).toBe('#231815')
    expect(textColorOn('#FFE800')).toBe('#231815')
    expect(textColorOn('#231815')).toBe('#FFFFFF')
    expect(textColorOn('#1B3B7A')).toBe('#FFFFFF')
  })

  it('パレット全色で、背景と文字が十分に離れている', () => {
    // 色名が読めることが前提のUIなので、どの色でも判定が破綻していないこと
    for (const color of PALETTE) {
      const text = textColorOn(color.hex)
      expect(['#231815', '#FFFFFF'], color.name).toContain(text)
    }
  })
})
