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

  it("numeric tokens use px units", () => {
    expect(result.light).toMatch(/--salt-spacing-md: \d+px;/);
    expect(result.light).toMatch(/--salt-radius-md: \d+px;/);
    expect(result.light).toMatch(/--salt-font-size-md: \d+px;/);
    expect(result.light).toMatch(/--salt-font-level: \d+px;/);
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

  it("numeric tokens still use px", () => {
    expect(result.light).toMatch(/--salt-spacing-md: \d+px;/);
    expect(result.light).toMatch(/--salt-radius-md: \d+px;/);
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
    expect(supportsBlock).not.toContain("--salt-font-level");
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

  it("includes font-size scale and font-level", () => {
    for (const key of ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"]) {
      expect(result.light).toContain(`--salt-font-size-${key}:`);
    }
    expect(result.light).toContain("--salt-font-level:");
  });

  it("includes icon-size, size, and dimension scales", () => {
    for (const key of ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"]) {
      expect(result.light).toContain(`--salt-icon-size-${key}:`);
      expect(result.light).toContain(`--salt-size-${key}:`);
      expect(result.light).toContain(`--salt-dimension-${key}:`);
    }
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
