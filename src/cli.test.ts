import { describe, it, expect, beforeAll } from "vitest";
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateTheme } from "./generate-theme";
import { VERSION } from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────

const CLI = join(__dirname, "../dist/cjs/cli.js");

function cli(
  args: string[],
  { stdin, cwd }: { stdin?: string; cwd?: string } = {},
): { stdout: string; stderr: string; status: number } {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    input:    stdin,
    encoding: "utf8",
    cwd:      cwd ?? process.cwd(),
    timeout:  10_000,
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status ?? 1,
  };
}

function tmpFile(content: string, ext = ".json"): string {
  const p = join(tmpdir(), `salt-cli-test-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  writeFileSync(p, content, "utf8");
  return p;
}

// ─── Global setup ─────────────────────────────────────────────────────

let themeFile: string;
let theme2File: string;

beforeAll(() => {
  const t1 = generateTheme({ primary: "#2563eb" });
  const t2 = generateTheme({ primary: "#dc2626" });
  themeFile  = tmpFile(JSON.stringify(t1));
  theme2File = tmpFile(JSON.stringify(t2));
});

// ─── Global flags ─────────────────────────────────────────────────────

describe("global flags", () => {
  it("--version prints version and exits 0", () => {
    const r = cli(["--version"]);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe(VERSION);
  });

  it("-v is alias for --version", () => {
    const r = cli(["-v"]);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe(VERSION);
  });

  it("--help prints usage and exits 0", () => {
    const r = cli(["--help"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("salt-theme-gen");
    expect(r.stdout).toContain("generate");
    expect(r.stdout).toContain("export");
  });

  it("-h is alias for --help", () => {
    expect(cli(["-h"]).status).toBe(0);
  });

  it("no args prints help and exits 0", () => {
    const r = cli([]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Usage:");
  });

  it("unknown command exits 2", () => {
    const r = cli(["frobnicate"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("unknown command");
  });
});

// ─── generate ─────────────────────────────────────────────────────────

describe("generate", () => {
  it("--primary produces valid JSON by default", () => {
    const r = cli(["generate", "--primary", "#2563eb"]);
    expect(r.status).toBe(0);
    const t = JSON.parse(r.stdout) as { schemaVersion: string; light: { colors: { primary: string } } };
    expect(t.schemaVersion).toBe("2.0");
    expect(t.light.colors.primary).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("--preset ocean produces valid JSON", () => {
    const r = cli(["generate", "--preset", "ocean"]);
    expect(r.status).toBe(0);
    const t = JSON.parse(r.stdout) as { schemaVersion: string };
    expect(t.schemaVersion).toBe("2.0");
  });

  it("--format css produces CSS custom properties", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "css"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--salt-color-primary:");
  });

  it("--format scss produces SCSS variables", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "scss"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("$salt-color-primary:");
  });

  it("--format tailwind produces JSON with salt- colors", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "tailwind"]);
    expect(r.status).toBe(0);
    const cfg = JSON.parse(r.stdout) as { colors: Record<string, string> };
    expect(cfg.colors["salt-primary"]).toBeDefined();
  });

  it("--format dtcg produces DTCG token tree", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "dtcg"]);
    expect(r.status).toBe(0);
    const tokens = JSON.parse(r.stdout) as { light: unknown; dark: unknown };
    expect(tokens.light).toBeDefined();
    expect(tokens.dark).toBeDefined();
  });

  it("--format shadcn produces @theme block", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "shadcn"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("@theme");
  });

  it("--format panda produces panda config JSON", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "panda"]);
    expect(r.status).toBe(0);
    const cfg = JSON.parse(r.stdout) as { tokens: unknown };
    expect(cfg.tokens).toBeDefined();
  });

  it("--format figma produces Figma Variables payload", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "figma"]);
    expect(r.status).toBe(0);
    const payload = JSON.parse(r.stdout) as { variableCollections: unknown[]; variables: unknown[] };
    expect(Array.isArray(payload.variableCollections)).toBe(true);
    expect(Array.isArray(payload.variables)).toBe(true);
  });

  it("--format flutter produces Dart class", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "flutter"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Color(");
  });

  it("--format swiftui produces Swift enum", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "swiftui"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Color(red:");
  });

  it("--mode light emits light variables only, no .dark block", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "css", "--mode", "light"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--salt-color-primary:");
    expect(r.stdout).not.toContain(".dark");
  });

  it("--mode dark emits dark variables only, no :root block", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "css", "--mode", "dark"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--salt-color-primary:");
    expect(r.stdout).not.toContain(":root");
  });

  it("--mode both (default) emits :root and dark selectors", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "css"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(":root");
    expect(r.stdout).toContain("dark");
  });

  it("--out writes to file", () => {
    const out = join(tmpdir(), `salt-cli-out-${Date.now()}.json`);
    const r = cli(["generate", "--primary", "#2563eb", "--out", out]);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
    const { readFileSync } = require("fs") as typeof import("fs");
    const t = JSON.parse(readFileSync(out, "utf8")) as { schemaVersion: string };
    expect(t.schemaVersion).toBe("2.0");
    unlinkSync(out);
  });

  it("missing color source exits 2", () => {
    const r = cli(["generate"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("requires --primary");
  });

  it("--primary and --preset together exits 2", () => {
    const r = cli(["generate", "--primary", "#fff", "--preset", "ocean"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("mutually exclusive");
  });

  it("unknown format exits 2", () => {
    const r = cli(["generate", "--primary", "#fff", "--format", "toml"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("unknown format");
  });

  it("unknown flag exits 2", () => {
    const r = cli(["generate", "--primary", "#fff", "--nope"]);
    expect(r.status).toBe(2);
  });

  it("generate --help exits 0", () => {
    const r = cli(["generate", "--help"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--primary");
  });
});

// ─── export ───────────────────────────────────────────────────────────

describe("export", () => {
  it("converts JSON theme to CSS", () => {
    const r = cli(["export", themeFile, "--format", "css"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--salt-color-primary:");
  });

  it("converts JSON theme to tailwind", () => {
    const r = cli(["export", themeFile, "--format", "tailwind"]);
    expect(r.status).toBe(0);
    const cfg = JSON.parse(r.stdout) as { colors: Record<string, string> };
    expect(cfg.colors["salt-primary"]).toBeDefined();
  });

  it("reads from stdin when <file> is -", () => {
    const theme = generateTheme({ primary: "#2563eb" });
    const r = cli(["export", "-", "--format", "css"], { stdin: JSON.stringify(theme) });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--salt-color-primary:");
  });

  it("missing --format exits 2", () => {
    const r = cli(["export", themeFile]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("requires --format");
  });

  it("missing <file> exits 2", () => {
    const r = cli(["export", "--format", "css"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("requires <file>");
  });

  it("bad JSON file exits 2", () => {
    const bad = tmpFile("not-json");
    const r = cli(["export", bad, "--format", "css"]);
    expect(r.status).toBe(2);
    unlinkSync(bad);
  });

  it("theme with token errors exits 1", () => {
    const theme = generateTheme({ primary: "#2563eb" });
    (theme.tokens.spacing as Record<string, number>).md = -20;
    const bad = tmpFile(JSON.stringify(theme));
    const r = cli(["export", bad, "--format", "css"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("error [token]");
    unlinkSync(bad);
  });

  it("export --help exits 0", () => {
    expect(cli(["export", "--help"]).status).toBe(0);
  });
});

// ─── validate ─────────────────────────────────────────────────────────

describe("validate", () => {
  it("valid theme prints 'valid' and exits 0", () => {
    const r = cli(["validate", themeFile]);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe("valid");
  });

  it("reads from stdin when <file> is -", () => {
    const theme = generateTheme({ primary: "#2563eb" });
    const r = cli(["validate", "-"], { stdin: JSON.stringify(theme) });
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe("valid");
  });

  it("invalid JSON exits 2", () => {
    const bad = tmpFile("not-json");
    const r = cli(["validate", bad]);
    expect(r.status).toBe(2);
    unlinkSync(bad);
  });

  it("wrong shape exits 1", () => {
    const bad = tmpFile(JSON.stringify({ schemaVersion: "2.0" }));
    const r = cli(["validate", bad]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("salt-theme-gen:");
    unlinkSync(bad);
  });

  it("missing <file> exits 2", () => {
    const r = cli(["validate"]);
    expect(r.status).toBe(2);
  });

  it("theme with severity:error token warnings exits 1", () => {
    const theme = generateTheme({ primary: "#2563eb" });
    (theme.tokens.spacing as Record<string, number>).md = -20;
    const bad = tmpFile(JSON.stringify(theme));
    const r = cli(["validate", bad]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("invalid");
    expect(r.stderr).toContain("error [token]");
    unlinkSync(bad);
  });

  it("severity:error exits 1 even with --quiet (stdout still reports invalid)", () => {
    const theme = generateTheme({ primary: "#2563eb" });
    (theme.tokens.spacing as Record<string, number>).md = -20;
    const bad = tmpFile(JSON.stringify(theme));
    const r = cli(["validate", bad, "--quiet"]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("invalid");
    expect(r.stderr).toBe("");
    unlinkSync(bad);
  });

  it("--quiet suppresses token warnings on stderr", () => {
    const r = cli(["validate", themeFile, "--quiet"]);
    expect(r.status).toBe(0);
    expect(r.stderr).toBe("");
  });

  it("validate --help exits 0", () => {
    expect(cli(["validate", "--help"]).status).toBe(0);
  });
});

// ─── diff ─────────────────────────────────────────────────────────────

describe("diff", () => {
  it("two different themes exits 1 with change lines", () => {
    const r = cli(["diff", themeFile, theme2File]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("→");
  });

  it("same theme twice exits 0", () => {
    const r = cli(["diff", themeFile, themeFile]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("no differences");
  });

  it("--json flag emits machine-readable JSON", () => {
    const r = cli(["diff", themeFile, theme2File, "--json"]);
    expect(r.status).toBe(1);
    const d = JSON.parse(r.stdout) as { identical: boolean };
    expect(d.identical).toBe(false);
  });

  it("same theme with --json exits 0 and identical:true", () => {
    const r = cli(["diff", themeFile, themeFile, "--json"]);
    expect(r.status).toBe(0);
    const d = JSON.parse(r.stdout) as { identical: boolean };
    expect(d.identical).toBe(true);
  });

  it("missing second file exits 2", () => {
    const r = cli(["diff", themeFile]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("requires <old> <new>");
  });

  it("theme with token errors exits 1", () => {
    const theme = generateTheme({ primary: "#2563eb" });
    (theme.tokens.spacing as Record<string, number>).md = -20;
    const bad = tmpFile(JSON.stringify(theme));
    const r = cli(["diff", bad, themeFile]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("error [token]");
    unlinkSync(bad);
  });

  it("diff --help exits 0", () => {
    expect(cli(["diff", "--help"]).status).toBe(0);
  });
});

// ─── simulate ─────────────────────────────────────────────────────────

describe("simulate", () => {
  it("from file, produces valid JSON theme", () => {
    const r = cli(["simulate", themeFile, "--type", "deuteranopia"]);
    expect(r.status).toBe(0);
    const t = JSON.parse(r.stdout) as { schemaVersion: string };
    expect(t.schemaVersion).toBe("2.0");
  });

  it("from --primary flag", () => {
    const r = cli(["simulate", "--primary", "#2563eb", "--type", "protanopia"]);
    expect(r.status).toBe(0);
    const t = JSON.parse(r.stdout) as { schemaVersion: string };
    expect(t.schemaVersion).toBe("2.0");
  });

  it("produces different colors than the original", () => {
    const r = cli(["simulate", themeFile, "--type", "achromatopsia"]);
    expect(r.status).toBe(0);
    const sim = JSON.parse(r.stdout) as { light: { colors: { primary: string } } };
    const orig = generateTheme({ primary: "#2563eb" });
    expect(sim.light.colors.primary).not.toBe(orig.light.colors.primary);
  });

  it("accepts all 7 CVD types", () => {
    const types = ["protanopia","deuteranopia","tritanopia","protanomaly","deuteranomaly","tritanomaly","achromatopsia"];
    for (const t of types) {
      const r = cli(["simulate", themeFile, "--type", t]);
      expect(r.status, `type=${t}`).toBe(0);
    }
  });

  it("--format css output", () => {
    const r = cli(["simulate", themeFile, "--type", "deuteranopia", "--format", "css"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--salt-color-primary:");
  });

  it("missing --type exits 2", () => {
    const r = cli(["simulate", themeFile]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("requires --type");
  });

  it("unknown CVD type exits 2", () => {
    const r = cli(["simulate", themeFile, "--type", "nightblindness"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("unknown CVD type");
  });

  it("no file and no --primary exits 2", () => {
    const r = cli(["simulate", "--type", "protanopia"]);
    expect(r.status).toBe(2);
  });

  it("theme with token errors exits 1", () => {
    const theme = generateTheme({ primary: "#2563eb" });
    (theme.tokens.spacing as Record<string, number>).md = -20;
    const bad = tmpFile(JSON.stringify(theme));
    const r = cli(["simulate", bad, "--type", "deuteranopia"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("error [token]");
    unlinkSync(bad);
  });

  it("--mode dark emits dark variables only", () => {
    const r = cli(["simulate", themeFile, "--type", "deuteranopia", "--format", "css", "--mode", "dark"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--salt-color-primary:");
    expect(r.stdout).not.toContain(":root");
  });

  it("--mode light emits light variables only", () => {
    const r = cli(["simulate", themeFile, "--type", "deuteranopia", "--format", "css", "--mode", "light"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--salt-color-primary:");
    expect(r.stdout).not.toContain("dark");
  });

  it("simulate --help exits 0", () => {
    expect(cli(["simulate", "--help"]).status).toBe(0);
  });
});

// ─── adjust ───────────────────────────────────────────────────────────

describe("adjust", () => {
  it("overrides primary via --overrides file", () => {
    const overrides = tmpFile(JSON.stringify({ both: { colors: { primary: "#ff6600" } } }));
    const r = cli(["adjust", themeFile, "--overrides", overrides]);
    expect(r.status).toBe(0);
    const t = JSON.parse(r.stdout) as { light: { colors: { primary: string } } };
    expect(t.light.colors.primary).toBe("#ff6600");
    unlinkSync(overrides);
  });

  it("overrides via stdin when --overrides is omitted", () => {
    const overrides = JSON.stringify({ both: { colors: { primary: "#9900ff" } } });
    const r = cli(["adjust", themeFile], { stdin: overrides });
    expect(r.status).toBe(0);
    const t = JSON.parse(r.stdout) as { light: { colors: { primary: string } } };
    expect(t.light.colors.primary).toBe("#9900ff");
  });

  it("empty overrides {} returns unchanged theme", () => {
    const overrides = tmpFile("{}");
    const r = cli(["adjust", themeFile, "--overrides", overrides]);
    expect(r.status).toBe(0);
    const orig = generateTheme({ primary: "#2563eb" });
    const adj  = JSON.parse(r.stdout) as { light: { colors: { primary: string } } };
    expect(adj.light.colors.primary).toBe(orig.light.colors.primary);
    unlinkSync(overrides);
  });

  it("token overrides change spacing", () => {
    const overrides = tmpFile(JSON.stringify({ tokens: { spacing: { md: 999 } } }));
    const r = cli(["adjust", themeFile, "--overrides", overrides]);
    expect(r.status).toBe(0);
    const t = JSON.parse(r.stdout) as { tokens: { spacing: { md: number } } };
    expect(t.tokens.spacing.md).toBe(999);
    unlinkSync(overrides);
  });

  it("--format css produces CSS output", () => {
    const overrides = tmpFile("{}");
    const r = cli(["adjust", themeFile, "--overrides", overrides, "--format", "css"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--salt-color-primary:");
    unlinkSync(overrides);
  });

  it("theme from stdin with overrides file", () => {
    const theme   = generateTheme({ primary: "#2563eb" });
    const overrides = tmpFile(JSON.stringify({ both: { colors: { primary: "#123456" } } }));
    const r = cli(["adjust", "-", "--overrides", overrides], { stdin: JSON.stringify(theme) });
    expect(r.status).toBe(0);
    const t = JSON.parse(r.stdout) as { light: { colors: { primary: string } } };
    expect(t.light.colors.primary).toBe("#123456");
    unlinkSync(overrides);
  });

  it("both theme and overrides as stdin exits 2", () => {
    const r = cli(["adjust", "-"], { stdin: "{}" });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("cannot read both");
  });

  it("missing <file> exits 2", () => {
    expect(cli(["adjust"]).status).toBe(2);
  });

  it("invalid overrides JSON exits 2", () => {
    const overrides = tmpFile("not-json");
    const r = cli(["adjust", themeFile, "--overrides", overrides]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("not valid JSON");
    unlinkSync(overrides);
  });

  it("theme with token errors exits 1", () => {
    const theme = generateTheme({ primary: "#2563eb" });
    (theme.tokens.spacing as Record<string, number>).md = -20;
    const bad = tmpFile(JSON.stringify(theme));
    const r = cli(["adjust", bad], { stdin: "{}" });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("error [token]");
    unlinkSync(bad);
  });

  it("--mode dark emits dark CSS only", () => {
    const overrides = tmpFile("{}");
    const r = cli(["adjust", themeFile, "--overrides", overrides, "--format", "css", "--mode", "dark"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--salt-color-primary:");
    expect(r.stdout).not.toContain(":root");
    unlinkSync(overrides);
  });

  it("--mode light emits light CSS only", () => {
    const overrides = tmpFile("{}");
    const r = cli(["adjust", themeFile, "--overrides", overrides, "--format", "css", "--mode", "light"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("--salt-color-primary:");
    expect(r.stdout).not.toContain("dark");
    unlinkSync(overrides);
  });

  it("adjust --help exits 0", () => {
    expect(cli(["adjust", "--help"]).status).toBe(0);
  });
});

// ─── Output contract ──────────────────────────────────────────────────

describe("output contract", () => {
  it("stdout always ends with a newline", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--format", "css"]);
    expect(r.stdout.endsWith("\n")).toBe(true);
  });

  it("json output ends with a newline", () => {
    const r = cli(["generate", "--primary", "#2563eb"]);
    expect(r.stdout.endsWith("\n")).toBe(true);
  });

  it("errors go to stderr, not stdout", () => {
    const r = cli(["generate"]);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain("salt-theme-gen:");
  });

  it("--quiet suppresses all stderr warnings", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--quiet"]);
    expect(r.stderr).toBe("");
  });

  it("--silent is alias for --quiet", () => {
    const r = cli(["generate", "--primary", "#2563eb", "--silent"]);
    expect(r.stderr).toBe("");
  });
});
