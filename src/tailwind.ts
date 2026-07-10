import type { GeneratedTheme, GeneratedThemeMode } from "./types.js";

// ─── Public Types ────────────────────────────────────────────────────

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
  /** Font-size scale as static `px` strings. */
  fontSize: Record<string, string>;
};

export type TailwindConfigResult = {
  /**
   * Ready to spread into `tailwind.config.js` → `theme.extend`.
   * Color values are CSS var() references; spacing/radius/fontSize are
   * static pixel strings (mode-independent).
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
 * Spacing, border-radius, and font-size are static `px` strings (they are
 * mode-independent in the salt theme system).
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
  // Static scales come from light mode (same values in both modes)
  const mode: GeneratedThemeMode = theme.light;

  // ── Colors ──────────────────────────────────────────────────────
  const colors: Record<string, string> = {};

  // Semantic colors (23)
  for (const key of Object.keys(mode.colors)) {
    colors[`salt-${camelToKebab(key)}`] = ref(`${P}-color-${camelToKebab(key)}`);
  }

  // Tonal palettes (8 × 11)
  for (const pk of Object.keys(mode.palettes)) {
    const palette = mode.palettes[pk as keyof typeof mode.palettes];
    for (const step of Object.keys(palette)) {
      colors[`salt-palette-${pk}-${step}`] = ref(`${P}-palette-${pk}-${step}`);
    }
  }

  // Surface elevations (4)
  for (const key of Object.keys(mode.surfaceElevation)) {
    colors[`salt-surface-${key}`] = ref(`${P}-surface-${key}`);
  }

  // State colors (8 × 4)
  for (const [intent, states] of Object.entries(mode.states)) {
    for (const state of Object.keys(states as Record<string, string>)) {
      colors[`salt-state-${intent}-${state}`] = ref(`${P}-state-${intent}-${state}`);
    }
  }

  // ── Spacing ─────────────────────────────────────────────────────
  const spacing: Record<string, string> = {};
  for (const [key, val] of Object.entries(mode.spacing) as [string, number][]) {
    spacing[`salt-${key}`] = `${val}px`;
  }

  // ── Border Radius ────────────────────────────────────────────────
  const borderRadius: Record<string, string> = {};
  for (const [key, val] of Object.entries(mode.radius) as [string, number][]) {
    borderRadius[`salt-${key}`] = `${val}px`;
  }

  // ── Font Size ────────────────────────────────────────────────────
  const fontSize: Record<string, string> = {};
  for (const [key, val] of Object.entries(mode.fontSizes) as [string, number][]) {
    fontSize[`salt-${key}`] = `${val}px`;
  }

  const extend: TailwindThemeExtend = { colors, spacing, borderRadius, fontSize };
  return { extend, json: JSON.stringify(extend, null, 2) };
}
