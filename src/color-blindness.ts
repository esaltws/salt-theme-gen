import { hexToRgb, rgbToHex, rgbToLinear, linearToRgb } from "./color-math.js";
import { buildAccessibilityReport, buildAPCAReport } from "./on-colors.js";
import type {
  GeneratedTheme,
  GeneratedThemeColors,
  SemanticColors,
  SurfaceElevation,
  IntentStates,
  TonalPalettes,
  TonalPaletteKey,
} from "./types.js";

// ─── Public Types ────────────────────────────────────────────────────

export type ColorBlindnessType =
  | "protanopia"    // no red cones   (~1% of males)
  | "deuteranopia"  // no green cones (~1% of males)
  | "tritanopia"    // no blue cones  (~0.003% of population)
  | "protanomaly"   // weak red cones   (~1% of males)
  | "deuteranomaly" // weak green cones (~5% of males, most common form)
  | "tritanomaly"   // weak blue cones  (~0.01% of population)
  | "achromatopsia";// complete color blindness (very rare)

// ─── Machado 2009 Simulation Matrices (linear sRGB → linear sRGB) ────
//
// From: Machado, Oliveira, Fernandes — "A Physiologically-based Model for
// Simulation of Color Vision Deficiency" (IEEE TVCG, 2009), Table 2.
//
// Each row sums to 1 so that white (1,1,1) maps to (1,1,1).
// Applied to linearized sRGB values.

const M_PROTAN: readonly number[] = [
   0.152286,  1.052583, -0.204869,
   0.114503,  0.786281,  0.099216,
  -0.003882, -0.048116,  1.051998,
];

const M_DEUTAN: readonly number[] = [
   0.367322,  0.860646, -0.227968,
   0.280085,  0.672501,  0.047413,
  -0.011820,  0.042940,  0.968881,
];

const M_TRITAN: readonly number[] = [
   1.255528, -0.076749, -0.178779,
  -0.078411,  0.930809,  0.147602,
   0.004733,  0.691367,  0.303900,
];

// Anomalous trichromacy simulated at 60% severity (clinically typical).
const ANOMALY_SEVERITY = 0.6;

// ─── Math Helpers ────────────────────────────────────────────────────

function mat3(m: readonly number[], r: number, g: number, b: number): [number, number, number] {
  return [
    m[0] * r + m[1] * g + m[2] * b,
    m[3] * r + m[4] * g + m[5] * b,
    m[6] * r + m[7] * g + m[8] * b,
  ];
}

// ─── Core Simulation ─────────────────────────────────────────────────

function applyMatrix(
  hex: string,
  m: readonly number[],
  severity: number
): string {
  const { r, g, b } = hexToRgb(hex);
  const [rL, gL, bL] = rgbToLinear({ r, g, b });

  const [rS, gS, bS] = mat3(m, rL, gL, bL);

  // Blend between original and fully simulated based on severity
  const rF = rL + (rS - rL) * severity;
  const gF = gL + (gS - gL) * severity;
  const bF = bL + (bS - bL) * severity;

  // Clamp to [0,1] (matrix can produce slightly out-of-gamut values)
  const rgb = linearToRgb([
    Math.max(0, Math.min(1, rF)),
    Math.max(0, Math.min(1, gF)),
    Math.max(0, Math.min(1, bF)),
  ]);

  return rgbToHex(rgb);
}

function toGrayscale(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const [rL, gL, bL] = rgbToLinear({ r, g, b });
  const Y = 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
  const clamped = Math.max(0, Math.min(1, Y));
  const rgb = linearToRgb([clamped, clamped, clamped]);
  return rgbToHex(rgb);
}

// ─── Public Utility ──────────────────────────────────────────────────

/**
 * Simulate how a hex color appears to someone with a given type of
 * color vision deficiency.
 *
 * Uses the Machado et al. 2009 matrices (IEEE TVCG), which are the
 * de-facto standard for physiologically-accurate simulation.
 * Applied in linear sRGB space for correctness.
 *
 * @example
 * const simulated = simulateColorBlindness("#e63946", "deuteranopia");
 * // → approximately "#b56900" (red appears brownish to deuteranopes)
 */
export function simulateColorBlindness(hex: string, type: ColorBlindnessType): string {
  switch (type) {
    case "protanopia":    return applyMatrix(hex, M_PROTAN, 1.0);
    case "deuteranopia":  return applyMatrix(hex, M_DEUTAN, 1.0);
    case "tritanopia":    return applyMatrix(hex, M_TRITAN, 1.0);
    case "protanomaly":   return applyMatrix(hex, M_PROTAN, ANOMALY_SEVERITY);
    case "deuteranomaly": return applyMatrix(hex, M_DEUTAN, ANOMALY_SEVERITY);
    case "tritanomaly":   return applyMatrix(hex, M_TRITAN, ANOMALY_SEVERITY);
    case "achromatopsia": return toGrayscale(hex);
  }
}

// ─── Theme-level Simulation ──────────────────────────────────────────

function simulateColors(colors: SemanticColors, type: ColorBlindnessType): SemanticColors {
  const out: Record<string, string> = {};
  for (const [k, hex] of Object.entries(colors) as [string, string][]) {
    out[k] = simulateColorBlindness(hex, type);
  }
  return out as SemanticColors;
}

function simulateSurface(se: SurfaceElevation, type: ColorBlindnessType): SurfaceElevation {
  return {
    card:     simulateColorBlindness(se.card,     type),
    elevated: simulateColorBlindness(se.elevated, type),
    modal:    simulateColorBlindness(se.modal,     type),
    popover:  simulateColorBlindness(se.popover,   type),
  };
}

function simulatePalettes(palettes: TonalPalettes, type: ColorBlindnessType): TonalPalettes {
  const out = {} as TonalPalettes;
  for (const [pk, palette] of Object.entries(palettes) as [TonalPaletteKey, Record<string, string>][]) {
    const steps = {} as Record<string, string>;
    for (const [step, hex] of Object.entries(palette)) {
      steps[step] = simulateColorBlindness(hex, type);
    }
    out[pk] = steps as TonalPalettes[TonalPaletteKey];
  }
  return out;
}

function simulateStates(states: IntentStates, type: ColorBlindnessType): IntentStates {
  const out = {} as IntentStates;
  for (const [intent, stateColors] of Object.entries(states) as [keyof IntentStates, Record<string, string>][]) {
    const s = {} as Record<string, string>;
    for (const [state, hex] of Object.entries(stateColors)) {
      s[state] = simulateColorBlindness(hex, type);
    }
    out[intent] = s as IntentStates[keyof IntentStates];
  }
  return out;
}

function simulateMode(mode: GeneratedThemeColors, type: ColorBlindnessType): GeneratedThemeColors {
  const colors          = simulateColors(mode.colors, type);
  const surfaceElevation = simulateSurface(mode.surfaceElevation, type);
  const palettes        = simulatePalettes(mode.palettes, type);
  const states          = simulateStates(mode.states, type);

  // Recompute contrast reports on the simulated colors
  const accessibility   = buildAccessibilityReport(colors, surfaceElevation);
  const apca            = buildAPCAReport(colors, surfaceElevation);

  return { mode: mode.mode, colors, palettes, surfaceElevation, states, accessibility, apca };
}

/**
 * Simulate an entire theme as it would appear to someone with a given
 * color vision deficiency.
 *
 * Returns a new `GeneratedTheme` with all hex values replaced by their
 * simulated equivalents. WCAG and APCA accessibility reports are
 * recomputed on the simulated colors, so you can check whether your
 * theme remains accessible under the simulation.
 *
 * Non-color fields (spacing, radius, fontSizes, etc.) are unchanged.
 *
 * @example
 * const simulated = simulateTheme(theme, "deuteranopia");
 * // Check if text still has sufficient contrast for deuteranopes:
 * console.log(simulated.light.accessibility.textOnBackground);
 */
export function simulateTheme(theme: GeneratedTheme, type: ColorBlindnessType): GeneratedTheme {
  return {
    light:  simulateMode(theme.light, type),
    dark:   simulateMode(theme.dark,  type),
    tokens: theme.tokens,
    ...(theme.warnings !== undefined && { warnings: theme.warnings }),
  };
}
