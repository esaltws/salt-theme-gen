import type { FontSizeScale, FontSizePreset } from "../types";

export const FONT_SIZE_PRESETS: Record<FontSizePreset, FontSizeScale> = {
  small:     { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 26, "3xl": 32 },
  default:   { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, "3xl": 32 },
  large:     { xs: 14, sm: 16, md: 18, lg: 24, xl: 28, xxl: 36, "3xl": 44 },
  editorial: { xs: 14, sm: 16, md: 20, lg: 28, xl: 36, xxl: 48, "3xl": 56 },
};
for (const v of Object.values(FONT_SIZE_PRESETS)) Object.freeze(v);
Object.freeze(FONT_SIZE_PRESETS);
