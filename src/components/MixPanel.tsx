import { useMemo, useState } from 'react'
import type { PaletteColor } from '../data/palette'
import { mixColors } from '../lib/mix'
import { closenessOf, nearestColor, textColorOn } from '../lib/nearest'
import { WEIGHT_TOTAL, type MixSelection } from '../lib/selection'
import { ColorPickerSheet } from './ColorPickerSheet'

type Props = {
  selection: MixSelection
  onChange: (selection: MixSelection) => void
}

/**
 * 「まぜる」タブ。2色と比率を選ぶと混ぜた結果が出る。
 */
export function MixPanel({ selection, onChange }: Props) {
  const [picking, setPicking] = useState<'a' | 'b' | null>(null)
  const { colorA, colorB, weightA } = selection
  const weightB = WEIGHT_TOTAL - weightA

  const result = useMemo(
    () =>
      mixColors([
        { hex: colorA.hex, weight: weightA, colorId: colorA.id },
        { hex: colorB.hex, weight: weightB, colorId: colorB.id },
      ]),
    [colorA, colorB, weightA, weightB],
  )

  const nearest = useMemo(() => nearestColor(result), [result])
  /**
   * 「〜っぽいいろ」と名前で言えるのは次の両方を満たすときだけ。
   * - 結果が材料そのままに近くない（「あお＋しろ＝あおっぽい」では何も言っていない）
   * - 実際に名前で呼べるくらい近い。閾値を置かないと ΔE 20 超の色にも
   *   名前を付けてしまい（例：あお2：うすだいだい8 が「しろっぽいいろ」）、
   *   実物と見比べる子供に嘘を教えることになる
   */
  const showNearest =
    nearest.color.id !== colorA.id &&
    nearest.color.id !== colorB.id &&
    closenessOf(nearest.deltaE) !== 'far'

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="mb-2 text-sm font-bold text-stone-500">
          まぜる2しょくをえらぶ
        </h2>
        <div className="flex items-center gap-2">
          <ColorSlot
            color={colorA}
            onClick={() => setPicking('a')}
            label="1つめ"
          />
          <span className="text-2xl font-bold text-stone-400">＋</span>
          <ColorSlot
            color={colorB}
            onClick={() => setPicking('b')}
            label="2つめ"
          />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-stone-500">
          どれくらいまぜる？
        </h2>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-baseline justify-between text-sm font-bold text-stone-700">
            <span>
              {colorA.name} {weightA}
            </span>
            <span className="text-stone-400">：</span>
            <span>
              {weightB} {colorB.name}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={WEIGHT_TOTAL - 1}
            step={1}
            value={weightA}
            onChange={(e) =>
              onChange({ ...selection, weightA: Number(e.target.value) })
            }
            aria-label={`${colorA.name} と ${colorB.name} をまぜるわりあい`}
            // つまみを動かす帯をそのまま2色のグラデーションにして直感的にする。
            // ブラウザ既定のトラックが上に描かれてしまうので appearance-none で消す
            className="ratio-slider h-11 w-full cursor-pointer"
            style={{
              backgroundImage: `linear-gradient(to right, ${colorA.hex}, ${colorB.hex})`,
            }}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-stone-500">できるいろ</h2>
        <div
          className="flex min-h-40 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-stone-200 p-6 shadow-sm"
          style={{ backgroundColor: result }}
        >
          <span
            className="text-xl font-bold"
            style={{ color: textColorOn(result) }}
          >
            {showNearest ? `${nearest.color.name} っぽいいろ` : 'こんないろ'}
          </span>
          <span
            className="font-mono text-xs opacity-70"
            style={{ color: textColorOn(result) }}
          >
            {result}
          </span>
        </div>
      </div>

      <ColorPickerSheet
        open={picking !== null}
        title={picking === 'a' ? '1つめのいろ' : '2つめのいろ'}
        selectedId={picking === 'a' ? colorA.id : colorB.id}
        disabledIds={picking === 'a' ? [colorB.id] : [colorA.id]}
        onSelect={(color) =>
          onChange(
            picking === 'a'
              ? { ...selection, colorA: color }
              : { ...selection, colorB: color },
          )
        }
        onClose={() => setPicking(null)}
      />
    </div>
  )
}

function ColorSlot({
  color,
  label,
  onClick,
}: {
  color: PaletteColor
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-stone-300 p-4 shadow-sm transition active:scale-95"
      style={{ backgroundColor: color.hex }}
    >
      <span
        className="text-[10px] font-medium opacity-70"
        style={{ color: textColorOn(color.hex) }}
      >
        {label}
      </span>
      <span
        className="text-base font-bold"
        style={{ color: textColorOn(color.hex) }}
      >
        {color.name}
      </span>
    </button>
  )
}
