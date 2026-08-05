// ─── Icon Size Scale ─────────────────────────────────────────────────

export const DEFAULT_ICON_SIZES = {
  xs:    12,
  sm:    16,
  md:    20,
  lg:    24,
  xl:    32,
  xxl:   40,
  "3xl": 48,
};

export type SemanticIconSizes = {
  inline:     number; // 16 — inline with text
  compact:    number; // 16 — tight UI (chips, badges)
  control:    number; // 20 — buttons, inputs
  navigation: number; // 24 — nav bars, tab bars
  feature:    number; // 32 — feature sections
  hero:       number; // 48 — hero / empty state
};

export const DEFAULT_SEMANTIC_ICON_SIZES: SemanticIconSizes = {
  inline:     16,
  compact:    16,
  control:    20,
  navigation: 24,
  feature:    32,
  hero:       48,
};

// ─── Border Width Scale ──────────────────────────────────────────────

export type BorderWidthScale = {
  none:   number;
  thin:   number;
  medium: number;
  thick:  number;
};

export const DEFAULT_BORDER_WIDTHS: BorderWidthScale = {
  none:   0,
  thin:   1,
  medium: 2,
  thick:  3,
};

// ─── Avatar Size Scale ───────────────────────────────────────────────

export type AvatarSizeScale = {
  xs:  number;
  sm:  number;
  md:  number;
  lg:  number;
  xl:  number;
  xxl: number;
};

export const DEFAULT_AVATAR_SIZES: AvatarSizeScale = {
  xs:  24,
  sm:  32,
  md:  40,
  lg:  48,
  xl:  64,
  xxl: 80,
};

// ─── Breakpoint Scale ────────────────────────────────────────────────

export type BreakpointScale = {
  sm:  number;
  md:  number;
  lg:  number;
  xl:  number;
  xxl: number;
};

export const DEFAULT_BREAKPOINTS: BreakpointScale = {
  sm:  480,
  md:  768,
  lg:  1024,
  xl:  1280,
  xxl: 1536,
};
