import { hexToOklch } from "./color-math.js";
import type { GeneratedTheme, GeneratedThemeMode } from "./types.js";

// ─── Public Types ────────────────────────────────────────────────────

export type CssFormat = "hex" | "oklch" | "both";

export type CssVariablesOptions = {
  format?: CssFormat;
  lightSelector?: string;
  darkSelector?: string;
};

export type CssVariablesResult = {
  /** Full ready-to-use CSS with both selectors (+ @supports block for "both" format). */
  css: string;
  /** Light-mode declarations only — no selector wrapper, for custom injection. */
  light: string;
  /** Dark-mode declarations only — no selector wrapper, for custom injection. */
  dark: string;
};

// ─── Constants ───────────────────────────────────────────────────────

const P = "--salt";

// ─── Helpers ─────────────────────────────────────────────────────────

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

function oklchCss(hex: string): string {
  const { L, C, H } = hexToOklch(hex);
  return `oklch(${(L * 100).toFixed(2)}% ${C.toFixed(4)} ${H.toFixed(2)})`;
}

// ─── Declaration Builders ────────────────────────────────────────────

function colorDecls(mode: GeneratedThemeMode, format: Exclude<CssFormat, "both">): string[] {
  const out: string[] = [];
  for (const [key, hex] of Object.entries(mode.colors) as [string, string][]) {
    const value = format === "oklch" ? oklchCss(hex) : hex;
    out.push(`${P}-color-${camelToKebab(key)}: ${value};`);
  }
  return out;
}

// Color tokens beyond semanticColors: palettes, surface elevations, state colors.
// These use hex/oklch depending on format and belong in the @supports block.
function extraColorDecls(mode: GeneratedThemeMode, format: Exclude<CssFormat, "both">): string[] {
  const out: string[] = [];
  const cv = (hex: string) => (format === "oklch" ? oklchCss(hex) : hex);

  // Tonal palettes (8 keys × 11 steps)
  for (const [pk, palette] of Object.entries(mode.palettes)) {
    for (const [step, hex] of Object.entries(palette as Record<string, string>)) {
      out.push(`${P}-palette-${pk}-${step}: ${cv(hex)};`);
    }
  }

  // Surface elevation
  for (const [key, hex] of Object.entries(mode.surfaceElevation) as [string, string][]) {
    out.push(`${P}-surface-${key}: ${cv(hex)};`);
  }

  // State colors (8 intents × 4 states)
  for (const [intent, states] of Object.entries(mode.states)) {
    for (const [state, hex] of Object.entries(states as Record<string, string>)) {
      out.push(`${P}-state-${intent}-${state}: ${cv(hex)};`);
    }
  }

  return out;
}

// Dimension tokens: spacing, radius, font sizes, icon sizes, etc.
// These are always px values — format has no effect and they never go in @supports.
function dimensionDecls(mode: GeneratedThemeMode): string[] {
  const out: string[] = [];

  for (const [key, val] of Object.entries(mode.spacing) as [string, number][]) {
    out.push(`${P}-spacing-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(mode.radius) as [string, number][]) {
    out.push(`${P}-radius-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(mode.fontSizes) as [string, number][]) {
    out.push(`${P}-font-size-${key}: ${val}px;`);
  }
  out.push(`${P}-font-level: ${mode.fontLevel}px;`);
  for (const [key, val] of Object.entries(mode.iconSizes) as [string, number][]) {
    out.push(`${P}-icon-size-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(mode.sizeMap) as [string, number][]) {
    out.push(`${P}-size-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(mode.dimensions) as [string, number][]) {
    out.push(`${P}-dimension-${key}: ${val}px;`);
  }

  return out;
}

function nonColorDecls(mode: GeneratedThemeMode, format: Exclude<CssFormat, "both">): string[] {
  return [...extraColorDecls(mode, format), ...dimensionDecls(mode)];
}

// ─── Block Composers ─────────────────────────────────────────────────

function block(selector: string, decls: string[]): string {
  return `${selector} {\n${decls.map((d) => `  ${d}`).join("\n")}\n}`;
}

// Selector block indented for use inside @supports
function nestedBlock(selector: string, decls: string[]): string {
  return `  ${selector} {\n${decls.map((d) => `    ${d}`).join("\n")}\n  }`;
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Serialize a generated theme as CSS custom properties.
 *
 * All variables are prefixed with `--salt` (fixed library namespace).
 *
 * @example
 * // Default — hex colors, :root / [data-theme='dark'] selectors
 * const { css } = generateCssVariables(theme);
 * // <style>{css}</style>
 *
 * @example
 * // oklch with hex fallback for older browsers
 * const { css } = generateCssVariables(theme, { format: "both" });
 *
 * @example
 * // Custom selectors (Tailwind dark mode)
 * const { css } = generateCssVariables(theme, {
 *   lightSelector: ":root",
 *   darkSelector: ".dark",
 * });
 */
export function generateCssVariables(
  theme: GeneratedTheme,
  options?: CssVariablesOptions
): CssVariablesResult {
  const format       = options?.format        ?? "hex";
  const lightSel     = options?.lightSelector ?? ":root";
  const darkSel      = options?.darkSelector  ?? "[data-theme='dark']";
  const baseFormat   = format === "both" ? "hex" : format;

  const lightColors    = colorDecls(theme.light, baseFormat);
  const lightNonColor  = nonColorDecls(theme.light, baseFormat);
  const darkColors     = colorDecls(theme.dark,  baseFormat);
  const darkNonColor   = nonColorDecls(theme.dark,  baseFormat);

  const lightAll = [...lightColors, ...lightNonColor];
  const darkAll  = [...darkColors,  ...darkNonColor];

  // `light` / `dark` return values: indented declaration lines without a selector
  const light = lightAll.map((d) => `  ${d}`).join("\n");
  const dark  = darkAll.map((d)  => `  ${d}`).join("\n");

  let css: string;

  if (format === "both") {
    const lightOklch = [...colorDecls(theme.light, "oklch"), ...extraColorDecls(theme.light, "oklch")];
    const darkOklch  = [...colorDecls(theme.dark,  "oklch"), ...extraColorDecls(theme.dark,  "oklch")];

    const supportsBlock = [
      "@supports (color: oklch(0 0 0)) {",
      nestedBlock(lightSel, lightOklch),
      "",
      nestedBlock(darkSel, darkOklch),
      "}",
    ].join("\n");

    css = [
      block(lightSel, lightAll),
      block(darkSel, darkAll),
      supportsBlock,
    ].join("\n\n");
  } else {
    css = [
      block(lightSel, lightAll),
      block(darkSel, darkAll),
    ].join("\n\n");
  }

  return { css, light, dark };
}
