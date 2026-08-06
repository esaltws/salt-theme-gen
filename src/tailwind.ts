import type { GeneratedTheme, GeneratedThemeColors, TypographyStyle } from "./types.js";

// ─── Public Types ────────────────────────────────────────────────────

/** Tailwind v3 font-size tuple: [size, { lineHeight, fontWeight, letterSpacing }] */
export type TailwindTypographyTuple = [string, { lineHeight: string; fontWeight: string; letterSpacing: string }];

export type TailwindThemeExtend = {
  /**
   * All color tokens as CSS `var()` references.
   * Requires `generateCssVariables(theme)` to inject the matching custom properties.
   * Works with Tailwind's light/dark switching via CSS variable values.
   */
  colors: Record<string, string>;
  /** Spacing scale as static `px` strings. */
  spacing: Record<string, string>;
  /** Border-radius scale as static `px` strings. */
  borderRadius: Record<string, string>;
  /**
   * Font-size t-shirt scale as static `px` strings (salt-xs … salt-3xl).
   * Semantic typography tokens (salt-body-medium, salt-title-large, etc.) are
   * emitted as Tailwind v3 tuples: `[remSize, { lineHeight, fontWeight, letterSpacing }]`.
   */
  fontSize: Record<string, string | TailwindTypographyTuple>;
  /** Responsive breakpoints as static `px` strings (maps to Tailwind `screens`). */
  screens: Record<string, string>;
  /** Border-width scale as static `px` strings. */
  borderWidth: Record<string, string>;
  /** Font-weight scale as static numeric strings. */
  fontWeight: Record<string, string>;
  /** Line-height scale as static unitless strings. */
  lineHeight: Record<string, string>;
  /** Letter-spacing scale as static `em` strings. */
  letterSpacing: Record<string, string>;
  /** Icon sizes, control sizes, avatar sizes, and touch target sizes as static `px` strings. */
  width: Record<string, string>;
  /** Same as width — icon sizes, control sizes, avatar sizes, and touch target sizes. */
  height: Record<string, string>;
  /** Touch target minimum constraints as static `px` strings. */
  minWidth: Record<string, string>;
  /** Touch target minimum constraints as static `px` strings. */
  minHeight: Record<string, string>;
  /** Font family aliases (sans and display). Only populated when fontFamily is configured. */
  fontFamily: Record<string, string[]>;
};

export type TailwindConfigResult = {
  /**
   * Ready to spread into `tailwind.config.js` → `theme.extend`.
   * Color values are CSS var() references; all other values are static strings.
   */
  extend: TailwindThemeExtend;
  /** JSON string of `extend` — useful for writing to a config file. */
  json: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────

const P = "--salt";

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

function ref(varName: string): string {
  return `var(${varName})`;
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Generate a Tailwind CSS `theme.extend` configuration from a salt theme.
 *
 * Color values are CSS `var()` references — pair with `generateCssVariables`
 * to inject the matching `--salt-*` custom properties so that Tailwind's dark
 * mode switching works automatically via the CSS variable values.
 *
 * All other values (spacing, radius, fontSizes, breakpoints, etc.) are static
 * strings (mode-independent in the salt theme system).
 *
 * @example
 * // tailwind.config.js
 * const { generateTheme, generateTailwindConfig } = require("salt-theme-gen");
 * const theme = generateTheme({ primary: "#0E9D8E" });
 * const { extend } = generateTailwindConfig(theme);
 *
 * module.exports = {
 *   darkMode: ["class", "[data-theme='dark']"],
 *   theme: { extend },
 * };
 */
export function generateTailwindConfig(theme: GeneratedTheme): TailwindConfigResult {
  // Colors come from light mode (same semantic structure in both modes)
  const colorMode: GeneratedThemeColors = theme.light;

  // ── Colors ──────────────────────────────────────────────────────
  const colors: Record<string, string> = {};

  // Semantic colors
  for (const key of Object.keys(colorMode.colors)) {
    colors[`salt-${camelToKebab(key)}`] = ref(`${P}-color-${camelToKebab(key)}`);
  }

  // Tonal palettes (8 × 11)
  for (const pk of Object.keys(colorMode.palettes)) {
    const palette = colorMode.palettes[pk as keyof typeof colorMode.palettes];
    for (const step of Object.keys(palette)) {
      colors[`salt-palette-${pk}-${step}`] = ref(`${P}-palette-${pk}-${step}`);
    }
  }

  // Surface elevations
  for (const key of Object.keys(colorMode.surfaceElevation)) {
    colors[`salt-surface-${key}`] = ref(`${P}-surface-${key}`);
  }

  // State colors (8 × 4)
  for (const [intent, states] of Object.entries(colorMode.states)) {
    for (const state of Object.keys(states as Record<string, string>)) {
      colors[`salt-state-${intent}-${state}`] = ref(`${P}-state-${intent}-${state}`);
    }
  }

  // ── Spacing ─────────────────────────────────────────────────────
  const spacing: Record<string, string> = {};
  for (const [key, val] of Object.entries(theme.tokens.spacing) as [string, number][]) {
    spacing[`salt-${key}`] = `${val}px`;
  }

  // ── Border Radius ────────────────────────────────────────────────
  const borderRadius: Record<string, string> = {};
  for (const [key, val] of Object.entries(theme.tokens.radius) as [string, number][]) {
    borderRadius[`salt-${key}`] = `${val}px`;
  }

  // ── Font Size ────────────────────────────────────────────────────
  const fontSize: Record<string, string | TailwindTypographyTuple> = {};
  // t-shirt scale — simple px strings, consistent with the static token values
  for (const [key, val] of Object.entries(theme.tokens.fontSizes) as [string, number][]) {
    fontSize[`salt-${key}`] = `${val}px`;
  }
  // Semantic typography composites — Tailwind v3 tuple format [remSize, metadata]
  for (const [key, style] of Object.entries(theme.tokens.typography) as [string, TypographyStyle][]) {
    const remSize = style.fontSize === 0 ? "0" : `${+(style.fontSize / 16).toFixed(4)}rem`;
    fontSize[`salt-${camelToKebab(key)}`] = [
      remSize,
      {
        lineHeight:    String(style.lineHeight),
        fontWeight:    String(style.fontWeight),
        letterSpacing: style.letterSpacing === 0 ? "0" : `${style.letterSpacing}em`,
      },
    ];
  }

  // ── Screens (breakpoints) ────────────────────────────────────────
  const screens: Record<string, string> = {};
  for (const [key, val] of Object.entries(theme.tokens.breakpoints) as [string, number][]) {
    screens[`salt-${key}`] = `${val}px`;
  }

  // ── Border Width ─────────────────────────────────────────────────
  const borderWidth: Record<string, string> = {};
  for (const [key, val] of Object.entries(theme.tokens.borderWidths) as [string, number][]) {
    borderWidth[`salt-${key}`] = `${val}px`;
  }

  // ── Font Weight ──────────────────────────────────────────────────
  const fontWeight: Record<string, string> = {};
  for (const [key, val] of Object.entries(theme.tokens.fontWeights) as [string, number][]) {
    fontWeight[`salt-${key}`] = String(val);
  }

  // ── Line Height ──────────────────────────────────────────────────
  const lineHeight: Record<string, string> = {};
  for (const [key, val] of Object.entries(theme.tokens.lineHeights) as [string, number][]) {
    lineHeight[`salt-${key}`] = String(val);
  }

  // ── Letter Spacing ───────────────────────────────────────────────
  const letterSpacing: Record<string, string> = {};
  for (const [key, val] of Object.entries(theme.tokens.letterSpacings) as [string, number][]) {
    letterSpacing[`salt-${key}`] = val === 0 ? "0" : `${val}em`;
  }

  // ── Width / Height / MinWidth / MinHeight ────────────────────────
  const width:    Record<string, string> = {};
  const height:   Record<string, string> = {};
  const minWidth: Record<string, string> = {};
  const minHeight: Record<string, string> = {};

  // Icon sizes (square)
  for (const [key, val] of Object.entries(theme.tokens.iconSizes) as [string, number][]) {
    width[`salt-icon-${key}`]  = `${val}px`;
    height[`salt-icon-${key}`] = `${val}px`;
  }
  // Semantic icon aliases (square)
  for (const [key, val] of Object.entries(theme.tokens.icons) as [string, number][]) {
    width[`salt-icon-${key}`]  = `${val}px`;
    height[`salt-icon-${key}`] = `${val}px`;
  }
  // Control sizes (component row height)
  for (const [key, val] of Object.entries(theme.tokens.controlSizes) as [string, number][]) {
    width[`salt-control-${key}`]  = `${val}px`;
    height[`salt-control-${key}`] = `${val}px`;
  }
  // Avatar sizes (square)
  for (const [key, val] of Object.entries(theme.tokens.avatarSizes) as [string, number][]) {
    width[`salt-avatar-${key}`]  = `${val}px`;
    height[`salt-avatar-${key}`] = `${val}px`;
  }
  // Touch targets → exact w/h AND min-w/min-h (semantic: these are minimums)
  for (const [key, val] of Object.entries(theme.tokens.touchTargets) as [string, number][]) {
    width[`salt-touch-target-${key}`]    = `${val}px`;
    height[`salt-touch-target-${key}`]   = `${val}px`;
    minWidth[`salt-touch-target-${key}`] = `${val}px`;
    minHeight[`salt-touch-target-${key}`] = `${val}px`;
  }

  // ── Font Family ──────────────────────────────────────────────────
  const fontFamily: Record<string, string[]> = {};
  if (theme.tokens.fontFamilySans) {
    fontFamily["salt-sans"] = [theme.tokens.fontFamilySans, "sans-serif"];
  }
  if (theme.tokens.fontFamilyDisplay) {
    fontFamily["salt-display"] = [theme.tokens.fontFamilyDisplay, "serif"];
  }

  const extend: TailwindThemeExtend = {
    colors, spacing, borderRadius, fontSize,
    screens, borderWidth, fontWeight, lineHeight, letterSpacing,
    width, height, minWidth, minHeight, fontFamily,
  };
  return { extend, json: JSON.stringify(extend, null, 2) };
}
