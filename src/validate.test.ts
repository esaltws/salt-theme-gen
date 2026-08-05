import { describe, it, expect } from "vitest";
import { parseThemeJSON } from "./validate";
import { generateTheme } from "./generate-theme";

// Helper: produce a valid theme as a plain object (simulates JSON round-trip)
function validThemeObj() {
  return JSON.parse(JSON.stringify(generateTheme({ primary: "#1e90ff" })));
}

// ─── happy path ─────────────────────────────────────────────────────

describe("parseThemeJSON - valid input", () => {
  it("accepts a valid generated theme", () => {
    const theme = parseThemeJSON(validThemeObj());
    expect(theme).toHaveProperty("light");
    expect(theme).toHaveProperty("dark");
    expect(theme.light.mode).toBe("light");
    expect(theme.dark.mode).toBe("dark");
  });

  it("returns the same shape as generateTheme", () => {
    const original = validThemeObj();
    const parsed = parseThemeJSON(original);
    expect(parsed).toEqual(original);
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
    expect(() => parseThemeJSON({})).toThrow('missing required key "light"');
  });

  it("rejects object missing dark", () => {
    const obj = validThemeObj();
    delete obj.dark;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "dark"');
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
    delete obj.light.spacing.md;
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "md"');
  });

  it("rejects string in radius scale", () => {
    const obj = validThemeObj();
    obj.light.radius.pill = "big";
    expect(() => parseThemeJSON(obj)).toThrow("expected number");
  });

  it("rejects missing fontSizes key", () => {
    const obj = validThemeObj();
    delete obj.light.fontSizes["3xl"];
    expect(() => parseThemeJSON(obj)).toThrow('missing required key "3xl"');
  });

  it("rejects NaN in scale", () => {
    const obj = validThemeObj();
    obj.light.spacing.xs = NaN;
    expect(() => parseThemeJSON(obj)).toThrow("expected number");
  });
});

// ─── baseFont ──────────────────────────────────────────────────────

describe("parseThemeJSON - baseFont validation", () => {
  it("rejects baseFont below 8", () => {
    const obj = validThemeObj();
    obj.light.baseFont = 5;
    expect(() => parseThemeJSON(obj)).toThrow("expected number >= 8");
  });

  it("rejects string baseFont", () => {
    const obj = validThemeObj();
    obj.light.baseFont = "16";
    expect(() => parseThemeJSON(obj)).toThrow("expected number >= 8");
  });
});

// ─── new typography fields ──────────────────────────────────────────

describe("parseThemeJSON - new typography fields", () => {
  it("rejects missing typography", () => {
    const obj = JSON.parse(JSON.stringify(generateTheme({ primary: "#1e90ff" })));
    delete obj.light.typography;
    expect(() => parseThemeJSON(obj)).toThrow("typography");
  });

  it("rejects invalid fontWeight in typography", () => {
    const obj = JSON.parse(JSON.stringify(generateTheme({ primary: "#1e90ff" })));
    obj.light.typography.bodyMedium.fontWeight = 350;
    expect(() => parseThemeJSON(obj)).toThrow("fontWeight");
  });

  it("rejects missing lineHeights", () => {
    const obj = JSON.parse(JSON.stringify(generateTheme({ primary: "#1e90ff" })));
    delete obj.light.lineHeights;
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
