/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ReversePanel } from './ReversePanel'
import { PALETTE } from '../data/palette'

/** 目標色を選び直す */
const pickTarget = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name: /タップしてかえる/ }))
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name }),
  )
}

describe('ReversePanel の候補', () => {
  it('初期表示は むらさき で、候補が並ぶ', () => {
    render(<ReversePanel onTryRecipe={() => {}} />)
    expect(
      screen.getByRole('button', { name: /タップしてかえる/ }).textContent,
    ).toContain('むらさき')
    expect(screen.getAllByRole('button', { name: /ためす/ })).toHaveLength(4)
  })

  it('候補には材料名・比率・近さの説明が出る', () => {
    render(<ReversePanel onTryRecipe={() => {}} />)
    const first = screen.getAllByRole('button', { name: /ためす/ })[0]
    expect(within(first).getByText(/ と /)).toBeTruthy()
    expect(within(first).getByText(/\d+ : \d+ のわりあい・/)).toBeTruthy()
  })

  it('目標色そのものは材料に使われない', () => {
    // 「むらさき＋むらさき」のような無意味な候補が出ないこと。
    // 「あかむらさき」は別の色なので、名前ごとに厳密に比べる
    render(<ReversePanel onTryRecipe={() => {}} />)
    for (const card of screen.getAllByRole('button', { name: /ためす/ })) {
      const names = within(card).getByText(/ と /).textContent!.split(' と ')
      expect(names).not.toContain('むらさき')
    }
  })

  it('候補をタップすると、その組合せを親に渡す', () => {
    const onTryRecipe = vi.fn()
    render(<ReversePanel onTryRecipe={onTryRecipe} />)
    fireEvent.click(screen.getAllByRole('button', { name: /ためす/ })[0])

    expect(onTryRecipe).toHaveBeenCalledOnce()
    const recipe = onTryRecipe.mock.calls[0][0]
    expect(recipe.parts).toHaveLength(2)
    expect(recipe.resultHex).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('目標色を変えると候補も入れ替わる', () => {
    render(<ReversePanel onTryRecipe={() => {}} />)
    const before = screen
      .getAllByRole('button', { name: /ためす/ })
      .map((c) => within(c).getByText(/ と /).textContent)

    pickTarget('みどり')

    const after = screen
      .getAllByRole('button', { name: /ためす/ })
      .map((c) => within(c).getByText(/ と /).textContent)
    expect(after).not.toEqual(before)
  })
})

describe('つくれない色の説明', () => {
  it('原色5色では「つくれません」と伝える', () => {
    render(<ReversePanel onTryRecipe={() => {}} />)
    for (const color of PALETTE.filter((c) => c.primary)) {
      pickTarget(color.name)
      expect(screen.getByText(/まぜても つくれません/), color.name).toBeTruthy()
    }
  })

  it('原色でない色では「つくれません」と言わない', () => {
    render(<ReversePanel onTryRecipe={() => {}} />)
    for (const color of PALETTE.filter((c) => !c.primary)) {
      pickTarget(color.name)
      expect(screen.queryByText(/まぜても つくれません/), color.name).toBeNull()
    }
  })

  it('あか・あお は作れる色として扱う', () => {
    // 原色扱いしていたころは「つくれません」の直下に
    // 「そっくりな いろ」の候補が並んで矛盾していた
    render(<ReversePanel onTryRecipe={() => {}} />)
    for (const name of ['あか', 'あお']) {
      pickTarget(name)
      expect(screen.queryByText(/まぜても つくれません/), name).toBeNull()
      expect(
        screen.getAllByRole('button', { name: /ためす/ }).length,
      ).toBeGreaterThan(0)
    }
  })

  it('「つくれません」と言うときは、そこに そっくりな候補を並べない', () => {
    // 説明と候補が矛盾しないことの確認。原色なら最良でも「そっくり」には届かない
    render(<ReversePanel onTryRecipe={() => {}} />)
    for (const color of PALETTE.filter((c) => c.primary)) {
      pickTarget(color.name)
      const first = screen.getAllByRole('button', { name: /ためす/ })[0]
      expect(
        within(first).getByText(/のわりあい・/).textContent,
        color.name,
      ).not.toContain('そっくりな いろ')
    }
  })
})
