import { describe, it, expect } from "vitest";
import { diffTheme } from "./diff-theme";
import { adjustTheme } from "./adjust-theme";
import { generateTheme } from "./generate-theme";

const theme = generateTheme({ primary: "#1e90ff" });

// ─── Identical themes ──────────────────────────────────────────────

describe("diffTheme - identical", () => {
  it("identical themes return { identical: true }", () => {
    const diff = diffTheme(theme, theme);
    expect(diff.identical).toBe(true);
  });

  it("identical themes have empty mode diffs", () => {
    const diff = diffTheme(theme, theme);
    expect(Object.keys(diff.light)).toHaveLength(0);
    expect(Object.keys(diff.dark)).toHaveLength(0);
  });

  it("structurally equal (different refs) still identical", () => {
    const clone = JSON.parse(JSON.stringify(theme));
    const diff = diffTheme(theme, clone);
    expect(diff.identical).toBe(true);
  });
});

// ─── Single color change ───────────────────────────────────────────

describe("diffTheme - single color change", () => {
  it("detects primary color change in light mode", () => {
    const adjusted = adjustTheme(theme, { light: { colors: { primary: "#ff0000" } } });
    const diff = diffTheme(theme, adjusted);
    expect(diff.identical).toBe(false);
    expect(diff.light.colors?.primary).toEqual({
      old: theme.light.colors.primary,
      new: "#ff0000",
    });
  });

  it("dark mode unchanged when only light was adjusted", () => {
    const adjusted = adjustTheme(theme, { light: { colors: { primary: "#ff0000" } } });
    const diff = diffTheme(theme, adjusted);
    // Dark mode's colors should have no primary diff
    expect(diff.dark.colors?.primary).toBeUndefined();
  });

  it("on-color change is also captured in the diff", () => {
    const adjusted = adjustTheme(theme, { light: { colors: { primary: "#ff0000" } } });
    const diff = diffTheme(theme, adjusted);
    // onPrimary was re-derived, so it should appear in diff
    expect(diff.light.colors?.onPrimary).toBeDefined();
    expect(diff.light.colors?.onPrimary?.old).toBe(theme.light.colors.onPrimary);
    expect(diff.light.colors?.onPrimary?.new).toBe(adjusted.light.colors.onPrimary);
  });

  it("unchanged colors are absent from diff", () => {
    const adjusted = adjustTheme(theme, { light: { colors: { primary: "#ff0000" } } });
    const diff = diffTheme(theme, adjusted);
    expect(diff.light.colors?.secondary).toBeUndefined();
    expect(diff.light.colors?.background).toBeUndefined();
  });
});

// ─── Numeric scale changes ─────────────────────────────────────────

describe("diffTheme - numeric scales", () => {
  it("detects spacing change", () => {
    const adjusted = adjustTheme(theme, { tokens: { spacing: { md: 99 } } });
    const diff = diffTheme(theme, adjusted);
    expect(diff.tokens.spacing?.md).toEqual({
      old: theme.tokens.spacing.md,
      new: 99,
    });
  });

  it("detects radius change", () => {
    const adjusted = adjustTheme(theme, { tokens: { radius: { pill: 100 } } });
    const diff = diffTheme(theme, adjusted);
    expect(diff.tokens.radius?.pill).toEqual({
      old: theme.tokens.radius.pill,
      new: 100,
    });
  });

  it("detects fontSizes change", () => {
    const adjusted = adjustTheme(theme, { tokens: { fontSizes: { xl: 30 } } });
    const diff = diffTheme(theme, adjusted);
    expect(diff.tokens.fontSizes?.xl).toEqual({
      old: theme.tokens.fontSizes.xl,
      new: 30,
    });
  });

  it("detects baseFont change", () => {
    const adjusted = adjustTheme(theme, { tokens: { baseFont: 12 } });
    const diff = diffTheme(theme, adjusted);
    expect(diff.tokens.baseFont).toEqual({
      old: theme.tokens.baseFont,
      new: 12,
    });
  });

  it("unchanged scales are absent from diff", () => {
    const adjusted = adjustTheme(theme, { tokens: { spacing: { md: 99 } } });
    const diff = diffTheme(theme, adjusted);
    expect(diff.tokens.radius).toBeUndefined();
    expect(diff.tokens.fontSizes).toBeUndefined();
  });
});

// ─── State diffs ───────────────────────────────────────────────────

describe("diffTheme - states", () => {
  it("detects state changes when intent color changed", () => {
    const adjusted = adjustTheme(theme, { light: { colors: { primary: "#ff0000" } } });
    const diff = diffTheme(theme, adjusted);
    expect(diff.light.states).toBeDefined();
    expect(diff.light.states?.primary).toBeDefined();
    expect(diff.light.states?.primary?.hover).toBeDefined();
  });

  it("state diff has old/new structure", () => {
    const adjusted = adjustTheme(theme, { light: { colors: { primary: "#ff0000" } } });
    const diff = diffTheme(theme, adjusted);
    const hoverDiff = diff.light.states?.primary?.hover;
    expect(hoverDiff?.old).toBe(theme.light.states.primary.hover);
    expect(hoverDiff?.new).toBe(adjusted.light.states.primary.hover);
  });

  it("explicit state override shows in diff", () => {
    const adjusted = adjustTheme(theme, {
      light: { states: { danger: { hover: "#ff1111" } } },
    });
    const diff = diffTheme(theme, adjusted);
    expect(diff.light.states?.danger?.hover).toEqual({
      old: theme.light.states.danger.hover,
      new: "#ff1111",
    });
  });
});

// ─── Accessibility diffs ───────────────────────────────────────────

describe("diffTheme - accessibility", () => {
  it("detects accessibility changes when colors change", () => {
    const adjusted = adjustTheme(theme, { light: { colors: { primary: "#ff0000" } } });
    const diff = diffTheme(theme, adjusted);
    expect(diff.light.accessibility).toBeDefined();
    expect(diff.light.accessibility?.primaryOnBackground).toBeDefined();
  });

  it("accessibility diff has ratio and/or level changes", () => {
    const adjusted = adjustTheme(theme, { light: { colors: { primary: "#ff0000" } } });
    const diff = diffTheme(theme, adjusted);
    const entry = diff.light.accessibility?.primaryOnBackground;
    if (entry?.ratio) {
      expect(entry.ratio.old).toBe(theme.light.accessibility.primaryOnBackground.ratio);
      expect(entry.ratio.new).toBe(adjusted.light.accessibility.primaryOnBackground.ratio);
    }
  });

  it("no color change means no accessibility diff", () => {
    const adjusted = adjustTheme(theme, { tokens: { spacing: { md: 99 } } });
    const diff = diffTheme(theme, adjusted);
    expect(diff.light.accessibility).toBeUndefined();
  });
});

// ─── Surface elevation diffs ───────────────────────────────────────

describe("diffTheme - surface elevation", () => {
  it("detects surface elevation changes", () => {
    const adjusted = adjustTheme(theme, { dark: { colors: { surface: "#333333" } } });
    const diff = diffTheme(theme, adjusted);
    expect(diff.dark.surfaceElevation).toBeDefined();
  });

  it("explicit elevation override shows in diff", () => {
    const adjusted = adjustTheme(theme, {
      dark: { surfaceElevation: { modal: "#555555" } },
    });
    const diff = diffTheme(theme, adjusted);
    expect(diff.dark.surfaceElevation?.modal).toEqual({
      old: theme.dark.surfaceElevation.modal,
      new: "#555555",
    });
  });
});

// ─── Round-trip with adjustTheme ───────────────────────────────────

describe("diffTheme - round-trip with adjustTheme", () => {
  it("adjusting then diffing shows exactly what changed", () => {
    const adjusted = adjustTheme(theme, {
      both: { colors: { primary: "#ff0000" } },
      tokens: { spacing: { md: 99 } },
    });
    const diff = diffTheme(theme, adjusted);
    expect(diff.identical).toBe(false);
    // primary changed in both
    expect(diff.light.colors?.primary?.new).toBe("#ff0000");
    expect(diff.dark.colors?.primary?.new).toBe("#ff0000");
    // spacing changed (mode-agnostic)
    expect(diff.tokens.spacing?.md?.new).toBe(99);
    // secondary unchanged
    expect(diff.light.colors?.secondary).toBeUndefined();
  });

  it("no-op adjust produces identical diff", () => {
    const adjusted = adjustTheme(theme, {});
    const diff = diffTheme(theme, adjusted);
    expect(diff.identical).toBe(true);
  });

  it("diffing two different presets detects many changes", () => {
    const ocean = generateTheme({ preset: "ocean" });
    const sunset = generateTheme({ preset: "sunset" });
    const diff = diffTheme(ocean, sunset);
    expect(diff.identical).toBe(false);
    // At minimum, primary should differ
    expect(diff.light.colors?.primary).toBeDefined();
  });
});
