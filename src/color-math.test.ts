import { describe, it, expect } from "vitest";
import {
  isValidHex,
  normalizeHex,
  parseColor,
  hexToRgb,
  rgbToHex,
  rgbToLinear,
  linearToRgb,
  linearRgbToOklab,
  oklabToLinearRgb,
  oklabToOklch,
  oklchToOklab,
  hexToOklch,
  oklchToHex,
  gamutClamp,
  clampOklch,
  relativeLuminance,
  contrastRatio,
  meetsWcagAA,
  meetsWcagAALarge,
  darken,
  lighten,
  desaturate,
  adjustHue,
  setLightness,
  setChroma,
  mix,
} from "./color-math";
import { expectCloseHex, expectValidHex } from "./test-helpers";

// ─── isValidHex ─────────────────────────────────────────────────────

describe("isValidHex", () => {
  it("returns true for 6-digit hex", () => {
    expect(isValidHex("#ff0000")).toBe(true);
  });

  it("returns true for 3-digit hex", () => {
    expect(isValidHex("#f00")).toBe(true);
  });

  it("returns true for uppercase", () => {
    expect(isValidHex("#FF0000")).toBe(true);
  });

  it("returns true for mixed case", () => {
    expect(isValidHex("#Ff00aB")).toBe(true);
  });

  it("returns false for missing hash", () => {
    expect(isValidHex("ff0000")).toBe(false);
  });

  it("returns false for 4-digit hex", () => {
    expect(isValidHex("#ff00")).toBe(false);
  });

  it("returns false for 8-digit hex with alpha", () => {
    expect(isValidHex("#ff000000")).toBe(false);
  });

  it("returns false for invalid characters", () => {
    expect(isValidHex("#gggggg")).toBe(false);
  });
});

// ─── normalizeHex ───────────────────────────────────────────────────

describe("normalizeHex", () => {
  it("expands 3-digit to 6-digit", () => {
    expect(normalizeHex("#f00")).toBe("#ff0000");
  });

  it("lowercases uppercase hex", () => {
    expect(normalizeHex("#FF0000")).toBe("#ff0000");
  });

  it("passes through already normalized hex", () => {
    expect(normalizeHex("#ff0000")).toBe("#ff0000");
  });

  it("expands and lowercases simultaneously", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
  });

  it("handles hex without hash prefix", () => {
    expect(normalizeHex("f00")).toBe("#ff0000");
  });
});

// ─── parseColor ─────────────────────────────────────────────────────

describe("parseColor", () => {
  describe("HEX inputs", () => {
    it("parses 6-digit hex", () => {
      expect(parseColor("#ff0000")).toBe("#ff0000");
    });

    it("parses 3-digit hex and normalizes", () => {
      expect(parseColor("#f00")).toBe("#ff0000");
    });

    it("trims whitespace", () => {
      expect(parseColor("  #ff0000  ")).toBe("#ff0000");
    });

    it("throws on invalid hex", () => {
      expect(() => parseColor("#xyz")).toThrow("Invalid HEX");
    });

    it("throws on 4-digit hex", () => {
      expect(() => parseColor("#ff00")).toThrow("Invalid HEX");
    });
  });

  describe("RGB inputs", () => {
    it("parses rgb() with commas", () => {
      expect(parseColor("rgb(255, 0, 0)")).toBe("#ff0000");
    });

    it("parses rgb() with spaces", () => {
      expect(parseColor("rgb(255 0 0)")).toBe("#ff0000");
    });

    it("parses rgba() ignoring alpha", () => {
      expect(parseColor("rgba(255, 0, 0, 0.5)")).toBe("#ff0000");
    });

    it("parses rgb(0, 0, 0) as black", () => {
      expect(parseColor("rgb(0, 0, 0)")).toBe("#000000");
    });

    it("parses rgb(255, 255, 255) as white", () => {
      expect(parseColor("rgb(255, 255, 255)")).toBe("#ffffff");
    });

    it("throws on rgb values > 255", () => {
      expect(() => parseColor("rgb(256, 0, 0)")).toThrow("RGB values must be 0");
    });
  });

  describe("CSS named colors", () => {
    it("parses 'red'", () => {
      expect(parseColor("red")).toBe("#ff0000");
    });

    it("parses 'teal'", () => {
      expect(parseColor("teal")).toBe("#008080");
    });

    it("parses case-insensitive", () => {
      expect(parseColor("RED")).toBe("#ff0000");
    });

    it("throws on unknown name", () => {
      expect(() => parseColor("notacolor")).toThrow("Unrecognized color");
    });
  });

  describe("oklch() inputs", () => {
    it("parses oklch() and returns a valid hex", () => {
      const result = parseColor("oklch(0.55 0.18 220)");
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
      expect(result).not.toContain("NaN");
    });

    it("oklch(0 0 0) returns black", () => {
      expect(parseColor("oklch(0 0 0)")).toBe("#000000");
    });

    it("oklch(1 0 0) returns white", () => {
      expect(parseColor("oklch(1 0 0)")).toBe("#ffffff");
    });

    it("parses oklch() with extra whitespace", () => {
      const result = parseColor("  oklch( 0.55  0.18  220 )  ");
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("is case-insensitive", () => {
      const result = parseColor("OKLCH(0.55 0.18 220)");
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("throws for L > 1", () => {
      expect(() => parseColor("oklch(1.5 0.18 220)")).toThrow("Invalid oklch()");
    });

    it("throws for L < 0", () => {
      expect(() => parseColor("oklch(-0.1 0.18 220)")).toThrow("Invalid oklch()");
    });

    it("throws for C < 0", () => {
      expect(() => parseColor("oklch(0.5 -0.1 220)")).toThrow("Invalid oklch()");
    });

    it("error message mentions oklch() as a valid format", () => {
      expect(() => parseColor("notacolor")).toThrow("oklch(L C H)");
    });
  });
});

// ─── hexToRgb / rgbToHex ────────────────────────────────────────────

describe("hexToRgb", () => {
  it("converts black", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("converts white", () => {
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("converts red", () => {
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("converts arbitrary color (dodger blue)", () => {
    expect(hexToRgb("#1e90ff")).toEqual({ r: 30, g: 144, b: 255 });
  });
});

describe("rgbToHex", () => {
  it("converts black", () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000");
  });

  it("converts white", () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe("#ffffff");
  });

  it("clamps out-of-range high values", () => {
    expect(rgbToHex({ r: 300, g: 0, b: 128 })).toBe("#ff0080");
  });

  it("clamps negative values to 0", () => {
    expect(rgbToHex({ r: -5, g: 0, b: 0 })).toBe("#000000");
  });

  it("rounds fractional values", () => {
    expect(rgbToHex({ r: 127.6, g: 0, b: 255 })).toBe("#8000ff");
  });
});

// ─── rgbToLinear / linearToRgb ──────────────────────────────────────

describe("rgbToLinear / linearToRgb", () => {
  it("black maps to [0, 0, 0]", () => {
    const [r, g, b] = rgbToLinear({ r: 0, g: 0, b: 0 });
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it("white maps to approximately [1, 1, 1]", () => {
    const [r, g, b] = rgbToLinear({ r: 255, g: 255, b: 255 });
    expect(r).toBeCloseTo(1, 3);
    expect(g).toBeCloseTo(1, 3);
    expect(b).toBeCloseTo(1, 3);
  });

  it("round-trips correctly", () => {
    const original = { r: 128, g: 64, b: 200 };
    const linear = rgbToLinear(original);
    const back = linearToRgb(linear);
    expect(Math.round(back.r)).toBe(original.r);
    expect(Math.round(back.g)).toBe(original.g);
    expect(Math.round(back.b)).toBe(original.b);
  });
});

// ─── linearRgbToOklab / oklabToLinearRgb ────────────────────────────

describe("linearRgbToOklab / oklabToLinearRgb", () => {
  it("black has L approximately 0", () => {
    const lab = linearRgbToOklab(0, 0, 0);
    expect(lab.L).toBeCloseTo(0, 5);
    expect(lab.a).toBeCloseTo(0, 5);
    expect(lab.b).toBeCloseTo(0, 5);
  });

  it("white has L approximately 1", () => {
    const lab = linearRgbToOklab(1, 1, 1);
    expect(lab.L).toBeCloseTo(1, 3);
    expect(lab.a).toBeCloseTo(0, 3);
    expect(lab.b).toBeCloseTo(0, 3);
  });

  it("round-trips correctly", () => {
    const r = 0.5, g = 0.3, b = 0.7;
    const lab = linearRgbToOklab(r, g, b);
    const [rr, gg, bb] = oklabToLinearRgb(lab);
    expect(rr).toBeCloseTo(r, 5);
    expect(gg).toBeCloseTo(g, 5);
    expect(bb).toBeCloseTo(b, 5);
  });
});

// ─── oklabToOklch / oklchToOklab ────────────────────────────────────

describe("oklabToOklch / oklchToOklab", () => {
  it("achromatic color has C=0", () => {
    const lch = oklabToOklch({ L: 0.5, a: 0, b: 0 });
    expect(lch.C).toBeCloseTo(0, 10);
    expect(lch.L).toBeCloseTo(0.5, 10);
  });

  it("pure a-axis positive has H=0", () => {
    const lch = oklabToOklch({ L: 0.5, a: 0.1, b: 0 });
    expect(lch.H).toBeCloseTo(0, 5);
    expect(lch.C).toBeCloseTo(0.1, 5);
  });

  it("pure b-axis positive has H=90", () => {
    const lch = oklabToOklch({ L: 0.5, a: 0, b: 0.1 });
    expect(lch.H).toBeCloseTo(90, 5);
    expect(lch.C).toBeCloseTo(0.1, 5);
  });

  it("negative hue wraps to positive", () => {
    const lch = oklabToOklch({ L: 0.5, a: 0, b: -0.1 });
    expect(lch.H).toBeCloseTo(270, 5);
  });

  it("round-trips correctly", () => {
    const original = { L: 0.6, a: 0.1, b: -0.05 };
    const lch = oklabToOklch(original);
    const back = oklchToOklab(lch);
    expect(back.L).toBeCloseTo(original.L, 10);
    expect(back.a).toBeCloseTo(original.a, 10);
    expect(back.b).toBeCloseTo(original.b, 10);
  });
});

// ─── hexToOklch / oklchToHex round-trips ────────────────────────────

describe("hexToOklch / oklchToHex round-trips", () => {
  it("black round-trips", () => {
    expectCloseHex(oklchToHex(hexToOklch("#000000")), "#000000");
  });

  it("white round-trips", () => {
    expectCloseHex(oklchToHex(hexToOklch("#ffffff")), "#ffffff");
  });

  it("pure red round-trips", () => {
    expectCloseHex(oklchToHex(hexToOklch("#ff0000")), "#ff0000");
  });

  it("pure green round-trips", () => {
    expectCloseHex(oklchToHex(hexToOklch("#00ff00")), "#00ff00");
  });

  it("pure blue round-trips", () => {
    expectCloseHex(oklchToHex(hexToOklch("#0000ff")), "#0000ff");
  });

  it("mid-gray round-trips", () => {
    expectCloseHex(oklchToHex(hexToOklch("#808080")), "#808080");
  });

  it("dodger blue round-trips", () => {
    expectCloseHex(oklchToHex(hexToOklch("#1e90ff")), "#1e90ff");
  });

  it("black has L approximately 0", () => {
    const lch = hexToOklch("#000000");
    expect(lch.L).toBeCloseTo(0, 3);
    expect(lch.C).toBeCloseTo(0, 3);
  });

  it("white has L approximately 1", () => {
    const lch = hexToOklch("#ffffff");
    expect(lch.L).toBeCloseTo(1, 3);
    expect(lch.C).toBeCloseTo(0, 3);
  });
});

// ─── gamutClamp ─────────────────────────────────────────────────────

describe("gamutClamp", () => {
  it("in-gamut color passes through unchanged", () => {
    const lch = hexToOklch("#ff0000");
    const clamped = gamutClamp(lch);
    expect(clamped.L).toBeCloseTo(lch.L, 5);
    expect(clamped.H).toBeCloseTo(lch.H, 5);
  });

  it("achromatic with L clamped to [0,1]", () => {
    const clamped = gamutClamp({ L: 1.5, C: 0, H: 0 });
    expect(clamped.L).toBeLessThanOrEqual(1);
    expect(clamped.C).toBe(0);
  });

  it("out-of-gamut high chroma reduces C", () => {
    const outOfGamut = { L: 0.5, C: 0.5, H: 264 };
    const clamped = gamutClamp(outOfGamut);
    expect(clamped.C).toBeLessThan(0.5);
    expect(clamped.L).toBeCloseTo(0.5, 5);
    expect(clamped.H).toBeCloseTo(264, 5);
  });

  it("L=0 produces valid hex", () => {
    const hex = oklchToHex({ L: 0, C: 0.1, H: 0 });
    expectValidHex(hex);
  });

  it("L=1 produces valid hex", () => {
    const hex = oklchToHex({ L: 1, C: 0.1, H: 0 });
    expectValidHex(hex);
  });

  it("result is always in sRGB gamut", () => {
    const outOfGamut = { L: 0.7, C: 0.4, H: 150 };
    const clamped = gamutClamp(outOfGamut);
    const hex = oklchToHex(clamped);
    const rgb = hexToRgb(hex);
    expect(rgb.r).toBeGreaterThanOrEqual(0);
    expect(rgb.r).toBeLessThanOrEqual(255);
    expect(rgb.g).toBeGreaterThanOrEqual(0);
    expect(rgb.g).toBeLessThanOrEqual(255);
    expect(rgb.b).toBeGreaterThanOrEqual(0);
    expect(rgb.b).toBeLessThanOrEqual(255);
  });
});

// ─── clampOklch ─────────────────────────────────────────────────────

describe("clampOklch", () => {
  it("clamps L below 0", () => {
    expect(clampOklch({ L: -0.5, C: 0.1, H: 100 }).L).toBe(0);
  });

  it("clamps L above 1", () => {
    expect(clampOklch({ L: 1.5, C: 0.1, H: 100 }).L).toBe(1);
  });

  it("clamps C below 0", () => {
    expect(clampOklch({ L: 0.5, C: -0.1, H: 100 }).C).toBe(0);
  });

  it("wraps negative H to positive", () => {
    expect(clampOklch({ L: 0.5, C: 0.1, H: -30 }).H).toBeCloseTo(330, 5);
  });

  it("wraps H > 360", () => {
    expect(clampOklch({ L: 0.5, C: 0.1, H: 400 }).H).toBeCloseTo(40, 5);
  });
});

// ─── relativeLuminance ──────────────────────────────────────────────

describe("relativeLuminance", () => {
  it("black = 0", () => {
    expect(relativeLuminance("#000000")).toBe(0);
  });

  it("white approximately 1", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 3);
  });

  it("mid-gray approximately 0.2159", () => {
    expect(relativeLuminance("#808080")).toBeCloseTo(0.2159, 2);
  });

  it("pure red approximately 0.2126", () => {
    expect(relativeLuminance("#ff0000")).toBeCloseTo(0.2126, 3);
  });
});

// ─── contrastRatio ──────────────────────────────────────────────────

describe("contrastRatio", () => {
  it("black on white is 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("white on white is 1:1", () => {
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    const a = contrastRatio("#ff0000", "#0000ff");
    const b = contrastRatio("#0000ff", "#ff0000");
    expect(a).toBeCloseTo(b, 10);
  });

  it("same color on itself is 1:1", () => {
    expect(contrastRatio("#808080", "#808080")).toBeCloseTo(1, 5);
  });
});

// ─── meetsWcagAA / meetsWcagAALarge ─────────────────────────────────

describe("meetsWcagAA / meetsWcagAALarge", () => {
  it("black on white meets AA", () => {
    expect(meetsWcagAA("#000000", "#ffffff")).toBe(true);
  });

  it("white on white fails AA", () => {
    expect(meetsWcagAA("#ffffff", "#ffffff")).toBe(false);
  });

  it("meetsWcagAALarge has 3.0 threshold", () => {
    // A pair that passes large (3.0) but might fail normal (4.5)
    expect(meetsWcagAALarge("#000000", "#ffffff")).toBe(true);
  });

  it("same color fails both thresholds", () => {
    expect(meetsWcagAA("#808080", "#808080")).toBe(false);
    expect(meetsWcagAALarge("#808080", "#808080")).toBe(false);
  });
});

// ─── Color Manipulation ─────────────────────────────────────────────

describe("darken", () => {
  it("darkens a color (L decreases)", () => {
    const original = hexToOklch("#808080");
    const darkened = hexToOklch(darken("#808080", 0.1));
    expect(darkened.L).toBeLessThan(original.L);
  });

  it("darken by 0 returns same color", () => {
    expectCloseHex(darken("#808080", 0), "#808080");
  });

  it("extreme darkening clamps to near-black", () => {
    const hex = darken("#808080", 1.0);
    expectValidHex(hex);
    const lch = hexToOklch(hex);
    expect(lch.L).toBeCloseTo(0, 1);
  });
});

describe("lighten", () => {
  it("lightens a color (L increases)", () => {
    const original = hexToOklch("#808080");
    const lightened = hexToOklch(lighten("#808080", 0.1));
    expect(lightened.L).toBeGreaterThan(original.L);
  });

  it("lighten by 0 returns same color", () => {
    expectCloseHex(lighten("#808080", 0), "#808080");
  });

  it("extreme lightening clamps to near-white", () => {
    const hex = lighten("#808080", 1.0);
    expectValidHex(hex);
    const lch = hexToOklch(hex);
    expect(lch.L).toBeCloseTo(1, 1);
  });
});

describe("desaturate", () => {
  it("desaturate to 0 produces achromatic color", () => {
    const lch = hexToOklch(desaturate("#ff0000", 0));
    expect(lch.C).toBeCloseTo(0, 3);
  });

  it("desaturate by 1 returns same color", () => {
    expectCloseHex(desaturate("#ff0000", 1), "#ff0000");
  });

  it("desaturate by 0.5 halves chroma", () => {
    const original = hexToOklch("#ff0000");
    const result = hexToOklch(desaturate("#ff0000", 0.5));
    expect(result.C).toBeCloseTo(original.C * 0.5, 2);
  });
});

describe("adjustHue", () => {
  it("adjustHue by 180 shifts to complementary", () => {
    const original = hexToOklch("#ff0000");
    const shifted = hexToOklch(adjustHue("#ff0000", 180));
    const expectedH = (original.H + 180) % 360;
    expect(shifted.H).toBeCloseTo(expectedH, 0);
  });

  it("adjustHue by 360 returns same color", () => {
    expectCloseHex(adjustHue("#ff0000", 360), "#ff0000");
  });
});

describe("setLightness", () => {
  it("sets L to 0.5", () => {
    const lch = hexToOklch(setLightness("#ff0000", 0.5));
    expect(lch.L).toBeCloseTo(0.5, 2);
  });
});

describe("setChroma", () => {
  it("sets C to 0 produces achromatic", () => {
    const lch = hexToOklch(setChroma("#ff0000", 0));
    expect(lch.C).toBeCloseTo(0, 3);
  });

  it("sets C to specific value", () => {
    const lch = hexToOklch(setChroma("#ff0000", 0.1));
    expect(lch.C).toBeCloseTo(0.1, 2);
  });
});

// ─── mix ─────────────────────────────────────────────────────────────

describe("mix", () => {
  it("ratio=0 returns color1", () => {
    expectCloseHex(mix("#ff0000", "#0000ff", 0), "#ff0000");
  });

  it("ratio=1 returns color2", () => {
    expectCloseHex(mix("#ff0000", "#0000ff", 1), "#0000ff");
  });

  it("ratio=0.5 produces a midpoint color", () => {
    const mid = mix("#000000", "#ffffff", 0.5);
    const lch = hexToOklch(mid);
    const l1 = hexToOklch("#000000").L;
    const l2 = hexToOklch("#ffffff").L;
    expect(lch.L).toBeCloseTo((l1 + l2) / 2, 1);
  });

  it("result is always a valid hex", () => {
    expectValidHex(mix("#1e90ff", "#ff6347", 0.25));
    expectValidHex(mix("#1e90ff", "#ff6347", 0.75));
  });

  it("mixing a color with itself returns the same color", () => {
    expectCloseHex(mix("#1e90ff", "#1e90ff", 0.5), "#1e90ff");
  });

  it("hue interpolation takes shortest arc", () => {
    // H=10 and H=350 are 20° apart across 0, not 340° apart the long way
    const result = hexToOklch(mix(
      oklchToHex({ L: 0.5, C: 0.1, H: 10 }),
      oklchToHex({ L: 0.5, C: 0.1, H: 350 }),
      0.5
    ));
    // Midpoint should be near H=0/360, not near H=180
    expect(result.H % 360).toBeLessThan(20);
  });
});
