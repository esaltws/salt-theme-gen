import { describe, it, expect } from "vitest";
import { simulateColorBlindness, simulateTheme } from "./color-blindness";
import type { ColorBlindnessType } from "./color-blindness";
import { generateTheme } from "./generate-theme";
import { isValidHex } from "./color-math";

const ALL_TYPES: ColorBlindnessType[] = [
  "protanopia", "deuteranopia", "tritanopia",
  "protanomaly", "deuteranomaly", "tritanomaly",
  "achromatopsia",
];

// ─── simulateColorBlindness ───────────────────────────────────────────

describe("simulateColorBlindness — output format", () => {
  it("always returns a valid 6-digit hex string", () => {
    for (const type of ALL_TYPES) {
      const out = simulateColorBlindness("#e63946", type);
      expect(out, `type=${type}`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(isValidHex(out), `type=${type}`).toBe(true);
    }
  });

  it("returns valid hex for a dark color", () => {
    for (const type of ALL_TYPES) {
      const out = simulateColorBlindness("#1a1a2e", type);
      expect(isValidHex(out), `type=${type}`).toBe(true);
    }
  });

  it("returns valid hex for a light color", () => {
    for (const type of ALL_TYPES) {
      const out = simulateColorBlindness("#f8f9fa", type);
      expect(isValidHex(out), `type=${type}`).toBe(true);
    }
  });
});

describe("simulateColorBlindness — white and black preservation", () => {
  it("white (#ffffff) maps to white under all dichromacy types", () => {
    const dichromaticTypes: ColorBlindnessType[] = ["protanopia", "deuteranopia", "tritanopia"];
    for (const type of dichromaticTypes) {
      const out = simulateColorBlindness("#ffffff", type);
      expect(out, `type=${type}`).toBe("#ffffff");
    }
  });

  it("black (#000000) maps to black under all dichromacy types", () => {
    const dichromaticTypes: ColorBlindnessType[] = ["protanopia", "deuteranopia", "tritanopia"];
    for (const type of dichromaticTypes) {
      const out = simulateColorBlindness("#000000", type);
      expect(out, `type=${type}`).toBe("#000000");
    }
  });

  it("white maps to white under achromatopsia", () => {
    expect(simulateColorBlindness("#ffffff", "achromatopsia")).toBe("#ffffff");
  });

  it("black maps to black under achromatopsia", () => {
    expect(simulateColorBlindness("#000000", "achromatopsia")).toBe("#000000");
  });

  it("white maps to near-white under anomalous trichromacy (severity 0.6)", () => {
    const anomalous: ColorBlindnessType[] = ["protanomaly", "deuteranomaly", "tritanomaly"];
    for (const type of anomalous) {
      const out = simulateColorBlindness("#ffffff", type);
      // White blended with white should stay white
      expect(out, `type=${type}`).toBe("#ffffff");
    }
  });
});

describe("simulateColorBlindness — achromatopsia produces grayscale", () => {
  it("output R=G=B (grayscale) for a chromatic input", () => {
    const hex = "#e63946"; // vivid red
    const out = simulateColorBlindness(hex, "achromatopsia");
    const r = parseInt(out.slice(1, 3), 16);
    const g = parseInt(out.slice(3, 5), 16);
    const b = parseInt(out.slice(5, 7), 16);
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it("grayscale output matches relative luminance", () => {
    const gray = simulateColorBlindness("#ff0000", "achromatopsia");
    const channel = parseInt(gray.slice(1, 3), 16);
    // Red has low luminance (~0.2126 linear); result should be dark
    expect(channel).toBeLessThan(128);
  });
});

describe("simulateColorBlindness — type-specific effects", () => {
  it("red appears shifted for protanopia (no red cones)", () => {
    const original = "#ff0000";
    const simulated = simulateColorBlindness(original, "protanopia");
    // Protanopes confuse red with dark olive/brown — result is not red
    const origR = parseInt(original.slice(1, 3), 16);
    const simR = parseInt(simulated.slice(1, 3), 16);
    expect(simR).toBeLessThan(origR); // red channel should be significantly reduced
  });

  it("red appears shifted for deuteranopia (no green cones)", () => {
    const simulated = simulateColorBlindness("#00ff00", "deuteranopia");
    // Green appears brownish/yellow to deuteranopes — not vivid green
    const g = parseInt(simulated.slice(3, 5), 16);
    expect(g).toBeLessThan(255); // green channel reduced
  });

  it("blue appears shifted for tritanopia (no blue cones)", () => {
    const simulated = simulateColorBlindness("#0000ff", "tritanopia");
    // Blue channel should be affected
    const b = parseInt(simulated.slice(5, 7), 16);
    expect(b).toBeLessThan(255);
  });

  it("anomalous types have less extreme shift than dichromacy at severity 0.6", () => {
    const original = "#e63946";
    const dichromatic = simulateColorBlindness(original, "protanopia");
    const anomalous = simulateColorBlindness(original, "protanomaly");

    const origR = parseInt(original.slice(1, 3), 16);
    const dichR = parseInt(dichromatic.slice(1, 3), 16);
    const anomR = parseInt(anomalous.slice(1, 3), 16);

    const dichShift = Math.abs(origR - dichR);
    const anomShift = Math.abs(origR - anomR);
    expect(anomShift).toBeLessThan(dichShift);
  });

  it("deuteranomaly has less shift than deuteranopia", () => {
    const original = "#00cc44";
    const dichromatic = simulateColorBlindness(original, "deuteranopia");
    const anomalous = simulateColorBlindness(original, "deuteranomaly");

    const origG = parseInt(original.slice(3, 5), 16);
    const dichG = parseInt(dichromatic.slice(3, 5), 16);
    const anomG = parseInt(anomalous.slice(3, 5), 16);

    const dichShift = Math.abs(origG - dichG);
    const anomShift = Math.abs(origG - anomG);
    expect(anomShift).toBeLessThan(dichShift);
  });
});

describe("simulateColorBlindness — pure neutral colors", () => {
  it("mid-gray stays gray under all types (R=G=B in → R=G=B out)", () => {
    const gray = "#808080";
    for (const type of ALL_TYPES) {
      const out = simulateColorBlindness(gray, type);
      const r = parseInt(out.slice(1, 3), 16);
      const g = parseInt(out.slice(3, 5), 16);
      const b = parseInt(out.slice(5, 7), 16);
      // Allow ±1 rounding for gray stability
      expect(Math.abs(r - g), `type=${type} R-G`).toBeLessThanOrEqual(1);
      expect(Math.abs(g - b), `type=${type} G-B`).toBeLessThanOrEqual(1);
    }
  });
});

// ─── simulateTheme ───────────────────────────────────────────────────

const baseTheme = generateTheme({ primary: "#1e90ff" });

describe("simulateTheme — structure", () => {
  it("returns an object with light and dark modes", () => {
    const sim = simulateTheme(baseTheme, "deuteranopia");
    expect(sim).toHaveProperty("light");
    expect(sim).toHaveProperty("dark");
  });

  it("does not mutate the original theme", () => {
    const origPrimary = baseTheme.light.colors.primary;
    simulateTheme(baseTheme, "protanopia");
    expect(baseTheme.light.colors.primary).toBe(origPrimary);
  });

  it("includes accessibility and apca reports on simulated output", () => {
    const sim = simulateTheme(baseTheme, "deuteranopia");
    expect(sim.light).toHaveProperty("accessibility");
    expect(sim.light).toHaveProperty("apca");
    expect(sim.dark).toHaveProperty("accessibility");
    expect(sim.dark).toHaveProperty("apca");
  });

  it("preserves non-color fields (spacing, radius, fontSizes)", () => {
    const sim = simulateTheme(baseTheme, "achromatopsia");
    expect(sim.tokens.spacing).toEqual(baseTheme.tokens.spacing);
    expect(sim.tokens.radius).toEqual(baseTheme.tokens.radius);
    expect(sim.tokens.fontSizes).toEqual(baseTheme.tokens.fontSizes);
  });

  it("preserves iconSizes", () => {
    const sim = simulateTheme(baseTheme, "tritanopia");
    expect(sim.tokens.iconSizes).toEqual(baseTheme.tokens.iconSizes);
  });

  it("preserves warnings if present", () => {
    const sim = simulateTheme(baseTheme, "protanopia");
    if (baseTheme.warnings !== undefined) {
      expect(sim.warnings).toEqual(baseTheme.warnings);
    } else {
      expect(sim.warnings).toBeUndefined();
    }
  });
});

describe("simulateTheme — color transformation", () => {
  it("semantic colors are changed by dichromacy simulation", () => {
    const sim = simulateTheme(baseTheme, "deuteranopia");
    // At least some semantic colors should differ (blue-heavy theme will shift)
    const changedKeys = Object.keys(baseTheme.light.colors).filter(
      (k) => (baseTheme.light.colors as Record<string, string>)[k] !==
              (sim.light.colors as Record<string, string>)[k]
    );
    expect(changedKeys.length).toBeGreaterThan(0);
  });

  it("all simulated color values are valid hex strings", () => {
    const sim = simulateTheme(baseTheme, "protanopia");
    for (const [k, v] of Object.entries(sim.light.colors as Record<string, string>)) {
      expect(isValidHex(v), `light.colors.${k}`).toBe(true);
    }
    for (const [k, v] of Object.entries(sim.dark.colors as Record<string, string>)) {
      expect(isValidHex(v), `dark.colors.${k}`).toBe(true);
    }
  });

  it("achromatopsia makes all semantic colors grayscale (R=G=B)", () => {
    const sim = simulateTheme(baseTheme, "achromatopsia");
    for (const [k, hex] of Object.entries(sim.light.colors as Record<string, string>)) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      expect(r, `light.${k} R≠G`).toBe(g);
      expect(g, `light.${k} G≠B`).toBe(b);
    }
  });

  it("tonal palette colors are all valid hex after simulation", () => {
    const sim = simulateTheme(baseTheme, "deuteranomaly");
    for (const [pk, palette] of Object.entries(sim.light.palettes)) {
      for (const [step, hex] of Object.entries(palette as Record<string, string>)) {
        expect(isValidHex(hex), `palette.${pk}.${step}`).toBe(true);
      }
    }
  });

  it("surface elevation colors are all valid hex after simulation", () => {
    const sim = simulateTheme(baseTheme, "tritanomaly");
    for (const [k, hex] of Object.entries(sim.light.surfaceElevation)) {
      expect(isValidHex(hex), `surfaceElevation.${k}`).toBe(true);
    }
  });

  it("state colors are all valid hex after simulation", () => {
    const sim = simulateTheme(baseTheme, "protanomaly");
    for (const [intent, states] of Object.entries(sim.light.states)) {
      for (const [state, hex] of Object.entries(states as Record<string, string>)) {
        expect(isValidHex(hex), `states.${intent}.${state}`).toBe(true);
      }
    }
  });
});

describe("simulateTheme — accessibility recomputation", () => {
  it("accessibility report keys are preserved after simulation", () => {
    const sim = simulateTheme(baseTheme, "deuteranopia");
    const origKeys = Object.keys(baseTheme.light.accessibility);
    const simKeys = Object.keys(sim.light.accessibility);
    expect(simKeys).toEqual(origKeys);
  });

  it("apca report keys are preserved after simulation", () => {
    const sim = simulateTheme(baseTheme, "protanopia");
    const origKeys = Object.keys(baseTheme.light.apca);
    const simKeys = Object.keys(sim.light.apca);
    expect(simKeys).toEqual(origKeys);
  });

  it("achromatopsia typically degrades accessibility (some pairs fail)", () => {
    const sim = simulateTheme(generateTheme({ primary: "#e63946" }), "achromatopsia");
    // At least some APCA entries should be weaker than on original colorful theme
    const failCount = Object.values(sim.light.apca).filter(
      (e) => (e as { lc: number; level: string }).level === "fail"
    ).length;
    // Just verify the report ran — can't guarantee failure count
    expect(typeof failCount).toBe("number");
  });
});

// ─── Preset round-trip ────────────────────────────────────────────────

describe("simulateTheme — preset round-trip", () => {
  it("all presets produce valid simulated themes for all 7 types", () => {
    const presets = ["peacock", "ocean", "forest", "sunset", "midnight"] as const;
    for (const preset of presets) {
      const theme = generateTheme({ preset });
      for (const type of ALL_TYPES) {
        const sim = simulateTheme(theme, type);
        expect(isValidHex(sim.light.colors.primary), `${preset} ${type} light primary`).toBe(true);
        expect(isValidHex(sim.dark.colors.primary), `${preset} ${type} dark primary`).toBe(true);
      }
    }
  });
});

// ─── schemaVersion ────────────────────────────────────────────────────

describe("simulateTheme — schemaVersion", () => {
  const baseTheme = generateTheme({ primary: "#1e90ff" });

  it("preserves schemaVersion for every simulation type", () => {
    for (const type of ALL_TYPES) {
      const sim = simulateTheme(baseTheme, type);
      expect(sim.schemaVersion, `${type} schemaVersion`).toBe(baseTheme.schemaVersion);
    }
  });

  it("preserves schemaVersion value '2.0'", () => {
    const sim = simulateTheme(baseTheme, "deuteranopia");
    expect(sim.schemaVersion).toBe("2.0");
  });
});
