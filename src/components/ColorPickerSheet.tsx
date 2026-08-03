import { useEffect, useRef } from 'react'
import type { PaletteColor } from '../data/palette'
import { ColorGrid } from './ColorGrid'

type Props = {
  open: boolean
  title: string
  selectedId?: string
  disabledIds?: string[]
  onSelect: (color: PaletteColor) => void
  onClose: () => void
}

/** Tab で移動できる要素を拾うセレクタ。無効なマスは対象外にする */
const FOCUSABLE = 'button:not([disabled]), [href], input, [tabindex="0"]'

/**
 * 色を選ぶボトムシート。
 * スマホでは画面下から出てくる形にして、親指の届く位置で選べるようにしている。
 */
export function ColorPickerSheet({
  open,
  title,
  selectedId,
  disabledIds,
  onSelect,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // 開いている間は背後がスクロールしないようにする
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  /**
   * 開いたらシート内にフォーカスを移し、閉じたら開く前の要素へ戻す。
   * これがないとキーボード操作で「どこを操作しているか」が分からなくなる。
   */
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    // 選択中の色があればそこへ。なければシート先頭（見出し横のとじるボタン）
    const selected = dialogRef.current?.querySelector<HTMLElement>(
      '[aria-pressed="true"]',
    )
    const fallback = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    ;(selected ?? fallback)?.focus()
    return () => opener?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      // aria-modal だけでは Tab が背後のタブへ抜けていくので自分で輪を閉じる
      const items = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement

      if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (active instanceof Node && !dialogRef.current?.contains(active)) {
        // 何かの拍子に外へ出ていたら引き戻す
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[85svh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-3xl sm:pb-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full px-4 text-sm font-medium text-stone-500 active:bg-stone-100"
          >
            とじる
          </button>
        </div>
        <ColorGrid
          selectedId={selectedId}
          disabledIds={disabledIds}
          onSelect={(color) => {
            onSelect(color)
            onClose()
          }}
        />
      </div>
    </div>
  )
}
