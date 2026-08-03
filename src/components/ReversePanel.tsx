import { useMemo, useState } from 'react'
import { PALETTE, type PaletteColor } from '../data/palette'
import { closenessOf, findRecipes, type Recipe } from '../lib/reverse'
import { textColorOn } from '../lib/nearest'
import { ColorPickerSheet } from './ColorPickerSheet'

/** 色差の区分ごとの言い回し。子供に読み上げられるようにひらがな中心 */
const CLOSENESS_LABEL: Record<string, string> = {
  almost: 'そっくりな いろ',
  close: 'かなり ちかい いろ',
  similar: 'にている いろ',
  far: 'ちょっと ちがう いろ',
}

type Props = {
  /** 候補をタップしたときに「まぜる」タブへ送る */
  onTryRecipe: (recipe: Recipe) => void
}

/**
 * 「つくる」タブ。作りたい色を選ぶと、それを作るための組合せを提案する。
 */
export function ReversePanel({ onTryRecipe }: Props) {
  const [target, setTarget] = useState<PaletteColor>(
    () => PALETTE.find((c) => c.id === 'murasaki')!,
  )
  const [picking, setPicking] = useState(false)

  // 目標色そのものを材料にすると「むらさき＋むらさき」になってしまうので除く
  const recipes = useMemo(
    () => findRecipes(target.hex, { limit: 4, excludeIds: [target.id] }),
    [target],
  )

  const best = recipes[0]
  /**
   * 混ぜて作れない色かどうか。原色は色差の値に関わらず作れない。
   * 「しろ」は候補の色差が中くらいに収まってしまうが実際に出てくるのは
   * ベージュで白ではないため、色差だけで判定すると誤解を与える。
   */
  const unreachable =
    target.primary === true ||
    (best !== undefined && closenessOf(best.deltaE) === 'far')

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="mb-2 text-sm font-bold text-stone-500">
          つくりたい いろをえらぶ
        </h2>
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-stone-300 p-4 shadow-sm transition active:scale-95"
          style={{ backgroundColor: target.hex }}
        >
          <span
            className="text-xl font-bold"
            style={{ color: textColorOn(target.hex) }}
          >
            {target.name}
          </span>
          <span
            className="text-[10px] font-medium opacity-70"
            style={{ color: textColorOn(target.hex) }}
          >
            タップしてかえる
          </span>
        </button>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-stone-500">
          こうすると つくれるよ
        </h2>

        {unreachable && (
          <p className="mb-3 rounded-2xl bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">
            {target.name}は ほかのいろを まぜても つくれません。
            もとになる いろなので、そのまま つかいましょう。
            <br />
            <span className="text-xs opacity-80">
              いちばん ちかづけられるのは つぎの くみあわせです。
            </span>
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {recipes.map((recipe) => (
            <li key={recipe.parts.map((p) => p.color.id).join('+')}>
              <RecipeCard recipe={recipe} onClick={() => onTryRecipe(recipe)} />
            </li>
          ))}
        </ul>
      </div>

      <ColorPickerSheet
        open={picking}
        title="つくりたいいろ"
        selectedId={target.id}
        onSelect={setTarget}
        onClose={() => setPicking(false)}
      />
    </div>
  )
}

function RecipeCard({
  recipe,
  onClick,
}: {
  recipe: Recipe
  onClick: () => void
}) {
  const label = CLOSENESS_LABEL[closenessOf(recipe.deltaE)]
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition active:scale-[0.98]"
    >
      <div className="flex shrink-0 items-center gap-1">
        {recipe.parts.map((part, i) => (
          <div key={part.color.id} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-sm font-bold text-stone-400">＋</span>
            )}
            <span
              className="size-9 rounded-lg border border-stone-300"
              style={{ backgroundColor: part.color.hex }}
              aria-hidden
            />
          </div>
        ))}
        <span className="text-sm font-bold text-stone-400">＝</span>
        <span
          className="size-11 rounded-lg border-2 border-stone-300"
          style={{ backgroundColor: recipe.resultHex }}
          aria-hidden
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-stone-800">
          {recipe.parts.map((p) => p.color.name).join(' と ')}
        </p>
        <p className="text-xs text-stone-500">
          {recipe.parts.map((p) => p.ratio).join(' : ')} のわりあい・{label}
        </p>
      </div>

      <span className="shrink-0 text-xs font-bold text-stone-400">ためす →</span>
    </button>
  )
}
