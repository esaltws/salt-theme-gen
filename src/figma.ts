import { hexToRgb } from "./color-math.js";
import { buildJsonDescription } from "./file-header.js";
import type { GeneratedTheme, GeneratedThemeColors, GeneratedThemeTokens } from "./types.js";

// ─── Public types ─────────────────────────────────────────────────────

export type FigmaRGBA         = { r: number; g: number; b: number; a: number };
export type FigmaColorValue   = { type: "COLOR";  value: FigmaRGBA };
export type FigmaFloatValue   = { type: "FLOAT";  value: number };
export type FigmaStringValue  = { type: "STRING"; value: string };
export type FigmaVariableValue = FigmaColorValue | FigmaFloatValue | FigmaStringValue;

export type FigmaVariable = {
  id:                   string;
  name:                 string;
  variableCollectionId: string;
  resolvedType:         "COLOR" | "FLOAT" | "STRING";
  valuesByMode:         Record<string, FigmaVariableValue>;
};

export type FigmaVariableMode = {
  id:                   string;
  name:                 string;
  variableCollectionId: string;
};

export type FigmaVariableCollection = {
  id:            string;
  name:          string;
  defaultModeId: string;
};

export type FigmaVariablesPayload = {
  /** POST to /v1/files/:file_key/variables */
  variableCollections: FigmaVariableCollection[];
  variableModes:       FigmaVariableMode[];
  variables:           FigmaVariable[];
};

export type FigmaVariablesOptions = {
  /** Emit tonal palette steps (8 intents × 11 steps). Default: false */
  includePalettes?: boolean;
};

export type FigmaVariablesResult = {
  /** Structured payload — spread directly into the API request body */
  payload: FigmaVariablesPayload;
  /** JSON string of `{ $description, ...payload }` — ready to write to a file */
  json:    string;
};

// ─── Helpers ──────────────────────────────────────────────────────────

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

function toFigmaColor(hex: string): FigmaColorValue {
  const { r, g, b } = hexToRgb(hex);
  return {
    type:  "COLOR",
    value: {
      r: +(r / 255).toFixed(4),
      g: +(g / 255).toFixed(4),
      b: +(b / 255).toFixed(4),
      a: 1,
    },
  };
}

function varId(name: string): string {
  return `salt_var_${name.replace(/[\s/]/g, "_").replace(/-/g, "_")}`;
}

function makeColorVar(
  name: string,
  lightHex: string,
  darkHex: string,
  collectionId: string,
  lightModeId: string,
  darkModeId: string
): FigmaVariable {
  return {
    id:                   varId(name),
    name,
    variableCollectionId: collectionId,
    resolvedType:         "COLOR",
    valuesByMode: {
      [lightModeId]: toFigmaColor(lightHex),
      [darkModeId]:  toFigmaColor(darkHex),
    },
  };
}

function makeFloatVar(name: string, value: number, collectionId: string, modeId: string): FigmaVariable {
  return {
    id:                   varId(name),
    name,
    variableCollectionId: collectionId,
    resolvedType:         "FLOAT",
    valuesByMode:         { [modeId]: { type: "FLOAT", value } },
  };
}

function makeStringVar(name: string, value: string, collectionId: string, modeId: string): FigmaVariable {
  return {
    id:                   varId(name),
    name,
    variableCollectionId: collectionId,
    resolvedType:         "STRING",
    valuesByMode:         { [modeId]: { type: "STRING", value } },
  };
}

// ─── Color variable builder ───────────────────────────────────────────

function buildColorVars(
  light: GeneratedThemeColors,
  dark:  GeneratedThemeColors,
  colId: string,
  lightId: string,
  darkId: string,
  includePalettes: boolean
): FigmaVariable[] {
  const vars: FigmaVariable[] = [];

  const add = (name: string, lHex: string, dHex: string) =>
    vars.push(makeColorVar(name, lHex, dHex, colId, lightId, darkId));

  for (const [key, lHex] of Object.entries(light.colors) as [string, string][]) {
    add(`color/${camelToKebab(key)}`, lHex, (dark.colors as Record<string, string>)[key]);
  }

  for (const [key, lHex] of Object.entries(light.surfaceElevation) as [string, string][]) {
    add(`color/surface/${key}`, lHex, (dark.surfaceElevation as Record<string, string>)[key]);
  }

  for (const [intent, states] of Object.entries(light.states)) {
    for (const [state, lHex] of Object.entries(states as Record<string, string>)) {
      const dHex = (dark.states[intent as keyof typeof dark.states] as Record<string, string>)[state];
      add(`color/state/${intent}/${state}`, lHex, dHex);
    }
  }

  if (includePalettes) {
    for (const [pk, palette] of Object.entries(light.palettes)) {
      for (const [step, lHex] of Object.entries(palette as Record<string, string>)) {
        const dHex = (dark.palettes[pk as keyof typeof dark.palettes] as Record<string, string>)[step];
        add(`color/palette/${pk}/${step}`, lHex, dHex);
      }
    }
  }

  return vars;
}

// ─── Token variable builder ───────────────────────────────────────────

function buildTokenVars(tokens: GeneratedThemeTokens, colId: string, modeId: string): FigmaVariable[] {
  const vars: FigmaVariable[] = [];

  const num = (name: string, v: number) => vars.push(makeFloatVar(name, v, colId, modeId));
  const str = (name: string, v: string) => vars.push(makeStringVar(name, v, colId, modeId));

  for (const [k, v] of Object.entries(tokens.spacing) as [string, number][]) {
    num(`spacing/${k}`, v);
  }
  for (const [k, v] of Object.entries(tokens.radius) as [string, number][]) {
    num(`radius/${k}`, v);
  }
  for (const [k, v] of Object.entries(tokens.fontSizes) as [string, number][]) {
    num(`fontSize/${k}`, v);
  }
  num("fontSize/base", tokens.baseFont);
  for (const [k, v] of Object.entries(tokens.lineHeights) as [string, number][]) {
    num(`lineHeight/${k}`, v);
  }
  for (const [k, v] of Object.entries(tokens.fontWeights) as [string, number][]) {
    num(`fontWeight/${k}`, v);
  }
  for (const [k, v] of Object.entries(tokens.letterSpacings) as [string, number][]) {
    num(`letterSpacing/${k}`, v);
  }
  for (const [k, v] of Object.entries(tokens.iconSizes) as [string, number][]) {
    num(`iconSize/${k}`, v);
  }
  for (const [k, v] of Object.entries(tokens.controlSizes) as [string, number][]) {
    num(`control/${k}`, v);
  }
  for (const [k, v] of Object.entries(tokens.avatarSizes) as [string, number][]) {
    num(`avatar/${k}`, v);
  }
  for (const [k, v] of Object.entries(tokens.touchTargets) as [string, number][]) {
    num(`touchTarget/${k}`, v);
  }
  for (const [k, v] of Object.entries(tokens.borderWidths) as [string, number][]) {
    num(`borderWidth/${k}`, v);
  }
  for (const [k, v] of Object.entries(tokens.breakpoints) as [string, number][]) {
    num(`breakpoint/${k}`, v);
  }

  const DEFAULT_SANS = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  str("font/sans",    tokens.fontFamilySans    ?? DEFAULT_SANS);
  str("font/display", tokens.fontFamilyDisplay ?? tokens.fontFamilySans ?? DEFAULT_SANS);

  return vars;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Generate a Figma Variables API payload from a salt theme.
 *
 * The payload is split into two collections:
 * - `"Salt / Colors"` — semantic colors, states, and optionally palettes,
 *    with Light and Dark modes.
 * - `"Salt / Tokens"` — spacing, radius, typography, sizes — mode-agnostic.
 *
 * POST `payload` (or `json`) to:
 *   `PATCH /v1/files/:file_key/variables`
 *
 * @example
 * const { json } = generateFigmaVariables(theme);
 * await fetch(`https://api.figma.com/v1/files/${fileKey}/variables`, {
 *   method: "PATCH",
 *   headers: { "X-Figma-Token": token, "Content-Type": "application/json" },
 *   body: json,
 * });
 */
export function generateFigmaVariables(
  theme: GeneratedTheme,
  options?: FigmaVariablesOptions
): FigmaVariablesResult {
  const includePalettes = options?.includePalettes ?? false;

  const COL_COLORS = "salt_col_colors";
  const COL_TOKENS = "salt_col_tokens";
  const MODE_LIGHT = "salt_mode_light";
  const MODE_DARK  = "salt_mode_dark";
  const MODE_TOKEN = "salt_mode_default";

  const variableCollections: FigmaVariableCollection[] = [
    { id: COL_COLORS, name: "Salt / Colors", defaultModeId: MODE_LIGHT },
    { id: COL_TOKENS, name: "Salt / Tokens", defaultModeId: MODE_TOKEN },
  ];

  const variableModes: FigmaVariableMode[] = [
    { id: MODE_LIGHT, name: "Light",   variableCollectionId: COL_COLORS },
    { id: MODE_DARK,  name: "Dark",    variableCollectionId: COL_COLORS },
    { id: MODE_TOKEN, name: "Default", variableCollectionId: COL_TOKENS },
  ];

  const colorVars = buildColorVars(
    theme.light, theme.dark,
    COL_COLORS, MODE_LIGHT, MODE_DARK,
    includePalettes
  );
  const tokenVars = buildTokenVars(theme.tokens, COL_TOKENS, MODE_TOKEN);

  const payload: FigmaVariablesPayload = {
    variableCollections,
    variableModes,
    variables: [...colorVars, ...tokenVars],
  };

  const $description = buildJsonDescription("generateFigmaVariables", theme.light.colors.primary, {
    includePalettes: includePalettes || undefined,
  });

  return {
    payload,
    json: JSON.stringify({ $description, ...payload }, null, 2),
  };
}
