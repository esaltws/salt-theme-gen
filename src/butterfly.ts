import { hexToOklch, oklchToHex, clampOklch, lighten, mix } from "./color-math.js";
import { deriveOnColor, autoCorrectContrast } from "./on-colors.js";
import type { OKLCH, SemanticColors, SurfaceElevation, ColorHarmony } from "./types.js";

// ─── OKLCH Butterfly Rule ────────────────────────────────────────────
// Derives all 13 base colors + 8 "on" colors from a single primary.
// All derivation happens in OKLCH space for perceptual uniformity.

type DerivationRule = {
  L: number | ((primary: OKLCH) => number);
  C: number | ((primary: OKLCH) => number);
  H: number | ((primary: OKLCH) => number);
};

/**
 * Adjust L based on hue to compensate for perceptual brightness differences.
 * Yellow (H≈90°) appears brighter at the same L → lower L to compensate.
 * Blue (H≈265°) appears darker at the same L → raise L to compensate.
 */
export function adaptiveL(baseL: number, hue: number, amplitude: number = 0.05): number {
  const offset = -amplitude * Math.cos(((hue - 90) * Math.PI) / 180);
  return Math.max(0, Math.min(1, baseL + offset));
}

/**
 * Hue-aware secondary offset. Warm hues (red≈0°) get larger offsets (up to 120°)
 * because +60° produces colors that are perceptually too similar (red→orange).
 * Cool hues (cyan≈180°) keep 60° where analogous harmony works well.
 */
export function secondaryHueOffset(primaryH: number): number {
  const h = ((primaryH % 360) + 360) % 360;
  const t = (1 + Math.cos((h * Math.PI) / 180)) / 2; // 1 at H=0, 0 at H=180
  return 60 + 60 * t; // 60° (cool) → 120° (warm)
}

// ─── Color Harmony ──────────────────────────────────────────────────

type AccentSpec = { hueOffset: number; chromaMul: number };

export type HarmonyAccents = {
  secondary: AccentSpec;
  tertiary: AccentSpec;
  quaternary: AccentSpec;
};

/**
 * Resolve hue offsets and chroma multipliers for the 3 accent colors
 * based on the chosen color harmony strategy.
 *
 * "analogous" returns null — the caller should fall through to the
 * default LIGHT_RULES/DARK_RULES derivation for backward compatibility.
 */
export function resolveHarmonyAccents(
  primaryH: number,
  harmony: ColorHarmony | undefined
): HarmonyAccents | null {
  if (!harmony || harmony === "analogous") return null;

  switch (harmony) {
    case "complementary":
      return {
        secondary:  { hueOffset: 180, chromaMul: 1 },
        tertiary:   { hueOffset: 0,   chromaMul: 0.20 },
        quaternary: { hueOffset: 0,   chromaMul: 0.12 },
      };
    case "triadic":
      return {
        secondary:  { hueOffset: 120, chromaMul: 1 },
        tertiary:   { hueOffset: 240, chromaMul: 1 },
        quaternary: { hueOffset: 0,   chromaMul: 0.20 },
      };
    case "split-complementary":
      return {
        secondary:  { hueOffset: 150, chromaMul: 1 },
        tertiary:   { hueOffset: 210, chromaMul: 1 },
        quaternary: { hueOffset: 0,   chromaMul: 0.20 },
      };
    case "tetradic":
      return {
        secondary:  { hueOffset: 90,  chromaMul: 1 },
        tertiary:   { hueOffset: 180, chromaMul: 1 },
        quaternary: { hueOffset: 270, chromaMul: 1 },
      };
    case "monochromatic":
      return {
        secondary:  { hueOffset: 0, chromaMul: 0.60 },
        tertiary:   { hueOffset: 0, chromaMul: 0.35 },
        quaternary: { hueOffset: 0, chromaMul: 0.15 },
      };
  }
}

/** Options object for the new deriveColors API. */
export type DeriveColorsOptions = {
  harmony?: ColorHarmony;
  secondary?: string;
  tertiary?: string;
  quaternary?: string;
};

const LIGHT_RULES: Record<string, DerivationRule> = {
  primary:    { L: (p) => adaptiveL(0.55, p.H),        C: (p) => p.C,        H: (p) => p.H },
  secondary:  { L: (p) => { const sh = p.H + secondaryHueOffset(p.H); return adaptiveL(0.58, sh); },   C: (p) => p.C * 0.85, H: (p) => p.H + secondaryHueOffset(p.H) },
  tertiary:   { L: (p) => { const th = p.H + 2 * secondaryHueOffset(p.H); return adaptiveL(0.55, th); }, C: (p) => p.C * 0.75, H: (p) => (p.H + 2 * secondaryHueOffset(p.H)) % 360 },
  background: { L: 0.97,  C: (p) => p.C * 0.03, H: (p) => p.H },
  surface:    { L: 1.00,  C: 0,                 H: (p) => p.H },
  text:       { L: 0.13,  C: (p) => p.C * 0.05, H: (p) => p.H },
  muted:      { L: 0.55,  C: (p) => p.C * 0.12, H: (p) => p.H },
  border:     { L: 0.88,  C: (p) => p.C * 0.05, H: (p) => p.H },
  danger:     { L: 0.55,  C: 0.18,              H: 25 },
  success:    { L: 0.55,  C: 0.16,              H: 145 },
  warning:    { L: 0.62,  C: 0.16,              H: 80 },
  info:       { L: 0.55,  C: 0.14,              H: 235 },
};

const DARK_RULES: Record<string, DerivationRule> = {
  primary:    { L: (p) => adaptiveL(0.72, p.H, 0.04),       C: (p) => p.C,       H: (p) => p.H },
  secondary:  { L: (p) => { const sh = p.H + secondaryHueOffset(p.H); return adaptiveL(0.74, sh, 0.04); },  C: (p) => p.C * 0.8, H: (p) => p.H + secondaryHueOffset(p.H) },
  tertiary:   { L: (p) => { const th = p.H + 2 * secondaryHueOffset(p.H); return adaptiveL(0.72, th, 0.04); }, C: (p) => p.C * 0.7, H: (p) => (p.H + 2 * secondaryHueOffset(p.H)) % 360 },
  background: { L: 0.15,  C: (p) => p.C * 0.04, H: (p) => p.H },
  surface:    { L: 0.20,  C: (p) => p.C * 0.06, H: (p) => p.H },
  text:       { L: 0.97,  C: (p) => p.C * 0.03, H: (p) => p.H },
  muted:      { L: 0.65,  C: (p) => p.C * 0.12, H: (p) => p.H },
  border:     { L: 0.30,  C: (p) => p.C * 0.05, H: (p) => p.H },
  danger:     { L: 0.72,  C: 0.16,              H: 25 },
  success:    { L: 0.72,  C: 0.14,              H: 145 },
  warning:    { L: 0.75,  C: 0.14,              H: 80 },
  info:       { L: 0.72,  C: 0.12,              H: 235 },
};

function resolveValue(
  rule: number | ((primary: OKLCH) => number),
  primary: OKLCH
): number {
  return typeof rule === "function" ? rule(primary) : rule;
}

function applyRule(
  rule: DerivationRule,
  primary: OKLCH
): OKLCH {
  return clampOklch({
    L: resolveValue(rule.L, primary),
    C: resolveValue(rule.C, primary),
    H: resolveValue(rule.H, primary),
  });
}

/**
 * Derive all 21 semantic colors from a primary HEX using the OKLCH butterfly rule.
 *
 * Overloads:
 * - `deriveColors(hex, mode)` — default analogous harmony
 * - `deriveColors(hex, mode, options)` — new API with harmony + overrides
 * - `deriveColors(hex, mode, secondary?, tertiary?)` — legacy positional API
 */
export function deriveColors(
  primaryHex: string,
  mode: "light" | "dark",
  optionsOrSecondary?: DeriveColorsOptions | string,
  legacyTertiary?: string
): SemanticColors {
  // Normalize overloads into a single options object
  let opts: DeriveColorsOptions = {};
  if (typeof optionsOrSecondary === "string") {
    opts = { secondary: optionsOrSecondary, tertiary: legacyTertiary };
  } else if (optionsOrSecondary) {
    opts = optionsOrSecondary;
  } else if (legacyTertiary) {
    // deriveColors(hex, mode, undefined, tertiary) — legacy with no secondary
    opts = { tertiary: legacyTertiary };
  }

  const primary = hexToOklch(primaryHex);
  const rules = mode === "light" ? LIGHT_RULES : DARK_RULES;
  const harmonyAccents = resolveHarmonyAccents(primary.H, opts.harmony);

  // Derive 12 base colors from static rules
  const base: Record<string, string> = {};
  for (const [key, rule] of Object.entries(rules)) {
    base[key] = oklchToHex(applyRule(rule, primary));
  }

  // When a non-analogous harmony is active, re-derive accent hues
  if (harmonyAccents) {
    const baseL = mode === "light" ? 0.55 : 0.72;
    const amp = mode === "light" ? 0.05 : 0.04;
    const baseCMul = mode === "light" ? 0.85 : 0.8;

    for (const [name, spec] of Object.entries(harmonyAccents) as [keyof HarmonyAccents, AccentSpec][]) {
      const h = (primary.H + spec.hueOffset) % 360;
      const L = adaptiveL(baseL, h, amp);
      const C = primary.C * baseCMul * spec.chromaMul;
      base[name] = oklchToHex(clampOklch({ L, C, H: h }));
    }
  } else {
    // Analogous: quaternary = primary - secondaryHueOffset * 0.5
    const qHue = (primary.H - secondaryHueOffset(primary.H) * 0.5 + 360) % 360;
    const baseL = mode === "light" ? 0.55 : 0.72;
    const amp = mode === "light" ? 0.05 : 0.04;
    const cMul = mode === "light" ? 0.70 : 0.65;
    base.quaternary = oklchToHex(clampOklch({
      L: adaptiveL(baseL, qHue, amp),
      C: primary.C * cMul,
      H: qHue,
    }));
  }

  // Auto-correct intent colors against background for WCAG AA (4.5:1)
  // This runs BEFORE explicit overrides so user-provided colors are respected.
  const autoCorrectKeys = [
    "primary", "secondary", "tertiary", "quaternary",
    "danger", "success", "warning", "info",
  ] as const;
  for (const key of autoCorrectKeys) {
    base[key] = autoCorrectContrast(base[key], base.background, 4.5);
  }
  // Auto-correct muted at 3.0:1 (large text / UI element threshold)
  base.muted = autoCorrectContrast(base.muted, base.background, 3.0);

  // Apply explicit overrides (user intent wins — no auto-correction)
  if (opts.secondary) base.secondary = opts.secondary;
  if (opts.tertiary) base.tertiary = opts.tertiary;
  if (opts.quaternary) base.quaternary = opts.quaternary;

  // Derive 10 "on" colors with WCAG auto-correction
  const onPrimary    = deriveOnColor(base.primary);
  const onSecondary  = deriveOnColor(base.secondary);
  const onTertiary   = deriveOnColor(base.tertiary);
  const onQuaternary = deriveOnColor(base.quaternary);
  const onBackground = deriveOnColor(base.background);
  const onSurface    = deriveOnColor(base.surface);
  const onDanger     = deriveOnColor(base.danger);
  const onSuccess    = deriveOnColor(base.success);
  const onWarning    = deriveOnColor(base.warning);
  const onInfo       = deriveOnColor(base.info);

  return {
    primary: base.primary,
    secondary: base.secondary,
    tertiary: base.tertiary,
    quaternary: base.quaternary,
    background: base.background,
    surface: base.surface,
    text: base.text,
    muted: base.muted,
    border: base.border,
    danger: base.danger,
    success: base.success,
    warning: base.warning,
    info: base.info,
    onPrimary,
    onSecondary,
    onTertiary,
    onQuaternary,
    onBackground,
    onSurface,
    onDanger,
    onSuccess,
    onWarning,
    onInfo,
  };
}

/**
 * Derive 4 surface elevation levels for visual depth.
 * Dark mode: progressively lighten the base surface.
 * Light mode: tint the base surface with primary at increasing ratios.
 */
export function deriveSurfaceElevation(
  surface: string,
  primary: string,
  mode: "light" | "dark"
): SurfaceElevation {
  if (mode === "dark") {
    return {
      card:     lighten(surface, 0.03),
      elevated: lighten(surface, 0.06),
      modal:    lighten(surface, 0.10),
      popover:  lighten(surface, 0.14),
    };
  }
  // Light mode: subtle primary tinting
  return {
    card:     mix(surface, primary, 0.02),
    elevated: mix(surface, primary, 0.04),
    modal:    mix(surface, primary, 0.06),
    popover:  mix(surface, primary, 0.08),
  };
}
