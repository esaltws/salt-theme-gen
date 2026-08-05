import type { FontScaleName, SemanticFontSizes, LineHeightScale, FontWeightScale, LetterSpacingScale } from "./types.js";

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

export function computeSemanticFontSizes(baseFont: number, ratio: number): SemanticFontSizes {
  const s = (n: number) => Math.round(baseFont * Math.pow(ratio, n) * 100) / 100;
  return {
    caption:     s(-2),
    "body-sm":   s(-1),
    body:        s(0),
    "body-lg":   s(1),
    subheading:  s(2),
    "heading-3": s(3),
    "heading-2": s(4),
    "heading-1": s(5),
    display:     s(6),
  };
}

export function resolveFontScale(scale: FontScaleName | number | undefined): number {
  if (scale === undefined) return FONT_SCALE_RATIOS["major-third"];
  if (typeof scale === "number") return scale;
  return FONT_SCALE_RATIOS[scale] ?? FONT_SCALE_RATIOS["major-third"];
}
