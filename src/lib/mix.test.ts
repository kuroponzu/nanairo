import { describe, expect, it } from 'vitest'
import { mixColors } from './mix'
import { deltaE2000, hexToLab, hexToSrgb } from './color'
import { PALETTE, findColor } from '../data/palette'

/** パレットの色名から混色入力を作る */
function c(id: string, weight = 1) {
  const color = findColor(id)
  if (!color) throw new Error(`unknown color: ${id}`)
  return { hex: color.hex, weight, colorId: id }
}

/** 色相（0..360 度）。無彩色に近い場合は NaN */
function hue(hex: string): number {
  const { r, g, b } = hexToSrgb(hex)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max - min < 8) return NaN
  let h: number
  if (max === r) h = ((g - b) / (max - min)) * 60
  else if (max === g) h = ((b - r) / (max - min)) * 60 + 120
  else h = ((r - g) / (max - min)) * 60 + 240
  return (h + 360) % 360
}

/** 彩度の目安（Lab の a,b の大きさ） */
function chroma(hex: string): number {
  const lab = hexToLab(hex)
  return Math.sqrt(lab.a * lab.a + lab.b * lab.b)
}

const lightness = (hex: string) => hexToLab(hex).l

describe('混色エンジンの基本的な性質', () => {
  it('1色だけならその色が返る', () => {
    for (const color of PALETTE) {
      expect(mixColors([c(color.id)])).toBe(color.hex)
    }
  })

  it('比率が 0 の色は無視される', () => {
    expect(mixColors([c('aka', 1), c('ao', 0)])).toBe(findColor('aka')!.hex)
  })

  it('同じ色同士を混ぜてもその色のまま', () => {
    for (const color of PALETTE) {
      const mixed = mixColors([c(color.id), c(color.id)])
      expect(
        deltaE2000(hexToLab(mixed), hexToLab(color.hex)),
        color.name,
      ).toBeLessThan(1)
    }
  })

  it('順番を入れ替えても同じ結果になる（可換）', () => {
    for (let i = 0; i < PALETTE.length; i++) {
      for (let j = i + 1; j < PALETTE.length; j++) {
        const a = PALETTE[i].id
        const b = PALETTE[j].id
        expect(mixColors([c(a, 3), c(b, 7)]), `${a} + ${b}`).toBe(
          mixColors([c(b, 7), c(a, 3)]),
        )
      }
    }
  })

  it('比率を表す数値のスケールは結果に影響しない', () => {
    expect(mixColors([c('aka', 1), c('ao', 3)])).toBe(
      mixColors([c('aka', 25), c('ao', 75)]),
    )
  })

  it('全ペア・全比率でスライダーを動かしても色が飛ばない', () => {
    // 9段階の刻みでの実測上限は約23（補色ペアで最大になる）。
    // 補色同士は少し比率を変えるだけで見た目が大きく動くのが本来の挙動なので、
    // ここでは「段が飛んで不連続に見える」ほどの変化がないことだけを確かめる。
    for (let i = 0; i < PALETTE.length; i++) {
      for (let j = i + 1; j < PALETTE.length; j++) {
        let prev = mixColors([c(PALETTE[i].id, 1), c(PALETTE[j].id, 9)])
        for (let w = 2; w <= 9; w++) {
          const cur = mixColors([c(PALETTE[i].id, w), c(PALETTE[j].id, 10 - w)])
          expect(
            deltaE2000(hexToLab(cur), hexToLab(prev)),
            `${PALETTE[i].name} + ${PALETTE[j].name} @ ${w}`,
          ).toBeLessThan(25)
          prev = cur
        }
      }
    }
  })
})

describe('絵の具として正しい混色になっている', () => {
  it('あお + きいろ = みどり（RGB平均だと灰色になってしまう箇所）', () => {
    const h = hue(mixColors([c('ao'), c('kiiro')]))
    expect(h).toBeGreaterThan(70)
    expect(h).toBeLessThan(170)
  })

  it('あお + きいろ は灰色にならない', () => {
    expect(chroma(mixColors([c('ao'), c('kiiro')]))).toBeGreaterThan(30)
  })

  it('あか + きいろ = だいだい', () => {
    const h = hue(mixColors([c('aka'), c('kiiro')]))
    expect(h).toBeGreaterThan(8)
    expect(h).toBeLessThan(55)
  })

  it('あかむらさき + あお = むらさき〜あおむらさき', () => {
    const h = hue(mixColors([c('akamurasaki'), c('ao')]))
    expect(h).toBeGreaterThan(220)
    expect(h).toBeLessThan(300)
  })

  it('あかむらさき + ぐんじょういろ = むらさき', () => {
    const h = hue(mixColors([c('akamurasaki'), c('gunjou')]))
    expect(h).toBeGreaterThan(245)
    expect(h).toBeLessThan(305)
  })

  it('きいろ + あか は2色の間の色相になる', () => {
    // あか(#E60012) の色相は 355 度で 360 度の折り返しをまたぐため、
    // 赤を 0 度の基準に置き直して比較する
    const shift = (h: number) => (h + 90) % 360
    const h = shift(hue(mixColors([c('kiiro'), c('aka')])))
    expect(h).toBeGreaterThan(shift(hue(findColor('aka')!.hex)))
    expect(h).toBeLessThan(shift(hue(findColor('kiiro')!.hex)))
  })

  it('きいろ + みずいろ = きみどり〜みどり', () => {
    const h = hue(mixColors([c('kiiro'), c('mizu')]))
    expect(h).toBeGreaterThan(60)
    expect(h).toBeLessThan(180)
  })
})

describe('しろ・くろを混ぜたときの明るさ', () => {
  const chromatic = PALETTE.filter(
    (p) => !['shiro', 'kuro', 'hai'].includes(p.id),
  )

  it('しろを混ぜるとどの色も明るくなる', () => {
    for (const color of chromatic) {
      const mixed = mixColors([c(color.id, 1), c('shiro', 3)])
      expect(lightness(mixed), `${color.name} + しろ`).toBeGreaterThan(
        lightness(color.hex),
      )
    }
  })

  it('くろを混ぜるとどの色も暗くなる', () => {
    for (const color of chromatic) {
      const mixed = mixColors([c(color.id, 3), c('kuro', 1)])
      expect(lightness(mixed), `${color.name} + くろ`).toBeLessThan(
        lightness(color.hex),
      )
    }
  })

  it('しろを多く混ぜるほど明るくなる（単調）', () => {
    for (const color of chromatic) {
      let prev = lightness(color.hex)
      for (const w of [1, 2, 4, 8, 16]) {
        const cur = lightness(mixColors([c(color.id, 1), c('shiro', w)]))
        expect(cur, `${color.name} + しろ×${w}`).toBeGreaterThan(prev)
        prev = cur
      }
    }
  })

  it('くろを多く混ぜるほど暗くなる（単調）', () => {
    for (const color of chromatic) {
      let prev = lightness(color.hex)
      for (const w of [0.2, 0.5, 1, 2, 4]) {
        const cur = lightness(mixColors([c(color.id, 1), c('kuro', w)]))
        expect(cur, `${color.name} + くろ×${w}`).toBeLessThan(prev)
        prev = cur
      }
    }
  })

  it('しろをたくさん混ぜるとパステル（高明度・低彩度）になる', () => {
    for (const color of chromatic) {
      const mixed = mixColors([c(color.id, 1), c('shiro', 9)])
      expect(lightness(mixed), `${color.name}`).toBeGreaterThan(75)
    }
  })
})

describe('3色以上の混色', () => {
  it('あか + あお + きいろ は濁った色になる', () => {
    const mixed = mixColors([c('aka'), c('ao'), c('kiiro')])
    expect(chroma(mixed)).toBeLessThan(chroma(findColor('aka')!.hex))
  })

  it('比率 0 の色を足しても結果は変わらない', () => {
    expect(mixColors([c('aka', 1), c('kiiro', 1), c('ao', 0)])).toBe(
      mixColors([c('aka', 1), c('kiiro', 1)]),
    )
  })
})

describe('結果は常に有効な色', () => {
  it('全ペア・全比率で有効な hex を返す', () => {
    for (let i = 0; i < PALETTE.length; i++) {
      for (let j = i + 1; j < PALETTE.length; j++) {
        for (let w = 1; w <= 9; w++) {
          const mixed = mixColors([
            c(PALETTE[i].id, w),
            c(PALETTE[j].id, 10 - w),
          ])
          expect(mixed).toMatch(/^#[0-9A-F]{6}$/)
        }
      }
    }
  })
})
