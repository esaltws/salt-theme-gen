# salt-theme-gen

OKLCH-based design system generator. Generate complete light + dark themes from a single color.

Zero dependencies. Pure TypeScript. Platform agnostic — works with React Native, React, Next.js, Node, Bun, Deno, or any JavaScript runtime.

[![npm](https://img.shields.io/npm/v/salt-theme-gen)](https://www.npmjs.com/package/salt-theme-gen)
[![license](https://img.shields.io/npm/l/react-native-salt)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![react-native-salt](https://img.shields.io/npm/v/@esaltws/react-native-salt)](https://www.npmjs.com/package/@esaltws/react-native-salt)

> Formerly `react-native-salt-theme-gen`. If you're upgrading, just change your import — the API is the same.

## Install

```bash
npm install salt-theme-gen

```

## Quick Start

```typescript
import { generateTheme } from "salt-theme-gen";

// From a hex color
const theme = generateTheme({ primary: "#0E9D8E" });

// From a preset
const theme = generateTheme({ preset: "ocean" });

// With color harmony
const theme = generateTheme({
  primary: "#1e90ff",
  harmony: "complementary",
});

// With scale customization
const theme = generateTheme({
  preset: "sunset",
  spacing: "compact",
  radius: "rounded",
  fontSize: "large",
});
```

## Theme Structure

A generated theme has this exact shape:

```typescript
type GeneratedTheme = {
  light: GeneratedThemeMode;
  dark: GeneratedThemeMode;
};

type GeneratedThemeMode = {
  mode: "light" | "dark";
  colors: SemanticColors;
  surfaceElevation: SurfaceElevation;
  spacing: SpacingScale;
  radius: RadiusScale;
  fontSizes: FontSizeScale;
  fontLevel: FontLevel; // 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 (consumed by react-native-salt, not this library)
  states: IntentStates;
  accessibility: AccessibilityReport;
};
```

### SemanticColors (21 keys)

All values are 7-character hex strings (e.g., `"#1e90ff"`).

| Group     | Keys                                                                        |
|-----------|-----------------------------------------------------------------------------|
| Base      | `primary`, `secondary`, `tertiary`, `quaternary`                            |
| On-colors | `onPrimary`, `onSecondary`, `onTertiary`, `onQuaternary`                    |
|           | `onDanger`, `onSuccess`, `onWarning`, `onInfo`                              |
| Utility   | `background`, `surface`, `text`, `muted`, `border`                          |
| Status    | `danger`, `success`, `warning`, `info`                                      |

On-colors are foreground colors guaranteed to meet WCAG AA (4.5:1) contrast against their base.

### SurfaceElevation (4 keys)

```typescript
type SurfaceElevation = {
  card: string;     // card / sheet
  elevated: string; // elevated card / bottom sheet
  modal: string;    // modal / dialog
  popover: string;  // popover / tooltip / dropdown
};
```

Light mode: surface tinted with primary at increasing ratios (2%, 4%, 6%, 8%).
Dark mode: surface progressively lightened (+0.03, +0.06, +0.10, +0.14 L).

### SpacingScale (7 keys)

```typescript
type SpacingScale = {
  none: number; xs: number; sm: number; md: number;
  lg: number; xl: number; xxl: number;
};
```

### RadiusScale (7 keys)

```typescript
type RadiusScale = {
  none: number; sm: number; md: number; lg: number;
  xl: number; xxl: number; pill: number;
};
```

### FontSizeScale (7 keys)

```typescript
type FontSizeScale = {
  xs: number; sm: number; md: number; lg: number;
  xl: number; xxl: number; "3xl": number;
};
```

### IntentStates (8 intents x 4 states = 32 values)

```typescript
type IntentStates = {
  primary: StateColors;
  secondary: StateColors;
  tertiary: StateColors;
  quaternary: StateColors;
  danger: StateColors;
  success: StateColors;
  warning: StateColors;
  info: StateColors;
};

type StateColors = {
  hover: string;    // darkened base
  pressed: string;  // darker than hover
  focused: string;  // mix(background, base, 0.3) — solid hex
  disabled: string; // desaturated, guaranteed 3:1 contrast vs background
};
```

### AccessibilityReport (18 entries)

Each entry is `{ ratio: number; level: "AAA" | "AA" | "fail" }`.

| Entry                      | Tests                        |
|----------------------------|------------------------------|
| `primaryOnBackground`      | primary vs background        |
| `secondaryOnBackground`    | secondary vs background      |
| `tertiaryOnBackground`     | tertiary vs background       |
| `quaternaryOnBackground`   | quaternary vs background     |
| `textOnBackground`         | text vs background           |
| `textOnSurface`            | text vs surface              |
| `dangerOnBackground`       | danger vs background         |
| `successOnBackground`      | success vs background        |
| `warningOnBackground`      | warning vs background        |
| `infoOnBackground`         | info vs background           |
| `onPrimaryOnPrimary`       | onPrimary vs primary         |
| `onSecondaryOnSecondary`   | onSecondary vs secondary     |
| `onTertiaryOnTertiary`     | onTertiary vs tertiary       |
| `onQuaternaryOnQuaternary` | onQuaternary vs quaternary   |
| `onDangerOnDanger`         | onDanger vs danger           |
| `onSuccessOnSuccess`       | onSuccess vs success         |
| `onWarningOnWarning`       | onWarning vs warning         |
| `onInfoOnInfo`             | onInfo vs info               |

## Color Harmony

Control how accent colors are derived from your primary:

```typescript
generateTheme({ primary: "#1e90ff", harmony: "complementary" });
```

| Harmony               | Description                        |
|-----------------------|------------------------------------|
| `analogous`           | Adjacent hues (default)            |
| `complementary`       | Opposite hue                       |
| `triadic`             | Three evenly spaced hues           |
| `split-complementary` | Two hues flanking the complement   |
| `tetradic`            | Four evenly spaced hues            |
| `monochromatic`       | Same hue, varied lightness/chroma  |

You can also override individual accent colors:

```typescript
generateTheme({
  primary: "#1e90ff",
  secondary: "#ff00ff",
  tertiary: "#00ff88",
  quaternary: "#ffaa00",
});
```

## Adjust Themes

Tweak a generated theme without regenerating from scratch. Derived fields (on-colors, states, surface elevation, accessibility) are automatically recalculated when base colors change.

```typescript
import { adjustTheme } from "salt-theme-gen";

// Change primary in dark mode only
const adjusted = adjustTheme(theme, {
  dark: { colors: { primary: "#ff0000" } },
});

// Change spacing globally
const adjusted = adjustTheme(theme, {
  both: { spacing: { md: 20, lg: 28 } },
});

// Mode-specific overrides win over `both`
const adjusted = adjustTheme(theme, {
  both: { colors: { primary: "#ff0000" } },
  light: { colors: { primary: "#cc0000" } }, // wins for light mode
});
```

## Diff Themes

Compare two themes and get a structured diff of all changed fields:

```typescript
import { diffTheme } from "salt-theme-gen";

const diff = diffTheme(oldTheme, newTheme);

if (!diff.identical) {
  console.log(diff.light.colors?.primary);
  // { old: "#1e90ff", new: "#ff0000" }
}
```

## Validate Deserialized Themes

Safely parse themes from JSON (e.g., AsyncStorage, API responses):

```typescript
import { parseThemeJSON } from "salt-theme-gen";

const theme = parseThemeJSON(JSON.parse(stored));
// Throws descriptive errors: "theme.dark.states.warning.disabled: expected hex color string"
```

## Nature Presets (20)

| Preset            | Hue | Description           |
|-------------------|-----|-----------------------|
| `peacock`         | 175 | Teal-green            |
| `ocean`           | 235 | Deep blue             |
| `forest`          | 145 | Natural green         |
| `sunset`          | 45  | Warm orange           |
| `cherry-blossom`  | 340 | Soft pink             |
| `arctic`          | 200 | Ice blue              |
| `desert`          | 35  | Sandy gold            |
| `lavender`        | 280 | Purple                |
| `emerald`         | 155 | Rich green            |
| `coral-reef`      | 15  | Coral                 |
| `midnight`        | 250 | Dark indigo           |
| `autumn`          | 25  | Burnt orange          |
| `rose-gold`       | 10  | Warm rose             |
| `sapphire`        | 225 | Royal blue            |
| `mint`            | 165 | Fresh mint            |
| `volcano`         | 5   | Fiery red             |
| `twilight`        | 265 | Violet                |
| `honey`           | 50  | Golden amber          |
| `storm`           | 215 | Steel blue            |
| `aurora`          | 135 | Northern lights green |

## Scale Presets

**Spacing:** `compact` | `default` | `relaxed` | `spacious`
**Radius:** `sharp` | `default` | `rounded` | `pill`
**Font size:** `small` | `default` | `large` | `editorial`

Or pass a custom scale object:

```typescript
generateTheme({
  primary: "#2563eb",
  spacing: { none: 0, xs: 2, sm: 4, md: 8, lg: 12, xl: 16, xxl: 24 },
});
```

## API Reference

### `generateTheme(options?): GeneratedTheme`

| Option       | Type                              | Default       | Description                          |
|--------------|-----------------------------------|---------------|--------------------------------------|
| `primary`    | `string`                          | -             | HEX, RGB, or CSS named color         |
| `preset`     | `ThemePreset`                     | `"ocean"`     | Nature preset (used if no `primary`) |
| `harmony`    | `ColorHarmony`                    | `"analogous"` | Color harmony strategy               |
| `secondary`  | `string`                          | auto-derived  | Override the secondary color         |
| `tertiary`   | `string`                          | auto-derived  | Override the tertiary color          |
| `quaternary` | `string`                          | auto-derived  | Override the quaternary color        |
| `spacing`    | `SpacingPreset \| SpacingScale`   | `"default"`   | Spacing scale                        |
| `fontSize`   | `FontSizePreset \| FontSizeScale` | `"default"`   | Font size scale                      |
| `radius`     | `RadiusPreset \| RadiusScale`     | `"default"`   | Border radius scale                  |
| `fontLevel`  | `number`                          | `16`          | Base font level (8-18), consumed by react-native-salt |

### `adjustTheme(theme, overrides): GeneratedTheme`

Apply partial overrides to an existing theme. Immutable - never mutates the input.

```typescript
type ThemeOverrides = {
  light?: ThemeModeOverrides;
  dark?: ThemeModeOverrides;
  both?: ThemeModeOverrides; // applied first; mode-specific wins per-key
};

type ThemeModeOverrides = {
  colors?: Partial<SemanticColors>;
  spacing?: Partial<SpacingScale>;
  radius?: Partial<RadiusScale>;
  fontSizes?: Partial<FontSizeScale>;
  fontLevel?: FontLevel;
  states?: Partial<Record<keyof IntentStates, Partial<StateColors>>>;
  surfaceElevation?: Partial<SurfaceElevation>;
};
```

**Auto-regeneration rules:** When you change a base color, derived fields are automatically recalculated. Providing an explicit override for a derived field skips regeneration (user intent wins).

| Input changed                          | Regenerates             |
|----------------------------------------|-------------------------|
| Any of 8 intent colors or `background` | `states` for all intents|
| `surface` or `primary`                 | `surfaceElevation`      |
| Any color                              | on-colors + `accessibility` |

### `diffTheme(a, b): ThemeDiff`

Returns a structured diff. Sections are only present when changes exist.

```typescript
type FieldChange<T> = { old: T; new: T };

type ThemeModeDiff = {
  colors?: Partial<Record<keyof SemanticColors, FieldChange<string>>>;
  surfaceElevation?: Partial<Record<keyof SurfaceElevation, FieldChange<string>>>;
  spacing?: Partial<Record<keyof SpacingScale, FieldChange<number>>>;
  radius?: Partial<Record<keyof RadiusScale, FieldChange<number>>>;
  fontSizes?: Partial<Record<keyof FontSizeScale, FieldChange<number>>>;
  fontLevel?: FieldChange<number>;
  states?: Partial<Record<keyof IntentStates,
    Partial<Record<keyof StateColors, FieldChange<string>>>>>;
  accessibility?: Partial<Record<keyof AccessibilityReport, {
    ratio?: FieldChange<number>;
    level?: FieldChange<string>;
  }>>;
};

type ThemeDiff = {
  light: ThemeModeDiff;
  dark: ThemeModeDiff;
  identical: boolean;
};
```

### `parseThemeJSON(value: unknown): GeneratedTheme`

Validates and returns a `GeneratedTheme`. Throws with a descriptive error path on invalid input:

```
"theme.dark.states.warning.disabled: expected hex color string"
```

### Color Derivation Functions

For consumers who want partial control over the pipeline:

```typescript
// Derive all 21 semantic colors from a primary
deriveColors(primaryHex: string, mode: "light" | "dark", options?: DeriveColorsOptions): SemanticColors

type DeriveColorsOptions = {
  harmony?: ColorHarmony;
  secondary?: string;
  tertiary?: string;
  quaternary?: string;
};

// Derive a foreground color that meets WCAG AA against the background
deriveOnColor(backgroundHex: string): string

// Adjust foreground color to meet a minimum contrast ratio against background
autoCorrectContrast(foregroundHex: string, backgroundHex: string, minRatio: number): string

// Derive hover/pressed/focused/disabled states for a single color
deriveStateColors(baseHex: string, backgroundHex: string): StateColors

// Derive states for all 8 intents from the full color palette
deriveAllIntentStates(colors: SemanticColors): IntentStates

// Derive 4 surface elevation levels
deriveSurfaceElevation(surfaceHex: string, primaryHex: string, mode: "light" | "dark"): SurfaceElevation

// Get hue offsets and chroma multipliers for a harmony strategy
resolveHarmonyAccents(primaryHue: number, harmony: ColorHarmony): HarmonyAccents | null
// Returns null for "analogous" (use default derivation)

type HarmonyAccents = {
  secondary: { hueOffset: number; chromaMul: number };
  tertiary: { hueOffset: number; chromaMul: number };
  quaternary: { hueOffset: number; chromaMul: number };
};
```

### Color Math Utilities

All operate in OKLCH perceptual color space:

```typescript
// Parsing and conversion
parseColor(input: string): string              // HEX, RGB, CSS name -> normalized 7-char hex
hexToRgb(hex: string): RGB                     // hex -> { r, g, b } (0-255)
rgbToHex(rgb: RGB): string                     // { r, g, b } -> hex
hexToOklch(hex: string): OKLCH                 // hex -> { L, C, H }
oklchToHex(lch: OKLCH): string                 // { L, C, H } -> hex (with gamut clamping)
isValidHex(hex: string): boolean               // true for #RGB or #RRGGBB
normalizeHex(hex: string): string              // #RGB -> #RRGGBB, lowercase
gamutClamp(lch: OKLCH): OKLCH                  // clamp OKLCH to sRGB gamut

// WCAG contrast
relativeLuminance(hex: string): number         // 0-1
contrastRatio(hex1: string, hex2: string): number  // 1-21
meetsWcagAA(fg: string, bg: string): boolean       // ratio >= 4.5
meetsWcagAALarge(fg: string, bg: string): boolean  // ratio >= 3.0

// Color manipulation (return hex strings)
darken(hex: string, amount: number): string     // reduce L by amount (0-1)
lighten(hex: string, amount: number): string    // increase L by amount (0-1)
desaturate(hex: string, factor: number): string // multiply C by (1 - factor)
adjustHue(hex: string, degrees: number): string // rotate H by degrees
setLightness(hex: string, L: number): string    // set absolute L (0-1)
setChroma(hex: string, C: number): string       // set absolute C (0-~0.4)
mix(hex1: string, hex2: string, ratio: number): string // blend in OKLCH, shortest-arc hue
```

## All Exports

Complete list of everything exported by `salt-theme-gen`:

### Functions

| Function                 | Module         |
|--------------------------|----------------|
| `generateTheme`          | generate-theme |
| `adjustTheme`            | adjust-theme   |
| `diffTheme`              | diff-theme     |
| `parseThemeJSON`         | validate       |
| `deriveColors`           | butterfly      |
| `deriveSurfaceElevation` | butterfly      |
| `resolveHarmonyAccents`  | butterfly      |
| `deriveOnColor`          | on-colors      |
| `autoCorrectContrast`    | on-colors      |
| `deriveStateColors`      | state-colors   |
| `deriveAllIntentStates`  | state-colors   |
| `parseColor`             | color-math     |
| `hexToOklch`             | color-math     |
| `oklchToHex`             | color-math     |
| `hexToRgb`               | color-math     |
| `rgbToHex`               | color-math     |
| `relativeLuminance`      | color-math     |
| `contrastRatio`          | color-math     |
| `meetsWcagAA`            | color-math     |
| `meetsWcagAALarge`       | color-math     |
| `darken`                 | color-math     |
| `lighten`                | color-math     |
| `desaturate`             | color-math     |
| `adjustHue`              | color-math     |
| `setLightness`           | color-math     |
| `setChroma`              | color-math     |
| `isValidHex`             | color-math     |
| `normalizeHex`           | color-math     |
| `gamutClamp`             | color-math     |
| `mix`                    | color-math     |

### Types

| Type                   | Description                                                  |
|------------------------|--------------------------------------------------------------|
| `GeneratedTheme`       | Top-level theme: `{ light, dark }`                           |
| `GeneratedThemeMode`   | Single mode with all fields                                  |
| `GenerateThemeOptions` | Input options for `generateTheme`                            |
| `SemanticColors`       | 21 color keys                                                |
| `StateColors`          | `{ hover, pressed, focused, disabled }`                      |
| `IntentStates`         | 8 intents, each with `StateColors`                           |
| `SurfaceElevation`     | `{ card, elevated, modal, popover }`                         |
| `AccessibilityReport`  | 18 contrast entries                                          |
| `ContrastEntry`        | `{ ratio: number; level: "AAA" \| "AA" \| "fail" }`         |
| `SpacingScale`         | 7 spacing keys                                               |
| `RadiusScale`          | 7 radius keys                                                |
| `FontSizeScale`        | 7 font size keys                                             |
| `FontLevel`            | `8 \| 9 \| 10 \| ... \| 18`                                 |
| `ColorHarmony`         | 6 harmony strategies                                         |
| `ThemePreset`          | 20 nature preset names                                       |
| `SpacingPreset`        | `"compact" \| "default" \| "relaxed" \| "spacious"`          |
| `FontSizePreset`       | `"small" \| "default" \| "large" \| "editorial"`             |
| `RadiusPreset`         | `"sharp" \| "default" \| "rounded" \| "pill"`                |
| `NaturePresetData`     | `{ name, hue, chroma, description }`                         |
| `RGB`                  | `{ r: number; g: number; b: number }`                        |
| `Oklab`                | `{ L: number; a: number; b: number }`                        |
| `OKLCH`                | `{ L: number; C: number; H: number }`                        |
| `ThemeOverrides`       | Input for `adjustTheme`                                      |
| `ThemeModeOverrides`   | Per-mode overrides                                           |
| `ThemeDiff`            | Output of `diffTheme`                                        |
| `ThemeModeDiff`        | Per-mode diff                                                |
| `FieldChange<T>`       | `{ old: T; new: T }`                                         |
| `DeriveColorsOptions`  | Options for `deriveColors`                                   |
| `HarmonyAccents`       | Output of `resolveHarmonyAccents`                            |

### Constants

| Constant            | Type                                    |
|---------------------|-----------------------------------------|
| `NATURE_PRESETS`    | `Record<ThemePreset, NaturePresetData>` |
| `SPACING_PRESETS`   | `Record<SpacingPreset, SpacingScale>`   |
| `RADIUS_PRESETS`    | `Record<RadiusPreset, RadiusScale>`     |
| `FONT_SIZE_PRESETS` | `Record<FontSizePreset, FontSizeScale>` |

## Architecture

```
src/
  index.ts           Public API barrel exports
  types.ts           All TypeScript types
  generate-theme.ts  Orchestrator: preset resolution, scale selection, calls pipeline
  butterfly.ts       Butterfly Rule: 1 primary -> 21 semantic colors + surface elevation
  on-colors.ts       On-color derivation + WCAG auto-correction + accessibility report
  state-colors.ts    Hover/pressed/focused/disabled for 8 intents (32 state colors)
  adjust-theme.ts    adjustTheme(): partial overrides with auto-regeneration
  diff-theme.ts      diffTheme(): structured comparison of two themes
  validate.ts        parseThemeJSON(): runtime validation for deserialized themes
  color-math.ts      OKLCH/RGB/Oklab conversions, WCAG contrast, color manipulation
  presets/
    nature-presets.ts    20 nature presets (hue + chroma)
    spacing-presets.ts   4 spacing scales
    radius-presets.ts    4 radius scales
    font-size-presets.ts 4 font size scales
```

**Derivation pipeline:**

```
primary hex
  |
  +-- deriveColors() ----------- 13 base colors (OKLCH Butterfly Rule)
  |     +-- Color Harmony ------ secondary, tertiary, quaternary hue selection
  |     +-- deriveOnColor() ---- 8 on-colors (WCAG AA guaranteed)
  |                               = 21 SemanticColors
  |
  +-- deriveAllIntentStates() -- 8 intents x 4 states = 32 StateColors
  |
  +-- deriveSurfaceElevation() - 4 elevation levels
  |
  +-- buildAccessibilityReport() 18 contrast entries with WCAG levels
```

## Build-time Usage (zero runtime cost)

For apps with static themes, generate at build time and ship only the JSON result. The library adds **0 KB** to your production bundle.

```bash
npm install -D salt-theme-gen
```

```typescript
// scripts/generate-themes.ts
import { generateTheme } from "salt-theme-gen";
import { writeFileSync } from "fs";

const themes = {
  ocean: generateTheme({ preset: "ocean" }),
  sunset: generateTheme({ preset: "sunset" }),
  custom: generateTheme({ primary: "#0E9D8E", harmony: "complementary" }),
};

writeFileSync("src/generated-themes.json", JSON.stringify(themes));
```

Then in your app:

```typescript
import themes from "./generated-themes.json";
// Just a JSON import — no generation logic in the bundle
```

For dynamic theme generation (e.g., user picks a color at runtime), install as a regular dependency instead.

## Use with react-native-salt

```tsx
import { SaltProvider } from "react-native-salt";
import { generateTheme } from "salt-theme-gen";

const theme = generateTheme({ preset: "forest" });

export default function App() {
  return (
    <SaltProvider lightTheme={theme.light} darkTheme={theme.dark}>
      {/* Your app */}
    </SaltProvider>
  );
}
```

## How It Works

1. Parse primary color into OKLCH (perceptually uniform color space)
2. Apply the **Butterfly Rule** - derive 21 semantic colors by shifting lightness, chroma, and hue
3. Apply **color harmony** strategy to determine accent hue relationships
4. Auto-generate on-colors (`onPrimary`, `onDanger`, etc.) with WCAG AA contrast guarantee (4.5:1)
5. Derive **surface elevation** levels (card, elevated, modal, popover)
6. Derive interactive **states** (hover, pressed, focused, disabled) for all 8 intents
7. Produce **accessibility report** with contrast ratios and WCAG levels for 18 color pairs

## License

MIT
