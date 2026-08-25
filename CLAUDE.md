# CLAUDE.md — salt-theme-gen

> Project reference for Claude Code. Read before writing any code, modifying types, or answering questions about this package.

---

## Project identity

- **Package**: `salt-theme-gen` v2.0.0
- **npm**: [npmjs.com/package/salt-theme-gen](https://www.npmjs.com/package/salt-theme-gen)
- **Author**: Hasan Sarwer (hasanmathju@gmail.com)
- **Repo**: [github.com/esaltws/salt-theme-gen](https://github.com/esaltws/salt-theme-gen)
- **Docs site**: [learn.esalt.net/salt-theme-gen](https://learn.esalt.net/salt-theme-gen) (Astro, lives at `e:/salt_theme_gen_tutorial`)

One function call turns a single hex color into a complete light + dark design system: 23 semantic colors, 88 tonal palette steps, 32 interactive states, 4 surface elevations, typography, spacing, radius, CSS variables, Tailwind config, DTCG tokens, React Native styles, WCAG and APCA reports, and color blindness simulation.

**Zero runtime dependencies. Pure TypeScript. Strict mode throughout.**

---

## Commands

```bash
npm test              # vitest run (all tests)
npm run test:watch    # vitest watch
npm run typecheck     # tsc --noEmit (no emit, strict)
npm run build         # CJS + ESM dual output to dist/
```

Run `npm test` after any change. All 2107+ tests must pass before committing.

---

## Architecture

```text
src/
├── index.ts              # Public API — re-exports only, no logic
├── types.ts              # All TypeScript types — no runtime code
├── generate-theme.ts     # Entry point: generateTheme() orchestrator
├── adjust-theme.ts       # adjustTheme(), adjustTokens()
├── diff-theme.ts         # diffTheme()
├── validate.ts           # parseThemeJSON() — runtime validation + token diagnostics
├── rn-utils.ts           # resolveTextStyle() — React Native typography helper
├── color-math.ts         # Pure math: OKLCH/sRGB/hex conversions, WCAG, APCA, manipulation
├── butterfly.ts          # Butterfly Rule: derives 23 semantic colors from primary
├── on-colors.ts          # "on" color derivation, WCAG auto-correction, accessibility reports
├── state-colors.ts       # hover/pressed/focused/disabled states (8 intents × 4)
├── palettes.ts           # 11-step OKLCH tonal palettes (8 keys)
├── css-variables.ts      # generateCssVariables() — hex/oklch/both, fluid typography opt-in
├── dtcg.ts               # generateDtcgTokens() — W3C DTCG format
├── tailwind.ts           # generateTailwindConfig() — Tailwind theme.extend
├── color-blindness.ts    # simulateColorBlindness/simulateTheme (7 CVD types, Machado 2009)
├── typography-utils.ts   # computeTypographyScale, computeModularFontSizes, lookupFontSizes
├── icon-utils.ts         # Size constants: DEFAULT_ICON_SIZES, DEFAULT_CONTROL_SIZES, etc.
└── presets/
    ├── nature-presets.ts  # 20 hue+chroma pairs (peacock, ocean, forest …)
    ├── spacing-presets.ts # 4 spacing scales (compact → spacious)
    ├── radius-presets.ts  # 4 radius scales (sharp → pill)
    └── font-size-presets.ts # 4 font size scales (small → editorial)
```

### Data flow

```text
generateTheme(options)
  → resolvePrimary()           hex seed
  → resolveScale()             spacing / radius / fontSize (preset or custom)
  → buildTokens()              GeneratedThemeTokens (mode-agnostic)
  → adjustTokens()             if options.tokens provided
  → generateMode() ×2          light + dark GeneratedThemeColors
      → deriveColors()         Butterfly Rule: 23 semantic colors
      → generateTonalPalettes() 8 × 11 tonal steps
      → deriveSurfaceElevation() 4 elevation levels
      → deriveAllIntentStates() 32 state colors
      → buildAccessibilityReport() WCAG contrast report
      → buildAPCAReport()       APCA contrast report
  → { schemaVersion, light, dark, tokens }
```

---

## GeneratedTheme shape

```ts
{
  schemaVersion: "2.0";          // stamped by generateTheme, validated by parseThemeJSON
  light:  GeneratedThemeColors;  // per-mode: colors, palettes, states, elevation, reports
  dark:   GeneratedThemeColors;  // same structure, different values
  tokens: GeneratedThemeTokens;  // mode-agnostic: spacing, radius, typography, sizes, ...
  warnings?: ThemeWarning[];     // present only when user colors failed WCAG checks
}
```

**`GeneratedThemeColors`** — changes between modes:
`mode`, `colors` (23 semantic hex strings), `palettes` (8 × 11 steps), `surfaceElevation` (4 levels), `states` (8 × 4 = 32 hex strings), `accessibility` (WCAG report), `apca` (APCA report).

**`GeneratedThemeTokens`** — identical in light and dark, stored once:
`spacing`, `radius`, `fontSizes`, `iconSizes`, `icons`, `controlSizes`, `touchTargets`, `borderWidths`, `avatarSizes`, `breakpoints`, `baseFont`, `fontScale`, `fontFamilySans?`, `fontFamilyDisplay?`, `typography`, `lineHeights`, `fontWeights`, `letterSpacings`.

---

## Key invariants

- **`schemaVersion: "2.0"` is stamped on every `GeneratedTheme`** — set by `generateTheme`, preserved by `adjustTheme` and `simulateTheme`, validated by `parseThemeJSON`. Missing or mismatched versions throw before any other validation. `SCHEMA_VERSION` and `SchemaVersion` are exported from `index.ts`.
- **All colors in the theme are hex strings** — `#rrggbb` (lowercase, 6-digit). Never oklch strings in the output; those are used only inside `color-math.ts` computations.
- **`TypographyStyle.lineHeight` is a unitless ratio** (1.5, 1.1) — NOT px. Multiply by `fontSize` to get px.
- **`TypographyStyle.letterSpacing` is an em decimal** (0.04 = 0.04em) — NOT px. Multiply by `fontSize` to get px.
- **Use `resolveTextStyle(style)` for React Native** — raw `TypographyStyle` values break RN layout.
- **`controlSizes` is the canonical control-height scale** — `sizeMap` and `dimensions` were deleted in v2.0.0.
- **`generateCssVariables` `fluidTypography` defaults to `false`** — static rem output by default. The `fluidTypography: true` opt-in emits `clamp()` for titleSmall–display, floored at `baseFont` to prevent headings shrinking below body text.
- **`parseThemeJSON` returns `{ theme, tokenWarnings }`** — not a bare `GeneratedTheme`. Shape errors throw; value errors/warnings are collected as `TokenWarning[]`.
- **Token keys use camelCase internally, kebab-case in CSS/Tailwind/DTCG** — `onPrimary` → `--salt-color-on-primary`, `bodyMedium` → `salt-body-medium`.
- **All color derivation happens in OKLCH** — never manipulate sRGB channels directly for perceptual operations.
- **WCAG AA (4.5:1) is guaranteed for all `onX` colors** — auto-correction walks the lightness axis until contrast is met.

---

## CSS variable naming

| Token type | Pattern | Example |
| --- | --- | --- |
| Semantic color | `--salt-color-{key}` | `--salt-color-on-primary` |
| Tonal palette | `--salt-palette-{intent}-{step}` | `--salt-palette-primary-500` |
| Surface elevation | `--salt-surface-{key}` | `--salt-surface-card` |
| State color | `--salt-state-{intent}-{state}` | `--salt-state-primary-hover` |
| Spacing | `--salt-spacing-{key}` | `--salt-spacing-md` |
| Radius | `--salt-radius-{key}` | `--salt-radius-pill` |
| Font size (scale) | `--salt-font-size-{key}` | `--salt-font-size-md` |
| Icon size | `--salt-icon-size-{key}` | `--salt-icon-size-lg` |
| Icon (semantic) | `--salt-icon-{key}` | `--salt-icon-control` |
| Control size | `--salt-control-{key}` | `--salt-control-md` |
| Touch target | `--salt-touch-target-{key}` | `--salt-touch-target-recommended` |
| Typography size | `--salt-type-{key}-size` | `--salt-type-body-medium-size` |
| Typography lh | `--salt-type-{key}-line-height` | `--salt-type-body-medium-line-height` |
| Border width | `--salt-border-width-{key}` | `--salt-border-width-thin` |
| Avatar size | `--salt-avatar-{key}` | `--salt-avatar-md` |
| Breakpoint | `--salt-breakpoint-{key}` | `--salt-breakpoint-lg` |

**Removed in v2.0.0:** `--salt-size-*`, `--salt-dimension-*` — use `--salt-control-*`.

---

## Tailwind class naming

All tokens prefixed `salt-`. Colors are CSS `var()` refs (require `generateCssVariables` in the CSS). All other values are static strings.

- Colors: `bg-salt-primary`, `text-salt-on-background`, `border-salt-border`
- Spacing: `p-salt-md`, `gap-salt-lg`
- Radius: `rounded-salt-md`, `rounded-salt-pill`
- Typography: `text-salt-body-medium` (tuple: rem size + lineHeight + fontWeight + letterSpacing)
- Sizes: `w-salt-control-md`, `h-salt-control-md`, `w-salt-avatar-lg`, `min-w-salt-touch-target-recommended`

---

## Test structure

Tests live alongside source files as `src/*.test.ts`. Vitest, no mocks, no global setup. Each file is self-contained.

| File | What it covers |
| --- | --- |
| `generate-theme.test.ts` | Core generation, presets, harmony, overrides, token option, schemaVersion |
| `adjust-theme.test.ts` | adjustTheme() color + token overrides, schemaVersion preservation |
| `diff-theme.test.ts` | diffTheme() structured comparison, schemaVersion diff |
| `validate.test.ts` | parseThemeJSON() shape errors + TokenWarning diagnostics, schemaVersion validation |
| `rn-utils.test.ts` | resolveTextStyle() — RN value conversion |
| `css-variables.test.ts` | CSS output: format, selectors, fluid typography |
| `tailwind.test.ts` | Tailwind extend object: colors, spacing, typography tuples |
| `dtcg.test.ts` | DTCG token tree: colors, palettes, controlSize, touchTarget |
| `color-blindness.test.ts` | simulateTheme(), simulateColorBlindness(), schemaVersion preservation |
| `color-math.test.ts` | OKLCH math, WCAG/APCA, hex utilities |
| `butterfly.test.ts` | Butterfly Rule color derivation |
| `on-colors.test.ts` | on-color derivation, auto-correction |
| `state-colors.test.ts` | Interactive state generation |
| `palettes.test.ts` | Tonal palette generation |
| `typography-utils.test.ts` | Typography scale computation |

---

## What NOT to do

- **Never add sizeMap or dimensions back** — deleted in v2.0.0; `controlSizes` is canonical.
- **Never emit oklch strings from generateTheme** — all output colors are hex.
- **Never make `fluidTypography: true` the default** — it breaks cross-platform consistency (JS/DTCG/Tailwind/RN stay static).
- **Never add runtime dependencies** — zero-dep is a hard constraint.
- **Never modify `dist/`** — it is generated by `npm run build`, not hand-edited.
- **Never commit with failing tests** — run `npm test` first.
- **Don't add `// @ts-ignore` or `as any` casts** — fix the types properly.
- **Don't write multi-paragraph comments** — one short line max; function names are self-documenting.

---

## v2.0.0 breaking changes (for context)

1. `parseThemeJSON` returns `{ theme, tokenWarnings }` not bare `GeneratedTheme`.
2. `sizeMap` and `dimensions` removed from `GeneratedThemeTokens`.
3. `generateCssVariables` `fluidTypography` defaults to `false`.
4. `--salt-size-*` and `--salt-dimension-*` CSS variables removed.
5. DTCG `size.*` and `dimension.*` groups removed.

New in v2.0.0: `schemaVersion: "2.0"` + `SCHEMA_VERSION`, `resolveTextStyle`, `generateTheme({ tokens })`, `TokenWarning`/`ParseThemeResult`, `controlSize.*`/`touchTarget.*` DTCG groups, Tailwind typography tuples + height/minWidth/minHeight.
