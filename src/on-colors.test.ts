import { describe, it, expect } from "vitest";
import { deriveOnColor, autoCorrectContrast, buildAccessibilityReport } from "./on-colors";
import { contrastRatio, relativeLuminance, hexToOklch } from "./color-math";
import { deriveColors, deriveSurfaceElevation } from "./butterfly";
import { expectValidHex } from "./test-helpers";

// ─── deriveOnColor ──────────────────────────────────────────────────

describe("deriveOnColor", () => {
  it("dark background returns a light on-color meeting WCAG AA", () => {
    const on = deriveOnColor("#000000");
    expect(contrastRatio(on, "#000000")).toBeGreaterThanOrEqual(4.5);
    expect(relativeLuminance(on)).toBeGreaterThan(0.1);
  });

  it("light background returns a dark on-color meeting WCAG AA", () => {
    const on = deriveOnColor("#ffffff");
    expect(contrastRatio(on, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(relativeLuminance(on)).toBeLessThan(0.5);
  });

  it("result always meets WCAG AA against input background", () => {
    const testColors = ["#000000", "#ffffff", "#808080", "#ff0000", "#00ff00", "#0000ff", "#1e90ff", "#ffd700"];
    for (const bg of testColors) {
      const on = deriveOnColor(bg);
      const ratio = contrastRatio(on, bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("works for mid-luminance backgrounds", () => {
    const on = deriveOnColor("#808080");
    expectValidHex(on);
    expect(contrastRatio(on, "#808080")).toBeGreaterThanOrEqual(4.5);
  });

  it("works for all light-mode intent colors", () => {
    const colors = deriveColors("#1e90ff", "light");
    const intents = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"] as const;
    for (const intent of intents) {
      const on = deriveOnColor(colors[intent]);
      expect(contrastRatio(on, colors[intent])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("works for all dark-mode intent colors", () => {
    const colors = deriveColors("#1e90ff", "dark");
    const intents = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"] as const;
    for (const intent of intents) {
      const on = deriveOnColor(colors[intent]);
      expect(contrastRatio(on, colors[intent])).toBeGreaterThanOrEqual(4.5);
    }
  });
});

// ─── autoCorrectContrast ────────────────────────────────────────────

describe("autoCorrectContrast", () => {
  it("returns foreground unchanged if already meets ratio", () => {
    const result = autoCorrectContrast("#000000", "#ffffff", 4.5);
    // Black on white already has 21:1 ratio
    expect(contrastRatio(result, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("dark background: lightens the foreground", () => {
    const result = autoCorrectContrast("#333333", "#111111", 4.5);
    const resultLch = hexToOklch(result);
    const originalLch = hexToOklch("#333333");
    expect(resultLch.L).toBeGreaterThanOrEqual(originalLch.L);
  });

  it("light background: darkens the foreground", () => {
    const result = autoCorrectContrast("#cccccc", "#eeeeee", 4.5);
    const resultLch = hexToOklch(result);
    const originalLch = hexToOklch("#cccccc");
    expect(resultLch.L).toBeLessThanOrEqual(originalLch.L);
  });

  it("result meets the specified minRatio", () => {
    const result = autoCorrectContrast("#808080", "#909090", 4.5);
    expect(contrastRatio(result, "#909090")).toBeGreaterThanOrEqual(4.5);
  });

  it("custom minRatio for AAA (7.0) is respected", () => {
    const result = autoCorrectContrast("#808080", "#ffffff", 7.0);
    expect(contrastRatio(result, "#ffffff")).toBeGreaterThanOrEqual(7.0);
  });

  it("falls back to pure white for very dark background", () => {
    // Very similar dark colors where walking up is the only option
    const result = autoCorrectContrast("#010101", "#020202", 4.5);
    expectValidHex(result);
    expect(contrastRatio(result, "#020202")).toBeGreaterThanOrEqual(4.5);
  });

  it("falls back to pure black for very light background", () => {
    const result = autoCorrectContrast("#fefefe", "#fdfdfd", 4.5);
    expectValidHex(result);
    expect(contrastRatio(result, "#fdfdfd")).toBeGreaterThanOrEqual(4.5);
  });

  it("handles achromatic backgrounds", () => {
    const result = autoCorrectContrast("#888888", "#999999", 4.5);
    expectValidHex(result);
    expect(contrastRatio(result, "#999999")).toBeGreaterThanOrEqual(4.5);
  });
});

// ─── buildAccessibilityReport ───────────────────────────────────────

describe("buildAccessibilityReport", () => {
  const lightColors = deriveColors("#1e90ff", "light");
  const surfaceElevation = deriveSurfaceElevation(lightColors.surface, lightColors.primary, "light");
  const report = buildAccessibilityReport(lightColors, surfaceElevation);

  const reportKeys = [
    "primaryOnBackground", "secondaryOnBackground", "tertiaryOnBackground", "quaternaryOnBackground",
    "textOnBackground", "textOnSurface", "mutedOnBackground",
    "dangerOnBackground", "successOnBackground",
    "warningOnBackground", "infoOnBackground",
    "onPrimaryOnPrimary", "onSecondaryOnSecondary", "onTertiaryOnTertiary", "onQuaternaryOnQuaternary",
    "onBackgroundOnBackground", "onSurfaceOnSurface",
    "onDangerOnDanger", "onSuccessOnSuccess",
    "onWarningOnWarning", "onInfoOnInfo",
    "textOnCard", "textOnElevated", "textOnModal", "textOnPopover",
  ];

  it("returns object with all 25 keys", () => {
    for (const key of reportKeys) {
      expect(report).toHaveProperty(key);
    }
  });

  it("each entry has numeric ratio and string level", () => {
    for (const key of reportKeys) {
      const entry = report[key as keyof typeof report];
      expect(typeof entry.ratio).toBe("number");
      expect(["AAA", "AA", "fail"]).toContain(entry.level);
    }
  });

  it("level is AAA when ratio >= 7, AA when >= 4.5, fail otherwise", () => {
    for (const key of reportKeys) {
      const entry = report[key as keyof typeof report];
      if (entry.ratio >= 7) {
        expect(entry.level).toBe("AAA");
      } else if (entry.ratio >= 4.5) {
        expect(entry.level).toBe("AA");
      } else {
        expect(entry.level).toBe("fail");
      }
    }
  });

  it("ratio values are rounded to 2 decimal places", () => {
    for (const key of reportKeys) {
      const entry = report[key as keyof typeof report];
      const rounded = Math.round(entry.ratio * 100) / 100;
      expect(entry.ratio).toBe(rounded);
    }
  });

  it("all on-color pairs meet at least AA", () => {
    const onPairs = [
      "onPrimaryOnPrimary", "onSecondaryOnSecondary", "onTertiaryOnTertiary", "onQuaternaryOnQuaternary",
      "onDangerOnDanger", "onSuccessOnSuccess",
      "onWarningOnWarning", "onInfoOnInfo",
    ];
    for (const key of onPairs) {
      const entry = report[key as keyof typeof report];
      expect(entry.ratio).toBeGreaterThanOrEqual(4.5);
      expect(["AAA", "AA"]).toContain(entry.level);
    }
  });
});
