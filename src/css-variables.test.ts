import { describe, it, expect } from "vitest";
import { generateCssVariables } from "./css-variables";
import { generateTheme } from "./generate-theme";

const theme = generateTheme({ primary: "#1e90ff" });

// ─── format: "hex" (default) ─────────────────────────────────────────

describe('generateCssVariables — format: "hex" (default)', () => {
  const result = generateCssVariables(theme);

  it("light/dark fields have no selector wrapper", () => {
    expect(result.light).not.toContain(":root");
    expect(result.dark).not.toContain("[data-theme");
  });

  it("color vars use hex format", () => {
    expect(result.light).toMatch(/--salt-color-primary: #[0-9a-f]{6};/);
    expect(result.dark).toMatch(/--salt-color-primary: #[0-9a-f]{6};/);
  });

  it("camelCase keys are converted to kebab-case", () => {
    expect(result.light).toContain("--salt-color-on-primary:");
    expect(result.light).toContain("--salt-color-on-secondary:");
    expect(result.light).toContain("--salt-color-on-background:");
    expect(result.light).toContain("--salt-color-on-surface:");
  });

  it("spacing and radius use px; font-size and icon-size use rem", () => {
    expect(result.light).toMatch(/--salt-spacing-md: \d+px;/);
    expect(result.light).toMatch(/--salt-radius-md: \d+px;/);
    expect(result.light).toMatch(/--salt-font-size-md: [\d.]+rem;/);
    expect(result.light).toMatch(/--salt-font-base: [\d.]+rem;/);
    expect(result.light).toMatch(/--salt-icon-size-md: [\d.]+rem;/);
  });

  it("css string contains both default selectors", () => {
    expect(result.css).toContain(":root {");
    expect(result.css).toContain("[data-theme='dark'] {");
  });

  it("css does not contain @supports", () => {
    expect(result.css).not.toContain("@supports");
  });

  it("--salt prefix is always used", () => {
    expect(result.light).toContain("--salt-color-primary:");
    expect(result.light).not.toMatch(/--(?!salt)/);
  });
});

// ─── format: "oklch" ─────────────────────────────────────────────────

describe('generateCssVariables — format: "oklch"', () => {
  const result = generateCssVariables(theme, { format: "oklch" });

  it("color vars use oklch() format", () => {
    expect(result.light).toMatch(/--salt-color-primary: oklch\(\d+\.\d+% \d+\.\d+ \d+\.\d+\);/);
    expect(result.dark).toMatch(/--salt-color-primary: oklch\(\d+\.\d+% \d+\.\d+ \d+\.\d+\);/);
  });

  it("spacing and radius still use px; font-size uses rem", () => {
    expect(result.light).toMatch(/--salt-spacing-md: \d+px;/);
    expect(result.light).toMatch(/--salt-radius-md: \d+px;/);
    expect(result.light).toMatch(/--salt-font-size-md: [\d.]+rem;/);
  });

  it("no hex color values in output", () => {
    // color declarations should not contain bare hex; non-color tokens are px
    const colorLines = result.light
      .split("\n")
      .filter((l) => l.includes("--salt-color-") || l.includes("--salt-palette-") || l.includes("--salt-surface-") || l.includes("--salt-state-"));
    for (const line of colorLines) {
      expect(line).not.toMatch(/#[0-9a-f]{6}/i);
    }
  });
});

// ─── format: "both" ──────────────────────────────────────────────────

describe('generateCssVariables — format: "both"', () => {
  const result = generateCssVariables(theme, { format: "both" });

  it("css contains hex fallback for color vars", () => {
    expect(result.css).toMatch(/:root \{[\s\S]*--salt-color-primary: #[0-9a-f]{6}/);
  });

  it("css contains @supports oklch block", () => {
    expect(result.css).toContain("@supports (color: oklch(0 0 0))");
    expect(result.css).toMatch(/@supports[\s\S]*oklch\(/);
  });

  it("@supports block upgrades all color tokens to oklch (semantic, palette, surface, state)", () => {
    const supportsStart = result.css.indexOf("@supports");
    const supportsBlock = result.css.slice(supportsStart);
    expect(supportsBlock).toMatch(/--salt-color-primary: oklch\(/);
    expect(supportsBlock).toMatch(/--salt-palette-primary-500: oklch\(/);
    expect(supportsBlock).toMatch(/--salt-surface-card: oklch\(/);
    expect(supportsBlock).toMatch(/--salt-state-primary-hover: oklch\(/);
  });

  it("@supports block does NOT include dimension tokens (spacing/radius/font-size)", () => {
    const supportsStart = result.css.indexOf("@supports");
    const supportsBlock = result.css.slice(supportsStart);
    expect(supportsBlock).not.toContain("--salt-spacing");
    expect(supportsBlock).not.toContain("--salt-radius");
    expect(supportsBlock).not.toContain("--salt-font-size");
    expect(supportsBlock).not.toContain("--salt-font-base");
  });

  it("light/dark fields contain hex declarations", () => {
    expect(result.light).toMatch(/--salt-color-primary: #[0-9a-f]{6};/);
    expect(result.dark).toMatch(/--salt-color-primary: #[0-9a-f]{6};/);
  });

  it("hex block contains spacing vars (before @supports)", () => {
    const supportsStart = result.css.indexOf("@supports");
    const beforeSupports = result.css.slice(0, supportsStart);
    expect(beforeSupports).toContain("--salt-spacing-md:");
  });
});

// ─── Custom selectors ────────────────────────────────────────────────

describe("generateCssVariables — custom selectors", () => {
  const result = generateCssVariables(theme, {
    lightSelector: ".light",
    darkSelector: ".dark",
  });

  it("uses custom light selector", () => {
    expect(result.css).toContain(".light {");
    expect(result.css).not.toContain(":root {");
  });

  it("uses custom dark selector", () => {
    expect(result.css).toContain(".dark {");
    expect(result.css).not.toContain("[data-theme='dark']");
  });

  it("custom selectors work with format: both", () => {
    const r = generateCssVariables(theme, {
      lightSelector: "[data-mode='light']",
      darkSelector: "[data-mode='dark']",
      format: "both",
    });
    expect(r.css).toContain("[data-mode='light']");
    expect(r.css).toContain("[data-mode='dark']");
    expect(r.css).toContain("@supports");
  });
});

// ─── Token completeness ──────────────────────────────────────────────

describe("generateCssVariables — token completeness", () => {
  const result = generateCssVariables(theme);

  it("includes all 23 semantic color keys", () => {
    const expectedKeys = [
      "primary", "secondary", "tertiary", "quaternary",
      "background", "surface", "text", "muted", "border",
      "danger", "success", "warning", "info",
      "on-primary", "on-secondary", "on-tertiary", "on-quaternary",
      "on-background", "on-surface",
      "on-danger", "on-success", "on-warning", "on-info",
    ];
    for (const key of expectedKeys) {
      expect(result.light, `missing --salt-color-${key}`).toContain(`--salt-color-${key}:`);
    }
  });

  it("includes all 8×11 tonal palette steps", () => {
    const palettes = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"];
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    for (const key of palettes) {
      for (const step of steps) {
        expect(result.light, `missing --salt-palette-${key}-${step}`).toContain(`--salt-palette-${key}-${step}:`);
      }
    }
  });

  it("includes all 4 surface elevation keys", () => {
    for (const key of ["card", "elevated", "modal", "popover"]) {
      expect(result.light).toContain(`--salt-surface-${key}:`);
    }
  });

  it("includes all 8×4 state color keys", () => {
    const intents = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"];
    const states = ["hover", "pressed", "focused", "disabled"];
    for (const intent of intents) {
      for (const state of states) {
        expect(result.light).toContain(`--salt-state-${intent}-${state}:`);
      }
    }
  });

  it("includes spacing scale", () => {
    for (const key of ["none", "xs", "sm", "md", "lg", "xl", "xxl"]) {
      expect(result.light).toContain(`--salt-spacing-${key}:`);
    }
  });

  it("includes radius scale", () => {
    for (const key of ["none", "sm", "md", "lg", "xl", "xxl", "pill"]) {
      expect(result.light).toContain(`--salt-radius-${key}:`);
    }
  });

  it("includes font-size scale and font-base in rem", () => {
    for (const key of ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"]) {
      expect(result.light).toMatch(new RegExp(`--salt-font-size-${key}: [\\d.]+rem;`));
    }
    expect(result.light).toMatch(/--salt-font-base: [\d.]+rem;/);
  });

  it("includes font-base in rem", () => {
    expect(result.light).toMatch(/--salt-font-base: [\d.]+rem;/);
  });

  it("includes typography CSS vars for all 10 tokens", () => {
    const keys = ["caption", "label-small", "label-medium", "body-small", "body-medium", "body-large", "title-small", "title-medium", "title-large", "display"];
    for (const key of keys) {
      expect(result.light, `missing --salt-type-${key}-size`).toContain(`--salt-type-${key}-size:`);
      expect(result.light).toContain(`--salt-type-${key}-line-height:`);
      expect(result.light).toContain(`--salt-type-${key}-weight:`);
      expect(result.light).toContain(`--salt-type-${key}-letter-spacing:`);
    }
  });

  it("all type tokens use static rem by default (no clamp)", () => {
    for (const key of ["caption", "body-small", "body-medium", "title-small", "title-medium", "title-large", "display"]) {
      expect(result.light).toMatch(new RegExp(`--salt-type-${key}-size: [\\d.]+rem;`));
      expect(result.light).not.toContain(`--salt-type-${key}-size: clamp(`);
    }
  });

  it("includes line-height scale", () => {
    for (const key of ["none", "tight", "snug", "normal", "relaxed", "loose"]) {
      expect(result.light).toContain(`--salt-line-height-${key}:`);
    }
  });

  it("includes font-weight scale", () => {
    for (const key of ["light", "regular", "medium", "semibold", "bold", "extrabold"]) {
      expect(result.light).toContain(`--salt-font-weight-${key}:`);
    }
  });

  it("includes letter-spacing scale", () => {
    for (const key of ["tight", "normal", "wide", "wider", "widest"]) {
      expect(result.light).toContain(`--salt-letter-spacing-${key}:`);
    }
  });

  it("includes icon-size in rem; control sizes in px", () => {
    for (const key of ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"]) {
      expect(result.light).toMatch(new RegExp(`--salt-icon-size-${key}: [\\d.]+rem;`));
    }
    for (const key of ["xs", "sm", "md", "lg", "xl"]) {
      expect(result.light).toContain(`--salt-control-${key}:`);
    }
    expect(result.light).toContain("--salt-touch-target-recommended:");
  });

  it("does not emit deprecated --salt-size-* or --salt-dimension-* variables", () => {
    expect(result.light).not.toContain("--salt-size-");
    expect(result.light).not.toContain("--salt-dimension-");
  });

  it("light and dark outputs differ", () => {
    expect(result.light).not.toBe(result.dark);
  });
});

// ─── Preset round-trip ───────────────────────────────────────────────

describe("generateCssVariables — preset round-trip", () => {
  it("all presets produce valid CSS with no empty values", () => {
    const presets = ["peacock", "ocean", "forest", "sunset", "midnight"] as const;
    for (const preset of presets) {
      const t = generateTheme({ preset });
      const { css } = generateCssVariables(t, { format: "both" });
      expect(css, `${preset}: empty value`).not.toMatch(/: ;/);
      expect(css, `${preset}: undefined value`).not.toMatch(/: undefined;/);
      expect(css.length, `${preset}: trivially short`).toBeGreaterThan(5000);
    }
  });
});

// ─── fluidTypography option ───────────────────────────────────────────

describe("generateCssVariables — fluidTypography", () => {
  const fluidResult = generateCssVariables(theme, { fluidTypography: true });
  const staticResult = generateCssVariables(theme);

  it("default (false) emits static rem for title and display", () => {
    for (const key of ["title-small", "title-medium", "title-large", "display"]) {
      expect(staticResult.light).toMatch(new RegExp(`--salt-type-${key}-size: [\\d.]+rem;`));
      expect(staticResult.light).not.toContain(`--salt-type-${key}-size: clamp(`);
    }
  });

  it("fluidTypography: true emits clamp() for title and display", () => {
    for (const key of ["title-small", "title-medium", "title-large", "display"]) {
      expect(fluidResult.light).toMatch(new RegExp(`--salt-type-${key}-size: clamp\\(`));
    }
  });

  it("fluidTypography: true leaves caption and body styles as static rem", () => {
    for (const key of ["caption", "label-small", "label-medium", "body-small", "body-medium", "body-large"]) {
      expect(fluidResult.light).toMatch(new RegExp(`--salt-type-${key}-size: [\\d.]+rem;`));
      expect(fluidResult.light).not.toContain(`--salt-type-${key}-size: clamp(`);
    }
  });

  it("clamp minimum is floored at baseFont — titleSmall min >= baseFont rem", () => {
    // titleSmall fontSize (with default major-third scale from 16px) is ~20px
    // 65% of 20px = 13px, which is below baseFont (16px) — floor must kick in
    const line = fluidResult.light.split("\n").find((l) => l.includes("--salt-type-title-small-size:"))!;
    expect(line).toBeDefined();
    const match = line.match(/clamp\(([\d.]+rem)/);
    expect(match).toBeTruthy();
    const minRem = parseFloat(match![1]);
    const baseFontRem = theme.tokens.baseFont / 16;
    // min of clamp must be >= baseFont in rem
    expect(minRem).toBeGreaterThanOrEqual(baseFontRem - 0.001);
  });

  it("clamp values are valid CSS — no NaN, no undefined", () => {
    expect(fluidResult.light).not.toContain("NaN");
    expect(fluidResult.light).not.toContain("undefined");
    for (const key of ["title-small", "title-medium", "title-large", "display"]) {
      expect(fluidResult.light).toMatch(
        new RegExp(`--salt-type-${key}-size: clamp\\([\\d.]+rem, -?[\\d.]+vw [+-] -?[\\d.]+px, [\\d.]+rem\\)`)
      );
    }
  });

  it("clamp max equals static rem value — fluid and static agree at large viewport", () => {
    for (const key of ["title-small", "title-medium", "title-large", "display"]) {
      const staticLine = staticResult.light.split("\n").find((l) => l.includes(`--salt-type-${key}-size:`))!;
      const fluidLine  = fluidResult.light.split("\n").find((l) => l.includes(`--salt-type-${key}-size:`))!;
      const staticRem = staticLine.match(/([\d.]+rem)/)?.[1];
      const fluidMax  = fluidLine.match(/clamp\([\s\S]+?, [\s\S]+?, ([\d.]+rem)\)/)?.[1];
      expect(staticRem).toBe(fluidMax);
    }
  });

  it("fluidTypography: true is consistent when combined with format: both", () => {
    const r = generateCssVariables(theme, { fluidTypography: true, format: "both" });
    expect(r.css).toMatch(/--salt-type-title-small-size: clamp\(/);
    expect(r.css).not.toContain("NaN");
  });
});
