import type { RadiusScale, RadiusPreset } from "../types";

export const RADIUS_PRESETS: Readonly<Record<RadiusPreset, Readonly<RadiusScale>>> = Object.freeze({
  sharp:   Object.freeze({ none: 0, sm: 2,  md: 4,  lg: 6,  xl: 8,  xxl: 10, pill: 0   } as RadiusScale),
  default: Object.freeze({ none: 0, sm: 6,  md: 10, lg: 14, xl: 20, xxl: 24, pill: 999 } as RadiusScale),
  rounded: Object.freeze({ none: 0, sm: 10, md: 14, lg: 18, xl: 24, xxl: 30, pill: 999 } as RadiusScale),
  pill:    Object.freeze({ none: 0, sm: 14, md: 18, lg: 24, xl: 30, xxl: 40, pill: 999 } as RadiusScale),
});
