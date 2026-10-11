import { describe, it, expect } from "vitest";
import { generatePandaConfig } from "./panda.js";
import { generateTheme } from "./generate-theme.js";
import type { PandaConfigResult } from "./panda.js";

const theme = generateTheme({ primary: "#6366f1" });
const result: PandaConfigResult = generatePandaConfig(theme);

// ─── Semantic colors ──────────────────────────────────────────────────

describe("generatePandaConfig — semanticTokens.colors", () => {
  it("contains salt-primary with base and _dark values", () => {
    const p = result.semanticTokens.colors["salt-primary"];
    expect(p).toBeDefined();
    expect(p.value.base).toMatch(/^#[0-9a-f]{6}$/);
    expect(p.value._dark).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("light base differs from dark _dark for primary", () => {
    const p = result.semanticTokens.colors["salt-primary"];
    expect(p.value.base).not.toBe(p.value._dark);
  });

  it("light base differs from dark _dark for background", () => {
    const bg = result.semanticTokens.colors["salt-background"];
    expect(bg.value.base).not.toBe(bg.value._dark);
  });

  it("contains all 26 semantic color tokens", () => {
    const expected = [
      "salt-primary", "salt-secondary", "salt-tertiary", "salt-quaternary",
      "salt-background", "salt-surface", "salt-text", "salt-muted",
      "salt-border", "salt-input", "salt-ring",
      "salt-danger", "salt-success", "salt-warning", "salt-info",
      "salt-on-primary", "salt-on-secondary", "salt-on-tertiary", "salt-on-quaternary",
      "salt-on-background", "salt-on-surface", "salt-on-muted",
      "salt-on-danger", "salt-on-success", "salt-on-warning", "salt-on-info",
    ];
    for (const key of expected) {
      expect(result.semanticTokens.colors, `missing ${key}`).toHaveProperty(key);
    }
  });

  it("contains surface elevation tokens", () => {
    expect(result.semanticTokens.colors).toHaveProperty("salt-surface-card");
    expect(result.semanticTokens.colors).toHaveProperty("salt-surface-popover");
  });

  it("contains all 8 × 4 = 32 state tokens", () => {
    const intents = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"];
    const states  = ["hover", "pressed", "focused", "disabled"];
    for (const intent of intents) {
      for (const state of states) {
        const key = `salt-state-${intent}-${state}`;
        expect(result.semanticTokens.colors, `missing ${key}`).toHaveProperty(key);
      }
    }
  });

  it("camelCase keys are converted to kebab-case", () => {
    expect(result.semanticTokens.colors).toHaveProperty("salt-on-primary");
    expect(result.semanticTokens.colors).not.toHaveProperty("salt-onPrimary");
  });
});

// ─── Base tokens ──────────────────────────────────────────────────────

describe("generatePandaConfig — tokens", () => {
  it("spacing uses px values", () => {
    const keys = Object.keys(result.tokens.spacing);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((k) => k.startsWith("salt-"))).toBe(true);
    expect(result.tokens.spacing[keys[0]].value).toMatch(/px$/);
  });

  it("radii uses px values", () => {
    const keys = Object.keys(result.tokens.radii);
    expect(keys.length).toBeGreaterThan(0);
    expect(result.tokens.radii[keys[0]].value).toMatch(/px$|^0$/);
  });

  it("fontSizes uses rem values", () => {
    const keys = Object.keys(result.tokens.fontSizes);
    expect(keys).toContain("salt-md");
    expect(keys).toContain("salt-base");
    expect(result.tokens.fontSizes["salt-md"].value).toMatch(/rem$/);
  });

  it("lineHeights are unitless strings", () => {
    const keys = Object.keys(result.tokens.lineHeights);
    expect(keys.length).toBeGreaterThan(0);
    expect(Number(result.tokens.lineHeights[keys[0]].value)).toBeGreaterThan(0);
  });

  it("fontWeights are numeric strings", () => {
    const keys = Object.keys(result.tokens.fontWeights);
    expect(keys.length).toBeGreaterThan(0);
    expect(Number(result.tokens.fontWeights[keys[0]].value)).toBeGreaterThan(0);
  });

  it("fonts has salt-sans and salt-display", () => {
    expect(result.tokens.fonts).toHaveProperty("salt-sans");
    expect(result.tokens.fonts).toHaveProperty("salt-display");
  });

  it("sizes contains control, icon, and avatar sizes", () => {
    const keys = Object.keys(result.tokens.sizes);
    expect(keys.some((k) => k.startsWith("salt-control-"))).toBe(true);
    expect(keys.some((k) => k.startsWith("salt-icon-"))).toBe(true);
    expect(keys.some((k) => k.startsWith("salt-avatar-"))).toBe(true);
  });

  it("breakpoints use px values", () => {
    const keys = Object.keys(result.tokens.breakpoints);
    expect(keys.length).toBeGreaterThan(0);
    expect(result.tokens.breakpoints[keys[0]].value).toMatch(/px$/);
  });
});

// ─── Palettes ────────────────────────────────────────────────────────

describe("generatePandaConfig — includePalettes", () => {
  it("palettes absent by default", () => {
    const keys = Object.keys(result.semanticTokens.colors);
    expect(keys.some((k) => k.includes("palette"))).toBe(false);
  });

  it("palettes present when includePalettes: true", () => {
    const r = generatePandaConfig(theme, { includePalettes: true });
    expect(r.semanticTokens.colors).toHaveProperty("salt-palette-primary-50");
    expect(r.semanticTokens.colors).toHaveProperty("salt-palette-primary-950");
  });

  it("palette entries have base and _dark values", () => {
    const r = generatePandaConfig(theme, { includePalettes: true });
    const p50 = r.semanticTokens.colors["salt-palette-primary-50"];
    expect(p50.value.base).toMatch(/^#[0-9a-f]{6}$/);
    expect(p50.value._dark).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("includePalettes emits 8 × 11 = 88 palette entries", () => {
    const r = generatePandaConfig(theme, { includePalettes: true });
    const paletteKeys = Object.keys(r.semanticTokens.colors).filter((k) => k.includes("palette"));
    expect(paletteKeys).toHaveLength(88);
  });
});

// ─── JSON output ──────────────────────────────────────────────────────

describe("generatePandaConfig — json", () => {
  it("json is valid JSON", () => {
    expect(() => JSON.parse(result.json)).not.toThrow();
  });

  it("json contains $description with generation metadata", () => {
    const parsed = JSON.parse(result.json);
    expect(typeof parsed.$description).toBe("string");
    expect(parsed.$description).toContain("salt-theme-gen");
    expect(parsed.$description).toContain("generatePandaConfig");
    expect(parsed.$description).toContain("Primary: #");
  });

  it("json round-trips tokens and semanticTokens", () => {
    const parsed = JSON.parse(result.json);
    expect(parsed.tokens).toEqual(result.tokens);
    expect(parsed.semanticTokens).toEqual(result.semanticTokens);
  });
});

// ─── Consistency ─────────────────────────────────────────────────────

describe("generatePandaConfig — consistency", () => {
  it("same theme produces same tokens", () => {
    const r1 = generatePandaConfig(theme);
    const r2 = generatePandaConfig(theme);
    expect(r1.tokens).toEqual(r2.tokens);
    expect(r1.semanticTokens).toEqual(r2.semanticTokens);
  });

  it("all presets produce valid output", () => {
    const presets = ["peacock", "ocean", "forest", "desert", "aurora"] as const;
    for (const preset of presets) {
      const t = generateTheme({ preset });
      const { semanticTokens } = generatePandaConfig(t);
      expect(semanticTokens.colors["salt-primary"]).toBeDefined();
      expect(semanticTokens.colors["salt-background"]).toBeDefined();
    }
  });
});
