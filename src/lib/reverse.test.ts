import { describe, expect, it } from 'vitest'
import { closenessOf, findRecipes } from './reverse'
import { mixColors } from './mix'
import { PALETTE, findColor } from '../data/palette'

describe('findRecipes', () => {
  it('全24色を目標にして候補が返る', () => {
    for (const target of PALETTE) {
      const recipes = findRecipes(target.hex, { excludeIds: [target.id] })
      expect(recipes.length, target.name).toBeGreaterThan(0)
    }
  })

  it('候補は色差の小さい順に並んでいる', () => {
    for (const target of PALETTE) {
      const recipes = findRecipes(target.hex, { excludeIds: [target.id] })
      for (let i = 1; i < recipes.length; i++) {
        expect(recipes[i].deltaE).toBeGreaterThanOrEqual(recipes[i - 1].deltaE)
      }
    }
  })

  it('limit で指定した数を超えない', () => {
    expect(findRecipes('#7B2E8E', { limit: 3 }).length).toBe(3)
    expect(findRecipes('#7B2E8E', { limit: 1 }).length).toBe(1)
  })

  it('excludeIds で指定した色は材料に使われない', () => {
    const recipes = findRecipes('#7B2E8E', {
      limit: 20,
      excludeIds: ['murasaki', 'shiro'],
    })
    for (const r of recipes) {
      for (const p of r.parts) {
        expect(p.color.id).not.toBe('murasaki')
        expect(p.color.id).not.toBe('shiro')
      }
    }
  })

  it('候補の組合せを実際に混ぜると表示どおりの色になる（順引きと一致）', () => {
    for (const target of PALETTE) {
      const recipes = findRecipes(target.hex, { excludeIds: [target.id] })
      for (const r of recipes) {
        const remixed = mixColors(
          r.parts.map((p) => ({
            hex: p.color.hex,
            weight: p.ratio,
            colorId: p.color.id,
          })),
        )
        expect(remixed, `${target.name}`).toBe(r.resultHex)
      }
    }
  })

  it('同じペアが候補内で重複しない', () => {
    for (const target of PALETTE) {
      const recipes = findRecipes(target.hex, {
        limit: 5,
        excludeIds: [target.id],
      })
      const keys = recipes.map((r) =>
        r.parts
          .map((p) => p.color.id)
          .sort()
          .join('+'),
      )
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('比率は約分された整数比になっている', () => {
    for (const r of findRecipes('#7B2E8E', { limit: 20 })) {
      const [a, b] = r.parts.map((p) => p.ratio)
      expect(Number.isInteger(a)).toBe(true)
      expect(Number.isInteger(b)).toBe(true)
      // 約分済みなら最大公約数は 1
      const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y))
      expect(gcd(a, b)).toBe(1)
    }
  })

  it('目標色自身を材料に使えるなら、ぴたりと近い候補が見つかる', () => {
    // 自分自身＋自分自身なので色差はほぼ 0 になるはず
    const recipes = findRecipes('#7B2E8E', { limit: 1 })
    expect(recipes[0].deltaE).toBeLessThan(3)
  })

  it('24色それぞれについて、他の色の組合せでどれだけ近づけるか', () => {
    // どの色も「まったく手が届かない」ということはない（ΔE 30 未満に収まる）
    for (const target of PALETTE) {
      const recipes = findRecipes(target.hex, { excludeIds: [target.id] })
      expect(recipes[0].deltaE, target.name).toBeLessThan(30)
    }
  })

  it('探索は十分速い（1色あたり 200ms 未満）', () => {
    const started = performance.now()
    findRecipes('#7B2E8E')
    expect(performance.now() - started).toBeLessThan(200)
  })
})

describe('むらさきの作り方が妥当に提案される', () => {
  it('むらさきの候補には赤系と青系の組合せが含まれる', () => {
    const recipes = findRecipes(findColor('murasaki')!.hex, {
      limit: 5,
      excludeIds: ['murasaki'],
    })
    const REDDISH = ['aka', 'akamurasaki', 'momo', 'shu']
    const BLUISH = ['ao', 'ai', 'gunjou', 'aomurasaki', 'mizu']
    const hasRedBluePair = recipes.some((r) => {
      const ids = r.parts.map((p) => p.color.id)
      return (
        ids.some((id) => REDDISH.includes(id)) &&
        ids.some((id) => BLUISH.includes(id))
      )
    })
    expect(hasRedBluePair).toBe(true)
  })

  it('みどりの候補には青系と黄系の組合せが含まれる', () => {
    const recipes = findRecipes(findColor('midori')!.hex, {
      limit: 5,
      excludeIds: ['midori'],
    })
    const YELLOWISH = ['kiiro', 'yamabuki', 'kimidori']
    const BLUISH = ['ao', 'ai', 'gunjou', 'mizu', 'aomidori']
    const hasPair = recipes.some((r) => {
      const ids = r.parts.map((p) => p.color.id)
      return (
        ids.some((id) => YELLOWISH.includes(id)) &&
        ids.some((id) => BLUISH.includes(id))
      )
    })
    expect(hasPair).toBe(true)
  })

  it('だいだいいろの候補には赤系と黄系の組合せが含まれる', () => {
    const recipes = findRecipes(findColor('daidai')!.hex, {
      limit: 5,
      excludeIds: ['daidai'],
    })
    const YELLOWISH = ['kiiro', 'yamabuki']
    const REDDISH = ['aka', 'shu', 'momo']
    const hasPair = recipes.some((r) => {
      const ids = r.parts.map((p) => p.color.id)
      return (
        ids.some((id) => YELLOWISH.includes(id)) &&
        ids.some((id) => REDDISH.includes(id))
      )
    })
    expect(hasPair).toBe(true)
  })
})

describe('原色の扱い', () => {
  it('原色は混ぜても作れないので、その印が付いている', () => {
    // 減法混色の原色（黄・赤紫・青緑）と、赤・青・白・黒
    const expected = [
      'kiiro',
      'aka',
      'akamurasaki',
      'ao',
      'aomidori',
      'shiro',
      'kuro',
    ]
    const marked = PALETTE.filter((c) => c.primary).map((c) => c.id)
    expect(marked.sort()).toEqual(expected.sort())
  })

  it('原色は他の色をどう混ぜても十分に近づけられない', () => {
    // 「作れない」と表示する根拠。ΔE 2 未満まで近づける組合せは存在しない
    for (const target of PALETTE.filter((c) => c.primary)) {
      const recipes = findRecipes(target.hex, { excludeIds: [target.id] })
      expect(recipes[0].deltaE, target.name).toBeGreaterThan(2)
    }
  })

  it('原色でない色は、そこそこ近い組合せが見つかる', () => {
    for (const target of PALETTE.filter((c) => !c.primary)) {
      const recipes = findRecipes(target.hex, { excludeIds: [target.id] })
      expect(recipes[0].deltaE, target.name).toBeLessThan(16)
    }
  })
})

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
