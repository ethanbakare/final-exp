// ── Linear Waveform Types ────────────────────────────────────

export interface LinearWaveformProps {
  frequencyData: Uint8Array | null;
  barWidth: number;
  barHeight: number;
  barGap: number;
  barRadius: number;
  barColor: string;
  containerWidth: number;
  containerHeight: number;
  mode: "scrolling" | "static";
  sensitivity: number;
  updateRate: number;
  // Ambient wave (static mode only)
  ambientWave: boolean;
  waveMode: "mul" | "add";
  waveSpeed: number;
  waveAmplitude: number;
  waveHeight: number;
  // Ghost bars (scrolling mode only)
  ghostBarOpacity: number;
  // Edge fade
  fadeEdges: boolean;
  fadeWidth: number;
  // Smoothing
  smoothing: number;
  // Opacity
  intensityOpacity: boolean;
  // Debug: show wave contribution as red tips (MUL mode only)
  showWaveDebug?: boolean;
}

export interface LinearSettings {
  barWidth: number;
  barHeight: number;
  barGap: number;
  barRadius: number;
  barColor: string;
  containerWidth: number;
  containerHeight: number;
  mode: "scrolling" | "static";
  sensitivity: number;
  updateRate: number;
  // Ambient wave
  ambientWave: boolean;
  waveMode: "mul" | "add";
  waveSpeed: number;
  waveAmplitude: number;
  waveHeight: number;
  // Ghost bars
  ghostBarOpacity: number;
  // Edge fade
  fadeEdges: boolean;
  fadeWidth: number;
  // Container styling
  containerBg: string;
  containerBgOpacity: number;
  containerRadius: number;
  containerPadding: number;
  containerPaddingVertical: number;
  // Outline
  showOutline: boolean;
  outlineColor: string;
  outlineWidth: number;
  // Smoothing
  smoothing: number;
  // Opacity
  intensityOpacity: boolean;
  // Preview
  previewBg: string;
}

export interface LinearProfile {
  id: string;
  name: string;
  settings: LinearSettings;
  lastModified: number;
  bookmarked?: boolean;
}

export const LINEAR_API_KEY = "linear-waveform";

export const LINEAR_DEFAULTS: LinearSettings = {
  barWidth: 4.5,
  barHeight: 5,
  barGap: 5,
  barRadius: 10,
  barColor: "#000000",
  containerWidth: 350,
  containerHeight: 34,
  mode: "static",
  sensitivity: 1,
  updateRate: 50,
  ambientWave: true,
  waveMode: "mul",
  waveSpeed: 2,
  waveAmplitude: 0.15,
  waveHeight: 1.5,
  ghostBarOpacity: 0.2,
  fadeEdges: true,
  fadeWidth: 0,
  containerBg: "#ffffff",
  containerBgOpacity: 1,
  containerRadius: 24,
  containerPadding: 20,
  containerPaddingVertical: 5,
  showOutline: false,
  outlineColor: "#FFFFFF",
  outlineWidth: 2,
  smoothing: 0.85,
  intensityOpacity: false,
  previewBg: "#F7F6F4",
};

// Curated profile names (shared pool)
export const CURATED_NAMES = [
  "Apex", "Arc", "Aura", "Axis", "Bloom", "Bore", "Burst", "Coil", "Core", "Corona",
  "Crest", "Cusp", "Dagger", "Dawn", "Drift", "Edge", "Ember", "Fang", "Fern", "Flare",
  "Flux", "Forge", "Frost", "Gleam", "Glow", "Grove", "Halo", "Haze", "Helix", "Horn",
  "Iris", "Jade", "Jet", "Knot", "Lance", "Lash", "Lens", "Loom", "Lure", "Mace",
  "Mist", "Nexus", "Node", "Opal", "Orbit", "Peak", "Plume", "Prism", "Pulse", "Quill",
  "Reed", "Ridge", "Rune", "Sable", "Shard", "Shell", "Silk", "Slate", "Spark", "Spear",
  "Spine", "Spire", "Spoke", "Strand", "Surge", "Thorn", "Tide", "Trace", "Vale", "Veil",
  "Vine", "Void", "Wake", "Warp", "Wave", "Wisp", "Zenith", "Zephyr",
];

export function pickUnusedName(profiles: LinearProfile[]): string {
  const used = new Set(profiles.map(p => p.name));
  const available = CURATED_NAMES.filter(n => !used.has(n));
  if (available.length === 0) return `Profile ${profiles.length + 1}`;
  return available[Math.floor(Math.random() * available.length)];
}
