import type { FontScaleName, TypographyScale, LineHeightScale, FontWeightScale, LetterSpacingScale } from "./types.js";

export const FONT_SCALE_RATIOS: Record<FontScaleName, number> = {
  "minor-second":     1.067,
  "major-second":     1.125,
  "minor-third":      1.200,
  "major-third":      1.250,
  "perfect-fourth":   1.333,
  "augmented-fourth": 1.414,
  "perfect-fifth":    1.500,
  "golden-ratio":     1.618,
};

export const DEFAULT_LINE_HEIGHTS: LineHeightScale = {
  none:    1,
  tight:   1.25,
  snug:    1.375,
  normal:  1.5,
  relaxed: 1.625,
  loose:   2,
};

export const DEFAULT_FONT_WEIGHTS: FontWeightScale = {
  light:     300,
  regular:   400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,
};

export const DEFAULT_LETTER_SPACINGS: LetterSpacingScale = {
  tight:   -0.04,
  normal:  0,
  wide:    0.025,
  wider:   0.05,
  widest:  0.1,
};

type TypographyDefaults = {
  step: number;
  lineHeight: number;
  fontWeight: 400 | 500 | 600 | 700;
  letterSpacing: number;
};

const TYPOGRAPHY_DEFAULTS: Record<keyof TypographyScale, TypographyDefaults> = {
  caption:     { step: -2, lineHeight: 1.5,   fontWeight: 400, letterSpacing: 0.04  },
  labelSmall:  { step: -1, lineHeight: 1.25,  fontWeight: 500, letterSpacing: 0.01  },
  labelMedium: { step:  0, lineHeight: 1.25,  fontWeight: 500, letterSpacing: 0     },
  bodySmall:   { step: -1, lineHeight: 1.5,   fontWeight: 400, letterSpacing: 0     },
  bodyMedium:  { step:  0, lineHeight: 1.5,   fontWeight: 400, letterSpacing: 0     },
  bodyLarge:   { step:  1, lineHeight: 1.625, fontWeight: 400, letterSpacing: 0     },
  titleSmall:  { step:  2, lineHeight: 1.375, fontWeight: 600, letterSpacing: 0     },
  titleMedium: { step:  3, lineHeight: 1.25,  fontWeight: 600, letterSpacing: -0.01 },
  titleLarge:  { step:  4, lineHeight: 1.2,   fontWeight: 700, letterSpacing: -0.02 },
  display:     { step:  5, lineHeight: 1.1,   fontWeight: 700, letterSpacing: -0.03 },
};

const SANS_TYPOGRAPHY_KEYS = new Set(["caption", "labelSmall", "labelMedium", "bodySmall", "bodyMedium", "bodyLarge"]);

export function computeTypographyScale(
  baseFont: number,
  ratio: number,
  fontFamily?: { sans?: string; display?: string }
): TypographyScale {
  const size = (step: number) => Math.round(baseFont * Math.pow(ratio, step) * 2) / 2;
  const out = {} as TypographyScale;
  for (const [key, d] of Object.entries(TYPOGRAPHY_DEFAULTS) as [keyof TypographyScale, TypographyDefaults][]) {
    const family = SANS_TYPOGRAPHY_KEYS.has(key) ? fontFamily?.sans : fontFamily?.display;
    out[key] = {
      fontSize: size(d.step),
      lineHeight: d.lineHeight,
      fontWeight: d.fontWeight,
      letterSpacing: d.letterSpacing,
      ...(family && { fontFamily: family }),
    };
  }
  return out;
}

export function resolveFontScale(scale: FontScaleName | number | undefined): number {
  if (scale === undefined) return FONT_SCALE_RATIOS["major-third"];
  if (typeof scale === "number") return scale;
  return FONT_SCALE_RATIOS[scale] ?? FONT_SCALE_RATIOS["major-third"];
}
