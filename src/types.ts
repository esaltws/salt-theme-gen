// ─── Color Representations ───────────────────────────────────────────

export type RGB = { r: number; g: number; b: number }; // 0–255

export type Oklab = { L: number; a: number; b: number }; // L: 0–1, a/b: ~±0.4

export type OKLCH = { L: number; C: number; H: number }; // L: 0–1, C: 0–~0.4, H: 0–360

export type FontLevel = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;

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

// ─── Semantic Colors (21 keys, matching ui-kit colors) ───────────────

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

// ─── Generated Theme Output ──────────────────────────────────────────

export type GeneratedThemeMode = {
  mode: "light" | "dark";
  colors: SemanticColors;
  surfaceElevation: SurfaceElevation;
  spacing: SpacingScale;
  radius: RadiusScale;
  fontSizes: FontSizeScale;
  iconSizes: IconSizeScale;
  sizeMap: SizeMapScale;
  dimensions: DimensionScale;
  fontLevel: FontLevel;
  states: IntentStates;
  accessibility: AccessibilityReport;
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
  /** Font level for typography (8–18, default 16) */
  fontLevel?: number;
};

// ─── Nature Preset Data ──────────────────────────────────────────────

export type NaturePresetData = {
  name: ThemePreset;
  hue: number;
  chroma: number;
  description: string;
};
