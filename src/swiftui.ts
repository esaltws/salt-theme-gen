import { hexToRgb } from "./color-math.js";
import { buildScssHeader } from "./file-header.js";
import type { GeneratedTheme, GeneratedThemeColors, GeneratedThemeTokens } from "./types.js";

// ─── Public types ─────────────────────────────────────────────────────

export type SwiftUIThemeOptions = {
  /** Swift enum/namespace name for the theme. Default: `"SaltTheme"` */
  enumName?: string;
};

export type SwiftUIThemeResult = {
  /** Complete .swift file contents */
  swift:  string;
  /** Light-mode static var block (no enum wrapper or header) */
  light:  string;
  /** Dark-mode static var block (no enum wrapper or header) */
  dark:   string;
};

// ─── Helpers ──────────────────────────────────────────────────────────

function camelToLowerCamel(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function camelToCamel(s: string): string {
  // "onPrimary" → "onPrimary" (already camelCase, keep as-is)
  return s;
}

function hexToSwiftColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const rf = +(r / 255).toFixed(4);
  const gf = +(g / 255).toFixed(4);
  const bf = +(b / 255).toFixed(4);
  return `Color(red: ${rf}, green: ${gf}, blue: ${bf})`;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function round4(n: number): string {
  const s = n.toFixed(4);
  return s.replace(/\.?0+$/, "") || "0";
}

// ─── Color block builders ─────────────────────────────────────────────

function buildColorVars(colors: GeneratedThemeColors, darkSuffix: string): string[] {
  const lines: string[] = [];

  for (const [key, hex] of Object.entries(colors.colors) as [string, string][]) {
    const name = camelToCamel(key) + darkSuffix;
    lines.push(`    static let ${name} = ${hexToSwiftColor(hex)}`);
  }
  for (const [key, hex] of Object.entries(colors.surfaceElevation) as [string, string][]) {
    const name = `surface${titleCase(key)}${darkSuffix}`;
    lines.push(`    static let ${name} = ${hexToSwiftColor(hex)}`);
  }
  for (const [intent, states] of Object.entries(colors.states)) {
    for (const [state, hex] of Object.entries(states as Record<string, string>)) {
      const name = `${camelToCamel(intent)}${titleCase(state)}${darkSuffix}`;
      lines.push(`    static let ${name} = ${hexToSwiftColor(hex)}`);
    }
  }

  return lines;
}

function buildTokenVars(tokens: GeneratedThemeTokens): string[] {
  const lines: string[] = [];

  for (const [k, v] of Object.entries(tokens.spacing) as [string, number][]) {
    lines.push(`    static let spacing${titleCase(k)}: CGFloat = ${v}`);
  }
  for (const [k, v] of Object.entries(tokens.radius) as [string, number][]) {
    lines.push(`    static let radius${titleCase(k)}: CGFloat = ${v}`);
  }
  for (const [k, v] of Object.entries(tokens.fontSizes) as [string, number][]) {
    lines.push(`    static let fontSize${titleCase(k)}: CGFloat = ${v}`);
  }
  lines.push(`    static let fontSizeBase: CGFloat = ${tokens.baseFont}`);
  for (const [k, v] of Object.entries(tokens.iconSizes) as [string, number][]) {
    lines.push(`    static let iconSize${titleCase(k)}: CGFloat = ${v}`);
  }
  for (const [k, v] of Object.entries(tokens.controlSizes) as [string, number][]) {
    lines.push(`    static let control${titleCase(k)}: CGFloat = ${v}`);
  }
  for (const [k, v] of Object.entries(tokens.avatarSizes) as [string, number][]) {
    lines.push(`    static let avatar${titleCase(k)}: CGFloat = ${v}`);
  }
  for (const [k, v] of Object.entries(tokens.touchTargets) as [string, number][]) {
    lines.push(`    static let touchTarget${titleCase(k)}: CGFloat = ${v}`);
  }
  for (const [k, v] of Object.entries(tokens.borderWidths) as [string, number][]) {
    lines.push(`    static let borderWidth${titleCase(k)}: CGFloat = ${v}`);
  }
  for (const [k, v] of Object.entries(tokens.lineHeights) as [string, number][]) {
    lines.push(`    static let lineHeight${titleCase(k)}: CGFloat = ${v}`);
  }
  for (const [k, v] of Object.entries(tokens.fontWeights) as [string, number][]) {
    lines.push(`    static let fontWeight${titleCase(k)}: Font.Weight = .init(rawValue: ${v})`);
  }
  for (const [k, v] of Object.entries(tokens.letterSpacings) as [string, number][]) {
    lines.push(`    static let letterSpacing${titleCase(k)}: CGFloat = ${round4(v)}`);
  }

  return lines;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Generate a SwiftUI constants enum from a salt theme.
 *
 * Light-mode colors use plain names; dark-mode colors add a `Dark` suffix.
 * Tokens (spacing, radius, typography, sizes) are mode-agnostic CGFloat constants.
 *
 * @example
 * const { swift } = generateSwiftUITheme(theme);
 * fs.writeFileSync("SaltTheme.swift", swift);
 * // In your SwiftUI app:
 * // .foregroundColor(SaltTheme.Colors.primary)
 * // .padding(SaltTheme.Tokens.spacingMd)
 */
export function generateSwiftUITheme(
  theme: GeneratedTheme,
  options?: SwiftUIThemeOptions
): SwiftUIThemeResult {
  const enumName = options?.enumName ?? "SaltTheme";

  const lightLines = buildColorVars(theme.light, "");
  const darkLines  = buildColorVars(theme.dark,  "Dark");
  const tokenLines = buildTokenVars(theme.tokens);

  const light = lightLines.join("\n");
  const dark  = darkLines.join("\n");

  const header = buildScssHeader("generateSwiftUITheme", theme.light.colors.primary, {
    enumName: enumName !== "SaltTheme" ? enumName : undefined,
  });

  const swift = [
    header,
    "import SwiftUI",
    "",
    `enum ${enumName} {`,
    "  enum Colors {",
    "    // ─── Light mode ──────────────────────────────────────────",
    light,
    "",
    "    // ─── Dark mode ───────────────────────────────────────────",
    dark,
    "  }",
    "",
    "  enum Tokens {",
    "    // ─── Spacing, radius, typography, sizes ──────────────────",
    ...tokenLines,
    "  }",
    "}",
  ].join("\n");

  return { swift, light, dark };
}
