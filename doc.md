# doc.md — salt-theme-gen

> Complete reference for AI assistants. Read this before generating code, answering questions, or modifying this package.

## 1. Philosophy

This package answers one question: **"Given a single color, what should every other color in an application be?"**

Design systems fail when humans hand-pick 20+ colors and hope they harmonize. This library replaces manual color picking with **perceptual color math** — one primary color in, a complete light + dark theme out.

Core beliefs:

- **One input, full output.** A user provides a hex color or oklch() string (or picks a preset). The library derives 23 semantic colors, 32 interactive states, 88 tonal palette steps, a WCAG accessibility report, and an APCA report — for both light and dark modes.
- **Perceptual, not numerical.** All color derivation happens in OKLCH, a perceptually uniform color space. "Make it 20% darker" means 20% *visually* darker, not 20% numerically lower in some arbitrary channel.
- **Accessibility is not optional.** Every `onX` color (text on colored backgrounds) is guaranteed to meet WCAG AA contrast (4.5:1). If the initial pick fails, the library auto-corrects by walking the lightness axis.
- **Zero dependencies.** Pure TypeScript math. No native modules, no runtime dependencies. Works in any JS environment.
- **Platform agnostic.** Output is plain JSON-serializable objects with HEX strings for colors — compatible with React Native, web (CSS variables via `generateCssVariables()`), Tailwind, DTCG pipelines, and any framework.

## 2. Architecture

```text
src/
├── index.ts              # Public API surface — re-exports everything
├── types.ts              # All TypeScript types (no runtime code)
├── generate-theme.ts     # Entry point: generateTheme() orchestrator
├── adjust-theme.ts       # adjustTheme() — post-generation overrides
├── diff-theme.ts         # diffTheme() — structured theme comparison
├── validate.ts           # parseThemeJSON() — runtime JSON validation
├── color-math.ts         # Pure math: color space conversions, WCAG, APCA, manipulation
├── butterfly.ts          # The Butterfly Rule: derives 23 semantic colors
├── on-colors.ts          # "on" color derivation + WCAG auto-correction + accessibility reports
├── state-colors.ts       # Interactive states (hover, pressed, focused, disabled)
├── palettes.ts           # generateTonalPalette / generateTonalPalettes (8 × 11-step)
├── css-variables.ts      # generateCssVariables() — hex/oklch/both, @supports
├── dtcg.ts               # generateDtcgTokens() — W3C DTCG format
├── tailwind.ts           # generateTailwindConfig() — Tailwind theme.extend
├── color-blindness.ts    # simulateColorBlindness / simulateTheme (7 CVD types)
└── presets/
    ├── index.ts           # Re-exports all preset data
    ├── nature-presets.ts  # 20 nature-inspired hue+chroma pairs
    ├── spacing-presets.ts # 4 spacing scales (compact → spacious)
    ├── radius-presets.ts  # 4 radius scales (sharp → pill)
    └── font-size-presets.ts # 4 font size scales (small → editorial)
```

### Data flow

```text
User input (hex / oklch() / preset / options)
        │
        ▼
  generateTheme()                       ← generate-theme.ts
        │
        ├─ resolvePrimary()             Parse hex/oklch/preset → primary HEX
        ├─ resolveScale() ×3            Resolve spacing/radius/fontSize presets
        │
        ├─ generateMode("light")
        │   ├─ deriveColors()           ← butterfly.ts   (23 semantic colors)
        │   ├─ deriveAllIntentStates()  ← state-colors.ts (8×4 = 32 states)
        │   ├─ generateTonalPalettes()  ← palettes.ts    (8×11 steps)
        │   └─ buildReports()           ← on-colors.ts   (25 WCAG + 25 APCA)
        │
        └─ generateMode("dark")
            └─ (same pipeline, different lightness rules)
        │
        ▼
  { light: GeneratedThemeMode, dark: GeneratedThemeMode, warnings?: ThemeWarning[] }
```

### Module responsibilities

| Module | Does | Does NOT |
|--------|------|----------|
| `color-math.ts` | Color space math, conversions, WCAG/APCA formulas, gamut clamping | Know about themes, semantic names, or presets |
| `butterfly.ts` | Map one primary → 23 named colors using OKLCH rules | Handle states, accessibility, or presets |
| `on-colors.ts` | Pick white/dark text for colored backgrounds, auto-correct for WCAG, build reports | Generate base colors |
| `state-colors.ts` | Derive hover/pressed/focused/disabled for 8 intents | Know about semantic names |
| `palettes.ts` | Generate 11-step tonal scales per intent | Handle semantic naming |
| `css-variables.ts` | Serialize theme to CSS custom properties (hex / oklch / both) | Modify theme values |
| `dtcg.ts` | Serialize theme to W3C DTCG JSON format | Modify theme values |
| `tailwind.ts` | Generate Tailwind `theme.extend` config with `salt-` prefixed utilities | Modify theme values |
| `color-blindness.ts` | Simulate CVD types via Machado 2009 matrices | Generate original themes |
| `adjust-theme.ts` | Apply partial overrides and regenerate on-colors + reports | Generate from scratch |
| `diff-theme.ts` | Compare two themes, return structured diff | Modify themes |
| `validate.ts` | Parse and validate a JSON object as a GeneratedTheme | Generate themes |
| `generate-theme.ts` | Orchestrate everything, resolve presets, combine into output | Contain any math |
| `presets/*.ts` | Store static data tables | Contain logic |

## 3. The Color Math

### 3.1 Color spaces used

**sRGB** (0–255 per channel) — Input/output format. Colors are HEX strings.

**Linear RGB** (0–1 per channel) — Intermediate. Required because sRGB has a nonlinear gamma curve. All matrix math must happen in linear space.

**Oklab** (L: 0–1, a: ±0.4, b: ±0.4) — Perceptually uniform Cartesian space designed by Björn Ottosson (2020). L = lightness, a = green-red axis, b = blue-yellow axis.

**OKLCH** (L: 0–1, C: 0–~0.4, H: 0–360) — Polar form of Oklab. L = lightness, C = chroma (saturation intensity), H = hue angle. This is the primary working space for all derivation.

### 3.2 Conversion pipeline

```
HEX / oklch() / rgb() / name → parseColor() → HEX
                                                │
HEX → sRGB → Linear RGB → Oklab → OKLCH
                                      ↕  (all derivation here)
HEX ← sRGB ← Linear RGB ← Oklab ← OKLCH
```

Each step:

1. **Input → HEX**: `parseColor()` accepts `#rrggbb`, `#rgb`, `rgb(r,g,b)`, `oklch(L C H)`, and CSS named colors. Always normalizes to 6-digit lowercase HEX.
2. **HEX → sRGB**: Parse hex string to {r, g, b} integers 0–255.
3. **sRGB → Linear RGB**: Apply inverse sRGB transfer function (gamma decoding). `c ≤ 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055)^2.4`
4. **Linear RGB → Oklab**: Matrix multiply using Ottosson's optimized 3×3 matrices (skips XYZ intermediate). Cube-root nonlinearity applied to LMS cone responses.
5. **Oklab → OKLCH**: Cartesian-to-polar conversion. `C = √(a² + b²)`, `H = atan2(b, a)`.

Reverse is the exact inverse of each step.

### 3.3 Why OKLCH, not HSL

HSL is perceptually non-uniform. HSL lightness 50% for yellow (#FFFF00) and blue (#0000FF) look drastically different. OKLCH L=0.5 looks equally "mid-tone" regardless of hue. This means:

- Shifting hue by 60° gives a secondary that *feels* equally vibrant
- Setting L=0.55 for all intent colors makes them visually balanced
- Darkening by 0.08 for hover states produces consistent perceived changes across all hues

### 3.4 Gamut clamping

OKLCH can represent colors outside the sRGB gamut (especially high-chroma blues and greens). When converting back to HEX, out-of-gamut colors are clamped via **binary search on the chroma axis**:

```
If oklchToLinearRgb() gives r,g,b outside [0,1]:
  Binary search: reduce C (chroma) until in-gamut
  25 iterations → precision < 0.000003% of original chroma
  Lightness and hue are preserved; only saturation is reduced
```

### 3.5 WCAG contrast

Contrast ratio follows the WCAG 2.x specification exactly:

```
relativeLuminance = 0.2126·R + 0.7152·G + 0.0722·B   (linear RGB)
contrastRatio = (L_lighter + 0.05) / (L_darker + 0.05)
```

- **AA normal text**: ratio ≥ 4.5
- **AA large text**: ratio ≥ 3.0
- **AAA**: ratio ≥ 7.0

Note: WCAG contrast is calculated in sRGB/linear-RGB space (per spec), NOT in OKLCH.

### 3.6 APCA contrast

APCA (APCA-W3 0.0.98G) is the algorithm proposed for WCAG 3.0. More accurate than WCAG 2.x for perceptual contrast — uses asymmetric exponents and a soft-clamp for very dark backgrounds.

- `apcaContrast(fg, bg)` → raw Lc value (internally signed; library always returns positive)
- `meetsAPCA(fg, bg, minLc)` → boolean
- Levels: **Lc75** (body text) · **Lc60** (large text/UI) · **Lc45** (icons/borders) · **fail** (< 45)
- WCAG auto-corrects failures; APCA is informational only

## 4. The Butterfly Rule

The heart of the package. Named because derivation rules fan out symmetrically from the primary color like butterfly wings on the OKLCH color wheel.

### 4.1 What it derives

From one primary (L, C, H), it produces 13 base colors + 10 "on" colors = **23 semantic colors** (`SemanticColors` type). `surfaceElevation` (4 sub-values) is a separate field on `GeneratedThemeMode`.

### 4.2 Light mode rules — base colors

| Color | L | C | H | Rationale |
|-------|---|---|---|-----------|
| primary | 0.55 | = primary C | = primary H | Fixed mid-tone lightness for readability |
| secondary | 0.58 | primary C × 0.85 | harmony-derived | Analogous by default; ColorHarmony can change angle |
| tertiary | 0.58 | primary C × 0.80 | harmony-derived | Second accent |
| quaternary | 0.58 | primary C × 0.75 | harmony-derived | Third accent |
| background | 0.97 | primary C × 0.03 | = primary H | Near-white with barely visible tint |
| surface | 1.00 | 0 | = primary H | Pure white (cards, modals) |
| text | 0.13 | primary C × 0.05 | = primary H | Near-black with subtle tint |
| muted | 0.55 | primary C × 0.12 | = primary H | Low-saturation mid-tone for secondary text |
| border | 0.88 | primary C × 0.05 | = primary H | Light gray with minimal tint |
| danger | 0.55 | 0.18 | 25° | Fixed red-orange, high chroma for urgency |
| success | 0.55 | 0.16 | 145° | Fixed green |
| warning | 0.62 | 0.16 | 80° | Fixed yellow-orange, slightly lighter for readability |
| info | 0.55 | 0.14 | 235° | Fixed blue |

### 4.3 Dark mode rules — base colors

| Color | L | C | H |
|-------|---|---|---|
| primary | 0.72 | = primary C | = primary H |
| secondary | 0.74 | primary C × 0.80 | harmony-derived |
| tertiary | 0.74 | primary C × 0.75 | harmony-derived |
| quaternary | 0.74 | primary C × 0.70 | harmony-derived |
| background | 0.15 | primary C × 0.04 | = primary H |
| surface | 0.20 | primary C × 0.06 | = primary H |
| text | 0.97 | primary C × 0.03 | = primary H |
| muted | 0.65 | primary C × 0.12 | = primary H |
| border | 0.30 | primary C × 0.05 | = primary H |
| danger | 0.72 | 0.16 | 25° |
| success | 0.72 | 0.14 | 145° |
| warning | 0.75 | 0.14 | 80° |
| info | 0.72 | 0.12 | 235° |

### 4.4 Color harmony strategies

The secondary, tertiary, and quaternary hue angles are derived using the `harmony` option:

| Strategy | Secondary H | Tertiary H | Quaternary H |
|----------|-------------|------------|--------------|
| `analogous` (default) | H + 30° | H + 60° | H − 30° |
| `complementary` | H + 180° | H + 210° | H + 150° |
| `triadic` | H + 120° | H + 240° | H + 60° |
| `split-complementary` | H + 150° | H + 210° | H + 180° |
| `tetradic` | H + 90° | H + 180° | H + 270° |
| `monochromatic` | H | H | H |

### 4.5 Key design decisions

- **Primary-relative vs. fixed**: Background/surface/text/muted/border use `C × factor` for a subtle tint. Intent colors (danger/success/warning/info) use fixed hue and chroma — universally recognizable.
- **Intent lightness L=0.55 (light) / L=0.72 (dark)**: Chosen to reliably achieve WCAG AA against background. Warning uses L=0.62/0.75 because yellow hues need extra lightness.

## 5. "On" Colors and Accessibility

### 5.1 "on" color derivation

For each intent color, an "on" color is the text/icon color placed directly on that background. There are 10 "on" colors: `onPrimary`, `onSecondary`, `onTertiary`, `onQuaternary`, `onBackground`, `onSurface`, `onDanger`, `onSuccess`, `onWarning`, `onInfo`.

Algorithm:
1. Measure the background's relative luminance
2. Pick candidate: luminance > 0.5 → dark text (`#0f172a`), otherwise → white (`#ffffff`)
3. Check WCAG AA (ratio ≥ 4.5)
4. If it fails, run `autoCorrectContrast()`:
   - Binary search on the OKLCH lightness axis
   - Direction: lighten if background is dark, darken if background is light
   - Stop at the first L value that achieves ratio ≥ 4.5

### 5.2 WCAG accessibility report — 25 checks

`AccessibilityReport` has 25 `ContrastEntry` values `{ ratio: number, level: "AAA" | "AA" | "fail" }`:

| Group | Checks |
|-------|--------|
| Text legibility (3) | textOnBackground, textOnSurface, mutedOnBackground |
| Accents on background (4) | primaryOnBackground, secondaryOnBackground, tertiaryOnBackground, quaternaryOnBackground |
| Intent on background (4) | dangerOnBackground, successOnBackground, warningOnBackground, infoOnBackground |
| On-accent foregrounds (6) | onPrimaryOnPrimary, onSecondaryOnSecondary, onTertiaryOnTertiary, onQuaternaryOnQuaternary, onBackgroundOnBackground, onSurfaceOnSurface |
| On-intent foregrounds (4) | onDangerOnDanger, onSuccessOnSuccess, onWarningOnWarning, onInfoOnInfo |
| Text on elevation surfaces (4) | textOnCard, textOnElevated, textOnModal, textOnPopover |

### 5.3 APCA report

`APCAReport` has the same 25 keys as `AccessibilityReport`, each with `{ lc: number, level: APCALevel }`. APCA is informational — no auto-correction is applied based on APCA thresholds.

## 6. Interactive State Colors

For each of the **8 intent colors** (primary, secondary, tertiary, quaternary, danger, success, warning, info), 4 states are derived:

| State | Operation | Rationale |
|-------|-----------|-----------|
| hover | darken by 0.08 L | Subtle darkening, visible feedback |
| pressed | darken by 0.15 L | Stronger depression effect |
| focused | base color + `4d` alpha suffix (30% opacity) | Semi-transparent ring/glow |
| disabled | desaturate to 30% chroma, then lighten by 0.15 | Washed-out, clearly inactive |

Total: 8 intents × 4 states = **32 state colors** per theme mode.

## 7. Tonal Palettes

For each of the 8 intent colors, an 11-step tonal scale is generated:

- **Steps**: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
- **Method**: Binary-search OKLCH lightness to match perceptual target for each step
- **Output**: `TonalPalettes` — 8 palettes × 11 steps = **88 HEX strings** in `theme.light.palettes` and `theme.dark.palettes`
- Keys: `primary`, `secondary`, `tertiary`, `quaternary`, `danger`, `success`, `warning`, `info`

## 8. Nature Presets

20 presets mapped to OKLCH hue + chroma values:

| Preset | Hue | Chroma | Character |
|--------|-----|--------|-----------|
| peacock | 195° | 0.15 | High-chroma teal, vibrant |
| ocean | 220° | 0.18 | Deep blue, default preset |
| forest | 140° | 0.14 | Natural green |
| sunset | 35° | 0.16 | Warm orange |
| cherry-blossom | 355° | 0.12 | Soft pink |
| arctic | 210° | 0.08 | Low-chroma ice blue, muted |
| desert | 50° | 0.13 | Sandy warm tones |
| lavender | 290° | 0.10 | Gentle purple |
| emerald | 150° | 0.16 | Rich saturated green |
| coral-reef | 25° | 0.16 | Warm coral |
| midnight | 250° | 0.10 | Deep indigo |
| autumn | 40° | 0.15 | Burnt orange |
| rose-gold | 15° | 0.08 | Low-chroma warm pink |
| sapphire | 230° | 0.15 | Rich blue |
| mint | 175° | 0.10 | Cool fresh green |
| volcano | 20° | 0.18 | Highest chroma, fiery red-orange |
| twilight | 270° | 0.10 | Dusk purple |
| honey | 60° | 0.15 | Golden amber |
| storm | 240° | 0.04 | Lowest chroma, near-monochrome gray-blue |
| aurora | 185° | 0.13 | Northern lights teal-violet |

Presets are converted to primary HEX via `oklchToHex({ L: 0.55, C: preset.chroma, H: preset.hue })`.

## 9. Scale Presets

### Spacing (px values)

| Preset | none | xs | sm | md | lg | xl | xxl |
|--------|------|----|----|----|----|----|-----|
| compact | 0 | 2 | 4 | 8 | 12 | 16 | 24 |
| default | 0 | 4 | 8 | 12 | 16 | 24 | 32 |
| relaxed | 0 | 6 | 12 | 16 | 20 | 32 | 40 |
| spacious | 0 | 8 | 16 | 20 | 28 | 40 | 52 |

### Radius (px values)

| Preset | none | sm | md | lg | xl | xxl | pill |
|--------|------|----|----|----|----|----|------|
| sharp | 0 | 2 | 4 | 6 | 8 | 10 | 0 |
| default | 0 | 6 | 10 | 14 | 20 | 24 | 999 |
| rounded | 0 | 10 | 14 | 18 | 24 | 30 | 999 |
| pill | 0 | 14 | 18 | 24 | 30 | 40 | 999 |

`RadiusPreset` values: `"sharp" | "default" | "rounded" | "pill"` — `"none"` is NOT a valid preset.

### Font sizes (px values)

| Preset | xs | sm | md | lg | xl | xxl | 3xl |
|--------|----|----|----|----|----|----|-----|
| small | 10 | 12 | 14 | 16 | 20 | 26 | 32 |
| default | 12 | 14 | 16 | 18 | 20 | 24 | 32 |
| large | 14 | 16 | 18 | 24 | 28 | 36 | 44 |
| editorial | 14 | 16 | 20 | 28 | 36 | 48 | 56 |

## 10. Output Shape

```typescript
type GeneratedTheme = {
  light: GeneratedThemeMode;
  dark: GeneratedThemeMode;
  warnings?: ThemeWarning[];  // present only when user-provided colors triggered WCAG issues
};

type GeneratedThemeMode = {
  mode: "light" | "dark";
  colors: SemanticColors;        // 23 HEX strings
  palettes: TonalPalettes;       // 8 intents × 11 steps = 88 HEX strings
  surfaceElevation: SurfaceElevation; // card, elevated, modal, popover (4 HEX strings)
  spacing: SpacingScale;         // 7 numbers
  radius: RadiusScale;           // 7 numbers
  fontSizes: FontSizeScale;      // 7 numbers
  iconSizes: IconSizeScale;      // 7 numbers
  sizeMap: SizeMapScale;         // 7 numbers
  dimensions: DimensionScale;    // 7 numbers
  fontLevel: FontLevel;          // 8–18
  states: IntentStates;          // 8 intents × 4 states = 32 HEX strings
  accessibility: AccessibilityReport; // 25 WCAG contrast entries
  apca: APCAReport;              // 25 APCA contrast entries
};
```

The output is a plain JSON-serializable object. No classes, no methods, no side effects — safe to serialize to AsyncStorage, pass through React Context, snapshot in tests, or generate at build time.

## 11. Integration with react-native-salt

```tsx
import { SaltProvider } from "react-native-salt";
import { generateTheme } from "salt-theme-gen";

const theme = generateTheme({ preset: "forest", radius: "rounded" });

<SaltProvider lightTheme={theme.light} darkTheme={theme.dark}>
  {children}
</SaltProvider>
```

The `GeneratedThemeMode` type is shaped to match `react-native-salt`'s `Theme` type. `colors`, `spacing`, `radius`, `fontSizes`, `iconSizes`, `sizeMap`, and `dimensions` align 1:1. `states`, `accessibility`, `apca`, and `palettes` are extras available for custom components.

## 12. Public API Surface

### Primary function

```typescript
generateTheme(options?: GenerateThemeOptions): GeneratedTheme
```

Options: `preset`, `primary` (hex), `secondary`, `tertiary`, `quaternary`, `harmony`, `colors`, `override`, `spacing`, `fontSize`, `radius`, `fontLevel`.

### Post-generation utilities

```typescript
adjustTheme(theme, overrides): GeneratedTheme
// Apply partial color/scale overrides; re-derives on-colors and rebuilds reports.
// Color values accept HEX, rgb(), oklch(), or CSS names.

diffTheme(themeA, themeB): ThemeDiff
// Structured comparison — returns changed keys with old/new values.

parseThemeJSON(json): GeneratedTheme
// Runtime validation; throws on invalid shape. Use to validate stored/fetched themes.
```

### CSS / token export

```typescript
generateCssVariables(theme, options?): { css: string; light: string; dark: string }
// options.format: 'hex' | 'oklch' | 'both' (default: 'hex')
// 'both' emits hex first, then @supports (color: oklch(...)) block with oklch values.
// Variable prefix: --salt-color-*, --salt-spacing-*, --salt-state-*, --salt-palette-*

generateDtcgTokens(theme): DtcgTokenFile
// W3C Design Tokens Community Group format.
// Compatible with Style Dictionary and Token Studio.

generateTailwindConfig(theme): TailwindThemeConfig
// Returns theme.extend object for tailwind.config.js.
// Uses salt- prefixed CSS var references: salt-primary, salt-bg, etc.
```

### Color blindness simulation

```typescript
simulateColorBlindness(hex, type): string
// Types: 'protanopia' | 'deuteranopia' | 'tritanopia' |
//        'protanomaly' | 'deuteranomaly' | 'tritanomaly' | 'achromatopsia'
// Returns simulated HEX using Machado 2009 matrices.

simulateTheme(theme, type): GeneratedTheme
// Applies CVD simulation to every color in the theme.
```

### Color utilities

| Function | Signature | Purpose |
|----------|-----------|---------|
| `parseColor` | `(input: string) → string` | Accept HEX, `rgb()`, `oklch(L C H)`, CSS names → normalized HEX |
| `hexToOklch` | `(hex: string) → OKLCH` | Convert HEX to OKLCH |
| `oklchToHex` | `(lch: OKLCH) → string` | Convert OKLCH to HEX (with gamut clamping) |
| `contrastRatio` | `(hex1, hex2) → number` | WCAG contrast ratio |
| `meetsWcagAA` | `(fg, bg) → boolean` | Check ≥ 4.5 |
| `meetsWcagAALarge` | `(fg, bg) → boolean` | Check ≥ 3.0 |
| `apcaContrast` | `(fg, bg) → number` | APCA-W3 Lc value (positive) |
| `meetsAPCA` | `(fg, bg, minLc) → boolean` | Check against Lc threshold |
| `darken` | `(hex, amount) → string` | Reduce L by amount |
| `lighten` | `(hex, amount) → string` | Increase L by amount |
| `desaturate` | `(hex, factor) → string` | Multiply C by factor |
| `adjustHue` | `(hex, degrees) → string` | Rotate H by degrees |
| `setLightness` | `(hex, L) → string` | Set absolute L (0–1) |
| `setChroma` | `(hex, C) → string` | Set absolute C |
| `gamutClamp` | `(lch: OKLCH) → OKLCH` | Clamp to sRGB gamut |

### Derivation functions (partial control)

| Function | Purpose |
|----------|---------|
| `deriveColors(primaryHex, mode, harmony?, overrides?)` | Run Butterfly Rule only |
| `deriveOnColor(backgroundHex)` | Get WCAG-safe text color for any background |
| `autoCorrectContrast(fg, bg, minRatio?)` | Walk lightness to meet contrast target |
| `deriveStateColors(baseHex)` | Get hover/pressed/focused/disabled for one color |
| `deriveAllIntentStates(colors)` | Get states for all 8 intents |
| `generateTonalPalette(hex)` | Get 11-step tonal scale for one color |
| `generateTonalPalettes(colors)` | Get all 8 tonal palettes at once |

### Preset data (for building UI pickers)

- `NATURE_PRESETS` — `Record<ThemePreset, NaturePresetData>`
- `SPACING_PRESETS` — `Record<SpacingPreset, SpacingScale>`
- `RADIUS_PRESETS` — `Record<RadiusPreset, RadiusScale>`
- `FONT_SIZE_PRESETS` — `Record<FontSizePreset, FontSizeScale>`

## 13. Constraints and Boundaries

- **HEX-in, HEX-out for theme colors.** `generateTheme()` always outputs HEX strings. OKLCH is internal math only. `generateCssVariables({ format: 'oklch' })` is the way to get oklch CSS output.
- **oklch() accepted as input.** `parseColor()` accepts `oklch(L C H)` strings (L: 0–1, C: ≥ 0, H: any). `adjustTheme()` accepts them in color overrides too.
- **No HSL anywhere.** The entire pipeline is sRGB ↔ Oklab ↔ OKLCH. HSL is avoided for perceptual accuracy.
- **No runtime dependencies.** Every function is pure math. No crypto, no platform APIs, no network.
- **Immutable output.** `generateTheme()` returns a new object every call. No caching, no mutation, no singletons.
- **fontLevel is pass-through.** Clamped to 8–18 and included in output but doesn't affect `fontSizes`. The React Native UI kit uses it for dynamic scaling at runtime.
- **WCAG auto-corrects, APCA does not.** The library guarantees every `onX` color passes WCAG AA. APCA results are informational — you may use `meetsAPCA()` to build your own gates.
- **`RadiusPreset` has no `"none"` value.** Valid values: `"sharp" | "default" | "rounded" | "pill"`.
- **`ThemePreset` has 20 values.** There is no `"danger-heavy"`, `"neon"`, `"pastel"`, or similar.

## 14. Version History

| Version | Change |
|---------|--------|
| v1.3.1 | Fix: `adjustTheme()` oklch string input produced `#NaNNaNNaN` — fixed by routing overrides through `parseColor()` |
| v1.3.0 | Tonal palettes, `generateCssVariables()`, APCA, `generateDtcgTokens()`, `generateTailwindConfig()`, color blindness simulation, tertiary + quaternary colors |
| v1.2.2 | Icon sizes, dimension scale, `sizeMap` |
| v1.2.1 | ESM + CJS dual output |
