import { PALETTE, type PaletteColor } from '../data/palette'
import { textColorOn } from '../lib/nearest'

type Props = {
  /** 選択中の色のID */
  selectedId?: string
  onSelect: (color: PaletteColor) => void
  /** 選択できない色のID（同じ色同士を選ばせないために使う） */
  disabledIds?: string[]
}

/**
 * 24色のグリッド。スマホで指で押せるよう1マスを大きめに取り、
 * 色名も併記して「どの色を選んでいるか」が分かるようにしている。
 */
export function ColorGrid({ selectedId, onSelect, disabledIds = [] }: Props) {
  return (
    <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {PALETTE.map((color) => {
        const isSelected = color.id === selectedId
        const isDisabled = disabledIds.includes(color.id)
        return (
          <li key={color.id}>
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(color)}
              aria-pressed={isSelected}
              className={`flex aspect-square w-full flex-col items-center justify-end rounded-xl border-2 pb-1.5 transition ${
                isSelected
                  ? 'border-stone-800 ring-3 ring-stone-800/25'
                  : 'border-stone-300'
              } ${isDisabled ? 'cursor-not-allowed opacity-25' : 'active:scale-95'}`}
              style={{ backgroundColor: color.hex }}
            >
              <span
                className="px-0.5 text-[10px] leading-tight font-medium"
                style={{ color: textColorOn(color.hex) }}
              >
                {color.name}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
