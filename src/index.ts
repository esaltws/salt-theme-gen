// ─── Main Function ───────────────────────────────────────────────────
export { generateTheme } from "./generate-theme.js";

// ─── Types ───────────────────────────────────────────────────────────
export type {
  GenerateThemeOptions,
  GeneratedTheme,
  GeneratedThemeMode,
  SemanticColors,
  StateColors,
  IntentStates,
  SurfaceElevation,
  ColorHarmony,
  AccessibilityReport,
  ContrastEntry,
  ThemePreset,
  SpacingPreset,
  FontSizePreset,
  RadiusPreset,
  SpacingScale,
  RadiusScale,
  FontSizeScale,
  NaturePresetData,
  RGB,
  Oklab,
  OKLCH,
  FontLevel,
  BaseColorKey,
  BaseColorOverride,
  GenerateThemeColors,
  ThemeWarning,
} from "./types.js";

// ─── Preset Data (for UI pickers, iteration) ────────────────────────
export { NATURE_PRESETS } from "./presets/nature-presets.js";
export { SPACING_PRESETS } from "./presets/spacing-presets.js";
export { RADIUS_PRESETS } from "./presets/radius-presets.js";
export { FONT_SIZE_PRESETS } from "./presets/font-size-presets.js";

// ─── Color Math Utilities (for advanced consumers) ───────────────────
export {
  parseColor,
  hexToOklch,
  oklchToHex,
  hexToRgb,
  rgbToHex,
  relativeLuminance,
  contrastRatio,
  meetsWcagAA,
  meetsWcagAALarge,
  darken,
  lighten,
  desaturate,
  adjustHue,
  setLightness,
  setChroma,
  isValidHex,
  normalizeHex,
  gamutClamp,
  mix,
} from "./color-math.js";

// ─── Color Derivation (for consumers who want partial control) ───────
export { deriveColors, deriveSurfaceElevation, resolveHarmonyAccents } from "./butterfly.js";
export type { DeriveColorsOptions, HarmonyAccents } from "./butterfly.js";
export { deriveOnColor, autoCorrectContrast } from "./on-colors.js";
export { deriveStateColors, deriveAllIntentStates } from "./state-colors.js";

// ─── Theme Adjustment & Diffing ──────────────────────────────────────
export { adjustTheme } from "./adjust-theme.js";
export type { ThemeModeOverrides, ThemeOverrides } from "./adjust-theme.js";
export { diffTheme } from "./diff-theme.js";
export type { FieldChange, ThemeModeDiff, ThemeDiff } from "./diff-theme.js";

// ─── Validation (for deserialized themes) ────────────────────────────
export { parseThemeJSON } from "./validate.js";
