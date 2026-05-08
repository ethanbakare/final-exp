/**
 * Network I/O + schema for the radial-states editor.
 *
 * v2 schema (post tasks/radial-states-animator-plan.md):
 *  - Bar identity is shared in `bars` (width, gap, color, segments, rotation,
 *    minBarLength, updateRate). Editing here updates every state at once.
 *  - Display chrome is shared in `display` (bgColor, previewBg, container,
 *    outline). Same rationale.
 *  - Geometry holds idleRadius + talkingInnerGap. Talking radius is derived.
 *  - Per-state `RadialStateSettings` carries only what's *meant* to differ
 *    between states (audio reactivity, wave/envelope behavior, length
 *    envelope ceiling).
 *  - `idle`, `listening`, `thinking`, `talking` are all explicit. listening
 *    mirrors idle by default (`idleListeningLinked: true`); breaking the
 *    link is deferred. lockBarCount governs static-mode bar-count derivation.
 *
 * v1 (legacy) profiles lack `schemaVersion` and store the full
 * `RadialSettings` per state. Migration runs in-memory inside
 * `fetchRadialLinkedProfiles`. The on-disk file is rewritten as v2 the next
 * time the user saves (the persistence layer is whole-array POST).
 */
import type { RadialSettings } from '@/projects/radial-waveform/types';
import type { RadialState } from './types';

const API = '/api/studio-profiles?variant=radial-states';
const DONUT_PADDING = 14;

/** Static backdrop ring shared across all cells in a profile. Unchanged
 *  from v1 — kept as an optional top-level field on the profile.
 *
 *  Inner ring fields (shape / segments / depth) and outer ring fields
 *  (outerShape / outerSegments / outerDepth) are independent — both edges
 *  can be circle or segments; both can have their own lobe count and
 *  depth. Flat naming kept (rather than nested inner/outer objects) for
 *  backward compatibility with profiles persisted before the outer-ring
 *  feature shipped. */
export interface RadialBackdrop {
  enabled?: boolean;
  color?: string;
  opacity?: number;
  shape?: 'circle' | 'segments';
  segments?: number;
  depth?: number;
  outerShape?: 'circle' | 'segments';
  outerSegments?: number;
  outerDepth?: number;
}

/** Bar identity — shared across all four states. Editing any of these
 *  updates every cell simultaneously. */
export interface RadialBars {
  barWidth: number;
  barGap: number;
  roundCaps: boolean;
  barColor: string;
  segments: number;
  rotationSpeed: number;
  /** Minimum bar length when silent. Also defines the morph length
   *  (Phase A bars are pinned at exactly this value). */
  minBarLength: number;
  /** Render throttle (ms). Perf knob, not state behavior. */
  updateRate: number;
}

/** Display chrome — shared across all four states. */
export interface RadialDisplay {
  bgColor: string;
  previewBg: string;
  containerBg: string;
  containerBgOpacity: number;
  containerRadius: number;
  containerPadding: number;
  showOutline: boolean;
  outlineColor: string;
  outlineWidth: number;
}

/** Per-state behavior — only properties meant to differ between states. */
export interface RadialStateSettings {
  /** Audio dynamic-range ceiling. Invariant: must be >= bars.minBarLength
   *  (enforced by the shared-bars mutator + per-state slider min). */
  maxBarLength: number;
  /** 0 for thinking (frozen). */
  sensitivity: number;
  ambientWave: boolean;
  waveSpeed: number;
  waveAmplitude: number;
  waveHeight: number;
  waveMode: 'additive' | 'reactive';
  waveShape: 'sine' | 'triangle' | 'square' | 'segments';
  waveLobes: number;
  smoothing: number;
  waveEnvelope: number;
  envelopeAmplitude: number;
  envelopeSensitivity: number;
  intensityOpacity: boolean;
}

export interface RadialLinkedProfile {
  schemaVersion: 2;
  id: string;
  name: string;
  bars: RadialBars;
  display: RadialDisplay;
  idle: RadialStateSettings;
  listening: RadialStateSettings;
  thinking: RadialStateSettings;
  talking: RadialStateSettings;
  geometry: {
    idleRadius: number;
    talkingInnerGap: number;
  };
  /** When true, edits to idle's per-state values mirror to listening's.
   *  v1 ships with this true by default; breaking the link is deferred. */
  idleListeningLinked: boolean;
  /** Default true. Static-mode behavior: when true, all cells share the
   *  bar count derived from idle's circumference. Tune mode always uses a
   *  fixed barCount regardless of this flag (the morph requires bar
   *  identity preservation). */
  lockBarCount: boolean;
  backdrop?: RadialBackdrop;
  morph: {
    /** Damp duration idle/listening ↔ thinking, seconds. */
    idleToThinking: number;
    /** Morph duration thinking ↔ talking (forward + reverse share), seconds. */
    thinkingToTalking: number;
    /** When Phase B (reactive ramp) begins relative to Phase A (translation).
     *  0..1; default 0.75 — translation 0→75%, reactive 75→100%. */
    reactiveStartAt: number;
  };
  lastModified: number;
}

// ── Defaults ──────────────────────────────────────────────────────

export const DEFAULT_BARS: RadialBars = {
  barWidth: 6.5,
  barGap: 9,
  roundCaps: true,
  barColor: '#0f0f11',
  segments: 7,
  rotationSpeed: 6,
  minBarLength: 12,
  updateRate: 0,
};

export const DEFAULT_DISPLAY: RadialDisplay = {
  bgColor: '#0F0F11',
  previewBg: '#f7f6f4',
  containerBg: '',
  containerBgOpacity: 1,
  containerRadius: 0,
  containerPadding: 0,
  showOutline: false,
  outlineColor: '#FFFFFF',
  outlineWidth: 2,
};

export const DEFAULT_IDLE_STATE: RadialStateSettings = {
  maxBarLength: 60,
  sensitivity: 0.7,
  ambientWave: true,
  waveSpeed: 1.5,
  waveAmplitude: 0.36,
  waveHeight: 1.5,
  waveMode: 'additive',
  waveShape: 'segments',
  waveLobes: 2,
  smoothing: 0.95,
  waveEnvelope: 0.4,
  envelopeAmplitude: 1,
  envelopeSensitivity: 0.5,
  intensityOpacity: false,
};

export const DEFAULT_THINKING_STATE: RadialStateSettings = {
  ...DEFAULT_IDLE_STATE,
  maxBarLength: 12, // pinned at min — thinking is frozen
  ambientWave: false,
  waveSpeed: 1.9,
  sensitivity: 0,
};

export const DEFAULT_TALKING_STATE: RadialStateSettings = {
  ...DEFAULT_IDLE_STATE,
  maxBarLength: 40,
  sensitivity: 1.7,
  waveShape: 'sine',
  waveLobes: 7,
  waveAmplitude: 0.35,
  waveSpeed: 2,
  waveEnvelope: 0,
  envelopeAmplitude: 0,
  envelopeSensitivity: 0,
};

export const DEFAULT_MORPH = {
  idleToThinking: 0.4,
  thinkingToTalking: 0.6,
  reactiveStartAt: 0.75,
};

export function makeDefaultProfile(id: string, name: string): RadialLinkedProfile {
  return {
    schemaVersion: 2,
    id,
    name,
    bars: structuredClone(DEFAULT_BARS),
    display: structuredClone(DEFAULT_DISPLAY),
    idle: structuredClone(DEFAULT_IDLE_STATE),
    listening: structuredClone(DEFAULT_IDLE_STATE),
    thinking: structuredClone(DEFAULT_THINKING_STATE),
    talking: structuredClone(DEFAULT_TALKING_STATE),
    geometry: { idleRadius: 134, talkingInnerGap: DONUT_PADDING },
    idleListeningLinked: true,
    lockBarCount: true,
    backdrop: { enabled: true, color: '#262424', opacity: 0.03 },
    morph: { ...DEFAULT_MORPH },
    lastModified: Date.now(),
  };
}

// ── Migration ─────────────────────────────────────────────────────

/** Strip the per-state fields that v1 had and v2 has promoted to shared
 *  blocks (bars/display/geometry). Returns a v2 RadialStateSettings. */
function stripStateSettings(s: RadialSettings): RadialStateSettings {
  return {
    maxBarLength: s.maxBarLength,
    sensitivity: s.sensitivity,
    ambientWave: s.ambientWave,
    waveSpeed: s.waveSpeed,
    waveAmplitude: s.waveAmplitude,
    waveHeight: s.waveHeight,
    waveMode: s.waveMode,
    waveShape: s.waveShape,
    waveLobes: s.waveLobes,
    smoothing: s.smoothing,
    waveEnvelope: s.waveEnvelope,
    envelopeAmplitude: s.envelopeAmplitude,
    envelopeSensitivity: s.envelopeSensitivity,
    intensityOpacity: s.intensityOpacity,
  };
}

interface LegacyProfile {
  id: string;
  name: string;
  idle: RadialSettings;
  thinking: RadialSettings;
  talking: RadialSettings;
  backdrop?: RadialBackdrop;
  lockBarCount?: boolean;
  talkingInnerGap?: number;
  lastModified: number;
}

/** Convert a v1 (legacy) profile to v2 in-memory. Bar identity is
 *  promoted from idle's values; minBarLength is taken from THINKING (not
 *  idle) because thinking's value defines the morph length. Display
 *  chrome from idle. Listening synthesized as a deep clone of idle. */
function migrateLegacyProfile(p: LegacyProfile): RadialLinkedProfile {
  const bars: RadialBars = {
    barWidth: p.idle.barWidth,
    barGap: p.idle.barGap,
    roundCaps: p.idle.roundCaps,
    barColor: p.idle.barColor,
    segments: p.idle.segments,
    rotationSpeed: p.idle.rotationSpeed,
    // R2 P1.2: thinking's minBarLength is canonical (defines morph length).
    minBarLength: p.thinking.minBarLength,
    updateRate: p.idle.updateRate,
  };
  const display: RadialDisplay = {
    bgColor: p.idle.bgColor,
    previewBg: p.idle.previewBg,
    containerBg: p.idle.containerBg,
    containerBgOpacity: p.idle.containerBgOpacity,
    containerRadius: p.idle.containerRadius,
    containerPadding: p.idle.containerPadding,
    showOutline: p.idle.showOutline,
    outlineColor: p.idle.outlineColor,
    outlineWidth: p.idle.outlineWidth,
  };

  const idleStripped = stripStateSettings(p.idle);
  const migrated: RadialLinkedProfile = {
    schemaVersion: 2,
    id: p.id,
    name: p.name,
    bars,
    display,
    idle: idleStripped,
    listening: structuredClone(idleStripped),
    thinking: stripStateSettings(p.thinking),
    talking: stripStateSettings(p.talking),
    geometry: {
      idleRadius: p.idle.radius,
      talkingInnerGap: p.talkingInnerGap ?? DONUT_PADDING,
    },
    idleListeningLinked: true,
    lockBarCount: p.lockBarCount ?? true,
    backdrop: p.backdrop,
    morph: { ...DEFAULT_MORPH },
    lastModified: p.lastModified,
  };

  // Enforce maxBarLength >= bars.minBarLength invariant (v1 profiles
  // could have idle.minBarLength = 3, thinking.minBarLength = 12; after
  // promoting thinking's value to shared min, idle/talking maxBarLength
  // may already be >= 12 in practice but belt-and-braces).
  for (const state of ['idle', 'listening', 'thinking', 'talking'] as const) {
    if (migrated[state].maxBarLength < bars.minBarLength) {
      migrated[state].maxBarLength = bars.minBarLength;
    }
  }

  if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const minDiverged =
      p.idle.minBarLength !== p.thinking.minBarLength ||
      p.thinking.minBarLength !== p.talking.minBarLength;
    const widthDiverged =
      p.idle.barWidth !== p.thinking.barWidth || p.thinking.barWidth !== p.talking.barWidth;
    console.log(
      `[radial-states migration] profile ${p.id} "${p.name}"`,
      `\n  bars.minBarLength: chose thinking=${p.thinking.minBarLength}` +
        ` (idle=${p.idle.minBarLength}, talking=${p.talking.minBarLength})` +
        (minDiverged ? ' — DIVERGED' : ' — agreed'),
      widthDiverged
        ? `\n  bars.barWidth: chose idle=${p.idle.barWidth}` +
            ` (thinking=${p.thinking.barWidth}, talking=${p.talking.barWidth}) — DIVERGED`
        : `\n  bars.barWidth: ${p.idle.barWidth} (all states agreed)`,
    );
  }

  return migrated;
}

/** Returns true if the profile is already v2 shape. */
function isV2(p: any): p is RadialLinkedProfile {
  return p && typeof p === 'object' && p.schemaVersion === 2;
}

/** Normalize an unknown-shape profile to v2 in memory. */
export function normalizeProfile(p: any): RadialLinkedProfile {
  if (isV2(p)) return p;
  return migrateLegacyProfile(p as LegacyProfile);
}

// ── Helpers used by static cells and (later) tune mode ────────────

/** Talking's anchor radius — preserves the clamp behavior from current
 *  code (verified index.tsx:1459 pre-refactor). */
export function deriveTalkingAnchor(profile: RadialLinkedProfile): number {
  const donutInner = Math.max(
    0,
    profile.geometry.idleRadius - profile.idle.maxBarLength - DONUT_PADDING,
  );
  return Math.max(1, donutInner + profile.geometry.talkingInnerGap);
}

/** Compose the renderer prop bundle for a given state. Static cells
 *  call this then add `freezeAtMin` and `renderExtent`; tune cell calls
 *  it then merges animator output. Returns RadialWaveformProps minus
 *  freezeAtMin (consumer adds it). */
export function composeBaseWaveformProps(
  profile: RadialLinkedProfile,
  state: RadialState,
): Omit<RadialSettings, 'inwardRatio'> & {
  frequencyData: Uint8Array | null;
  barCount: number | undefined;
} {
  const s = profile[state];
  const radius = state === 'talking' ? deriveTalkingAnchor(profile) : profile.geometry.idleRadius;
  return {
    radius,
    barWidth: profile.bars.barWidth,
    barGap: profile.bars.barGap,
    roundCaps: profile.bars.roundCaps,
    barColor: profile.bars.barColor,
    segments: profile.bars.segments,
    rotationSpeed: profile.bars.rotationSpeed,
    minBarLength: profile.bars.minBarLength,
    updateRate: profile.bars.updateRate,
    bgColor: profile.display.bgColor,
    containerBg: profile.display.containerBg,
    containerBgOpacity: profile.display.containerBgOpacity,
    containerRadius: profile.display.containerRadius,
    containerPadding: profile.display.containerPadding,
    showOutline: profile.display.showOutline,
    outlineColor: profile.display.outlineColor,
    outlineWidth: profile.display.outlineWidth,
    previewBg: profile.display.previewBg,
    maxBarLength: s.maxBarLength,
    sensitivity: s.sensitivity,
    ambientWave: s.ambientWave,
    waveSpeed: s.waveSpeed,
    waveAmplitude: s.waveAmplitude,
    waveHeight: s.waveHeight,
    waveMode: s.waveMode,
    waveShape: s.waveShape,
    waveLobes: s.waveLobes,
    smoothing: s.smoothing,
    waveEnvelope: s.waveEnvelope,
    envelopeAmplitude: s.envelopeAmplitude,
    envelopeSensitivity: s.envelopeSensitivity,
    intensityOpacity: s.intensityOpacity,
    frequencyData: null,
    barCount: profile.lockBarCount
      ? Math.floor(
          (2 * Math.PI * profile.geometry.idleRadius) /
            (profile.bars.barWidth + profile.bars.barGap),
        )
      : undefined,
  };
}

// ── Network ───────────────────────────────────────────────────────

export async function fetchRadialLinkedProfiles(): Promise<RadialLinkedProfile[]> {
  try {
    const r = await fetch(API, { cache: 'no-store' });
    const j = await r.json();
    if (!Array.isArray(j)) return [];
    return j.map(normalizeProfile);
  } catch {
    return [];
  }
}

export async function persistRadialLinkedProfiles(arr: RadialLinkedProfile[]) {
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arr),
    });
  } catch (e) {
    console.error('[radial-states] persist failed', e);
  }
}
