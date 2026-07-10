import { describe, it, expect } from "vitest";
import { generateTheme } from "./generate-theme";
import { parseColor, contrastRatio, isValidHex } from "./color-math";
import type { SemanticColors, StateColors } from "./types";

// ─── All 148 CSS named colors ────────────────────────────────────────

const CSS_COLORS = [
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure",
  "beige", "bisque", "black", "blanchedalmond", "blue",
  "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse",
  "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson",
  "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray",
  "darkgreen", "darkgrey", "darkkhaki", "darkmagenta", "darkolivegreen",
  "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen",
  "darkslateblue", "darkslategray", "darkslategrey", "darkturquoise",
  "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey",
  "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia",
  "gainsboro", "ghostwhite", "gold", "goldenrod", "gray",
  "green", "greenyellow", "grey", "honeydew", "hotpink",
  "indianred", "indigo", "ivory", "khaki", "lavender",
  "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral",
  "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey",
  "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray",
  "lightslategrey", "lightsteelblue", "lightyellow", "lime", "limegreen",
  "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue",
  "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue",
  "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue",
  "mintcream", "mistyrose", "moccasin", "navajowhite", "navy",
  "oldlace", "olive", "olivedrab", "orange", "orangered",
  "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred",
  "papayawhip", "peachpuff", "peru", "pink", "plum",
  "powderblue", "purple", "rebeccapurple", "red", "rosybrown",
  "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen",
  "seashell", "sienna", "silver", "skyblue", "slateblue",
  "slategray", "slategrey", "snow", "springgreen", "steelblue",
  "tan", "teal", "thistle", "tomato", "turquoise",
  "violet", "wheat", "white", "whitesmoke", "yellow",
  "yellowgreen",
];

// ─── Parsing ─────────────────────────────────────────────────────────

describe("CSS named colors - parsing", () => {
  it.each(CSS_COLORS)("%s parses to a valid hex", (name) => {
    const hex = parseColor(name);
    expect(isValidHex(hex)).toBe(true);
  });

  it.each(CSS_COLORS)("%s is case-insensitive", (name) => {
    expect(parseColor(name.toUpperCase())).toBe(parseColor(name));
  });
});

// ─── Theme generation ────────────────────────────────────────────────

describe("CSS named colors - theme generation", () => {
  it.each(CSS_COLORS)("%s generates a theme without throwing", (name) => {
    expect(() => generateTheme({ primary: name })).not.toThrow();
  });

  it.each(CSS_COLORS)("%s produces valid hex for all 23 semantic colors", (name) => {
    const theme = generateTheme({ primary: name });
    for (const mode of ["light", "dark"] as const) {
      const colors = theme[mode].colors;
      for (const key of Object.keys(colors) as (keyof SemanticColors)[]) {
        expect(isValidHex(colors[key]), `${mode}.colors.${key}`).toBe(true);
      }
    }
  });
});

// ─── WCAG AA compliance ──────────────────────────────────────────────

describe("CSS named colors - WCAG AA on-colors (4.5:1)", () => {
  const onColorPairs: [keyof SemanticColors, keyof SemanticColors][] = [
    ["onPrimary", "primary"],
    ["onSecondary", "secondary"],
    ["onTertiary", "tertiary"],
    ["onQuaternary", "quaternary"],
    ["onDanger", "danger"],
    ["onSuccess", "success"],
    ["onWarning", "warning"],
    ["onInfo", "info"],
  ];

  it.each(CSS_COLORS)("%s — all on-colors meet AA in both modes", (name) => {
    const theme = generateTheme({ primary: name });
    for (const mode of ["light", "dark"] as const) {
      const c = theme[mode].colors;
      for (const [fg, bg] of onColorPairs) {
        const ratio = contrastRatio(c[fg], c[bg]);
        expect(ratio, `${mode} ${fg} on ${bg}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("CSS named colors - WCAG AA semantic colors on background (4.5:1)", () => {
  const colorKeys: (keyof SemanticColors)[] = [
    "primary", "secondary", "tertiary", "quaternary",
    "danger", "success", "warning", "info",
  ];

  it.each(CSS_COLORS)("%s — all semantic colors meet AA vs background in both modes", (name) => {
    const theme = generateTheme({ primary: name });
    for (const mode of ["light", "dark"] as const) {
      const bg = theme[mode].colors.background;
      for (const key of colorKeys) {
        const ratio = contrastRatio(theme[mode].colors[key], bg);
        expect(ratio, `${mode} ${key} on background: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("CSS named colors - text on background/surface", () => {
  it.each(CSS_COLORS)("%s — text meets AA on background and surface", (name) => {
    const theme = generateTheme({ primary: name });
    for (const mode of ["light", "dark"] as const) {
      const c = theme[mode].colors;
      expect(
        contrastRatio(c.text, c.background),
        `${mode} text on background`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(c.text, c.surface),
        `${mode} text on surface`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

// ─── State colors ────────────────────────────────────────────────────

describe("CSS named colors - state colors are valid hex", () => {
  const intents = [
    "primary", "secondary", "tertiary", "quaternary",
    "danger", "success", "warning", "info",
  ] as const;
  const stateKeys: (keyof StateColors)[] = ["hover", "pressed", "focused", "disabled"];

  it.each(CSS_COLORS)("%s — all 32 state colors are valid hex", (name) => {
    const theme = generateTheme({ primary: name });
    for (const mode of ["light", "dark"] as const) {
      for (const intent of intents) {
        for (const state of stateKeys) {
          const hex = theme[mode].states[intent][state];
          expect(isValidHex(hex), `${mode}.states.${intent}.${state}`).toBe(true);
        }
      }
    }
  });
});

// ─── Surface elevation ───────────────────────────────────────────────

describe("CSS named colors - surface elevation valid hex", () => {
  const levels = ["card", "elevated", "modal", "popover"] as const;

  it.each(CSS_COLORS)("%s — all 4 elevation levels are valid hex", (name) => {
    const theme = generateTheme({ primary: name });
    for (const mode of ["light", "dark"] as const) {
      for (const level of levels) {
        expect(
          isValidHex(theme[mode].surfaceElevation[level]),
          `${mode}.surfaceElevation.${level}`
        ).toBe(true);
      }
    }
  });
});
