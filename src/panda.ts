import type { GeneratedTheme, GeneratedThemeColors, GeneratedThemeTokens } from "./types.js";
import { buildJsonDescription } from "./file-header.js";

// ─── Public types ─────────────────────────────────────────────────────

export type PandaToken          = { value: string };
export type PandaSemanticColor  = { value: { base: string; _dark: string } };

export type PandaBaseTokens = {
  spacing:        Record<string, PandaToken>;
  radii:          Record<string, PandaToken>;
  fontSizes:      Record<string, PandaToken>;
  lineHeights:    Record<string, PandaToken>;
  fontWeights:    Record<string, PandaToken>;
  letterSpacings: Record<string, PandaToken>;
  fonts:          Record<string, PandaToken>;
  sizes:          Record<string, PandaToken>;
  borderWidths:   Record<string, PandaToken>;
  breakpoints:    Record<string, PandaToken>;
};

export type PandaSemanticTokens = {
  colors: Record<string, PandaSemanticColor>;
};

export type PandaConfigOptions = {
  /** Emit tonal palette steps (8 intents × 11 steps). Default: false */
  includePalettes?: boolean;
};

export type PandaConfigResult = {
  /** Base tokens for `theme.tokens` in panda.config.ts */
  tokens:         PandaBaseTokens;
  /** Semantic color tokens for `theme.semanticTokens` in panda.config.ts */
  semanticTokens: PandaSemanticTokens;
  /** JSON of `{ $description, tokens, semanticTokens }` — ready to write to a file */
  json:           string;
};

// ─── Helpers ──────────────────────────────────────────────────────────

const DEFAULT_SANS_FAMILY = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

function rem(px: number): string {
  return px === 0 ? "0" : `${+(px / 16).toFixed(4)}rem`;
}

// ─── Semantic color builder ───────────────────────────────────────────

function buildSemanticColors(
  light: GeneratedThemeColors,
  dark:  GeneratedThemeColors,
  includePalettes: boolean
): Record<string, PandaSemanticColor> {
  const out: Record<string, PandaSemanticColor> = {};

  const pair = (lightHex: string, darkHex: string): PandaSemanticColor =>
    ({ value: { base: lightHex, _dark: darkHex } });

  for (const [key, lightHex] of Object.entries(light.colors) as [string, string][]) {
    out[`salt-${camelToKebab(key)}`] = pair(lightHex, (dark.colors as Record<string, string>)[key]);
  }

  for (const [key, lightHex] of Object.entries(light.surfaceElevation) as [string, string][]) {
    out[`salt-surface-${key}`] = pair(lightHex, (dark.surfaceElevation as Record<string, string>)[key]);
  }

  for (const [intent, states] of Object.entries(light.states)) {
    for (const [state, lightHex] of Object.entries(states as Record<string, string>)) {
      const darkHex = (dark.states[intent as keyof typeof dark.states] as Record<string, string>)[state];
      out[`salt-state-${intent}-${state}`] = pair(lightHex, darkHex);
    }
  }

  if (includePalettes) {
    for (const [pk, palette] of Object.entries(light.palettes)) {
      for (const [step, lightHex] of Object.entries(palette as Record<string, string>)) {
        const darkHex = (dark.palettes[pk as keyof typeof dark.palettes] as Record<string, string>)[step];
        out[`salt-palette-${pk}-${step}`] = pair(lightHex, darkHex);
      }
    }
  }

  return out;
}

// ─── Base token builder ───────────────────────────────────────────────

function buildBaseTokens(tokens: GeneratedThemeTokens): PandaBaseTokens {
  const spacing:        Record<string, PandaToken> = {};
  const radii:          Record<string, PandaToken> = {};
  const fontSizes:      Record<string, PandaToken> = {};
  const lineHeights:    Record<string, PandaToken> = {};
  const fontWeights:    Record<string, PandaToken> = {};
  const letterSpacings: Record<string, PandaToken> = {};
  const fonts:          Record<string, PandaToken> = {};
  const sizes:          Record<string, PandaToken> = {};
  const borderWidths:   Record<string, PandaToken> = {};
  const breakpoints:    Record<string, PandaToken> = {};

  for (const [k, v] of Object.entries(tokens.spacing) as [string, number][]) {
    spacing[`salt-${k}`] = { value: `${v}px` };
  }
  for (const [k, v] of Object.entries(tokens.radius) as [string, number][]) {
    radii[`salt-${k}`] = { value: `${v}px` };
  }
  for (const [k, v] of Object.entries(tokens.fontSizes) as [string, number][]) {
    fontSizes[`salt-${k}`] = { value: rem(v) };
  }
  fontSizes["salt-base"] = { value: rem(tokens.baseFont) };

  for (const [k, v] of Object.entries(tokens.lineHeights) as [string, number][]) {
    lineHeights[`salt-${k}`] = { value: String(v) };
  }
  for (const [k, v] of Object.entries(tokens.fontWeights) as [string, number][]) {
    fontWeights[`salt-${k}`] = { value: String(v) };
  }
  for (const [k, v] of Object.entries(tokens.letterSpacings) as [string, number][]) {
    letterSpacings[`salt-${k}`] = { value: v === 0 ? "0" : `${v}em` };
  }

  const sansFamily = tokens.fontFamilySans ?? DEFAULT_SANS_FAMILY;
  fonts["salt-sans"]    = { value: sansFamily };
  fonts["salt-display"] = { value: tokens.fontFamilyDisplay ?? sansFamily };

  for (const [k, v] of Object.entries(tokens.iconSizes) as [string, number][]) {
    sizes[`salt-icon-${k}`] = { value: rem(v) };
  }
  for (const [k, v] of Object.entries(tokens.controlSizes) as [string, number][]) {
    sizes[`salt-control-${k}`] = { value: `${v}px` };
  }
  for (const [k, v] of Object.entries(tokens.avatarSizes) as [string, number][]) {
    sizes[`salt-avatar-${k}`] = { value: `${v}px` };
  }
  for (const [k, v] of Object.entries(tokens.touchTargets) as [string, number][]) {
    sizes[`salt-touch-target-${k}`] = { value: `${v}px` };
  }

  for (const [k, v] of Object.entries(tokens.borderWidths) as [string, number][]) {
    borderWidths[`salt-${k}`] = { value: v === 0 ? "0" : `${v}px` };
  }
  for (const [k, v] of Object.entries(tokens.breakpoints) as [string, number][]) {
    breakpoints[`salt-${k}`] = { value: `${v}px` };
  }

  return { spacing, radii, fontSizes, lineHeights, fontWeights, letterSpacings, fonts, sizes, borderWidths, breakpoints };
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Generate a Panda CSS token configuration from a salt theme.
 *
 * Spread `tokens` into `theme.tokens` and `semanticTokens` into
 * `theme.semanticTokens` in your `panda.config.ts`. Semantic colors
 * carry both `base` (light) and `_dark` values for automatic dark mode.
 *
 * @example
 * import { generatePandaConfig } from "salt-theme-gen";
 * import { generateTheme } from "salt-theme-gen";
 *
 * const theme = generateTheme({ preset: "ocean" });
 * const { tokens, semanticTokens } = generatePandaConfig(theme);
 *
 * export default defineConfig({
 *   theme: { tokens, semanticTokens },
 * });
 */
export function generatePandaConfig(
  theme: GeneratedTheme,
  options?: PandaConfigOptions
): PandaConfigResult {
  const includePalettes = options?.includePalettes ?? false;

  const semanticColors = buildSemanticColors(theme.light, theme.dark, includePalettes);
  const tokens         = buildBaseTokens(theme.tokens);
  const semanticTokens: PandaSemanticTokens = { colors: semanticColors };

  const $description = buildJsonDescription("generatePandaConfig", theme.light.colors.primary, {
    includePalettes: includePalettes || undefined,
  });

  return {
    tokens,
    semanticTokens,
    json: JSON.stringify({ $description, tokens, semanticTokens }, null, 2),
  };
}
