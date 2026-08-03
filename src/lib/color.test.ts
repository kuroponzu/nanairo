import { describe, expect, it } from 'vitest'
import {
  deltaE2000,
  hexToLab,
  hexToSrgb,
  linearToSrgb,
  srgbToHex,
  srgbToLinear,
} from './color'
import { PALETTE } from '../data/palette'

describe('hex と sRGB の相互変換', () => {
  it('hex を sRGB に変換する', () => {
    expect(hexToSrgb('#FF8000')).toEqual({ r: 255, g: 128, b: 0 })
  })

  it('パレット全色が hex → sRGB → hex で元に戻る', () => {
    for (const c of PALETTE) {
      expect(srgbToHex(hexToSrgb(c.hex))).toBe(c.hex)
    }
  })
})

describe('sRGB とリニアRGB の相互変換', () => {
  it('パレット全色が往復して元に戻る', () => {
    for (const c of PALETTE) {
      const back = srgbToHex(linearToSrgb(srgbToLinear(hexToSrgb(c.hex))))
      expect(back).toBe(c.hex)
    }
  })

  it('黒と白は端の値になる', () => {
    expect(srgbToLinear({ r: 0, g: 0, b: 0 })).toEqual({ r: 0, g: 0, b: 0 })
    expect(srgbToLinear({ r: 255, g: 255, b: 255 })).toEqual({
      r: 1,
      g: 1,
      b: 1,
    })
  })

  it('中間のグレーはリニアだと 0.5 より暗い（ガンマの効果）', () => {
    const mid = srgbToLinear({ r: 128, g: 128, b: 128 })
    expect(mid.r).toBeLessThan(0.5)
    expect(mid.r).toBeGreaterThan(0.2)
  })
})

describe('Lab 変換', () => {
  it('白は L=100 / a=b=0 になる', () => {
    const lab = hexToLab('#FFFFFF')
    expect(lab.l).toBeCloseTo(100, 1)
    expect(lab.a).toBeCloseTo(0, 1)
    expect(lab.b).toBeCloseTo(0, 1)
  })

  it('黒は L=0 になる', () => {
    expect(hexToLab('#000000').l).toBeCloseTo(0, 1)
  })

  it('赤は a が正、青は b が負になる', () => {
    expect(hexToLab('#FF0000').a).toBeGreaterThan(50)
    expect(hexToLab('#0000FF').b).toBeLessThan(-50)
  })
})

describe('deltaE2000', () => {
  it('同じ色の色差は 0', () => {
    for (const c of PALETTE) {
      expect(deltaE2000(hexToLab(c.hex), hexToLab(c.hex))).toBeCloseTo(0, 6)
    }
  })

  it('対称である', () => {
    const a = hexToLab('#E60012')
    const b = hexToLab('#0068B7')
    expect(deltaE2000(a, b)).toBeCloseTo(deltaE2000(b, a), 6)
  })

  it('白と黒は大きく離れている', () => {
    expect(deltaE2000(hexToLab('#FFFFFF'), hexToLab('#000000'))).toBeGreaterThan(
      50,
    )
  })

  it('ごく近い色の色差は小さい', () => {
    expect(deltaE2000(hexToLab('#E60012'), hexToLab('#E50013'))).toBeLessThan(1)
  })

  it('パレットの24色は互いに区別できる色差がある', () => {
    for (let i = 0; i < PALETTE.length; i++) {
      for (let j = i + 1; j < PALETTE.length; j++) {
        const d = deltaE2000(hexToLab(PALETTE[i].hex), hexToLab(PALETTE[j].hex))
        expect(d, `${PALETTE[i].name} vs ${PALETTE[j].name}`).toBeGreaterThan(2)
      }
    }
  })

  // CIEDE2000 の実装検証に使われる Sharma らのテストデータより抜粋
  it.each([
    [
      { l: 50, a: 2.6772, b: -79.7751 },
      { l: 50, a: 0, b: -82.7485 },
      2.0425,
    ],
    [{ l: 50, a: 2.5, b: 0 }, { l: 50, a: 0, b: -2.5 }, 4.3065],
    [{ l: 50, a: -1.3802, b: -84.2814 }, { l: 50, a: 0, b: -82.7485 }, 1.0],
    [{ l: 60.2574, a: -34.0099, b: 36.2677 }, { l: 60.4626, a: -34.1751, b: 39.4387 }, 1.2644],
    [{ l: 2.0776, a: 0.0795, b: -1.135 }, { l: 0.9033, a: -0.0636, b: -0.5514 }, 0.9082],
  ])('Sharma のテストデータと一致する', (a, b, expected) => {
    expect(deltaE2000(a, b)).toBeCloseTo(expected, 3)
  })
})
