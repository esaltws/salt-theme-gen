import { parseColor, oklchToHex, contrastRatio } from "./color-math.js";
import { deriveColors, deriveSurfaceElevation } from "./butterfly.js";
import { deriveAllIntentStates } from "./state-colors.js";
import { buildAccessibilityReport, buildAPCAReport, deriveOnColor, autoCorrectContrast } from "./on-colors.js";
import { generateTonalPalettes } from "./palettes.js";
import { SPACING_PRESETS } from "./presets/spacing-presets.js";
import { RADIUS_PRESETS } from "./presets/radius-presets.js";
import { FONT_SIZE_PRESETS } from "./presets/font-size-presets.js";
import { NATURE_PRESETS } from "./presets/nature-presets.js";
import type { DeriveColorsOptions } from "./butterfly.js";
import { resolveFontScale, computeTypographyScale, DEFAULT_LINE_HEIGHTS, DEFAULT_FONT_WEIGHTS, DEFAULT_LETTER_SPACINGS } from "./typography-utils.js";
import type {
  GenerateThemeOptions,
  GeneratedTheme,
  GeneratedThemeMode,
  SpacingPreset,
  FontSizePreset,
  RadiusPreset,
  SpacingScale,
  FontSizeScale,
  RadiusScale,
  SemanticColors,
  BaseColorKey,
  BaseColorOverride,
  ThemeWarning,
  FontFamilyOptions,
} from "./types.js";

// ─── Base color key registry ──────────────────────────────────────────

const ALL_BASE_KEYS: BaseColorKey[] = [
  "primary", "secondary", "tertiary", "quaternary",
  "background", "surface", "text", "muted", "border",
  "danger", "success", "warning", "info",
];

// The 8 base→on pairs (must re-derive on-colors after overrides settle)
const BASE_TO_ON: [BaseColorKey, keyof SemanticColors][] = [
  ["primary",    "onPrimary"],
  ["secondary",  "onSecondary"],
  ["tertiary",   "onTertiary"],
  ["quaternary", "onQuaternary"],
  ["background", "onBackground"],
  ["surface",    "onSurface"],
  ["danger",     "onDanger"],
  ["success",    "onSuccess"],
  ["warning",    "onWarning"],
  ["info",       "onInfo"],
];

// WCAG pairs: colors checked as foreground against background
const WCAG_PAIRS: Partial<Record<BaseColorKey, number>> = {
  primary:    4.5,
  secondary:  4.5,
  tertiary:   4.5,
  quaternary: 4.5,
  danger:     4.5,
  success:    4.5,
  warning:    4.5,
  info:       4.5,
  text:       4.5,
  muted:      3.0, // large text / UI element threshold
  // background, surface, border → no check (these are backgrounds/non-text)
};

// ─── Helpers ──────────────────────────────────────────────────────────

function isFullySpecified(overrides: BaseColorOverride): boolean {
  return ALL_BASE_KEYS.every((k) => k in overrides && overrides[k] !== undefined);
}

/**
 * Merge legacy flat options + colors.both + colors[mode] into one object.
 * Precedence (highest → lowest): colors[mode] > colors.both > legacy flat options.
 * All values are normalized via parseColor().
 */
function resolveEffectiveOverrides(
  options: GenerateThemeOptions,
  mode: "light" | "dark"
): BaseColorOverride {
  const legacy: BaseColorOverride = {};
  if (options.secondary)  legacy.secondary  = parseColor(options.secondary);
  if (options.tertiary)   legacy.tertiary   = parseColor(options.tertiary);
  if (options.quaternary) legacy.quaternary = parseColor(options.quaternary);

  const both     = options.colors?.both  ?? {};
  const modeSpec = (mode === "light" ? options.colors?.light : options.colors?.dark) ?? {};

  // Normalize all user-provided hex values
  const merged: BaseColorOverride = { ...legacy };
  for (const [k, v] of Object.entries(both) as [BaseColorKey, string][]) {
    if (v !== undefined) merged[k] = parseColor(v);
  }
  for (const [k, v] of Object.entries(modeSpec) as [BaseColorKey, string][]) {
    if (v !== undefined) merged[k] = parseColor(v);
  }
  return merged;
}

/**
 * Apply user overrides on top of butterfly-derived colors, with WCAG checking.
 *
 * Processing order:
 * 1. background first (cascade: re-correct non-user intent colors against new bg)
 * 2. all other user-provided keys
 * 3. re-derive all 8 on-colors from final settled values
 */
function applyUserOverridesWithWCAG(
  derived: SemanticColors,
  userOverrides: BaseColorOverride,
  overrideFlag: boolean,
  mode: "light" | "dark"
): { colors: SemanticColors; warnings: ThemeWarning[] } {
  const working = { ...derived } as Record<string, string>;
  const warnings: ThemeWarning[] = [];

  // Step 1: apply background first, then cascade re-correct derived intent colors
  if (userOverrides.background !== undefined) {
    working.background = userOverrides.background;
    // Re-correct every non-user-provided key that has a WCAG pair
    for (const [key, minRatio] of Object.entries(WCAG_PAIRS) as [BaseColorKey, number][]) {
      if (key in userOverrides) continue; // user is providing this one — handle in step 2
      working[key] = autoCorrectContrast(working[key], working.background, minRatio);
    }
  }

  // Step 2: apply remaining user overrides with WCAG check
  for (const key of ALL_BASE_KEYS) {
    if (key === "background") continue; // already handled
    const userValue = userOverrides[key];
    if (userValue === undefined) continue;

    const minRatio = WCAG_PAIRS[key];
    if (minRatio === undefined) {
      // surface, border — no WCAG check, apply directly
      working[key] = userValue;
      continue;
    }

    const bg = working.background;
    const ratio = Math.round(contrastRatio(userValue, bg) * 100) / 100;

    if (ratio >= minRatio) {
      working[key] = userValue;
    } else if (!overrideFlag) {
      // Keep user value, warn
      working[key] = userValue;
      warnings.push({ mode, key, value: userValue, background: bg, ratio, required: minRatio, action: "warn", finalValue: userValue });
    } else {
      // Auto-correct (preserve hue, shift L), warn
      const corrected = autoCorrectContrast(userValue, bg, minRatio);
      working[key] = corrected;
      warnings.push({ mode, key, value: userValue, background: bg, ratio, required: minRatio, action: "corrected", finalValue: corrected });
    }
  }

  // Step 3: re-derive all 8 on-colors from final settled base values
  for (const [baseKey, onKey] of BASE_TO_ON) {
    working[onKey as string] = deriveOnColor(working[baseKey]);
  }

  return { colors: working as SemanticColors, warnings };
}

function generateModeWithOverrides(
  mode: "light" | "dark",
  primaryHex: string,
  harmony: DeriveColorsOptions["harmony"],
  userOverrides: BaseColorOverride,
  overrideFlag: boolean,
  spacing: SpacingScale,
  radius: RadiusScale,
  fontSizes: FontSizeScale,
  baseFont: number,
  fontScale: number,
  fontFamily?: FontFamilyOptions
): { result: GeneratedThemeMode; warnings: ThemeWarning[] } {
  let derived: SemanticColors;

  if (isFullySpecified(userOverrides)) {
    // Full-mode bypass: build base colors directly from user overrides
    const base: Record<string, string> = {};
    for (const k of ALL_BASE_KEYS) base[k] = userOverrides[k]!;
    // Derive on-colors as placeholders so the shape is complete before WCAG pass
    for (const [baseKey, onKey] of BASE_TO_ON) {
      base[onKey as string] = deriveOnColor(base[baseKey]);
    }
    derived = base as unknown as SemanticColors;
    // Still run WCAG checks even in full bypass (warnings only, no cascade re-correction)
  } else {
    // Normal butterfly derivation — no user overrides passed to butterfly
    derived = deriveColors(primaryHex, mode, { harmony });
  }

  const { colors, warnings } = applyUserOverridesWithWCAG(derived, userOverrides, overrideFlag, mode);

  const palettes = generateTonalPalettes(colors);
  const surfaceElevation = deriveSurfaceElevation(colors.surface, colors.primary, mode);
  const states = deriveAllIntentStates(colors);
  const accessibility = buildAccessibilityReport(colors, surfaceElevation);
  const apca = buildAPCAReport(colors, surfaceElevation);

  return {
    result: {
      mode, colors, palettes, surfaceElevation, spacing, radius, fontSizes,
      iconSizes: fontSizes, sizeMap: fontSizes, dimensions: fontSizes,
      baseFont, fontScale,
      fontFamilySans: fontFamily?.sans,
      fontFamilyDisplay: fontFamily?.display,
      typography: computeTypographyScale(baseFont, fontScale, fontFamily),
      lineHeights: DEFAULT_LINE_HEIGHTS,
      fontWeights: DEFAULT_FONT_WEIGHTS,
      letterSpacings: DEFAULT_LETTER_SPACINGS,
      states, accessibility, apca,
    },
    warnings,
  };
}

/**
 * Generate a complete light + dark theme from minimal input.
 *
 * @example
 * // Minimal — just a color
 * const theme = generateTheme({ primary: "#0E9D8E" });
 *
 * @example
 * // From a preset
 * const theme = generateTheme({ preset: "peacock" });
 *
 * @example
 * // Full control
 * const theme = generateTheme({
 *   preset: "peacock",
 *   spacing: "relaxed",
 *   radius: "rounded",
 *   fontSize: "large",
 * });
 *
 * @example
 * // Custom colors with WCAG warnings
 * const theme = generateTheme({
 *   colors: { both: { danger: "#e00" }, dark: { background: "#0a0a1a" } },
 *   override: false, // keep user values even if WCAG fails (default)
 * });
 */
export function generateTheme(options: GenerateThemeOptions = {}): GeneratedTheme {
  // 1. Resolve primary seed
  const primaryHex = resolvePrimary(options);

  // 2. Resolve scales
  const spacing = resolveScale<SpacingPreset, SpacingScale>(options.spacing, SPACING_PRESETS, "default");
  const fontSize = resolveScale<FontSizePreset, FontSizeScale>(options.fontSize, FONT_SIZE_PRESETS, "default");
  const radius = resolveScale<RadiusPreset, RadiusScale>(options.radius, RADIUS_PRESETS, "default");
  const baseFont  = Math.max(8, options.baseFont ?? 16);
  const fontScale = resolveFontScale(options.fontScale);
  const fontFamily = options.fontFamily;

  // 3. Fast path — no user color overrides
  const hasColorOverrides =
    options.colors !== undefined ||
    options.secondary !== undefined ||
    options.tertiary  !== undefined ||
    options.quaternary !== undefined;

  if (!hasColorOverrides) {
    const light = generateMode("light", primaryHex, { harmony: options.harmony }, spacing, radius, fontSize, baseFont, fontScale, fontFamily);
    const dark  = generateMode("dark",  primaryHex, { harmony: options.harmony }, spacing, radius, fontSize, baseFont, fontScale, fontFamily);
    return { light, dark };
  }

  // 4. New path — resolve per-mode overrides
  const overrideFlag = options.override ?? false;
  const lightOverrides = resolveEffectiveOverrides(options, "light");
  const darkOverrides  = resolveEffectiveOverrides(options, "dark");

  const lightFull = isFullySpecified(lightOverrides);
  const darkFull  = isFullySpecified(darkOverrides);

  // Cross-seed: fully-specified mode's primary seeds the other mode's butterfly
  let lightPrimary = primaryHex;
  let darkPrimary  = primaryHex;
  if (lightFull && lightOverrides.primary) {
    if (!darkFull) darkPrimary = lightOverrides.primary;
    lightPrimary = lightOverrides.primary;
  }
  if (darkFull && darkOverrides.primary) {
    if (!lightFull) lightPrimary = darkOverrides.primary;
    darkPrimary = darkOverrides.primary;
  }

  const { result: light, warnings: lightWarns } = generateModeWithOverrides(
    "light", lightPrimary, options.harmony, lightOverrides, overrideFlag, spacing, radius, fontSize, baseFont, fontScale, fontFamily
  );
  const { result: dark, warnings: darkWarns } = generateModeWithOverrides(
    "dark", darkPrimary, options.harmony, darkOverrides, overrideFlag, spacing, radius, fontSize, baseFont, fontScale, fontFamily
  );

  const allWarnings = [...lightWarns, ...darkWarns];
  return { light, dark, ...(allWarnings.length > 0 && { warnings: allWarnings }) };
}

// ─── Original fast-path mode generator (unchanged) ───────────────────

function generateMode(
  mode: "light" | "dark",
  primaryHex: string,
  colorOpts: DeriveColorsOptions,
  spacing: SpacingScale,
  radius: RadiusScale,
  fontSizes: FontSizeScale,
  baseFont: number,
  fontScale: number,
  fontFamily?: FontFamilyOptions
): GeneratedThemeMode {
  const colors = deriveColors(primaryHex, mode, colorOpts);
  const palettes = generateTonalPalettes(colors);
  const surfaceElevation = deriveSurfaceElevation(colors.surface, colors.primary, mode);
  const states = deriveAllIntentStates(colors);
  const accessibility = buildAccessibilityReport(colors, surfaceElevation);
  const apca = buildAPCAReport(colors, surfaceElevation);

  return {
    mode,
    colors,
    palettes,
    surfaceElevation,
    spacing,
    radius,
    fontSizes,
    iconSizes: fontSizes,
    sizeMap: fontSizes,
    dimensions: fontSizes,
    baseFont,
    fontScale,
    fontFamilySans: fontFamily?.sans,
    fontFamilyDisplay: fontFamily?.display,
    typography: computeTypographyScale(baseFont, fontScale, fontFamily),
    lineHeights: DEFAULT_LINE_HEIGHTS,
    fontWeights: DEFAULT_FONT_WEIGHTS,
    letterSpacings: DEFAULT_LETTER_SPACINGS,
    states,
    accessibility,
    apca,
  };
}

function resolvePrimary(options: GenerateThemeOptions): string {
  if (options.primary) {
    return parseColor(options.primary);
  }

  if (options.preset) {
    const preset = NATURE_PRESETS[options.preset];
    if (!preset) {
      throw new Error(
        `Unknown preset: "${options.preset}". Valid presets: ${Object.keys(NATURE_PRESETS).join(", ")}`
      );
    }
    return oklchToHex({ L: 0.55, C: preset.chroma, H: preset.hue });
  }

  // Default: ocean preset
  const ocean = NATURE_PRESETS.ocean;
  return oklchToHex({ L: 0.55, C: ocean.chroma, H: ocean.hue });
}

function resolveScale<P extends string, S>(
  input: P | S | undefined,
  presets: Record<string, S>,
  defaultKey: string
): S {
  if (input === undefined) return presets[defaultKey];
  if (typeof input === "string") {
    const preset = presets[input];
    if (!preset) {
      throw new Error(`Unknown scale preset: "${input}"`);
    }
    return preset;
  }
  return input as S;
}
