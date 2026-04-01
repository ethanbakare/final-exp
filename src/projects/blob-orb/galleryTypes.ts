/**
 * Gallery-specific types, defaults, and constants.
 * Completely separate from Studio/SphereMorph data systems.
 */

import type { AudioData } from "./types";

// ── Settings & Profile ──────────────────────────────────────────

export interface GallerySettings {
  scale: number;
  thinRadius: number;
  thickRadius: number;
  thickenSpeed: number;
  torusRadius: number;
  waveIntensity: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
  bgColor: string;
}

export interface GalleryProfile {
  id: string;
  name: string;
  settings: GallerySettings;
  lastModified: number;
  bookmarked?: boolean;
}

// ── Variants ────────────────────────────────────────────────────

export type GalleryVariant =
  | "thicken"
  | "coralstone"
  | "coralstonedamped"
  | "coralmorph";

export const GALLERY_VARIANTS: GalleryVariant[] = [
  "thicken",
  "coralstone",
  "coralstonedamped",
  "coralmorph",
];

export const GALLERY_VARIANT_LABELS: Record<GalleryVariant, string> = {
  thicken: "Tube",
  coralstone: "Coral",
  coralstonedamped: "Coral D",
  coralmorph: "Coral Morph",
};

/** API variant keys — prefixed with "gallery-" to isolate from Studio data */
export const GALLERY_API_KEYS: Record<GalleryVariant, string> = {
  thicken: "gallery-thicken",
  coralstone: "gallery-coralstone",
  coralstonedamped: "gallery-coralstonedamped",
  coralmorph: "gallery-coralmorph",
};

// ── Defaults per variant ────────────────────────────────────────

export const GALLERY_DEFAULTS: Record<GalleryVariant, GallerySettings> = {
  thicken: {
    scale: 0.5,
    thinRadius: 0.15,
    thickRadius: 0.25,
    thickenSpeed: 1.2,
    torusRadius: 0.3,
    waveIntensity: 0.18,
    breathAmp: 0.015,
    idleAmp: 0.04,
    color1: "#FFF5F0",
    color2: "#FFD6C0",
    color3: "#FFC4C4",
    bgColor: "#FFFFFF",
  },
  coralstone: {
    scale: 0.5,
    thinRadius: 0.15,
    thickRadius: 0.25,
    thickenSpeed: 1.2,
    torusRadius: 0.3,
    waveIntensity: 0.12,
    breathAmp: 0.015,
    idleAmp: 0.02,
    color1: "#FFF5F0",
    color2: "#FFD6C0",
    color3: "#FFC4C4",
    bgColor: "#FFFFFF",
  },
  coralstonedamped: {
    scale: 0.5,
    thinRadius: 0.15,
    thickRadius: 0.25,
    thickenSpeed: 1.2,
    torusRadius: 0.3,
    waveIntensity: 0.12,
    breathAmp: 0.015,
    idleAmp: 0.02,
    color1: "#FFF5F0",
    color2: "#FFD6C0",
    color3: "#FFC4C4",
    bgColor: "#FFFFFF",
  },
  coralmorph: {
    scale: 0.5,
    thinRadius: 0.15,
    thickRadius: 0.25,
    thickenSpeed: 1.5,
    torusRadius: 0.3,
    waveIntensity: 0.18,
    breathAmp: 0.015,
    idleAmp: 0.02,
    color1: "#FFF5F0",
    color2: "#FFD6C0",
    color3: "#FFC4C4",
    bgColor: "#FFFFFF",
  },
};

// ── Layout constants ────────────────────────────────────────────

export const GALLERY_CELL_SIZE = 400;
export const GALLERY_BORDER = 0.8;
export const GALLERY_ACTIVE_BORDER = 1.4;
export const CAMERA_Z = 3.5;
export const CAMERA_FOV = 45;

/** Compute approximate pixel diameter for a given scale in a cell */
export function approxPixelDia(
  scale: number,
  cellSize: number = GALLERY_CELL_SIZE,
): number {
  return Math.round(scale * cellSize / (CAMERA_Z * Math.tan(Math.PI / 8)));
}

// ── Variant capability helpers ──────────────────────────────────

export function hasThickenControls(v: GalleryVariant): boolean {
  return v === "thicken" || v === "coralstonedamped";
}

export function hasMorphControls(v: GalleryVariant): boolean {
  return v === "coralmorph";
}

// ── Text colour detection ───────────────────────────────────────

export function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

// ── Curated profile names (100 unique, globally non-repeating) ──

export const CURATED_NAMES = [
  "Solstice", "Mirage", "Zephyr", "Aura", "Nimbus",
  "Cascade", "Fjord", "Lunar", "Obsidian", "Quartz",
  "Aurora", "Nebula", "Lichen", "Strata", "Tempest",
  "Meridian", "Cinder", "Canopy", "Basalt", "Marrow",
  "Patina", "Sable", "Gossamer", "Bramble", "Cirrus",
  "Lumen", "Vesper", "Rune", "Mica", "Spire",
  "Cobalt", "Fable", "Glyph", "Umber", "Plinth",
  "Thistle", "Wren", "Halcyon", "Reverie", "Cypress",
  "Scarab", "Tundra", "Fern", "Opal", "Caldera",
  "Sage", "Flint", "Crimson", "Indigo", "Sienna",
  "Pearl", "Topaz", "Willow", "Ivory", "Mauve",
  "Russet", "Slate", "Garnet", "Frost", "Harbor",
  "Summit", "Breeze", "Pebble", "Mantle", "Copper",
  "Pewter", "Lapis", "Thorn", "Anchor", "Beacon",
  "Grain", "Fossil", "Thatch", "Clover", "Ridgeline",
  "Soot", "Ether", "Brine", "Moss", "Dune",
  "Haven", "Birch", "Aster", "Flume", "Gale",
  "Hollow", "Jasper", "Kelp", "Lantern", "Mortar",
  "Nexus", "Oxide", "Plume", "Quarry", "Ripple",
  "Shard", "Terrace", "Umbra", "Vellum", "Wraith",
];

/** Pick a random name not already used across all variant profiles */
export function pickUnusedName(
  allProfiles: Record<GalleryVariant, GalleryProfile[]>,
): string {
  const used = new Set<string>();
  for (const profiles of Object.values(allProfiles)) {
    for (const p of profiles) used.add(p.name);
  }
  const available = CURATED_NAMES.filter((n) => !used.has(n));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  // Fallback: append number
  const base = CURATED_NAMES[Math.floor(Math.random() * CURATED_NAMES.length)];
  let i = 2;
  while (used.has(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}

// ── Re-export AudioData for convenience ─────────────────────────

export type { AudioData };
