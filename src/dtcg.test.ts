import { describe, it, expect } from "vitest";
import { generateDtcgTokens } from "./dtcg";
import { generateTheme } from "./generate-theme";
import type { DtcgToken, DtcgGroup } from "./dtcg";

const theme = generateTheme({ primary: "#1e90ff" });
const { light, dark, json } = generateDtcgTokens(theme);

// ─── Token shape helpers ──────────────────────────────────────────────

function isToken(v: unknown): v is DtcgToken {
  return (
    typeof v === "object" && v !== null &&
    "$value" in v && "$type" in v
  );
}

function isColorToken(v: unknown): boolean {
  return isToken(v) && (v as DtcgToken).$type === "color";
}

function isDimToken(v: unknown): boolean {
  return isToken(v) && (v as DtcgToken).$type === "dimension";
}

function getLeaf(root: DtcgGroup, ...path: string[]): unknown {
  let node: unknown = root;
  for (const key of path) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as DtcgGroup)[key];
  }
  return node;
}

// ─── Semantic colors ─────────────────────────────────────────────────

describe("generateDtcgTokens — semantic colors", () => {
  it("color.primary is a color token with hex value", () => {
    const tok = getLeaf(light, "color", "primary");
    expect(isColorToken(tok)).toBe(true);
    expect((tok as DtcgToken).$value).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("camelCase keys are converted to kebab-case", () => {
    expect(getLeaf(light, "color", "on-primary")).toBeDefined();
    expect(getLeaf(light, "color", "on-background")).toBeDefined();
    expect(getLeaf(light, "color", "on-surface")).toBeDefined();
    // original camelCase should NOT be present as a key
    expect(getLeaf(light, "color", "onPrimary")).toBeUndefined();
  });

  it("includes all 23 semantic color keys", () => {
    const expectedKeys = [
      "primary", "secondary", "tertiary", "quaternary",
      "background", "surface", "text", "muted", "border",
      "danger", "success", "warning", "info",
      "on-primary", "on-secondary", "on-tertiary", "on-quaternary",
      "on-background", "on-surface",
      "on-danger", "on-success", "on-warning", "on-info",
    ];
    const colorGroup = (light as DtcgGroup).color as DtcgGroup;
    for (const key of expectedKeys) {
      expect(colorGroup, `missing color.${key}`).toHaveProperty(key);
    }
  });
});

// ─── Tonal palettes ──────────────────────────────────────────────────

describe("generateDtcgTokens — tonal palettes", () => {
  it("color.palette.primary.500 is a color token", () => {
    const tok = getLeaf(light, "color", "palette", "primary", "500");
    expect(isColorToken(tok)).toBe(true);
    expect((tok as DtcgToken).$value).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("includes all 8 palette keys", () => {
    const palette = getLeaf(light, "color", "palette") as DtcgGroup;
    for (const key of ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"]) {
      expect(palette, `missing palette.${key}`).toHaveProperty(key);
    }
  });

  it("each palette has all 11 steps", () => {
    const steps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
    const palette = getLeaf(light, "color", "palette") as DtcgGroup;
    for (const pk of Object.keys(palette)) {
      const stepGroup = palette[pk] as DtcgGroup;
      for (const step of steps) {
        expect(stepGroup, `palette.${pk} missing step ${step}`).toHaveProperty(step);
        expect(isColorToken(stepGroup[step])).toBe(true);
      }
    }
  });
});

// ─── Surface elevation ───────────────────────────────────────────────

describe("generateDtcgTokens — surface elevation", () => {
  it("goes under color.elevation.* (not color.surface.*)", () => {
    for (const key of ["card", "elevated", "modal", "popover"]) {
      const tok = getLeaf(light, "color", "elevation", key);
      expect(tok, `missing color.elevation.${key}`).toBeDefined();
      expect(isColorToken(tok)).toBe(true);
    }
  });

  it("color.surface refers to the semantic surface color, not the elevation group", () => {
    const surfaceTok = getLeaf(light, "color", "surface");
    expect(isColorToken(surfaceTok)).toBe(true);
  });
});

// ─── State colors ────────────────────────────────────────────────────

describe("generateDtcgTokens — state colors", () => {
  it("color.state.primary.hover is a color token", () => {
    const tok = getLeaf(light, "color", "state", "primary", "hover");
    expect(isColorToken(tok)).toBe(true);
  });

  it("includes all 8×4 state combinations", () => {
    const intents = ["primary", "secondary", "tertiary", "quaternary", "danger", "success", "warning", "info"];
    const states  = ["hover", "pressed", "focused", "disabled"];
    for (const intent of intents) {
      for (const state of states) {
        const tok = getLeaf(light, "color", "state", intent, state);
        expect(tok, `missing state.${intent}.${state}`).toBeDefined();
      }
    }
  });
});

// ─── Dimension scales ────────────────────────────────────────────────

describe("generateDtcgTokens — dimension scales", () => {
  it("spacing.md is a dimension token with px value", () => {
    const tok = getLeaf(light, "spacing", "md") as DtcgToken;
    expect(isDimToken(tok)).toBe(true);
    expect(tok.$value).toMatch(/^\d+px$/);
  });

  it("radius.pill has a large px value", () => {
    const tok = getLeaf(light, "radius", "pill") as DtcgToken;
    expect(isDimToken(tok)).toBe(true);
    const val = parseInt(tok.$value);
    expect(val).toBeGreaterThan(100); // pill should be large (e.g. 9999px)
  });

  it("fontSize.base is a dimension token (base font size)", () => {
    const tok = getLeaf(light, "fontSize", "base") as DtcgToken;
    expect(isDimToken(tok)).toBe(true);
    expect(tok.$value).toMatch(/^\d+px$/);
  });

  it("includes all spacing keys", () => {
    const spacingGroup = (light as DtcgGroup).spacing as DtcgGroup;
    for (const key of ["none", "xs", "sm", "md", "lg", "xl", "xxl"]) {
      expect(spacingGroup, `missing spacing.${key}`).toHaveProperty(key);
    }
  });

  it("includes all radius keys", () => {
    const radiusGroup = (light as DtcgGroup).radius as DtcgGroup;
    for (const key of ["none", "sm", "md", "lg", "xl", "xxl", "pill"]) {
      expect(radiusGroup, `missing radius.${key}`).toHaveProperty(key);
    }
  });

  it("includes iconSize, size, and dimension groups", () => {
    expect(light).toHaveProperty("iconSize");
    expect(light).toHaveProperty("size");
    expect(light).toHaveProperty("dimension");
  });
});

// ─── Typography composite group ───────────────────────────────────────

describe("generateDtcgTokens — typography group (TypographyScale)", () => {
  it("typography.bodyMedium is a $type:typography token", () => {
    const tok = getLeaf(light, "typography", "bodyMedium") as DtcgToken;
    expect(tok.$type).toBe("typography");
  });

  it("typography.bodyMedium.$value has fontSize, lineHeight, fontWeight, letterSpacing", () => {
    const tok = getLeaf(light, "typography", "bodyMedium") as DtcgToken;
    const val = tok.$value as Record<string, string | number>;
    expect(val).toHaveProperty("fontSize");
    expect(val).toHaveProperty("lineHeight");
    expect(val).toHaveProperty("fontWeight");
    expect(val).toHaveProperty("letterSpacing");
  });

  it("includes all 10 typography scale keys", () => {
    const group = (light as DtcgGroup).typography as DtcgGroup;
    for (const key of ["caption", "labelSmall", "labelMedium", "bodySmall", "bodyMedium", "bodyLarge", "titleSmall", "titleMedium", "titleLarge", "display"]) {
      expect(group, `missing typography.${key}`).toHaveProperty(key);
    }
  });
});

// ─── Line heights ─────────────────────────────────────────────────────

describe("generateDtcgTokens — lineHeight group", () => {
  it("lineHeight.normal is a number token with value 1.5", () => {
    const tok = getLeaf(light, "lineHeight", "normal") as DtcgToken;
    expect(tok.$type).toBe("number");
    expect(tok.$value).toBe(1.5);
  });

  it("includes all 6 line-height keys", () => {
    const group = (light as DtcgGroup).lineHeight as DtcgGroup;
    for (const key of ["none", "tight", "snug", "normal", "relaxed", "loose"]) {
      expect(group, `missing lineHeight.${key}`).toHaveProperty(key);
    }
  });
});

// ─── Font weights ─────────────────────────────────────────────────────

describe("generateDtcgTokens — fontWeight group", () => {
  it("fontWeight.bold is a fontWeight token with value 700", () => {
    const tok = getLeaf(light, "fontWeight", "bold") as DtcgToken;
    expect(tok.$type).toBe("fontWeight");
    expect(tok.$value).toBe(700);
  });

  it("includes all 6 font-weight keys", () => {
    const group = (light as DtcgGroup).fontWeight as DtcgGroup;
    for (const key of ["light", "regular", "medium", "semibold", "bold", "extrabold"]) {
      expect(group, `missing fontWeight.${key}`).toHaveProperty(key);
    }
  });
});

// ─── Letter spacings ──────────────────────────────────────────────────

describe("generateDtcgTokens — letterSpacing group", () => {
  it("letterSpacing.normal is a dimension token with value '0'", () => {
    const tok = getLeaf(light, "letterSpacing", "normal") as DtcgToken;
    expect(tok.$type).toBe("dimension");
    expect(tok.$value).toBe("0");
  });

  it("letterSpacing.tight is a dimension token with em value", () => {
    const tok = getLeaf(light, "letterSpacing", "tight") as DtcgToken;
    expect(tok.$type).toBe("dimension");
    expect(tok.$value).toMatch(/em$/);
  });

  it("includes all 5 letter-spacing keys", () => {
    const group = (light as DtcgGroup).letterSpacing as DtcgGroup;
    for (const key of ["tight", "normal", "wide", "wider", "widest"]) {
      expect(group, `missing letterSpacing.${key}`).toHaveProperty(key);
    }
  });
});

// ─── Typography composite tokens ──────────────────────────────────────

describe("generateDtcgTokens — typography group", () => {
  it("typography.bodyMedium is a typography token", () => {
    const tok = getLeaf(light, "typography", "bodyMedium") as DtcgToken;
    expect(tok.$type).toBe("typography");
  });

  it("typography.bodyMedium.$value has fontSize, fontWeight, lineHeight, letterSpacing", () => {
    const tok = getLeaf(light, "typography", "bodyMedium") as DtcgToken;
    const val = tok.$value as Record<string, string | number>;
    expect(val).toHaveProperty("fontSize");
    expect(val).toHaveProperty("fontWeight");
    expect(val).toHaveProperty("lineHeight");
    expect(val).toHaveProperty("letterSpacing");
  });

  it("typography.display has fontWeight 700", () => {
    const tok = getLeaf(light, "typography", "display") as DtcgToken;
    const val = tok.$value as Record<string, string | number>;
    expect(val.fontWeight).toBe(700);
  });

  it("all 10 typography composite keys are present", () => {
    const group = (light as DtcgGroup).typography as DtcgGroup;
    for (const key of ["caption", "labelSmall", "labelMedium", "bodySmall", "bodyMedium", "bodyLarge", "titleSmall", "titleMedium", "titleLarge", "display"]) {
      expect(group, `missing typography.${key}`).toHaveProperty(key);
    }
  });
});

// ─── Light / Dark / JSON ─────────────────────────────────────────────

describe("generateDtcgTokens — light/dark/json", () => {
  it("light and dark have different primary color values", () => {
    const lp = (getLeaf(light, "color", "primary") as DtcgToken).$value;
    const dp = (getLeaf(dark,  "color", "primary") as DtcgToken).$value;
    expect(lp).not.toBe(dp);
  });

  it("json is a valid JSON string containing both modes", () => {
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty("light");
    expect(parsed).toHaveProperty("dark");
  });

  it("json round-trips exactly to light/dark objects", () => {
    const parsed = JSON.parse(json);
    expect(parsed.light).toEqual(light);
    expect(parsed.dark).toEqual(dark);
  });

  it("all presets produce valid token trees", () => {
    const presets = ["peacock", "ocean", "forest", "sunset", "midnight"] as const;
    for (const preset of presets) {
      const t = generateTheme({ preset });
      const { light: l, dark: d } = generateDtcgTokens(t);
      expect(isColorToken(getLeaf(l, "color", "primary"))).toBe(true);
      expect(isColorToken(getLeaf(d, "color", "primary"))).toBe(true);
    }
  });
});
