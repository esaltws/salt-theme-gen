import { hexToOklch } from "./color-math.js";
import type { GeneratedTheme, GeneratedThemeColors, GeneratedThemeTokens, TypographyStyle } from "./types.js";

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
  /** Typography utility classes (.salt-caption, .salt-body-medium, etc.) that reference the CSS vars. */
  classes: string;
};

// ─── Constants ───────────────────────────────────────────────────────

const P = "--salt";

const DEFAULT_SANS_FAMILY = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const SANS_TYPE_KEYS = new Set(["caption", "labelSmall", "labelMedium", "bodySmall", "bodyMedium", "bodyLarge"]);

const TYPOGRAPHY_CLASS_KEYS = [
  "caption", "labelSmall", "labelMedium",
  "bodySmall", "bodyMedium", "bodyLarge",
  "titleSmall", "titleMedium", "titleLarge", "display",
];

// ─── Helpers ─────────────────────────────────────────────────────────

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

function oklchCss(hex: string): string {
  const { L, C, H } = hexToOklch(hex);
  return `oklch(${(L * 100).toFixed(2)}% ${C.toFixed(4)} ${H.toFixed(2)})`;
}

// ─── Declaration Builders ────────────────────────────────────────────

function colorDecls(colors: GeneratedThemeColors, format: Exclude<CssFormat, "both">): string[] {
  const out: string[] = [];
  for (const [key, hex] of Object.entries(colors.colors) as [string, string][]) {
    const value = format === "oklch" ? oklchCss(hex) : hex;
    out.push(`${P}-color-${camelToKebab(key)}: ${value};`);
  }
  return out;
}

// Color tokens beyond semanticColors: palettes, surface elevations, state colors.
// These are per-mode and use hex/oklch depending on format.
function extraColorDecls(colors: GeneratedThemeColors, format: Exclude<CssFormat, "both">): string[] {
  const out: string[] = [];
  const cv = (hex: string) => (format === "oklch" ? oklchCss(hex) : hex);

  // Tonal palettes (8 keys × 11 steps)
  for (const [pk, palette] of Object.entries(colors.palettes)) {
    for (const [step, hex] of Object.entries(palette as Record<string, string>)) {
      out.push(`${P}-palette-${pk}-${step}: ${cv(hex)};`);
    }
  }

  // Surface elevation
  for (const [key, hex] of Object.entries(colors.surfaceElevation) as [string, string][]) {
    out.push(`${P}-surface-${key}: ${cv(hex)};`);
  }

  // State colors (8 intents × 4 states)
  for (const [intent, states] of Object.entries(colors.states)) {
    for (const [state, hex] of Object.entries(states as Record<string, string>)) {
      out.push(`${P}-state-${intent}-${state}: ${cv(hex)};`);
    }
  }

  return out;
}

// Converts a px number to rem (base 16). Zero stays "0".
function rem(val: number): string {
  return val === 0 ? "0" : `${+(val / 16).toFixed(4)}rem`;
}

// Fluid clamp from 65% of maxPx (at 320px viewport) to maxPx (at 1280px viewport)
function fluidRem(maxPx: number): string {
  const minPx = maxPx * 0.65;
  const slope = (maxPx - minPx) / 960;
  const intercept = minPx - slope * 320;
  return `clamp(${rem(minPx)}, ${(slope * 100).toFixed(4)}vw + ${intercept.toFixed(4)}px, ${rem(maxPx)})`;
}

// Dimension tokens — format has no effect, never go in @supports.
// Font sizes and icon sizes → rem (scales with user font preference, WCAG 1.4.4).
// Spacing, radius, size map, dimensions → px (layout values, not text-relative).
// These are mode-agnostic (from theme.tokens) and emitted only under the light selector.
function dimensionDecls(tokens: GeneratedThemeTokens): string[] {
  const out: string[] = [];

  for (const [key, val] of Object.entries(tokens.spacing) as [string, number][]) {
    out.push(`${P}-spacing-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(tokens.radius) as [string, number][]) {
    out.push(`${P}-radius-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(tokens.fontSizes) as [string, number][]) {
    out.push(`${P}-font-size-${key}: ${rem(val)};`);
  }
  out.push(`${P}-font-base: ${rem(tokens.baseFont)};`);
  for (const [key, val] of Object.entries(tokens.iconSizes) as [string, number][]) {
    out.push(`${P}-icon-size-${key}: ${rem(val)};`);
  }
  for (const [key, val] of Object.entries(tokens.icons) as [string, number][]) {
    out.push(`${P}-icon-${key}: ${rem(val)};`);
  }
  for (const [key, val] of Object.entries(tokens.borderWidths) as [string, number][]) {
    out.push(`${P}-border-width-${key}: ${val === 0 ? "0" : `${val}px`};`);
  }
  for (const [key, val] of Object.entries(tokens.avatarSizes) as [string, number][]) {
    out.push(`${P}-avatar-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(tokens.breakpoints) as [string, number][]) {
    out.push(`${P}-breakpoint-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(tokens.sizeMap) as [string, number][]) {
    out.push(`${P}-size-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(tokens.dimensions) as [string, number][]) {
    out.push(`${P}-dimension-${key}: ${val}px;`);
  }

  // Typography composite styles — flat CSS vars per property
  // titleSmall, titleMedium, titleLarge, display use fluid clamp()
  const FLUID_TYPE_KEYS = new Set(["titleSmall", "titleMedium", "titleLarge", "display"]);
  for (const [key, style] of Object.entries(tokens.typography) as [string, TypographyStyle][]) {
    const kebab = camelToKebab(key);
    const sizeVal = FLUID_TYPE_KEYS.has(key) ? fluidRem(style.fontSize) : rem(style.fontSize);
    const globalFamilyVar = SANS_TYPE_KEYS.has(key) ? `${P}-font-family-sans` : `${P}-font-family-display`;
    out.push(`${P}-type-${kebab}-size: ${sizeVal};`);
    out.push(`${P}-type-${kebab}-line-height: ${style.lineHeight};`);
    out.push(`${P}-type-${kebab}-weight: ${style.fontWeight};`);
    out.push(`${P}-type-${kebab}-letter-spacing: ${style.letterSpacing === 0 ? "0" : `${style.letterSpacing}em`};`);
    out.push(`${P}-type-${kebab}-family: var(${globalFamilyVar});`);
  }

  // Global font family — always emitted; defaults to system stack when user provides none
  const sansFamily = tokens.fontFamilySans ?? DEFAULT_SANS_FAMILY;
  out.push(`${P}-font-family-sans: ${sansFamily};`);
  out.push(`${P}-font-family-display: ${tokens.fontFamilyDisplay ?? sansFamily};`);

  // Line heights (unitless)
  for (const [key, val] of Object.entries(tokens.lineHeights) as [string, number][]) {
    out.push(`${P}-line-height-${key}: ${val};`);
  }

  // Font weights
  for (const [key, val] of Object.entries(tokens.fontWeights) as [string, number][]) {
    out.push(`${P}-font-weight-${key}: ${val};`);
  }

  // Letter spacings (em, 0 stays "0")
  for (const [key, val] of Object.entries(tokens.letterSpacings) as [string, number][]) {
    out.push(`${P}-letter-spacing-${key}: ${val === 0 ? "0" : `${val}em`};`);
  }

  return out;
}

// ─── Typography Classes ───────────────────────────────────────────────

function buildTypographyClasses(): string {
  return TYPOGRAPHY_CLASS_KEYS.map((key) => {
    const kebab = camelToKebab(key);
    return [
      `.salt-${kebab} {`,
      `  font-size: var(${P}-type-${kebab}-size);`,
      `  line-height: var(${P}-type-${kebab}-line-height);`,
      `  font-weight: var(${P}-type-${kebab}-weight);`,
      `  letter-spacing: var(${P}-type-${kebab}-letter-spacing);`,
      `  font-family: var(${P}-type-${kebab}-family);`,
      `}`,
    ].join("\n");
  }).join("\n\n");
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

  const lightColors    = colorDecls(theme.light,  baseFormat);
  const lightExtras    = extraColorDecls(theme.light,  baseFormat);
  const darkColors     = colorDecls(theme.dark,   baseFormat);
  const darkExtras     = extraColorDecls(theme.dark,   baseFormat);
  const tokenDecls     = dimensionDecls(theme.tokens);

  // Light selector: all color vars + all mode-agnostic token vars
  const lightAll = [...lightColors, ...lightExtras, ...tokenDecls];
  // Dark selector: only color vars (tokens are mode-agnostic, emit once in light)
  const darkAll  = [...darkColors,  ...darkExtras];

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

  return { css, light, dark, classes: buildTypographyClasses() };
}
