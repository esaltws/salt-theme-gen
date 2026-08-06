import type { TypographyStyle } from "./types.js";

// ─── Public Types ────────────────────────────────────────────────────

export type RNTextStyle = {
  fontSize:      number;
  lineHeight:    number;
  fontWeight:    string;
  letterSpacing: number;
  fontFamily?:   string;
};

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Convert a `TypographyStyle` token to React Native `StyleSheet`-compatible values.
 *
 * `TypographyStyle` stores `lineHeight` as a unitless ratio (e.g. 1.5) and
 * `letterSpacing` as an em decimal (e.g. 0.04). React Native requires both
 * as absolute pixel values. This utility does the conversion so that spreading
 * a token into `<Text style={...}>` produces correct layout.
 *
 * @example
 * const { tokens } = generateTheme({ primary: "#0E9D8E" });
 * const bodyStyle = resolveTextStyle(tokens.typography.bodyMedium);
 * // bodyStyle.lineHeight === 24  (16px × 1.5)
 * // bodyStyle.letterSpacing === 0
 * // bodyStyle.fontWeight === "400"
 */
export function resolveTextStyle(style: TypographyStyle): RNTextStyle {
  const result: RNTextStyle = {
    fontSize:      style.fontSize,
    lineHeight:    Math.round(style.lineHeight    * style.fontSize * 100)  / 100,
    fontWeight:    String(style.fontWeight),
    letterSpacing: Math.round(style.letterSpacing * style.fontSize * 1000) / 1000,
  };
  if (style.fontFamily !== undefined) result.fontFamily = style.fontFamily;
  return result;
}
