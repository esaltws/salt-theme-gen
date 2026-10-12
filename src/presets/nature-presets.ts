import type { ThemePreset, NaturePresetData } from "../types";

export const NATURE_PRESETS: Record<ThemePreset, NaturePresetData> = {
  peacock:          { name: "peacock",          hue: 175, chroma: 0.15, description: "Teal-green feathers" },
  ocean:            { name: "ocean",            hue: 235, chroma: 0.13, description: "Deep sea blue" },
  forest:           { name: "forest",           hue: 145, chroma: 0.14, description: "Green canopy" },
  sunset:           { name: "sunset",           hue: 45,  chroma: 0.16, description: "Warm orange sky" },
  "cherry-blossom": { name: "cherry-blossom",   hue: 350, chroma: 0.12, description: "Pink petals" },
  arctic:           { name: "arctic",           hue: 230, chroma: 0.08, description: "Cool ice blue" },
  desert:           { name: "desert",           hue: 60,  chroma: 0.13, description: "Sandy terracotta" },
  lavender:         { name: "lavender",         hue: 300, chroma: 0.10, description: "Purple flower fields" },
  emerald:          { name: "emerald",          hue: 155, chroma: 0.16, description: "Deep green gemstone" },
  "coral-reef":     { name: "coral-reef",       hue: 25,  chroma: 0.16, description: "Warm coral pink" },
  midnight:         { name: "midnight",         hue: 260, chroma: 0.10, description: "Deep navy" },
  autumn:           { name: "autumn",           hue: 50,  chroma: 0.15, description: "Burnt orange leaves" },
  "rose-gold":      { name: "rose-gold",        hue: 15,  chroma: 0.08, description: "Soft metallic pink" },
  sapphire:         { name: "sapphire",         hue: 255, chroma: 0.15, description: "Rich blue gem" },
  mint:             { name: "mint",             hue: 165, chroma: 0.10, description: "Fresh cool green" },
  volcano:          { name: "volcano",          hue: 30,  chroma: 0.18, description: "Fiery red-orange" },
  twilight:         { name: "twilight",         hue: 290, chroma: 0.10, description: "Dusk purple" },
  honey:            { name: "honey",            hue: 70,  chroma: 0.15, description: "Golden amber" },
  storm:            { name: "storm",            hue: 245, chroma: 0.04, description: "Gray-blue thundercloud" },
  aurora:           { name: "aurora",           hue: 155, chroma: 0.13, description: "Northern lights green" },
};
for (const v of Object.values(NATURE_PRESETS)) Object.freeze(v);
Object.freeze(NATURE_PRESETS);
