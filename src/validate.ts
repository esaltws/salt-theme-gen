import { parseColor } from "./color-math.js";
import type { GeneratedTheme, GeneratedThemeColors, GeneratedThemeTokens, BaseColorKey, TokenWarning } from "./types.js";

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
const CONTROL_SIZE_KEYS = ["xs", "sm", "md", "lg", "xl"] as const;
const TOUCH_TARGET_KEYS = ["minimum", "recommended", "comfortable"] as const;
const BORDER_WIDTH_KEYS = ["none", "thin", "medium", "thick"] as const;
const AVATAR_SIZE_KEYS = ["xs", "sm", "md", "lg", "xl", "xxl"] as const;
const BREAKPOINT_KEYS = ["sm", "md", "lg", "xl", "xxl"] as const;
const SIZE_MAP_KEYS  = CONTROL_SIZE_KEYS;
const DIMENSION_KEYS = CONTROL_SIZE_KEYS;

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

// ─── Shape Helpers ──────────────────────────────────────────────────

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

// ─── Colors Mode Validator ──────────────────────────────────────────

function validateMode(v: unknown, path: string): void {
  const obj = requireObject(v, path);

  if (obj.mode !== "light" && obj.mode !== "dark") {
    throw new Error(`${path}.mode: expected "light" or "dark", got ${JSON.stringify(obj.mode)}`);
  }

  validateColorObject(requireObject(obj.colors, `${path}.colors`), SEMANTIC_COLOR_KEYS, `${path}.colors`);

  const palettes = requireObject(obj.palettes, `${path}.palettes`);
  requireKeys(palettes, TONAL_PALETTE_KEYS, `${path}.palettes`);
  for (const key of TONAL_PALETTE_KEYS) {
    validateColorObject(
      requireObject(palettes[key], `${path}.palettes.${key}`),
      TONAL_STEP_STR_KEYS,
      `${path}.palettes.${key}`
    );
  }

  validateColorObject(requireObject(obj.surfaceElevation, `${path}.surfaceElevation`), SURFACE_ELEVATION_KEYS, `${path}.surfaceElevation`);

  const states = requireObject(obj.states, `${path}.states`);
  requireKeys(states, INTENT_KEYS, `${path}.states`);
  for (const intent of INTENT_KEYS) {
    validateColorObject(requireObject(states[intent], `${path}.states.${intent}`), STATE_KEYS, `${path}.states.${intent}`);
  }

  const acc = requireObject(obj.accessibility, `${path}.accessibility`);
  requireKeys(acc, ACCESSIBILITY_KEYS, `${path}.accessibility`);
  for (const key of ACCESSIBILITY_KEYS) {
    const entry = requireObject(acc[key], `${path}.accessibility.${key}`);
    requireNumber(entry.ratio, `${path}.accessibility.${key}.ratio`);
    if (entry.level !== "AAA" && entry.level !== "AA" && entry.level !== "fail") {
      throw new Error(`${path}.accessibility.${key}.level: expected "AAA", "AA", or "fail", got ${JSON.stringify(entry.level)}`);
    }
  }

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

// ─── Tokens Shape Validator ─────────────────────────────────────────

function validateTokens(v: unknown, path: string): void {
  const obj = requireObject(v, path);

  validateNumberObject(requireObject(obj.spacing, `${path}.spacing`), SPACING_KEYS, `${path}.spacing`);
  validateNumberObject(requireObject(obj.radius, `${path}.radius`), RADIUS_KEYS, `${path}.radius`);
  validateNumberObject(requireObject(obj.fontSizes, `${path}.fontSizes`), FONT_SIZE_KEYS, `${path}.fontSizes`);
  validateNumberObject(requireObject(obj.iconSizes, `${path}.iconSizes`), ICON_SIZE_KEYS, `${path}.iconSizes`);
  validateNumberObject(requireObject(obj.icons, `${path}.icons`), SEMANTIC_ICON_KEYS, `${path}.icons`);
  validateNumberObject(requireObject(obj.controlSizes, `${path}.controlSizes`), CONTROL_SIZE_KEYS, `${path}.controlSizes`);
  validateNumberObject(requireObject(obj.touchTargets, `${path}.touchTargets`), TOUCH_TARGET_KEYS, `${path}.touchTargets`);
  validateNumberObject(requireObject(obj.borderWidths, `${path}.borderWidths`), BORDER_WIDTH_KEYS, `${path}.borderWidths`);
  validateNumberObject(requireObject(obj.avatarSizes, `${path}.avatarSizes`), AVATAR_SIZE_KEYS, `${path}.avatarSizes`);
  validateNumberObject(requireObject(obj.breakpoints, `${path}.breakpoints`), BREAKPOINT_KEYS, `${path}.breakpoints`);
  validateNumberObject(requireObject(obj.sizeMap, `${path}.sizeMap`), SIZE_MAP_KEYS, `${path}.sizeMap`);
  validateNumberObject(requireObject(obj.dimensions, `${path}.dimensions`), DIMENSION_KEYS, `${path}.dimensions`);

  const bf = obj.baseFont;
  if (typeof bf !== "number" || !isFinite(bf) || bf < 8) {
    throw new Error(`${path}.baseFont: expected number >= 8, got ${JSON.stringify(bf)}`);
  }

  const fs = obj.fontScale;
  if (typeof fs !== "number" || !isFinite(fs) || fs <= 0) {
    throw new Error(`${path}.fontScale: expected positive number, got ${JSON.stringify(fs)}`);
  }

  if (obj.fontFamilySans !== undefined && typeof obj.fontFamilySans !== "string") {
    throw new Error(`${path}.fontFamilySans: expected string, got ${JSON.stringify(obj.fontFamilySans)}`);
  }
  if (obj.fontFamilyDisplay !== undefined && typeof obj.fontFamilyDisplay !== "string") {
    throw new Error(`${path}.fontFamilyDisplay: expected string, got ${JSON.stringify(obj.fontFamilyDisplay)}`);
  }

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

  validateNumberObject(requireObject(obj.lineHeights, `${path}.lineHeights`), LINE_HEIGHT_KEYS, `${path}.lineHeights`);
  validateNumberObject(requireObject(obj.fontWeights, `${path}.fontWeights`), FONT_WEIGHT_KEYS, `${path}.fontWeights`);
  validateNumberObject(requireObject(obj.letterSpacings, `${path}.letterSpacings`), LETTER_SPACING_KEYS, `${path}.letterSpacings`);
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

// ─── Token Value Validator ──────────────────────────────────────────
// Runs after shape validation; shape is already proven correct so all casts are safe.

function validateTokenValues(obj: Record<string, unknown>, path: string): TokenWarning[] {
  const result: TokenWarning[] = [];

  const e = (p: string, rule: string, value: unknown, message: string): void => {
    result.push({ path: p, rule, value, severity: "error", message });
  };
  const w = (p: string, rule: string, value: unknown, message: string): void => {
    result.push({ path: p, rule, value, severity: "warning", message });
  };

  // ── Errors ─────────────────────────────────────────────────────────

  // Negative values across all numeric pixel scales
  const noNegative = (scale: Record<string, unknown>, scalePath: string): void => {
    for (const [key, val] of Object.entries(scale)) {
      if (typeof val === "number" && val < 0) {
        e(`${scalePath}.${key}`, "no-negative", val,
          `${scalePath}.${key} must not be negative (got ${val})`);
      }
    }
  };
  noNegative(obj.spacing     as Record<string, unknown>, `${path}.spacing`);
  noNegative(obj.radius      as Record<string, unknown>, `${path}.radius`);
  noNegative(obj.fontSizes   as Record<string, unknown>, `${path}.fontSizes`);
  noNegative(obj.iconSizes   as Record<string, unknown>, `${path}.iconSizes`);
  noNegative(obj.icons       as Record<string, unknown>, `${path}.icons`);
  noNegative(obj.controlSizes as Record<string, unknown>, `${path}.controlSizes`);
  noNegative(obj.touchTargets as Record<string, unknown>, `${path}.touchTargets`);
  noNegative(obj.borderWidths as Record<string, unknown>, `${path}.borderWidths`);
  noNegative(obj.avatarSizes  as Record<string, unknown>, `${path}.avatarSizes`);
  noNegative(obj.breakpoints  as Record<string, unknown>, `${path}.breakpoints`);
  noNegative(obj.sizeMap      as Record<string, unknown>, `${path}.sizeMap`);
  noNegative(obj.dimensions   as Record<string, unknown>, `${path}.dimensions`);

  // Typography: non-positive lineHeight, negative fontSize
  const typo = obj.typography as Record<string, Record<string, number>>;
  for (const key of TYPOGRAPHY_SCALE_KEYS) {
    const { fontSize: fs, lineHeight: lh } = typo[key];
    if (lh <= 0) {
      e(`${path}.typography.${key}.lineHeight`, "positive-line-height", lh,
        `typography.${key}.lineHeight must be > 0 (got ${lh})`);
    }
    if (fs < 0) {
      e(`${path}.typography.${key}.fontSize`, "no-negative", fs,
        `typography.${key}.fontSize must not be negative (got ${fs})`);
    }
  }

  // Descending breakpoints — must be strictly ascending
  const bp = obj.breakpoints as Record<string, number>;
  for (let i = 0; i < BREAKPOINT_KEYS.length - 1; i++) {
    const k1 = BREAKPOINT_KEYS[i], k2 = BREAKPOINT_KEYS[i + 1];
    if (bp[k1] >= bp[k2]) {
      e(`${path}.breakpoints.${k2}`, "ascending-breakpoints", bp[k2],
        `breakpoints must be strictly ascending: ${k1} (${bp[k1]}) must be < ${k2} (${bp[k2]})`);
    }
  }

  // Invalid modular ratio — fontScale must be > 1 (shape check already ensures > 0)
  const fontScale = obj.fontScale as number;
  if (fontScale <= 1) {
    e(`${path}.fontScale`, "valid-font-scale", fontScale,
      `fontScale must be > 1 for a proper modular scale — a ratio of ${fontScale} produces a flat or inverted size progression`);
  }

  // ── Warnings ────────────────────────────────────────────────────────

  // Touch targets: WCAG 2.5.8 absolute floor is 24px; Apple HIG / Material recommended is 44px
  const tt = obj.touchTargets as Record<string, number>;
  for (const key of TOUCH_TARGET_KEYS) {
    if (tt[key] < 24) {
      w(`${path}.touchTargets.${key}`, "touch-target-minimum-24", tt[key],
        `touchTargets.${key} (${tt[key]}px) is below the WCAG 2.5.8 absolute minimum of 24px`);
    }
  }
  if (tt.recommended < 44) {
    w(`${path}.touchTargets.recommended`, "touch-target-recommended-44", tt.recommended,
      `touchTargets.recommended (${tt.recommended}px) is below the Apple HIG / Material minimum of 44px`);
  }

  // Body text minimum legibility
  for (const key of ["bodySmall", "bodyMedium", "bodyLarge"] as const) {
    const fs = typo[key].fontSize;
    if (fs > 0 && fs < 12) {
      w(`${path}.typography.${key}.fontSize`, "body-text-minimum-12", fs,
        `typography.${key}.fontSize (${fs}px) is below the recommended minimum of 12px for body text`);
    }
  }

  // Alias consistency: sizeMap and dimensions are deprecated mirrors of controlSizes
  const cs  = obj.controlSizes as Record<string, number>;
  const sm  = obj.sizeMap      as Record<string, number>;
  const dim = obj.dimensions   as Record<string, number>;
  for (const key of CONTROL_SIZE_KEYS) {
    if (sm[key] !== cs[key]) {
      w(`${path}.sizeMap.${key}`, "alias-consistency", sm[key],
        `sizeMap.${key} (${sm[key]}) disagrees with controlSizes.${key} (${cs[key]})`);
    }
    if (dim[key] !== cs[key]) {
      w(`${path}.dimensions.${key}`, "alias-consistency", dim[key],
        `dimensions.${key} (${dim[key]}) disagrees with controlSizes.${key} (${cs[key]})`);
    }
  }

  // Unusually compressed typography (body, title, display styles)
  for (const key of ["bodySmall", "bodyMedium", "bodyLarge", "titleSmall", "titleMedium", "titleLarge", "display"] as const) {
    const lh = typo[key].lineHeight;
    if (lh > 0 && lh < 1.1) {
      w(`${path}.typography.${key}.lineHeight`, "compressed-line-height", lh,
        `typography.${key}.lineHeight (${lh}) is unusually compressed — body and title text generally needs ≥ 1.1`);
    }
  }

  // Descending visual scales (spacing, radius, fontSizes should all be ascending)
  const checkAscending = (scale: Record<string, number>, scalePath: string, order: readonly string[]): void => {
    for (let i = 0; i < order.length - 1; i++) {
      const a = scale[order[i]], b = scale[order[i + 1]];
      if (a > b) {
        w(`${scalePath}.${order[i + 1]}`, "ascending-scale", b,
          `${scalePath}.${order[i]} (${a}) > ${scalePath}.${order[i + 1]} (${b}) — scale is not ascending`);
      }
    }
  };
  checkAscending(obj.spacing   as Record<string, number>, `${path}.spacing`,   ["none", "xs", "sm", "md", "lg", "xl", "xxl"]);
  checkAscending(obj.radius    as Record<string, number>, `${path}.radius`,    ["none", "sm", "md", "lg", "xl", "xxl"]);
  checkAscending(obj.fontSizes as Record<string, number>, `${path}.fontSizes`, ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"]);

  return result;
}

// ─── Public API ─────────────────────────────────────────────────────

export type ParseThemeResult = {
  theme: GeneratedTheme;
  /**
   * Semantic token diagnostics. `severity: "error"` entries identify values
   * that are structurally invalid (negative sizes, descending breakpoints, etc.).
   * `severity: "warning"` entries identify non-recommended but permissible values.
   * Shape errors (wrong types, missing fields) are still thrown as exceptions.
   */
  tokenWarnings: TokenWarning[];
};

/**
 * Parse and validate a JSON-deserialized object as a GeneratedTheme.
 *
 * - **Shape errors** (wrong types, missing fields, non-finite numbers) throw.
 * - **Token validity** (negative sizes, bad ratios, descending breakpoints, etc.)
 *   are returned as `tokenWarnings` with `severity: "error"`.
 * - **Non-recommended values** (small touch targets, body text < 12px, etc.)
 *   are returned as `tokenWarnings` with `severity: "warning"`.
 *
 * @example
 * const raw = JSON.parse(await AsyncStorage.getItem("theme"));
 * const { theme, tokenWarnings } = parseThemeJSON(raw);
 * const errors = tokenWarnings.filter(w => w.severity === "error");
 * if (errors.length) throw new Error(errors.map(e => e.message).join("\n"));
 */
export function parseThemeJSON(value: unknown): ParseThemeResult {
  const obj = requireObject(value, "theme");
  requireKeys(obj, ["light", "dark", "tokens"], "theme");
  validateMode(obj.light, "theme.light");
  validateMode(obj.dark, "theme.dark");
  validateTokens(obj.tokens, "theme.tokens");

  const light  = obj.light  as GeneratedThemeColors;
  const dark   = obj.dark   as GeneratedThemeColors;
  const tokens = obj.tokens as GeneratedThemeTokens;

  if (light.mode !== "light") {
    throw new Error(`theme.light.mode: expected "light", got ${JSON.stringify(light.mode)}`);
  }
  if (dark.mode !== "dark") {
    throw new Error(`theme.dark.mode: expected "dark", got ${JSON.stringify(dark.mode)}`);
  }

  if ("warnings" in obj && obj.warnings !== undefined) {
    if (!Array.isArray(obj.warnings)) {
      throw new Error(`theme.warnings: expected array, got ${typeof obj.warnings}`);
    }
    for (let i = 0; i < obj.warnings.length; i++) {
      validateThemeWarning(obj.warnings[i], `theme.warnings[${i}]`);
    }
  }

  const theme: GeneratedTheme = {
    light, dark, tokens,
    ...(obj.warnings !== undefined && { warnings: obj.warnings as GeneratedTheme["warnings"] }),
  };

  const tokenWarnings = validateTokenValues(
    obj.tokens as Record<string, unknown>,
    "theme.tokens"
  );

  return { theme, tokenWarnings };
}
