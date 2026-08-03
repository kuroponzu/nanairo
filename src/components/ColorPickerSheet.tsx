import { useEffect } from 'react'
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
  // 開いている間は背後がスクロールしないようにする
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="とじる"
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
      />
      <div
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
