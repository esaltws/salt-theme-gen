import { hexToOklch } from "./color-math.js";
import type { GeneratedTheme, GeneratedThemeColors, TonalStep } from "./types.js";

// ─── Public types ─────────────────────────────────────────────────────

/** Named neutral base colors matching shadcn/ui's base color presets. */
export type ShadcnBaseColor = "neutral" | "zinc" | "stone" | "mauve" | "olive" | "mist" | "taupe";

export type ShadcnThemeOptions = {
  /**
   * Override neutral tokens (background, muted, border, card, sidebar, etc.)
   * with a shadcn-compatible base color, independent of the brand primary.
   */
  baseColor?: ShadcnBaseColor;
  /** Emit --palette-{intent}-{step} tonal tokens (8 × 11 per mode). Default: false */
  includePalettes?: boolean;
};

export type ShadcnThemeResult = {
  /** Complete ready-to-paste CSS: @theme inline + :root + .dark + @layer base */
  css: string;
  /** Declarations inside :root — includes --radius and all light-mode colors */
  light: string;
  /** Declarations inside .dark — color tokens only */
  dark: string;
};

// ─── Base color specs ─────────────────────────────────────────────────
// Each named base maps to a hue and a low chroma for tinted neutral grays.
// Neutral has zero chroma (pure gray). All others use just enough chroma to
// give the grays a perceptible tint.

type BaseColorSpec = { hue: number; chromaLight: number; chromaDark: number };

const BASE_COLOR_SPECS: Record<ShadcnBaseColor, BaseColorSpec> = {
  neutral: { hue:   0, chromaLight: 0,     chromaDark: 0     },
  zinc:    { hue: 240, chromaLight: 0.004, chromaDark: 0.006 },
  stone:   { hue:  60, chromaLight: 0.006, chromaDark: 0.008 },
  mauve:   { hue: 300, chromaLight: 0.006, chromaDark: 0.008 },
  olive:   { hue: 120, chromaLight: 0.005, chromaDark: 0.007 },
  mist:    { hue: 210, chromaLight: 0.005, chromaDark: 0.007 },
  taupe:   { hue:  30, chromaLight: 0.006, chromaDark: 0.008 },
};

// ─── Internal types ───────────────────────────────────────────────────

type BaseNeutrals = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────

// shadcn uses decimal oklch: oklch(0.145 0.006 220.000)
// salt's existing oklchCss() uses percentage — this produces the shadcn format
function oklchDecimal(hex: string): string {
  const { L, C, H } = hexToOklch(hex);
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(3)})`;
}

// Direct OKLCH decimal without going through hex — used for base neutrals
function neutralOklch(L: number, C: number, H: number): string {
  const l = Math.max(0, Math.min(1, L));
  const c = Math.max(0, Math.min(0.4, C));
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${H.toFixed(3)})`;
}

function rem(px: number): string {
  if (px === 0) return "0";
  return `${parseFloat((px / 16).toFixed(4))}rem`;
}

function ind(lines: string[]): string {
  return lines.map((l) => `  ${l}`).join("\n");
}

// ─── Base neutral derivation ──────────────────────────────────────────
// Light and dark neutral scales for each named base color.
// Lightness levels match shadcn's default neutral theme structure.

function resolveBaseNeutrals(mode: "light" | "dark", spec: BaseColorSpec): BaseNeutrals {
  const h = spec.hue;
  const c = mode === "light" ? spec.chromaLight : spec.chromaDark;

  if (mode === "light") {
    return {
      background:              neutralOklch(0.990, c,     h),
      foreground:              neutralOklch(0.130, c,     h),
      card:                    neutralOklch(1.000, 0,     h),
      cardForeground:          neutralOklch(0.130, c,     h),
      popover:                 neutralOklch(1.000, 0,     h),
      popoverForeground:       neutralOklch(0.130, c,     h),
      muted:                   neutralOklch(0.970, c,     h),
      mutedForeground:         neutralOklch(0.556, c,     h),
      border:                  neutralOklch(0.922, c,     h),
      input:                   neutralOklch(0.922, c,     h),
      sidebar:                 neutralOklch(0.985, c,     h),
      sidebarForeground:       neutralOklch(0.145, c,     h),
      sidebarAccent:           neutralOklch(0.970, c,     h),
      sidebarAccentForeground: neutralOklch(0.205, c,     h),
      sidebarBorder:           neutralOklch(0.922, c,     h),
    };
  }

  return {
    background:              neutralOklch(0.145, c,     h),
    foreground:              neutralOklch(0.985, c,     h),
    card:                    neutralOklch(0.205, c,     h),
    cardForeground:          neutralOklch(0.985, c,     h),
    popover:                 neutralOklch(0.205, c,     h),
    popoverForeground:       neutralOklch(0.985, c,     h),
    muted:                   neutralOklch(0.269, c,     h),
    mutedForeground:         neutralOklch(0.708, c,     h),
    border:                  neutralOklch(0.240, c,     h),
    input:                   neutralOklch(0.280, c,     h),
    sidebar:                 neutralOklch(0.205, c,     h),
    sidebarForeground:       neutralOklch(0.985, c,     h),
    sidebarAccent:           neutralOklch(0.269, c,     h),
    sidebarAccentForeground: neutralOklch(0.985, c,     h),
    sidebarBorder:           neutralOklch(0.240, c,     h),
  };
}

// ─── Constants ────────────────────────────────────────────────────────

const INTENTS = [
  "primary", "secondary", "tertiary", "quaternary",
  "danger", "success", "warning", "info",
] as const;

const STATES = ["hover", "pressed", "focused", "disabled"] as const;

const TONAL_STEPS: TonalStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// ─── @theme inline block ──────────────────────────────────────────────
// Static — maps CSS custom properties to Tailwind v4 utility classes.
// Does not depend on specific theme values.

function buildThemeInline(includePalettes: boolean): string {
  const lines: string[] = [];

  for (const token of [
    "background", "foreground",
    "card", "card-foreground",
    "popover", "popover-foreground",
    "primary", "primary-foreground",
    "secondary", "secondary-foreground",
    "muted", "muted-foreground",
    "accent", "accent-foreground",
    "destructive", "destructive-foreground",
    "border", "input", "ring",
    "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
    "sidebar", "sidebar-foreground",
    "sidebar-primary", "sidebar-primary-foreground",
    "sidebar-accent", "sidebar-accent-foreground",
    "sidebar-border", "sidebar-ring",
  ]) {
    lines.push(`--color-${token}: var(--${token});`);
  }

  // Radius scale — derived from single --radius base via calc() multipliers
  lines.push("");
  lines.push(`--radius-sm:  calc(var(--radius) * 0.6);`);
  lines.push(`--radius-md:  calc(var(--radius) * 0.8);`);
  lines.push(`--radius-lg:  var(--radius);`);
  lines.push(`--radius-xl:  calc(var(--radius) * 1.4);`);
  lines.push(`--radius-2xl: calc(var(--radius) * 1.8);`);
  lines.push(`--radius-3xl: calc(var(--radius) * 2.2);`);
  lines.push(`--radius-4xl: calc(var(--radius) * 2.6);`);

  // Salt extension intents
  lines.push("");
  for (const intent of ["success", "warning", "info", "quaternary"] as const) {
    lines.push(`--color-${intent}: var(--${intent});`);
    lines.push(`--color-${intent}-foreground: var(--${intent}-foreground);`);
  }

  // Intent state tokens
  lines.push("");
  for (const intent of INTENTS) {
    for (const state of STATES) {
      lines.push(`--color-${intent}-${state}: var(--${intent}-${state});`);
    }
  }

  if (includePalettes) {
    lines.push("");
    for (const intent of INTENTS) {
      for (const step of TONAL_STEPS) {
        lines.push(`--color-palette-${intent}-${step}: var(--palette-${intent}-${step});`);
      }
    }
  }

  return `@theme inline {\n${ind(lines)}\n}`;
}

// ─── Per-mode declarations ────────────────────────────────────────────

function buildColorDecls(
  mode: GeneratedThemeColors,
  modeKey: "light" | "dark",
  includeRadius: boolean,
  radiusRem: string,
  includePalettes: boolean,
  n: BaseNeutrals | null    // null → derive neutrals from salt theme
): string[] {
  const c = mode.colors;
  const e = mode.surfaceElevation;
  const s = mode.states;
  const p = mode.palettes;
  const lines: string[] = [];

  if (includeRadius) {
    lines.push(`--radius: ${radiusRem};`);
  }

  // Neutral tokens — overridden when baseColor is specified
  lines.push(`--background: ${n ? n.background : oklchDecimal(c.background)};`);
  lines.push(`--foreground: ${n ? n.foreground : oklchDecimal(c.onBackground)};`);
  lines.push(`--card: ${n ? n.card : oklchDecimal(e.card)};`);
  lines.push(`--card-foreground: ${n ? n.cardForeground : oklchDecimal(c.onBackground)};`);
  lines.push(`--popover: ${n ? n.popover : oklchDecimal(e.popover)};`);
  lines.push(`--popover-foreground: ${n ? n.popoverForeground : oklchDecimal(c.onBackground)};`);

  // Brand tokens — always from salt theme, never overridden by base color
  lines.push(`--primary: ${oklchDecimal(c.primary)};`);
  lines.push(`--primary-foreground: ${oklchDecimal(c.onPrimary)};`);
  lines.push(`--secondary: ${oklchDecimal(c.secondary)};`);
  lines.push(`--secondary-foreground: ${oklchDecimal(c.onSecondary)};`);
  lines.push(`--muted: ${n ? n.muted : oklchDecimal(c.muted)};`);
  lines.push(`--muted-foreground: ${n ? n.mutedForeground : oklchDecimal(c.onMuted)};`);
  lines.push(`--accent: ${oklchDecimal(c.tertiary)};`);
  lines.push(`--accent-foreground: ${oklchDecimal(c.onTertiary)};`);
  lines.push(`--destructive: ${oklchDecimal(c.danger)};`);
  lines.push(`--destructive-foreground: ${oklchDecimal(c.onDanger)};`);
  lines.push(`--border: ${n ? n.border : oklchDecimal(c.border)};`);
  lines.push(`--input: ${n ? n.input : oklchDecimal(c.input)};`);
  lines.push(`--ring: ${oklchDecimal(c.ring)};`);

  // Chart colors from tonal palettes at step 400
  lines.push(`--chart-1: ${oklchDecimal(p.primary[400])};`);
  lines.push(`--chart-2: ${oklchDecimal(p.secondary[400])};`);
  lines.push(`--chart-3: ${oklchDecimal(p.tertiary[400])};`);
  lines.push(`--chart-4: ${oklchDecimal(p.quaternary[400])};`);
  lines.push(`--chart-5: ${oklchDecimal(p.danger[400])};`);

  // Sidebar tokens
  lines.push(`--sidebar: ${n ? n.sidebar : oklchDecimal(c.surface)};`);
  lines.push(`--sidebar-foreground: ${n ? n.sidebarForeground : oklchDecimal(c.onSurface)};`);
  lines.push(`--sidebar-primary: ${oklchDecimal(c.primary)};`);
  lines.push(`--sidebar-primary-foreground: ${oklchDecimal(c.onPrimary)};`);
  lines.push(`--sidebar-accent: ${n ? n.sidebarAccent : oklchDecimal(e.card)};`);
  lines.push(`--sidebar-accent-foreground: ${n ? n.sidebarAccentForeground : oklchDecimal(c.onBackground)};`);
  lines.push(`--sidebar-border: ${n ? n.sidebarBorder : oklchDecimal(c.border)};`);
  lines.push(`--sidebar-ring: ${oklchDecimal(c.ring)};`);

  // Salt extension intents
  lines.push(`--success: ${oklchDecimal(c.success)};`);
  lines.push(`--success-foreground: ${oklchDecimal(c.onSuccess)};`);
  lines.push(`--warning: ${oklchDecimal(c.warning)};`);
  lines.push(`--warning-foreground: ${oklchDecimal(c.onWarning)};`);
  lines.push(`--info: ${oklchDecimal(c.info)};`);
  lines.push(`--info-foreground: ${oklchDecimal(c.onInfo)};`);
  lines.push(`--quaternary: ${oklchDecimal(c.quaternary)};`);
  lines.push(`--quaternary-foreground: ${oklchDecimal(c.onQuaternary)};`);

  // Intent state tokens — 8 intents × 4 states = 32 vars
  for (const intent of INTENTS) {
    const intentStates = s[intent];
    for (const state of STATES) {
      lines.push(`--${intent}-${state}: ${oklchDecimal(intentStates[state])};`);
    }
  }

  // Optional tonal palettes — 8 intents × 11 steps = 88 vars
  if (includePalettes) {
    for (const intent of INTENTS) {
      const palette = p[intent];
      for (const step of TONAL_STEPS) {
        lines.push(`--palette-${intent}-${step}: ${oklchDecimal(palette[step])};`);
      }
    }
  }

  return lines;
}

// ─── @layer base ─────────────────────────────────────────────────────

const LAYER_BASE = `@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}`;

// ─── Public API ───────────────────────────────────────────────────────

export function generateShadcnTheme(
  theme: GeneratedTheme,
  options?: ShadcnThemeOptions
): ShadcnThemeResult {
  const includePalettes = options?.includePalettes ?? false;
  const radiusRem = rem(theme.tokens.radius.lg);

  const baseSpec     = options?.baseColor ? BASE_COLOR_SPECS[options.baseColor] : null;
  const lightNeutrals = baseSpec ? resolveBaseNeutrals("light", baseSpec) : null;
  const darkNeutrals  = baseSpec ? resolveBaseNeutrals("dark",  baseSpec) : null;

  const lightDecls = buildColorDecls(theme.light, "light", true,  radiusRem, includePalettes, lightNeutrals);
  const darkDecls  = buildColorDecls(theme.dark,  "dark",  false, radiusRem, includePalettes, darkNeutrals);

  const light = lightDecls.join("\n");
  const dark  = darkDecls.join("\n");

  const themeInline = buildThemeInline(includePalettes);
  const rootBlock   = `:root {\n${ind(lightDecls)}\n}`;
  const darkBlock   = `.dark {\n${ind(darkDecls)}\n}`;

  const css = [themeInline, rootBlock, darkBlock, LAYER_BASE].join("\n\n");

  return { css, light, dark };
}
