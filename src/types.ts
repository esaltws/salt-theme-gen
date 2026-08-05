import type { SemanticIconSizes } from "./icon-utils.js";

// ─── Color Representations ───────────────────────────────────────────

export type RGB = { r: number; g: number; b: number }; // 0–255

export type Oklab = { L: number; a: number; b: number }; // L: 0–1, a/b: ~±0.4

export type OKLCH = { L: number; C: number; H: number }; // L: 0–1, C: 0–~0.4, H: 0–360

// ─── Typography ───────────────────────────────────────────────────────

export type FontScaleName =
  | "minor-second"
  | "major-second"
  | "minor-third"
  | "major-third"
  | "perfect-fourth"
  | "augmented-fourth"
  | "perfect-fifth"
  | "golden-ratio";

export type FontWeight = 400 | 500 | 600 | 700;

export type TypographyStyle = {
  fontSize: number;      // px
  lineHeight: number;    // unitless
  fontWeight: FontWeight;
  letterSpacing: number; // em (stored as a decimal: 0.04 = 0.04em)
  fontFamily?: string;
};

export type TypographyScale = {
  caption:     TypographyStyle;
  labelSmall:  TypographyStyle;
  labelMedium: TypographyStyle;
  bodySmall:   TypographyStyle;
  bodyMedium:  TypographyStyle;
  bodyLarge:   TypographyStyle;
  titleSmall:  TypographyStyle;
  titleMedium: TypographyStyle;
  titleLarge:  TypographyStyle;
  display:     TypographyStyle;
};

export type LineHeightScale = {
  none:    number;
  tight:   number;
  snug:    number;
  normal:  number;
  relaxed: number;
  loose:   number;
};

export type FontWeightScale = {
  light:     number;
  regular:   number;
  medium:    number;
  semibold:  number;
  bold:      number;
  extrabold: number;
};

export type LetterSpacingScale = {
  tight:   number;
  normal:  number;
  wide:    number;
  wider:   number;
  widest:  number;
};

export type FontFamilyOptions = {
  /** Font family for body/UI tokens (caption, label, body). */
  sans?: string;
  /** Font family for heading/display tokens (titleSmall–display). */
  display?: string;
};

// ─── Color Harmony ──────────────────────────────────────────────────

export type ColorHarmony =
  | "analogous"
  | "complementary"
  | "triadic"
  | "split-complementary"
  | "tetradic"
  | "monochromatic";

// ─── Theme Presets ───────────────────────────────────────────────────

export type ThemePreset =
  | "peacock"
  | "ocean"
  | "forest"
  | "sunset"
  | "cherry-blossom"
  | "arctic"
  | "desert"
  | "lavender"
  | "emerald"
  | "coral-reef"
  | "midnight"
  | "autumn"
  | "rose-gold"
  | "sapphire"
  | "mint"
  | "volcano"
  | "twilight"
  | "honey"
  | "storm"
  | "aurora";

export type SpacingPreset = "compact" | "default" | "relaxed" | "spacious";
export type FontSizePreset = "small" | "default" | "large" | "editorial";
export type RadiusPreset = "sharp" | "default" | "rounded" | "pill";

// ─── Scale Shapes (match ui-kit token shapes exactly) ────────────────

export type SpacingScale = {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};

export type RadiusScale = {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  pill: number;
};

export type FontSizeScale = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  "3xl": number;
};

export type IconSizeScale = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  "3xl": number;
};

export type { SemanticIconSizes };

export type SizeMapScale = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  "3xl": number;
};

export type DimensionScale = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  "3xl": number;
};

// ─── Semantic Colors (23 keys, matching ui-kit colors) ───────────────

export type SemanticColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
  success: string;
  warning: string;
  info: string;
  onPrimary: string;
  onSecondary: string;
  onTertiary: string;
  onQuaternary: string;
  onBackground: string;
  onSurface: string;
  onDanger: string;
  onSuccess: string;
  onWarning: string;
  onInfo: string;
};

// ─── State Colors ────────────────────────────────────────────────────

export type StateColors = {
  hover: string;
  pressed: string;
  focused: string;
  disabled: string;
};

export type IntentStates = {
  primary: StateColors;
  secondary: StateColors;
  tertiary: StateColors;
  quaternary: StateColors;
  danger: StateColors;
  success: StateColors;
  warning: StateColors;
  info: StateColors;
};

// ─── Surface Elevation ──────────────────────────────────────────────

export type SurfaceElevation = {
  card: string;       // card / sheet
  elevated: string;   // elevated card / bottom sheet
  modal: string;      // modal / dialog
  popover: string;    // popover / tooltip / dropdown
};

// ─── Tonal Palettes ──────────────────────────────────────────────────

export type TonalStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
export type TonalPalette = Record<TonalStep, string>;
export type TonalPaletteKey =
  | "primary" | "secondary" | "tertiary" | "quaternary"
  | "danger" | "success" | "warning" | "info";
export type TonalPalettes = Record<TonalPaletteKey, TonalPalette>;

// ─── Base Color Override (user input — no on-colors) ─────────────────

export type BaseColorKey =
  | "primary" | "secondary" | "tertiary" | "quaternary"
  | "background" | "surface" | "text" | "muted" | "border"
  | "danger" | "success" | "warning" | "info";

export type BaseColorOverride = Partial<Record<BaseColorKey, string>>;

export type GenerateThemeColors = {
  light?: BaseColorOverride;
  dark?: BaseColorOverride;
  /** Applies to both modes; mode-specific keys win per-key */
  both?: BaseColorOverride;
};

export type ThemeWarning = {
  mode: "light" | "dark";
  key: BaseColorKey;
  /** Original user-provided hex */
  value: string;
  /** Background it was checked against */
  background: string;
  /** Actual contrast ratio */
  ratio: number;
  /** Minimum ratio required */
  required: number;
  /** "warn" = kept user value; "corrected" = replaced with WCAG-corrected value */
  action: "warn" | "corrected";
  /** Final value used in the theme */
  finalValue: string;
};

// ─── Accessibility ───────────────────────────────────────────────────

export type ContrastEntry = {
  ratio: number;
  level: "AAA" | "AA" | "fail";
};

export type AccessibilityReport = {
  primaryOnBackground: ContrastEntry;
  secondaryOnBackground: ContrastEntry;
  tertiaryOnBackground: ContrastEntry;
  quaternaryOnBackground: ContrastEntry;
  textOnBackground: ContrastEntry;
  textOnSurface: ContrastEntry;
  mutedOnBackground: ContrastEntry;
  dangerOnBackground: ContrastEntry;
  successOnBackground: ContrastEntry;
  warningOnBackground: ContrastEntry;
  infoOnBackground: ContrastEntry;
  onPrimaryOnPrimary: ContrastEntry;
  onSecondaryOnSecondary: ContrastEntry;
  onTertiaryOnTertiary: ContrastEntry;
  onQuaternaryOnQuaternary: ContrastEntry;
  onBackgroundOnBackground: ContrastEntry;
  onSurfaceOnSurface: ContrastEntry;
  onDangerOnDanger: ContrastEntry;
  onSuccessOnSuccess: ContrastEntry;
  onWarningOnWarning: ContrastEntry;
  onInfoOnInfo: ContrastEntry;
  textOnCard: ContrastEntry;
  textOnElevated: ContrastEntry;
  textOnModal: ContrastEntry;
  textOnPopover: ContrastEntry;
};

// ─── APCA Accessibility ──────────────────────────────────────────────

/** Lc ≥ 75: body text · Lc ≥ 60: large text · Lc ≥ 45: UI components */
export type APCALevel = "Lc75" | "Lc60" | "Lc45" | "fail";

export type APCAEntry = {
  /** Absolute Lc value (0–108 range). Use Math.abs() not needed — always positive here. */
  lc: number;
  level: APCALevel;
};

export type APCAReport = {
  primaryOnBackground: APCAEntry;
  secondaryOnBackground: APCAEntry;
  tertiaryOnBackground: APCAEntry;
  quaternaryOnBackground: APCAEntry;
  textOnBackground: APCAEntry;
  textOnSurface: APCAEntry;
  mutedOnBackground: APCAEntry;
  dangerOnBackground: APCAEntry;
  successOnBackground: APCAEntry;
  warningOnBackground: APCAEntry;
  infoOnBackground: APCAEntry;
  onPrimaryOnPrimary: APCAEntry;
  onSecondaryOnSecondary: APCAEntry;
  onTertiaryOnTertiary: APCAEntry;
  onQuaternaryOnQuaternary: APCAEntry;
  onBackgroundOnBackground: APCAEntry;
  onSurfaceOnSurface: APCAEntry;
  onDangerOnDanger: APCAEntry;
  onSuccessOnSuccess: APCAEntry;
  onWarningOnWarning: APCAEntry;
  onInfoOnInfo: APCAEntry;
  textOnCard: APCAEntry;
  textOnElevated: APCAEntry;
  textOnModal: APCAEntry;
  textOnPopover: APCAEntry;
};

// ─── Generated Theme Output ──────────────────────────────────────────

export type GeneratedThemeMode = {
  mode: "light" | "dark";
  colors: SemanticColors;
  palettes: TonalPalettes;
  surfaceElevation: SurfaceElevation;
  spacing: SpacingScale;
  radius: RadiusScale;
  fontSizes: FontSizeScale;
  iconSizes: IconSizeScale;
  icons: SemanticIconSizes;
  sizeMap: SizeMapScale;
  dimensions: DimensionScale;
  baseFont: number;
  fontScale: number;
  fontFamilySans?: string;
  fontFamilyDisplay?: string;
  typography: TypographyScale;
  lineHeights: LineHeightScale;
  fontWeights: FontWeightScale;
  letterSpacings: LetterSpacingScale;
  states: IntentStates;
  accessibility: AccessibilityReport;
  apca: APCAReport;
};

export type GeneratedTheme = {
  light: GeneratedThemeMode;
  dark: GeneratedThemeMode;
  /** Present only when user-provided colors triggered WCAG failures */
  warnings?: ThemeWarning[];
};

// ─── Input Options ───────────────────────────────────────────────────

export type GenerateThemeOptions = {
  /** Primary color as HEX string (e.g., "#0E9D8E") */
  primary?: string;
  /** Nature preset name — ignored if `primary` is provided */
  preset?: ThemePreset;
  /** Override auto-derived secondary color */
  secondary?: string;
  /** Override auto-derived tertiary color */
  tertiary?: string;
  /** Override auto-derived quaternary color */
  quaternary?: string;
  /** Color harmony strategy (default: "analogous") */
  harmony?: ColorHarmony;
  /**
   * Provide any subset of the 13 base semantic colors per mode.
   * Missing colors are auto-derived from the primary seed.
   */
  colors?: GenerateThemeColors;
  /**
   * Controls WCAG conflict resolution for user-provided colors.
   * false (default): keep user value, warn on failure.
   * true: auto-correct failing value (hue preserved), warn on failure.
   */
  override?: boolean;
  /** Spacing scale preset or custom object */
  spacing?: SpacingPreset | SpacingScale;
  /** Font size scale preset or custom object */
  fontSize?: FontSizePreset | FontSizeScale;
  /** Radius scale preset or custom object */
  radius?: RadiusPreset | RadiusScale;
  /** Base font size in px (≥ 8, default 16). */
  baseFont?: number;
  /** Modular scale ratio for semantic font sizes. Named or custom number. Default: "major-third" (1.25). */
  fontScale?: FontScaleName | number;
  /** Font families applied to typography tokens. Not loaded — bring your own @font-face. */
  fontFamily?: FontFamilyOptions;
};

// ─── Nature Preset Data ──────────────────────────────────────────────

export type NaturePresetData = {
  name: ThemePreset;
  hue: number;
  chroma: number;
  description: string;
};
