import { isValidHex } from "./color-math.js";
import type { GeneratedTheme, GeneratedThemeMode, BaseColorKey } from "./types.js";

// ─── Shape Definitions ──────────────────────────────────────────────

const SEMANTIC_COLOR_KEYS = [
  "primary", "secondary", "tertiary", "quaternary", "background", "surface", "text",
  "muted", "border", "danger", "success", "warning", "info",
  "onPrimary", "onSecondary", "onTertiary", "onQuaternary", "onDanger", "onSuccess", "onWarning", "onInfo",
] as const;

const SURFACE_ELEVATION_KEYS = ["card", "elevated", "modal", "popover"] as const;

const SPACING_KEYS = ["none", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const RADIUS_KEYS = ["none", "sm", "md", "lg", "xl", "xxl", "pill"] as const;
const FONT_SIZE_KEYS = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"] as const;

const ICON_SIZE_KEYS = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"] as const;
const SIZE_MAP_KEYS  = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"] as const;
const DIMENSION_KEYS = ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"] as const;

const BASE_COLOR_KEYS: BaseColorKey[] = [
  "primary", "secondary", "tertiary", "quaternary",
  "background", "surface", "text", "muted", "border",
  "danger", "success", "warning", "info",
];

const WARNING_ACTIONS = new Set(["warn", "corrected"]);

const INTENT_KEYS = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"] as const;
const STATE_KEYS = ["hover", "pressed", "focused", "disabled"] as const;

const ACCESSIBILITY_KEYS = [
  "primaryOnBackground", "secondaryOnBackground", "tertiaryOnBackground", "quaternaryOnBackground",
  "textOnBackground", "textOnSurface", "mutedOnBackground",
  "dangerOnBackground", "successOnBackground", "warningOnBackground", "infoOnBackground",
  "onPrimaryOnPrimary", "onSecondaryOnSecondary", "onTertiaryOnTertiary", "onQuaternaryOnQuaternary",
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

function requireHex(v: unknown, path: string): void {
  if (typeof v !== "string" || !isValidHex(v)) {
    throw new Error(`${path}: expected hex color string, got ${JSON.stringify(v)}`);
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

function validateHexObject(obj: Record<string, unknown>, keys: readonly string[], path: string): void {
  requireKeys(obj, keys, path);
  for (const key of keys) {
    requireHex(obj[key], `${path}.${key}`);
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
  validateHexObject(requireObject(obj.colors, `${path}.colors`), SEMANTIC_COLOR_KEYS, `${path}.colors`);

  // surfaceElevation
  validateHexObject(requireObject(obj.surfaceElevation, `${path}.surfaceElevation`), SURFACE_ELEVATION_KEYS, `${path}.surfaceElevation`);

  // spacing
  validateNumberObject(requireObject(obj.spacing, `${path}.spacing`), SPACING_KEYS, `${path}.spacing`);

  // radius
  validateNumberObject(requireObject(obj.radius, `${path}.radius`), RADIUS_KEYS, `${path}.radius`);

  // fontSizes
  validateNumberObject(requireObject(obj.fontSizes, `${path}.fontSizes`), FONT_SIZE_KEYS, `${path}.fontSizes`);

  // iconSizes, sizeMap, dimensions
  validateNumberObject(requireObject(obj.iconSizes, `${path}.iconSizes`), ICON_SIZE_KEYS, `${path}.iconSizes`);
  validateNumberObject(requireObject(obj.sizeMap, `${path}.sizeMap`), SIZE_MAP_KEYS, `${path}.sizeMap`);
  validateNumberObject(requireObject(obj.dimensions, `${path}.dimensions`), DIMENSION_KEYS, `${path}.dimensions`);

  // fontLevel
  const fl = obj.fontLevel;
  if (typeof fl !== "number" || fl < 8 || fl > 18 || fl !== Math.floor(fl)) {
    throw new Error(`${path}.fontLevel: expected integer 8–18, got ${JSON.stringify(fl)}`);
  }

  // states
  const states = requireObject(obj.states, `${path}.states`);
  requireKeys(states, INTENT_KEYS, `${path}.states`);
  for (const intent of INTENT_KEYS) {
    validateHexObject(requireObject(states[intent], `${path}.states.${intent}`), STATE_KEYS, `${path}.states.${intent}`);
  }

  // accessibility
  const acc = requireObject(obj.accessibility, `${path}.accessibility`);
  requireKeys(acc, ACCESSIBILITY_KEYS, `${path}.accessibility`);
  for (const key of ACCESSIBILITY_KEYS) {
    const entry = requireObject(acc[key], `${path}.accessibility.${key}`);
    requireNumber(entry.ratio, `${path}.accessibility.${key}.ratio`);
    if (entry.level !== "AAA" && entry.level !== "AA" && entry.level !== "fail") {
      throw new Error(`${path}.accessibility.${key}.level: expected "AAA", "AA", or "fail", got ${JSON.stringify(entry.level)}`);
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
  requireHex(obj.value, `${path}.value`);
  requireHex(obj.background, `${path}.background`);
  requireNumber(obj.ratio, `${path}.ratio`);
  requireNumber(obj.required, `${path}.required`);
  if (!WARNING_ACTIONS.has(obj.action as string)) {
    throw new Error(`${path}.action: expected "warn" or "corrected", got ${JSON.stringify(obj.action)}`);
  }
  requireHex(obj.finalValue, `${path}.finalValue`);
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
