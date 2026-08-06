import type { GeneratedTheme, GeneratedThemeColors, GeneratedThemeTokens } from "./types.js";

// ─── Public Types ────────────────────────────────────────────────────

export type DtcgColorToken      = { $value: string; $type: "color" };
export type DtcgDimensionToken  = { $value: string; $type: "dimension" };
export type DtcgNumberToken     = { $value: number; $type: "number" };
export type DtcgFontWeightToken = { $value: number; $type: "fontWeight" };
export type DtcgTypographyValue = Record<string, string | number>;
export type DtcgTypographyToken = { $value: DtcgTypographyValue; $type: "typography" };
export type DtcgToken  = DtcgColorToken | DtcgDimensionToken | DtcgNumberToken | DtcgFontWeightToken | DtcgTypographyToken;
export type DtcgGroup  = { [key: string]: DtcgToken | DtcgGroup };

export type DtcgTokensResult = {
  /** W3C Design Token tree for light mode. */
  light: DtcgGroup;
  /** W3C Design Token tree for dark mode. */
  dark: DtcgGroup;
  /** Combined JSON string: `{ "light": {...}, "dark": {...} }` — ready to write to a file. */
  json: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

const color = (value: string): DtcgColorToken => ({ $value: value, $type: "color" });
const dim   = (px: number): DtcgDimensionToken => ({ $value: `${px}px`, $type: "dimension" });

// ─── Mode Builder ────────────────────────────────────────────────────

function buildMode(colors: GeneratedThemeColors, tokens: GeneratedThemeTokens): DtcgGroup {
  // Semantic colors (23 keys).
  // `surface` the semantic color becomes color.surface: token.
  // Surface elevations go under color.elevation.* to avoid the name clash.
  const colorGroup: DtcgGroup = {};
  for (const [key, hex] of Object.entries(colors.colors) as [string, string][]) {
    colorGroup[camelToKebab(key)] = color(hex);
  }

  // Tonal palettes (8 × 11) → color.palette.{intent}.{step}
  const paletteGroup: DtcgGroup = {};
  for (const [pk, palette] of Object.entries(colors.palettes)) {
    const steps: DtcgGroup = {};
    for (const [step, hex] of Object.entries(palette as Record<string, string>)) {
      steps[step] = color(hex);
    }
    paletteGroup[pk] = steps;
  }

  // Surface elevations → color.elevation.{key}
  const elevationGroup: DtcgGroup = {};
  for (const [key, hex] of Object.entries(colors.surfaceElevation) as [string, string][]) {
    elevationGroup[key] = color(hex);
  }

  // State colors → color.state.{intent}.{state}
  const stateGroup: DtcgGroup = {};
  for (const [intent, states] of Object.entries(colors.states)) {
    const intentGroup: DtcgGroup = {};
    for (const [state, hex] of Object.entries(states as Record<string, string>)) {
      intentGroup[state] = color(hex);
    }
    stateGroup[intent] = intentGroup;
  }

  // Spacing (7 keys)
  const spacingGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.spacing) as [string, number][]) {
    spacingGroup[key] = dim(val);
  }

  // Radius (7 keys)
  const radiusGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.radius) as [string, number][]) {
    radiusGroup[key] = dim(val);
  }

  // Font sizes (7 keys, t-shirt scale)
  const fontSizeGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.fontSizes) as [string, number][]) {
    fontSizeGroup[key] = dim(val);
  }
  fontSizeGroup.base = dim(tokens.baseFont);

  // Line heights (unitless)
  const lineHeightGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.lineHeights) as [string, number][]) {
    lineHeightGroup[key] = { $value: val, $type: "number" } as DtcgNumberToken;
  }

  // Font weights
  const fontWeightGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.fontWeights) as [string, number][]) {
    fontWeightGroup[key] = { $value: val, $type: "fontWeight" } as DtcgFontWeightToken;
  }

  // Letter spacings (em)
  const letterSpacingGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.letterSpacings) as [string, number][]) {
    letterSpacingGroup[key] = { $value: val === 0 ? "0" : `${val}em`, $type: "dimension" } as DtcgDimensionToken;
  }

  // Typography composite tokens — each token bundles fontSize, lineHeight, fontWeight, letterSpacing
  const typographyGroup: DtcgGroup = {};
  for (const [key, style] of Object.entries(tokens.typography) as [string, { fontSize: number; lineHeight: number; fontWeight: number; letterSpacing: number; fontFamily?: string }][]) {
    const value: DtcgTypographyValue = {
      fontSize:      `${style.fontSize}px`,
      lineHeight:    style.lineHeight,
      fontWeight:    style.fontWeight,
      letterSpacing: style.letterSpacing === 0 ? "0" : `${style.letterSpacing}em`,
    };
    if (style.fontFamily) value.fontFamily = style.fontFamily;
    typographyGroup[key] = { $type: "typography", $value: value } as DtcgTypographyToken;
  }

  // Icon sizes (raw t-shirt scale)
  const iconSizeGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.iconSizes) as [string, number][]) {
    iconSizeGroup[key] = dim(val);
  }

  // Semantic icon aliases
  const iconGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.icons) as [string, number][]) {
    iconGroup[key] = dim(val);
  }

  // Border widths
  const borderWidthGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.borderWidths) as [string, number][]) {
    borderWidthGroup[key] = dim(val);
  }

  // Avatar sizes
  const avatarSizeGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.avatarSizes) as [string, number][]) {
    avatarSizeGroup[key] = dim(val);
  }

  // Breakpoints
  const breakpointGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.breakpoints) as [string, number][]) {
    breakpointGroup[key] = dim(val);
  }

  // Control sizes (explicit, preferred over the deprecated size/dimension aliases)
  const controlSizeGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.controlSizes) as [string, number][]) {
    controlSizeGroup[key] = dim(val);
  }

  // Touch targets (explicit)
  const touchTargetGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.touchTargets) as [string, number][]) {
    touchTargetGroup[key] = dim(val);
  }

  // Deprecated generic aliases — kept for backward compatibility with existing pipelines
  const sizeGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.sizeMap) as [string, number][]) {
    sizeGroup[key] = dim(val);
  }
  const dimensionGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(tokens.dimensions) as [string, number][]) {
    dimensionGroup[key] = dim(val);
  }

  return {
    color: {
      ...colorGroup,
      palette:   paletteGroup,
      elevation: elevationGroup,
      state:     stateGroup,
    },
    spacing:      spacingGroup,
    radius:       radiusGroup,
    fontSize:     fontSizeGroup,
    lineHeight:   lineHeightGroup,
    fontWeight:   fontWeightGroup,
    letterSpacing: letterSpacingGroup,
    typography:   typographyGroup,
    iconSize:     iconSizeGroup,
    icon:         iconGroup,
    borderWidth:  borderWidthGroup,
    avatarSize:   avatarSizeGroup,
    breakpoint:   breakpointGroup,
    controlSize:  controlSizeGroup,
    touchTarget:  touchTargetGroup,
    size:         sizeGroup,      // @deprecated — use controlSize
    dimension:    dimensionGroup, // @deprecated — use controlSize
  };
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Export theme tokens as W3C Design Tokens Community Group (DTCG) format.
 * Compatible with Style Dictionary, Tokens Studio, Supernova, and other tools
 * that consume the `$value` / `$type` token structure.
 *
 * Token groups:
 * - `color.*`           — 23 semantic colors (camelCase → kebab-case)
 * - `color.palette.*.*` — 8 intent × 11 tonal steps
 * - `color.elevation.*` — 4 surface elevation levels
 * - `color.state.*.*`   — 8 intents × 4 interaction states
 * - `spacing.*`         — spacing scale (px)
 * - `radius.*`          — border-radius scale (px)
 * - `fontSize.*`        — type size scale + `fontSize.base` (px)
 * - `iconSize.*`        — icon size scale (px)
 * - `controlSize.*`     — component control heights (xs–xl) (px)
 * - `touchTarget.*`     — touch target sizes: minimum / recommended / comfortable (px)
 * - `size.*`            — **deprecated** alias for `controlSize` — kept for compatibility
 * - `dimension.*`       — **deprecated** alias for `controlSize` — kept for compatibility
 *
 * @example
 * const { light, dark, json } = generateDtcgTokens(theme);
 * // Write separate files per mode:
 * fs.writeFileSync("tokens.light.json", JSON.stringify(light, null, 2));
 * fs.writeFileSync("tokens.dark.json",  JSON.stringify(dark,  null, 2));
 * // Or write a combined file:
 * fs.writeFileSync("tokens.json", json);
 */
export function generateDtcgTokens(theme: GeneratedTheme): DtcgTokensResult {
  const light = buildMode(theme.light, theme.tokens);
  const dark  = buildMode(theme.dark,  theme.tokens);
  return { light, dark, json: JSON.stringify({ light, dark }, null, 2) };
}
