import { hexToOklch, oklchToHex, clampOklch } from "./color-math.js";
import type { SemanticColors, TonalStep, TonalPalette, TonalPaletteKey, TonalPalettes } from "./types.js";

export const TONAL_STEPS: TonalStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const TONAL_PALETTE_KEYS: TonalPaletteKey[] = [
  "primary", "secondary", "tertiary", "quaternary",
  "danger", "success", "warning", "info",
];

// Perceptually distributed L values for each step
const STEP_L: Record<TonalStep, number> = {
  50:  0.97,
  100: 0.93,
  200: 0.87,
  300: 0.78,
  400: 0.68,
  500: 0.57,
  600: 0.46,
  700: 0.37,
  800: 0.28,
  900: 0.21,
  950: 0.15,
};

/**
 * Scale chroma using a bell curve (sin) peaking at L≈0.5, floored at 10%.
 * This keeps mid-steps fully saturated while tapering light and dark extremes
 * to avoid neon near-whites or muddy near-blacks.
 */
function tonalChroma(sourceC: number, L: number): number {
  const t = (L - 0.08) / 0.89;
  return sourceC * Math.max(0.10, Math.sin(t * Math.PI));
}

/**
 * Generate an 11-step tonal palette from a single hex color.
 * Steps 50–950 vary L while keeping the original hue.
 * Chroma tapers at light and dark extremes.
 */
export function generateTonalPalette(hex: string): TonalPalette {
  const { C, H } = hexToOklch(hex);
  const palette: Partial<Record<TonalStep, string>> = {};
  for (const step of TONAL_STEPS) {
    const L = STEP_L[step];
    palette[step] = oklchToHex(clampOklch({ L, C: tonalChroma(C, L), H }));
  }
  return palette as TonalPalette;
}

/**
 * Generate tonal palettes for all 8 semantic intent colors
 * (primary, secondary, tertiary, quaternary, danger, success, warning, info).
 */
export function generateTonalPalettes(colors: SemanticColors): TonalPalettes {
  const result = {} as TonalPalettes;
  for (const key of TONAL_PALETTE_KEYS) {
    result[key] = generateTonalPalette(colors[key]);
  }
  return result;
}
