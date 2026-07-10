import { describe, it, expect } from "vitest";
import { generateTonalPalette, generateTonalPalettes, TONAL_STEPS } from "./palettes";
import { generateTheme } from "./generate-theme";
import { hexToOklch } from "./color-math";
import { expectValidHex } from "./test-helpers";

const PRIMARY = "#1e90ff";

// ─── generateTonalPalette ────────────────────────────────────────────

describe("generateTonalPalette", () => {
  const palette = generateTonalPalette(PRIMARY);

  it("returns all 11 steps", () => {
    for (const step of TONAL_STEPS) {
      expect(palette).toHaveProperty(String(step));
    }
  });

  it("all step values are valid hex strings", () => {
    for (const step of TONAL_STEPS) {
      expectValidHex(palette[step]);
    }
  });

  it("L decreases as step increases (lighter steps → lower step number)", () => {
    const Ls = TONAL_STEPS.map((s) => hexToOklch(palette[s]).L);
    for (let i = 0; i < Ls.length - 1; i++) {
      expect(Ls[i]).toBeGreaterThan(Ls[i + 1]);
    }
  });

  it("all steps share the same hue as the source color", () => {
    const sourceH = hexToOklch(PRIMARY).H;
    for (const step of TONAL_STEPS) {
      const H = hexToOklch(palette[step]).H;
      // 5° tolerance: hex-to-OKLCH roundtrip at low chroma/extreme L can drift ~3–4° due to 6-hex quantization
      expect(Math.abs(H - sourceH)).toBeLessThan(5);
    }
  });

  it("step 50 is near-white (L > 0.94)", () => {
    expect(hexToOklch(palette[50]).L).toBeGreaterThan(0.94);
  });

  it("step 950 is near-black (L < 0.20)", () => {
    expect(hexToOklch(palette[950]).L).toBeLessThan(0.20);
  });

  it("chroma is lower at extremes than at mid steps", () => {
    const C50  = hexToOklch(palette[50]).C;
    const C500 = hexToOklch(palette[500]).C;
    const C950 = hexToOklch(palette[950]).C;
    expect(C500).toBeGreaterThan(C50);
    expect(C500).toBeGreaterThan(C950);
  });

  it("works for achromatic input (gray)", () => {
    const gray = generateTonalPalette("#808080");
    for (const step of TONAL_STEPS) {
      expectValidHex(gray[step]);
    }
  });
});

// ─── generateTonalPalettes ───────────────────────────────────────────

describe("generateTonalPalettes", () => {
  const theme = generateTheme({ primary: PRIMARY });
  const palettes = generateTonalPalettes(theme.light.colors);
  const keys = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"] as const;

  it("returns all 8 palette keys", () => {
    for (const key of keys) {
      expect(palettes).toHaveProperty(key);
    }
  });

  it("each palette has all 11 steps", () => {
    for (const key of keys) {
      for (const step of TONAL_STEPS) {
        expect(palettes[key]).toHaveProperty(String(step));
        expectValidHex(palettes[key][step]);
      }
    }
  });

  it("different keys produce different step-500 values", () => {
    const mid500s = keys.map((k) => palettes[k][500]);
    const unique = new Set(mid500s);
    expect(unique.size).toBeGreaterThan(1);
  });
});

// ─── integration: GeneratedThemeMode.palettes ────────────────────────

describe("generateTheme — palettes field", () => {
  const theme = generateTheme({ primary: PRIMARY });

  it("light and dark modes both have palettes", () => {
    expect(theme.light.palettes).toBeDefined();
    expect(theme.dark.palettes).toBeDefined();
  });

  it("step-500 primary hue matches the semantic primary hue", () => {
    const semanticH = hexToOklch(theme.light.colors.primary).H;
    const step500H  = hexToOklch(theme.light.palettes.primary[500]).H;
    expect(Math.abs(step500H - semanticH)).toBeLessThan(2);
  });

  it("light and dark palettes differ (different semantic L targets)", () => {
    expect(theme.light.palettes.primary[500]).not.toBe(theme.dark.palettes.primary[500]);
  });

  it("all palette values across all presets are valid hex", () => {
    const presets = ["peacock", "ocean", "forest", "sunset", "midnight"] as const;
    const intentKeys = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"] as const;
    for (const preset of presets) {
      const t = generateTheme({ preset });
      for (const mode of [t.light, t.dark]) {
        for (const key of intentKeys) {
          for (const step of TONAL_STEPS) {
            expectValidHex(mode.palettes[key][step]);
          }
        }
      }
    }
  });
});
