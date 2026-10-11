import type { GeneratedTheme, GeneratedThemeColors, GeneratedThemeTokens, TypographyStyle } from "./types.js";
import { buildScssHeader } from "./file-header.js";

// ─── Public types ─────────────────────────────────────────────────────

export type ScssVariablesOptions = {
  /** Custom property prefix without leading `$`. Default: `"salt"` */
  prefix?: string;
  /** Emit tonal palette steps (8 intents × 11 steps per mode). Default: false */
  includePalettes?: boolean;
};

export type ScssVariablesResult = {
  /** Complete .scss file: header + light vars + dark vars + tokens */
  scss: string;
  /** Light-mode color + token declarations only (no header, no dark) */
  light: string;
  /** Dark-mode color declarations only (variables use a `-dark` suffix) */
  dark: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────

const SANS_TYPE_KEYS = new Set([
  "caption", "labelSmall", "labelMedium", "bodySmall", "bodyMedium", "bodyLarge",
]);

const DEFAULT_SANS_FAMILY = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

function rem(px: number): string {
  return px === 0 ? "0" : `${+(px / 16).toFixed(4)}rem`;
}

function bw(px: number): string {
  return px === 0 ? "0" : `${px}px`;
}

// ─── Color declaration builders ───────────────────────────────────────

function buildColorDecls(colors: GeneratedThemeColors, p: string, suffix: string, includePalettes: boolean): string[] {
  const out: string[] = [];

  for (const [key, hex] of Object.entries(colors.colors) as [string, string][]) {
    out.push(`$${p}-color-${camelToKebab(key)}${suffix}: ${hex};`);
  }
  for (const [key, hex] of Object.entries(colors.surfaceElevation) as [string, string][]) {
    out.push(`$${p}-surface-${key}${suffix}: ${hex};`);
  }
  for (const [intent, states] of Object.entries(colors.states)) {
    for (const [state, hex] of Object.entries(states as Record<string, string>)) {
      out.push(`$${p}-state-${intent}-${state}${suffix}: ${hex};`);
    }
  }

  if (includePalettes) {
    for (const [pk, palette] of Object.entries(colors.palettes)) {
      for (const [step, hex] of Object.entries(palette as Record<string, string>)) {
        out.push(`$${p}-palette-${pk}-${step}${suffix}: ${hex};`);
      }
    }
  }

  return out;
}

// ─── Token declaration builder ────────────────────────────────────────

function buildTokenDecls(tokens: GeneratedThemeTokens, p: string): string[] {
  const out: string[] = [];

  for (const [k, v] of Object.entries(tokens.spacing) as [string, number][]) {
    out.push(`$${p}-spacing-${k}: ${v}px;`);
  }
  for (const [k, v] of Object.entries(tokens.radius) as [string, number][]) {
    out.push(`$${p}-radius-${k}: ${v}px;`);
  }
  for (const [k, v] of Object.entries(tokens.fontSizes) as [string, number][]) {
    out.push(`$${p}-font-size-${k}: ${rem(v)};`);
  }
  out.push(`$${p}-font-base: ${rem(tokens.baseFont)};`);
  for (const [k, v] of Object.entries(tokens.iconSizes) as [string, number][]) {
    out.push(`$${p}-icon-size-${k}: ${rem(v)};`);
  }
  for (const [k, v] of Object.entries(tokens.icons) as [string, number][]) {
    out.push(`$${p}-icon-${k}: ${rem(v)};`);
  }
  for (const [k, v] of Object.entries(tokens.controlSizes) as [string, number][]) {
    out.push(`$${p}-control-${k}: ${v}px;`);
  }
  for (const [k, v] of Object.entries(tokens.touchTargets) as [string, number][]) {
    out.push(`$${p}-touch-target-${k}: ${v}px;`);
  }
  for (const [k, v] of Object.entries(tokens.borderWidths) as [string, number][]) {
    out.push(`$${p}-border-width-${k}: ${bw(v)};`);
  }
  for (const [k, v] of Object.entries(tokens.avatarSizes) as [string, number][]) {
    out.push(`$${p}-avatar-${k}: ${v}px;`);
  }
  for (const [k, v] of Object.entries(tokens.breakpoints) as [string, number][]) {
    out.push(`$${p}-breakpoint-${k}: ${v}px;`);
  }

  const sansFamily    = tokens.fontFamilySans    ?? DEFAULT_SANS_FAMILY;
  const displayFamily = tokens.fontFamilyDisplay ?? sansFamily;
  out.push(`$${p}-font-family-sans: ${sansFamily};`);
  out.push(`$${p}-font-family-display: ${displayFamily};`);

  for (const [key, style] of Object.entries(tokens.typography) as [string, TypographyStyle][]) {
    const kebab    = camelToKebab(key);
    const isSans   = SANS_TYPE_KEYS.has(key);
    const familyVar = `$${p}-font-family-${isSans ? "sans" : "display"}`;
    out.push(`$${p}-type-${kebab}-size: ${rem(style.fontSize)};`);
    out.push(`$${p}-type-${kebab}-line-height: ${style.lineHeight};`);
    out.push(`$${p}-type-${kebab}-weight: ${style.fontWeight};`);
    out.push(`$${p}-type-${kebab}-letter-spacing: ${style.letterSpacing === 0 ? "0" : `${style.letterSpacing}em`};`);
    out.push(`$${p}-type-${kebab}-family: #{${familyVar}};`);
  }

  for (const [k, v] of Object.entries(tokens.lineHeights) as [string, number][]) {
    out.push(`$${p}-line-height-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.fontWeights) as [string, number][]) {
    out.push(`$${p}-font-weight-${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.letterSpacings) as [string, number][]) {
    out.push(`$${p}-letter-spacing-${k}: ${v === 0 ? "0" : `${v}em`};`);
  }

  return out;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Serialize a salt theme as SCSS variables.
 *
 * Light-mode colors use the plain prefix (`$salt-color-primary`).
 * Dark-mode colors add a `-dark` suffix (`$salt-color-primary-dark`).
 * Tokens (spacing, radius, typography, etc.) are mode-agnostic.
 *
 * @example
 * const { scss } = generateScssVariables(theme);
 * fs.writeFileSync("_salt-theme.scss", scss);
 * // In your SCSS: @use 'salt-theme' as *;
 * //              color: $salt-color-primary;
 *
 * @example
 * // Custom prefix
 * const { scss } = generateScssVariables(theme, { prefix: "ds" });
 * // emits $ds-color-primary, $ds-spacing-md, etc.
 */
export function generateScssVariables(
  theme: GeneratedTheme,
  options?: ScssVariablesOptions
): ScssVariablesResult {
  const prefix         = options?.prefix         ?? "salt";
  const includePalettes = options?.includePalettes ?? false;
  const p              = prefix;

  const lightColorDecls = buildColorDecls(theme.light, p, "",      includePalettes);
  const darkColorDecls  = buildColorDecls(theme.dark,  p, "-dark", includePalettes);
  const tokenDecls      = buildTokenDecls(theme.tokens, p);

  const light = [...lightColorDecls, ...tokenDecls].join("\n");
  const dark  = darkColorDecls.join("\n");

  const header = buildScssHeader("generateScssVariables", theme.light.colors.primary, {
    prefix:          prefix         !== "salt" ? prefix         : undefined,
    includePalettes: includePalettes            ? true          : undefined,
  });

  const scss = [
    header,
    "// ─── Light mode ─────────────────────────────────────────────────────",
    light,
    "",
    "// ─── Dark mode ──────────────────────────────────────────────────────",
    dark,
  ].join("\n");

  return { scss, light, dark };
}
