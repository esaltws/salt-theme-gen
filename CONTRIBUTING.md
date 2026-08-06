# Contributing to salt-theme-gen

Thanks for your interest in contributing! This guide covers everything you need to get started.

Repository: [github.com/esaltws/salt-theme-gen](https://github.com/esaltws/salt-theme-gen)

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later

---

## Setup

```bash
git clone https://github.com/esaltws/salt-theme-gen.git
cd salt-theme-gen
npm install
```

---

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run the full test suite (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | TypeScript strict type check (no emit) |
| `npm run build` | Build CJS + ESM output to `dist/` |

---

## Project Structure

```
src/
  color-math.ts        — OKLCH / hex conversions, WCAG, APCA, gamut clamping
  butterfly.ts         — Butterfly Rule: 1 primary → 23 semantic colors
  on-colors.ts         — On-color derivation, WCAG auto-correction, accessibility reports
  state-colors.ts      — Hover / pressed / focused / disabled states (8 intents × 4)
  palettes.ts          — Tonal palette generation (8 intents × 11 steps)
  icon-utils.ts        — Icon size scale + semantic aliases
  typography-utils.ts  — Typography scale computation and modular font sizing
  generate-theme.ts    — Main orchestrator; preset resolution
  adjust-theme.ts      — adjustTheme() — partial overrides with auto-regeneration
  diff-theme.ts        — diffTheme() — structured comparison between two themes
  css-variables.ts     — generateCssVariables() — CSS custom properties output
  dtcg.ts              — generateDtcgTokens() — W3C Design Tokens format
  tailwind.ts          — generateTailwindConfig() — Tailwind theme.extend object
  color-blindness.ts   — simulateColorBlindness() — 7 CVD types (Machado 2009)
  validate.ts          — parseThemeJSON() — runtime validation for deserialized themes
  types.ts             — All TypeScript types and interfaces
  index.ts             — Public API surface
  presets/             — Built-in color, spacing, radius, and font-size presets
```

---

## Contribution Rules

- **Zero runtime dependencies.** The library ships with no dependencies and must stay that way. `devDependencies` (TypeScript, vitest) are fine.
- **Strict TypeScript.** `strict: true` is enforced. No `any`, no `@ts-ignore`.
- **Tests required.** All new logic must have vitest tests. All existing tests must still pass.
- **Code style.**
  - No comments unless the WHY is non-obvious (hidden constraint, subtle invariant, known workaround).
  - Internal identifiers use camelCase; CSS custom property names use kebab-case.
  - No half-finished features or feature flags.

---

## Submitting a Pull Request

1. Fork the repo and create a branch from `main`.
2. Make your changes and ensure `npm test` and `npm run typecheck` both pass.
3. Open a PR against `main` with a clear description of what changed and why.
4. Link any related issue in the PR body.

---

## Reporting Bugs

Open an issue at [github.com/esaltws/salt-theme-gen/issues](https://github.com/esaltws/salt-theme-gen/issues). Include a minimal reproduction if possible.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
