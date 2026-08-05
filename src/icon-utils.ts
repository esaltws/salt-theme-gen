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
