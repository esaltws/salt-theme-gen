import { describe, it, expect } from "vitest";
import { resolveTextStyle } from "./rn-utils";
import { generateTheme } from "./generate-theme";

const theme = generateTheme({ primary: "#1e90ff" });
const typo  = theme.tokens.typography;

describe("resolveTextStyle — bodyMedium", () => {
  const style = resolveTextStyle(typo.bodyMedium);

  it("fontSize is preserved as-is", () => {
    expect(style.fontSize).toBe(typo.bodyMedium.fontSize);
  });

  it("lineHeight is absolute px (fontSize × ratio)", () => {
    const expected = Math.round(typo.bodyMedium.lineHeight * typo.bodyMedium.fontSize * 100) / 100;
    expect(style.lineHeight).toBe(expected);
  });

  it("lineHeight is greater than fontSize (ratio > 1)", () => {
    expect(style.lineHeight).toBeGreaterThan(style.fontSize);
  });

  it("letterSpacing is 0 for bodyMedium", () => {
    expect(style.letterSpacing).toBe(0);
  });

  it("fontWeight is a string", () => {
    expect(typeof style.fontWeight).toBe("string");
    expect(style.fontWeight).toBe(String(typo.bodyMedium.fontWeight));
  });

  it("fontFamily is absent when not set", () => {
    expect(Object.prototype.hasOwnProperty.call(style, "fontFamily")).toBe(false);
  });
});

describe("resolveTextStyle — caption", () => {
  const style = resolveTextStyle(typo.caption);

  it("letterSpacing is a positive px value (tight tracking)", () => {
    expect(style.letterSpacing).toBeGreaterThan(0);
  });

  it("letterSpacing equals fontSize × letterSpacing_em", () => {
    const expected = Math.round(typo.caption.letterSpacing * typo.caption.fontSize * 1000) / 1000;
    expect(style.letterSpacing).toBe(expected);
  });
});

describe("resolveTextStyle — display", () => {
  const style = resolveTextStyle(typo.display);

  it("fontWeight is '700'", () => {
    expect(style.fontWeight).toBe("700");
  });

  it("lineHeight_px equals fontSize × lineHeight_ratio", () => {
    const expected = Math.round(typo.display.lineHeight * typo.display.fontSize * 100) / 100;
    expect(style.lineHeight).toBe(expected);
  });

  it("display has tight lineHeight ratio — lineHeight_px < fontSize × 1.5", () => {
    expect(style.lineHeight).toBeLessThan(style.fontSize * 1.5);
  });
});

describe("resolveTextStyle — fontWeight string conversion", () => {
  it("all 10 typography keys produce string fontWeights", () => {
    for (const [key, s] of Object.entries(typo) as [string, typeof typo.bodyMedium][]) {
      const resolved = resolveTextStyle(s);
      expect(typeof resolved.fontWeight, `${key}.fontWeight should be string`).toBe("string");
    }
  });

  it("allowed fontWeight values are '400', '500', '600', '700'", () => {
    const valid = new Set(["400", "500", "600", "700"]);
    for (const [key, s] of Object.entries(typo) as [string, typeof typo.bodyMedium][]) {
      const resolved = resolveTextStyle(s);
      expect(valid.has(resolved.fontWeight), `${key}.fontWeight "${resolved.fontWeight}" not in allowed set`).toBe(true);
    }
  });
});

describe("resolveTextStyle — fontFamily passthrough", () => {
  it("fontFamily is present when the style has one", () => {
    const styleWithFamily = resolveTextStyle({ ...typo.bodyMedium, fontFamily: "Inter" });
    expect(styleWithFamily.fontFamily).toBe("Inter");
  });

  it("fontFamily is absent when undefined — no bare 'fontFamily: undefined' key", () => {
    const style = resolveTextStyle({ ...typo.bodyMedium, fontFamily: undefined });
    expect(Object.prototype.hasOwnProperty.call(style, "fontFamily")).toBe(false);
  });
});

describe("resolveTextStyle — all tokens", () => {
  it("every typography key produces a valid RNTextStyle with no undefined values", () => {
    for (const [key, s] of Object.entries(typo) as [string, typeof typo.bodyMedium][]) {
      const resolved = resolveTextStyle(s);
      expect(resolved.fontSize,      `${key}.fontSize`).toBeTypeOf("number");
      expect(resolved.lineHeight,    `${key}.lineHeight`).toBeTypeOf("number");
      expect(resolved.fontWeight,    `${key}.fontWeight`).toBeTypeOf("string");
      expect(resolved.letterSpacing, `${key}.letterSpacing`).toBeTypeOf("number");
      expect(resolved.lineHeight,    `${key}.lineHeight > 0`).toBeGreaterThan(0);
    }
  });

  it("lineHeight is always greater than fontSize (all styles have ratio > 1)", () => {
    for (const [key, s] of Object.entries(typo) as [string, typeof typo.bodyMedium][]) {
      const resolved = resolveTextStyle(s);
      expect(resolved.lineHeight, `${key}: lineHeight should exceed fontSize`).toBeGreaterThan(resolved.fontSize);
    }
  });
});
