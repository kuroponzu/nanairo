/**
 * 基本の24色。
 *
 * 学童用の色鉛筆24色セット（トンボ・サクラなど）の標準構成に合わせている。
 * 混色に使えない金・銀は含まない。子供に見せるので色名はひらがな表記。
 *
 * order は画面のグリッドに並べる順序で、色相がなだらかにつながるよう
 * 「無彩色 → 黄 → 橙・茶 → 赤 → 紫 → 青 → 緑」の流れにしている。
 */
export type PaletteColor = {
  /** 内部識別子（ローマ字） */
  id: string
  /** 表示名（ひらがな） */
  name: string
  /** sRGB の16進表記 */
  hex: string
  /**
   * 他の色を混ぜても作れない色。
   * 減法混色の原色（黄・赤紫・青緑）と白黒がこれにあたる。
   * 「作れない」ことは色の学習で一番大事な事実なので、
   * 逆引きで候補を出すより先にそう伝えるために印を付けている。
   *
   * 「あか」「あお」は日常の感覚では原色だが減法混色の原色ではなく、
   * 実際に あかむらさき＋しゅいろ や あおむらさき＋あおみどり で
   * かなり近い色が作れてしまう（reverse.test.ts で数値を固定している）。
   * 印を付けると「つくれません」と言った直下に「そっくりな いろ」の
   * 候補が並んで矛盾するので、ここには含めない。
   */
  primary?: true
}

export const PALETTE: PaletteColor[] = [
  // 黄色系
  { id: 'kiiro', name: 'きいろ', hex: '#FFE800', primary: true },
  { id: 'yamabuki', name: 'やまぶきいろ', hex: '#F6AA00' },
  { id: 'daidai', name: 'だいだいいろ', hex: '#F08300' },
  { id: 'shu', name: 'しゅいろ', hex: '#EB6101' },
  // 赤・桃系
  { id: 'aka', name: 'あか', hex: '#E60012' },
  { id: 'momo', name: 'ももいろ', hex: '#F8B0C0' },
  { id: 'usudaidai', name: 'うすだいだい', hex: '#FBD5B5' },
  { id: 'oudo', name: 'おうどいろ', hex: '#C7A252' },
  // 茶系
  { id: 'cha', name: 'ちゃいろ', hex: '#8F5A2C' },
  { id: 'kogecha', name: 'こげちゃ', hex: '#563A26' },
  // 紫系
  { id: 'akamurasaki', name: 'あかむらさき', hex: '#B5379A', primary: true },
  { id: 'murasaki', name: 'むらさき', hex: '#7B2E8E' },
  { id: 'aomurasaki', name: 'あおむらさき', hex: '#5B4B9F' },
  { id: 'ai', name: 'あいいろ', hex: '#1B3B7A' },
  // 青系
  { id: 'gunjou', name: 'ぐんじょういろ', hex: '#2A3E9E' },
  { id: 'ao', name: 'あお', hex: '#0068B7' },
  { id: 'mizu', name: 'みずいろ', hex: '#7BC8E8' },
  { id: 'aomidori', name: 'あおみどり', hex: '#00A29A', primary: true },
  // 緑系
  { id: 'fukamidori', name: 'ふかみどり', hex: '#00622E' },
  { id: 'midori', name: 'みどり', hex: '#009944' },
  { id: 'kimidori', name: 'きみどり', hex: '#8FC31F' },
  // 無彩色
  { id: 'shiro', name: 'しろ', hex: '#FFFFFF', primary: true },
  { id: 'hai', name: 'はいいろ', hex: '#949495' },
  { id: 'kuro', name: 'くろ', hex: '#231815', primary: true },
]

const BY_ID = new Map(PALETTE.map((c) => [c.id, c]))

export function findColor(id: string): PaletteColor | undefined {
  return BY_ID.get(id)
}
