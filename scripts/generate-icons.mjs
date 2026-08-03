/**
 * favicon.svg と同じデザインの PNG アイコンを生成する。
 *
 * iOS の apple-touch-icon は SVG を受け付けないため PNG が必要だが、
 * この環境には SVG→PNG の変換ツール（rsvg-convert / ImageMagick 等）が無い。
 * 図形が円と角丸四角だけなので、ピクセルを直接塗って PNG にエンコードしている。
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

/** favicon.svg の viewBox（64×64）上での配置。変更したら両方を揃えること */
const BG = '#F5F5F4'
const CIRCLES = [
  { cx: 21, cy: 19, r: 8, fill: '#E60012' },
  { cx: 38, cy: 15, r: 7, fill: '#F08300' },
  { cx: 50, cy: 26, r: 6.5, fill: '#FFE800' },
  { cx: 47, cy: 42, r: 7, fill: '#009944' },
  { cx: 33, cy: 50, r: 7.5, fill: '#0068B7' },
  { cx: 17, cy: 42, r: 7, fill: '#7B2E8E' },
  { cx: 30, cy: 31, r: 7, fill: '#B5379A' },
]
const VIEWBOX = 64
const CORNER_RADIUS = 14

/** 4×4 のスーパーサンプリングで縁を滑らかにする */
const SAMPLES = 4

function parseHex(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** viewBox 座標の点がどの色になるか。角丸の外側は null（透明） */
function sampleAt(x, y, rounded) {
  if (rounded) {
    const r = CORNER_RADIUS
    // 角の丸みの外側かどうかを、各コーナーの中心からの距離で判定する
    const dx = Math.max(r - x, x - (VIEWBOX - r), 0)
    const dy = Math.max(r - y, y - (VIEWBOX - r), 0)
    if (dx > 0 && dy > 0 && dx * dx + dy * dy > r * r) return null
  }
  // 後ろに描いた円が手前に来るよう、逆順に当たり判定する
  for (let i = CIRCLES.length - 1; i >= 0; i--) {
    const c = CIRCLES[i]
    const dx = x - c.cx
    const dy = y - c.cy
    if (dx * dx + dy * dy <= c.r * c.r) return parseHex(c.fill)
  }
  return parseHex(BG)
}

function render(size, rounded) {
  // RGBA を行ごとに、各行の先頭にフィルタタイプ 0 を付けた PNG の生データ
  const raw = Buffer.alloc(size * (size * 4 + 1))
  const scale = VIEWBOX / size
  let p = 0
  for (let py = 0; py < size; py++) {
    raw[p++] = 0
    for (let px = 0; px < size; px++) {
      let r = 0
      let g = 0
      let b = 0
      let hits = 0
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const x = (px + (sx + 0.5) / SAMPLES) * scale
          const y = (py + (sy + 0.5) / SAMPLES) * scale
          const c = sampleAt(x, y, rounded)
          if (c === null) continue
          r += c[0]
          g += c[1]
          b += c[2]
          hits++
        }
      }
      const total = SAMPLES * SAMPLES
      if (hits === 0) {
        p += 4
        continue
      }
      // 透明部分と混ざらないよう、色は当たったサンプルだけで平均する
      raw[p++] = Math.round(r / hits)
      raw[p++] = Math.round(g / hits)
      raw[p++] = Math.round(b / hits)
      raw[p++] = Math.round((hits / total) * 255)
    }
  }
  return raw
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function toPng(size, raw) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // ビット深度
  ihdr[9] = 6 // カラータイプ: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const TARGETS = [
  // iOS はホーム画面追加時に自前で角を丸めるので、こちらは四角のまま塗る
  { file: 'apple-touch-icon.png', size: 180, rounded: false },
  { file: 'icon-192.png', size: 192, rounded: true },
  { file: 'icon-512.png', size: 512, rounded: true },
]

for (const { file, size, rounded } of TARGETS) {
  const png = toPng(size, render(size, rounded))
  writeFileSync(join(PUBLIC_DIR, file), png)
  console.log(`${file} (${size}x${size}) ${png.length} bytes`)
}
