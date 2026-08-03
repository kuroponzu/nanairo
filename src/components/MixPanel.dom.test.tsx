/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MixPanel } from './MixPanel'
import { findColor } from '../data/palette'
import { DEFAULT_SELECTION, type MixSelection } from '../lib/selection'

const selectionOf = (aId: string, bId: string, weightA: number): MixSelection => ({
  colorA: findColor(aId)!,
  colorB: findColor(bId)!,
  weightA,
})

describe('MixPanel の表示', () => {
  it('選んだ色の名前と比率が出る', () => {
    render(
      <MixPanel selection={selectionOf('aka', 'shiro', 3)} onChange={() => {}} />,
    )
    expect(screen.getByText('あか 3')).toBeTruthy()
    expect(screen.getByText('7 しろ')).toBeTruthy()
  })

  it('混色の結果が hex で出る', () => {
    render(<MixPanel selection={DEFAULT_SELECTION} onChange={() => {}} />)
    expect(screen.getByText(/^#[0-9A-F]{6}$/)).toBeTruthy()
  })

  it('スライダーを動かすと新しい比率を伝える', () => {
    const onChange = vi.fn()
    render(<MixPanel selection={DEFAULT_SELECTION} onChange={onChange} />)

    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } })
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_SELECTION, weightA: 8 })
  })

  it('スライダーは 1〜9 の範囲（どちらかが 0 になる位置は選べない）', () => {
    render(<MixPanel selection={DEFAULT_SELECTION} onChange={() => {}} />)
    const slider = screen.getByRole('slider')
    expect(slider.getAttribute('min')).toBe('1')
    expect(slider.getAttribute('max')).toBe('9')
  })
})

describe('「〜っぽいいろ」の出しかた', () => {
  it('材料と違う色に近ければ、その名前で説明する', () => {
    // あお5：きいろ5 は みどり系になる
    render(<MixPanel selection={selectionOf('ao', 'kiiro', 5)} onChange={() => {}} />)
    expect(screen.getByText(/っぽいいろ$/)).toBeTruthy()
  })

  it('材料そのものに近いときは名前を出さない', () => {
    // あか9：きいろ1 は ほぼ あか のまま
    render(<MixPanel selection={selectionOf('aka', 'kiiro', 9)} onChange={() => {}} />)
    expect(screen.getByText('こんないろ')).toBeTruthy()
    expect(screen.queryByText(/っぽいいろ/)).toBeNull()
  })

  it('どのパレット色からも遠い色には名前を出さない', () => {
    // あお2：うすだいだい8 は最近色が しろ だが ΔE 20 超で しろではない
    render(
      <MixPanel selection={selectionOf('ao', 'usudaidai', 2)} onChange={() => {}} />,
    )
    expect(screen.getByText('こんないろ')).toBeTruthy()
    expect(screen.queryByText(/っぽいいろ/)).toBeNull()
  })
})

describe('色を選び直す', () => {
  it('1つめを押すとシートが開き、もう一方の色は選べない', () => {
    render(<MixPanel selection={DEFAULT_SELECTION} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /1つめ/ }))

    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-label')).toBe('1つめのいろ')
    // 2つめが きいろ なので きいろ は選べない
    expect(screen.getByRole('button', { name: 'きいろ' })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('シートで選んだ色が1つめに入る', () => {
    const onChange = vi.fn()
    render(<MixPanel selection={DEFAULT_SELECTION} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /1つめ/ }))
    fireEvent.click(screen.getByRole('button', { name: 'あか' }))

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0][0].colorA.id).toBe('aka')
    // 2つめと比率は変わらない
    expect(onChange.mock.calls[0][0].colorB.id).toBe('kiiro')
    expect(onChange.mock.calls[0][0].weightA).toBe(5)
  })

  it('2つめを押したときは2つめが差し替わる', () => {
    const onChange = vi.fn()
    render(<MixPanel selection={DEFAULT_SELECTION} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /2つめ/ }))
    fireEvent.click(screen.getByRole('button', { name: 'あか' }))

    expect(onChange.mock.calls[0][0].colorB.id).toBe('aka')
    expect(onChange.mock.calls[0][0].colorA.id).toBe('ao')
  })
})
