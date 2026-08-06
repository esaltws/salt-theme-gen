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
  it("t-shirt scale values are static px strings with salt- prefix", () => {
    expect(extend.fontSize["salt-md"]).toMatch(/^\d+px$/);
  });

  it("includes all 7 t-shirt font-size keys", () => {
    for (const key of ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"]) {
      expect(extend.fontSize, `missing salt-${key}`).toHaveProperty(`salt-${key}`);
    }
  });
});

// ─── Typography tuples ────────────────────────────────────────────────

describe("generateTailwindConfig — typography tuples in fontSize", () => {
  it("salt-body-medium is a Tailwind tuple (array)", () => {
    const entry = extend.fontSize["salt-body-medium"];
    expect(Array.isArray(entry)).toBe(true);
  });

  it("tuple[0] is a rem string", () => {
    const entry = extend.fontSize["salt-body-medium"] as [string, object];
    expect(entry[0]).toMatch(/^[\d.]+rem$/);
  });

  it("tuple[1] has lineHeight, fontWeight, letterSpacing", () => {
    const entry = extend.fontSize["salt-body-medium"] as [string, Record<string, string>];
    expect(entry[1]).toHaveProperty("lineHeight");
    expect(entry[1]).toHaveProperty("fontWeight");
    expect(entry[1]).toHaveProperty("letterSpacing");
  });

  it("lineHeight in tuple is a numeric string", () => {
    const entry = extend.fontSize["salt-body-medium"] as [string, Record<string, string>];
    expect(parseFloat(entry[1].lineHeight)).toBeGreaterThan(0);
  });

  it("letterSpacing is '0' for body-medium (zero tracking)", () => {
    const entry = extend.fontSize["salt-body-medium"] as [string, Record<string, string>];
    expect(entry[1].letterSpacing).toBe("0");
  });

  it("includes all 10 semantic typography keys", () => {
    const expected = [
      "salt-caption", "salt-label-small", "salt-label-medium",
      "salt-body-small", "salt-body-medium", "salt-body-large",
      "salt-title-small", "salt-title-medium", "salt-title-large",
      "salt-display",
    ];
    for (const key of expected) {
      expect(extend.fontSize, `missing ${key}`).toHaveProperty(key);
      expect(Array.isArray(extend.fontSize[key])).toBe(true);
    }
  });

  it("salt-display has fontWeight '700'", () => {
    const entry = extend.fontSize["salt-display"] as [string, Record<string, string>];
    expect(entry[1].fontWeight).toBe("700");
  });

  it("rem size of salt-body-medium equals fontSize / 16", () => {
    const bodyMd = theme.tokens.typography.bodyMedium;
    const expectedRem = `${+(bodyMd.fontSize / 16).toFixed(4)}rem`;
    const entry = extend.fontSize["salt-body-medium"] as [string, Record<string, string>];
    expect(entry[0]).toBe(expectedRem);
  });
});

// ─── Width / Height ───────────────────────────────────────────────────

describe("generateTailwindConfig — width and height", () => {
  it("width and height both have salt-control-md", () => {
    expect(extend.width["salt-control-md"]).toMatch(/^\d+px$/);
    expect(extend.height["salt-control-md"]).toBe(extend.width["salt-control-md"]);
  });

  it("all control size keys appear in both width and height", () => {
    for (const key of ["xs", "sm", "md", "lg", "xl"]) {
      expect(extend.width,  `width missing salt-control-${key}`).toHaveProperty(`salt-control-${key}`);
      expect(extend.height, `height missing salt-control-${key}`).toHaveProperty(`salt-control-${key}`);
    }
  });

  it("avatar sizes appear in width and height", () => {
    for (const key of ["xs", "sm", "md", "lg", "xl", "xxl"]) {
      expect(extend.width,  `width missing salt-avatar-${key}`).toHaveProperty(`salt-avatar-${key}`);
      expect(extend.height, `height missing salt-avatar-${key}`).toHaveProperty(`salt-avatar-${key}`);
    }
  });

  it("avatar sizes are equal in width and height (square)", () => {
    for (const key of ["xs", "sm", "md", "lg", "xl", "xxl"]) {
      expect(extend.width[`salt-avatar-${key}`]).toBe(extend.height[`salt-avatar-${key}`]);
    }
  });

  it("icon sizes appear in both width and height", () => {
    for (const key of ["xs", "sm", "md", "lg", "xl", "xxl", "3xl"]) {
      expect(extend.width,  `width missing salt-icon-${key}`).toHaveProperty(`salt-icon-${key}`);
      expect(extend.height, `height missing salt-icon-${key}`).toHaveProperty(`salt-icon-${key}`);
    }
  });

  it("touch target sizes appear in width and height", () => {
    for (const key of ["minimum", "recommended", "comfortable"]) {
      expect(extend.width,  `width missing salt-touch-target-${key}`).toHaveProperty(`salt-touch-target-${key}`);
      expect(extend.height, `height missing salt-touch-target-${key}`).toHaveProperty(`salt-touch-target-${key}`);
    }
  });
});

// ─── MinWidth / MinHeight ─────────────────────────────────────────────

describe("generateTailwindConfig — minWidth and minHeight", () => {
  it("touch target keys appear in minWidth", () => {
    for (const key of ["minimum", "recommended", "comfortable"]) {
      expect(extend.minWidth, `minWidth missing salt-touch-target-${key}`).toHaveProperty(`salt-touch-target-${key}`);
    }
  });

  it("touch target keys appear in minHeight", () => {
    for (const key of ["minimum", "recommended", "comfortable"]) {
      expect(extend.minHeight, `minHeight missing salt-touch-target-${key}`).toHaveProperty(`salt-touch-target-${key}`);
    }
  });

  it("touch target minWidth values match the width values", () => {
    for (const key of ["minimum", "recommended", "comfortable"]) {
      expect(extend.minWidth[`salt-touch-target-${key}`])
        .toBe(extend.width[`salt-touch-target-${key}`]);
    }
  });

  it("salt-touch-target-minimum is 24px", () => {
    expect(extend.minWidth["salt-touch-target-minimum"]).toBe("24px");
    expect(extend.minHeight["salt-touch-target-minimum"]).toBe("24px");
  });

  it("salt-touch-target-recommended is 44px", () => {
    expect(extend.minWidth["salt-touch-target-recommended"]).toBe("44px");
    expect(extend.minHeight["salt-touch-target-recommended"]).toBe("44px");
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
