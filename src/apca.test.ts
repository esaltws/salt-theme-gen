import { describe, it, expect } from "vitest";
import { apcaContrast, meetsAPCA } from "./color-math";
import { buildAPCAReport } from "./on-colors";
import { generateTheme } from "./generate-theme";
import { deriveSurfaceElevation } from "./butterfly";

// ─── apcaContrast ────────────────────────────────────────────────────

describe("apcaContrast", () => {
  it("black on white ≈ +106 Lc (max positive)", () => {
    const lc = apcaContrast("#000000", "#ffffff");
    expect(lc).toBeGreaterThan(100);
  });

  it("white on black ≈ -106 Lc (max negative)", () => {
    const lc = apcaContrast("#ffffff", "#000000");
    expect(lc).toBeLessThan(-100);
  });

  it("is asymmetric: |BoW| ≠ |WoB| (APCA polarity distinction)", () => {
    const bow = apcaContrast("#000000", "#ffffff"); // black on white
    const wob = apcaContrast("#ffffff", "#000000"); // white on black
    // Absolute values close but not equal — APCA key property
    expect(Math.abs(bow)).not.toBeCloseTo(Math.abs(wob), 1);
  });

  it("sign indicates polarity: positive = light bg, negative = dark bg", () => {
    expect(apcaContrast("#000000", "#ffffff")).toBeGreaterThan(0); // dark txt, light bg
    expect(apcaContrast("#ffffff", "#000000")).toBeLessThan(0);   // light txt, dark bg
  });

  it("identical colors return 0", () => {
    expect(apcaContrast("#808080", "#808080")).toBe(0);
  });

  it("near-identical colors return 0 (below noise floor)", () => {
    expect(apcaContrast("#fefefe", "#ffffff")).toBe(0);
  });

  it("high-contrast blue on white gives Lc > 60", () => {
    const lc = apcaContrast("#0000ff", "#ffffff");
    expect(Math.abs(lc)).toBeGreaterThan(60);
  });

  it("low-contrast gray on white gives Lc < 45", () => {
    const lc = apcaContrast("#cccccc", "#ffffff");
    expect(Math.abs(lc)).toBeLessThan(45);
  });

  it("swapping fg/bg produces different absolute Lc (unlike WCAG2 which is symmetric)", () => {
    // WCAG2 contrastRatio(A,B) === contrastRatio(B,A); APCA is asymmetric
    const ab = Math.abs(apcaContrast("#000000", "#ffffff"));
    const ba = Math.abs(apcaContrast("#ffffff", "#000000"));
    expect(ab).not.toBeCloseTo(ba, 0); // must differ by at least 1 Lc unit
  });
});

// ─── meetsAPCA ───────────────────────────────────────────────────────

describe("meetsAPCA", () => {
  it("black on white meets Lc 75 (body text)", () => {
    expect(meetsAPCA("#000000", "#ffffff", 75)).toBe(true);
  });

  it("very light gray on white fails Lc 45 (UI minimum)", () => {
    expect(meetsAPCA("#dddddd", "#ffffff", 45)).toBe(false);
  });

  it("ignores polarity — checks absolute Lc", () => {
    // white on dark blue: negative Lc but passes threshold
    expect(meetsAPCA("#ffffff", "#0000aa", 45)).toBe(true);
  });
});

// ─── buildAPCAReport ─────────────────────────────────────────────────

describe("buildAPCAReport", () => {
  const theme = generateTheme({ primary: "#1e90ff" });
  const report = theme.light.apca;

  it("report has all 25 expected keys", () => {
    const expectedKeys = [
      "primaryOnBackground", "secondaryOnBackground", "tertiaryOnBackground", "quaternaryOnBackground",
      "textOnBackground", "textOnSurface", "mutedOnBackground",
      "dangerOnBackground", "successOnBackground", "warningOnBackground", "infoOnBackground",
      "onPrimaryOnPrimary", "onSecondaryOnSecondary", "onTertiaryOnTertiary", "onQuaternaryOnQuaternary",
      "onBackgroundOnBackground", "onSurfaceOnSurface",
      "onDangerOnDanger", "onSuccessOnSuccess", "onWarningOnWarning", "onInfoOnInfo",
      "textOnCard", "textOnElevated", "textOnModal", "textOnPopover",
    ];
    for (const key of expectedKeys) {
      expect(report, `missing key: ${key}`).toHaveProperty(key);
    }
  });

  it("every entry has a numeric lc and a valid level", () => {
    const validLevels = new Set(["Lc75", "Lc60", "Lc45", "fail"]);
    for (const [key, entry] of Object.entries(report)) {
      expect(typeof entry.lc, `${key}.lc not number`).toBe("number");
      expect(entry.lc, `${key}.lc negative`).toBeGreaterThanOrEqual(0);
      expect(validLevels.has(entry.level), `${key}.level invalid: ${entry.level}`).toBe(true);
    }
  });

  it("textOnBackground reaches at least Lc60 (design requirement)", () => {
    expect(report.textOnBackground.lc).toBeGreaterThanOrEqual(60);
  });

  it("onPrimaryOnPrimary reaches at least Lc45", () => {
    expect(report.onPrimaryOnPrimary.lc).toBeGreaterThanOrEqual(45);
  });

  it("level is consistent with lc value", () => {
    for (const [key, entry] of Object.entries(report)) {
      const { lc, level } = entry;
      if (lc >= 75) expect(level, key).toBe("Lc75");
      else if (lc >= 60) expect(level, key).toBe("Lc60");
      else if (lc >= 45) expect(level, key).toBe("Lc45");
      else expect(level, key).toBe("fail");
    }
  });

  it("light and dark reports differ", () => {
    const lightLc = theme.light.apca.textOnBackground.lc;
    const darkLc  = theme.dark.apca.textOnBackground.lc;
    expect(lightLc).not.toBe(darkLc);
  });

  it("all presets produce valid APCA reports", () => {
    const presets = ["peacock", "ocean", "forest", "sunset", "midnight"] as const;
    for (const preset of presets) {
      const t = generateTheme({ preset });
      for (const mode of [t.light, t.dark]) {
        for (const [key, entry] of Object.entries(mode.apca)) {
          expect(entry.lc, `${preset}/${mode.mode}/${key} lc`).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

// ─── Integration: apca field on GeneratedThemeMode ───────────────────

describe("generateTheme — apca field", () => {
  const theme = generateTheme({ primary: "#e63946" });

  it("both light and dark modes have apca field", () => {
    expect(theme.light.apca).toBeDefined();
    expect(theme.dark.apca).toBeDefined();
  });

  it("apca values are higher for on-colors (derived for contrast)", () => {
    // on-colors are specifically auto-corrected; should reliably hit Lc45
    expect(theme.light.apca.onPrimaryOnPrimary.lc).toBeGreaterThanOrEqual(45);
    expect(theme.light.apca.onDangerOnDanger.lc).toBeGreaterThanOrEqual(45);
  });
});
