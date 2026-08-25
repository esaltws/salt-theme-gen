import { describe, it, expect } from "vitest";
import { parseThemeJSON } from "./validate";
import { generateTheme } from "./generate-theme";
import type { TokenWarning } from "./types";

// Helper: produce a valid theme as a plain object (simulates JSON round-trip)
function validThemeObj() {
  return JSON.parse(JSON.stringify(generateTheme({ primary: "#1e90ff" })));
}

// ─── happy path ─────────────────────────────────────────────────────

describe("parseThemeJSON - valid input", () => {
  it("accepts a valid generated theme", () => {
    const { theme } = parseThemeJSON(validThemeObj());
    expect(theme).toHaveProperty("light");
    expect(theme).toHaveProperty("dark");
    expect(theme.light.mode).toBe("light");
    expect(theme.dark.mode).toBe("dark");
  });

  it("returns the same theme shape as generateTheme", () => {
    const original = validThemeObj();
    const { theme } = parseThemeJSON(original);
    expect(theme).toEqual(original);
  });

  it("returns empty tokenWarnings for a clean generated theme", () => {
    const { tokenWarnings } = parseThemeJSON(validThemeObj());
    expect(tokenWarnings).toEqual([]);
  });

  it("works with all 20 presets", () => {
    const presets = [
      "peacock", "ocean", "forest", "sunset", "cherry-blossom",
      "arctic", "desert", "lavender", "emerald", "coral-reef",
      "midnight", "autumn", "rose-gold", "sapphire", "mint",
      "volcano", "twilight", "honey", "storm", "aurora",
    ] as const;
    for (const preset of presets) {
      const obj = JSON.parse(JSON.stringify(generateTheme({ preset })));
      expect(() => parseThemeJSON(obj)).not.toThrow();
    }
  });
});

// ─── root-level errors ──────────────────────────────────────────────

describe("parseThemeJSON - root errors", () => {
  it("rejects null", () => {
    expect(() => parseThemeJSON(null)).toThrow("expected object");
  });

  it("rejects string", () => {
    expect(() => parseThemeJSON("not a theme")).toThrow("expected object");
  });

  it("rejects array", () => {
    expect(() => parseThemeJSON([])).toThrow("expected object");
  });

  it("rejects empty object", () => {
    expect(() => parseThemeJSON({})).toThrow("theme.schemaVersion: missing");
  });

  it("rejects theme with missing schemaVersion", () => {
    const obj = validThemeObj();
    delete obj.schemaVersion;
    expect(() => parseThemeJSON(obj)).toThrow("theme.schemaVersion: missing");
  });

  it("rejects theme with wrong schemaVersion", () => {
    const obj = validThemeObj();
    obj.schemaVersion = "1.3";
    expect(() => parseThemeJSON(obj)).toThrow('expected "2.0"');
  });

  it("accepts theme with correct schemaVersion", () => {
    const obj = validThemeObj();
    expect(obj.schemaVersion).toBe("2.0");
    expect(() => parseThemeJSON(obj)).not.toThrow();
  });

  it("rejects object missing dark", () => {
    const obj = validThemeObj();
    delete obj.dark;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "dark"');
  });

  it("rejects object missing tokens", () => {
    const obj = validThemeObj();
    delete obj.tokens;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "tokens"');
  });
});

// ─── mode field ─────────────────────────────────────────────────────

describe("parseThemeJSON - mode validation", () => {
  it("rejects swapped modes", () => {
    const obj = validThemeObj();
    obj.light.mode = "dark";
    expect(() => parseThemeJSON(obj)).toThrow('expected "light"');
  });

  it("rejects invalid mode string", () => {
    const obj = validThemeObj();
    obj.light.mode = "auto";
    expect(() => parseThemeJSON(obj)).toThrow('expected "light" or "dark"');
  });
});

// ─── colors ─────────────────────────────────────────────────────────

describe("parseThemeJSON - colors validation", () => {
  it("rejects missing color key (tertiary)", () => {
    const obj = validThemeObj();
    delete obj.light.colors.tertiary;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "tertiary"');
  });

  it("rejects missing color key (quaternary)", () => {
    const obj = validThemeObj();
    delete obj.light.colors.quaternary;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "quaternary"');
  });

  it("rejects non-hex color value", () => {
    const obj = validThemeObj();
    obj.light.colors.primary = "not-a-color";
    expect(() => parseThemeJSON(obj)).toThrow("expected CSS color string");
  });

  it("rejects number as color value", () => {
    const obj = validThemeObj();
    obj.light.colors.background = 123;
    expect(() => parseThemeJSON(obj)).toThrow("expected CSS color string");
  });

  it("rejects null colors object", () => {
    const obj = validThemeObj();
    obj.light.colors = null;
    expect(() => parseThemeJSON(obj)).toThrow("expected object");
  });
});

// ─── surfaceElevation ───────────────────────────────────────────────

describe("parseThemeJSON - surfaceElevation validation", () => {
  it("rejects missing elevation key", () => {
    const obj = validThemeObj();
    delete obj.dark.surfaceElevation.modal;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "modal"');
  });

  it("rejects non-hex elevation value", () => {
    const obj = validThemeObj();
    obj.dark.surfaceElevation.card = 42;
    expect(() => parseThemeJSON(obj)).toThrow("expected CSS color string");
  });
});

// ─── numeric scales ─────────────────────────────────────────────────

describe("parseThemeJSON - scale validation", () => {
  it("rejects missing spacing key", () => {
    const obj = validThemeObj();
    delete obj.tokens.spacing.md;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "md"');
  });

  it("rejects string in radius scale", () => {
    const obj = validThemeObj();
    obj.tokens.radius.pill = "big";
    expect(() => parseThemeJSON(obj)).toThrow("expected number");
  });

  it("rejects missing fontSizes key", () => {
    const obj = validThemeObj();
    delete obj.tokens.fontSizes["3xl"];
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "3xl"');
  });

  it("rejects NaN in scale", () => {
    const obj = validThemeObj();
    obj.tokens.spacing.xs = NaN;
    expect(() => parseThemeJSON(obj)).toThrow("expected number");
  });
});

// ─── baseFont ──────────────────────────────────────────────────────

describe("parseThemeJSON - baseFont validation", () => {
  it("rejects baseFont below 8", () => {
    const obj = validThemeObj();
    obj.tokens.baseFont = 5;
    expect(() => parseThemeJSON(obj)).toThrow("expected number >= 8");
  });

  it("rejects string baseFont", () => {
    const obj = validThemeObj();
    obj.tokens.baseFont = "16";
    expect(() => parseThemeJSON(obj)).toThrow("expected number >= 8");
  });
});

// ─── new typography fields ──────────────────────────────────────────

describe("parseThemeJSON - new typography fields", () => {
  it("rejects missing typography", () => {
    const obj = JSON.parse(JSON.stringify(generateTheme({ primary: "#1e90ff" })));
    delete obj.tokens.typography;
    expect(() => parseThemeJSON(obj)).toThrow("typography");
  });

  it("rejects invalid fontWeight in typography", () => {
    const obj = JSON.parse(JSON.stringify(generateTheme({ primary: "#1e90ff" })));
    obj.tokens.typography.bodyMedium.fontWeight = 350;
    expect(() => parseThemeJSON(obj)).toThrow("fontWeight");
  });

  it("rejects missing lineHeights", () => {
    const obj = JSON.parse(JSON.stringify(generateTheme({ primary: "#1e90ff" })));
    delete obj.tokens.lineHeights;
    expect(() => parseThemeJSON(obj)).toThrow("lineHeights");
  });
});

// ─── states ─────────────────────────────────────────────────────────

describe("parseThemeJSON - states validation", () => {
  it("rejects missing intent in states (tertiary)", () => {
    const obj = validThemeObj();
    delete obj.light.states.tertiary;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "tertiary"');
  });

  it("rejects missing intent in states (quaternary)", () => {
    const obj = validThemeObj();
    delete obj.light.states.quaternary;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "quaternary"');
  });

  it("rejects missing state key in intent", () => {
    const obj = validThemeObj();
    delete obj.light.states.primary.focused;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "focused"');
  });

  it("rejects non-hex state value", () => {
    const obj = validThemeObj();
    obj.dark.states.danger.hover = 0;
    expect(() => parseThemeJSON(obj)).toThrow("expected CSS color string");
  });
});

// ─── accessibility ──────────────────────────────────────────────────

describe("parseThemeJSON - accessibility validation", () => {
  it("rejects missing accessibility key (onTertiaryOnTertiary)", () => {
    const obj = validThemeObj();
    delete obj.light.accessibility.onTertiaryOnTertiary;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "onTertiaryOnTertiary"');
  });

  it("rejects missing accessibility key (onQuaternaryOnQuaternary)", () => {
    const obj = validThemeObj();
    delete obj.light.accessibility.onQuaternaryOnQuaternary;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "onQuaternaryOnQuaternary"');
  });

  it("rejects non-number ratio", () => {
    const obj = validThemeObj();
    obj.light.accessibility.textOnBackground.ratio = "high";
    expect(() => parseThemeJSON(obj)).toThrow("expected number");
  });

  it("rejects invalid level string", () => {
    const obj = validThemeObj();
    obj.dark.accessibility.onPrimaryOnPrimary.level = "AAAA";
    expect(() => parseThemeJSON(obj)).toThrow('expected "AAA", "AA", or "fail"');
  });
});

// ─── error paths are descriptive ────────────────────────────────────

describe("parseThemeJSON - error paths", () => {
  it("error message includes full path for nested issues", () => {
    const obj = validThemeObj();
    obj.dark.states.warning.disabled = 42;
    try {
      parseThemeJSON(obj);
      expect.unreachable("should have thrown");
    } catch (e: any) {
      expect(e.message).toContain("theme.dark.states.warning.disabled");
    }
  });

  it("error message includes full path for accessibility", () => {
    const obj = validThemeObj();
    obj.light.accessibility.dangerOnBackground.ratio = "bad";
    try {
      parseThemeJSON(obj);
      expect.unreachable("should have thrown");
    } catch (e: any) {
      expect(e.message).toContain("theme.light.accessibility.dangerOnBackground.ratio");
    }
  });
});

// ─── token validity — errors ─────────────────────────────────────────

function tokenError(obj: ReturnType<typeof validThemeObj>, mutate: (o: any) => void): TokenWarning | undefined {
  mutate(obj);
  const { tokenWarnings } = parseThemeJSON(obj);
  return tokenWarnings.find((w) => w.severity === "error");
}

describe("parseThemeJSON - token validity errors", () => {
  it("flags negative spacing value", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.spacing.xs = -4; });
    expect(w).toBeDefined();
    expect(w!.rule).toBe("no-negative");
    expect(w!.path).toBe("theme.tokens.spacing.xs");
    expect(w!.severity).toBe("error");
  });

  it("flags negative radius value", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.radius.md = -1; });
    expect(w?.rule).toBe("no-negative");
  });

  it("flags negative fontSizes value", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.fontSizes.sm = -5; });
    expect(w?.rule).toBe("no-negative");
    expect(w?.path).toContain("fontSizes.sm");
  });

  it("flags negative control size", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.controlSizes.md = -10; });
    expect(w?.rule).toBe("no-negative");
  });

  it("flags negative touch target value", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.touchTargets.recommended = -5; });
    expect(w?.rule).toBe("no-negative");
  });

  it("flags negative breakpoint value", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.breakpoints.md = -100; });
    expect(w?.rule).toBe("no-negative");
  });

  it("flags non-positive typography lineHeight (zero)", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.typography.bodyMedium.lineHeight = 0; });
    expect(w?.rule).toBe("positive-line-height");
    expect(w?.path).toBe("theme.tokens.typography.bodyMedium.lineHeight");
  });

  it("flags non-positive typography lineHeight (negative)", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.typography.display.lineHeight = -0.5; });
    expect(w?.rule).toBe("positive-line-height");
  });

  it("flags negative typography fontSize", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.typography.caption.fontSize = -8; });
    expect(w?.rule).toBe("no-negative");
    expect(w?.path).toContain("caption.fontSize");
  });

  it("flags descending breakpoints (md < sm)", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.breakpoints.md = 100; }); // sm is 480
    expect(w?.rule).toBe("ascending-breakpoints");
    expect(w?.path).toBe("theme.tokens.breakpoints.md");
  });

  it("flags equal adjacent breakpoints (md === sm)", () => {
    const obj = validThemeObj();
    const sm = obj.tokens.breakpoints.sm;
    const w = tokenError(obj, (o) => { o.tokens.breakpoints.md = sm; });
    expect(w?.rule).toBe("ascending-breakpoints");
  });

  it("flags fontScale = 1 (flat modular ratio)", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.fontScale = 1; });
    expect(w?.rule).toBe("valid-font-scale");
    expect(w?.path).toBe("theme.tokens.fontScale");
  });

  it("flags fontScale = 0.8 (inverted ratio)", () => {
    const obj = validThemeObj();
    const w = tokenError(obj, (o) => { o.tokens.fontScale = 0.8; });
    expect(w?.rule).toBe("valid-font-scale");
  });

  it("includes the offending value in the report", () => {
    const obj = validThemeObj();
    obj.tokens.spacing.xs = -4;
    const { tokenWarnings } = parseThemeJSON(obj);
    const entry = tokenWarnings.find((w) => w.path === "theme.tokens.spacing.xs");
    expect(entry?.value).toBe(-4);
    expect(typeof entry?.message).toBe("string");
  });
});

// ─── token validity — warnings ───────────────────────────────────────

function tokenWarning(obj: ReturnType<typeof validThemeObj>, mutate: (o: any) => void, rule: string): TokenWarning | undefined {
  mutate(obj);
  const { tokenWarnings } = parseThemeJSON(obj);
  return tokenWarnings.find((w) => w.severity === "warning" && w.rule === rule);
}

describe("parseThemeJSON - token validity warnings", () => {
  it("warns when touch target minimum < 24", () => {
    const obj = validThemeObj();
    const w = tokenWarning(obj, (o) => { o.tokens.touchTargets.minimum = 20; }, "touch-target-minimum-24");
    expect(w).toBeDefined();
    expect(w!.path).toBe("theme.tokens.touchTargets.minimum");
    expect(w!.value).toBe(20);
  });

  it("warns when touch target recommended < 24 (below absolute floor)", () => {
    const obj = validThemeObj();
    const w = tokenWarning(obj, (o) => { o.tokens.touchTargets.recommended = 20; }, "touch-target-minimum-24");
    expect(w).toBeDefined();
  });

  it("warns when touch target recommended < 44", () => {
    const obj = validThemeObj();
    const w = tokenWarning(obj, (o) => { o.tokens.touchTargets.recommended = 32; }, "touch-target-recommended-44");
    expect(w).toBeDefined();
    expect(w!.path).toBe("theme.tokens.touchTargets.recommended");
  });

  it("warns when body text fontSize < 12", () => {
    const obj = validThemeObj();
    const w = tokenWarning(obj, (o) => { o.tokens.typography.bodyMedium.fontSize = 9; }, "body-text-minimum-12");
    expect(w).toBeDefined();
    expect(w!.path).toBe("theme.tokens.typography.bodyMedium.fontSize");
  });

  it("warns for bodySmall and bodyLarge too", () => {
    const obj = validThemeObj();
    obj.tokens.typography.bodySmall.fontSize = 8;
    obj.tokens.typography.bodyLarge.fontSize = 10;
    const { tokenWarnings } = parseThemeJSON(obj);
    const hits = tokenWarnings.filter((w) => w.rule === "body-text-minimum-12");
    expect(hits.length).toBe(2);
  });

  it("warns on unusually compressed typography line height", () => {
    const obj = validThemeObj();
    const w = tokenWarning(obj, (o) => { o.tokens.typography.bodyMedium.lineHeight = 0.9; }, "compressed-line-height");
    expect(w).toBeDefined();
    expect(w!.path).toBe("theme.tokens.typography.bodyMedium.lineHeight");
  });

  it("does not warn on caption compressed line height (caption is not prose)", () => {
    const obj = validThemeObj();
    obj.tokens.typography.caption.lineHeight = 0.9;
    const { tokenWarnings } = parseThemeJSON(obj);
    const hit = tokenWarnings.find((w) => w.rule === "compressed-line-height" && w.path.includes("caption"));
    expect(hit).toBeUndefined();
  });

  it("warns on descending spacing scale", () => {
    const obj = validThemeObj();
    // xs=4, sm=8, md=2 — md < sm is descending
    obj.tokens.spacing.md = 2;
    const { tokenWarnings } = parseThemeJSON(obj);
    const hit = tokenWarnings.find((w) => w.rule === "ascending-scale" && w.path.includes("spacing.md"));
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("warning");
  });

  it("warns on descending radius scale", () => {
    const obj = validThemeObj();
    obj.tokens.radius.lg = 1; // smaller than md
    const { tokenWarnings } = parseThemeJSON(obj);
    const hit = tokenWarnings.find((w) => w.rule === "ascending-scale" && w.path.includes("radius.lg"));
    expect(hit).toBeDefined();
  });

  it("warns on descending fontSizes scale", () => {
    const obj = validThemeObj();
    obj.tokens.fontSizes.xl = 4; // smaller than lg
    const { tokenWarnings } = parseThemeJSON(obj);
    const hit = tokenWarnings.find((w) => w.rule === "ascending-scale" && w.path.includes("fontSizes.xl"));
    expect(hit).toBeDefined();
  });

  it("clean theme produces no warnings", () => {
    const { tokenWarnings } = parseThemeJSON(validThemeObj());
    expect(tokenWarnings.filter((w) => w.severity === "warning")).toHaveLength(0);
  });
});
