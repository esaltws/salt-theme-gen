# Changelog

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
