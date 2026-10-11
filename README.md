# salt-theme-gen

**One color. 400+ design tokens. Light + dark. Accessible by default.**

Give it a hex color — or pick one of 20 curated presets. Get back a complete, mathematically correct design system: semantic colors, tonal palettes, interactive states, surface elevations, spacing, radius, typography — then output it to CSS, SCSS, Tailwind, shadcn/ui, Panda CSS, DTCG, Figma Variables, Flutter, or SwiftUI. All from a single function call.

```ts
const theme = generateTheme({ primary: '#0E9D8E' });
```

Built on **OKLCH** — the perceptually uniform color space that makes hue shifts, dark mode, and harmony actually look right. Not HSL. Not sRGB math. OKLCH.

**Zero dependencies. Pure TypeScript. Strict types throughout.**
Works in React Native, React, Next.js, Vue, Svelte, Angular, Node, Bun, Deno — or any JavaScript runtime.

[![npm](https://img.shields.io/npm/v/salt-theme-gen)](https://www.npmjs.com/package/salt-theme-gen)
[![license](https://img.shields.io/npm/l/salt-theme-gen)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)

**Full documentation → [learn.esalt.net/salt-theme-gen](https://learn.esalt.net/salt-theme-gen/)**

---

## Install

```bash
npm install salt-theme-gen
```

---

## Quick Start

```ts
import { generateTheme } from 'salt-theme-gen';

const theme = generateTheme({ primary: '#0E9D8E' });
// or
const theme = generateTheme({ preset: 'ocean' });
```

`theme.light` and `theme.dark` each contain:

- **26 semantic colors** — `primary`, `onPrimary`, `background`, `surface`, `text`, `danger`, `success`, `input`, `ring`, `onMuted` …
- **32 state colors** — hover, pressed, focused, disabled for all 8 intents
- **4 surface elevation levels** — card, elevated, modal, popover
- **88 tonal palette steps** — 11-step scales for all 8 intent colors
- **WCAG accessibility report** — 26 pre-computed contrast checks
- **APCA contrast report** — 26 perceptual contrast checks

`theme.tokens` contains mode-agnostic design tokens:

- **Spacing, radius, font size scales** — 7 steps each
- **Typography scale** — 10 semantic styles (caption → display) with fontSize, lineHeight, fontWeight, letterSpacing
- **Control sizes, avatar sizes, icon sizes, touch targets** — ready for layout
- **Line heights, font weights, letter spacings** — full scales

---

## CSS Custom Properties

```ts
import { generateCssVariables } from 'salt-theme-gen';

const { css } = generateCssVariables(theme, { format: 'both' });
// → ready-to-inject stylesheet
// → hex fallback + @supports oklch() for modern browsers
// → 380+ --salt-* custom properties
```

```css
/* Generated output */
:root {
  --salt-color-primary: #0077dc;
  --salt-color-background: #f5f8ff;
  --salt-palette-primary-500: #3a7ec8;
  --salt-state-primary-hover: #0068c4;
  --salt-spacing-md: 12px;
  --salt-radius-pill: 9999px;
  --salt-type-body-medium-size: 1rem;
  --salt-type-body-medium-line-height: 1.5;
  /* ... 380+ tokens */
}
[data-theme='dark'] { --salt-color-primary: #459af9; /* ... */ }
@supports (color: oklch(0 0 0)) { /* oklch values for modern browsers */ }
```

Options: `format` (`'hex'` | `'oklch'` | `'both'`), `lightSelector`, `darkSelector`, `fluidTypography` (default `false` — set `true` for viewport-responsive `clamp()` on title/display sizes).

---

## Tailwind CSS

```ts
import { generateTailwindConfig } from 'salt-theme-gen';

const { extend } = generateTailwindConfig(theme);
// Spread into tailwind.config.ts → theme.extend
```

```html
<!-- Color, spacing, radius, typography utilities -->
<button class="bg-salt-primary text-salt-on-primary rounded-salt-md px-salt-lg h-salt-control-md">
  Save
</button>
<p class="text-salt-body-medium">Body text with bundled line-height and font-weight.</p>
```

Tailwind tokens include: semantic colors (CSS `var()` refs), tonal palettes, state colors, spacing, border radius, font sizes, semantic typography tuples (`[remSize, { lineHeight, fontWeight, letterSpacing }]`), width + height + minWidth + minHeight for controls, avatars, icons, and touch targets.

---

## React Native

```ts
import { resolveTextStyle } from 'salt-theme-gen';

const bodyStyle = resolveTextStyle(theme.tokens.typography.bodyMedium);
// {
//   fontSize: 16,
//   lineHeight: 24,       // absolute px  (16 × 1.5) — NOT the unitless ratio
//   fontWeight: '400',    // string        — not the number 400
//   letterSpacing: 0,     // absolute px  — not an em decimal
// }
```

`TypographyStyle` stores `lineHeight` as a unitless ratio and `letterSpacing` as an em decimal. Spreading a raw token into `<Text style={...}>` produces incorrect layout in React Native. `resolveTextStyle` converts both to absolute pixel values and `fontWeight` to a string.

```tsx
import { StyleSheet } from 'react-native';
import { resolveTextStyle } from 'salt-theme-gen';

const styles = StyleSheet.create({
  body:    resolveTextStyle(theme.tokens.typography.bodyMedium),
  caption: resolveTextStyle(theme.tokens.typography.caption),
  display: resolveTextStyle(theme.tokens.typography.display),
});
```

---

## Tonal Palettes

```ts
// Already in the theme output
theme.light.palettes.primary[50]   // lightest tint
theme.light.palettes.primary[500]  // mid-range
theme.light.palettes.danger[700]   // dark red — readable on light backgrounds

// Generate for any arbitrary color
import { generateTonalPalette } from 'salt-theme-gen';
const palette = generateTonalPalette('#0f4c81');
```

---

## DTCG Token Export

```ts
import { generateDtcgTokens } from 'salt-theme-gen';

const { json } = generateDtcgTokens(theme);
// W3C Design Tokens format — works with Style Dictionary 4, Token Studio, Theo
// Groups: color.*, spacing.*, radius.*, fontSize.*, controlSize.*, touchTarget.*,
//         typography.*, lineHeight.*, fontWeight.*, letterSpacing.*
```

---

## shadcn/ui (Tailwind v4)

```ts
import { shadcnTheme } from 'salt-theme-gen';

// One call — accepts all generateTheme options plus shadcn-specific options
const { css } = shadcnTheme({ preset: 'ocean', baseColor: 'zinc' });
// → complete importable CSS: @custom-variant dark + @theme inline + :root + .dark + @layer base
```

```ts
// Or two-step for more control
import { generateTheme, generateShadcnTheme } from 'salt-theme-gen';

const theme = generateTheme({ primary: '#6366f1' });
const { css, light, dark } = generateShadcnTheme(theme, {
  baseColor: 'zinc',       // tinted neutral background (neutral | zinc | stone | mauve | olive | mist | taupe)
  includePalettes: true,   // emit --palette-primary-50 … --palette-info-950
});
```

In your `globals.css`:

```css
@import "./salt-theme.css"; /* drop-in, preserves your existing CSS */
```

---

## SCSS Variables

```ts
import { generateScssVariables } from 'salt-theme-gen';

const { scss } = generateScssVariables(theme);
// → $salt-color-primary: #6366f1;
// → $salt-color-primary-dark: #818cf8;  (dark mode with -dark suffix)
// → $salt-spacing-md: 16px;
// → $salt-font-size-md: 1rem;
// → ... all tokens
```

```scss
// In your SCSS:
@use 'salt-theme' as *;

.button {
  background: $salt-color-primary;
  padding: $salt-spacing-sm $salt-spacing-md;
  border-radius: $salt-radius-md;
}

@media (prefers-color-scheme: dark) {
  .button { background: $salt-color-primary-dark; }
}
```

Options: `prefix` (default `"salt"`), `includePalettes` (default `false`).

---

## Panda CSS

```ts
import { generatePandaConfig } from 'salt-theme-gen';

const { tokens, semanticTokens } = generatePandaConfig(theme);
```

```ts
// panda.config.ts
export default defineConfig({
  theme: { tokens, semanticTokens },
});
```

Semantic colors carry `{ value: { base: "#light", _dark: "#dark" } }` — automatic dark mode with zero extra config. Includes all 26 semantic colors, 32 state tokens, surface elevations, spacing, radius, font sizes, and more.

---

## Figma Variables

```ts
import { generateFigmaVariables } from 'salt-theme-gen';

const { payload, json } = generateFigmaVariables(theme);

// POST to the Figma REST API
await fetch(`https://api.figma.com/v1/files/${fileKey}/variables`, {
  method: 'PATCH',
  headers: { 'X-Figma-Token': token, 'Content-Type': 'application/json' },
  body: json,
});
```

Creates two variable collections:

- **Salt / Colors** — semantic colors + states in Light and Dark modes (COLOR type, RGBA 0–1)
- **Salt / Tokens** — spacing, radius, font sizes, control sizes, etc. (FLOAT / STRING)

---

## Flutter / Dart

```ts
import { generateFlutterTheme } from 'salt-theme-gen';

const { dart } = generateFlutterTheme(theme);
// Write to lib/salt_theme.dart
```

```dart
// In your Flutter app:
import 'salt_theme.dart';

Container(color: SaltTheme.primary)
isDark ? SaltTheme.primaryDark : SaltTheme.primary
SizedBox(height: SaltTheme.spacingMd)
```

Light colors use plain names; dark colors add a `Dark` suffix. Tokens are `static const double` / `static const int` constants. `className` option customizes the class name.

---

## SwiftUI

```ts
import { generateSwiftUITheme } from 'salt-theme-gen';

const { swift } = generateSwiftUITheme(theme);
// Write to SaltTheme.swift
```

```swift
// In your SwiftUI app:
import SaltTheme

Text("Hello")
    .foregroundColor(SaltTheme.Colors.primary)
    .padding(SaltTheme.Tokens.spacingMd)
```

Organized as `SaltTheme.Colors.*` (light + `Dark` suffix) and `SaltTheme.Tokens.*` (`CGFloat`/`Font.Weight`). `enumName` option customizes the enum name.

---

## Color Blindness Simulation

```ts
import { simulateTheme, simulateColorBlindness } from 'salt-theme-gen';

// Simulate an entire theme
const sim = simulateTheme(theme, 'deuteranopia');
// → new GeneratedTheme with all colors shifted + accessibility reports recomputed

// Simulate a single color
const shifted = simulateColorBlindness('#e63946', 'protanopia');
```

7 types: `protanopia`, `deuteranopia`, `tritanopia`, `protanomaly`, `deuteranomaly`, `tritanomaly`, `achromatopsia`.

---

## APCA Contrast

```ts
import { apcaContrast, meetsAPCA } from 'salt-theme-gen';

const lc = Math.abs(apcaContrast('#0077dc', '#f5f8ff'));
// → 62.4 (Lc value)

meetsAPCA('#0077dc', '#f5f8ff', 60);
// → true (Lc ≥ 60)

// Already computed in every theme:
theme.light.apca.textOnBackground;
// → { lc: 94.2, level: 'Lc75' }
```

---

## Color Presets (20)

`peacock` · `ocean` · `forest` · `sunset` · `cherry-blossom` · `arctic` · `desert` · `lavender` · `emerald` · `coral-reef` · `midnight` · `autumn` · `rose-gold` · `sapphire` · `mint` · `volcano` · `twilight` · `honey` · `storm` · `aurora`

---

## Scale Presets

| Scale | Options |
| --- | --- |
| `spacing` | `compact` · `default` · `relaxed` · `spacious` |
| `radius` | `sharp` · `default` · `rounded` · `pill` |
| `fontSize` | `small` · `default` · `large` · `editorial` |

Or pass a custom scale object for full control.

---

## Color Harmony

```ts
generateTheme({ primary: '#1e90ff', harmony: 'complementary' });
```

`analogous` (default) · `complementary` · `triadic` · `split-complementary` · `tetradic` · `monochromatic`

---

## Post-generation Tweaks

```ts
import { adjustTheme, diffTheme } from 'salt-theme-gen';

// Fine-tune colors per mode, or override tokens
const tweaked = adjustTheme(theme, {
  light:  { colors: { primary: '#0052cc' } },
  dark:   { colors: { primary: '#4d9fff' } },
  tokens: { spacing: { md: 14 }, controlSizes: { md: 40 } },
});

// Inline token overrides at generation time (same result as adjustTheme)
const theme2 = generateTheme({
  primary: '#0E9D8E',
  tokens:  { spacing: { md: 14 } },
});

// Compare two themes
const diff = diffTheme(theme, tweaked);
console.log(diff.light.colors?.primary); // { old: '#0077dc', new: '#0052cc' }
```

---

## Schema Version

Every generated theme carries a `schemaVersion` field so you can detect format mismatches before they cause silent bugs:

```ts
import { generateTheme, SCHEMA_VERSION } from 'salt-theme-gen';

const theme = generateTheme({ primary: '#0E9D8E' });
console.log(theme.schemaVersion); // "2.0"
console.log(SCHEMA_VERSION);      // "2.0"
```

`parseThemeJSON` validates it automatically — missing or wrong versions throw before any other check runs:

```ts
// Pre-2.0 theme (no schemaVersion) → throws:
// "theme.schemaVersion: missing — this may be a pre-2.0 theme.
//  Regenerate with salt-theme-gen v2.0.0."

// Wrong version → throws:
// "theme.schemaVersion: expected "2.0", got "1.3""
```

`diffTheme` surfaces version mismatches in the diff result:

```ts
const diff = diffTheme(themeA, themeB);
diff.schemaVersion; // { old: "2.0", new: "3.0" } | undefined
```

---

## Validation

```ts
import { parseThemeJSON } from 'salt-theme-gen';

// Safely parse from AsyncStorage, API response, or localStorage
const { theme, tokenWarnings } = parseThemeJSON(JSON.parse(stored));

// Shape errors throw with descriptive paths:
// "theme.dark.states.warning.disabled: expected hex color string"

// Value diagnostics are collected, not thrown:
const errors   = tokenWarnings.filter(w => w.severity === 'error');
const warnings = tokenWarnings.filter(w => w.severity === 'warning');
// errors:   negative sizes, descending breakpoints, fontScale ≤ 1 …
// warnings: touch targets below 24px, body text below 12px, compressed line-height …
```

---

## All Exports

### Functions

| Function | Description |
|----------|-------------|
| `generateTheme` | Main entry point — one color → full theme |
| `generateCssVariables` | CSS custom properties (hex / oklch / both) |
| `generateScssVariables` | SCSS variables — light + dark with `-dark` suffix |
| `generateTailwindConfig` | Tailwind `theme.extend` object |
| `shadcnTheme` | One-call shadcn/ui CSS (Tailwind v4) |
| `generateShadcnTheme` | shadcn/ui CSS from an existing `GeneratedTheme` |
| `generatePandaConfig` | Panda CSS `tokens` + `semanticTokens` |
| `generateDtcgTokens` | W3C Design Tokens (DTCG) export |
| `generateFigmaVariables` | Figma Variables API payload (PATCH `/v1/files/:id/variables`) |
| `generateFlutterTheme` | Flutter/Dart constants class |
| `generateSwiftUITheme` | SwiftUI constants enum |
| `resolveTextStyle` | Convert `TypographyStyle` to React Native `StyleSheet` values |
| `generateTonalPalette` | 11-step tonal scale for any color |
| `generateTonalPalettes` | All 8 tonal palettes from a theme |
| `simulateTheme` | Full theme color blindness simulation |
| `simulateColorBlindness` | Single color color blindness simulation |
| `adjustTheme` | Post-generation color and token overrides |
| `diffTheme` | Structured comparison of two themes |
| `parseThemeJSON` | Runtime validation for deserialized themes |
| `deriveColors` | 26 semantic colors from a primary |
| `deriveSurfaceElevation` | 4 elevation levels |
| `resolveHarmonyAccents` | Hue offsets for harmony strategies |
| `deriveOnColor` | WCAG AA foreground for a background |
| `autoCorrectContrast` | Adjust foreground to meet contrast ratio |
| `buildAPCAReport` | APCA report from color set |
| `deriveStateColors` | hover/pressed/focused/disabled for one color |
| `deriveAllIntentStates` | States for all 8 intents |
| `computeTypographyScale` | Build a 10-style typography scale from font sizes |
| `computeModularFontSizes` | Modular font size scale from base + ratio |
| `apcaContrast` | Signed APCA Lc value |
| `meetsAPCA` | Boolean APCA threshold check |
| `parseColor` | HEX / RGB / oklch() / CSS name → normalized hex |
| `hexToOklch` · `oklchToHex` | OKLCH ↔ hex |
| `hexToRgb` · `rgbToHex` | RGB ↔ hex |
| `relativeLuminance` · `contrastRatio` | WCAG math |
| `meetsWcagAA` · `meetsWcagAALarge` | WCAG threshold checks |
| `darken` · `lighten` · `desaturate` | OKLCH color manipulation |
| `adjustHue` · `setLightness` · `setChroma` | OKLCH channel adjustment |
| `mix` | OKLCH blend with shortest-arc hue |
| `isValidHex` · `normalizeHex` · `gamutClamp` | Utilities |

### Types

`GeneratedTheme` · `GeneratedThemeColors` · `GeneratedThemeTokens` · `GenerateThemeOptions` · `SemanticColors` · `StateColors` · `IntentStates` · `SurfaceElevation` · `TonalPalette` · `TonalPalettes` · `TonalPaletteKey` · `TonalStep` · `TypographyStyle` · `TypographyScale` · `LineHeightScale` · `FontWeightScale` · `LetterSpacingScale` · `FontWeight` · `FontScaleName` · `FontFamilyOptions` · `AccessibilityReport` · `ContrastEntry` · `APCAReport` · `APCAEntry` · `APCALevel` · `CssFormat` · `CssVariablesOptions` · `CssVariablesResult` · `ScssVariablesOptions` · `ScssVariablesResult` · `ShadcnBaseColor` · `ShadcnThemeOptions` · `ShadcnThemeResult` · `ShadcnOneCallOptions` · `TailwindThemeExtend` · `TailwindConfigResult` · `TailwindTypographyTuple` · `PandaToken` · `PandaSemanticColor` · `PandaBaseTokens` · `PandaSemanticTokens` · `PandaConfigOptions` · `PandaConfigResult` · `DtcgToken` · `DtcgColorToken` · `DtcgDimensionToken` · `DtcgGroup` · `DtcgTokensResult` · `FigmaRGBA` · `FigmaColorValue` · `FigmaFloatValue` · `FigmaStringValue` · `FigmaVariableValue` · `FigmaVariable` · `FigmaVariableMode` · `FigmaVariableCollection` · `FigmaVariablesPayload` · `FigmaVariablesOptions` · `FigmaVariablesResult` · `FlutterThemeOptions` · `FlutterThemeResult` · `SwiftUIThemeOptions` · `SwiftUIThemeResult` · `RNTextStyle` · `ColorBlindnessType` · `ColorHarmony` · `ThemePreset` · `SpacingPreset` · `FontSizePreset` · `RadiusPreset` · `SpacingScale` · `RadiusScale` · `FontSizeScale` · `IconSizeScale` · `SemanticIconSizes` · `ControlSizeScale` · `TouchTargetScale` · `BorderWidthScale` · `AvatarSizeScale` · `BreakpointScale` · `ThemeOverrides` · `ThemeColorOverrides` · `ThemeTokenOverrides` · `ThemeDiff` · `ThemeColorsDiff` · `ThemeTokensDiff` · `ThemeModeDiff` · `FieldChange<T>` · `TokenWarning` · `ParseThemeResult` · `SchemaVersion` · `Version` · `DeriveColorsOptions` · `HarmonyAccents` · `RGB` · `OKLCH` · `Oklab`

### Constants

`SCHEMA_VERSION` · `VERSION` · `NATURE_PRESETS` · `SPACING_PRESETS` · `RADIUS_PRESETS` · `FONT_SIZE_PRESETS` · `DEFAULT_ICON_SIZES` · `DEFAULT_SEMANTIC_ICON_SIZES` · `DEFAULT_CONTROL_SIZES` · `DEFAULT_TOUCH_TARGETS` · `DEFAULT_BORDER_WIDTHS` · `DEFAULT_AVATAR_SIZES` · `DEFAULT_BREAKPOINTS` · `FONT_SCALE_RATIOS` · `DEFAULT_LINE_HEIGHTS` · `DEFAULT_FONT_WEIGHTS` · `DEFAULT_LETTER_SPACINGS`

---

## Use with react-native-salt

```tsx
import { SaltProvider } from '@esaltws/react-native-salt';
import { generateTheme } from 'salt-theme-gen';

const theme = generateTheme({ preset: 'forest' });

export default function App() {
  return (
    <SaltProvider lightTheme={theme.light} darkTheme={theme.dark}>
      {/* Your app */}
    </SaltProvider>
  );
}
```

---

**Full guides, integration examples, and API reference → [learn.esalt.net/salt-theme-gen](https://learn.esalt.net/salt-theme-gen/)**

## License

MIT
