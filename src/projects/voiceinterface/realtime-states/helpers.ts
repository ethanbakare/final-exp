/**
 * Pure helpers for the realtime-states editor.
 *
 * No React, no `fetch`, no DOM access, no `window`. Functions take
 * primitives or our settings shapes and return primitives or shapes.
 *
 * Imports types from ./types and the single constant TALKING_GEOMETRY
 * from ./constants (used by talkingRenderForProfile).
 */
import { TALKING_GEOMETRY } from './constants';
import type {
  BaseSettings,
  ColorFormat,
  LinkedProfile,
  PeakOverrides,
  RenderValues,
} from './types';

// ── Render math ──────────────────────────────────────────────────

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function lerpHex(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bv = Math.round(lerp(ab, bb, t));
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(bv)}`;
}

export function pickPeak(scope: PeakOverrides, base: BaseSettings): RenderValues {
  return {
    scale: scope.scale ?? base.scale,
    thickRadius: scope.thickRadius ?? base.thinRadius,
    thickenSpeed: scope.thickenSpeed ?? base.thickenSpeed,
    waveIntensity: scope.waveIntensity ?? base.waveIntensity,
    waveCount: scope.waveCount ?? base.waveCount ?? 8,
    breathAmp: scope.breathAmp ?? base.breathAmp,
    idleAmp: scope.idleAmp ?? base.idleAmp,
    color1: scope.color1 ?? base.color1,
    color2: scope.color2 ?? base.color2,
    color3: scope.color3 ?? base.color3,
  };
}

export function baseRender(base: BaseSettings): RenderValues {
  return {
    scale: base.scale,
    thickRadius: base.thinRadius,
    thickenSpeed: base.thickenSpeed,
    waveIntensity: base.waveIntensity,
    waveCount: base.waveCount ?? 8,
    breathAmp: base.breathAmp,
    idleAmp: base.idleAmp,
    color1: base.color1,
    color2: base.color2,
    color3: base.color3,
  };
}

export function talkingRenderForProfile(profile: LinkedProfile): RenderValues {
  return {
    ...pickPeak(profile.talking, profile.base),
    thickRadius: TALKING_GEOMETRY,
  };
}

export function lerpRender(a: RenderValues, b: RenderValues, t: number): RenderValues {
  return {
    scale: lerp(a.scale, b.scale, t),
    thickRadius: lerp(a.thickRadius, b.thickRadius, t),
    thickenSpeed: lerp(a.thickenSpeed, b.thickenSpeed, t),
    waveIntensity: lerp(a.waveIntensity, b.waveIntensity, t),
    waveCount: lerp(a.waveCount, b.waveCount, t),
    breathAmp: lerp(a.breathAmp, b.breathAmp, t),
    idleAmp: lerp(a.idleAmp, b.idleAmp, t),
    color1: lerpHex(a.color1, b.color1, t),
    color2: lerpHex(a.color2, b.color2, t),
    color3: lerpHex(a.color3, b.color3, t),
  };
}

// ── Names + keys ─────────────────────────────────────────────────

export function normalizeProfileName(name: string) {
  return name.trim().toLowerCase();
}

/** Composite key format `${sourceVariant}:${id}` — ids aren't unique
 *  across the two source files, so the key glues them. */
export const compositeKey = (orb: { sourceVariant: string; id: string }) =>
  `${orb.sourceVariant}:${orb.id}`;

// ── Color math ───────────────────────────────────────────────────

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => Math.round(clampNumber(n, 0, 255)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = (((h % 360) + 360) % 360) / 60;
  const sat = clampNumber(s, 0, 100) / 100;
  const light = clampNumber(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs((hue % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 1) [r, g, b] = [c, x, 0];
  else if (hue < 2) [r, g, b] = [x, c, 0];
  else if (hue < 3) [r, g, b] = [0, c, x];
  else if (hue < 4) [r, g, b] = [0, x, c];
  else if (hue < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function rgbToHsb(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return [Math.round(h), Math.round(max === 0 ? 0 : (delta / max) * 100), Math.round(max * 100)];
}

export function hsbToRgb(h: number, s: number, b: number): [number, number, number] {
  const hue = (((h % 360) + 360) % 360) / 60;
  const sat = clampNumber(s, 0, 100) / 100;
  const bright = clampNumber(b, 0, 100) / 100;
  const c = bright * sat;
  const x = c * (1 - Math.abs((hue % 2) - 1));
  const m = bright - c;
  let r = 0;
  let g = 0;
  let bl = 0;

  if (hue < 1) [r, g, bl] = [c, x, 0];
  else if (hue < 2) [r, g, bl] = [x, c, 0];
  else if (hue < 3) [r, g, bl] = [0, c, x];
  else if (hue < 4) [r, g, bl] = [0, x, c];
  else if (hue < 5) [r, g, bl] = [x, 0, c];
  else [r, g, bl] = [c, 0, x];

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((bl + m) * 255),
  ];
}

export function readColorNumbers(value: string) {
  return value.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
}

export function parseHexColor(value: string) {
  let hex = value.trim();
  if (!hex) return null;
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

export function formatColorValue(hex: string, format: ColorFormat) {
  const [r, g, b] = hexToRgb(hex);
  if (format === 'rgb') return `rgb(${r}, ${g}, ${b})`;
  if (format === 'hsl') {
    const [h, s, l] = rgbToHsl(r, g, b);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  if (format === 'hsb') {
    const [h, s, br] = rgbToHsb(r, g, b);
    return `hsb(${h}, ${s}%, ${br}%)`;
  }
  return hex;
}

export function parseColorValue(value: string, format: ColorFormat) {
  const hex = parseHexColor(value);
  if (hex) return hex;
  const numbers = readColorNumbers(value);
  if (numbers.length < 3) return null;
  const [a, b, c] = numbers;

  if (format === 'rgb') return rgbToHex(a, b, c);
  if (format === 'hsl') return rgbToHex(...hslToRgb(a, b, c));
  if (format === 'hsb') return rgbToHex(...hsbToRgb(a, b, c));
  return null;
}

export function colorFieldValues(hex: string, format: ColorFormat) {
  const [r, g, b] = hexToRgb(hex);
  if (format === 'rgb') {
    return [
      { label: 'R', value: String(r) },
      { label: 'G', value: String(g) },
      { label: 'B', value: String(b) },
    ];
  }
  if (format === 'hsl') {
    const [h, s, l] = rgbToHsl(r, g, b);
    return [
      { label: 'H', value: String(h) },
      { label: 'S', value: String(s) },
      { label: 'L', value: String(l) },
    ];
  }
  if (format === 'hsb') {
    const [h, s, br] = rgbToHsb(r, g, b);
    return [
      { label: 'H', value: String(h) },
      { label: 'S', value: String(s) },
      { label: 'B', value: String(br) },
    ];
  }
  return [{ label: 'HEX', value: hex.toUpperCase() }];
}

export function colorDraftsToHex(format: ColorFormat, drafts: string[]) {
  if (format === 'hex') return parseHexColor(drafts[0] ?? '');
  if (drafts.length < 3) return null;

  const numbers = drafts.map((draft) => Number(draft));
  if (numbers.some((n) => !Number.isFinite(n))) return null;
  const [a, b, c] = numbers;

  if (format === 'rgb') return rgbToHex(a, b, c);
  if (format === 'hsl') return rgbToHex(...hslToRgb(a, b, c));
  if (format === 'hsb') return rgbToHex(...hsbToRgb(a, b, c));
  return null;
}
