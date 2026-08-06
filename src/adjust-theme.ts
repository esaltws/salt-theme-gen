import { parseColor } from "./color-math.js";
import { deriveOnColor, buildAccessibilityReport, buildAPCAReport } from "./on-colors.js";
import { deriveSurfaceElevation } from "./butterfly.js";
import { deriveAllIntentStates } from "./state-colors.js";
import { generateTonalPalettes } from "./palettes.js";
import { computeTypographyScale, computeModularFontSizes, lookupFontSizes, assertFontScale } from "./typography-utils.js";
import type {
  GeneratedTheme,
  GeneratedThemeColors,
  GeneratedThemeTokens,
  SemanticColors,
  IntentStates,
  SurfaceElevation,
  AccessibilityReport,
  APCAReport,
  TonalPalettes,
  TypographyScale,
  TypographyStyle,
  ThemeColorOverrides,
  ThemeTokenOverrides,
  ThemeOverrides,
} from "./types.js";

export type { ThemeColorOverrides, ThemeTokenOverrides, ThemeOverrides };

// ─── Constants ──────────────────────────────────────────────────────

const BASE_TO_ON: [keyof SemanticColors, keyof SemanticColors][] = [
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

const INTENT_KEYS: (keyof IntentStates)[] = [
  "primary", "secondary", "tertiary", "quaternary",
  "danger", "success", "warning", "info",
];

// ─── Internal ───────────────────────────────────────────────────────

function mergeColorOverrides(
  base?: ThemeColorOverrides,
  specific?: ThemeColorOverrides
): ThemeColorOverrides | undefined {
  if (!base && !specific) return undefined;
  if (!base) return specific;
  if (!specific) return base;

  return {
    colors: (base.colors || specific.colors)
      ? { ...base.colors, ...specific.colors }
      : undefined,
    states: mergeNestedPartial(base.states, specific.states),
    surfaceElevation: (base.surfaceElevation || specific.surfaceElevation)
      ? { ...base.surfaceElevation, ...specific.surfaceElevation }
      : undefined,
  };
}

function mergeNestedPartial<K extends string, V>(
  base?: Partial<Record<K, Partial<V>>>,
  specific?: Partial<Record<K, Partial<V>>>
): Partial<Record<K, Partial<V>>> | undefined {
  if (!base && !specific) return undefined;
  if (!base) return specific;
  if (!specific) return base;

  const result = { ...base } as Record<K, Partial<V>>;
  for (const key of Object.keys(specific) as K[]) {
    result[key] = { ...result[key], ...specific[key] };
  }
  return result;
}

function adjustColors(
  mode: GeneratedThemeColors,
  overrides: ThemeColorOverrides
): GeneratedThemeColors {
  // 1. Merge colors — normalize any CSS color string to hex before merging
  const colorOverrides = overrides.colors ?? {};
  const normalizedColorOverrides: Partial<SemanticColors> = {};
  for (const [key, value] of Object.entries(colorOverrides)) {
    if (value !== undefined) {
      normalizedColorOverrides[key as keyof SemanticColors] = parseColor(value);
    }
  }
  const mergedColors: SemanticColors = { ...mode.colors, ...normalizedColorOverrides };

  // 2. Re-derive on-colors for changed bases (unless explicitly overridden)
  for (const [base, onKey] of BASE_TO_ON) {
    if (base in colorOverrides && !(onKey in colorOverrides)) {
      mergedColors[onKey] = deriveOnColor(mergedColors[base]);
    }
  }

  // 3. Determine what changed
  const colorChanged = (key: string) => key in colorOverrides;
  const anyColorChanged = Object.keys(colorOverrides).length > 0;
  const anyStateInputChanged =
    INTENT_KEYS.some((k) => colorChanged(k)) || colorChanged("background");
  const surfaceInputChanged = colorChanged("surface") || colorChanged("primary");

  // 4. States
  let states: IntentStates;
  if (overrides.states) {
    const base = anyStateInputChanged
      ? deriveAllIntentStates(mergedColors)
      : mode.states;
    states = { ...base };
    for (const intent of INTENT_KEYS) {
      if (intent in overrides.states) {
        states[intent] = { ...states[intent], ...overrides.states[intent]! };
      }
    }
  } else if (anyStateInputChanged) {
    states = deriveAllIntentStates(mergedColors);
  } else {
    states = mode.states;
  }

  // 5. Surface elevation
  let surfaceElevation: SurfaceElevation;
  if (overrides.surfaceElevation) {
    const base = surfaceInputChanged
      ? deriveSurfaceElevation(mergedColors.surface, mergedColors.primary, mode.mode)
      : mode.surfaceElevation;
    surfaceElevation = { ...base, ...overrides.surfaceElevation };
  } else if (surfaceInputChanged) {
    surfaceElevation = deriveSurfaceElevation(mergedColors.surface, mergedColors.primary, mode.mode);
  } else {
    surfaceElevation = mode.surfaceElevation;
  }

  // 6. Palettes — regenerate if any of the 8 palette source colors changed
  const anyPaletteInputChanged = INTENT_KEYS.some((k) => colorChanged(k));
  const palettes: TonalPalettes = anyPaletteInputChanged
    ? generateTonalPalettes(mergedColors)
    : mode.palettes;

  // 7. Accessibility (WCAG + APCA)
  const accessibility: AccessibilityReport = anyColorChanged
    ? buildAccessibilityReport(mergedColors, surfaceElevation)
    : mode.accessibility;
  const apca: APCAReport = anyColorChanged
    ? buildAPCAReport(mergedColors, surfaceElevation)
    : mode.apca;

  return {
    mode: mode.mode,
    colors: mergedColors,
    palettes,
    surfaceElevation,
    states,
    accessibility,
    apca,
  };
}

export function adjustTokens(
  tokens: GeneratedThemeTokens,
  overrides: ThemeTokenOverrides
): GeneratedThemeTokens {
  const spacing = overrides.spacing
    ? { ...tokens.spacing, ...overrides.spacing }
    : tokens.spacing;
  const radius = overrides.radius
    ? { ...tokens.radius, ...overrides.radius }
    : tokens.radius;
  const iconSizes = overrides.iconSizes
    ? { ...tokens.iconSizes, ...overrides.iconSizes }
    : tokens.iconSizes;
  const icons = overrides.icons
    ? { ...tokens.icons, ...overrides.icons }
    : tokens.icons;
  const controlSizes = overrides.controlSizes
    ? { ...tokens.controlSizes, ...overrides.controlSizes }
    : tokens.controlSizes;
  const touchTargets = overrides.touchTargets
    ? { ...tokens.touchTargets, ...overrides.touchTargets }
    : tokens.touchTargets;
  const borderWidths = overrides.borderWidths
    ? { ...tokens.borderWidths, ...overrides.borderWidths }
    : tokens.borderWidths;
  const avatarSizes = overrides.avatarSizes
    ? { ...tokens.avatarSizes, ...overrides.avatarSizes }
    : tokens.avatarSizes;
  const breakpoints = overrides.breakpoints
    ? { ...tokens.breakpoints, ...overrides.breakpoints }
    : tokens.breakpoints;
  const lineHeights = overrides.lineHeights
    ? { ...tokens.lineHeights, ...overrides.lineHeights }
    : tokens.lineHeights;
  const fontWeights = overrides.fontWeights
    ? { ...tokens.fontWeights, ...overrides.fontWeights }
    : tokens.fontWeights;
  const letterSpacings = overrides.letterSpacings
    ? { ...tokens.letterSpacings, ...overrides.letterSpacings }
    : tokens.letterSpacings;

  if (overrides.baseFont !== undefined && !Number.isFinite(overrides.baseFont)) {
    throw new RangeError("baseFont must be a finite number.");
  }
  const baseFont = overrides.baseFont !== undefined
    ? Math.max(8, overrides.baseFont)
    : tokens.baseFont;
  const fontScale = overrides.fontScale !== undefined
    ? assertFontScale(overrides.fontScale)
    : tokens.fontScale;
  const fontFamilySans = overrides.fontFamilySans !== undefined
    ? overrides.fontFamilySans
    : tokens.fontFamilySans;
  const fontFamilyDisplay = overrides.fontFamilyDisplay !== undefined
    ? overrides.fontFamilyDisplay
    : tokens.fontFamilyDisplay;

  // fontSizes: explicit override wins; fontScale → modular; baseFont alone → lookup table
  const noFontSizesOverride = overrides.fontSizes === undefined;
  const fontSizes = overrides.fontSizes
    ? { ...tokens.fontSizes, ...overrides.fontSizes }
    : noFontSizesOverride && overrides.fontScale !== undefined
      ? computeModularFontSizes(baseFont, fontScale)
      : noFontSizesOverride && overrides.baseFont !== undefined
        ? lookupFontSizes(baseFont)
        : tokens.fontSizes;

  // typography: recompute from fontSizes when fontSizes changed; then deep-merge any style overrides
  const fontSizesChanged = (noFontSizesOverride && (overrides.fontScale !== undefined || overrides.baseFont !== undefined)) || overrides.fontSizes !== undefined;
  const fontFamilyChanged = overrides.fontFamilySans !== undefined || overrides.fontFamilyDisplay !== undefined;
  let typography: TypographyScale = (fontSizesChanged || fontFamilyChanged)
    ? computeTypographyScale(fontSizes, { sans: fontFamilySans, display: fontFamilyDisplay })
    : tokens.typography;

  if (overrides.typography) {
    const merged = { ...typography };
    for (const [key, patch] of Object.entries(overrides.typography) as [keyof TypographyScale, Partial<TypographyStyle>][]) {
      merged[key] = { ...merged[key], ...patch };
    }
    typography = merged;
  }

  return {
    spacing, radius, fontSizes, iconSizes, icons,
    controlSizes, touchTargets,
    borderWidths, avatarSizes, breakpoints,
    sizeMap: controlSizes,
    dimensions: controlSizes,
    baseFont, fontScale, fontFamilySans, fontFamilyDisplay,
    typography, lineHeights, fontWeights, letterSpacings,
  };
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Create a new theme by applying partial overrides to an existing theme.
 *
 * Color overrides are per-mode (light / dark / both) and target theme.light / theme.dark.
 * Token overrides are mode-agnostic and target theme.tokens.
 * Automatically regenerates derived fields (on-colors, states,
 * surfaceElevation, accessibility) when base colors change.
 *
 * @example
 * // Change primary in dark mode only
 * const adjusted = adjustTheme(theme, {
 *   dark: { colors: { primary: "#ff0000" } }
 * });
 *
 * @example
 * // Change spacing tokens (mode-agnostic)
 * const adjusted = adjustTheme(theme, {
 *   tokens: { spacing: { md: 20, lg: 28 } }
 * });
 *
 * @example
 * // Override a single typography style
 * const adjusted = adjustTheme(theme, {
 *   tokens: { typography: { bodyMedium: { lineHeight: 1.6 } } }
 * });
 */
export function adjustTheme(
  theme: GeneratedTheme,
  overrides: ThemeOverrides
): GeneratedTheme {
  const lightColorOverrides = mergeColorOverrides(overrides.both, overrides.light);
  const darkColorOverrides  = mergeColorOverrides(overrides.both, overrides.dark);

  return {
    light:  lightColorOverrides ? adjustColors(theme.light,  lightColorOverrides) : theme.light,
    dark:   darkColorOverrides  ? adjustColors(theme.dark,   darkColorOverrides)  : theme.dark,
    tokens: overrides.tokens    ? adjustTokens(theme.tokens, overrides.tokens)    : theme.tokens,
    ...(theme.warnings !== undefined && { warnings: theme.warnings }),
  };
}
