import type { ThemePreset, NaturePresetData } from "../types";

export const NATURE_PRESETS: Readonly<Record<ThemePreset, Readonly<NaturePresetData>>> = Object.freeze({
  peacock:          Object.freeze({ name: "peacock",          hue: 175, chroma: 0.15, description: "Teal-green feathers"        } as NaturePresetData),
  ocean:            Object.freeze({ name: "ocean",            hue: 235, chroma: 0.13, description: "Deep sea blue"               } as NaturePresetData),
  forest:           Object.freeze({ name: "forest",           hue: 145, chroma: 0.14, description: "Green canopy"                } as NaturePresetData),
  sunset:           Object.freeze({ name: "sunset",           hue: 45,  chroma: 0.16, description: "Warm orange sky"             } as NaturePresetData),
  "cherry-blossom": Object.freeze({ name: "cherry-blossom",   hue: 350, chroma: 0.12, description: "Pink petals"                 } as NaturePresetData),
  arctic:           Object.freeze({ name: "arctic",           hue: 230, chroma: 0.08, description: "Cool ice blue"               } as NaturePresetData),
  desert:           Object.freeze({ name: "desert",           hue: 60,  chroma: 0.13, description: "Sandy terracotta"            } as NaturePresetData),
  lavender:         Object.freeze({ name: "lavender",         hue: 300, chroma: 0.10, description: "Purple flower fields"        } as NaturePresetData),
  emerald:          Object.freeze({ name: "emerald",          hue: 155, chroma: 0.16, description: "Deep green gemstone"         } as NaturePresetData),
  "coral-reef":     Object.freeze({ name: "coral-reef",       hue: 25,  chroma: 0.16, description: "Warm coral pink"             } as NaturePresetData),
  midnight:         Object.freeze({ name: "midnight",         hue: 260, chroma: 0.10, description: "Deep navy"                   } as NaturePresetData),
  autumn:           Object.freeze({ name: "autumn",           hue: 50,  chroma: 0.15, description: "Burnt orange leaves"         } as NaturePresetData),
  "rose-gold":      Object.freeze({ name: "rose-gold",        hue: 15,  chroma: 0.08, description: "Soft metallic pink"          } as NaturePresetData),
  sapphire:         Object.freeze({ name: "sapphire",         hue: 255, chroma: 0.15, description: "Rich blue gem"               } as NaturePresetData),
  mint:             Object.freeze({ name: "mint",             hue: 165, chroma: 0.10, description: "Fresh cool green"            } as NaturePresetData),
  volcano:          Object.freeze({ name: "volcano",          hue: 30,  chroma: 0.18, description: "Fiery red-orange"            } as NaturePresetData),
  twilight:         Object.freeze({ name: "twilight",         hue: 290, chroma: 0.10, description: "Dusk purple"                 } as NaturePresetData),
  honey:            Object.freeze({ name: "honey",            hue: 70,  chroma: 0.15, description: "Golden amber"                } as NaturePresetData),
  storm:            Object.freeze({ name: "storm",            hue: 245, chroma: 0.04, description: "Gray-blue thundercloud"      } as NaturePresetData),
  aurora:           Object.freeze({ name: "aurora",           hue: 155, chroma: 0.13, description: "Northern lights green"       } as NaturePresetData),
});
