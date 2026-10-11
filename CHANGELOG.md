# Changelog

## Unreleased

### New output formats

- **`generateScssVariables(theme, options?)`** — SCSS variable file. Light colors use plain `$salt-color-primary: #hex` names; dark colors add a `-dark` suffix (`$salt-color-primary-dark`). Mode-agnostic tokens (spacing, radius, typography, sizes) emitted once. Options: `prefix`, `includePalettes`.

- **`generatePandaConfig(theme, options?)`** — Panda CSS `tokens` + `semanticTokens` objects. Semantic colors carry `{ value: { base: "#light", _dark: "#dark" } }` for automatic dark mode. Spread directly into `panda.config.ts`. Options: `includePalettes`.

- **`generateFigmaVariables(theme, options?)`** — Figma Variables REST API payload (`PATCH /v1/files/:id/variables`). Two collections: `Salt / Colors` (Light + Dark modes, COLOR type, RGBA 0–1) and `Salt / Tokens` (single mode, FLOAT/STRING). Options: `includePalettes`.

- **`generateFlutterTheme(theme, options?)`** — Flutter/Dart constants class. Colors are `Color(0xFF...)`. Dark mode adds `Dark` suffix. Tokens are `static const double` / `static const int`. Options: `className`.

- **`generateSwiftUITheme(theme, options?)`** — SwiftUI constants enum with `Colors` and `Tokens` nested enums. Colors are `Color(red:green:blue:)`. Dark mode adds `Dark` suffix. Tokens are `CGFloat` / `Font.Weight`. Options: `enumName`.

- **`shadcnTheme(options?)`** / **`generateShadcnTheme(theme, options?)`** — Tailwind v4 + shadcn/ui compatible CSS. Self-contained importable file with `@custom-variant dark`, `@theme inline`, `:root`, `.dark`, and `@layer base`. Options: `baseColor` (`neutral` | `zinc` | `stone` | `mauve` | `olive` | `mist` | `taupe`), `includePalettes`.

### New tokens

- **`input`** — form control border color (L=0.82 light / L=0.36 dark), slightly more prominent than `border`.
- **`ring`** — focus indicator ring color (primary hue, WCAG 2.4.11 non-text contrast ≥ 3:1 guaranteed).
- **`onMuted`** — readable foreground for muted surfaces; `WCAG AA` guaranteed against `muted`.

### Other additions

- **`VERSION`** constant (`"2.0.0-rc.2"`) exported from the package alongside `SCHEMA_VERSION`.
- All generated file outputs (`css`, `scss`, `dart`, `swift`, DTCG `json`) now include a generation header with function name, primary seed, non-default options, and ISO timestamp — useful for tracing and AI tooling.

---

## 2.0.0 — 2026-08-07

### Breaking changes

#### `parseThemeJSON` return type changed

Now returns `{ theme: GeneratedTheme; tokenWarnings: TokenWarning[] }` instead of `GeneratedTheme`.

```diff
- const theme = parseThemeJSON(raw);
+ const { theme, tokenWarnings } = parseThemeJSON(raw);
```

Shape errors (wrong types, missing fields) still throw. `tokenWarnings` with `severity: "error"` flag values that are structurally wrong (negative sizes, descending breakpoints, font scale ≤ 1); `severity: "warning"` flags non-recommended but permissible values.

#### `sizeMap` and `dimensions` removed from `GeneratedThemeTokens`

Use `controlSizes` — same shape, same values.

```diff
- theme.tokens.sizeMap.md
+ theme.tokens.controlSizes.md
```

CSS variables `--salt-size-*` and `--salt-dimension-*` are removed. Use `--salt-control-*`.

DTCG groups `size` and `dimension` are removed. Use `controlSize`.

#### `generateCssVariables` — `fluidTypography` defaults to `false`

Title and display type variables are now static `rem` by default. Opt in explicitly to get viewport-responsive `clamp()` output:

```diff
- generateCssVariables(theme)
+ generateCssVariables(theme, { fluidTypography: true })
```

The fluid minimum is floored at `baseFont` so headings never shrink below body text size.

---

### New

- **`schemaVersion: "2.0"`** — every `GeneratedTheme` is now stamped with a schema version. `parseThemeJSON` rejects missing or mismatched versions with a descriptive error. `SCHEMA_VERSION` and `SchemaVersion` are exported for consumers. `diffTheme` surfaces version mismatches in the diff result.

- **`resolveTextStyle(style)`** — converts `TypographyStyle` to React Native `StyleSheet` values: absolute `lineHeight` (px), absolute `letterSpacing` (px), string `fontWeight`. Eliminates silent layout bugs from spreading raw typography tokens into `<Text>`.

- **`generateTheme({ tokens: {...} })`** — generation-time token overrides. Equivalent to `adjustTheme(generateTheme(...), { tokens: ... })` in a single call.

- **`parseThemeJSON`** — returns `tokenWarnings: TokenWarning[]` with `severity: "error" | "warning"` diagnostics for token values (negative sizes, descending breakpoints, small touch targets, compressed typography, etc.).

- **`generateCssVariables`** — `fluidTypography: true` option emits viewport-responsive `clamp()` for title/display sizes.

- **DTCG** — explicit `controlSize.*` and `touchTarget.*` groups.

- **Tailwind** — `height`, `minWidth`, `minHeight` dimension utilities; avatar and touch-target sizes; semantic typography `fontSize` tuples (`[remSize, { lineHeight, fontWeight, letterSpacing }]`).

---

### Migration from 1.x

| v1.x | v2.0 |
| --- | --- |
| `const theme = parseThemeJSON(raw)` | `const { theme } = parseThemeJSON(raw)` |
| `theme.tokens.sizeMap` | `theme.tokens.controlSizes` |
| `theme.tokens.dimensions` | `theme.tokens.controlSizes` |
| `--salt-size-md` | `--salt-control-md` |
| `--salt-dimension-md` | `--salt-control-md` |
| DTCG `size.*` | DTCG `controlSize.*` |
| DTCG `dimension.*` | DTCG `controlSize.*` |
