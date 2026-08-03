import { useState } from 'react'
import { MixPanel } from './components/MixPanel'
import { ReversePanel } from './components/ReversePanel'
import type { Recipe } from './lib/reverse'
import {
  DEFAULT_SELECTION,
  selectionFromRecipe,
  type MixSelection,
} from './lib/selection'

type Tab = 'mix' | 'reverse'

export default function App() {
  const [tab, setTab] = useState<Tab>('mix')
  const [selection, setSelection] = useState<MixSelection>(DEFAULT_SELECTION)

  /** 「つくる」タブの候補をタップしたら、その組合せで「まぜる」タブを開く */
  const tryRecipe = (recipe: Recipe) => {
    setSelection(selectionFromRecipe(recipe))
    setTab('mix')
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-svh bg-stone-100 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="mx-auto max-w-lg px-4 pt-5 pb-3">
        <h1 className="text-2xl font-bold text-stone-800">なないろ</h1>
        <p className="mt-0.5 text-xs text-stone-500">
          いろをまぜたら なにいろ？ どうやって つくる？
        </p>
      </header>

      <nav className="sticky top-0 z-10 bg-stone-100/95 px-4 pb-3 backdrop-blur">
        <div
          role="tablist"
          aria-label="モード"
          className="mx-auto flex max-w-lg gap-1 rounded-full bg-stone-200 p-1"
        >
          <TabButton
            id="tab-mix"
            active={tab === 'mix'}
            onClick={() => setTab('mix')}
            controls="panel-mix"
          >
            まぜる
          </TabButton>
          <TabButton
            id="tab-reverse"
            active={tab === 'reverse'}
            onClick={() => setTab('reverse')}
            controls="panel-reverse"
          >
            つくる
          </TabButton>
        </div>
      </nav>

      <main className="mx-auto max-w-lg px-4">
        {/*
          選択中のパネルだけを描画するので、非選択タブの aria-controls は
          存在しない ID を指すことになる。それを避けるため、
          タブ側の aria-controls は選択中のときだけ付けている。
        */}
        {tab === 'mix' ? (
          <div id="panel-mix" role="tabpanel" aria-labelledby="tab-mix">
            <MixPanel selection={selection} onChange={setSelection} />
          </div>
        ) : (
          <div id="panel-reverse" role="tabpanel" aria-labelledby="tab-reverse">
            <ReversePanel onTryRecipe={tryRecipe} />
          </div>
        )}
      </main>
    </div>
  )
}

function TabButton({
  id,
  active,
  onClick,
  controls,
  children,
}: {
  id: string
  active: boolean
  onClick: () => void
  controls: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={active ? controls : undefined}
      onClick={onClick}
      className={`min-h-11 flex-1 rounded-full text-sm font-bold transition ${
        active
          ? 'bg-white text-stone-800 shadow-sm'
          : 'text-stone-500 active:bg-stone-300/50'
      }`}
    >
      {children}
    </button>
  )
}
