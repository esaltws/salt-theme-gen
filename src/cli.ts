#!/usr/bin/env node
/// <reference types="node" />

import { parseArgs } from "node:util";
import { readFileSync, writeFileSync } from "node:fs";
import { VERSION } from "./types.js";
import type { GenerateThemeOptions, GeneratedTheme, ColorHarmony, FontScaleName, ThemeWarning, TokenWarning } from "./types.js";
import { parseThemeJSON } from "./validate.js";
import { adjustTheme } from "./adjust-theme.js";
import type { ThemeOverrides } from "./adjust-theme.js";
import { diffTheme } from "./diff-theme.js";
import { simulateTheme } from "./color-blindness.js";
import type { ColorBlindnessType } from "./color-blindness.js";
import { generateTheme } from "./generate-theme.js";
import { generateCssVariables } from "./css-variables.js";
import { generateScssVariables } from "./scss.js";
import { generateShadcnTheme } from "./shadcn.js";
import { generateTailwindConfig } from "./tailwind.js";
import { generateDtcgTokens } from "./dtcg.js";
import { generatePandaConfig } from "./panda.js";
import { generateFigmaVariables } from "./figma.js";
import { generateFlutterTheme } from "./flutter.js";
import { generateSwiftUITheme } from "./swiftui.js";
import { FONT_SCALE_RATIOS } from "./typography-utils.js";

// ─── Output helpers ───────────────────────────────────────────────────

function out(s: string): void { process.stdout.write(s); }
function err(s: string): void { process.stderr.write(s); }

/** Write msg to stderr and exit 2 (CLI / input error). */
function die(msg: string): never {
  err(`salt-theme-gen: ${msg}\n`);
  err(`Run 'salt-theme-gen --help' for usage.\n`);
  process.exit(2);
}

// ─── Help text ────────────────────────────────────────────────────────

const GLOBAL_HELP = `\
salt-theme-gen v${VERSION}

One color → complete design system.

Usage:
  salt-theme-gen <command> [options]
  npx salt-theme-gen <command> [options]

Commands:
  generate   Generate a new theme from a color or preset
  export     Convert a saved theme JSON to another format
  validate   Validate a theme JSON file
  diff       Compare two theme JSON files
  simulate   Apply color blindness simulation to a theme
  adjust     Adjust a theme using a ThemeOverrides JSON file

Global options:
  --help, -h      Show help (also works after a command)
  --version, -v   Print version number
  --quiet         Suppress warnings on stderr
  --silent        Alias for --quiet

Examples:
  salt-theme-gen generate --primary "#2563eb" --format css
  salt-theme-gen generate --preset ocean --out theme.json
  salt-theme-gen export theme.json --format dtcg --out tokens.json
  salt-theme-gen validate theme.json
  salt-theme-gen diff old.json new.json
  salt-theme-gen simulate theme.json --type deuteranopia
  cat overrides.json | salt-theme-gen adjust theme.json

Docs: https://learn.esalt.net/salt-theme-gen
`;

const GENERATE_HELP = `\
Usage: salt-theme-gen generate [options]

Generate a new theme from a primary color or preset.

Color source (one required):
  --primary <hex>       Primary color as hex (e.g. "#2563eb")
  --preset <name>       Named preset: peacock, ocean, forest, sunset,
                        cherry-blossom, arctic, desert, lavender, emerald,
                        coral-reef, midnight, autumn, rose-gold, sapphire,
                        mint, volcano, twilight, honey, storm, aurora

Generation:
  --harmony <name>      Color harmony (default: analogous):
                          analogous, complementary, triadic,
                          split-complementary, tetradic, monochromatic
  --spacing <preset>    Spacing scale: compact, default, relaxed, spacious
  --radius <preset>     Radius scale: sharp, default, rounded, pill
  --font-size <preset>  Font size scale: small, default, large, editorial
  --base-font <n>       Base font size in px (default: 16, min: 8)
  --font-scale <n>      Modular scale ratio or named scale:
                          minor-second (1.067), major-second (1.125),
                          minor-third (1.200), major-third (1.250, default),
                          perfect-fourth (1.333), augmented-fourth (1.414),
                          perfect-fifth (1.500), golden-ratio (1.618)

Output:
  --format <name>       Output format (default: json)
                          json       Full GeneratedTheme JSON
                          css        CSS custom properties (--salt-*)
                          scss       SCSS variables
                          tailwind   Tailwind theme.extend config
                          dtcg       W3C Design Tokens (DTCG)
                          shadcn     shadcn/ui + Tailwind v4 CSS
                          panda      Panda CSS tokens
                          figma      Figma Variables REST API payload
                          flutter    Flutter/Dart constants class
                          swiftui    SwiftUI constants enum
  --mode <name>         For css/scss: light, dark, both (default: both)
  --out <file>          Write to file instead of stdout

  --quiet, --silent     Suppress warnings on stderr
  --help, -h            Show this help
`;

const EXPORT_HELP = `\
Usage: salt-theme-gen export <file> --format <name> [options]
       cat theme.json | salt-theme-gen export - --format <name>

Convert a saved GeneratedTheme JSON to another output format.

Arguments:
  <file>                Path to GeneratedTheme JSON, or - for stdin

Options:
  --format <name>       Output format (required):
                          css, scss, tailwind, dtcg, shadcn, panda,
                          figma, flutter, swiftui, json
  --mode <name>         For css/scss: light, dark, both (default: both)
  --out <file>          Write to file instead of stdout

  --quiet, --silent     Suppress warnings on stderr
  --help, -h            Show this help
`;

const VALIDATE_HELP = `\
Usage: salt-theme-gen validate <file>
       cat theme.json | salt-theme-gen validate -

Validate a GeneratedTheme JSON file.

Arguments:
  <file>                Path to GeneratedTheme JSON, or - for stdin

Exit codes:
  0   Valid (warnings are permitted)
  1   Validation errors present
  2   Bad input or file not found

Options:
  --quiet, --silent     Suppress warnings on stderr
  --help, -h            Show this help
`;

const DIFF_HELP = `\
Usage: salt-theme-gen diff <old> <new> [options]

Compare two GeneratedTheme JSON files.

Arguments:
  <old>                 Path to the old theme JSON
  <new>                 Path to the new theme JSON

Exit codes:
  0   No differences
  1   Differences found
  2   Input error

Options:
  --json                Output diff as machine-readable JSON
  --quiet, --silent     Suppress warnings on stderr
  --help, -h            Show this help
`;

const SIMULATE_HELP = `\
Usage: salt-theme-gen simulate <file> --type <cvd> [options]
       salt-theme-gen simulate --primary <hex> --type <cvd> [options]
       cat theme.json | salt-theme-gen simulate - --type <cvd>

Apply color blindness simulation to a theme.

Arguments:
  <file>                Path to GeneratedTheme JSON, or - for stdin.
                        Omit to generate a theme from --primary or --preset.

Options:
  --type <cvd>          CVD type (required):
                          protanopia, deuteranopia, tritanopia
                          protanomaly, deuteranomaly, tritanomaly
                          achromatopsia
  --format <name>       Output format (default: json)
  --out <file>          Write to file instead of stdout

  Generation flags (when no file is provided):
  --primary, --preset, --harmony, --spacing, --radius,
  --font-size, --base-font, --font-scale

  --quiet, --silent     Suppress warnings on stderr
  --help, -h            Show this help
`;

const ADJUST_HELP = `\
Usage: salt-theme-gen adjust <file> --overrides <file> [options]
       cat overrides.json | salt-theme-gen adjust <file>

Adjust a theme using a ThemeOverrides JSON file or stdin.

Arguments:
  <file>                Path to GeneratedTheme JSON, or - for stdin

Options:
  --overrides <file>    Path to ThemeOverrides JSON, or - for stdin.
                        Omit when overrides are piped via stdin.
  --format <name>       Output format (default: json)
  --out <file>          Write to file instead of stdout

  --quiet, --silent     Suppress warnings on stderr
  --help, -h            Show this help

ThemeOverrides shape:
  {
    "both":   { "colors": { "primary": "#ff0000" } },
    "light":  { "colors": { "background": "#f8f8f8" } },
    "dark":   { "colors": { "background": "#1a1a1a" } },
    "tokens": { "spacing": { "md": 20 }, "radius": { "md": 12 } }
  }
`;

// ─── Shared format / mode constants ──────────────────────────────────

const VALID_FORMATS = [
  "json", "css", "scss", "tailwind", "dtcg", "shadcn", "panda", "figma", "flutter", "swiftui",
] as const;
type CliFormat = typeof VALID_FORMATS[number];

const VALID_MODES = ["both", "light", "dark"] as const;
type CliMode = typeof VALID_MODES[number];

const VALID_HARMONIES: ColorHarmony[] = [
  "analogous", "complementary", "triadic", "split-complementary", "tetradic", "monochromatic",
];

const VALID_SPACING  = ["compact", "default", "relaxed", "spacious"];
const VALID_RADIUS   = ["sharp", "default", "rounded", "pill"];
const VALID_FONTSIZE = ["small", "default", "large", "editorial"];
const NAMED_FONT_SCALES = Object.keys(FONT_SCALE_RATIOS) as FontScaleName[];

// ─── Shared output helpers ─────────────────────────────────────────────

/** Render a GeneratedTheme into a string for the chosen format + mode. */
function applyFormat(theme: GeneratedTheme, format: CliFormat, mode: CliMode): string {
  switch (format) {
    case "json":
      return JSON.stringify(theme, null, 2);
    case "css": {
      const r = generateCssVariables(theme);
      return mode === "light" ? r.light : mode === "dark" ? r.dark : r.css;
    }
    case "scss": {
      const r = generateScssVariables(theme);
      return mode === "light" ? r.light : mode === "dark" ? r.dark : r.scss;
    }
    case "tailwind": return generateTailwindConfig(theme).json;
    case "dtcg":     return generateDtcgTokens(theme).json;
    case "shadcn":   return generateShadcnTheme(theme).css;
    case "panda":    return generatePandaConfig(theme).json;
    case "figma":    return generateFigmaVariables(theme).json;
    case "flutter":  return generateFlutterTheme(theme).dart;
    case "swiftui":  return generateSwiftUITheme(theme).swift;
  }
}

/** Write content to a file or stdout, ensuring a trailing newline. */
function writeOutput(content: string, outFile?: string): void {
  const payload = content.endsWith("\n") ? content : content + "\n";
  if (outFile) {
    try {
      writeFileSync(outFile, payload, "utf8");
    } catch (e) {
      err(`salt-theme-gen: cannot write '${outFile}': ${(e as Error).message}\n`);
      process.exit(1);
    }
  } else {
    out(payload);
  }
}

/** Print WCAG warnings from a generated theme to stderr. */
function warnTheme(warnings: ThemeWarning[], quiet: boolean): void {
  if (quiet || warnings.length === 0) return;
  for (const w of warnings) {
    const action = w.action === "corrected"
      ? `corrected → ${w.finalValue}`
      : `kept as ${w.value}`;
    err(`warning [${w.mode}] ${w.key}: contrast ${w.ratio.toFixed(2)}:1 < ${w.required}:1 — ${action}\n`);
  }
}

/**
 * Thin parseArgs wrapper: catches unknown-option TypeErrors → exit 2.
 * Returns a plain Record to sidestep parseArgs's complex conditional types.
 */
function cliParse(
  argv: string[],
  options: Record<string, { type: "string" | "boolean" }>,
  allowPositionals = false,
): { values: Record<string, string | boolean | undefined>; positionals: string[] } {
  try {
    const result = parseArgs({ args: argv, options, strict: true, allowPositionals });
    return {
      values:      result.values      as Record<string, string | boolean | undefined>,
      positionals: result.positionals ?? [],
    };
  } catch (e) {
    die((e as Error).message);
  }
}

// ─── Command registry ─────────────────────────────────────────────────

const COMMANDS = ["generate", "export", "validate", "diff", "simulate", "adjust"] as const;
type Command = typeof COMMANDS[number];

// ─── generate ─────────────────────────────────────────────────────────

function runGenerate(argv: string[]): void {
  if (hasHelp(argv)) { out(GENERATE_HELP); process.exit(0); }

  const { values: v } = cliParse(argv, {
    primary:      { type: "string" },
    preset:       { type: "string" },
    harmony:      { type: "string" },
    spacing:      { type: "string" },
    radius:       { type: "string" },
    "font-size":  { type: "string" },
    "base-font":  { type: "string" },
    "font-scale": { type: "string" },
    format:       { type: "string" },
    mode:         { type: "string" },
    out:          { type: "string" },
    quiet:        { type: "boolean" },
    silent:       { type: "boolean" },
  });

  const primary   = v["primary"]    as string | undefined;
  const preset    = v["preset"]     as string | undefined;
  const harmony   = v["harmony"]    as string | undefined;
  const spacing   = v["spacing"]    as string | undefined;
  const radius    = v["radius"]     as string | undefined;
  const fontSize  = v["font-size"]  as string | undefined;
  const rawBase   = v["base-font"]  as string | undefined;
  const rawScale  = v["font-scale"] as string | undefined;
  const rawFormat = (v["format"]    as string | undefined) ?? "json";
  const rawMode   = (v["mode"]      as string | undefined) ?? "both";
  const outFile   = v["out"]        as string | undefined;
  const quiet     = v["quiet"] === true || v["silent"] === true;

  // ── Validate color source ──
  if (!primary && !preset) die("generate requires --primary <hex> or --preset <name>");
  if (primary && preset)   die("--primary and --preset are mutually exclusive");

  // ── Validate --format / --mode ──
  if (!(VALID_FORMATS as readonly string[]).includes(rawFormat)) {
    die(`unknown format '${rawFormat}' — valid: ${VALID_FORMATS.join(", ")}`);
  }
  if (!(VALID_MODES as readonly string[]).includes(rawMode)) {
    die(`unknown mode '${rawMode}' — valid: both, light, dark`);
  }
  const format = rawFormat as CliFormat;
  const mode   = rawMode   as CliMode;

  // ── Validate generation options ──
  if (harmony  && !VALID_HARMONIES.includes(harmony as ColorHarmony)) {
    die(`unknown harmony '${harmony}' — valid: ${VALID_HARMONIES.join(", ")}`);
  }
  if (spacing  && !VALID_SPACING.includes(spacing)) {
    die(`unknown spacing preset '${spacing}' — valid: ${VALID_SPACING.join(", ")}`);
  }
  if (radius   && !VALID_RADIUS.includes(radius)) {
    die(`unknown radius preset '${radius}' — valid: ${VALID_RADIUS.join(", ")}`);
  }
  if (fontSize && !VALID_FONTSIZE.includes(fontSize)) {
    die(`unknown font-size preset '${fontSize}' — valid: ${VALID_FONTSIZE.join(", ")}`);
  }

  let baseFont: number | undefined;
  if (rawBase !== undefined) {
    baseFont = Number(rawBase);
    if (!Number.isFinite(baseFont)) die("--base-font must be a finite number");
  }

  let fontScale: number | FontScaleName | undefined;
  if (rawScale !== undefined) {
    const asNum = Number(rawScale);
    if (Number.isFinite(asNum)) {
      fontScale = asNum;
    } else if (NAMED_FONT_SCALES.includes(rawScale as FontScaleName)) {
      fontScale = rawScale as FontScaleName;
    } else {
      die(`unknown font scale '${rawScale}' — valid names: ${NAMED_FONT_SCALES.join(", ")}`);
    }
  }

  // ── Build GenerateThemeOptions ──
  const options: GenerateThemeOptions = {};
  if (primary)              options.primary   = primary;
  if (preset)               options.preset    = preset    as GenerateThemeOptions["preset"];
  if (harmony)              options.harmony   = harmony   as ColorHarmony;
  if (spacing)              options.spacing   = spacing   as GenerateThemeOptions["spacing"];
  if (radius)               options.radius    = radius    as GenerateThemeOptions["radius"];
  if (fontSize)             options.fontSize  = fontSize  as GenerateThemeOptions["fontSize"];
  if (baseFont  !== undefined) options.baseFont  = baseFont;
  if (fontScale !== undefined) options.fontScale = fontScale;

  // ── Generate ──
  let theme: GeneratedTheme;
  try {
    theme = generateTheme(options);
  } catch (e) {
    err(`salt-theme-gen: ${(e as Error).message}\n`);
    process.exit(1);
  }

  if (theme.warnings) warnTheme(theme.warnings, quiet);
  writeOutput(applyFormat(theme, format, mode), outFile);
}

// ─── Shared I/O helpers ───────────────────────────────────────────────

/** Read from a file path or stdin (when source is "-"). Exits 2 on failure. */
function readInput(source: string): string {
  try {
    return source === "-"
      ? readFileSync(0, "utf8")
      : readFileSync(source, "utf8");
  } catch (e) {
    die(`cannot read '${source}': ${(e as Error).message}`);
  }
}

/**
 * Read, JSON-parse, and validate a GeneratedTheme from a file or stdin.
 * Prints token diagnostics to stderr. Exits 2 on I/O or JSON errors.
 * Exits 1 if any tokenWarnings have severity "error".
 */
function loadTheme(source: string, quiet: boolean): GeneratedTheme {
  const raw = readInput(source);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    err(`salt-theme-gen: '${source === "-" ? "stdin" : source}' is not valid JSON\n`);
    process.exit(2);
  }
  try {
    const { theme, tokenWarnings } = parseThemeJSON(parsed as object);
    const errors   = tokenWarnings.filter(w => w.severity === "error");
    const warnings = tokenWarnings.filter(w => w.severity === "warning");
    if (!quiet) {
      for (const w of errors)   err(`error [token] ${w.path}: ${w.message}\n`);
      for (const w of warnings) err(`warning [token] ${w.path}: ${w.message}\n`);
    }
    if (errors.length > 0) {
      err(`salt-theme-gen: theme has ${errors.length} token error${errors.length === 1 ? "" : "s"} — refusing to process\n`);
      process.exit(1);
    }
    return theme;
  } catch (e) {
    err(`salt-theme-gen: ${(e as Error).message}\n`);
    process.exit(2);
  }
}

// ─── export ───────────────────────────────────────────────────────────

function runExport(argv: string[]): void {
  if (hasHelp(argv)) { out(EXPORT_HELP); process.exit(0); }

  const { values: v, positionals } = cliParse(argv, {
    format:  { type: "string" },
    mode:    { type: "string" },
    out:     { type: "string" },
    quiet:   { type: "boolean" },
    silent:  { type: "boolean" },
  }, true);

  if (positionals.length === 0) die("export requires <file>");
  if (positionals.length > 1)   die("export accepts exactly one <file> argument");

  const source    = positionals[0];
  const rawFormat = v["format"] as string | undefined;
  const rawMode   = (v["mode"] as string | undefined) ?? "both";
  const outFile   = v["out"]   as string | undefined;
  const quiet     = v["quiet"] === true || v["silent"] === true;

  if (!rawFormat) die("export requires --format <name>");
  if (!(VALID_FORMATS as readonly string[]).includes(rawFormat)) {
    die(`unknown format '${rawFormat}' — valid: ${VALID_FORMATS.join(", ")}`);
  }
  if (!(VALID_MODES as readonly string[]).includes(rawMode)) {
    die(`unknown mode '${rawMode}' — valid: both, light, dark`);
  }
  const format = rawFormat as CliFormat;
  const mode   = rawMode   as CliMode;

  const theme = loadTheme(source, quiet);
  writeOutput(applyFormat(theme, format, mode), outFile);
}

// ─── validate ─────────────────────────────────────────────────────────

function runValidate(argv: string[]): void {
  if (hasHelp(argv)) { out(VALIDATE_HELP); process.exit(0); }

  const { values: v, positionals } = cliParse(argv, {
    quiet:  { type: "boolean" },
    silent: { type: "boolean" },
  }, true);

  if (positionals.length === 0) die("validate requires <file>");
  if (positionals.length > 1)   die("validate accepts exactly one <file> argument");

  const source = positionals[0];
  const quiet  = v["quiet"] === true || v["silent"] === true;

  const raw = readInput(source);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    err(`salt-theme-gen: '${source === "-" ? "stdin" : source}' is not valid JSON\n`);
    process.exit(2);
  }

  let tokenWarnings: ReturnType<typeof parseThemeJSON>["tokenWarnings"];
  try {
    ({ tokenWarnings } = parseThemeJSON(parsed as object));
  } catch (e) {
    err(`salt-theme-gen: ${(e as Error).message}\n`);
    process.exit(1);
  }

  const errors   = tokenWarnings.filter(w => w.severity === "error");
  const warnings = tokenWarnings.filter(w => w.severity === "warning");

  if (!quiet) {
    for (const w of errors)   err(`error [token] ${w.path}: ${w.message}\n`);
    for (const w of warnings) err(`warning [token] ${w.path}: ${w.message}\n`);
  }

  if (errors.length > 0) {
    const e = errors.length;
    out(`invalid: ${e} error${e === 1 ? "" : "s"}${warnings.length > 0 ? `, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}` : ""}\n`);
    process.exit(1);
  }

  const wCount = warnings.length;
  out(`valid${wCount > 0 ? ` (${wCount} warning${wCount === 1 ? "" : "s"})` : ""}\n`);
}

// ─── diff ─────────────────────────────────────────────────────────────

function runDiff(argv: string[]): void {
  if (hasHelp(argv)) { out(DIFF_HELP); process.exit(0); }

  const { values: v, positionals } = cliParse(argv, {
    json:   { type: "boolean" },
    quiet:  { type: "boolean" },
    silent: { type: "boolean" },
  }, true);

  if (positionals.length < 2) die("diff requires <old> <new>");
  if (positionals.length > 2) die("diff accepts exactly two file arguments");

  const quiet   = v["quiet"] === true || v["silent"] === true;
  const asJson  = v["json"]  === true;

  const oldTheme = loadTheme(positionals[0], quiet);
  const newTheme = loadTheme(positionals[1], quiet);

  const diff = diffTheme(oldTheme, newTheme);

  if (asJson) {
    writeOutput(JSON.stringify(diff, null, 2));
  } else {
    const lines = flattenDiff(diff);
    if (lines.length === 0) {
      out("no differences\n");
    } else {
      writeOutput(lines.join("\n"));
    }
  }

  process.exit(diff.identical ? 0 : 1);
}

/** Recursively collect `old → new` change lines from a ThemeDiff. */
function flattenDiff(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [];
  const lines: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k === "identical") continue;
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && "old" in v && "new" in v) {
      const change = v as { old: unknown; new: unknown };
      lines.push(`${path}: ${JSON.stringify(change.old)} → ${JSON.stringify(change.new)}`);
    } else {
      lines.push(...flattenDiff(v, path));
    }
  }
  return lines;
}

// ─── simulate ─────────────────────────────────────────────────────────

const VALID_CVD_TYPES: ColorBlindnessType[] = [
  "protanopia", "deuteranopia", "tritanopia",
  "protanomaly", "deuteranomaly", "tritanomaly",
  "achromatopsia",
];

function runSimulate(argv: string[]): void {
  if (hasHelp(argv)) { out(SIMULATE_HELP); process.exit(0); }

  const { values: v, positionals } = cliParse(argv, {
    type:         { type: "string" },
    primary:      { type: "string" },
    preset:       { type: "string" },
    harmony:      { type: "string" },
    spacing:      { type: "string" },
    radius:       { type: "string" },
    "font-size":  { type: "string" },
    "base-font":  { type: "string" },
    "font-scale": { type: "string" },
    format:       { type: "string" },
    out:          { type: "string" },
    quiet:        { type: "boolean" },
    silent:       { type: "boolean" },
  }, true);

  const rawType  = v["type"]   as string | undefined;
  const rawFormat = (v["format"] as string | undefined) ?? "json";
  const outFile  = v["out"]    as string | undefined;
  const quiet    = v["quiet"] === true || v["silent"] === true;

  if (!rawType) die("simulate requires --type <cvd>");
  if (!VALID_CVD_TYPES.includes(rawType as ColorBlindnessType)) {
    die(`unknown CVD type '${rawType}' — valid: ${VALID_CVD_TYPES.join(", ")}`);
  }
  const cvdType = rawType as ColorBlindnessType;

  if (!(VALID_FORMATS as readonly string[]).includes(rawFormat)) {
    die(`unknown format '${rawFormat}' — valid: ${VALID_FORMATS.join(", ")}`);
  }
  const format = rawFormat as CliFormat;

  let theme: GeneratedTheme;
  if (positionals.length > 0) {
    if (positionals.length > 1) die("simulate accepts at most one <file> argument");
    theme = loadTheme(positionals[0], quiet);
  } else {
    // Generate from flags
    const primary  = v["primary"] as string | undefined;
    const preset   = v["preset"]  as string | undefined;
    if (!primary && !preset) die("simulate requires <file>, --primary <hex>, or --preset <name>");
    if (primary && preset)   die("--primary and --preset are mutually exclusive");

    const options: GenerateThemeOptions = {};
    if (primary)  options.primary  = primary;
    if (preset)   options.preset   = preset as GenerateThemeOptions["preset"];
    if (v["harmony"])    options.harmony   = v["harmony"]   as ColorHarmony;
    if (v["spacing"])    options.spacing   = v["spacing"]   as GenerateThemeOptions["spacing"];
    if (v["radius"])     options.radius    = v["radius"]    as GenerateThemeOptions["radius"];
    if (v["font-size"])  options.fontSize  = v["font-size"] as GenerateThemeOptions["fontSize"];
    if (v["base-font"])  options.baseFont  = Number(v["base-font"]);
    if (v["font-scale"]) {
      const rawScale = v["font-scale"] as string;
      const asNum = Number(rawScale);
      options.fontScale = Number.isFinite(asNum) ? asNum : rawScale as FontScaleName;
    }
    try {
      theme = generateTheme(options);
    } catch (e) {
      err(`salt-theme-gen: ${(e as Error).message}\n`);
      process.exit(1);
    }
    if (theme.warnings) warnTheme(theme.warnings, quiet);
  }

  const simulated = simulateTheme(theme, cvdType);
  writeOutput(applyFormat(simulated, format, "both"), outFile);
}

// ─── adjust ───────────────────────────────────────────────────────────

function runAdjust(argv: string[]): void {
  if (hasHelp(argv)) { out(ADJUST_HELP); process.exit(0); }

  const { values: v, positionals } = cliParse(argv, {
    overrides: { type: "string" },
    format:    { type: "string" },
    out:       { type: "string" },
    quiet:     { type: "boolean" },
    silent:    { type: "boolean" },
  }, true);

  if (positionals.length === 0) die("adjust requires <file>");
  if (positionals.length > 1)   die("adjust accepts exactly one <file> argument");

  const source        = positionals[0];
  const overridesFile = v["overrides"] as string | undefined;
  const rawFormat     = (v["format"]   as string | undefined) ?? "json";
  const outFile       = v["out"]       as string | undefined;
  const quiet         = v["quiet"] === true || v["silent"] === true;

  if (!(VALID_FORMATS as readonly string[]).includes(rawFormat)) {
    die(`unknown format '${rawFormat}' — valid: ${VALID_FORMATS.join(", ")}`);
  }
  const format = rawFormat as CliFormat;

  // Overrides: explicit file, or stdin. When theme source is already stdin,
  // overrides cannot also come from stdin.
  const overridesSource = overridesFile ?? "-";
  if (source === "-" && overridesSource === "-") {
    die("cannot read both theme and overrides from stdin — provide one as a file");
  }

  const theme = loadTheme(source, quiet);

  const rawOverrides = readInput(overridesSource);
  let overrides: ThemeOverrides;
  try {
    overrides = JSON.parse(rawOverrides) as ThemeOverrides;
  } catch {
    die(`overrides is not valid JSON`);
  }

  let adjusted: GeneratedTheme;
  try {
    adjusted = adjustTheme(theme, overrides);
  } catch (e) {
    err(`salt-theme-gen: ${(e as Error).message}\n`);
    process.exit(1);
  }

  if (adjusted.warnings) warnTheme(adjusted.warnings, quiet);
  writeOutput(applyFormat(adjusted, format, "both"), outFile);
}

// ─── Utilities ────────────────────────────────────────────────────────

function hasHelp(argv: string[]): boolean {
  return argv.includes("--help") || argv.includes("-h");
}

// ─── Entry point ──────────────────────────────────────────────────────

function main(): void {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    out(GLOBAL_HELP);
    process.exit(0);
  }

  if (argv[0] === "--version" || argv[0] === "-v") {
    out(VERSION + "\n");
    process.exit(0);
  }

  const cmd = argv[0];
  const rest = argv.slice(1);

  if (!(COMMANDS as readonly string[]).includes(cmd)) {
    die(`unknown command '${cmd}'`);
  }

  switch (cmd as Command) {
    case "generate": runGenerate(rest); break;
    case "export":   runExport(rest);   break;
    case "validate": runValidate(rest); break;
    case "diff":     runDiff(rest);     break;
    case "simulate": runSimulate(rest); break;
    case "adjust":   runAdjust(rest);   break;
  }
}

main();
