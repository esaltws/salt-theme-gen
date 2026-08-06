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
  IconSizeScale,
  SemanticIconSizes,
  ControlSizeScale,
  TouchTargetScale,
  BorderWidthScale,
  AvatarSizeScale,
  BreakpointScale,
  LineHeightScale,
  FontWeightScale,
  LetterSpacingScale,
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
  iconSizes?: Partial<Record<keyof IconSizeScale, FieldChange<number>>>;
  icons?: Partial<Record<keyof SemanticIconSizes, FieldChange<number>>>;
  controlSizes?: Partial<Record<keyof ControlSizeScale, FieldChange<number>>>;
  touchTargets?: Partial<Record<keyof TouchTargetScale, FieldChange<number>>>;
  borderWidths?: Partial<Record<keyof BorderWidthScale, FieldChange<number>>>;
  avatarSizes?: Partial<Record<keyof AvatarSizeScale, FieldChange<number>>>;
  breakpoints?: Partial<Record<keyof BreakpointScale, FieldChange<number>>>;
  lineHeights?: Partial<Record<keyof LineHeightScale, FieldChange<number>>>;
  fontWeights?: Partial<Record<keyof FontWeightScale, FieldChange<number>>>;
  letterSpacings?: Partial<Record<keyof LetterSpacingScale, FieldChange<number>>>;
  baseFont?: FieldChange<number>;
  fontScale?: FieldChange<number>;
  fontFamilySans?: FieldChange<string | undefined>;
  fontFamilyDisplay?: FieldChange<string | undefined>;
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
  "onPrimary", "onSecondary", "onTertiary", "onQuaternary",
  "onBackground", "onSurface",
  "onDanger", "onSuccess", "onWarning", "onInfo",
];

const ELEVATION_KEYS: (keyof SurfaceElevation)[] = ["card", "elevated", "modal", "popover"];
const SPACING_KEYS: (keyof SpacingScale)[] = ["none", "xs", "sm", "md", "lg", "xl", "xxl"];
const RADIUS_KEYS: (keyof RadiusScale)[] = ["none", "sm", "md", "lg", "xl", "xxl", "pill"];
const FONT_SIZE_KEYS: (keyof FontSizeScale)[] = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"];
const ICON_SIZE_KEYS: (keyof IconSizeScale)[] = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"];
const SEMANTIC_ICON_KEYS: (keyof SemanticIconSizes)[] = ["inline", "compact", "control", "navigation", "feature", "hero"];
const CONTROL_SIZE_KEYS: (keyof ControlSizeScale)[] = ["xs", "sm", "md", "lg", "xl"];
const TOUCH_TARGET_KEYS: (keyof TouchTargetScale)[] = ["minimum", "recommended", "comfortable"];
const BORDER_WIDTH_KEYS: (keyof BorderWidthScale)[] = ["none", "thin", "medium", "thick"];
const AVATAR_SIZE_KEYS: (keyof AvatarSizeScale)[] = ["xs", "sm", "md", "lg", "xl", "xxl"];
const BREAKPOINT_KEYS: (keyof BreakpointScale)[] = ["sm", "md", "lg", "xl", "xxl"];
const LINE_HEIGHT_KEYS: (keyof LineHeightScale)[] = ["none", "tight", "snug", "normal", "relaxed", "loose"];
const FONT_WEIGHT_KEYS: (keyof FontWeightScale)[] = ["light", "regular", "medium", "semibold", "bold", "extrabold"];
const LETTER_SPACING_KEYS: (keyof LetterSpacingScale)[] = ["tight", "normal", "wide", "wider", "widest"];
const INTENT_KEYS: (keyof IntentStates)[] = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"];
const STATE_KEYS: (keyof StateColors)[] = ["hover", "pressed", "focused", "disabled"];
const ACCESSIBILITY_KEYS: (keyof AccessibilityReport)[] = [
  "primaryOnBackground", "secondaryOnBackground", "tertiaryOnBackground", "quaternaryOnBackground",
  "textOnBackground", "textOnSurface", "mutedOnBackground",
  "dangerOnBackground", "successOnBackground", "warningOnBackground", "infoOnBackground",
  "onPrimaryOnPrimary", "onSecondaryOnSecondary", "onTertiaryOnTertiary", "onQuaternaryOnQuaternary",
  "onBackgroundOnBackground", "onSurfaceOnSurface",
  "onDangerOnDanger", "onSuccessOnSuccess", "onWarningOnWarning", "onInfoOnInfo",
  "textOnCard", "textOnElevated", "textOnModal", "textOnPopover",
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

  const iconSizes = diffFlat(a.iconSizes, b.iconSizes, ICON_SIZE_KEYS);
  if (iconSizes) diff.iconSizes = iconSizes;

  const icons = diffFlat(a.icons, b.icons, SEMANTIC_ICON_KEYS);
  if (icons) diff.icons = icons;

  const controlSizes = diffFlat(a.controlSizes, b.controlSizes, CONTROL_SIZE_KEYS);
  if (controlSizes) diff.controlSizes = controlSizes;

  const touchTargets = diffFlat(a.touchTargets, b.touchTargets, TOUCH_TARGET_KEYS);
  if (touchTargets) diff.touchTargets = touchTargets;

  const borderWidths = diffFlat(a.borderWidths, b.borderWidths, BORDER_WIDTH_KEYS);
  if (borderWidths) diff.borderWidths = borderWidths;

  const avatarSizes = diffFlat(a.avatarSizes, b.avatarSizes, AVATAR_SIZE_KEYS);
  if (avatarSizes) diff.avatarSizes = avatarSizes;

  const breakpoints = diffFlat(a.breakpoints, b.breakpoints, BREAKPOINT_KEYS);
  if (breakpoints) diff.breakpoints = breakpoints;

  const lineHeights = diffFlat(a.lineHeights, b.lineHeights, LINE_HEIGHT_KEYS);
  if (lineHeights) diff.lineHeights = lineHeights;

  const fontWeights = diffFlat(a.fontWeights, b.fontWeights, FONT_WEIGHT_KEYS);
  if (fontWeights) diff.fontWeights = fontWeights;

  const letterSpacings = diffFlat(a.letterSpacings, b.letterSpacings, LETTER_SPACING_KEYS);
  if (letterSpacings) diff.letterSpacings = letterSpacings;

  if (a.baseFont !== b.baseFont) {
    diff.baseFont = { old: a.baseFont, new: b.baseFont };
  }
  if (a.fontScale !== b.fontScale) {
    diff.fontScale = { old: a.fontScale, new: b.fontScale };
  }
  if (a.fontFamilySans !== b.fontFamilySans) {
    diff.fontFamilySans = { old: a.fontFamilySans, new: b.fontFamilySans };
  }
  if (a.fontFamilyDisplay !== b.fontFamilyDisplay) {
    diff.fontFamilyDisplay = { old: a.fontFamilyDisplay, new: b.fontFamilyDisplay };
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
