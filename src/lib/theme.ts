import { contrastColor } from "./format";

export type Theme = "dark" | "light" | "dynamic";

const DEFAULT_ACCENT = "#0872D8";

function oklabLightness(hex: string): number {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return 0.5;
  const toLin = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const r = toLin(parseInt(clean.slice(0, 2), 16) / 255);
  const g = toLin(parseInt(clean.slice(2, 4), 16) / 255);
  const b = toLin(parseInt(clean.slice(4, 6), 16) / 255);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const lc = Math.cbrt(l), mc = Math.cbrt(m), sc = Math.cbrt(s);
  return 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc;
}

export function isDarkSeed(accent: string): boolean {
  return oklabLightness(accent) < 0.5;
}

export function applyTheme(theme: Theme, accent?: string): void {
  const a = /^#[0-9a-f]{6}$/i.test(accent ?? "") ? (accent as string) : DEFAULT_ACCENT;
  const root = document.documentElement;
  const dark = theme === "dark" || (theme === "dynamic" && isDarkSeed(a));
  root.classList.toggle("dark", dark);
  root.dataset.theme = theme;
  let brand = a;
  let brandFg = contrastColor(a);
  if (theme === "dynamic" && isDarkSeed(a)) {
    brand = `oklch(from ${a} 0.80 c h)`;
    brandFg = "#0B1A22";
  }
  root.style.setProperty("--eq-accent", a);
  root.style.setProperty("--eq-brand", brand);
  root.style.setProperty("--eq-brand-foreground", brandFg);
}