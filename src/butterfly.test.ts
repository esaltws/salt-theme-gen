import { describe, it, expect } from "vitest";
import { deriveColors, deriveSurfaceElevation, adaptiveL, secondaryHueOffset, resolveHarmonyAccents } from "./butterfly";
import { hexToOklch, contrastRatio } from "./color-math";
import { expectValidHex } from "./test-helpers";

const PRIMARY = "#1e90ff"; // dodger blue

// ─── deriveColors — light mode ──────────────────────────────────────

describe("deriveColors - light mode", () => {
  const colors = deriveColors(PRIMARY, "light");

  it("returns object with all 23 SemanticColors keys", () => {
    const expectedKeys = [
      "primary", "secondary", "tertiary", "quaternary", "background", "surface", "text",
      "muted", "border", "danger", "success", "warning", "info",
      "onPrimary", "onSecondary", "onTertiary", "onQuaternary",
      "onBackground", "onSurface",
      "onDanger", "onSuccess", "onWarning", "onInfo",
    ];
    for (const key of expectedKeys) {
      expect(colors).toHaveProperty(key);
    }
  });

  it("all 23 values are valid hex strings", () => {
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });

  it("primary L is hue-adaptive around 0.55 (may be lowered by WCAG auto-correction)", () => {
    const lch = hexToOklch(colors.primary);
    const primaryH = hexToOklch(PRIMARY).H;
    // Auto-correction may darken the primary to meet 4.5:1 against background,
    // so L should be <= the adaptive target
    expect(lch.L).toBeLessThanOrEqual(adaptiveL(0.55, primaryH) + 0.01);
    expect(lch.L).toBeGreaterThan(0.3);
  });

  it("secondary hue uses hue-aware offset from primary", () => {
    const primaryLch = hexToOklch(colors.primary);
    const secondaryLch = hexToOklch(colors.secondary);
    const expectedH = (primaryLch.H + secondaryHueOffset(primaryLch.H)) % 360;
    expect(secondaryLch.H).toBeCloseTo(expectedH, 0);
  });

  it("secondary chroma is approximately primaryC * 0.85", () => {
    const primaryLch = hexToOklch(PRIMARY);
    const secondaryLch = hexToOklch(colors.secondary);
    expect(secondaryLch.C).toBeCloseTo(primaryLch.C * 0.85, 1);
  });

  it("tertiary hue uses 2x secondary offset from primary", () => {
    const primaryLch = hexToOklch(colors.primary);
    const tertiaryLch = hexToOklch(colors.tertiary);
    const expectedH = (primaryLch.H + 2 * secondaryHueOffset(primaryLch.H)) % 360;
    expect(Math.abs(tertiaryLch.H - expectedH)).toBeLessThan(1.5);
  });

  it("tertiary chroma is approximately primaryC * 0.75", () => {
    const primaryLch = hexToOklch(PRIMARY);
    const tertiaryLch = hexToOklch(colors.tertiary);
    expect(tertiaryLch.C).toBeCloseTo(primaryLch.C * 0.75, 1);
  });

  it("background has L approximately 0.97", () => {
    const lch = hexToOklch(colors.background);
    expect(lch.L).toBeCloseTo(0.97, 1);
  });

  it("surface is near pure white (L ~ 1.0)", () => {
    const lch = hexToOklch(colors.surface);
    expect(lch.L).toBeCloseTo(1.0, 1);
  });

  it("text has L approximately 0.13 (near black)", () => {
    const lch = hexToOklch(colors.text);
    expect(lch.L).toBeCloseTo(0.13, 1);
  });

  it("danger hue is approximately 25", () => {
    const lch = hexToOklch(colors.danger);
    expect(lch.H).toBeCloseTo(25, 0);
  });

  it("success hue is approximately 145", () => {
    const lch = hexToOklch(colors.success);
    expect(lch.H).toBeCloseTo(145, 0);
  });

  it("warning hue is approximately 80", () => {
    const lch = hexToOklch(colors.warning);
    expect(Math.abs(lch.H - 80)).toBeLessThan(1.5);
  });

  it("info hue is approximately 235", () => {
    const lch = hexToOklch(colors.info);
    expect(Math.abs(lch.H - 235)).toBeLessThan(1.5);
  });
});

// ─── deriveColors — dark mode ───────────────────────────────────────

describe("deriveColors - dark mode", () => {
  const colors = deriveColors(PRIMARY, "dark");

  it("primary L is hue-adaptive around 0.72", () => {
    const lch = hexToOklch(colors.primary);
    const primaryH = hexToOklch(PRIMARY).H;
    expect(lch.L).toBeCloseTo(adaptiveL(0.72, primaryH, 0.04), 1);
  });

  it("secondary L is hue-adaptive around 0.74", () => {
    const lch = hexToOklch(colors.secondary);
    const primaryH = hexToOklch(PRIMARY).H;
    expect(lch.L).toBeCloseTo(adaptiveL(0.74, primaryH + 60, 0.04), 1);
  });

  it("background has L approximately 0.15 (dark)", () => {
    const lch = hexToOklch(colors.background);
    expect(lch.L).toBeCloseTo(0.15, 1);
  });

  it("surface has L approximately 0.20", () => {
    const lch = hexToOklch(colors.surface);
    expect(lch.L).toBeCloseTo(0.20, 1);
  });

  it("text has L approximately 0.97 (near white)", () => {
    const lch = hexToOklch(colors.text);
    expect(lch.L).toBeCloseTo(0.97, 1);
  });

  it("dark mode background is darker than light mode background", () => {
    const lightColors = deriveColors(PRIMARY, "light");
    const darkBgL = hexToOklch(colors.background).L;
    const lightBgL = hexToOklch(lightColors.background).L;
    expect(darkBgL).toBeLessThan(lightBgL);
  });

  it("dark mode text is lighter than light mode text", () => {
    const lightColors = deriveColors(PRIMARY, "light");
    const darkTextL = hexToOklch(colors.text).L;
    const lightTextL = hexToOklch(lightColors.text).L;
    expect(darkTextL).toBeGreaterThan(lightTextL);
  });

  it("all values are valid hex strings", () => {
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });

  it("same primary produces different outputs for light vs dark", () => {
    const lightColors = deriveColors(PRIMARY, "light");
    expect(colors.primary).not.toBe(lightColors.primary);
    expect(colors.background).not.toBe(lightColors.background);
  });
});

// ─── deriveColors — secondary override ──────────────────────────────

describe("deriveColors - secondary override", () => {
  it("secondary matches override when provided", () => {
    const colors = deriveColors(PRIMARY, "light", "#ff00ff");
    expect(colors.secondary).toBe("#ff00ff");
  });

  it("other colors are unaffected by secondary override", () => {
    const withOverride = deriveColors(PRIMARY, "light", "#ff00ff");
    const without = deriveColors(PRIMARY, "light");
    expect(withOverride.primary).toBe(without.primary);
    expect(withOverride.background).toBe(without.background);
    expect(withOverride.danger).toBe(without.danger);
  });

  it("onSecondary is derived from the overridden color", () => {
    const colors = deriveColors(PRIMARY, "light", "#ff00ff");
    // onSecondary should be a valid hex derived from the override, not the auto-secondary
    expectValidHex(colors.onSecondary);
    // Verify it's different from what we'd get without override
    const noOverride = deriveColors(PRIMARY, "light");
    expect(colors.onSecondary).not.toBe(noOverride.onSecondary);
  });

  it("works in dark mode with override", () => {
    const colors = deriveColors(PRIMARY, "dark", "#00ff00");
    expect(colors.secondary).toBe("#00ff00");
    expectValidHex(colors.onSecondary);
  });
});

// ─── deriveColors — tertiary override ────────────────────────────────

describe("deriveColors - tertiary override", () => {
  it("tertiary matches override when provided", () => {
    const colors = deriveColors(PRIMARY, "light", undefined, "#ff8800");
    expect(colors.tertiary).toBe("#ff8800");
  });

  it("other colors are unaffected by tertiary override", () => {
    const withOverride = deriveColors(PRIMARY, "light", undefined, "#ff8800");
    const without = deriveColors(PRIMARY, "light");
    expect(withOverride.primary).toBe(without.primary);
    expect(withOverride.secondary).toBe(without.secondary);
    expect(withOverride.background).toBe(without.background);
  });

  it("onTertiary is derived from the overridden color", () => {
    const colors = deriveColors(PRIMARY, "light", undefined, "#ff8800");
    expectValidHex(colors.onTertiary);
    const noOverride = deriveColors(PRIMARY, "light");
    expect(colors.onTertiary).not.toBe(noOverride.onTertiary);
  });

  it("works in dark mode with override", () => {
    const colors = deriveColors(PRIMARY, "dark", undefined, "#00ff00");
    expect(colors.tertiary).toBe("#00ff00");
    expectValidHex(colors.onTertiary);
  });
});

// ─── deriveColors — intent colors auto-corrected on background ──────

describe("deriveColors - intent colors meet WCAG AA on background", () => {
  const intents = ["danger", "success", "warning", "info"] as const;

  it("light mode: all intent colors meet 4.5:1 against background", () => {
    const colors = deriveColors(PRIMARY, "light");
    for (const intent of intents) {
      const ratio = contrastRatio(colors[intent], colors.background);
      expect(ratio, `${intent} on background`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("dark mode: all intent colors meet 4.5:1 against background", () => {
    const colors = deriveColors(PRIMARY, "dark");
    for (const intent of intents) {
      const ratio = contrastRatio(colors[intent], colors.background);
      expect(ratio, `${intent} on background`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("achromatic primary: intent colors still meet 4.5:1", () => {
    const colors = deriveColors("#808080", "light");
    for (const intent of intents) {
      const ratio = contrastRatio(colors[intent], colors.background);
      expect(ratio, `${intent} on background`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("intent hues are preserved after auto-correction (within 1.5°)", () => {
    const colors = deriveColors(PRIMARY, "light");
    const expectedHues = { danger: 25, success: 145, warning: 80, info: 235 };
    for (const intent of intents) {
      const lch = hexToOklch(colors[intent]);
      expect(Math.abs(lch.H - expectedHues[intent]), `${intent} hue`).toBeLessThan(1.5);
    }
  });
});

// ─── deriveColors — edge cases ──────────────────────────────────────

describe("deriveColors - edge cases", () => {
  it("achromatic primary (gray) produces valid colors", () => {
    const colors = deriveColors("#808080", "light");
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });

  it("very dark primary produces valid colors", () => {
    const colors = deriveColors("#111111", "light");
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });

  it("very light primary produces valid colors", () => {
    const colors = deriveColors("#eeeeee", "light");
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });

  it("high-chroma primary produces valid colors", () => {
    const colors = deriveColors("#ff0000", "light");
    for (const value of Object.values(colors)) {
      expectValidHex(value);
    }
  });
});

// ─── deriveSurfaceElevation ─────────────────────────────────────────

describe("deriveSurfaceElevation", () => {
  const lightColors = deriveColors(PRIMARY, "light");
  const darkColors = deriveColors(PRIMARY, "dark");
  const lightElevation = deriveSurfaceElevation(lightColors.surface, lightColors.primary, "light");
  const darkElevation = deriveSurfaceElevation(darkColors.surface, darkColors.primary, "dark");
  const keys = ["card", "elevated", "modal", "popover"] as const;

  it("returns all 4 elevation keys", () => {
    for (const key of keys) {
      expect(lightElevation).toHaveProperty(key);
      expect(darkElevation).toHaveProperty(key);
    }
  });

  it("all values are valid hex", () => {
    for (const key of keys) {
      expectValidHex(lightElevation[key]);
      expectValidHex(darkElevation[key]);
    }
  });

  it("dark mode: each level is progressively lighter", () => {
    const l = keys.map((k) => hexToOklch(darkElevation[k]).L);
    for (let i = 1; i < l.length; i++) {
      expect(l[i]).toBeGreaterThan(l[i - 1]);
    }
  });

  it("dark mode: all levels are lighter than base surface", () => {
    const surfaceL = hexToOklch(darkColors.surface).L;
    for (const key of keys) {
      expect(hexToOklch(darkElevation[key]).L).toBeGreaterThan(surfaceL);
    }
  });

  it("light mode: all levels differ from base surface", () => {
    for (const key of keys) {
      expect(lightElevation[key]).not.toBe(lightColors.surface);
    }
  });

  it("light mode: higher levels have more primary tint (higher chroma)", () => {
    const c = keys.map((k) => hexToOklch(lightElevation[k]).C);
    for (let i = 1; i < c.length; i++) {
      expect(c[i]).toBeGreaterThanOrEqual(c[i - 1]);
    }
  });

  it("works with achromatic primary", () => {
    const colors = deriveColors("#808080", "dark");
    const elev = deriveSurfaceElevation(colors.surface, colors.primary, "dark");
    for (const key of keys) {
      expectValidHex(elev[key]);
    }
  });
});

// ─── adaptiveL ──────────────────────────────────────────────────────

describe("adaptiveL", () => {
  it("yellow (H≈90) gets lower L than base", () => {
    expect(adaptiveL(0.55, 90)).toBeLessThan(0.55);
  });

  it("blue (H≈270) gets higher L than base", () => {
    expect(adaptiveL(0.55, 270)).toBeGreaterThan(0.55);
  });

  it("red (H≈0) and cyan (H≈180) stay near base", () => {
    expect(adaptiveL(0.55, 0)).toBeCloseTo(0.55, 2);
    expect(adaptiveL(0.55, 180)).toBeCloseTo(0.55, 2);
  });

  it("never exceeds [0, 1]", () => {
    for (let h = 0; h < 360; h += 10) {
      const l = adaptiveL(0.55, h);
      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThanOrEqual(1);
    }
  });

  it("custom amplitude controls range", () => {
    const small = adaptiveL(0.55, 90, 0.02);
    const large = adaptiveL(0.55, 90, 0.08);
    expect(Math.abs(0.55 - small)).toBeLessThan(Math.abs(0.55 - large));
  });

  it("yellow primary is visually darker than blue primary in light mode", () => {
    const yellow = deriveColors("#ffd700", "light");
    const blue = deriveColors("#0000ff", "light");
    const yellowL = hexToOklch(yellow.primary).L;
    const blueL = hexToOklch(blue.primary).L;
    expect(yellowL).toBeLessThan(blueL);
  });
});

// ─── secondaryHueOffset ─────────────────────────────────────────────

describe("secondaryHueOffset", () => {
  it("red (H≈0) gets large offset (~120°)", () => {
    expect(secondaryHueOffset(0)).toBeCloseTo(120, 0);
  });

  it("cyan (H≈180) gets small offset (~60°)", () => {
    expect(secondaryHueOffset(180)).toBeCloseTo(60, 0);
  });

  it("purple (H≈270) gets medium offset (~90°)", () => {
    expect(secondaryHueOffset(270)).toBeCloseTo(90, 0);
  });

  it("always returns between 60 and 120", () => {
    for (let h = 0; h < 360; h += 5) {
      const offset = secondaryHueOffset(h);
      expect(offset).toBeGreaterThanOrEqual(60);
      expect(offset).toBeLessThanOrEqual(120);
    }
  });

  it("red primary secondary is NOT orange — at least 90° apart", () => {
    const red = deriveColors("#ff0000", "light");
    const primaryH = hexToOklch(red.primary).H;
    const secondaryH = hexToOklch(red.secondary).H;
    let diff = Math.abs(secondaryH - primaryH);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeGreaterThanOrEqual(90);
  });
});

// ─── deriveColors — quaternary (analogous default) ──────────────────

describe("deriveColors - quaternary (analogous)", () => {
  const colors = deriveColors("#1e90ff", "light");

  it("quaternary is a valid hex", () => {
    expectValidHex(colors.quaternary);
  });

  it("onQuaternary is a valid hex", () => {
    expectValidHex(colors.onQuaternary);
  });

  it("onQuaternary meets WCAG AA against quaternary", () => {
    expect(contrastRatio(colors.onQuaternary, colors.quaternary)).toBeGreaterThanOrEqual(4.5);
  });

  it("quaternary hue differs from primary", () => {
    const pH = hexToOklch(colors.primary).H;
    const qH = hexToOklch(colors.quaternary).H;
    let diff = Math.abs(qH - pH);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeGreaterThan(10);
  });

  it("quaternary override is respected", () => {
    const c = deriveColors("#1e90ff", "light", { quaternary: "#abcdef" });
    expect(c.quaternary).toBe("#abcdef");
  });
});

// ─── deriveColors — harmony modes ───────────────────────────────────

describe("deriveColors - harmony modes", () => {
  const harmonies = ["complementary", "triadic", "split-complementary", "tetradic", "monochromatic"] as const;

  for (const harmony of harmonies) {
    describe(`harmony: ${harmony}`, () => {
      const colors = deriveColors("#1e90ff", "light", { harmony });

      it("returns all 23 valid hex colors", () => {
        const values = Object.values(colors);
        expect(values).toHaveLength(23);
        for (const v of values) {
          expectValidHex(v);
        }
      });

      it("onQuaternary meets WCAG AA against quaternary", () => {
        expect(contrastRatio(colors.onQuaternary, colors.quaternary)).toBeGreaterThanOrEqual(4.5);
      });

      it("non-accent colors are unchanged vs analogous", () => {
        const analogous = deriveColors("#1e90ff", "light");
        expect(colors.background).toBe(analogous.background);
        expect(colors.surface).toBe(analogous.surface);
        expect(colors.text).toBe(analogous.text);
        expect(colors.danger).toBe(analogous.danger);
      });

      it("works in dark mode", () => {
        const dark = deriveColors("#1e90ff", "dark", { harmony });
        for (const v of Object.values(dark)) {
          expectValidHex(v);
        }
      });
    });
  }

  it("complementary secondary is ~180° from primary", () => {
    const colors = deriveColors("#1e90ff", "light", { harmony: "complementary" });
    const pH = hexToOklch(colors.primary).H;
    const sH = hexToOklch(colors.secondary).H;
    let diff = Math.abs(sH - pH);
    if (diff > 180) diff = 360 - diff;
    expect(diff).toBeCloseTo(180, -1);
  });

  it("triadic secondary and tertiary are ~120° apart from primary", () => {
    const colors = deriveColors("#1e90ff", "light", { harmony: "triadic" });
    const pH = hexToOklch(colors.primary).H;
    const sH = hexToOklch(colors.secondary).H;
    const tH = hexToOklch(colors.tertiary).H;
    let sDiff = Math.abs(sH - pH); if (sDiff > 180) sDiff = 360 - sDiff;
    let tDiff = Math.abs(tH - pH); if (tDiff > 180) tDiff = 360 - tDiff;
    expect(sDiff).toBeCloseTo(120, -1);
    expect(tDiff).toBeCloseTo(120, -1);
  });

  it("tetradic produces 4 distinct hues ~90° apart", () => {
    const colors = deriveColors("#1e90ff", "light", { harmony: "tetradic" });
    const hues = [colors.primary, colors.secondary, colors.tertiary, colors.quaternary].map(c => hexToOklch(c).H);
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        let diff = Math.abs(hues[i] - hues[j]);
        if (diff > 180) diff = 360 - diff;
        expect(diff).toBeGreaterThan(45);
      }
    }
  });

  it("monochromatic: all accents share primary hue (within 5°)", () => {
    const colors = deriveColors("#1e90ff", "light", { harmony: "monochromatic" });
    const pH = hexToOklch(colors.primary).H;
    for (const key of ["secondary", "tertiary", "quaternary"] as const) {
      const h = hexToOklch(colors[key]).H;
      let diff = Math.abs(h - pH);
      if (diff > 180) diff = 360 - diff;
      expect(diff).toBeLessThan(5);
    }
  });

  it("monochromatic: chroma decreases from secondary to quaternary", () => {
    const colors = deriveColors("#1e90ff", "light", { harmony: "monochromatic" });
    const sC = hexToOklch(colors.secondary).C;
    const tC = hexToOklch(colors.tertiary).C;
    const qC = hexToOklch(colors.quaternary).C;
    expect(sC).toBeGreaterThan(tC);
    expect(tC).toBeGreaterThan(qC);
  });
});

// ─── deriveColors — backward compatibility ──────────────────────────

describe("deriveColors - backward compatibility", () => {
  it("legacy positional API still works", () => {
    const colors = deriveColors("#1e90ff", "light", "#ff00ff");
    expect(colors.secondary).toBe("#ff00ff");
  });

  it("legacy positional API with tertiary still works", () => {
    const colors = deriveColors("#1e90ff", "light", "#ff00ff", "#00ff00");
    expect(colors.secondary).toBe("#ff00ff");
    expect(colors.tertiary).toBe("#00ff00");
  });

  it("analogous harmony produces same secondary/tertiary as no-harmony", () => {
    const noHarmony = deriveColors("#1e90ff", "light");
    const analogous = deriveColors("#1e90ff", "light", { harmony: "analogous" });
    expect(analogous.secondary).toBe(noHarmony.secondary);
    expect(analogous.tertiary).toBe(noHarmony.tertiary);
  });

  it("default (no options) produces same secondary/tertiary as before", () => {
    const noOpts = deriveColors("#1e90ff", "light");
    const emptyOpts = deriveColors("#1e90ff", "light", {});
    expect(noOpts.secondary).toBe(emptyOpts.secondary);
    expect(noOpts.tertiary).toBe(emptyOpts.tertiary);
  });
});

// ─── resolveHarmonyAccents ──────────────────────────────────────────

describe("resolveHarmonyAccents", () => {
  it("returns null for analogous", () => {
    expect(resolveHarmonyAccents(200, "analogous")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(resolveHarmonyAccents(200, undefined)).toBeNull();
  });

  it("complementary secondary offset is 180", () => {
    const accents = resolveHarmonyAccents(200, "complementary")!;
    expect(accents.secondary.hueOffset).toBe(180);
  });

  it("triadic offsets are 120 and 240", () => {
    const accents = resolveHarmonyAccents(200, "triadic")!;
    expect(accents.secondary.hueOffset).toBe(120);
    expect(accents.tertiary.hueOffset).toBe(240);
  });

  it("tetradic covers all 4 quadrants", () => {
    const accents = resolveHarmonyAccents(0, "tetradic")!;
    expect(accents.secondary.hueOffset).toBe(90);
    expect(accents.tertiary.hueOffset).toBe(180);
    expect(accents.quaternary.hueOffset).toBe(270);
  });

  it("monochromatic has zero hue offsets, decreasing chroma", () => {
    const accents = resolveHarmonyAccents(100, "monochromatic")!;
    expect(accents.secondary.hueOffset).toBe(0);
    expect(accents.tertiary.hueOffset).toBe(0);
    expect(accents.quaternary.hueOffset).toBe(0);
    expect(accents.secondary.chromaMul).toBeGreaterThan(accents.tertiary.chromaMul);
    expect(accents.tertiary.chromaMul).toBeGreaterThan(accents.quaternary.chromaMul);
  });

  it("split-complementary offsets are 150 and 210", () => {
    const accents = resolveHarmonyAccents(0, "split-complementary")!;
    expect(accents.secondary.hueOffset).toBe(150);
    expect(accents.tertiary.hueOffset).toBe(210);
  });
});
