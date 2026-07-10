import type { GeneratedTheme, GeneratedThemeMode } from "./types.js";

// ─── Public Types ────────────────────────────────────────────────────

export type DtcgColorToken     = { $value: string; $type: "color" };
export type DtcgDimensionToken = { $value: string; $type: "dimension" };
export type DtcgToken  = DtcgColorToken | DtcgDimensionToken;
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

function buildMode(mode: GeneratedThemeMode): DtcgGroup {
  // Semantic colors (23 keys).
  // `surface` the semantic color becomes color.surface: token.
  // Surface elevations go under color.elevation.* to avoid the name clash.
  const colorGroup: DtcgGroup = {};
  for (const [key, hex] of Object.entries(mode.colors) as [string, string][]) {
    colorGroup[camelToKebab(key)] = color(hex);
  }

  // Tonal palettes (8 × 11) → color.palette.{intent}.{step}
  const paletteGroup: DtcgGroup = {};
  for (const [pk, palette] of Object.entries(mode.palettes)) {
    const steps: DtcgGroup = {};
    for (const [step, hex] of Object.entries(palette as Record<string, string>)) {
      steps[step] = color(hex);
    }
    paletteGroup[pk] = steps;
  }

  // Surface elevations → color.elevation.{key}
  const elevationGroup: DtcgGroup = {};
  for (const [key, hex] of Object.entries(mode.surfaceElevation) as [string, string][]) {
    elevationGroup[key] = color(hex);
  }

  // State colors → color.state.{intent}.{state}
  const stateGroup: DtcgGroup = {};
  for (const [intent, states] of Object.entries(mode.states)) {
    const intentGroup: DtcgGroup = {};
    for (const [state, hex] of Object.entries(states as Record<string, string>)) {
      intentGroup[state] = color(hex);
    }
    stateGroup[intent] = intentGroup;
  }

  // Spacing (7 keys)
  const spacingGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(mode.spacing) as [string, number][]) {
    spacingGroup[key] = dim(val);
  }

  // Radius (7 keys)
  const radiusGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(mode.radius) as [string, number][]) {
    radiusGroup[key] = dim(val);
  }

  // Font sizes (7 keys) + base font level
  const fontSizeGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(mode.fontSizes) as [string, number][]) {
    fontSizeGroup[key] = dim(val);
  }
  fontSizeGroup.level = dim(mode.fontLevel);

  // Icon sizes, size map, dimensions
  const iconSizeGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(mode.iconSizes) as [string, number][]) {
    iconSizeGroup[key] = dim(val);
  }

  const sizeGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(mode.sizeMap) as [string, number][]) {
    sizeGroup[key] = dim(val);
  }

  const dimensionGroup: DtcgGroup = {};
  for (const [key, val] of Object.entries(mode.dimensions) as [string, number][]) {
    dimensionGroup[key] = dim(val);
  }

  return {
    color: {
      ...colorGroup,
      palette:   paletteGroup,
      elevation: elevationGroup,
      state:     stateGroup,
    },
    spacing:   spacingGroup,
    radius:    radiusGroup,
    fontSize:  fontSizeGroup,
    iconSize:  iconSizeGroup,
    size:      sizeGroup,
    dimension: dimensionGroup,
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
 * - `fontSize.*`        — type size scale + `fontSize.level` base size (px)
 * - `iconSize.*`        — icon size scale (px)
 * - `size.*`            — component size scale (px)
 * - `dimension.*`       — layout dimension scale (px)
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
  const light = buildMode(theme.light);
  const dark  = buildMode(theme.dark);
  return { light, dark, json: JSON.stringify({ light, dark }, null, 2) };
}
