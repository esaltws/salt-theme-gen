import type {
  GeneratedTheme,
  GeneratedThemeColors,
  GeneratedThemeTokens,
  SemanticColors,
  SurfaceElevation,
  SpacingScale,
  RadiusScale,
  FontSizeScale,
  IntentStates,
  StateColors,
  AccessibilityReport,
  ContrastEntry,
} from "./types.js";

// ─── Types ──────────────────────────────────────────────────────────

export type FieldChange<T = unknown> = { old: T; new: T };

export type ThemeColorsDiff = {
  colors?: Partial<Record<keyof SemanticColors, FieldChange<string>>>;
  surfaceElevation?: Partial<Record<keyof SurfaceElevation, FieldChange<string>>>;
  states?: Partial<Record<keyof IntentStates, Partial<Record<keyof StateColors, FieldChange<string>>>>>;
  accessibility?: Partial<Record<keyof AccessibilityReport, { ratio?: FieldChange<number>; level?: FieldChange<string> }>>;
};

export type ThemeTokensDiff = {
  spacing?: Partial<Record<keyof SpacingScale, FieldChange<number>>>;
  radius?: Partial<Record<keyof RadiusScale, FieldChange<number>>>;
  fontSizes?: Partial<Record<keyof FontSizeScale, FieldChange<number>>>;
  baseFont?: FieldChange<number>;
  fontScale?: FieldChange<number>;
};

export type ThemeDiff = {
  light: ThemeColorsDiff;
  dark: ThemeColorsDiff;
  tokens: ThemeTokensDiff;
  identical: boolean;
};

// Keep backward-compatible alias
export type ThemeModeDiff = ThemeColorsDiff;

// ─── Constants ──────────────────────────────────────────────────────

const SEMANTIC_KEYS: (keyof SemanticColors)[] = [
  "primary", "secondary", "tertiary", "quaternary", "background", "surface", "text",
  "muted", "border", "danger", "success", "warning", "info",
  "onPrimary", "onSecondary", "onTertiary", "onQuaternary", "onDanger", "onSuccess", "onWarning", "onInfo",
];

const ELEVATION_KEYS: (keyof SurfaceElevation)[] = ["card", "elevated", "modal", "popover"];
const SPACING_KEYS: (keyof SpacingScale)[] = ["none", "xs", "sm", "md", "lg", "xl", "xxl"];
const RADIUS_KEYS: (keyof RadiusScale)[] = ["none", "sm", "md", "lg", "xl", "xxl", "pill"];
const FONT_SIZE_KEYS: (keyof FontSizeScale)[] = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"];
const INTENT_KEYS: (keyof IntentStates)[] = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"];
const STATE_KEYS: (keyof StateColors)[] = ["hover", "pressed", "focused", "disabled"];
const ACCESSIBILITY_KEYS: (keyof AccessibilityReport)[] = [
  "primaryOnBackground", "secondaryOnBackground", "tertiaryOnBackground", "quaternaryOnBackground",
  "textOnBackground", "textOnSurface",
  "dangerOnBackground", "successOnBackground", "warningOnBackground", "infoOnBackground",
  "onPrimaryOnPrimary", "onSecondaryOnSecondary", "onTertiaryOnTertiary", "onQuaternaryOnQuaternary",
  "onDangerOnDanger", "onSuccessOnSuccess", "onWarningOnWarning", "onInfoOnInfo",
];

// ─── Helpers ────────────────────────────────────────────────────────

function diffFlat<K extends string, V>(
  a: Record<K, V>,
  b: Record<K, V>,
  keys: K[]
): Partial<Record<K, FieldChange<V>>> | undefined {
  let result: Partial<Record<K, FieldChange<V>>> | undefined;
  for (const key of keys) {
    if (a[key] !== b[key]) {
      if (!result) result = {};
      result[key] = { old: a[key], new: b[key] };
    }
  }
  return result;
}

function diffStates(a: IntentStates, b: IntentStates): ThemeColorsDiff["states"] {
  let result: Partial<Record<keyof IntentStates, Partial<Record<keyof StateColors, FieldChange<string>>>>> | undefined;
  for (const intent of INTENT_KEYS) {
    const d = diffFlat(a[intent], b[intent], STATE_KEYS);
    if (d) {
      if (!result) result = {};
      result[intent] = d;
    }
  }
  return result;
}

function diffAccessibility(a: AccessibilityReport, b: AccessibilityReport): ThemeColorsDiff["accessibility"] {
  let result: Partial<Record<keyof AccessibilityReport, { ratio?: FieldChange<number>; level?: FieldChange<string> }>> | undefined;
  for (const key of ACCESSIBILITY_KEYS) {
    const ea = a[key];
    const eb = b[key];
    let entry: { ratio?: FieldChange<number>; level?: FieldChange<string> } | undefined;
    if (ea.ratio !== eb.ratio) {
      entry = { ratio: { old: ea.ratio, new: eb.ratio } };
    }
    if (ea.level !== eb.level) {
      entry = { ...entry, level: { old: ea.level, new: eb.level } };
    }
    if (entry) {
      if (!result) result = {};
      result[key] = entry;
    }
  }
  return result;
}

function diffColors(a: GeneratedThemeColors, b: GeneratedThemeColors): ThemeColorsDiff {
  const diff: ThemeColorsDiff = {};

  const colors = diffFlat(a.colors, b.colors, SEMANTIC_KEYS);
  if (colors) diff.colors = colors;

  const surfaceElevation = diffFlat(a.surfaceElevation, b.surfaceElevation, ELEVATION_KEYS);
  if (surfaceElevation) diff.surfaceElevation = surfaceElevation;

  const states = diffStates(a.states, b.states);
  if (states) diff.states = states;

  const accessibility = diffAccessibility(a.accessibility, b.accessibility);
  if (accessibility) diff.accessibility = accessibility;

  return diff;
}

function diffTokens(a: GeneratedThemeTokens, b: GeneratedThemeTokens): ThemeTokensDiff {
  const diff: ThemeTokensDiff = {};

  const spacing = diffFlat(a.spacing, b.spacing, SPACING_KEYS);
  if (spacing) diff.spacing = spacing;

  const radius = diffFlat(a.radius, b.radius, RADIUS_KEYS);
  if (radius) diff.radius = radius;

  const fontSizes = diffFlat(a.fontSizes, b.fontSizes, FONT_SIZE_KEYS);
  if (fontSizes) diff.fontSizes = fontSizes;

  if (a.baseFont !== b.baseFont) {
    diff.baseFont = { old: a.baseFont, new: b.baseFont };
  }
  if (a.fontScale !== b.fontScale) {
    diff.fontScale = { old: a.fontScale, new: b.fontScale };
  }

  return diff;
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Compare two themes and return a structured diff of all changed fields.
 * Sections are only present in the result if they contain changes.
 *
 * @example
 * const diff = diffTheme(oldTheme, newTheme);
 * if (!diff.identical) {
 *   console.log("Light primary changed:", diff.light.colors?.primary);
 *   console.log("Spacing md changed:", diff.tokens.spacing?.md);
 * }
 */
export function diffTheme(a: GeneratedTheme, b: GeneratedTheme): ThemeDiff {
  const light  = diffColors(a.light,  b.light);
  const dark   = diffColors(a.dark,   b.dark);
  const tokens = diffTokens(a.tokens, b.tokens);
  const identical =
    Object.keys(light).length === 0 &&
    Object.keys(dark).length === 0 &&
    Object.keys(tokens).length === 0;
  return { light, dark, tokens, identical };
}
