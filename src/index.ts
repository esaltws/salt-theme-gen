// ─── Main Function ───────────────────────────────────────────────────
export { generateTheme } from "./generate-theme.js";

// ─── Schema ───────────────────────────────────────────────────────────
export { SCHEMA_VERSION } from "./types.js";
export type { SchemaVersion } from "./types.js";

// ─── Types ───────────────────────────────────────────────────────────
export type {
  GenerateThemeOptions,
  GeneratedTheme,
  GeneratedThemeColors,
  GeneratedThemeTokens,
  SemanticColors,
  StateColors,
  IntentStates,
  SurfaceElevation,
  ColorHarmony,
  AccessibilityReport,
  ContrastEntry,
  APCAReport,
  APCAEntry,
  APCALevel,
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
  BaseColorKey,
  BaseColorOverride,
  GenerateThemeColors,
  ThemeWarning,
  TonalStep,
  TonalPalette,
  TonalPaletteKey,
  TonalPalettes,
  // Typography
  FontWeight,
  FontScaleName,
  FontFamilyOptions,
  TypographyStyle,
  TypographyScale,
  LineHeightScale,
  FontWeightScale,
  LetterSpacingScale,
  // Scales
  IconSizeScale,
  SemanticIconSizes,
  ControlSizeScale,
  TouchTargetScale,
  BorderWidthScale,
  AvatarSizeScale,
  BreakpointScale,
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
  apcaContrast,
  meetsAPCA,
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
export { deriveOnColor, autoCorrectContrast, buildAPCAReport } from "./on-colors.js";
export { deriveStateColors, deriveAllIntentStates } from "./state-colors.js";

// ─── Theme Adjustment & Diffing ──────────────────────────────────────
export { adjustTheme } from "./adjust-theme.js";
export type { ThemeColorOverrides, ThemeTokenOverrides, ThemeOverrides } from "./adjust-theme.js";
export { diffTheme } from "./diff-theme.js";
export type { FieldChange, ThemeColorsDiff, ThemeTokensDiff, ThemeModeDiff, ThemeDiff } from "./diff-theme.js";

// ─── Tonal Palettes ──────────────────────────────────────────────────
export { generateTonalPalette, generateTonalPalettes } from "./palettes.js";

// ─── CSS Custom Property Output ──────────────────────────────────────
export { generateCssVariables } from "./css-variables.js";
export type { CssFormat, CssVariablesOptions, CssVariablesResult } from "./css-variables.js";

// ─── Design Token Exports ─────────────────────────────────────────────
export { generateDtcgTokens } from "./dtcg.js";
export type { DtcgToken, DtcgColorToken, DtcgDimensionToken, DtcgGroup, DtcgTokensResult } from "./dtcg.js";
export { generateTailwindConfig } from "./tailwind.js";
export type { TailwindThemeExtend, TailwindConfigResult } from "./tailwind.js";

// ─── Validation (for deserialized themes) ────────────────────────────
export { parseThemeJSON } from "./validate.js";
export type { ParseThemeResult } from "./validate.js";

// ─── React Native Utilities ───────────────────────────────────────────
export { resolveTextStyle } from "./rn-utils.js";
export type { RNTextStyle } from "./rn-utils.js";

// ─── Color Blindness Simulation ───────────────────────────────────────
export { simulateColorBlindness, simulateTheme } from "./color-blindness.js";
export type { ColorBlindnessType } from "./color-blindness.js";

// ─── Typography Utilities & Constants (for advanced consumers) ────────
export {
  FONT_SCALE_RATIOS,
  DEFAULT_LINE_HEIGHTS,
  DEFAULT_FONT_WEIGHTS,
  DEFAULT_LETTER_SPACINGS,
  computeTypographyScale,
  computeModularFontSizes,
  resolveFontScale,
} from "./typography-utils.js";

// ─── Size Constants (for advanced consumers) ──────────────────────────
export {
  DEFAULT_ICON_SIZES,
  DEFAULT_SEMANTIC_ICON_SIZES,
  DEFAULT_CONTROL_SIZES,
  DEFAULT_TOUCH_TARGETS,
  DEFAULT_BORDER_WIDTHS,
  DEFAULT_AVATAR_SIZES,
  DEFAULT_BREAKPOINTS,
} from "./icon-utils.js";
