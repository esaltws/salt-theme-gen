import { describe, it, expect } from "vitest";
import { generateTailwindConfig } from "./tailwind";
import { generateTheme } from "./generate-theme";

const theme = generateTheme({ primary: "#1e90ff" });
const { extend, json } = generateTailwindConfig(theme);

// ─── Colors ──────────────────────────────────────────────────────────

describe("generateTailwindConfig — colors", () => {
  it("semantic colors are CSS var() references with --salt prefix", () => {
    expect(extend.colors["salt-primary"]).toBe("var(--salt-color-primary)");
    expect(extend.colors["salt-background"]).toBe("var(--salt-color-background)");
  });

  it("camelCase keys are converted to kebab-case", () => {
    expect(extend.colors["salt-on-primary"]).toBe("var(--salt-color-on-primary)");
    expect(extend.colors["salt-on-background"]).toBe("var(--salt-color-on-background)");
    expect(extend.colors["salt-on-surface"]).toBe("var(--salt-color-on-surface)");
    // original camelCase should NOT be present
    expect(extend.colors["salt-onPrimary"]).toBeUndefined();
  });

  it("includes all 23 semantic color tokens", () => {
    const expectedKeys = [
      "salt-primary", "salt-secondary", "salt-tertiary", "salt-quaternary",
      "salt-background", "salt-surface", "salt-text", "salt-muted", "salt-border",
      "salt-danger", "salt-success", "salt-warning", "salt-info",
      "salt-on-primary", "salt-on-secondary", "salt-on-tertiary", "salt-on-quaternary",
      "salt-on-background", "salt-on-surface",
      "salt-on-danger", "salt-on-success", "salt-on-warning", "salt-on-info",
    ];
    for (const key of expectedKeys) {
      expect(extend.colors, `missing ${key}`).toHaveProperty(key);
    }
  });

  it("includes all 8×11 tonal palette color references", () => {
    const palettes = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"];
    const steps    = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
    for (const pk of palettes) {
      for (const step of steps) {
        const key = `salt-palette-${pk}-${step}`;
        expect(extend.colors, `missing ${key}`).toHaveProperty(key);
        expect(extend.colors[key]).toBe(`var(--salt-palette-${pk}-${step})`);
      }
    }
  });

  it("includes all 4 surface elevation color references", () => {
    for (const key of ["card", "elevated", "modal", "popover"]) {
      expect(extend.colors[`salt-surface-${key}`]).toBe(`var(--salt-surface-${key})`);
    }
  });

  it("includes all 8×4 state color references", () => {
    const intents = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"];
    const states  = ["hover", "pressed", "focused", "disabled"];
    for (const intent of intents) {
      for (const state of states) {
        const key = `salt-state-${intent}-${state}`;
        expect(extend.colors, `missing ${key}`).toHaveProperty(key);
        expect(extend.colors[key]).toBe(`var(--salt-state-${intent}-${state})`);
      }
    }
  });

  it("all color values follow var(--salt-...) pattern", () => {
    for (const [key, value] of Object.entries(extend.colors)) {
      expect(value, `${key} is not a var() reference`).toMatch(/^var\(--salt-.+\)$/);
    }
  });
});

// ─── Spacing ─────────────────────────────────────────────────────────

describe("generateTailwindConfig — spacing", () => {
  it("spacing values are static px strings with salt- prefix", () => {
    expect(extend.spacing["salt-md"]).toMatch(/^\d+px$/);
    expect(extend.spacing["salt-none"]).toBe("0px");
  });

  it("includes all 7 spacing keys", () => {
    for (const key of ["none", "xs", "sm", "md", "lg", "xl", "xxl"]) {
      expect(extend.spacing, `missing salt-${key}`).toHaveProperty(`salt-${key}`);
    }
  });

  it("spacing values are NOT var() references (mode-independent)", () => {
    for (const value of Object.values(extend.spacing)) {
      expect(value).not.toContain("var(");
    }
  });
});

// ─── Border radius ────────────────────────────────────────────────────

describe("generateTailwindConfig — borderRadius", () => {
  it("radius values are static px strings with salt- prefix", () => {
    expect(extend.borderRadius["salt-md"]).toMatch(/^\d+px$/);
  });

  it("includes all 7 radius keys including pill", () => {
    for (const key of ["none", "sm", "md", "lg", "xl", "xxl", "pill"]) {
      expect(extend.borderRadius, `missing salt-${key}`).toHaveProperty(`salt-${key}`);
    }
  });

  it("salt-pill has a large value", () => {
    const val = parseInt(extend.borderRadius["salt-pill"]);
    expect(val).toBeGreaterThan(100);
  });
});

// ─── Font size ────────────────────────────────────────────────────────

describe("generateTailwindConfig — fontSize", () => {
  it("font-size values are static px strings with salt- prefix", () => {
    expect(extend.fontSize["salt-md"]).toMatch(/^\d+px$/);
  });

  it("includes all 7 font-size keys", () => {
    for (const key of ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"]) {
      expect(extend.fontSize, `missing salt-${key}`).toHaveProperty(`salt-${key}`);
    }
  });
});

// ─── JSON output ─────────────────────────────────────────────────────

describe("generateTailwindConfig — json", () => {
  it("json is valid JSON", () => {
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("json round-trips to extend object", () => {
    expect(JSON.parse(json)).toEqual(extend);
  });

  it("json contains colors, spacing, borderRadius, fontSize", () => {
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty("colors");
    expect(parsed).toHaveProperty("spacing");
    expect(parsed).toHaveProperty("borderRadius");
    expect(parsed).toHaveProperty("fontSize");
  });
});

// ─── Preset round-trip ────────────────────────────────────────────────

describe("generateTailwindConfig — preset round-trip", () => {
  it("all presets produce valid configs with no empty values", () => {
    const presets = ["peacock", "ocean", "forest", "sunset", "midnight"] as const;
    for (const preset of presets) {
      const t = generateTheme({ preset });
      const { extend: ext } = generateTailwindConfig(t);
      // Check all color values are non-empty var() refs
      for (const [key, val] of Object.entries(ext.colors)) {
        expect(val, `${preset} colors.${key} is empty`).not.toBe("");
        expect(val, `${preset} colors.${key} is not a var()`).toMatch(/^var\(/);
      }
      // Check a few spacing values are non-zero strings with px
      expect(ext.spacing["salt-md"]).toMatch(/^\d+px$/);
    }
  });
});
