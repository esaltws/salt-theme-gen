import { describe, it, expect } from "vitest";
import { generateFigmaVariables } from "./figma.js";
import { generateTheme } from "./generate-theme.js";
import type { FigmaVariable, FigmaVariablesResult } from "./figma.js";

const theme = generateTheme({ primary: "#6366f1" });
const result: FigmaVariablesResult = generateFigmaVariables(theme);

// ─── Collections & modes ──────────────────────────────────────────────

describe("generateFigmaVariables — collections and modes", () => {
  it("has two variable collections", () => {
    expect(result.payload.variableCollections).toHaveLength(2);
  });

  it("first collection is Salt / Colors", () => {
    expect(result.payload.variableCollections[0].name).toBe("Salt / Colors");
  });

  it("second collection is Salt / Tokens", () => {
    expect(result.payload.variableCollections[1].name).toBe("Salt / Tokens");
  });

  it("has three modes: Light, Dark, Default", () => {
    const names = result.payload.variableModes.map((m) => m.name);
    expect(names).toContain("Light");
    expect(names).toContain("Dark");
    expect(names).toContain("Default");
  });

  it("colors collection has Light and Dark modes", () => {
    const colId = result.payload.variableCollections[0].id;
    const colorModes = result.payload.variableModes.filter((m) => m.variableCollectionId === colId);
    expect(colorModes).toHaveLength(2);
    expect(colorModes.map((m) => m.name)).toContain("Light");
    expect(colorModes.map((m) => m.name)).toContain("Dark");
  });

  it("tokens collection has one mode", () => {
    const colId = result.payload.variableCollections[1].id;
    const tokenModes = result.payload.variableModes.filter((m) => m.variableCollectionId === colId);
    expect(tokenModes).toHaveLength(1);
  });
});

// ─── Color variables ──────────────────────────────────────────────────

describe("generateFigmaVariables — color variables", () => {
  const colId = result.payload.variableCollections[0].id;
  const colorVars = result.payload.variables.filter(
    (v) => v.variableCollectionId === colId
  );

  it("color/primary variable exists with COLOR resolvedType", () => {
    const prim = colorVars.find((v) => v.name === "color/primary");
    expect(prim).toBeDefined();
    expect(prim!.resolvedType).toBe("COLOR");
  });

  it("color values are in RGBA 0–1 format", () => {
    const prim = colorVars.find((v) => v.name === "color/primary")!;
    const lightModeId = result.payload.variableModes.find((m) => m.name === "Light")!.id;
    const val = prim.valuesByMode[lightModeId];
    expect(val.type).toBe("COLOR");
    if (val.type === "COLOR") {
      expect(val.value.r).toBeGreaterThanOrEqual(0);
      expect(val.value.r).toBeLessThanOrEqual(1);
      expect(val.value.g).toBeGreaterThanOrEqual(0);
      expect(val.value.g).toBeLessThanOrEqual(1);
      expect(val.value.b).toBeGreaterThanOrEqual(0);
      expect(val.value.b).toBeLessThanOrEqual(1);
      expect(val.value.a).toBe(1);
    }
  });

  it("light and dark color values differ for primary", () => {
    const prim = colorVars.find((v) => v.name === "color/primary")!;
    const [lightMode, darkMode] = result.payload.variableModes
      .filter((m) => m.variableCollectionId === result.payload.variableCollections[0].id);
    const lv = prim.valuesByMode[lightMode.id];
    const dv = prim.valuesByMode[darkMode.id];
    expect(lv).not.toEqual(dv);
  });

  it("contains camelCase-to-kebab converted names (on-primary)", () => {
    const onPrim = colorVars.find((v) => v.name === "color/on-primary");
    expect(onPrim).toBeDefined();
  });

  it("contains surface elevation variables", () => {
    const cardVar = colorVars.find((v) => v.name === "color/surface/card");
    expect(cardVar).toBeDefined();
  });

  it("contains 8 × 4 = 32 state variables", () => {
    const stateVars = colorVars.filter((v) => v.name.startsWith("color/state/"));
    expect(stateVars).toHaveLength(32);
  });

  it("state variable names follow color/state/{intent}/{state} pattern", () => {
    const v = colorVars.find((v) => v.name === "color/state/primary/hover");
    expect(v).toBeDefined();
    expect(v!.resolvedType).toBe("COLOR");
  });
});

// ─── Token variables ──────────────────────────────────────────────────

describe("generateFigmaVariables — token variables", () => {
  const colId = result.payload.variableCollections[1].id;
  const tokenVars = result.payload.variables.filter(
    (v) => v.variableCollectionId === colId
  );

  it("spacing variables exist with FLOAT resolvedType", () => {
    const sp = tokenVars.find((v) => v.name === "spacing/md");
    expect(sp).toBeDefined();
    expect(sp!.resolvedType).toBe("FLOAT");
  });

  it("spacing values are positive numbers (px)", () => {
    const sp = tokenVars.find((v) => v.name === "spacing/md")!;
    const modeId = result.payload.variableModes.find((m) => m.name === "Default")!.id;
    const val = sp.valuesByMode[modeId];
    expect(val.type).toBe("FLOAT");
    if (val.type === "FLOAT") expect(val.value).toBeGreaterThan(0);
  });

  it("radius variables exist", () => {
    const r = tokenVars.find((v) => v.name.startsWith("radius/"));
    expect(r).toBeDefined();
    expect(r!.resolvedType).toBe("FLOAT");
  });

  it("fontSize/base exists", () => {
    const fs = tokenVars.find((v) => v.name === "fontSize/base");
    expect(fs).toBeDefined();
  });

  it("font family variables are STRING type", () => {
    const f = tokenVars.find((v) => v.name === "font/sans");
    expect(f).toBeDefined();
    expect(f!.resolvedType).toBe("STRING");
  });

  it("token variables have exactly one mode value", () => {
    for (const v of tokenVars) {
      expect(Object.keys(v.valuesByMode)).toHaveLength(1);
    }
  });
});

// ─── Palettes ────────────────────────────────────────────────────────

describe("generateFigmaVariables — includePalettes", () => {
  it("palette vars absent by default", () => {
    const paletteVars = result.payload.variables.filter((v) => v.name.startsWith("color/palette/"));
    expect(paletteVars).toHaveLength(0);
  });

  it("palette vars present when includePalettes: true", () => {
    const r = generateFigmaVariables(theme, { includePalettes: true });
    const paletteVars = r.payload.variables.filter((v) => v.name.startsWith("color/palette/"));
    expect(paletteVars).toHaveLength(88);
  });

  it("palette vars follow color/palette/{intent}/{step} naming", () => {
    const r = generateFigmaVariables(theme, { includePalettes: true });
    const p50 = r.payload.variables.find((v) => v.name === "color/palette/primary/50");
    expect(p50).toBeDefined();
    expect(p50!.resolvedType).toBe("COLOR");
  });
});

// ─── JSON output ──────────────────────────────────────────────────────

describe("generateFigmaVariables — json", () => {
  it("json is valid JSON", () => {
    expect(() => JSON.parse(result.json)).not.toThrow();
  });

  it("json contains $description with generation metadata", () => {
    const parsed = JSON.parse(result.json);
    expect(parsed.$description).toContain("salt-theme-gen");
    expect(parsed.$description).toContain("generateFigmaVariables");
    expect(parsed.$description).toContain("Primary: #");
  });

  it("json round-trips variableCollections, variableModes, variables", () => {
    const parsed = JSON.parse(result.json);
    expect(parsed.variableCollections).toEqual(result.payload.variableCollections);
    expect(parsed.variableModes).toEqual(result.payload.variableModes);
    expect(parsed.variables).toEqual(result.payload.variables);
  });
});

// ─── Consistency ─────────────────────────────────────────────────────

describe("generateFigmaVariables — consistency", () => {
  it("same theme produces same payload", () => {
    const r1 = generateFigmaVariables(theme);
    const r2 = generateFigmaVariables(theme);
    expect(r1.payload).toEqual(r2.payload);
  });

  it("all presets produce valid output", () => {
    const presets = ["peacock", "ocean", "forest", "desert"] as const;
    for (const preset of presets) {
      const t = generateTheme({ preset });
      const { payload } = generateFigmaVariables(t);
      expect(payload.variables.find((v) => v.name === "color/primary")).toBeDefined();
    }
  });
});
