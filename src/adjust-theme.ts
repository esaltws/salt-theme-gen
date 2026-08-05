import { parseColor } from "./color-math.js";
import { deriveOnColor, buildAccessibilityReport, buildAPCAReport } from "./on-colors.js";
import { deriveSurfaceElevation } from "./butterfly.js";
import { deriveAllIntentStates } from "./state-colors.js";
import { generateTonalPalettes } from "./palettes.js";
import { computeTypographyScale } from "./typography-utils.js";
import type {
  GeneratedTheme,
  GeneratedThemeMode,
  SemanticColors,
  IntentStates,
  StateColors,
  SurfaceElevation,
  AccessibilityReport,
  APCAReport,
  TonalPalettes,
  SpacingScale,
  RadiusScale,
  FontSizeScale,
  IconSizeScale,
  SemanticIconSizes,
  BorderWidthScale,
  AvatarSizeScale,
  BreakpointScale,
} from "./types.js";

// ─── Types ──────────────────────────────────────────────────────────

export type ThemeModeOverrides = {
  colors?: Partial<SemanticColors>;
  spacing?: Partial<SpacingScale>;
  radius?: Partial<RadiusScale>;
  fontSizes?: Partial<FontSizeScale>;
  iconSizes?: Partial<IconSizeScale>;
  icons?: Partial<SemanticIconSizes>;
  borderWidths?: Partial<BorderWidthScale>;
  avatarSizes?: Partial<AvatarSizeScale>;
  breakpoints?: Partial<BreakpointScale>;
  baseFont?: number;
  fontScale?: number;
  fontFamilySans?: string;
  fontFamilyDisplay?: string;
  states?: Partial<Record<keyof IntentStates, Partial<StateColors>>>;
  surfaceElevation?: Partial<SurfaceElevation>;
};

export type ThemeOverrides = {
  light?: ThemeModeOverrides;
  dark?: ThemeModeOverrides;
  /** Applied to both modes first; mode-specific overrides win per-key. */
  both?: ThemeModeOverrides;
};

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

function mergeOverrides(
  base?: ThemeModeOverrides,
  specific?: ThemeModeOverrides
): ThemeModeOverrides | undefined {
  if (!base && !specific) return undefined;
  if (!base) return specific;
  if (!specific) return base;

  return {
    colors: base.colors || specific.colors
      ? { ...base.colors, ...specific.colors }
      : undefined,
    spacing: base.spacing || specific.spacing
      ? { ...base.spacing, ...specific.spacing }
      : undefined,
    radius: base.radius || specific.radius
      ? { ...base.radius, ...specific.radius }
      : undefined,
    fontSizes: base.fontSizes || specific.fontSizes
      ? { ...base.fontSizes, ...specific.fontSizes }
      : undefined,
    iconSizes: base.iconSizes || specific.iconSizes
      ? { ...base.iconSizes, ...specific.iconSizes }
      : undefined,
    icons: base.icons || specific.icons
      ? { ...base.icons, ...specific.icons }
      : undefined,
    borderWidths: base.borderWidths || specific.borderWidths
      ? { ...base.borderWidths, ...specific.borderWidths }
      : undefined,
    avatarSizes: base.avatarSizes || specific.avatarSizes
      ? { ...base.avatarSizes, ...specific.avatarSizes }
      : undefined,
    breakpoints: base.breakpoints || specific.breakpoints
      ? { ...base.breakpoints, ...specific.breakpoints }
      : undefined,
    baseFont: specific.baseFont ?? base.baseFont,
    fontScale: specific.fontScale ?? base.fontScale,
    fontFamilySans: specific.fontFamilySans ?? base.fontFamilySans,
    fontFamilyDisplay: specific.fontFamilyDisplay ?? base.fontFamilyDisplay,
    states: mergeNestedPartial(base.states, specific.states),
    surfaceElevation: base.surfaceElevation || specific.surfaceElevation
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

function adjustMode(
  mode: GeneratedThemeMode,
  overrides: ThemeModeOverrides
): GeneratedThemeMode {
  // 1. Merge numeric scales
  const spacing = overrides.spacing
    ? { ...mode.spacing, ...overrides.spacing }
    : mode.spacing;
  const radius = overrides.radius
    ? { ...mode.radius, ...overrides.radius }
    : mode.radius;
  const fontSizes = overrides.fontSizes
    ? { ...mode.fontSizes, ...overrides.fontSizes }
    : mode.fontSizes;
  const iconSizes = overrides.iconSizes
    ? { ...mode.iconSizes, ...overrides.iconSizes }
    : mode.iconSizes;
  const icons = overrides.icons
    ? { ...mode.icons, ...overrides.icons }
    : mode.icons;
  const borderWidths = overrides.borderWidths
    ? { ...mode.borderWidths, ...overrides.borderWidths }
    : mode.borderWidths;
  const avatarSizes = overrides.avatarSizes
    ? { ...mode.avatarSizes, ...overrides.avatarSizes }
    : mode.avatarSizes;
  const breakpoints = overrides.breakpoints
    ? { ...mode.breakpoints, ...overrides.breakpoints }
    : mode.breakpoints;
  const baseFont = overrides.baseFont !== undefined
    ? Math.max(8, overrides.baseFont)
    : mode.baseFont;
  const fontScale = overrides.fontScale !== undefined
    ? overrides.fontScale
    : mode.fontScale;
  const fontFamilySans = overrides.fontFamilySans !== undefined
    ? overrides.fontFamilySans
    : mode.fontFamilySans;
  const fontFamilyDisplay = overrides.fontFamilyDisplay !== undefined
    ? overrides.fontFamilyDisplay
    : mode.fontFamilyDisplay;
  const fontFamilyChanged = overrides.fontFamilySans !== undefined || overrides.fontFamilyDisplay !== undefined;
  const typography = (overrides.baseFont !== undefined || overrides.fontScale !== undefined || fontFamilyChanged)
    ? computeTypographyScale(baseFont, fontScale, { sans: fontFamilySans, display: fontFamilyDisplay })
    : mode.typography;

  // 2. Merge colors — normalize any CSS color string to hex before merging
  const colorOverrides = overrides.colors ?? {};
  const normalizedColorOverrides: Partial<SemanticColors> = {};
  for (const [key, value] of Object.entries(colorOverrides)) {
    if (value !== undefined) {
      normalizedColorOverrides[key as keyof SemanticColors] = parseColor(value);
    }
  }
  const mergedColors: SemanticColors = { ...mode.colors, ...normalizedColorOverrides };

  // 3. Re-derive on-colors for changed bases (unless explicitly overridden)
  for (const [base, onKey] of BASE_TO_ON) {
    if (base in colorOverrides && !(onKey in colorOverrides)) {
      mergedColors[onKey] = deriveOnColor(mergedColors[base]);
    }
  }

  // 4. Determine what changed
  const colorChanged = (key: string) => key in colorOverrides;
  const anyColorChanged = Object.keys(colorOverrides).length > 0;
  const anyStateInputChanged =
    INTENT_KEYS.some((k) => colorChanged(k)) || colorChanged("background");
  const surfaceInputChanged = colorChanged("surface") || colorChanged("primary");

  // 5. States
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

  // 6. Surface elevation
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

  // 7. Palettes — regenerate if any of the 8 palette source colors changed
  const anyPaletteInputChanged = INTENT_KEYS.some((k) => colorChanged(k));
  const palettes: TonalPalettes = anyPaletteInputChanged
    ? generateTonalPalettes(mergedColors)
    : mode.palettes;

  // 8. Accessibility (WCAG + APCA)
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
    spacing,
    radius,
    fontSizes,
    iconSizes,
    icons,
    borderWidths,
    avatarSizes,
    breakpoints,
    sizeMap: mode.sizeMap,
    dimensions: mode.dimensions,
    baseFont,
    fontScale,
    fontFamilySans,
    fontFamilyDisplay,
    typography,
    lineHeights: mode.lineHeights,
    fontWeights: mode.fontWeights,
    letterSpacings: mode.letterSpacings,
    states,
    accessibility,
    apca,
  };
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Create a new theme by applying partial overrides to an existing theme.
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
 * // Change spacing globally
 * const adjusted = adjustTheme(theme, {
 *   both: { spacing: { md: 20, lg: 28 } }
 * });
 */
export function adjustTheme(
  theme: GeneratedTheme,
  overrides: ThemeOverrides
): GeneratedTheme {
  const lightOverrides = mergeOverrides(overrides.both, overrides.light);
  const darkOverrides = mergeOverrides(overrides.both, overrides.dark);

  return {
    light: lightOverrides ? adjustMode(theme.light, lightOverrides) : theme.light,
    dark: darkOverrides ? adjustMode(theme.dark, darkOverrides) : theme.dark,
  };
}
