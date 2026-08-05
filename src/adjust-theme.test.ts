import { describe, it, expect } from "vitest";
import { adjustTheme } from "./adjust-theme";
import type { ThemeOverrides } from "./adjust-theme";
import { generateTheme } from "./generate-theme";
import { contrastRatio } from "./color-math";
import { expectValidHex } from "./test-helpers";

const theme = generateTheme({ primary: "#1e90ff" });

// ─── Immutability ───────────────────────────────────────────────────

describe("adjustTheme - immutability", () => {
  it("does not mutate the input theme", () => {
    const original = JSON.parse(JSON.stringify(theme));
    adjustTheme(theme, { light: { colors: { primary: "#ff0000" } } });
    expect(theme).toEqual(original);
  });

  it("returns a new object reference", () => {
    const result = adjustTheme(theme, { light: { colors: { primary: "#ff0000" } } });
    expect(result).not.toBe(theme);
  });
});

// ─── Identity (no-op) ──────────────────────────────────────────────

describe("adjustTheme - identity", () => {
  it("empty overrides returns structurally equal theme", () => {
    const result = adjustTheme(theme, {});
    expect(result).toEqual(theme);
  });

  it("empty both + light + dark returns structurally equal theme", () => {
    const result = adjustTheme(theme, { light: {}, dark: {}, both: {} });
    expect(result).toEqual(theme);
  });

  it("no-op mode returns same object reference", () => {
    const result = adjustTheme(theme, { light: { colors: { primary: "#ff0000" } } });
    // Dark mode was not overridden, should be same ref
    expect(result.dark).toBe(theme.dark);
  });
});

// ─── Numeric scale partial merge ───────────────────────────────────

describe("adjustTheme - numeric scales", () => {
  it("partial spacing merge keeps unset keys", () => {
    const result = adjustTheme(theme, { tokens: { spacing: { md: 20 } } });
    expect(result.tokens.spacing.md).toBe(20);
    expect(result.tokens.spacing.xs).toBe(theme.tokens.spacing.xs);
    expect(result.tokens.spacing.lg).toBe(theme.tokens.spacing.lg);
  });

  it("partial radius merge keeps unset keys", () => {
    const result = adjustTheme(theme, { tokens: { radius: { pill: 100 } } });
    expect(result.tokens.radius.pill).toBe(100);
    expect(result.tokens.radius.sm).toBe(theme.tokens.radius.sm);
  });

  it("partial fontSizes merge keeps unset keys", () => {
    const result = adjustTheme(theme, { tokens: { fontSizes: { xl: 30 } } });
    expect(result.tokens.fontSizes.xl).toBe(30);
    expect(result.tokens.fontSizes.sm).toBe(theme.tokens.fontSizes.sm);
  });

  it("baseFont override is applied", () => {
    const result = adjustTheme(theme, { tokens: { baseFont: 12 } });
    expect(result.tokens.baseFont).toBe(12);
  });

  it("baseFont is clamped to >= 8", () => {
    const resultLow = adjustTheme(theme, { tokens: { baseFont: 5 as any } });
    expect(resultLow.tokens.baseFont).toBe(8);
  });
});

// ─── Color overrides + on-color re-derivation ──────────────────────

describe("adjustTheme - color overrides", () => {
  it("overriding primary changes onPrimary automatically", () => {
    const result = adjustTheme(theme, {
      light: { colors: { primary: "#ff0000" } },
    });
    expect(result.light.colors.primary).toBe("#ff0000");
    expect(result.light.colors.onPrimary).not.toBe(theme.light.colors.onPrimary);
    expectValidHex(result.light.colors.onPrimary);
  });

  it("re-derived onPrimary meets WCAG AA", () => {
    const result = adjustTheme(theme, {
      light: { colors: { primary: "#ff0000" } },
    });
    expect(contrastRatio(result.light.colors.onPrimary, "#ff0000")).toBeGreaterThanOrEqual(4.5);
  });

  it("explicit onPrimary override skips re-derivation", () => {
    const result = adjustTheme(theme, {
      light: { colors: { primary: "#ff0000", onPrimary: "#00ff00" } },
    });
    expect(result.light.colors.onPrimary).toBe("#00ff00");
  });

  it("changing secondary re-derives onSecondary", () => {
    const result = adjustTheme(theme, {
      dark: { colors: { secondary: "#abcdef" } },
    });
    expect(result.dark.colors.secondary).toBe("#abcdef");
    expect(result.dark.colors.onSecondary).not.toBe(theme.dark.colors.onSecondary);
  });

  it("all 8 base→on pairs re-derive correctly", () => {
    const bases = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"] as const;
    const onKeys = ["onPrimary", "onSecondary", "onTertiary", "onQuaternary", "onDanger", "onSuccess", "onWarning", "onInfo"] as const;
    for (let i = 0; i < bases.length; i++) {
      const result = adjustTheme(theme, {
        light: { colors: { [bases[i]]: "#ff0000" } },
      });
      expect(result.light.colors[onKeys[i]]).not.toBe(theme.light.colors[onKeys[i]]);
      expect(contrastRatio(result.light.colors[onKeys[i]], "#ff0000")).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("non-base color override does not change on-colors", () => {
    const result = adjustTheme(theme, {
      light: { colors: { background: "#eeeeee" } },
    });
    expect(result.light.colors.onPrimary).toBe(theme.light.colors.onPrimary);
  });
});

// ─── States regeneration ───────────────────────────────────────────

describe("adjustTheme - states regeneration", () => {
  it("changing an intent color triggers state regeneration", () => {
    const result = adjustTheme(theme, {
      light: { colors: { primary: "#ff0000" } },
    });
    expect(result.light.states.primary.hover).not.toBe(theme.light.states.primary.hover);
    expectValidHex(result.light.states.primary.hover);
  });

  it("changing background triggers state regeneration", () => {
    const result = adjustTheme(theme, {
      light: { colors: { background: "#222222" } },
    });
    // All states recalculated against new background
    expectValidHex(result.light.states.primary.hover);
    expectValidHex(result.light.states.danger.disabled);
  });

  it("explicit states override wins over regeneration", () => {
    const result = adjustTheme(theme, {
      light: {
        colors: { primary: "#ff0000" },
        states: { primary: { hover: "#cc0000" } },
      },
    });
    expect(result.light.states.primary.hover).toBe("#cc0000");
    // Other state keys are still regenerated
    expectValidHex(result.light.states.primary.pressed);
  });

  it("non-intent color change does not regenerate states", () => {
    const result = adjustTheme(theme, {
      light: { colors: { text: "#333333" } },
    });
    expect(result.light.states).toBe(theme.light.states);
  });

  it("states-only override (no color change) applies on existing states", () => {
    const result = adjustTheme(theme, {
      light: { states: { danger: { hover: "#ff1111" } } },
    });
    expect(result.light.states.danger.hover).toBe("#ff1111");
    // Other intents unchanged
    expect(result.light.states.primary).toEqual(theme.light.states.primary);
  });
});

// ─── Surface elevation regeneration ────────────────────────────────

describe("adjustTheme - surface elevation regeneration", () => {
  it("changing surface triggers elevation regeneration", () => {
    const result = adjustTheme(theme, {
      dark: { colors: { surface: "#333333" } },
    });
    expect(result.dark.surfaceElevation.card).not.toBe(theme.dark.surfaceElevation.card);
    expectValidHex(result.dark.surfaceElevation.card);
  });

  it("changing primary triggers elevation regeneration", () => {
    const result = adjustTheme(theme, {
      dark: { colors: { primary: "#ff0000" } },
    });
    expectValidHex(result.dark.surfaceElevation.card);
  });

  it("explicit surfaceElevation override merges on top of regenerated values", () => {
    const result = adjustTheme(theme, {
      dark: {
        colors: { surface: "#333333" },
        surfaceElevation: { modal: "#555555" },
      },
    });
    expect(result.dark.surfaceElevation.modal).toBe("#555555");
    expectValidHex(result.dark.surfaceElevation.card);
  });

  it("non-surface/primary color change does not regenerate elevation", () => {
    const result = adjustTheme(theme, {
      dark: { colors: { danger: "#ff0000" } },
    });
    expect(result.dark.surfaceElevation).toBe(theme.dark.surfaceElevation);
  });
});

// ─── Accessibility regeneration ────────────────────────────────────

describe("adjustTheme - accessibility regeneration", () => {
  it("any color change triggers accessibility regeneration", () => {
    const result = adjustTheme(theme, {
      light: { colors: { primary: "#ff0000" } },
    });
    // Accessibility should be recalculated
    expect(result.light.accessibility).not.toBe(theme.light.accessibility);
    expect(typeof result.light.accessibility.primaryOnBackground.ratio).toBe("number");
    expect(["AAA", "AA", "fail"]).toContain(result.light.accessibility.primaryOnBackground.level);
  });

  it("no color change does not regenerate accessibility", () => {
    const result = adjustTheme(theme, {
      tokens: { spacing: { md: 20 } },
    });
    expect(result.light.accessibility).toBe(theme.light.accessibility);
  });
});

// ─── both + mode-specific merge precedence ─────────────────────────

describe("adjustTheme - both + mode-specific merge", () => {
  it("both overrides apply to both modes", () => {
    const result = adjustTheme(theme, {
      tokens: { spacing: { md: 99 } },
    });
    expect(result.tokens.spacing.md).toBe(99);
  });

  it("both + mode-specific combine non-overlapping keys", () => {
    const result = adjustTheme(theme, {
      tokens: { spacing: { md: 99 }, radius: { pill: 100 } },
    });
    expect(result.tokens.spacing.md).toBe(99);
    expect(result.tokens.radius.pill).toBe(100);
  });

  it("mode-specific colors win over both colors", () => {
    const result = adjustTheme(theme, {
      both: { colors: { primary: "#ff0000" } },
      dark: { colors: { primary: "#00ff00" } },
    });
    expect(result.light.colors.primary).toBe("#ff0000");
    expect(result.dark.colors.primary).toBe("#00ff00");
  });

  it("both states + mode-specific states merge at intent level", () => {
    const result = adjustTheme(theme, {
      both: { states: { primary: { hover: "#aaaaaa" } } },
      light: { states: { primary: { hover: "#bbbbbb" } } },
    });
    expect(result.light.states.primary.hover).toBe("#bbbbbb");
    expect(result.dark.states.primary.hover).toBe("#aaaaaa");
  });
});

// ─── Full round-trip ───────────────────────────────────────────────

describe("adjustTheme - round-trip", () => {
  it("adjust then compare shows the expected change", () => {
    const overrides: ThemeOverrides = {
      both: { colors: { primary: "#ff0000" } },
    };
    const adjusted = adjustTheme(theme, overrides);
    expect(adjusted.light.colors.primary).toBe("#ff0000");
    expect(adjusted.dark.colors.primary).toBe("#ff0000");
    // Secondary should remain unchanged
    expect(adjusted.light.colors.secondary).toBe(theme.light.colors.secondary);
    expect(adjusted.dark.colors.secondary).toBe(theme.dark.colors.secondary);
  });

  it("adjusting with all scale overrides produces valid theme", () => {
    const result = adjustTheme(theme, {
      both: { colors: { primary: "#ff0000", background: "#fafafa" } },
      tokens: {
        spacing: { none: 0, xs: 2, sm: 4, md: 8, lg: 16, xl: 32, xxl: 64 },
        radius: { none: 0, sm: 2, md: 4, lg: 8, xl: 16, xxl: 24, pill: 9999 },
        fontSizes: { xs: 10, sm: 12, md: 14, lg: 18, xl: 24, xxl: 32, "3xl": 48 },
        baseFont: 14,
      },
    });
    expect(result.light.colors.primary).toBe("#ff0000");
    expect(result.tokens.spacing.md).toBe(8);
    expect(result.tokens.radius.pill).toBe(9999);
    expect(result.tokens.fontSizes["3xl"]).toBe(48);
    expect(result.tokens.baseFont).toBe(14);
    expectValidHex(result.light.colors.onPrimary);
    expect(contrastRatio(result.light.colors.onPrimary, "#ff0000")).toBeGreaterThanOrEqual(4.5);
  });
});

// ─── oklch color input ──────────────────────────────────────────────

describe("adjustTheme - oklch color input", () => {
  it("accepts oklch() string as primary override and stores hex", () => {
    const result = adjustTheme(theme, {
      light: { colors: { primary: "oklch(0.52 0.20 218)" } },
    });
    expect(result.light.colors.primary).toMatch(/^#[0-9a-f]{6}$/);
    expect(result.light.colors.primary).not.toContain("NaN");
  });

  it("derives valid WCAG-AA on-color when oklch primary is overridden", () => {
    const result = adjustTheme(theme, {
      light: { colors: { primary: "oklch(0.52 0.20 218)" } },
    });
    expectValidHex(result.light.colors.onPrimary);
    expect(
      contrastRatio(result.light.colors.onPrimary, result.light.colors.primary)
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("accepts oklch() in dark mode override", () => {
    const result = adjustTheme(theme, {
      dark: { colors: { primary: "oklch(0.68 0.20 218)" } },
    });
    expect(result.dark.colors.primary).toMatch(/^#[0-9a-f]{6}$/);
    expect(result.dark.colors.primary).not.toContain("NaN");
  });

  it("accepts oklch() via both key", () => {
    const result = adjustTheme(theme, {
      both: { colors: { danger: "oklch(0.55 0.22 25)" } },
    });
    expect(result.light.colors.danger).toMatch(/^#[0-9a-f]{6}$/);
    expect(result.dark.colors.danger).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("does not mutate base theme when oklch override is applied", () => {
    const original = JSON.parse(JSON.stringify(theme));
    adjustTheme(theme, { light: { colors: { primary: "oklch(0.52 0.20 218)" } } });
    expect(theme).toEqual(original);
  });

  it("regenerates accessibility report after oklch primary override", () => {
    const result = adjustTheme(theme, {
      light: { colors: { primary: "oklch(0.52 0.20 218)" } },
    });
    expect(result.light.accessibility.primaryOnBackground.ratio).toBeGreaterThan(0);
    expect(result.light.accessibility.primaryOnBackground.level).not.toBe("fail");
  });
});
