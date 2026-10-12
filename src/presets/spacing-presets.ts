import type { SpacingScale, SpacingPreset } from "../types";

export const SPACING_PRESETS: Readonly<Record<SpacingPreset, Readonly<SpacingScale>>> = Object.freeze({
  compact:  Object.freeze({ none: 0, xs: 2,  sm: 4,  md: 8,  lg: 12, xl: 16, xxl: 24 } as SpacingScale),
  default:  Object.freeze({ none: 0, xs: 4,  sm: 8,  md: 12, lg: 16, xl: 24, xxl: 32 } as SpacingScale),
  relaxed:  Object.freeze({ none: 0, xs: 6,  sm: 12, md: 16, lg: 20, xl: 32, xxl: 40 } as SpacingScale),
  spacious: Object.freeze({ none: 0, xs: 8,  sm: 16, md: 20, lg: 28, xl: 40, xxl: 52 } as SpacingScale),
});
