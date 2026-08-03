/**
 * 色空間の変換と色差の計算。
 *
 * 混色エンジン（lib/mix.ts）はリニアRGBを反射率として扱うのでガンマ変換が必要で、
 * 逆引き探索（lib/reverse.ts）は「人の目で見て近いか」でランキングするので
 * CIEDE2000 が必要になる。その両方をここに置いている。
 */

/** 0..1 のリニアRGB */
export type LinearRgb = { r: number; g: number; b: number }
/** 0..255 の sRGB */
export type Srgb = { r: number; g: number; b: number }
/** CIE L*a*b* (D65) */
export type Lab = { l: number; a: number; b: number }

export function hexToSrgb(hex: string): Srgb {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function srgbToHex({ r, g, b }: Srgb): string {
  const hex = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase()
}

/** sRGB のガンマを除去してリニアRGB（光の強さに比例する値）にする */
export function srgbToLinear({ r, g, b }: Srgb): LinearRgb {
  const f = (v: number) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return { r: f(r), g: f(g), b: f(b) }
}

/** リニアRGB に sRGB のガンマをかけ直す */
export function linearToSrgb({ r, g, b }: LinearRgb): Srgb {
  const f = (v: number) => {
    const c = Math.min(1, Math.max(0, v))
    const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
    return s * 255
  }
  return { r: f(r), g: f(g), b: f(b) }
}

// D65 白色点
const XN = 0.95047
const YN = 1.0
const ZN = 1.08883

export function linearToLab({ r, g, b }: LinearRgb): Lab {
  // sRGB → XYZ (D65)
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041

  const f = (t: number) =>
    t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29
  const fx = f(x / XN)
  const fy = f(y / YN)
  const fz = f(z / ZN)

  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

export function hexToLab(hex: string): Lab {
  return linearToLab(srgbToLinear(hexToSrgb(hex)))
}

/**
 * CIEDE2000 の色差 ΔE00。
 * 目安: 1 未満は人には見分けられない / 2〜3 で並べると違いが分かる / 10 超で明らかに別の色。
 */
export function deltaE2000(c1: Lab, c2: Lab): number {
  const kL = 1
  const kC = 1
  const kH = 1

  const c1ab = Math.sqrt(c1.a * c1.a + c1.b * c1.b)
  const c2ab = Math.sqrt(c2.a * c2.a + c2.b * c2.b)
  const cBar = (c1ab + c2ab) / 2
  const cBar7 = Math.pow(cBar, 7)
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + Math.pow(25, 7))))

  const a1p = (1 + g) * c1.a
  const a2p = (1 + g) * c2.a
  const c1p = Math.sqrt(a1p * a1p + c1.b * c1.b)
  const c2p = Math.sqrt(a2p * a2p + c2.b * c2.b)

  const hp = (ap: number, bp: number) => {
    if (ap === 0 && bp === 0) return 0
    const h = (Math.atan2(bp, ap) * 180) / Math.PI
    return h >= 0 ? h : h + 360
  }
  const h1p = hp(a1p, c1.b)
  const h2p = hp(a2p, c2.b)

  const dLp = c2.l - c1.l
  const dCp = c2p - c1p

  let dhp: number
  if (c1p * c2p === 0) {
    dhp = 0
  } else if (Math.abs(h2p - h1p) <= 180) {
    dhp = h2p - h1p
  } else if (h2p - h1p > 180) {
    dhp = h2p - h1p - 360
  } else {
    dhp = h2p - h1p + 360
  }
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin((dhp * Math.PI) / 360)

  const lBarP = (c1.l + c2.l) / 2
  const cBarP = (c1p + c2p) / 2

  let hBarP: number
  if (c1p * c2p === 0) {
    hBarP = h1p + h2p
  } else if (Math.abs(h1p - h2p) <= 180) {
    hBarP = (h1p + h2p) / 2
  } else if (h1p + h2p < 360) {
    hBarP = (h1p + h2p + 360) / 2
  } else {
    hBarP = (h1p + h2p - 360) / 2
  }

  const rad = (deg: number) => (deg * Math.PI) / 180
  const t =
    1 -
    0.17 * Math.cos(rad(hBarP - 30)) +
    0.24 * Math.cos(rad(2 * hBarP)) +
    0.32 * Math.cos(rad(3 * hBarP + 6)) -
    0.2 * Math.cos(rad(4 * hBarP - 63))

  const dTheta = 30 * Math.exp(-Math.pow((hBarP - 275) / 25, 2))
  const cBarP7 = Math.pow(cBarP, 7)
  const rC = 2 * Math.sqrt(cBarP7 / (cBarP7 + Math.pow(25, 7)))
  const rT = -rC * Math.sin(rad(2 * dTheta))

  const lBarP50 = Math.pow(lBarP - 50, 2)
  const sL = 1 + (0.015 * lBarP50) / Math.sqrt(20 + lBarP50)
  const sC = 1 + 0.045 * cBarP
  const sH = 1 + 0.015 * cBarP * t

  const termL = dLp / (kL * sL)
  const termC = dCp / (kC * sC)
  const termH = dHp / (kH * sH)

  return Math.sqrt(
    termL * termL + termC * termC + termH * termH + rT * termC * termH,
  )
}
