# AGENTS.md — salt-theme-gen

> Reference for AI agents. Read before writing code, modifying types, or answering questions about this package.

---

## What this is

`salt-theme-gen` v2.0.0 — a zero-dependency TypeScript library that turns one hex color into a complete light + dark design system.

- **Input**: a hex color string (or a preset name)
- **Output**: 23 semantic colors, 88 tonal palette steps, 32 interactive state colors, 4 surface elevation levels, typography scale, spacing/radius/size tokens, WCAG and APCA contrast reports — for both light and dark modes
- **Formats**: JavaScript objects, CSS custom properties, Tailwind `theme.extend`, W3C DTCG tokens, React Native `StyleSheet` values
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
|---|---|
| `index.ts` | Public API surface — re-exports only |
| `types.ts` | All TypeScript types — no runtime code |
| `generate-theme.ts` | `generateTheme()` orchestrator |
| `adjust-theme.ts` | `adjustTheme()`, `adjustTokens()` |
| `diff-theme.ts` | `diffTheme()` |
| `validate.ts` | `parseThemeJSON()` — shape validation + token diagnostics |
| `rn-utils.ts` | `resolveTextStyle()` — React Native typography |
| `color-math.ts` | OKLCH/sRGB/hex math, WCAG, APCA, color manipulation |
| `butterfly.ts` | Derives 23 semantic colors from one primary (Butterfly Rule) |
| `on-colors.ts` | "on" color derivation, WCAG auto-correction, contrast reports |
| `state-colors.ts` | hover/pressed/focused/disabled for 8 intents |
| `palettes.ts` | 11-step OKLCH tonal palettes |
| `css-variables.ts` | `generateCssVariables()` |
| `dtcg.ts` | `generateDtcgTokens()` — W3C DTCG format |
| `tailwind.ts` | `generateTailwindConfig()` |
| `color-blindness.ts` | `simulateColorBlindness()` / `simulateTheme()` |
| `typography-utils.ts` | Typography scale computation |
| `icon-utils.ts` | Size constants |
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

## GeneratedTheme shape

```ts
type GeneratedTheme = {
  light:    GeneratedThemeColors;   // per-mode color data
  dark:     GeneratedThemeColors;   // same structure, different values
  tokens:   GeneratedThemeTokens;   // mode-agnostic: spacing, typography, sizes, …
  warnings?: ThemeWarning[];        // present only when user colors failed WCAG
};

type GeneratedThemeColors = {
  mode:             "light" | "dark";
  colors:           SemanticColors;      // 23 hex strings
  palettes:         TonalPalettes;       // 8 intents × 11 steps
  surfaceElevation: SurfaceElevation;    // card, elevated, modal, popover
  states:           IntentStates;        // 8 intents × 4 states = 32 hex strings
  accessibility:    AccessibilityReport; // 25 WCAG contrast checks
  apca:             APCAReport;          // 25 APCA contrast checks
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

---

## CSS variable naming

| Token | Pattern | Example |
|---|---|---|
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
|---|---|---|
| `parseThemeJSON` return type | `GeneratedTheme` | `{ theme, tokenWarnings }` |
| `GeneratedThemeTokens.sizeMap` | present | removed |
| `GeneratedThemeTokens.dimensions` | present | removed |
| `generateCssVariables` fluid default | `true` | `false` |
| CSS vars `--salt-size-*` / `--salt-dimension-*` | emitted | removed |
| DTCG groups `size.*` / `dimension.*` | present | removed |

### New

- `resolveTextStyle(style: TypographyStyle): RNTextStyle` — React Native typography helper
- `generateTheme({ tokens: {...} })` — generation-time token overrides
- `TokenWarning` / `ParseThemeResult` types
- DTCG groups `controlSize.*` and `touchTarget.*`
- Tailwind: `height`, `minWidth`, `minHeight` utilities; typography `fontSize` tuples
