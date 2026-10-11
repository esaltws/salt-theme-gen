import { hexToRgb } from "./color-math.js";
import { buildScssHeader } from "./file-header.js";
import type { GeneratedTheme, GeneratedThemeColors, GeneratedThemeTokens } from "./types.js";

// ─── Public types ─────────────────────────────────────────────────────

export type FlutterThemeOptions = {
  /** Dart class name for the theme. Default: `"SaltTheme"` */
  className?: string;
};

export type FlutterThemeResult = {
  /** Complete .dart file contents */
  dart:  string;
  /** Light-mode constants block (no class wrapper or header) */
  light: string;
  /** Dark-mode constants block (no class wrapper or header) */
  dark:  string;
};

// ─── Helpers ──────────────────────────────────────────────────────────

function camelToSnake(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`);
}

function hexToFlutterColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const toHex2 = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `Color(0xFF${toHex2(r)}${toHex2(g)}${toHex2(b)})`;
}

function round4(n: number): string {
  return +(n).toFixed(4) + "";
}

// ─── Mode block builders ──────────────────────────────────────────────

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildColorConsts(colors: GeneratedThemeColors, suffix: string): string[] {
  const lines: string[] = [];

  for (const [key, hex] of Object.entries(colors.colors) as [string, string][]) {
    lines.push(`  static const Color ${camelToSnake(key)}${suffix} = ${hexToFlutterColor(hex)};`);
  }
  for (const [key, hex] of Object.entries(colors.surfaceElevation) as [string, string][]) {
    lines.push(`  static const Color surface${titleCase(key)}${suffix} = ${hexToFlutterColor(hex)};`);
  }
  for (const [intent, states] of Object.entries(colors.states)) {
    for (const [state, hex] of Object.entries(states as Record<string, string>)) {
      lines.push(`  static const Color ${intent}_${state}${suffix} = ${hexToFlutterColor(hex)};`);
    }
  }

  return lines;
}

function buildTokenConsts(tokens: GeneratedThemeTokens): string[] {
  const lines: string[] = [];

  for (const [k, v] of Object.entries(tokens.spacing) as [string, number][]) {
    lines.push(`  static const double spacing${titleCase(k)} = ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.radius) as [string, number][]) {
    lines.push(`  static const double radius${titleCase(k)} = ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.fontSizes) as [string, number][]) {
    lines.push(`  static const double fontSize${titleCase(k)} = ${v};`);
  }
  lines.push(`  static const double fontSizeBase = ${tokens.baseFont};`);
  for (const [k, v] of Object.entries(tokens.iconSizes) as [string, number][]) {
    lines.push(`  static const double iconSize${titleCase(k)} = ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.controlSizes) as [string, number][]) {
    lines.push(`  static const double control${titleCase(k)} = ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.avatarSizes) as [string, number][]) {
    lines.push(`  static const double avatar${titleCase(k)} = ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.touchTargets) as [string, number][]) {
    lines.push(`  static const double touchTarget${titleCase(k)} = ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.borderWidths) as [string, number][]) {
    lines.push(`  static const double borderWidth${titleCase(k)} = ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.lineHeights) as [string, number][]) {
    lines.push(`  static const double lineHeight${titleCase(k)} = ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.fontWeights) as [string, number][]) {
    lines.push(`  static const int fontWeight${titleCase(k)} = ${v};`);
  }
  for (const [k, v] of Object.entries(tokens.letterSpacings) as [string, number][]) {
    lines.push(`  static const double letterSpacing${titleCase(k)} = ${round4(v)};`);
  }

  return lines;
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Generate a Dart/Flutter constants class from a salt theme.
 *
 * Light-mode colors use plain names; dark-mode colors add a `Dark` suffix.
 * Mode-agnostic tokens (spacing, radius, typography, sizes) are emitted once.
 *
 * @example
 * const { dart } = generateFlutterTheme(theme);
 * fs.writeFileSync("lib/salt_theme.dart", dart);
 * // In your Flutter app:
 * // import 'salt_theme.dart';
 * // color: SaltTheme.primary,
 * // color: isDark ? SaltTheme.primaryDark : SaltTheme.primary,
 */
export function generateFlutterTheme(
  theme: GeneratedTheme,
  options?: FlutterThemeOptions
): FlutterThemeResult {
  const cls = options?.className ?? "SaltTheme";

  const lightLines = buildColorConsts(theme.light, "");
  const darkLines  = buildColorConsts(theme.dark,  "Dark");
  const tokenLines = buildTokenConsts(theme.tokens);

  const light = lightLines.join("\n");
  const dark  = darkLines.join("\n");

  const header = buildScssHeader("generateFlutterTheme", theme.light.colors.primary, {
    className: cls !== "SaltTheme" ? cls : undefined,
  });

  const dart = [
    header,
    "import 'package:flutter/material.dart';",
    "",
    `class ${cls} {`,
    `  ${cls}._();`,
    "",
    "  // ─── Light mode ──────────────────────────────────────────────",
    light,
    "",
    "  // ─── Dark mode ───────────────────────────────────────────────",
    dark,
    "",
    "  // ─── Tokens ──────────────────────────────────────────────────",
    ...tokenLines,
    "}",
  ].join("\n");

  return { dart, light, dark };
}
