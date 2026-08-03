/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorPickerSheet } from './ColorPickerSheet'
import { PALETTE } from '../data/palette'

const noop = () => {}

describe('ColorPickerSheet', () => {
  it('閉じているあいだは何も描画しない', () => {
    render(
      <ColorPickerSheet
        open={false}
        title="1つめのいろ"
        onSelect={noop}
        onClose={noop}
      />,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('24色すべてが選べる形で並ぶ', () => {
    render(
      <ColorPickerSheet
        open
        title="1つめのいろ"
        onSelect={noop}
        onClose={noop}
      />,
    )
    for (const color of PALETTE) {
      expect(screen.getByRole('button', { name: color.name })).toBeTruthy()
    }
  })

  it('色を選ぶと、その色を渡して閉じる', async () => {
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <ColorPickerSheet
        open
        title="1つめのいろ"
        onSelect={onSelect}
        onClose={onClose}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'みどり' }))

    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect.mock.calls[0][0].id).toBe('midori')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('disabledIds の色は押せない（同じ色同士を混ぜさせない）', async () => {
    const onSelect = vi.fn()
    render(
      <ColorPickerSheet
        open
        title="2つめのいろ"
        disabledIds={['midori']}
        onSelect={onSelect}
        onClose={noop}
      />,
    )
    const midori = screen.getByRole('button', { name: 'みどり' })
    expect(midori).toHaveProperty('disabled', true)

    await userEvent.click(midori)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('Escape で閉じる', async () => {
    const onClose = vi.fn()
    render(
      <ColorPickerSheet
        open
        title="1つめのいろ"
        onSelect={noop}
        onClose={onClose}
      />,
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('開いたら選択中の色にフォーカスが移る', () => {
    render(
      <ColorPickerSheet
        open
        title="1つめのいろ"
        selectedId="ao"
        onSelect={noop}
        onClose={noop}
      />,
    )
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'あお' }),
    )
  })

  it('選択中の色がなければシート内の先頭にフォーカスが移る', () => {
    render(
      <ColorPickerSheet
        open
        title="1つめのいろ"
        onSelect={noop}
        onClose={noop}
      />,
    )
    // 背後に取り残されず、少なくともシートの中にいる
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(
      true,
    )
  })

  it('閉じたら開く前の要素にフォーカスが戻る', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const { rerender } = render(
      <ColorPickerSheet
        open
        title="1つめのいろ"
        selectedId="ao"
        onSelect={noop}
        onClose={noop}
      />,
    )
    expect(document.activeElement).not.toBe(opener)

    rerender(
      <ColorPickerSheet
        open={false}
        title="1つめのいろ"
        selectedId="ao"
        onSelect={noop}
        onClose={noop}
      />,
    )
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })

  it('Tab がシートの外に出ていかない', async () => {
    // シートの外にもボタンを置いて、そこへ移動しないことを確かめる
    const outside = document.createElement('button')
    outside.textContent = 'そとのボタン'
    document.body.appendChild(outside)

    render(
      <ColorPickerSheet
        open
        title="1つめのいろ"
        selectedId="kuro"
        onSelect={noop}
        onClose={noop}
      />,
    )
    const dialog = screen.getByRole('dialog')

    // 最後の色（くろ）から Tab すると、外へ出ずに先頭へ戻る
    for (let i = 0; i < 3; i++) {
      await userEvent.tab()
      expect(document.activeElement).not.toBe(outside)
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
    outside.remove()
  })

  it('Shift+Tab でも輪の中に留まる', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)

    render(
      <ColorPickerSheet
        open
        title="1つめのいろ"
        onSelect={noop}
        onClose={noop}
      />,
    )
    const dialog = screen.getByRole('dialog')

    for (let i = 0; i < 3; i++) {
      await userEvent.tab({ shift: true })
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
    outside.remove()
  })

  it('無効な色にはフォーカスが移らない', async () => {
    render(
      <ColorPickerSheet
        open
        title="2つめのいろ"
        disabledIds={['midori']}
        onSelect={noop}
        onClose={noop}
      />,
    )
    const midori = screen.getByRole('button', { name: 'みどり' })
    for (let i = 0; i < 26; i++) {
      await userEvent.tab()
      expect(document.activeElement).not.toBe(midori)
    }
  })
})
