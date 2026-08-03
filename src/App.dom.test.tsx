/** @vitest-environment jsdom */
import { describe, expect, it, beforeAll } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

beforeAll(() => {
  // jsdom には scrollTo がないので、タブ切り替え時の呼び出しを受け止める
  window.scrollTo = () => {}
})

/** 「できるいろ」の枠に出ている hex を読む */
const shownHex = () => {
  const text = screen.getByText(/^#[0-9A-F]{6}$/).textContent
  return text ?? ''
}

describe('App のタブ', () => {
  it('最初は「まぜる」タブで、あお と きいろ が選ばれている', () => {
    render(<App />)
    expect(screen.getByRole('tab', { name: 'まぜる' })).toHaveProperty(
      'ariaSelected',
      'true',
    )
    expect(screen.getByRole('button', { name: /1つめ.*あお/s })).toBeTruthy()
    expect(screen.getByRole('button', { name: /2つめ.*きいろ/s })).toBeTruthy()
  })

  it('あお + きいろ の結果が みどり系の名前で説明される', () => {
    render(<App />)
    expect(screen.getByText(/みどり っぽいいろ|きみどり っぽいいろ/)).toBeTruthy()
  })

  it('タブを切り替えると中身が入れ替わる', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('tab', { name: 'つくる' }))

    expect(screen.getByText('つくりたい いろをえらぶ')).toBeTruthy()
    expect(screen.queryByText('まぜる2しょくをえらぶ')).toBeNull()
    expect(screen.getByRole('tab', { name: 'つくる' })).toHaveProperty(
      'ariaSelected',
      'true',
    )
  })

  it('表示中のパネルだけが tabpanel として存在し、タブと結びついている', async () => {
    render(<App />)
    const panels = screen.getAllByRole('tabpanel')
    expect(panels).toHaveLength(1)

    // aria-labelledby の指す要素が実在すること
    const labelledBy = panels[0].getAttribute('aria-labelledby')!
    expect(document.getElementById(labelledBy)).toBeTruthy()

    // 選択中のタブの aria-controls も実在する要素を指すこと
    const selected = screen.getByRole('tab', { selected: true })
    const controls = selected.getAttribute('aria-controls')!
    expect(document.getElementById(controls)).toBe(panels[0])

    // 非選択のタブは存在しないパネルを指さない
    const unselected = screen.getByRole('tab', { selected: false })
    expect(unselected.getAttribute('aria-controls')).toBeNull()
  })
})

describe('色を選び直す', () => {
  it('1つめの色を変えると結果の色が変わる', async () => {
    render(<App />)
    const before = shownHex()

    await userEvent.click(screen.getByRole('button', { name: /1つめ/ }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'あか' }),
    )

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: /1つめ.*あか/s })).toBeTruthy()
    expect(shownHex()).not.toBe(before)
  })

  it('結果が材料そのものに近いときは色名を出さない', async () => {
    // あか9：きいろ1 は最近色が材料の「あか」自身になる。
    // 「あかっぽいいろ」と言っても何も説明していないので出さない
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /1つめ/ }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'あか' }),
    )
    fireEvent.change(screen.getByRole('slider'), { target: { value: '9' } })

    expect(screen.getByText('こんないろ')).toBeTruthy()
    expect(screen.queryByText(/っぽいいろ/)).toBeNull()
  })

  it('あか + あお で むらさき系の名前が出る', async () => {
    // サクラクレパスの解説どおり「赤＋青＝暗めの紫」になること
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /2つめ/ }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'あか' }),
    )
    expect(
      screen.getByText(
        /むらさき っぽいいろ|あおむらさき っぽいいろ|あかむらさき っぽいいろ/,
      ),
    ).toBeTruthy()
  })

  it('きいろを多くすると だいだい系の名前が出る', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /1つめ/ }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'あか' }),
    )
    // スライダーを あか 2：きいろ 8 に寄せる
    const slider = screen.getByRole('slider')
    slider.focus()
    fireEvent.change(slider, { target: { value: '2' } })
    expect(screen.getByText('あか 2')).toBeTruthy()

    expect(
      screen.getByText(
        /だいだいいろ っぽいいろ|しゅいろ っぽいいろ|やまぶきいろ っぽいいろ/,
      ),
    ).toBeTruthy()
  })

  it('すでに選んでいる色は、もう一方の候補から選べない', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /2つめ/ }))
    // 1つめが あお なので、2つめでは あお を選べない
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'あお' }),
    ).toHaveProperty('disabled', true)
  })
})

describe('「つくる」の候補を「ためす」と、同じ色が出る', () => {
  it('候補に表示された色と、まぜるタブの結果が一致する', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('tab', { name: 'つくる' }))

    // 先頭の候補の材料名と、そこに描かれている結果色を控える
    const first = screen.getAllByRole('button', { name: /ためす/ })[0]
    const materials = within(first)
      .getByText(/ と /)
      .textContent!.split(' と ')
    const swatches = first.querySelectorAll('span[style*="background-color"]')
    const resultStyle = (swatches[swatches.length - 1] as HTMLElement).style
      .backgroundColor

    await userEvent.click(first)

    // まぜるタブに移り、材料がそのまま入っている
    expect(screen.getByRole('tab', { name: 'まぜる' })).toHaveProperty(
      'ariaSelected',
      'true',
    )
    expect(
      screen.getByRole('button', {
        name: new RegExp(`1つめ.*${materials[0]}`, 's'),
      }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', {
        name: new RegExp(`2つめ.*${materials[1]}`, 's'),
      }),
    ).toBeTruthy()

    // 結果の色も候補の見本と同じ
    const panel = screen.getByText('できるいろ').parentElement!
    const shown = (panel.querySelector('[style*="background-color"]') as HTMLElement)
      .style.backgroundColor
    expect(shown).toBe(resultStyle)
  })

  it('候補の比率がスライダーに反映される', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('tab', { name: 'つくる' }))

    const first = screen.getAllByRole('button', { name: /ためす/ })[0]
    const ratioText = within(first).getByText(/のわりあい/).textContent!
    const [ratioA, ratioB] = ratioText
      .split(' のわりあい')[0]
      .split(' : ')
      .map(Number)

    await userEvent.click(first)

    const slider = screen.getByRole('slider') as HTMLInputElement
    const weightA = Number(slider.value)
    // 約分前の比に戻っている（2:3 なら 4:6）
    expect(weightA / 10).toBeCloseTo(ratioA / (ratioA + ratioB), 10)
  })
})

describe('つくれない色の説明', () => {
  it('原色を選ぶと「まぜても つくれません」と伝える', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('tab', { name: 'つくる' }))
    await userEvent.click(screen.getByRole('button', { name: /タップしてかえる/ }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'きいろ' }),
    )
    expect(screen.getByText(/まぜても つくれません/)).toBeTruthy()
  })

  it('あか・あお は作れる色として扱う（「つくれません」と言わない）', async () => {
    // 原色扱いしていたころは「つくれません」と言った直下に
    // 「そっくりな いろ」の候補が並んで矛盾していた
    render(<App />)
    await userEvent.click(screen.getByRole('tab', { name: 'つくる' }))

    for (const name of ['あか', 'あお']) {
      await userEvent.click(
        screen.getByRole('button', { name: /タップしてかえる/ }),
      )
      await userEvent.click(
        within(screen.getByRole('dialog')).getByRole('button', { name }),
      )
      expect(screen.queryByText(/まぜても つくれません/), name).toBeNull()
      expect(screen.getAllByRole('button', { name: /ためす/ }).length).toBeGreaterThan(0)
    }
  })
})
