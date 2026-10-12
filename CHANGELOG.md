# Changelog

## Unreleased

### Added

- **CLI** — `salt-theme-gen` binary with six subcommands: `generate`, `export`, `validate`, `diff`, `simulate`, `adjust`. Reads from file or stdin; writes to stdout or `--out <file>`. `--format` selects output format (json, css, scss, tailwind, dtcg, shadcn, panda, figma, flutter, swiftui); `--mode light|dark|both` controls which theme mode to emit for CSS/SCSS.

- **`generateScssVariables(theme, options?)`** — SCSS variable file. Light colors use plain `$salt-color-primary` names; dark colors add a `-dark` suffix. Mode-agnostic tokens emitted once. Options: `prefix`, `includePalettes`.

- **`generatePandaConfig(theme, options?)`** — Panda CSS `tokens` + `semanticTokens` objects. Semantic colors carry `{ value: { base: "#light", _dark: "#dark" } }` for automatic dark mode. Options: `includePalettes`.

- **`generateFigmaVariables(theme, options?)`** — Figma Variables REST API payload (`PATCH /v1/files/:id/variables`). Two collections: `Salt / Colors` (Light + Dark modes, COLOR type, RGBA 0–1) and `Salt / Tokens` (FLOAT/STRING). Options: `includePalettes`.

- **`generateFlutterTheme(theme, options?)`** — Flutter/Dart constants class. Colors are `Color(0xFF...)`. Dark mode adds `Dark` suffix. Tokens are `static const double` / `static const int`. Options: `className`.

- **`generateSwiftUITheme(theme, options?)`** — SwiftUI constants enum with `Colors` and `Tokens` nested enums. Colors are `Color(red:green:blue:)`. Dark mode adds `Dark` suffix. Tokens are `CGFloat` / `Font.Weight`. Options: `enumName`.

- **`generateShadcnTheme(theme, options?)`** / **`shadcnTheme(options?)`** — Tailwind v4 + shadcn/ui compatible CSS. Self-contained importable file with `@custom-variant dark`, `@theme inline`, `:root`, `.dark`, and `@layer base`. Options: `baseColor` (`neutral` | `zinc` | `stone` | `mauve` | `olive` | `mist` | `taupe`), `includePalettes`.

- **New semantic tokens** — `input` (form control border, slightly more prominent than `border`), `ring` (focus indicator, WCAG 2.4.11 non-text contrast ≥ 3:1 guaranteed), `onMuted` (WCAG AA foreground for muted surfaces).

- **`VERSION`** constant exported from the package alongside `SCHEMA_VERSION`.

- **`lightRoot` / `darkRoot`** in `CssVariablesResult` — standalone single-mode CSS. `lightRoot` emits the light selector with the full light theme; `darkRoot` emits the light selector with dark colors and all mode-independent tokens (spacing, radius, typography, etc.) — useful for dark-only deployments or the CLI `--mode dark`.

### Fixed

- **Deterministic output** — file headers no longer include a timestamp. Same inputs produce identical bytes across builds and CI runs.

- **Mutation isolation** — `simulateTheme`, `parseThemeJSON`, and `adjustTheme` now return fully independent objects. Mutating a returned theme no longer corrupts the original or future calls.

- **`validate` exit code** — now exits 1 for `severity:"error"` token diagnostics (was silently exiting 0 and printing "valid").

- **Exit code consistency** — schema and shape validation failures now exit 1 (validation error) across all commands. Only file-not-found, unreadable files, and malformed JSON syntax exit 2 (I/O / usage error).

---

## 2.0.0

> Release date to be filled on publication.

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

- **`schemaVersion: "2.0"`** — every `GeneratedTheme` is stamped with a schema version. `parseThemeJSON` rejects missing or mismatched versions with a descriptive error. `SCHEMA_VERSION` and `SchemaVersion` are exported for consumers. `diffTheme` surfaces version mismatches in the diff result.

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
