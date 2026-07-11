import type { RGB, Oklab, OKLCH } from "./types.js";

// ─── CSS Named Colors ───────────────────────────────────────────────

const CSS_NAMED_COLORS: Record<string, string> = {
  aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aqua: "#00ffff",
  aquamarine: "#7fffd4", azure: "#f0ffff", beige: "#f5f5dc",
  bisque: "#ffe4c4", black: "#000000", blanchedalmond: "#ffebcd",
  blue: "#0000ff", blueviolet: "#8a2be2", brown: "#a52a2a",
  burlywood: "#deb887", cadetblue: "#5f9ea0", chartreuse: "#7fff00",
  chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc", crimson: "#dc143c", cyan: "#00ffff",
  darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9", darkgreen: "#006400", darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b", darkmagenta: "#8b008b", darkolivegreen: "#556b2f",
  darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000",
  darksalmon: "#e9967a", darkseagreen: "#8fbc8f", darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", darkturquoise: "#00ced1",
  darkviolet: "#9400d3", deeppink: "#ff1493", deepskyblue: "#00bfff",
  dimgray: "#696969", dimgrey: "#696969", dodgerblue: "#1e90ff",
  firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22",
  fuchsia: "#ff00ff", gainsboro: "#dcdcdc", ghostwhite: "#f8f8ff",
  gold: "#ffd700", goldenrod: "#daa520", gray: "#808080",
  green: "#008000", greenyellow: "#adff2f", grey: "#808080",
  honeydew: "#f0fff0", hotpink: "#ff69b4", indianred: "#cd5c5c",
  indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c",
  lavender: "#e6e6fa", lavenderblush: "#fff0f5", lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080",
  lightcyan: "#e0ffff", lightgoldenrodyellow: "#fafad2", lightgray: "#d3d3d3",
  lightgreen: "#90ee90", lightgrey: "#d3d3d3", lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", lightskyblue: "#87cefa",
  lightslategray: "#778899", lightslategrey: "#778899", lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0", lime: "#00ff00", limegreen: "#32cd32",
  linen: "#faf0e6", magenta: "#ff00ff", maroon: "#800000",
  mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3",
  mediumpurple: "#9370db", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc", mediumvioletred: "#c71585",
  midnightblue: "#191970", mintcream: "#f5fffa", mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5", navajowhite: "#ffdead", navy: "#000080",
  oldlace: "#fdf5e6", olive: "#808000", olivedrab: "#6b8e23",
  orange: "#ffa500", orangered: "#ff4500", orchid: "#da70d6",
  palegoldenrod: "#eee8aa", palegreen: "#98fb98", paleturquoise: "#afeeee",
  palevioletred: "#db7093", papayawhip: "#ffefd5", peachpuff: "#ffdab9",
  peru: "#cd853f", pink: "#ffc0cb", plum: "#dda0dd",
  powderblue: "#b0e0e6", purple: "#800080", rebeccapurple: "#663399",
  red: "#ff0000", rosybrown: "#bc8f8f", royalblue: "#4169e1",
  saddlebrown: "#8b4513", salmon: "#fa8072", sandybrown: "#f4a460",
  seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d",
  silver: "#c0c0c0", skyblue: "#87ceeb", slateblue: "#6a5acd",
  slategray: "#708090", slategrey: "#708090", snow: "#fffafa",
  springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c",
  teal: "#008080", thistle: "#d8bfd8", tomato: "#ff6347",
  turquoise: "#40e0d0", violet: "#ee82ee", wheat: "#f5deb3",
  white: "#ffffff", whitesmoke: "#f5f5f5", yellow: "#ffff00",
  yellowgreen: "#9acd32",
};

// ─── Validation ──────────────────────────────────────────────────────

export function isValidHex(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
}

export function normalizeHex(hex: string): string {
  let h = hex.replace("#", "").toLowerCase();
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return "#" + h;
}

/**
 * Parse any valid color input to a normalized HEX string.
 *
 * Accepted formats:
 * - HEX: "#ff0000", "#f00"
 * - RGB: "rgb(255, 0, 0)", "rgb(255 0 0)"
 * - RGBA: "rgba(255, 0, 0, 1)" (alpha is ignored)
 * - CSS named colors: "red", "teal", "coral", etc.
 */
export function parseColor(input: string): string {
  const trimmed = input.trim();

  // 1. HEX
  if (trimmed.startsWith("#")) {
    if (!isValidHex(trimmed)) {
      throw new Error(`Invalid HEX color: "${trimmed}".`);
    }
    return normalizeHex(trimmed);
  }

  // 2. rgb() / rgba()
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/i
  );
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    if (r > 255 || g > 255 || b > 255) {
      throw new Error(`RGB values must be 0–255. Got: rgb(${r}, ${g}, ${b}).`);
    }
    return rgbToHex({ r, g, b });
  }

  // 3. oklch()
  const oklchMatch = trimmed.match(
    /^oklch\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\)$/i
  );
  if (oklchMatch) {
    const L = parseFloat(oklchMatch[1]);
    const C = parseFloat(oklchMatch[2]);
    const H = parseFloat(oklchMatch[3]);
    if (isNaN(L) || isNaN(C) || isNaN(H) || L < 0 || L > 1 || C < 0) {
      throw new Error(
        `Invalid oklch() color: "${trimmed}". L must be 0–1, C must be ≥ 0.`
      );
    }
    return oklchToHex({ L, C, H });
  }

  // 4. CSS named color
  const named = CSS_NAMED_COLORS[trimmed.toLowerCase()];
  if (named) return named;

  throw new Error(
    `Unrecognized color: "${trimmed}". Expected HEX (#RGB/#RRGGBB), rgb(r,g,b), oklch(L C H), or a CSS color name.`
  );
}

// ─── HEX ↔ sRGB ─────────────────────────────────────────────────────

export function hexToRgb(hex: string): RGB {
  const h = normalizeHex(hex).replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHex(rgb: RGB): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(rgb.r).toString(16).padStart(2, "0");
  const g = clamp(rgb.g).toString(16).padStart(2, "0");
  const b = clamp(rgb.b).toString(16).padStart(2, "0");
  return "#" + r + g + b;
}

// ─── sRGB ↔ Linear RGB ──────────────────────────────────────────────

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return s * 255;
}

export function rgbToLinear(rgb: RGB): [number, number, number] {
  return [srgbToLinear(rgb.r), srgbToLinear(rgb.g), srgbToLinear(rgb.b)];
}

export function linearToRgb(linear: [number, number, number]): RGB {
  return {
    r: linearToSrgb(linear[0]),
    g: linearToSrgb(linear[1]),
    b: linearToSrgb(linear[2]),
  };
}

// ─── Linear RGB ↔ Oklab ─────────────────────────────────────────────
// Using the direct sRGB→Oklab matrix (Björn Ottosson's optimized path)
// Skips XYZ intermediate for accuracy and speed

export function linearRgbToOklab(r: number, g: number, b: number): Oklab {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

export function oklabToLinearRgb(lab: Oklab): [number, number, number] {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.2914855480 * lab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return [r, g, b];
}

// ─── Oklab ↔ OKLCH (polar conversion) ────────────────────────────────

export function oklabToOklch(lab: Oklab): OKLCH {
  const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let H = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L: lab.L, C, H };
}

export function oklchToOklab(lch: OKLCH): Oklab {
  const hRad = (lch.H * Math.PI) / 180;
  return {
    L: lch.L,
    a: lch.C * Math.cos(hRad),
    b: lch.C * Math.sin(hRad),
  };
}

// ─── Full Pipeline Shortcuts ─────────────────────────────────────────

export function hexToOklch(hex: string): OKLCH {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgbToLinear(rgb);
  const lab = linearRgbToOklab(r, g, b);
  return oklabToOklch(lab);
}

export function oklchToHex(lch: OKLCH): string {
  const clamped = gamutClamp(lch);
  const lab = oklchToOklab(clamped);
  const [r, g, b] = oklabToLinearRgb(lab);
  return rgbToHex(linearToRgb([r, g, b]));
}

// ─── Gamut Clamping ──────────────────────────────────────────────────
// OKLCH can represent colors outside sRGB. Reduce chroma until in-gamut.

function isInGamut(r: number, g: number, b: number): boolean {
  const EPS = 0.001;
  return r >= -EPS && r <= 1 + EPS && g >= -EPS && g <= 1 + EPS && b >= -EPS && b <= 1 + EPS;
}

export function gamutClamp(lch: OKLCH): OKLCH {
  // Fast path: achromatic or already in gamut
  if (lch.C <= 0) return { L: Math.max(0, Math.min(1, lch.L)), C: 0, H: lch.H };

  const lab = oklchToOklab(lch);
  const [r, g, b] = oklabToLinearRgb(lab);
  if (isInGamut(r, g, b)) return lch;

  // Binary search: reduce chroma until in-gamut
  let lo = 0;
  let hi = lch.C;
  let mid = hi;

  for (let i = 0; i < 25; i++) {
    mid = (lo + hi) / 2;
    const testLab = oklchToOklab({ L: lch.L, C: mid, H: lch.H });
    const [tr, tg, tb] = oklabToLinearRgb(testLab);
    if (isInGamut(tr, tg, tb)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return { L: Math.max(0, Math.min(1, lch.L)), C: lo, H: lch.H };
}

export function clampOklch(lch: OKLCH): OKLCH {
  return {
    L: Math.max(0, Math.min(1, lch.L)),
    C: Math.max(0, lch.C),
    H: ((lch.H % 360) + 360) % 360,
  };
}

// ─── WCAG Luminance & Contrast (sRGB-based per spec) ─────────────────

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgbToLinear(rgb);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAA(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 4.5;
}

export function meetsWcagAALarge(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 3.0;
}

// ─── APCA Contrast (APCA-W3 0.0.98G-4g — Myndex Research) ───────────

// Applies APCA black soft-clamp on top of WCAG2 luminance.
// Prevents over-estimation of contrast for very dark colors.
function apcaLuminance(hex: string): number {
  const Y = relativeLuminance(hex);
  const blkThrs = 0.022, blkClmp = 1.414;
  return Y < blkThrs ? Y + (blkThrs - Y) ** blkClmp : Y;
}

/**
 * Compute APCA Lc (perceptual contrast) between foreground and background.
 * Returns a signed Lc value: positive = light bg / dark text (BoW),
 * negative = dark bg / light text (WoB). Use Math.abs() for threshold checks.
 *
 * Typical thresholds (absolute Lc):
 *   ≥ 75 — body text
 *   ≥ 60 — large / headline text
 *   ≥ 45 — UI components, icons
 */
export function apcaContrast(foreground: string, background: string): number {
  const Ytxt = apcaLuminance(foreground);
  const Ybg  = apcaLuminance(background);

  const deltaYmin = 0.0005;
  if (Math.abs(Ybg - Ytxt) < deltaYmin) return 0.0;

  // Asymmetric exponents — the core APCA innovation
  const scale = 1.14, loClip = 0.1, offset = 0.027;
  let Sapc: number;
  if (Ybg >= Ytxt) {
    Sapc = (Ybg ** 0.56 - Ytxt ** 0.57) * scale; // BoW (light bg)
  } else {
    Sapc = (Ybg ** 0.65 - Ytxt ** 0.62) * scale; // WoB (dark bg)
  }

  if (Math.abs(Sapc) < loClip) return 0.0;
  return Sapc > 0 ? (Sapc - offset) * 100 : (Sapc + offset) * 100;
}

/**
 * Returns true if the absolute APCA Lc value meets or exceeds `minLc`.
 * @param minLc — 45 (UI), 60 (large text), 75 (body text)
 */
export function meetsAPCA(foreground: string, background: string, minLc: number): boolean {
  return Math.abs(apcaContrast(foreground, background)) >= minLc;
}

// ─── Color Manipulation (OKLCH space) ────────────────────────────────

export function darken(hex: string, amount: number): string {
  const lch = hexToOklch(hex);
  return oklchToHex(clampOklch({ ...lch, L: lch.L - amount }));
}

export function lighten(hex: string, amount: number): string {
  const lch = hexToOklch(hex);
  return oklchToHex(clampOklch({ ...lch, L: lch.L + amount }));
}

export function desaturate(hex: string, factor: number): string {
  const lch = hexToOklch(hex);
  return oklchToHex(clampOklch({ ...lch, C: lch.C * factor }));
}

export function adjustHue(hex: string, degrees: number): string {
  const lch = hexToOklch(hex);
  return oklchToHex(clampOklch({ ...lch, H: lch.H + degrees }));
}

export function setLightness(hex: string, L: number): string {
  const lch = hexToOklch(hex);
  return oklchToHex(clampOklch({ ...lch, L }));
}

export function setChroma(hex: string, C: number): string {
  const lch = hexToOklch(hex);
  return oklchToHex(clampOklch({ ...lch, C }));
}

/**
 * Mix two colors in OKLCH space. ratio=0 returns color1, ratio=1 returns color2.
 * Hue is interpolated along the shortest arc.
 */
export function mix(hex1: string, hex2: string, ratio: number): string {
  const lch1 = hexToOklch(hex1);
  const lch2 = hexToOklch(hex2);

  const L = lch1.L + (lch2.L - lch1.L) * ratio;
  const C = lch1.C + (lch2.C - lch1.C) * ratio;

  // Shortest-arc hue interpolation
  let dH = lch2.H - lch1.H;
  if (dH > 180) dH -= 360;
  if (dH < -180) dH += 360;
  const H = lch1.H + dH * ratio;

  return oklchToHex(clampOklch({ L, C, H }));
}
