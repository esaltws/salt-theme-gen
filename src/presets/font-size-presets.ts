import type { FontSizeScale, FontSizePreset } from "../types";

export const FONT_SIZE_PRESETS: Readonly<Record<FontSizePreset, Readonly<FontSizeScale>>> = Object.freeze({
  small:     Object.freeze({ xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 26, "3xl": 32 } as FontSizeScale),
  default:   Object.freeze({ xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, "3xl": 32 } as FontSizeScale),
  large:     Object.freeze({ xs: 14, sm: 16, md: 18, lg: 24, xl: 28, xxl: 36, "3xl": 44 } as FontSizeScale),
  editorial: Object.freeze({ xs: 14, sm: 16, md: 20, lg: 28, xl: 36, xxl: 48, "3xl": 56 } as FontSizeScale),
});
