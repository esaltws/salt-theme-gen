import type { FontScaleName, FontSizeScale, TypographyScale, LineHeightScale, FontWeightScale, LetterSpacingScale } from "./types.js";

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
  /** Which fontSizes key drives this style's fontSize. "display" uses 3xl × 1.25. */
  sizeKey: keyof FontSizeScale | "display";
  lineHeight: number;
  fontWeight: 400 | 500 | 600 | 700;
  letterSpacing: number;
};

const TYPOGRAPHY_DEFAULTS: Record<keyof TypographyScale, TypographyDefaults> = {
  caption:     { sizeKey: "xs",      lineHeight: 1.5,   fontWeight: 400, letterSpacing: 0.04  },
  labelSmall:  { sizeKey: "xs",      lineHeight: 1.25,  fontWeight: 500, letterSpacing: 0.01  },
  labelMedium: { sizeKey: "sm",      lineHeight: 1.25,  fontWeight: 500, letterSpacing: 0     },
  bodySmall:   { sizeKey: "sm",      lineHeight: 1.5,   fontWeight: 400, letterSpacing: 0     },
  bodyMedium:  { sizeKey: "md",      lineHeight: 1.5,   fontWeight: 400, letterSpacing: 0     },
  bodyLarge:   { sizeKey: "lg",      lineHeight: 1.625, fontWeight: 400, letterSpacing: 0     },
  titleSmall:  { sizeKey: "xl",      lineHeight: 1.375, fontWeight: 600, letterSpacing: 0     },
  titleMedium: { sizeKey: "xxl",     lineHeight: 1.25,  fontWeight: 600, letterSpacing: -0.01 },
  titleLarge:  { sizeKey: "3xl",     lineHeight: 1.2,   fontWeight: 700, letterSpacing: -0.02 },
  display:     { sizeKey: "display", lineHeight: 1.1,   fontWeight: 700, letterSpacing: -0.03 },
};

const SANS_TYPOGRAPHY_KEYS = new Set(["caption", "labelSmall", "labelMedium", "bodySmall", "bodyMedium", "bodyLarge"]);

/**
 * Derive the full typography scale from the resolved fontSizes scale.
 * fontSizes is the single source of truth — every style's fontSize maps to a fontSizes key.
 * display uses Math.round(fontSizes["3xl"] × 1.25) since it exceeds the t-shirt scale.
 */
export function computeTypographyScale(
  fontSizes: FontSizeScale,
  fontFamily?: { sans?: string; display?: string }
): TypographyScale {
  const displaySize = Math.round(fontSizes["3xl"] * 1.25);
  const out = {} as TypographyScale;
  for (const [key, d] of Object.entries(TYPOGRAPHY_DEFAULTS) as [keyof TypographyScale, TypographyDefaults][]) {
    const fontSize = d.sizeKey === "display" ? displaySize : fontSizes[d.sizeKey];
    const family = SANS_TYPOGRAPHY_KEYS.has(key) ? fontFamily?.sans : fontFamily?.display;
    out[key] = {
      fontSize,
      lineHeight: d.lineHeight,
      fontWeight: d.fontWeight,
      letterSpacing: d.letterSpacing,
      ...(family && { fontFamily: family }),
    };
  }
  return out;
}

// Hand-tuned font size table for baseFont 8–18.
// Used when only baseFont is provided (no fontScale).
const FONT_SIZE_TABLE: Record<number, FontSizeScale> = {
   8: { xs:  6, sm:  7, md:  8, lg:  9, xl: 10, xxl: 12, "3xl": 16 },
   9: { xs:  7, sm:  8, md:  9, lg: 10, xl: 11, xxl: 14, "3xl": 18 },
  10: { xs:  8, sm:  9, md: 10, lg: 11, xl: 13, xxl: 15, "3xl": 20 },
  11: { xs:  9, sm: 10, md: 11, lg: 12, xl: 14, xxl: 17, "3xl": 22 },
  12: { xs:  9, sm: 11, md: 12, lg: 14, xl: 15, xxl: 18, "3xl": 24 },
  13: { xs: 10, sm: 12, md: 13, lg: 15, xl: 16, xxl: 20, "3xl": 26 },
  14: { xs: 11, sm: 12, md: 14, lg: 16, xl: 18, xxl: 21, "3xl": 28 },
  15: { xs: 12, sm: 13, md: 15, lg: 17, xl: 19, xxl: 23, "3xl": 30 },
  16: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, "3xl": 32 },
  17: { xs: 13, sm: 15, md: 17, lg: 19, xl: 21, xxl: 26, "3xl": 34 },
  18: { xs: 14, sm: 16, md: 18, lg: 20, xl: 22, xxl: 27, "3xl": 36 },
};

/**
 * Return the hand-tuned font size scale for a given baseFont.
 * Falls back to modular scaling (major-third ratio) for values outside 8–18.
 */
export function lookupFontSizes(baseFont: number): FontSizeScale {
  const row = FONT_SIZE_TABLE[Math.round(baseFont)];
  return row ?? computeModularFontSizes(baseFont, 1.25);
}

/**
 * Compute a modular fontSizes scale from a base size and ratio.
 * Used when the caller explicitly opts into modular scaling via fontScale.
 * bodyMedium (step 0) equals baseFont exactly.
 */
export function computeModularFontSizes(baseFont: number, ratio: number): FontSizeScale {
  const size = (step: number) => Math.round(baseFont * Math.pow(ratio, step) * 2) / 2;
  return {
    xs:    size(-2),
    sm:    size(-1),
    md:    size(0),
    lg:    size(1),
    xl:    size(2),
    xxl:   size(3),
    "3xl": size(4),
  };
}

/**
 * Validate a numeric fontScale ratio. Throws RangeError for values that
 * produce broken or degenerate font scales (≤ 1 collapses the scale;
 * > 2 produces jumps too large to be usable).
 */
export function assertFontScale(value: number): number {
  if (!Number.isFinite(value) || value <= 1 || value > 2) {
    throw new RangeError(
      "fontScale must be a finite number greater than 1 and no greater than 2.",
    );
  }
  return value;
}

export function resolveFontScale(scale: FontScaleName | number | undefined): number {
  if (scale === undefined) return FONT_SCALE_RATIOS["major-third"];
  if (typeof scale === "number") return assertFontScale(scale);
  return FONT_SCALE_RATIOS[scale] ?? FONT_SCALE_RATIOS["major-third"];
}
