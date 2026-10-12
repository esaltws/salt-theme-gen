# AGENTS.md — salt-theme-gen

> Reference for AI agents. Read before writing code, modifying types, or answering questions about this package.

---

## What this is

`salt-theme-gen` v2.0.0 — a zero-dependency TypeScript library that turns one hex color into a complete light + dark design system.

- **Input**: a hex color string (or a preset name)
- **Output**: 26 semantic colors, 88 tonal palette steps, 32 interactive state colors, 4 surface elevation levels, typography scale, spacing/radius/size tokens, WCAG and APCA contrast reports — for both light and dark modes
- **Formats**: JavaScript objects, CSS custom properties, SCSS variables, Tailwind `theme.extend`, shadcn/ui CSS, Panda CSS tokens, W3C DTCG tokens, Figma Variables payload, Flutter/Dart constants, SwiftUI constants, React Native `StyleSheet` values
- **Constraints**: zero runtime dependencies, pure TypeScript, strict mode, CJS + ESM dual output

---

## Repository layout

```
src/                   TypeScript source (all logic + tests)
dist/                  Build output — generated, never hand-edited
  cjs/                 CommonJS build
  esm/                 ESM build
src/*.test.ts          Vitest tests alongside each source file
CHANGELOG.md           Version history
README.md              Public documentation
CLAUDE.md              Claude Code reference
AGENTS.md              AI agent reference (this file)
doc.md                 Extended internal reference
package.json           npm metadata, scripts
tsconfig.json          Base TypeScript config
tsconfig.cjs.json      CJS build config
tsconfig.esm.json      ESM build config
vitest.config.ts       Test runner config
```

### Source files

| File | Responsibility |
| --- | --- |
| `index.ts` | Public API surface — re-exports only |
| `types.ts` | All TypeScript types — no runtime code |
| `file-header.ts` | Internal utility: `buildCssHeader` / `buildScssHeader` / `buildJsonDescription` |
| `generate-theme.ts` | `generateTheme()` orchestrator |
| `adjust-theme.ts` | `adjustTheme()`, `adjustTokens()` |
| `diff-theme.ts` | `diffTheme()` |
| `validate.ts` | `parseThemeJSON()` — shape validation + token diagnostics |
| `rn-utils.ts` | `resolveTextStyle()` — React Native typography |
| `color-math.ts` | OKLCH/sRGB/hex math, WCAG, APCA, color manipulation |
| `butterfly.ts` | Derives 26 semantic colors from one primary (Butterfly Rule) |
| `on-colors.ts` | "on" color derivation, WCAG auto-correction, contrast reports |
| `state-colors.ts` | hover/pressed/focused/disabled for 8 intents |
| `palettes.ts` | 11-step OKLCH tonal palettes |
| `css-variables.ts` | `generateCssVariables()` |
| `scss.ts` | `generateScssVariables()` — SCSS variables with `-dark` suffix |
| `shadcn.ts` | `generateShadcnTheme()` / `shadcnTheme()` — Tailwind v4 + shadcn/ui CSS |
| `dtcg.ts` | `generateDtcgTokens()` — W3C DTCG format |
| `tailwind.ts` | `generateTailwindConfig()` |
| `panda.ts` | `generatePandaConfig()` — Panda CSS tokens + semanticTokens |
| `figma.ts` | `generateFigmaVariables()` — Figma Variables REST API payload |
| `flutter.ts` | `generateFlutterTheme()` — Flutter/Dart constants class |
| `swiftui.ts` | `generateSwiftUITheme()` — SwiftUI constants enum |
| `color-blindness.ts` | `simulateColorBlindness()` / `simulateTheme()` |
| `typography-utils.ts` | Typography scale computation |
| `icon-utils.ts` | Size constants |
| `cli.ts` | CLI entry point — `generate` / `export` / `validate` / `diff` / `simulate` / `adjust` |
| `presets/` | Nature presets, spacing/radius/fontSize preset tables |

---

## Development commands

```bash
npm test              # Run all tests (vitest run) — must pass before any commit
npm run test:watch    # Watch mode
npm run typecheck     # tsc --noEmit — zero errors required
npm run build         # Compile to dist/ (CJS + ESM)
```

---

## CLI

The package ships a `salt-theme-gen` binary (CJS, `dist/cjs/cli.js`). It requires no arguments besides a command and wraps the library API as a Unix-friendly tool: stdout = result, stderr = warnings/errors.

### Exit codes

| Code | Meaning |
| ---- | ------- |
| `0` | Success |
| `1` | Domain error (validation failed, token errors, WCAG issues) |
| `2` | Input error (bad flags, missing args, unreadable file, invalid JSON) |

### Commands

| Command | Purpose | Key flags |
| ------- | ------- | --------- |
| `generate` | Create a theme from a color or preset | `--primary`, `--preset`, `--format`, `--mode`, `--out` |
| `export` | Convert a saved `GeneratedTheme` JSON to another format | `--format` (required), `--mode`, `--out` |
| `validate` | Validate a theme JSON; exits 1 on `severity:"error"` token diagnostics | — |
| `diff` | Compare two themes; exits 1 when differences exist, 0 when identical | `--json` |
| `simulate` | Apply CVD simulation; accepts a file or generates from `--primary`/`--preset` | `--type`, `--format`, `--mode` |
| `adjust` | Apply `ThemeOverrides` (file or stdin) to a theme | `--overrides`, `--format`, `--mode` |

### Formats (`--format`)

`json` (default) · `css` · `scss` · `tailwind` · `dtcg` · `shadcn` · `panda` · `figma` · `flutter` · `swiftui`

### Modes (`--mode`, for `css`/`scss` only)

`both` (default) · `light` · `dark` — `light`/`dark` emit raw declarations without a selector wrapper.

### Key behaviors

- `--quiet` / `--silent` suppress stderr warnings; must be placed **after** the command name, not before.
- `loadTheme` rejects themes with `severity:"error"` token diagnostics before processing (exits 1).
- `validate` distinguishes errors (exit 1) from warnings (exit 0, printed to stderr).
- `export`, `simulate`, and `validate` accept `-` as the file argument to read from stdin.
- `adjust` reads the theme from a file (or stdin with `-`) and the overrides from `--overrides <file>` or stdin when `--overrides` is omitted. Both cannot be stdin simultaneously.
- Output always ends with a newline.

### Examples

```bash
# Generate CSS and write to file
salt-theme-gen generate --preset ocean --format css --out theme.css

# Export a saved theme to Tailwind
salt-theme-gen export theme.json --format tailwind

# Pipe through adjust then validate
cat theme.json | salt-theme-gen adjust - --overrides changes.json | salt-theme-gen validate -

# Compare two themes
salt-theme-gen diff old.json new.json --json

# CVD simulation, dark CSS only
salt-theme-gen simulate theme.json --type deuteranopia --format css --mode dark
```

---

## GeneratedTheme shape

```ts
type GeneratedTheme = {
  schemaVersion: SchemaVersion;     // "2.0" — stamped by generateTheme, validated by parseThemeJSON
  light:    GeneratedThemeColors;   // per-mode color data
  dark:     GeneratedThemeColors;   // same structure, different values
  tokens:   GeneratedThemeTokens;   // mode-agnostic: spacing, typography, sizes, …
  warnings?: ThemeWarning[];        // present only when user colors failed WCAG
};

type GeneratedThemeColors = {
  mode:             "light" | "dark";
  colors:           SemanticColors;      // 26 hex strings
  palettes:         TonalPalettes;       // 8 intents × 11 steps
  surfaceElevation: SurfaceElevation;    // card, elevated, modal, popover
  states:           IntentStates;        // 8 intents × 4 states = 32 hex strings
  accessibility:    AccessibilityReport; // 26 WCAG contrast checks
  apca:             APCAReport;          // 26 APCA contrast checks
};

type GeneratedThemeTokens = {
  spacing:        SpacingScale;       // none xs sm md lg xl xxl
  radius:         RadiusScale;        // none sm md lg xl xxl pill
  fontSizes:      FontSizeScale;      // xs sm md lg xl xxl 3xl
  iconSizes:      IconSizeScale;      // xs sm md lg xl xxl 3xl
  icons:          SemanticIconSizes;  // inline compact control navigation feature hero
  controlSizes:   ControlSizeScale;   // xs sm md lg xl (component row heights)
  touchTargets:   TouchTargetScale;   // minimum recommended comfortable
  borderWidths:   BorderWidthScale;   // none thin medium thick
  avatarSizes:    AvatarSizeScale;    // xs sm md lg xl xxl
  breakpoints:    BreakpointScale;    // sm md lg xl xxl
  baseFont:       number;             // px (default 16)
  fontScale:      number;             // modular ratio (default 1.25)
  fontFamilySans?:    string;
  fontFamilyDisplay?: string;
  typography:     TypographyScale;    // 10 styles: caption → display
  lineHeights:    LineHeightScale;    // none tight snug normal relaxed loose
  fontWeights:    FontWeightScale;    // light regular medium semibold bold extrabold
  letterSpacings: LetterSpacingScale; // tight normal wide wider widest
};
```

---

## Critical invariants

### Colors

- All colors in `GeneratedTheme` are **hex strings** — `#rrggbb` lowercase 6-digit. Never oklch strings in output.
- All color math happens in **OKLCH** — never manipulate sRGB channels directly for perceptual operations.
- WCAG AA (4.5:1) is guaranteed for all `onX` colors — auto-correction walks the lightness axis.

### Typography

- `TypographyStyle.lineHeight` is a **unitless ratio** (e.g. `1.5`) — multiply by `fontSize` to get px.
- `TypographyStyle.letterSpacing` is an **em decimal** (e.g. `0.04` = 0.04em) — multiply by `fontSize` to get px.
- Use `resolveTextStyle(style)` for React Native — raw values break layout silently.

### Exports and naming

- camelCase internally (`onPrimary`, `bodyMedium`) → kebab-case in CSS/Tailwind/DTCG (`on-primary`, `body-medium`).
- Tailwind colors are CSS `var()` refs — require `generateCssVariables` in the page CSS.
- `controlSizes` is canonical — `sizeMap` and `dimensions` were deleted in v2.0.0.
- `generateCssVariables` `fluidTypography` defaults to `false` — opt in explicitly.
- `parseThemeJSON` returns `{ theme, tokenWarnings }` — not a bare `GeneratedTheme`.
- `schemaVersion: "2.0"` is stamped on every `GeneratedTheme` by `generateTheme`, preserved by `adjustTheme` and `simulateTheme`. `parseThemeJSON` validates it first — missing or wrong version throws before any other check. `SCHEMA_VERSION` constant, `SchemaVersion` type, `VERSION` constant (`"2.0.0-rc.3"`), and `Version` type are exported from `index.ts`.
- All generated file outputs (CSS, SCSS, Dart, Swift, DTCG JSON) include a generation header with function name, primary seed, and non-default options. **No timestamp** — output is deterministic (same input → identical bytes).

---

## CSS variable naming

| Token | Pattern | Example |
| --- | --- | --- |
| Semantic color | `--salt-color-{key}` | `--salt-color-on-primary` |
| Tonal palette | `--salt-palette-{intent}-{step}` | `--salt-palette-danger-700` |
| Surface elevation | `--salt-surface-{key}` | `--salt-surface-modal` |
| State color | `--salt-state-{intent}-{state}` | `--salt-state-primary-hover` |
| Spacing | `--salt-spacing-{key}` | `--salt-spacing-md` |
| Radius | `--salt-radius-{key}` | `--salt-radius-pill` |
| Font size | `--salt-font-size-{key}` | `--salt-font-size-md` |
| Control size | `--salt-control-{key}` | `--salt-control-md` |
| Touch target | `--salt-touch-target-{key}` | `--salt-touch-target-recommended` |
| Typography | `--salt-type-{key}-{prop}` | `--salt-type-body-medium-size` |

**Removed in v2.0.0:** `--salt-size-*`, `--salt-dimension-*`.

---

## SCSS variable naming

Light mode: `$salt-color-primary`, `$salt-spacing-md`, `$salt-radius-lg` (no suffix).
Dark mode adds `-dark` suffix: `$salt-color-primary-dark`.
Mode-agnostic tokens (spacing, radius, typography, sizes) are emitted once, in the light block.

---

## What not to do

- Do not add `sizeMap` or `dimensions` back — deleted in v2.0.0.
- Do not emit oklch strings from `generateTheme` — all output colors are hex.
- Do not make `fluidTypography: true` the default.
- Do not add runtime dependencies — zero-dep is a hard constraint.
- Do not edit `dist/` — generated by `npm run build`.
- Do not use `as any` or `// @ts-ignore` — fix types properly.
- Do not commit with failing tests.

---

## v2.0.0 changes summary

### Breaking

| What changed | Before | After |
| --- | --- | --- |
| `parseThemeJSON` return type | `GeneratedTheme` | `{ theme, tokenWarnings }` |
| `GeneratedThemeTokens.sizeMap` | present | removed |
| `GeneratedThemeTokens.dimensions` | present | removed |
| `generateCssVariables` fluid default | `true` | `false` |
| CSS vars `--salt-size-*` / `--salt-dimension-*` | emitted | removed |
| DTCG groups `size.*` / `dimension.*` | present | removed |

### New

- `schemaVersion: "2.0"` field on `GeneratedTheme`; `SCHEMA_VERSION` constant, `SchemaVersion` type, `VERSION` constant, `Version` type exported; `diffTheme` surfaces version mismatches as `FieldChange<string>`
- `resolveTextStyle(style: TypographyStyle): RNTextStyle` — React Native typography helper
- `generateTheme({ tokens: {...} })` — generation-time token overrides
- `TokenWarning` / `ParseThemeResult` types
- DTCG groups `controlSize.*` and `touchTarget.*`
- Tailwind: `height`, `minWidth`, `minHeight` utilities; typography `fontSize` tuples
- `generateScssVariables()` — SCSS variables with `-dark` suffix for dark mode
- `generateShadcnTheme()` / `shadcnTheme()` — Tailwind v4 + shadcn/ui compatible CSS
- `generatePandaConfig()` — Panda CSS `tokens` + `semanticTokens` objects
- `generateFigmaVariables()` — Figma Variables REST API payload
- `generateFlutterTheme()` — Flutter/Dart constants class
- `generateSwiftUITheme()` — SwiftUI constants enum
- New semantic tokens: `input` (form control border), `ring` (focus indicator), `onMuted` (readable foreground for muted surfaces)
- Generation headers on all file outputs (CSS, SCSS, Dart, Swift, DTCG JSON)

---

## API reference

### `generateTheme(options?)`

```typescript
import { generateTheme } from "salt-theme-gen";

const theme = generateTheme({ primary: "#6366f1" });
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `primary` | `string` | — | Hex color seed (e.g. `"#6366f1"`) |
| `preset` | `ThemePreset` | — | Named preset — used instead of `primary` |
| `harmony` | `ColorHarmony` | `undefined` | Derives secondary/tertiary/quaternary from `primary` |
| `secondary` | `string` | auto-derived | Override secondary hex |
| `tertiary` | `string` | auto-derived | Override tertiary hex |
| `quaternary` | `string` | auto-derived | Override quaternary hex |
| `spacing` | `SpacingPreset \| Partial<SpacingScale>` | `"comfortable"` | Spacing scale |
| `radius` | `RadiusPreset \| Partial<RadiusScale>` | `"rounded"` | Radius scale |
| `fontSize` | `FontSizePreset \| Partial<FontSizeScale>` | `"medium"` | Font size scale |
| `baseFont` | `number` | `16` | Base font size in px |
| `fontScale` | `number` | `1.25` | Modular type scale ratio |
| `fontFamily` | `{ sans?: string; display?: string }` | `undefined` | Font family overrides |
| `colors` | `{ both?, light?, dark? }` | — | Per-mode color overrides at generation time |
| `tokens` | `ThemeTokenOverrides` | — | Token overrides at generation time |
| `preservePrimary` | `boolean` | `false` | Skip auto-correction on the primary color |

**`ThemePreset` values** (20 presets):
`"peacock"` `"ocean"` `"forest"` `"sunset"` `"cherry-blossom"` `"arctic"` `"desert"` `"lavender"` `"emerald"` `"coral-reef"` `"midnight"` `"autumn"` `"rose-gold"` `"sapphire"` `"mint"` `"volcano"` `"twilight"` `"honey"` `"storm"` `"aurora"`

**`ColorHarmony` values**:
`"analogous"` `"complementary"` `"triadic"` `"split-complementary"` `"tetradic"` `"monochromatic"`

**`SpacingPreset` values**: `"compact"` `"comfortable"` `"spacious"` `"touch"`

**`RadiusPreset` values**: `"sharp"` `"rounded"` `"smooth"` `"pill"`

**`FontSizePreset` values**: `"small"` `"medium"` `"large"` `"editorial"`

---

### `generateCssVariables(theme, options?)`

```typescript
import { generateCssVariables } from "salt-theme-gen";

const { css, light, dark, classes } = generateCssVariables(theme, {
  format: "oklch",
  fluidTypography: true,
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `format` | `"hex" \| "oklch" \| "both"` | `"hex"` | Color value format in output |
| `lightSelector` | `string` | `":root"` | CSS selector for light mode block |
| `darkSelector` | `string` | `"[data-theme='dark']"` | CSS selector for dark mode block |
| `prefix` | `string` | `"salt"` | CSS variable prefix (`--{prefix}-color-*`) |
| `fluidTypography` | `boolean` | `false` | Emit `clamp()` for titleSmall–display sizes |

Returns `{ css, light, dark, classes }`. Use `css` for a complete file; `light`/`dark` are bare declarations without selectors.

---

### `generateScssVariables(theme, options?)`

```typescript
import { generateScssVariables } from "salt-theme-gen";

const { scss } = generateScssVariables(theme);
// $salt-color-primary: #hex;          ← light (no suffix)
// $salt-color-primary-dark: #hex;     ← dark (-dark suffix)
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `prefix` | `string` | `"salt"` | Variable prefix |
| `includePalettes` | `boolean` | `false` | Emit tonal palette steps |

Returns `{ scss, light, dark }`.

---

### `generateShadcnTheme(theme, options?)` / `shadcnTheme(options?)`

```typescript
import { generateShadcnTheme, shadcnTheme } from "salt-theme-gen";

// Two-step (existing theme):
const { css } = generateShadcnTheme(theme, { baseColor: "zinc" });

// One-step (generate + format in one call):
const { css } = shadcnTheme({ primary: "#6366f1", baseColor: "neutral" });
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `baseColor` | `ShadcnBaseColor` | `undefined` | Neutral background tint |
| `includePalettes` | `boolean` | `false` | Emit `--palette-*` tonal steps |

**`ShadcnBaseColor` values**: `"neutral"` `"zinc"` `"stone"` `"mauve"` `"olive"` `"mist"` `"taupe"`

`shadcnTheme` accepts all `GenerateThemeOptions` plus `ShadcnThemeOptions` — no need to call `generateTheme` first.

Output `css` is a complete importable file: `@custom-variant dark`, `@theme inline`, `:root`, `.dark`, `@layer base`.

Returns `{ css, light, dark }`.

---

### `generateTailwindConfig(theme)`

```typescript
import { generateTailwindConfig } from "salt-theme-gen";

const { extend } = generateTailwindConfig(theme);
// In tailwind.config.ts:  theme: { extend }
```

No options. Returns `{ extend, json }`. Spread `extend` directly into `tailwind.config.ts`. Colors are CSS `var()` refs — requires `generateCssVariables` output in the page CSS.

---

### `generateDtcgTokens(theme)`

```typescript
import { generateDtcgTokens } from "salt-theme-gen";

const { json } = generateDtcgTokens(theme);
// Write json to tokens.json — compatible with Style Dictionary and Token Studio
```

No options. Returns `{ light, dark, json }`.

---

### `generatePandaConfig(theme, options?)`

```typescript
import { generatePandaConfig } from "salt-theme-gen";

const { tokens, semanticTokens } = generatePandaConfig(theme);
// In panda.config.ts:  theme: { extend: { tokens, semanticTokens } }
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `includePalettes` | `boolean` | `false` | Emit tonal palette steps as base tokens |

Returns `{ tokens, semanticTokens, json }`. Semantic colors carry `{ value: { base: "#light", _dark: "#dark" } }` for automatic dark mode. Spread into `panda.config.ts`.

---

### `generateFigmaVariables(theme, options?)`

```typescript
import { generateFigmaVariables } from "salt-theme-gen";

const { payload, json } = generateFigmaVariables(theme);
// POST payload to: PATCH /v1/files/:fileId/variables
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `includePalettes` | `boolean` | `false` | Emit tonal palette steps as variables |

Returns `{ payload, json }`. Payload contains two collections: `Salt / Colors` (Light + Dark modes, RGBA 0–1) and `Salt / Tokens` (single Default mode, FLOAT/STRING).

---

### `generateFlutterTheme(theme, options?)`

```typescript
import { generateFlutterTheme } from "salt-theme-gen";

const { dart } = generateFlutterTheme(theme, { className: "AppTheme" });
// Write dart to lib/theme/salt_theme.dart
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `className` | `string` | `"SaltTheme"` | Class name in generated Dart file |

Colors use `Color(0xFFRRGGBB)` format. Dark mode adds `Dark` suffix (`primaryDark`). Returns `{ dart, light, dark }`.

---

### `generateSwiftUITheme(theme, options?)`

```typescript
import { generateSwiftUITheme } from "salt-theme-gen";

const { swift } = generateSwiftUITheme(theme, { enumName: "AppTheme" });
// Write swift to Sources/Theme/SaltTheme.swift
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enumName` | `string` | `"SaltTheme"` | Outer enum name in generated Swift file |

Colors use `Color(red:green:blue:)` format. Dark mode adds `Dark` suffix (`primaryDark`). Tokens are `CGFloat` / `Font.Weight`. Returns `{ swift, light, dark }`.

---

### `adjustTheme(theme, overrides)`

```typescript
import { adjustTheme } from "salt-theme-gen";

const adjusted = adjustTheme(theme, {
  both:   { colors: { primary: "#ff6b6b" } },
  light:  { colors: { background: "#fafafa" } },
  tokens: { spacing: { md: 20 } },
});
```

Overrides are partial — only specified keys change. `both` applies to both modes; `light`/`dark` apply to one mode only. All color values in `colors`, `states`, and `surfaceElevation` overrides are normalized to canonical `#rrggbb` hex, so you may pass `rgb()`, `oklch()`, or named colors. Throws `RangeError` on token errors (negative sizes, NaN, descending breakpoints). **`theme.warnings` is dropped when any color override is present** (colors may now pass contrast); token-only adjustments preserve it.

---

### `diffTheme(a, b)`

```typescript
import { diffTheme } from "salt-theme-gen";

const diff = diffTheme(themeA, themeB);
// diff.light.colors → { primary: { from: "#...", to: "#..." }, ... }
```

Returns a structured `ThemeDiff` object describing every changed field. Surfaces `schemaVersion` mismatches.

---

### `parseThemeJSON(raw)`

```typescript
import { parseThemeJSON } from "salt-theme-gen";

const { theme, tokenWarnings } = parseThemeJSON(JSON.parse(stored));
// tokenWarnings: TokenWarning[] — severity "error" | "warning"
```

Validates a deserialized theme object. Shape errors throw. Value issues (negative sizes, descending breakpoints, compressed typography) return `TokenWarning[]`. Rejects missing or mismatched `schemaVersion`. **All color strings in the returned theme are normalized to canonical `#rrggbb` hex** — the input may contain `oklch()`, `rgb()`, `hsl()`, or named colors.

---

### `resolveTextStyle(style)` — React Native

```typescript
import { resolveTextStyle } from "salt-theme-gen";

const rnStyle = resolveTextStyle(theme.tokens.typography.bodyMedium);
// { fontSize: 16, lineHeight: 24, letterSpacing: 0.64, fontWeight: "400" }
```

Converts `TypographyStyle` to React Native `StyleSheet`-compatible values: absolute `lineHeight` (px), absolute `letterSpacing` (px), string `fontWeight`. Always use this instead of spreading raw `TypographyStyle` into `<Text>`.

---

### `simulateTheme(theme, type)` — Color blindness

```typescript
import { simulateTheme } from "salt-theme-gen";

const simulated = simulateTheme(theme, "deuteranomaly");
```

**`ColorBlindnessType` values**:

| Value | Description |
| --- | --- |
| `"protanopia"` | No red cones (~1% of males) |
| `"deuteranopia"` | No green cones (~1% of males) |
| `"tritanopia"` | No blue cones (~0.003% of population) |
| `"protanomaly"` | Weak red cones (~1% of males) |
| `"deuteranomaly"` | Weak green cones (~5% of males, most common) |
| `"tritanomaly"` | Weak blue cones (~0.01% of population) |
| `"achromatopsia"` | Complete color blindness (very rare) |

Returns a full `GeneratedTheme` with all colors shifted through the simulation matrix. `schemaVersion` is preserved. `theme.warnings` is always dropped — original generation warnings relate to pre-simulation colors and are meaningless after the CVD transform.

---

## Quick-start examples

### CSS project

```typescript
import { generateTheme, generateCssVariables } from "salt-theme-gen";

const theme = generateTheme({ primary: "#6366f1" });
const { css } = generateCssVariables(theme);
// Write css to src/styles/theme.css and import it
```

### shadcn/ui project (Tailwind v4)

```typescript
import { shadcnTheme } from "salt-theme-gen";

const { css } = shadcnTheme({ preset: "peacock", baseColor: "zinc" });
// Write css to src/app/globals.css and import it — done
```

### Tailwind project

```typescript
import { generateTheme, generateCssVariables, generateTailwindConfig } from "salt-theme-gen";

const theme = generateTheme({ preset: "ocean" });
const { css } = generateCssVariables(theme);   // write to globals.css
const { extend } = generateTailwindConfig(theme);
// In tailwind.config.ts:  theme: { extend }
```

### Panda CSS project

```typescript
import { generateTheme, generatePandaConfig } from "salt-theme-gen";

const theme = generateTheme({ primary: "#0ea5e9" });
const { tokens, semanticTokens } = generatePandaConfig(theme);
// In panda.config.ts:  theme: { extend: { tokens, semanticTokens } }
```

### React Native

```typescript
import { generateTheme, resolveTextStyle } from "salt-theme-gen";

const theme = generateTheme({ preset: "forest" });
const bodyStyle = resolveTextStyle(theme.tokens.typography.bodyMedium);
// Use in StyleSheet.create({ body: bodyStyle })
```

### Figma Variables

```typescript
import { generateTheme, generateFigmaVariables } from "salt-theme-gen";

const theme = generateTheme({ primary: "#f59e0b" });
const { json } = generateFigmaVariables(theme, { includePalettes: true });
// POST the parsed JSON to PATCH /v1/files/:fileId/variables
```

### Flutter

```typescript
import { generateTheme, generateFlutterTheme } from "salt-theme-gen";

const theme = generateTheme({ preset: "sunset" });
const { dart } = generateFlutterTheme(theme);
// Write dart to lib/theme/salt_theme.dart
```

### SwiftUI

```typescript
import { generateTheme, generateSwiftUITheme } from "salt-theme-gen";

const theme = generateTheme({ preset: "arctic" });
const { swift } = generateSwiftUITheme(theme, { enumName: "AppTheme" });
// Write swift to Sources/Theme/AppTheme.swift
```
