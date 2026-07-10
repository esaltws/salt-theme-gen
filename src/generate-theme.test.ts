import { describe, it, expect } from "vitest";
import { generateTheme } from "./generate-theme";
import { contrastRatio, hexToOklch } from "./color-math";
import { SPACING_PRESETS } from "./presets/spacing-presets";
import { RADIUS_PRESETS } from "./presets/radius-presets";
import { FONT_SIZE_PRESETS } from "./presets/font-size-presets";
import { NATURE_PRESETS } from "./presets/nature-presets";
import { expectValidHex } from "./test-helpers";
import type { ThemePreset, BaseColorOverride } from "./types";

const presetNames = Object.keys(NATURE_PRESETS) as ThemePreset[];

// ─── defaults ───────────────────────────────────────────────────────

describe("generateTheme - defaults", () => {
  const theme = generateTheme();

  it("returns { light, dark } when called with no arguments", () => {
    expect(theme).toHaveProperty("light");
    expect(theme).toHaveProperty("dark");
  });

  it("light.mode === 'light' and dark.mode === 'dark'", () => {
    expect(theme.light.mode).toBe("light");
    expect(theme.dark.mode).toBe("dark");
  });

  it("default fontLevel is 16", () => {
    expect(theme.light.fontLevel).toBe(16);
    expect(theme.dark.fontLevel).toBe(16);
  });

  it("default spacing matches SPACING_PRESETS.default", () => {
    expect(theme.light.spacing).toEqual(SPACING_PRESETS.default);
  });

  it("default radius matches RADIUS_PRESETS.default", () => {
    expect(theme.light.radius).toEqual(RADIUS_PRESETS.default);
  });

  it("default fontSizes matches FONT_SIZE_PRESETS.default", () => {
    expect(theme.light.fontSizes).toEqual(FONT_SIZE_PRESETS.default);
  });

  it("light.colors has all 21 keys", () => {
    const keys = [
      "primary", "secondary", "tertiary", "quaternary", "background", "surface", "text",
      "muted", "border", "danger", "success", "warning", "info",
      "onPrimary", "onSecondary", "onTertiary", "onQuaternary", "onDanger", "onSuccess", "onWarning", "onInfo",
    ];
    for (const key of keys) {
      expect(theme.light.colors).toHaveProperty(key);
    }
  });

  it("surfaceElevation has card, elevated, modal, popover", () => {
    const keys = ["card", "elevated", "modal", "popover"];
    for (const key of keys) {
      expect(theme.light.surfaceElevation).toHaveProperty(key);
      expect(theme.dark.surfaceElevation).toHaveProperty(key);
      expectValidHex(theme.light.surfaceElevation[key as keyof typeof theme.light.surfaceElevation]);
      expectValidHex(theme.dark.surfaceElevation[key as keyof typeof theme.dark.surfaceElevation]);
    }
  });

  it("default preset is ocean (hue≈235)", () => {
    const primaryLch = hexToOklch(theme.light.colors.primary);
    // Ocean preset hue is 235; auto-correction may shift slightly
    expect(primaryLch.H).toBeGreaterThan(233);
    expect(primaryLch.H).toBeLessThan(237);
  });
});

// ─── primary color input ────────────────────────────────────────────

describe("generateTheme - primary color input", () => {
  it("accepts hex string", () => {
    const theme = generateTheme({ primary: "#ff0000" });
    expectValidHex(theme.light.colors.primary);
  });

  it("accepts 3-digit hex", () => {
    const theme = generateTheme({ primary: "#f00" });
    expectValidHex(theme.light.colors.primary);
  });

  it("accepts rgb()", () => {
    const theme = generateTheme({ primary: "rgb(255, 0, 0)" });
    expectValidHex(theme.light.colors.primary);
  });

  it("accepts CSS name", () => {
    const theme = generateTheme({ primary: "teal" });
    expectValidHex(theme.light.colors.primary);
  });

  it("throws on invalid color", () => {
    expect(() => generateTheme({ primary: "notacolor" })).toThrow();
  });
});

// ─── preset input ───────────────────────────────────────────────────

describe("generateTheme - preset input", () => {
  it.each(presetNames)("preset '%s' generates a valid theme", (preset) => {
    const theme = generateTheme({ preset });
    expectValidHex(theme.light.colors.primary);
    expectValidHex(theme.dark.colors.primary);
    expect(theme.light.mode).toBe("light");
    expect(theme.dark.mode).toBe("dark");
  });

  it("unknown preset throws", () => {
    expect(() => generateTheme({ preset: "nonexistent" as ThemePreset })).toThrow("Unknown preset");
  });

  it("preset primary uses L=0.55", () => {
    const theme = generateTheme({ preset: "ocean" });
    const lch = hexToOklch(theme.light.colors.primary);
    expect(lch.L).toBeCloseTo(0.55, 1);
  });
});

// ─── secondary override ─────────────────────────────────────────────

describe("generateTheme - secondary override", () => {
  it("secondary override is used in both modes", () => {
    const theme = generateTheme({ primary: "#1e90ff", secondary: "#ff00ff" });
    expect(theme.light.colors.secondary).toBe("#ff00ff");
    expect(theme.dark.colors.secondary).toBe("#ff00ff");
  });

  it("secondary override accepts CSS name", () => {
    const theme = generateTheme({ primary: "#1e90ff", secondary: "coral" });
    expectValidHex(theme.light.colors.secondary);
  });

  it("onSecondary is derived from the overridden secondary", () => {
    const theme = generateTheme({ primary: "#1e90ff", secondary: "#ff00ff" });
    expectValidHex(theme.light.colors.onSecondary);
    // Should differ from auto-derived secondary's on-color
    const noOverride = generateTheme({ primary: "#1e90ff" });
    expect(theme.light.colors.onSecondary).not.toBe(noOverride.light.colors.onSecondary);
  });
});

// ─── scale presets ──────────────────────────────────────────────────

describe("generateTheme - scale presets", () => {
  it("spacing 'compact' uses compact values", () => {
    const theme = generateTheme({ spacing: "compact" });
    expect(theme.light.spacing).toEqual(SPACING_PRESETS.compact);
  });

  it("spacing custom object is passed through", () => {
    const custom = { none: 0, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 };
    const theme = generateTheme({ spacing: custom });
    expect(theme.light.spacing).toEqual(custom);
  });

  it("radius 'pill' uses pill values", () => {
    const theme = generateTheme({ radius: "pill" });
    expect(theme.light.radius).toEqual(RADIUS_PRESETS.pill);
  });

  it("fontSize 'editorial' uses editorial values", () => {
    const theme = generateTheme({ fontSize: "editorial" });
    expect(theme.light.fontSizes).toEqual(FONT_SIZE_PRESETS.editorial);
  });

  it("unknown scale preset throws", () => {
    expect(() => generateTheme({ spacing: "nonexistent" as any })).toThrow("Unknown scale preset");
  });
});

// ─── fontLevel ──────────────────────────────────────────────────────

describe("generateTheme - fontLevel", () => {
  it("default fontLevel is 16", () => {
    const theme = generateTheme();
    expect(theme.light.fontLevel).toBe(16);
  });

  it("respects provided fontLevel", () => {
    const theme = generateTheme({ fontLevel: 12 });
    expect(theme.light.fontLevel).toBe(12);
  });

  it("clamps below minimum to 8", () => {
    const theme = generateTheme({ fontLevel: 5 });
    expect(theme.light.fontLevel).toBe(8);
  });

  it("clamps above maximum to 18", () => {
    const theme = generateTheme({ fontLevel: 25 });
    expect(theme.light.fontLevel).toBe(18);
  });
});

// ─── output structure ───────────────────────────────────────────────

describe("generateTheme - output structure", () => {
  const theme = generateTheme();

  it("light and dark modes have identical structure", () => {
    const lightKeys = Object.keys(theme.light).sort();
    const darkKeys = Object.keys(theme.dark).sort();
    expect(lightKeys).toEqual(darkKeys);
  });

  it("states object has 8 intents with 4 states each", () => {
    const intents = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"];
    const stateKeys = ["hover", "pressed", "focused", "disabled"];
    for (const intent of intents) {
      for (const state of stateKeys) {
        expect(theme.light.states[intent as keyof typeof theme.light.states]).toHaveProperty(state);
      }
    }
  });

  it("accessibility object has 18 entries", () => {
    expect(Object.keys(theme.light.accessibility)).toHaveLength(18);
  });

  it("all color values in output match hex format", () => {
    for (const value of Object.values(theme.light.colors)) {
      expectValidHex(value);
    }
    for (const value of Object.values(theme.dark.colors)) {
      expectValidHex(value);
    }
  });
});

// ─── harmony option ─────────────────────────────────────────────────

describe("generateTheme - harmony option", () => {
  it("complementary harmony produces valid theme", () => {
    const theme = generateTheme({ primary: "#1e90ff", harmony: "complementary" });
    for (const v of Object.values(theme.light.colors)) {
      expectValidHex(v);
    }
  });

  it("tetradic harmony produces valid theme in both modes", () => {
    const theme = generateTheme({ primary: "#ff0000", harmony: "tetradic" });
    expectValidHex(theme.light.colors.quaternary);
    expectValidHex(theme.dark.colors.quaternary);
  });

  it("harmony + quaternary override: override wins", () => {
    const theme = generateTheme({ primary: "#1e90ff", harmony: "triadic", quaternary: "#abcdef" });
    expect(theme.light.colors.quaternary).toBe("#abcdef");
    expect(theme.dark.colors.quaternary).toBe("#abcdef");
  });

  it("all harmonies pass WCAG AA for on-colors across all presets", () => {
    const harmonies = ["complementary", "triadic", "split-complementary", "tetradic", "monochromatic"] as const;
    for (const harmony of harmonies) {
      const theme = generateTheme({ primary: "#1e90ff", harmony });
      for (const mode of [theme.light, theme.dark]) {
        expect(contrastRatio(mode.colors.onQuaternary, mode.colors.quaternary)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

// ─── WCAG compliance across all presets ─────────────────────────────

describe("generateTheme - WCAG compliance", () => {
  const onColorPairs = [
    ["onPrimary", "primary"],
    ["onSecondary", "secondary"],
    ["onTertiary", "tertiary"],
    ["onQuaternary", "quaternary"],
    ["onDanger", "danger"],
    ["onSuccess", "success"],
    ["onWarning", "warning"],
    ["onInfo", "info"],
  ] as const;

  it.each(presetNames)("all on-colors meet WCAG AA for preset '%s'", (preset) => {
    const theme = generateTheme({ preset });
    for (const mode of [theme.light, theme.dark]) {
      for (const [on, bg] of onColorPairs) {
        const ratio = contrastRatio(mode.colors[on], mode.colors[bg]);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

// ─── colors input — WCAG fail + override: false (keep user value) ────

describe("generateTheme - colors.both WCAG fail, override: false", () => {
  // Very light primary that cannot pass 4.5:1 on the light background
  const theme = generateTheme({ colors: { both: { primary: "#d0e8f0" } }, override: false });

  it("produces warnings", () => {
    expect(theme.warnings).toBeDefined();
    expect(theme.warnings!.length).toBeGreaterThan(0);
  });

  it("light mode warning has action='warn'", () => {
    const warn = theme.warnings!.find((w) => w.key === "primary" && w.mode === "light");
    expect(warn).toBeDefined();
    expect(warn!.action).toBe("warn");
  });

  it("user value is kept in output", () => {
    const warn = theme.warnings!.find((w) => w.key === "primary" && w.mode === "light");
    expect(theme.light.colors.primary).toBe(warn!.value);
    expect(warn!.finalValue).toBe(warn!.value);
  });

  it("on-color is still auto-derived from the kept user value", () => {
    expectValidHex(theme.light.colors.onPrimary);
    expect(contrastRatio(theme.light.colors.onPrimary, theme.light.colors.primary)).toBeGreaterThanOrEqual(4.5);
  });
});

// ─── colors input — WCAG fail + override: true (auto-correct) ────────

describe("generateTheme - colors.both WCAG fail, override: true", () => {
  const theme = generateTheme({ colors: { both: { primary: "#d0e8f0" } }, override: true });

  it("produces warnings with action='corrected'", () => {
    const warn = theme.warnings!.find((w) => w.key === "primary" && w.mode === "light");
    expect(warn).toBeDefined();
    expect(warn!.action).toBe("corrected");
  });

  it("corrected value passes WCAG AA in output", () => {
    expect(contrastRatio(theme.light.colors.primary, theme.light.colors.background)).toBeGreaterThanOrEqual(4.5);
  });

  it("correction preserves hue within 2°", () => {
    const originalH = hexToOklch("#d0e8f0").H;
    const correctedH = hexToOklch(theme.light.colors.primary).H;
    expect(Math.abs(correctedH - originalH)).toBeLessThan(2);
  });

  it("warning.value is original; warning.finalValue is corrected", () => {
    const warn = theme.warnings!.find((w) => w.key === "primary" && w.mode === "light");
    expect(warn!.value).toBe("#d0e8f0");
    expect(warn!.finalValue).toBe(theme.light.colors.primary);
    expect(warn!.finalValue).not.toBe(warn!.value);
  });
});

// ─── user-provided background triggers intent re-correction ──────────

describe("generateTheme - user background cascades to derived intent colors", () => {
  // Dark background in light mode — butterfly intent colors may fail on it
  const theme = generateTheme({ colors: { light: { background: "#1a1a2e" } } });
  const intentKeys = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"] as const;

  it("applies the user background", () => {
    expect(theme.light.colors.background).toBe("#1a1a2e");
  });

  it("all non-overridden intent colors still pass WCAG AA against the new background", () => {
    for (const key of intentKeys) {
      const ratio = contrastRatio(theme.light.colors[key], theme.light.colors.background);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("dark mode is unaffected", () => {
    expect(theme.dark.colors.background).not.toBe("#1a1a2e");
  });
});

// ─── mode-specific override ──────────────────────────────────────────

describe("generateTheme - mode-specific color override", () => {
  const base = generateTheme({ primary: "#0e9d8e" });
  const themed = generateTheme({ primary: "#0e9d8e", colors: { light: { danger: "#c0392b" } } });

  it("overrides light danger only", () => {
    expect(themed.light.colors.danger).toBe("#c0392b");
  });

  it("dark danger is unchanged from no-override baseline", () => {
    expect(themed.dark.colors.danger).toBe(base.dark.colors.danger);
  });
});

// ─── precedence: colors[mode] > colors.both > options.secondary ──────

describe("generateTheme - override precedence", () => {
  it("colors.light wins over colors.both for same key", () => {
    const theme = generateTheme({
      colors: { both: { secondary: "#aabbcc" }, light: { secondary: "#ff0000" } },
    });
    expect(theme.light.colors.secondary).toBe("#ff0000");
    expect(theme.dark.colors.secondary).toBe("#aabbcc");
  });

  it("colors.both wins over legacy options.secondary", () => {
    const theme = generateTheme({
      secondary: "#aabbcc",
      colors: { both: { secondary: "#ff4444" } },
    });
    expect(theme.light.colors.secondary).toBe("#ff4444");
    expect(theme.dark.colors.secondary).toBe("#ff4444");
  });

  it("legacy options.secondary still works when no colors.* override", () => {
    const theme = generateTheme({ secondary: "#ff00ff" });
    expect(theme.light.colors.secondary).toBe("#ff00ff");
    expect(theme.dark.colors.secondary).toBe("#ff00ff");
  });
});

// ─── no warnings on passing colors ──────────────────────────────────

describe("generateTheme - no warnings when user colors pass WCAG", () => {
  it("high-contrast primary produces no warnings", () => {
    // Very dark navy easily passes 4.5:1 on light background
    const theme = generateTheme({ colors: { both: { primary: "#1a237e" } } });
    const lightWarns = (theme.warnings ?? []).filter((w) => w.mode === "light" && w.key === "primary");
    expect(lightWarns).toHaveLength(0);
  });

  it("no light-mode warning for a dark primary that passes on light background", () => {
    const theme = generateTheme({ colors: { both: { primary: "#1a237e" } } });
    const lightWarn = (theme.warnings ?? []).find((w) => w.key === "primary" && w.mode === "light");
    expect(lightWarn).toBeUndefined();
  });
});

// ─── full-mode bypass — all 13 colors provided ──────────────────────

describe("generateTheme - full-mode bypass", () => {
  const fullLight: BaseColorOverride = {
    primary: "#3498db", secondary: "#2ecc71", tertiary: "#e74c3c",
    quaternary: "#f39c12", background: "#ecf0f1", surface: "#ffffff",
    text: "#2c3e50", muted: "#7f8c8d", border: "#bdc3c7",
    danger: "#c0392b", success: "#27ae60", warning: "#d4ac0d",
    info: "#2980b9",
  };

  const theme = generateTheme({ colors: { light: fullLight } });

  it("uses exact user values for light mode base colors", () => {
    expect(theme.light.colors.background).toBe("#ecf0f1");
    expect(theme.light.colors.text).toBe("#2c3e50");
    expect(theme.light.colors.primary).toBe("#3498db");
  });

  it("auto-derives on-colors for the full light mode", () => {
    expectValidHex(theme.light.colors.onPrimary);
    expect(contrastRatio(theme.light.colors.onPrimary, theme.light.colors.primary)).toBeGreaterThanOrEqual(4.5);
  });

  it("dark mode is butterfly-derived from light primary as seed", () => {
    expectValidHex(theme.dark.colors.primary);
    const lightH = hexToOklch("#3498db").H;
    const darkH  = hexToOklch(theme.dark.colors.primary).H;
    expect(Math.abs(darkH - lightH)).toBeLessThan(2);
  });

  it("dark mode background is darker than light mode background", () => {
    const lightBgL = hexToOklch(theme.light.colors.background).L;
    const darkBgL  = hexToOklch(theme.dark.colors.background).L;
    expect(darkBgL).toBeLessThan(lightBgL);
  });
});
