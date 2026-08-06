import {
  relativeLuminance,
  contrastRatio,
  apcaContrast,
  hexToOklch,
  oklchToHex,
  clampOklch,
} from "./color-math.js";

// Inverse sRGB gamma: linear [0,1] → gray hex.
// roundUp=true → ceil the channel (makes color lighter, safe for dark-bg case).
// roundUp=false → floor the channel (makes color darker, safe for light-bg case).
function linearToGrayHex(L: number, roundUp: boolean): string {
  const s = L <= 0.0031308 ? L * 12.92 : 1.055 * Math.pow(L, 1 / 2.4) - 0.055;
  const raw = Math.max(0, Math.min(1, s)) * 255;
  const c = (roundUp ? Math.ceil(raw) : Math.floor(raw)).toString(16).padStart(2, "0");
  return `#${c}${c}${c}`;
}
import type { SemanticColors, SurfaceElevation, AccessibilityReport, ContrastEntry, APCAReport, APCAEntry, APCALevel } from "./types.js";

/**
 * Derive the "on" color for a given background.
 * Closed-form inversion of the WCAG contrast equation — no iteration needed.
 * Guarantees exactly 4.5:1 contrast. Result is an achromatic gray.
 *
 * L_c ≤ 0.175 (dark bg) → L_o = 4.5·L_c + 0.175  (lighten to pass)
 * L_c  > 0.175 (light bg) → L_o = L_c/4.5 − 0.0̄38̄  (darken to pass)
 */
export function deriveOnColor(backgroundHex: string): string {
  const L_c = relativeLuminance(backgroundHex);
  const darkBg = L_c <= 0.175;
  const L_o = darkBg
    ? 4.5 * L_c + 0.175
    : L_c / 4.5 - 0.0388888889;
  return linearToGrayHex(Math.max(0, Math.min(1, L_o)), darkBg);
}

/**
 * Binary search on OKLCH L channel to find the closest color that meets
 * the minimum contrast ratio. Tries both directions (lighten and darken)
 * and picks the result with the smallest perceptual shift.
 *
 * 25 iterations of binary search gives precision < 0.00001 in L, which
 * is far better than the previous 0.01-step linear walk.
 */
export function autoCorrectContrast(
  foreground: string,
  background: string,
  minRatio: number = 4.5
): string {
  const fgLch = hexToOklch(foreground);
  const bgLum = relativeLuminance(background);

  // Try both directions: lighten and darken
  const candidates: string[] = [];

  // Direction 1: lighten (search L from fgLch.L to 1)
  const lightResult = binarySearchL(fgLch, background, minRatio, fgLch.L, 1);
  if (lightResult) candidates.push(lightResult);

  // Direction 2: darken (search L from fgLch.L to 0)
  const darkResult = binarySearchL(fgLch, background, minRatio, fgLch.L, 0);
  if (darkResult) candidates.push(darkResult);

  if (candidates.length === 0) {
    // Neither direction worked — pick whichever extreme has higher contrast
    const whiteRatio = contrastRatio("#ffffff", background);
    const blackRatio = contrastRatio("#000000", background);
    return whiteRatio >= blackRatio ? "#ffffff" : "#000000";
  }

  if (candidates.length === 1) return candidates[0];

  // Both directions found a result — pick the one closest to original L
  const l0 = hexToOklch(candidates[0]).L;
  const l1 = hexToOklch(candidates[1]).L;
  return Math.abs(l0 - fgLch.L) <= Math.abs(l1 - fgLch.L)
    ? candidates[0]
    : candidates[1];
}

/**
 * Binary search for the L value closest to `from` (toward `to`) that
 * achieves the target contrast ratio against the background.
 * Returns null if the extreme `to` doesn't meet the ratio.
 */
function binarySearchL(
  fgLch: { L: number; C: number; H: number },
  background: string,
  minRatio: number,
  from: number,
  to: number
): string | null {
  // Check if the extreme can meet the target at all
  const extremeHex = oklchToHex(clampOklch({ ...fgLch, L: to }));
  if (contrastRatio(extremeHex, background) < minRatio) return null;

  // Check if start already meets the target
  const startHex = oklchToHex(clampOklch({ ...fgLch, L: from }));
  if (contrastRatio(startHex, background) >= minRatio) return startHex;

  // Binary search: lo is the failing side, hi is the passing side
  let lo = from;
  let hi = to;

  for (let i = 0; i < 25; i++) {
    const mid = (lo + hi) / 2;
    const midHex = oklchToHex(clampOklch({ ...fgLch, L: mid }));
    if (contrastRatio(midHex, background) >= minRatio) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return oklchToHex(clampOklch({ ...fgLch, L: hi }));
}

/**
 * Build a contrast report for all key color pairs.
 */
export function buildAccessibilityReport(
  colors: SemanticColors,
  surfaceElevation: SurfaceElevation
): AccessibilityReport {
  return {
    primaryOnBackground: makeEntry(colors.primary, colors.background),
    secondaryOnBackground: makeEntry(colors.secondary, colors.background),
    tertiaryOnBackground: makeEntry(colors.tertiary, colors.background),
    quaternaryOnBackground: makeEntry(colors.quaternary, colors.background),
    textOnBackground: makeEntry(colors.text, colors.background),
    textOnSurface: makeEntry(colors.text, colors.surface),
    mutedOnBackground: makeEntry(colors.muted, colors.background),
    dangerOnBackground: makeEntry(colors.danger, colors.background),
    successOnBackground: makeEntry(colors.success, colors.background),
    warningOnBackground: makeEntry(colors.warning, colors.background),
    infoOnBackground: makeEntry(colors.info, colors.background),
    onPrimaryOnPrimary: makeEntry(colors.onPrimary, colors.primary),
    onSecondaryOnSecondary: makeEntry(colors.onSecondary, colors.secondary),
    onTertiaryOnTertiary: makeEntry(colors.onTertiary, colors.tertiary),
    onQuaternaryOnQuaternary: makeEntry(colors.onQuaternary, colors.quaternary),
    onBackgroundOnBackground: makeEntry(colors.onBackground, colors.background),
    onSurfaceOnSurface: makeEntry(colors.onSurface, colors.surface),
    onDangerOnDanger: makeEntry(colors.onDanger, colors.danger),
    onSuccessOnSuccess: makeEntry(colors.onSuccess, colors.success),
    onWarningOnWarning: makeEntry(colors.onWarning, colors.warning),
    onInfoOnInfo: makeEntry(colors.onInfo, colors.info),
    textOnCard: makeEntry(colors.text, surfaceElevation.card),
    textOnElevated: makeEntry(colors.text, surfaceElevation.elevated),
    textOnModal: makeEntry(colors.text, surfaceElevation.modal),
    textOnPopover: makeEntry(colors.text, surfaceElevation.popover),
  };
}

function makeEntry(foreground: string, background: string): ContrastEntry {
  const ratio = Math.round(contrastRatio(foreground, background) * 100) / 100;
  const level = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "fail";
  return { ratio, level };
}

// ─── APCA Report ─────────────────────────────────────────────────────

/**
 * Build an APCA perceptual contrast report for the same 25 color pairs
 * as the WCAG accessibility report. Lc values are stored as absolute
 * values (always ≥ 0); polarity (dark/light bg) is already resolved.
 */
export function buildAPCAReport(
  colors: SemanticColors,
  surfaceElevation: SurfaceElevation
): APCAReport {
  return {
    primaryOnBackground:       makeAPCAEntry(colors.primary,    colors.background),
    secondaryOnBackground:     makeAPCAEntry(colors.secondary,  colors.background),
    tertiaryOnBackground:      makeAPCAEntry(colors.tertiary,   colors.background),
    quaternaryOnBackground:    makeAPCAEntry(colors.quaternary, colors.background),
    textOnBackground:          makeAPCAEntry(colors.text,       colors.background),
    textOnSurface:             makeAPCAEntry(colors.text,       colors.surface),
    mutedOnBackground:         makeAPCAEntry(colors.muted,      colors.background),
    dangerOnBackground:        makeAPCAEntry(colors.danger,     colors.background),
    successOnBackground:       makeAPCAEntry(colors.success,    colors.background),
    warningOnBackground:       makeAPCAEntry(colors.warning,    colors.background),
    infoOnBackground:          makeAPCAEntry(colors.info,       colors.background),
    onPrimaryOnPrimary:        makeAPCAEntry(colors.onPrimary,    colors.primary),
    onSecondaryOnSecondary:    makeAPCAEntry(colors.onSecondary,  colors.secondary),
    onTertiaryOnTertiary:      makeAPCAEntry(colors.onTertiary,   colors.tertiary),
    onQuaternaryOnQuaternary:  makeAPCAEntry(colors.onQuaternary, colors.quaternary),
    onBackgroundOnBackground:  makeAPCAEntry(colors.onBackground, colors.background),
    onSurfaceOnSurface:        makeAPCAEntry(colors.onSurface,    colors.surface),
    onDangerOnDanger:          makeAPCAEntry(colors.onDanger,   colors.danger),
    onSuccessOnSuccess:        makeAPCAEntry(colors.onSuccess,  colors.success),
    onWarningOnWarning:        makeAPCAEntry(colors.onWarning,  colors.warning),
    onInfoOnInfo:              makeAPCAEntry(colors.onInfo,     colors.info),
    textOnCard:    makeAPCAEntry(colors.text, surfaceElevation.card),
    textOnElevated: makeAPCAEntry(colors.text, surfaceElevation.elevated),
    textOnModal:   makeAPCAEntry(colors.text, surfaceElevation.modal),
    textOnPopover: makeAPCAEntry(colors.text, surfaceElevation.popover),
  };
}

function makeAPCAEntry(foreground: string, background: string): APCAEntry {
  const lc = Math.round(Math.abs(apcaContrast(foreground, background)) * 100) / 100;
  const level: APCALevel = lc >= 75 ? "Lc75" : lc >= 60 ? "Lc60" : lc >= 45 ? "Lc45" : "fail";
  return { lc, level };
}
