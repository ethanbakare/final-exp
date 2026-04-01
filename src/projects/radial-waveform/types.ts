/** Shared types for radial waveform variants */

export interface AudioData {
  bass: number;
  mid: number;
  treble: number;
  rms: number;
}

/** Props shared by all three radial waveform variants */
export interface RadialWaveformProps {
  /** Frequency data array from AnalyserNode (Uint8Array) */
  frequencyData: Uint8Array | null;
  /** Base circle radius in px — bar count auto-calculated from circumference */
  radius: number;
  /** Thickness of each bar in px */
  barWidth: number;
  /** Gap between adjacent bars at the circumference in px */
  barGap: number;
  /** Minimum bar length when silent in px */
  minBarLength: number;
  /** Maximum bar length in px */
  maxBarLength: number;
  /** Sensitivity multiplier for audio data */
  sensitivity: number;
  /** Bar stroke colour */
  barColor: string;
  /** Canvas background colour */
  bgColor: string;
  /** Number of symmetry segments (flare points around the ring) */
  segments: number;
  /** Use rounded line caps on bars */
  roundCaps: boolean;
  /** Vary bar opacity based on audio intensity */
  intensityOpacity: boolean;
  /** Minimum ms between draws (0 = every RAF frame) */
  updateRate: number;
  /** Rotation speed in degrees per second. 0 = no rotation. */
  rotationSpeed: number;
  /** Enable ambient traveling wave when idle */
  ambientWave: boolean;
  /** Ambient wave: angular speed (radians/sec) */
  waveSpeed: number;
  /** Ambient wave: intensity multiplier (0–1) */
  waveAmplitude: number;
  /** Ambient wave: height multiplier at peak */
  waveHeight: number;
  /** Wave mode: "additive" adds height, "reactive" multiplies audio sensitivity */
  waveMode: "additive" | "reactive";
  /** Ambient wave shape */
  waveShape: "sine" | "triangle" | "square" | "segments";
  /** Number of wave lobes (peaks around the ring) */
  waveLobes: number;
  /** Smoothing: 0 = instant (no smoothing), higher = slower transitions */
  smoothing: number;
  /** Envelope: 0 = off, 1 = wave shape fully caps bar height (0–1) */
  waveEnvelope: number;
  /** Envelope amplitude: independent wave intensity for ceiling calc (0–1) */
  envelopeAmplitude: number;
  /** Envelope sensitivity: wave position modulates audio reactivity (0–1) */
  envelopeSensitivity: number;
  /** Show ghost bars at envelope ceiling height (display-only, not saved) */
  showEnvelopeCeiling?: boolean;
}

// ── Variant type ──────────────────────────────────────────────

export type RadialVariant = "outward" | "bidirectional" | "inward";

export const RADIAL_VARIANTS: RadialVariant[] = [
  "outward",
  "bidirectional",
  "inward",
];

export const RADIAL_VARIANT_LABELS: Record<RadialVariant, string> = {
  outward: "Outward",
  bidirectional: "Bidirectional",
  inward: "Inward",
};

// ── Profile settings & defaults ───────────────────────────────

export interface RadialSettings {
  radius: number;
  barWidth: number;
  barGap: number;
  minBarLength: number;
  maxBarLength: number;
  sensitivity: number;
  barColor: string;
  bgColor: string;
  segments: number;
  roundCaps: boolean;
  intensityOpacity: boolean;
  updateRate: number;
  /** Bidirectional: fraction of bar that grows inward (0–1) */
  inwardRatio: number;
  /** Rotation speed in degrees/sec */
  rotationSpeed: number;
  /** Ambient wave */
  ambientWave: boolean;
  waveSpeed: number;
  waveAmplitude: number;
  waveHeight: number;
  waveMode: "additive" | "reactive";
  waveShape: "sine" | "triangle" | "square" | "segments";
  waveLobes: number;
  /** Smoothing: 0 = instant, higher = slower transitions */
  smoothing: number;
  /** Envelope: 0 = off, 1 = wave shape fully caps bar height (0–1) */
  waveEnvelope: number;
  /** Envelope amplitude: independent wave intensity for ceiling calc (0–1) */
  envelopeAmplitude: number;
  /** Envelope sensitivity: wave position modulates audio reactivity (0–1) */
  envelopeSensitivity: number;
  /** Container styling */
  containerBg: string;
  containerBgOpacity: number;
  containerRadius: number;
  containerPadding: number;
  /** Outline */
  showOutline: boolean;
  outlineColor: string;
  outlineWidth: number;
  /** Preview background (saved with profile) */
  previewBg: string;
}

export interface RadialProfile {
  id: string;
  name: string;
  settings: RadialSettings;
  lastModified: number;
  bookmarked?: boolean;
}

const SHARED_DEFAULTS: Omit<RadialSettings, "inwardRatio" | "rotationSpeed" | "maxBarLength"> = {
  radius: 100,
  barWidth: 2,
  barGap: 4,
  minBarLength: 3,
  sensitivity: 1.8,
  barColor: "#FFFFFF",
  bgColor: "#0F0F11",
  segments: 8,
  roundCaps: true,
  intensityOpacity: true,
  updateRate: 0,
  ambientWave: true,
  waveSpeed: 2,
  waveAmplitude: 0.15,
  waveHeight: 1.5,
  waveMode: "additive" as const,
  waveShape: "sine" as const,
  waveLobes: 2,
  smoothing: 0.95,
  waveEnvelope: 0,
  envelopeAmplitude: 0,
  envelopeSensitivity: 0,
  containerBg: "",
  containerBgOpacity: 1,
  containerRadius: 0,
  containerPadding: 0,
  showOutline: false,
  outlineColor: "#FFFFFF",
  outlineWidth: 2,
  previewBg: "#0F0F11",
};

export const RADIAL_DEFAULTS: Record<RadialVariant, RadialSettings> = {
  outward: {
    ...SHARED_DEFAULTS,
    maxBarLength: 40,
    inwardRatio: 0,
    rotationSpeed: 0,
  },
  bidirectional: {
    ...SHARED_DEFAULTS,
    maxBarLength: 40,
    inwardRatio: 0.3,
    rotationSpeed: 0,
  },
  inward: {
    ...SHARED_DEFAULTS,
    maxBarLength: 70,
    inwardRatio: 0,
    rotationSpeed: 6,
  },
};

/** API variant keys for profile storage */
export const RADIAL_API_KEYS: Record<RadialVariant, string> = {
  outward: "radial-outward",
  bidirectional: "radial-bidirectional",
  inward: "radial-inward",
};

// ── Curated profile names ─────────────────────────────────────

export const CURATED_NAMES = [
  "Apex", "Arc", "Aura", "Axis", "Bloom",
  "Bore", "Burst", "Coil", "Core", "Corona",
  "Crest", "Crown", "Cycle", "Dawn", "Disc",
  "Drift", "Echo", "Edge", "Ember", "Flare",
  "Flow", "Flux", "Focus", "Forge", "Gleam",
  "Globe", "Glow", "Gyro", "Halo", "Helix",
  "Hub", "Iris", "Jet", "Kite", "Knot",
  "Lens", "Loop", "Lumen", "Node", "Nova",
  "Orbit", "Peak", "Phase", "Ping", "Prism",
  "Pulse", "Radix", "Ray", "Reef", "Ring",
  "Rise", "Rotor", "Rune", "Scope", "Shell",
  "Sine", "Sonar", "Spark", "Spoke", "Surge",
  "Swirl", "Sync", "Thorn", "Tide", "Torch",
  "Trace", "Twist", "Vault", "Vibe", "Volt",
  "Vortex", "Wake", "Warp", "Wave", "Whirl",
  "Wisp", "Zenith", "Zone", "Beam", "Bolt",
  "Cinder", "Crux", "Dart", "Facet", "Fern",
  "Frost", "Grain", "Haven", "Ivory", "Jade",
  "Karma", "Latch", "Mist", "Opal", "Plume",
  "Quill", "Ripple", "Shard", "Thistle", "Umbra",
];

export function pickUnusedName(
  allProfiles: Record<RadialVariant, RadialProfile[]>,
): string {
  const used = new Set<string>();
  for (const profiles of Object.values(allProfiles)) {
    for (const p of profiles) used.add(p.name);
  }
  const available = CURATED_NAMES.filter((n) => !used.has(n));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  const base = CURATED_NAMES[Math.floor(Math.random() * CURATED_NAMES.length)];
  let i = 2;
  while (used.has(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}
