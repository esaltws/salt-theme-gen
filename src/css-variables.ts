import { hexToOklch } from "./color-math.js";
import type { GeneratedTheme, GeneratedThemeColors, GeneratedThemeTokens, TypographyStyle } from "./types.js";

// ─── Public Types ────────────────────────────────────────────────────

export type CssFormat = "hex" | "oklch" | "both";

export type CssVariablesOptions = {
  format?: CssFormat;
  lightSelector?: string;
  darkSelector?: string;
  /**
   * CSS custom property prefix (without leading `--`).
   * Defaults to `"salt"` → `--salt-color-primary`, `--salt-spacing-md`, etc.
   * Override to namespace tokens under your own design system prefix,
   * e.g. `"web"` → `--web-color-primary`, `"acme"` → `--acme-color-primary`.
   *
   * Typography utility classes (`.salt-caption` etc.) are also renamed to
   * match the prefix.
   *
   * @default "salt"
   */
  prefix?: string;
  /**
   * When true, titleSmall / titleMedium / titleLarge / display font-size vars
   * are emitted as viewport-responsive `clamp()` values instead of static rem.
   * The minimum is floored at `baseFont` so headings never shrink below body text.
   *
   * Default: **false** — static rem output keeps the theme deterministic across
   * CSS, JS, DTCG, Tailwind, and React Native outputs.
   */
  fluidTypography?: boolean;
};

export type CssVariablesResult = {
  /** Full ready-to-use CSS with both selectors (+ @supports block for "both" format). */
  css: string;
  /** Light-mode declarations only — no selector wrapper, for custom injection. */
  light: string;
  /** Dark-mode declarations only — no selector wrapper, for custom injection. */
  dark: string;
  /** Typography utility classes (.{prefix}-caption, .{prefix}-body-medium, etc.) that reference the CSS vars. */
  classes: string;
};

// ─── Constants ───────────────────────────────────────────────────────

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

function colorDecls(colors: GeneratedThemeColors, format: Exclude<CssFormat, "both">, p: string): string[] {
  const out: string[] = [];
  for (const [key, hex] of Object.entries(colors.colors) as [string, string][]) {
    const value = format === "oklch" ? oklchCss(hex) : hex;
    out.push(`${p}-color-${camelToKebab(key)}: ${value};`);
  }
  return out;
}

function extraColorDecls(colors: GeneratedThemeColors, format: Exclude<CssFormat, "both">, p: string): string[] {
  const out: string[] = [];
  const cv = (hex: string) => (format === "oklch" ? oklchCss(hex) : hex);

  for (const [pk, palette] of Object.entries(colors.palettes)) {
    for (const [step, hex] of Object.entries(palette as Record<string, string>)) {
      out.push(`${p}-palette-${pk}-${step}: ${cv(hex)};`);
    }
  }

  for (const [key, hex] of Object.entries(colors.surfaceElevation) as [string, string][]) {
    out.push(`${p}-surface-${key}: ${cv(hex)};`);
  }

  for (const [intent, states] of Object.entries(colors.states)) {
    for (const [state, hex] of Object.entries(states as Record<string, string>)) {
      out.push(`${p}-state-${intent}-${state}: ${cv(hex)};`);
    }
  }

  return out;
}

function rem(val: number): string {
  return val === 0 ? "0" : `${+(val / 16).toFixed(4)}rem`;
}

function fluidRem(maxPx: number, baseFont: number, minViewport = 320, maxViewport = 1280): string {
  const minPx = Math.max(maxPx * 0.65, baseFont);
  const slope = (maxPx - minPx) / (maxViewport - minViewport);
  const intercept = minPx - slope * minViewport;
  return `clamp(${rem(minPx)}, ${(slope * 100).toFixed(4)}vw + ${intercept.toFixed(4)}px, ${rem(maxPx)})`;
}

function dimensionDecls(tokens: GeneratedThemeTokens, fluid: boolean, p: string): string[] {
  const out: string[] = [];

  for (const [key, val] of Object.entries(tokens.spacing) as [string, number][]) {
    out.push(`${p}-spacing-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(tokens.radius) as [string, number][]) {
    out.push(`${p}-radius-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(tokens.fontSizes) as [string, number][]) {
    out.push(`${p}-font-size-${key}: ${rem(val)};`);
  }
  out.push(`${p}-font-base: ${rem(tokens.baseFont)};`);
  for (const [key, val] of Object.entries(tokens.iconSizes) as [string, number][]) {
    out.push(`${p}-icon-size-${key}: ${rem(val)};`);
  }
  for (const [key, val] of Object.entries(tokens.icons) as [string, number][]) {
    out.push(`${p}-icon-${key}: ${rem(val)};`);
  }
  for (const [key, val] of Object.entries(tokens.controlSizes) as [string, number][]) {
    out.push(`${p}-control-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(tokens.touchTargets) as [string, number][]) {
    out.push(`${p}-touch-target-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(tokens.borderWidths) as [string, number][]) {
    out.push(`${p}-border-width-${key}: ${val === 0 ? "0" : `${val}px`};`);
  }
  for (const [key, val] of Object.entries(tokens.avatarSizes) as [string, number][]) {
    out.push(`${p}-avatar-${key}: ${val}px;`);
  }
  for (const [key, val] of Object.entries(tokens.breakpoints) as [string, number][]) {
    out.push(`${p}-breakpoint-${key}: ${val}px;`);
  }

  const FLUID_TYPE_KEYS = new Set(["titleSmall", "titleMedium", "titleLarge", "display"]);
  for (const [key, style] of Object.entries(tokens.typography) as [string, TypographyStyle][]) {
    const kebab = camelToKebab(key);
    const sizeVal = fluid && FLUID_TYPE_KEYS.has(key)
      ? fluidRem(style.fontSize, tokens.baseFont)
      : rem(style.fontSize);
    const globalFamilyVar = SANS_TYPE_KEYS.has(key) ? `${p}-font-family-sans` : `${p}-font-family-display`;
    out.push(`${p}-type-${kebab}-size: ${sizeVal};`);
    out.push(`${p}-type-${kebab}-line-height: ${style.lineHeight};`);
    out.push(`${p}-type-${kebab}-weight: ${style.fontWeight};`);
    out.push(`${p}-type-${kebab}-letter-spacing: ${style.letterSpacing === 0 ? "0" : `${style.letterSpacing}em`};`);
    out.push(`${p}-type-${kebab}-family: var(${p}-font-family-${SANS_TYPE_KEYS.has(key) ? "sans" : "display"});`);
  }

  const sansFamily = tokens.fontFamilySans ?? DEFAULT_SANS_FAMILY;
  out.push(`${p}-font-family-sans: ${sansFamily};`);
  out.push(`${p}-font-family-display: ${tokens.fontFamilyDisplay ?? sansFamily};`);

  for (const [key, val] of Object.entries(tokens.lineHeights) as [string, number][]) {
    out.push(`${p}-line-height-${key}: ${val};`);
  }
  for (const [key, val] of Object.entries(tokens.fontWeights) as [string, number][]) {
    out.push(`${p}-font-weight-${key}: ${val};`);
  }
  for (const [key, val] of Object.entries(tokens.letterSpacings) as [string, number][]) {
    out.push(`${p}-letter-spacing-${key}: ${val === 0 ? "0" : `${val}em`};`);
  }

  return out;
}

// ─── Typography Classes ───────────────────────────────────────────────

function buildTypographyClasses(p: string): string {
  return TYPOGRAPHY_CLASS_KEYS.map((key) => {
    const kebab = camelToKebab(key);
    return [
      `.${p.slice(2)}-${kebab} {`,
      `  font-size: var(${p}-type-${kebab}-size);`,
      `  line-height: var(${p}-type-${kebab}-line-height);`,
      `  font-weight: var(${p}-type-${kebab}-weight);`,
      `  letter-spacing: var(${p}-type-${kebab}-letter-spacing);`,
      `  font-family: var(${p}-type-${kebab}-family);`,
      `}`,
    ].join("\n");
  }).join("\n\n");
}

// ─── Block Composers ─────────────────────────────────────────────────

function block(selector: string, decls: string[]): string {
  return `${selector} {\n${decls.map((d) => `  ${d}`).join("\n")}\n}`;
}

function nestedBlock(selector: string, decls: string[]): string {
  return `  ${selector} {\n${decls.map((d) => `    ${d}`).join("\n")}\n  }`;
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Serialize a generated theme as CSS custom properties.
 *
 * @param options.prefix - CSS custom property prefix without leading `--`.
 *   Defaults to `"salt"` → `--salt-color-primary`. Override for white-labeling
 *   or to avoid naming conflicts when multiple token layers coexist on a page,
 *   e.g. `"web"` → `--web-color-primary`.
 *
 * @example
 * // Default — hex colors, :root / [data-theme='dark'] selectors
 * const { css } = generateCssVariables(theme);
 *
 * @example
 * // oklch with hex fallback for older browsers
 * const { css } = generateCssVariables(theme, { format: "both" });
 *
 * @example
 * // Custom prefix — white-label or separate token layers
 * const { css } = generateCssVariables(theme, { prefix: "web" });
 * // emits --web-color-primary, --web-spacing-md, etc.
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
  const format     = options?.format          ?? "hex";
  const lightSel   = options?.lightSelector   ?? ":root";
  const darkSel    = options?.darkSelector    ?? "[data-theme='dark']";
  const fluid      = options?.fluidTypography ?? false;
  const prefix     = options?.prefix          ?? "salt";
  const p          = `--${prefix}`;
  const baseFormat = format === "both" ? "hex" : format;

  const lightColors = colorDecls(theme.light, baseFormat, p);
  const lightExtras = extraColorDecls(theme.light, baseFormat, p);
  const darkColors  = colorDecls(theme.dark,  baseFormat, p);
  const darkExtras  = extraColorDecls(theme.dark,  baseFormat, p);
  const tokenDecls  = dimensionDecls(theme.tokens, fluid, p);

  const lightAll = [...lightColors, ...lightExtras, ...tokenDecls];
  const darkAll  = [...darkColors,  ...darkExtras];

  const light = lightAll.map((d) => `  ${d}`).join("\n");
  const dark  = darkAll.map((d)  => `  ${d}`).join("\n");

  let css: string;

  if (format === "both") {
    const lightOklch = [...colorDecls(theme.light, "oklch", p), ...extraColorDecls(theme.light, "oklch", p)];
    const darkOklch  = [...colorDecls(theme.dark,  "oklch", p), ...extraColorDecls(theme.dark,  "oklch", p)];

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

  return { css, light, dark, classes: buildTypographyClasses(p) };
}
