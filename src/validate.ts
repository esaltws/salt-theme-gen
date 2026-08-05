import { parseColor } from "./color-math.js";
import type { GeneratedTheme, GeneratedThemeMode, BaseColorKey } from "./types.js";

const HSL_RE = /^hsla?\(\s*-?[\d.]+[\s,][\s\S]*?\)/i;

// ─── Shape Definitions ──────────────────────────────────────────────

const SEMANTIC_COLOR_KEYS = [
  "primary", "secondary", "tertiary", "quaternary", "background", "surface", "text",
  "muted", "border", "danger", "success", "warning", "info",
  "onPrimary", "onSecondary", "onTertiary", "onQuaternary",
  "onBackground", "onSurface",
  "onDanger", "onSuccess", "onWarning", "onInfo",
] as const;

const SURFACE_ELEVATION_KEYS = ["card", "elevated", "modal", "popover"] as const;

const SPACING_KEYS = ["none", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const RADIUS_KEYS = ["none", "sm", "md", "lg", "xl", "xxl", "pill"] as const;
const FONT_SIZE_KEYS = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"] as const;

const ICON_SIZE_KEYS = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"] as const;
const SEMANTIC_ICON_KEYS = ["inline", "compact", "control", "navigation", "feature", "hero"] as const;
const BORDER_WIDTH_KEYS = ["none", "thin", "medium", "thick"] as const;
const AVATAR_SIZE_KEYS = ["xs", "sm", "md", "lg", "xl", "xxl"] as const;
const BREAKPOINT_KEYS = ["sm", "md", "lg", "xl", "xxl"] as const;
const SIZE_MAP_KEYS  = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"] as const;
const DIMENSION_KEYS = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"] as const;

const BASE_COLOR_KEYS: BaseColorKey[] = [
  "primary", "secondary", "tertiary", "quaternary",
  "background", "surface", "text", "muted", "border",
  "danger", "success", "warning", "info",
];

const WARNING_ACTIONS = new Set(["warn", "corrected"]);

const TYPOGRAPHY_SCALE_KEYS = ["caption", "labelSmall", "labelMedium", "bodySmall", "bodyMedium", "bodyLarge", "titleSmall", "titleMedium", "titleLarge", "display"] as const;
const LINE_HEIGHT_KEYS = ["none", "tight", "snug", "normal", "relaxed", "loose"] as const;
const FONT_WEIGHT_KEYS = ["light", "regular", "medium", "semibold", "bold", "extrabold"] as const;
const LETTER_SPACING_KEYS = ["tight", "normal", "wide", "wider", "widest"] as const;

const TONAL_PALETTE_KEYS = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"] as const;
const TONAL_STEP_STR_KEYS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"] as const;

const INTENT_KEYS = TONAL_PALETTE_KEYS;
const STATE_KEYS = ["hover", "pressed", "focused", "disabled"] as const;

const ACCESSIBILITY_KEYS = [
  "primaryOnBackground", "secondaryOnBackground", "tertiaryOnBackground", "quaternaryOnBackground",
  "textOnBackground", "textOnSurface", "mutedOnBackground",
  "dangerOnBackground", "successOnBackground", "warningOnBackground", "infoOnBackground",
  "onPrimaryOnPrimary", "onSecondaryOnSecondary", "onTertiaryOnTertiary", "onQuaternaryOnQuaternary",
  "onBackgroundOnBackground", "onSurfaceOnSurface",
  "onDangerOnDanger", "onSuccessOnSuccess", "onWarningOnWarning", "onInfoOnInfo",
  "textOnCard", "textOnElevated", "textOnModal", "textOnPopover",
] as const;

// ─── Helpers ────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function requireObject(v: unknown, path: string): Record<string, unknown> {
  if (!isObject(v)) throw new Error(`${path}: expected object, got ${typeof v}`);
  return v;
}

function isValidColor(v: string): boolean {
  if (HSL_RE.test(v)) return true;
  try { parseColor(v); return true; } catch { return false; }
}

function requireColor(v: unknown, path: string): void {
  if (typeof v !== "string" || !isValidColor(v)) {
    throw new Error(`${path}: expected CSS color string (hex, oklch, rgb, hsl), got ${JSON.stringify(v)}`);
  }
}

function requireNumber(v: unknown, path: string): void {
  if (typeof v !== "number" || !isFinite(v)) {
    throw new Error(`${path}: expected number, got ${JSON.stringify(v)}`);
  }
}

function requireKeys(obj: Record<string, unknown>, keys: readonly string[], path: string): void {
  for (const key of keys) {
    if (!(key in obj)) {
      throw new Error(`${path}: missing required key "${key}"`);
    }
  }
}

function validateColorObject(obj: Record<string, unknown>, keys: readonly string[], path: string): void {
  requireKeys(obj, keys, path);
  for (const key of keys) {
    requireColor(obj[key], `${path}.${key}`);
  }
}

function validateNumberObject(obj: Record<string, unknown>, keys: readonly string[], path: string): void {
  requireKeys(obj, keys, path);
  for (const key of keys) {
    requireNumber(obj[key], `${path}.${key}`);
  }
}

// ─── Mode Validator ─────────────────────────────────────────────────

function validateMode(v: unknown, path: string): void {
  const obj = requireObject(v, path);

  // mode
  if (obj.mode !== "light" && obj.mode !== "dark") {
    throw new Error(`${path}.mode: expected "light" or "dark", got ${JSON.stringify(obj.mode)}`);
  }

  // colors
  validateColorObject(requireObject(obj.colors, `${path}.colors`), SEMANTIC_COLOR_KEYS, `${path}.colors`);

  // palettes
  const palettes = requireObject(obj.palettes, `${path}.palettes`);
  requireKeys(palettes, TONAL_PALETTE_KEYS, `${path}.palettes`);
  for (const key of TONAL_PALETTE_KEYS) {
    validateColorObject(
      requireObject(palettes[key], `${path}.palettes.${key}`),
      TONAL_STEP_STR_KEYS,
      `${path}.palettes.${key}`
    );
  }

  // surfaceElevation
  validateColorObject(requireObject(obj.surfaceElevation, `${path}.surfaceElevation`), SURFACE_ELEVATION_KEYS, `${path}.surfaceElevation`);

  // spacing
  validateNumberObject(requireObject(obj.spacing, `${path}.spacing`), SPACING_KEYS, `${path}.spacing`);

  // radius
  validateNumberObject(requireObject(obj.radius, `${path}.radius`), RADIUS_KEYS, `${path}.radius`);

  // fontSizes
  validateNumberObject(requireObject(obj.fontSizes, `${path}.fontSizes`), FONT_SIZE_KEYS, `${path}.fontSizes`);

  // iconSizes, semantic icons, borderWidths, avatarSizes, breakpoints
  validateNumberObject(requireObject(obj.iconSizes, `${path}.iconSizes`), ICON_SIZE_KEYS, `${path}.iconSizes`);
  validateNumberObject(requireObject(obj.icons, `${path}.icons`), SEMANTIC_ICON_KEYS, `${path}.icons`);
  validateNumberObject(requireObject(obj.borderWidths, `${path}.borderWidths`), BORDER_WIDTH_KEYS, `${path}.borderWidths`);
  validateNumberObject(requireObject(obj.avatarSizes, `${path}.avatarSizes`), AVATAR_SIZE_KEYS, `${path}.avatarSizes`);
  validateNumberObject(requireObject(obj.breakpoints, `${path}.breakpoints`), BREAKPOINT_KEYS, `${path}.breakpoints`);

  // sizeMap, dimensions
  validateNumberObject(requireObject(obj.sizeMap, `${path}.sizeMap`), SIZE_MAP_KEYS, `${path}.sizeMap`);
  validateNumberObject(requireObject(obj.dimensions, `${path}.dimensions`), DIMENSION_KEYS, `${path}.dimensions`);

  // baseFont
  const bf = obj.baseFont;
  if (typeof bf !== "number" || !isFinite(bf) || bf < 8) {
    throw new Error(`${path}.baseFont: expected number >= 8, got ${JSON.stringify(bf)}`);
  }

  // fontScale
  const fs = obj.fontScale;
  if (typeof fs !== "number" || !isFinite(fs) || fs <= 0) {
    throw new Error(`${path}.fontScale: expected positive number, got ${JSON.stringify(fs)}`);
  }

  // fontFamilySans / fontFamilyDisplay (optional strings)
  if (obj.fontFamilySans !== undefined && typeof obj.fontFamilySans !== "string") {
    throw new Error(`${path}.fontFamilySans: expected string, got ${JSON.stringify(obj.fontFamilySans)}`);
  }
  if (obj.fontFamilyDisplay !== undefined && typeof obj.fontFamilyDisplay !== "string") {
    throw new Error(`${path}.fontFamilyDisplay: expected string, got ${JSON.stringify(obj.fontFamilyDisplay)}`);
  }

  // typography
  const typo = requireObject(obj.typography, `${path}.typography`);
  requireKeys(typo, TYPOGRAPHY_SCALE_KEYS, `${path}.typography`);
  for (const key of TYPOGRAPHY_SCALE_KEYS) {
    const style = requireObject(typo[key], `${path}.typography.${key}`);
    requireNumber(style.fontSize,      `${path}.typography.${key}.fontSize`);
    requireNumber(style.lineHeight,    `${path}.typography.${key}.lineHeight`);
    requireNumber(style.letterSpacing, `${path}.typography.${key}.letterSpacing`);
    if (![400, 500, 600, 700].includes(style.fontWeight as number)) {
      throw new Error(`${path}.typography.${key}.fontWeight: expected 400|500|600|700, got ${JSON.stringify(style.fontWeight)}`);
    }
  }

  // lineHeights
  validateNumberObject(requireObject(obj.lineHeights, `${path}.lineHeights`), LINE_HEIGHT_KEYS, `${path}.lineHeights`);

  // fontWeights
  validateNumberObject(requireObject(obj.fontWeights, `${path}.fontWeights`), FONT_WEIGHT_KEYS, `${path}.fontWeights`);

  // letterSpacings
  validateNumberObject(requireObject(obj.letterSpacings, `${path}.letterSpacings`), LETTER_SPACING_KEYS, `${path}.letterSpacings`);

  // states
  const states = requireObject(obj.states, `${path}.states`);
  requireKeys(states, INTENT_KEYS, `${path}.states`);
  for (const intent of INTENT_KEYS) {
    validateColorObject(requireObject(states[intent], `${path}.states.${intent}`), STATE_KEYS, `${path}.states.${intent}`);
  }

  // accessibility (WCAG)
  const acc = requireObject(obj.accessibility, `${path}.accessibility`);
  requireKeys(acc, ACCESSIBILITY_KEYS, `${path}.accessibility`);
  for (const key of ACCESSIBILITY_KEYS) {
    const entry = requireObject(acc[key], `${path}.accessibility.${key}`);
    requireNumber(entry.ratio, `${path}.accessibility.${key}.ratio`);
    if (entry.level !== "AAA" && entry.level !== "AA" && entry.level !== "fail") {
      throw new Error(`${path}.accessibility.${key}.level: expected "AAA", "AA", or "fail", got ${JSON.stringify(entry.level)}`);
    }
  }

  // apca
  const apca = requireObject(obj.apca, `${path}.apca`);
  requireKeys(apca, ACCESSIBILITY_KEYS, `${path}.apca`);
  for (const key of ACCESSIBILITY_KEYS) {
    const entry = requireObject(apca[key], `${path}.apca.${key}`);
    requireNumber(entry.lc, `${path}.apca.${key}.lc`);
    if (entry.level !== "Lc75" && entry.level !== "Lc60" && entry.level !== "Lc45" && entry.level !== "fail") {
      throw new Error(`${path}.apca.${key}.level: expected "Lc75", "Lc60", "Lc45", or "fail", got ${JSON.stringify(entry.level)}`);
    }
  }
}

// ─── Warning Validator ───────────────────────────────────────────────

function validateThemeWarning(v: unknown, path: string): void {
  const obj = requireObject(v, path);
  if (obj.mode !== "light" && obj.mode !== "dark") {
    throw new Error(`${path}.mode: expected "light" or "dark", got ${JSON.stringify(obj.mode)}`);
  }
  if (!BASE_COLOR_KEYS.includes(obj.key as BaseColorKey)) {
    throw new Error(`${path}.key: expected BaseColorKey, got ${JSON.stringify(obj.key)}`);
  }
  requireColor(obj.value, `${path}.value`);
  requireColor(obj.background, `${path}.background`);
  requireNumber(obj.ratio, `${path}.ratio`);
  requireNumber(obj.required, `${path}.required`);
  if (!WARNING_ACTIONS.has(obj.action as string)) {
    throw new Error(`${path}.action: expected "warn" or "corrected", got ${JSON.stringify(obj.action)}`);
  }
  requireColor(obj.finalValue, `${path}.finalValue`);
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Parse and validate a JSON-deserialized object as a GeneratedTheme.
 * Throws a descriptive error if the shape doesn't match.
 *
 * @example
 * const raw = JSON.parse(await AsyncStorage.getItem("theme"));
 * const theme = parseThemeJSON(raw); // throws if corrupted
 */
export function parseThemeJSON(value: unknown): GeneratedTheme {
  const obj = requireObject(value, "theme");
  requireKeys(obj, ["light", "dark"], "theme");
  validateMode(obj.light, "theme.light");
  validateMode(obj.dark, "theme.dark");

  const light = obj.light as GeneratedThemeMode;
  const dark = obj.dark as GeneratedThemeMode;

  if (light.mode !== "light") {
    throw new Error(`theme.light.mode: expected "light", got ${JSON.stringify(light.mode)}`);
  }
  if (dark.mode !== "dark") {
    throw new Error(`theme.dark.mode: expected "dark", got ${JSON.stringify(dark.mode)}`);
  }

  // warnings — optional, validate shape if present
  if ("warnings" in obj && obj.warnings !== undefined) {
    if (!Array.isArray(obj.warnings)) {
      throw new Error(`theme.warnings: expected array, got ${typeof obj.warnings}`);
    }
    for (let i = 0; i < obj.warnings.length; i++) {
      validateThemeWarning(obj.warnings[i], `theme.warnings[${i}]`);
    }
  }

  return { light, dark, ...(obj.warnings !== undefined && { warnings: obj.warnings as GeneratedTheme["warnings"] }) };
}
