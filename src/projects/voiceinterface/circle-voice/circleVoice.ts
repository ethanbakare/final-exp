// CSW-002A — self-contained voice-state bundle (plan §3).
// A CircleVoiceProfile folds four full, normalized circle-waveform settings
// snapshots (idle/listening/thinking/talking) plus per-direction transition
// durations into ONE object. Snapshots, not references — retuning/deleting a
// loose bench profile cannot affect a bundle.
//
// CSW-010 Final-EXP port v1 — adapted from otherexp `circleVoice.ts`:
//  • R2: the loose-profile seeder is REMOVED. No PROFILE_VARIANT /
//    SEED_PROFILE_NAMES / LooseProfile / loadOrSeedVoiceProfile here. The
//    Final-EXP load path lives in `./api` and never fetches loose
//    `circle-waveform` profiles (the three old single-state profiles were
//    already unified into ONE 4-state bundle in CSW-002A).
//  • R3: the single-bundle writers (persistVoiceProfile / single
//    loadOrSeedVoiceProfile) are NOT ported. All persistence is whole-array
//    via `./api` persistCircleProfiles.
//  • R7: checkBundleIntegrity is EXTENDED (shared, strictly additive
//    load-time robustness guard) — see below.
// This file is now PURE (types + transition math + integrity + names); all
// network I/O is in `./api`.

import {
  type CircleSawSettings,
  type WaveDirection,
  normalizeSettings,
} from "./circleWaveformCore";

export type VoiceState = "idle" | "listening" | "thinking" | "talking";

export type CircleVoiceStateSettings = CircleSawSettings;

/** Per-direction transition durations, authored in LITERAL SECONDS (coral
 *  convention — plan §4.2/§4.6). tau is derived internally; nothing here is a
 *  tau coefficient. Selected by destination, except any exit from talking
 *  (incl. talking→thinking) uses `talkingExit`. */
export interface CircleTransitions {
  toIdle: number;
  toListening: number;
  toThinking: number;
  toTalking: number;
  talkingExit: number;
}

/** Plan §4.6 seed defaults (seconds, perceived settle). */
export const DEFAULT_TRANSITIONS: CircleTransitions = {
  toIdle: 1.3,
  toListening: 1.3,
  toThinking: 0.9,
  toTalking: 1.2,
  talkingExit: 1.6,
};

export interface CircleVoiceProfile {
  schemaVersion: 1;
  id: string;
  name: string;
  /** Final-EXP realtime-test "bookmark" — plan §0b/§3. OWNED and toggled by
   *  realtime-states; the standalone circle-voice page never writes it for
   *  live. There is exactly ONE pinned key (this one). */
  pinned?: boolean;
  /** idle/listening lock (radial-states model). When true (default — absent
   *  is treated as true for back-compat), the listening snapshot mirrors idle
   *  and the listening editor is replaced by a read-only "Linked to Idle"
   *  banner with a Break-link button. Breaking the link sets this false and
   *  listening becomes independently editable. */
  idleListeningLinked?: boolean;
  settings: {
    idle: CircleVoiceStateSettings;
    listening: CircleVoiceStateSettings;
    thinking: CircleVoiceStateSettings;
    talking: CircleVoiceStateSettings;
    transitions: CircleTransitions;
  };
  lastModified: number;
}

// ── Transition animator (plan §4) ──────────────────────────────────────────
// Eased per-frame scalar set (plan §4.1). Identity fields are NOT here — they
// are pinned to the bundle's idle snapshot (plan §3). `waveDirection` is the
// CSW-002C exception (phase 5b), not eased.
export interface EasedParams {
  apexCircleHeight: number;
  arcCircleHeight: number;
  waveAmplitude: number;
  pulseWidth: number;
  spectralMix: number;
  waveSpeed: number;
  waveHeight: number;
  sensitivity: number;
  noiseFloor: number;
  smoothing: number;
  /** synthetic: 0 ⇒ height uses v ; 1 ⇒ uses 1−v (audioInvert crossfade, §4.4) */
  invertMix: number;
  /** synthetic: audio contribution scale; thinking ⇒ 0 (§4.3) */
  audioGain: number;
  /** synthetic: backdrop circle effective opacity (circleVisible fades, §4.5) */
  circleOpacityEff: number;
}

/** Perceived-seconds → tau divisor. "Settled" ≈ 3·tau (95%). One place the
 *  coral-style literal-seconds duration becomes an internal tau (§4.2). */
export const SETTLE_K = 3;

/** The eased target for a state, read from that state's snapshot. */
export function stateEasedTargets(
  bundle: CircleVoiceProfile,
  state: VoiceState,
): EasedParams {
  const s = bundle.settings[state];
  return {
    apexCircleHeight: s.apexCircleHeight,
    arcCircleHeight: s.arcCircleHeight,
    waveAmplitude: s.waveAmplitude,
    pulseWidth: s.pulseWidth,
    spectralMix: s.spectralMix,
    waveSpeed: s.waveSpeed,
    waveHeight: s.waveHeight,
    sensitivity: s.sensitivity,
    noiseFloor: s.noiseFloor,
    smoothing: s.smoothing,
    invertMix: s.audioInvert ? 1 : 0,
    audioGain: state === "thinking" ? 0 : 1,
    circleOpacityEff: (s.circleVisible ? 1 : 0) * s.circleOpacity,
  };
}

const EASED_KEYS = [
  "apexCircleHeight",
  "arcCircleHeight",
  "waveAmplitude",
  "pulseWidth",
  "spectralMix",
  "waveSpeed",
  "waveHeight",
  "sensitivity",
  "noiseFloor",
  "smoothing",
  "invertMix",
  "audioGain",
  "circleOpacityEff",
] as const;

/** §4.6 exact selection rule: any exit from talking (incl. talking→thinking)
 *  uses talkingExit; otherwise by destination. */
export function pickTransitionSeconds(
  t: CircleTransitions,
  from: VoiceState,
  to: VoiceState,
): number {
  if (from === "talking" && to !== "talking") return t.talkingExit;
  const byDest: Record<VoiceState, number> = {
    idle: t.toIdle,
    listening: t.toListening,
    thinking: t.toThinking,
    talking: t.toTalking,
  };
  return byDest[to];
}

/** One frame of the first-order low-pass (plan §4.2). Mutates `current` in
 *  place toward `target`. Always eases from the current live value ⇒ no snap,
 *  even mid-transition. Floors guard NaN/div0; dt clamp guards post-stall
 *  teleport. */
export function stepEased(
  current: EasedParams,
  target: EasedParams,
  durationSeconds: number,
  dtSeconds: number,
): void {
  const tau = Math.max(0.001, durationSeconds / SETTLE_K);
  const dt = Math.min(dtSeconds, 1 / 30);
  const alpha = 1 - Math.exp(-dt / tau);
  for (const k of EASED_KEYS) {
    current[k] = current[k] + (target[k] - current[k]) * alpha;
  }
}

/** True when every eased param is within its ε of target (settled — §4.7
 *  transitionActive lifecycle). */
export function easedSettled(
  current: EasedParams,
  target: EasedParams,
): boolean {
  const eps: Partial<Record<keyof EasedParams, number>> = {
    apexCircleHeight: 0.25,
    arcCircleHeight: 0.25,
    waveAmplitude: 0.001,
    invertMix: 0.001,
    audioGain: 0.001,
    spectralMix: 0.001,
    circleOpacityEff: 0.001,
  };
  for (const k of EASED_KEYS) {
    const e = eps[k] ?? 0.01;
    if (Math.abs(target[k] - current[k]) > e) return false;
  }
  return true;
}

/** Identity (idle-pinned) settings + eased scalars → the effective
 *  CircleSawSettings the renderer consumes this frame (plan §3/§4.7).
 *  `audioInvert` stays boolean here for back-compat; the bars memo applies the
 *  `invertMix` crossfade (phase 3) using `eased.invertMix`. */
export function effectiveSettings(
  bundle: CircleVoiceProfile,
  eased: EasedParams,
): CircleSawSettings {
  const identity = bundle.settings.idle; // pinned to idle (plan §3)
  return {
    ...identity,
    apexCircleHeight: eased.apexCircleHeight,
    arcCircleHeight: eased.arcCircleHeight,
    waveAmplitude: eased.waveAmplitude,
    pulseWidth: eased.pulseWidth,
    spectralMix: eased.spectralMix,
    waveSpeed: eased.waveSpeed,
    waveHeight: eased.waveHeight,
    sensitivity: eased.sensitivity,
    noiseFloor: eased.noiseFloor,
    smoothing: eased.smoothing,
  };
}

/** The studio-profiles variant key for the circle voiceset file
 *  (`circle-waveform-voicesets.json`). Network I/O is in `./api`. */
export const VOICE_VARIANT = "circle-waveform-voiceset";

const VOICE_STATES: VoiceState[] = ["idle", "listening", "thinking", "talking"];

const INTEGRITY_NUMERIC_KEYS: (keyof CircleSawSettings)[] = [
  "diameter",
  "apexCircleHeight",
  "arcCircleHeight",
  "barWidth",
  "barGap",
  "waveAmplitude",
  "pulseWidth",
  "smoothing",
  "updateRate",
];

const WAVE_DIRECTIONS: WaveDirection[] = ["inward", "right", "left"];

/** Integrity gate (plan §3/§7). Returns an error string when the bundle is
 *  unusable; null when valid. Never silently fall back to defaults / repair.
 *
 *  R7 (CSW-010, shared + strictly additive load-time robustness guard):
 *  beyond the original schemaVersion / states-present / ambientWave===true /
 *  transitions-present checks, also reject (with a visible error) when —
 *   • any transitions.{toIdle,toListening,toThinking,toTalking,talkingExit}
 *     is not a finite number > 0;
 *   • a state fails to pass `normalizeSettings` (throws);
 *   • a post-normalize critical numeric field is non-finite;
 *   • a post-normalize waveDirection is outside {inward,right,left}.
 *  A valid bundle is unaffected (normalize coerces nothing it didn't
 *  already); this only ever rejects an already-broken save. */
export function checkBundleIntegrity(
  bundle: CircleVoiceProfile | null | undefined,
): string | null {
  if (!bundle || typeof bundle !== "object") return "No voice bundle loaded.";
  if (bundle.schemaVersion !== 1)
    return `Unknown voice-bundle schemaVersion: ${(bundle as { schemaVersion?: unknown }).schemaVersion}`;
  const s = bundle.settings;
  if (!s) return "Voice bundle has no settings.";
  for (const state of VOICE_STATES) {
    if (!s[state]) return `Voice bundle is missing the "${state}" state.`;
    if (s[state].ambientWave !== true)
      return `Voice state "${state}" must have ambientWave === true (the transition continuity model requires the wave clock always running).`;
  }
  if (!s.transitions) return "Voice bundle has no transitions block.";

  // ── R7 additive checks ──
  const t = s.transitions;
  for (const k of [
    "toIdle",
    "toListening",
    "toThinking",
    "toTalking",
    "talkingExit",
  ] as (keyof CircleTransitions)[]) {
    const v = t[k];
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0)
      return `Voice bundle transition "${k}" must be a finite number > 0 (got ${String(v)}).`;
  }
  for (const state of VOICE_STATES) {
    let n: CircleSawSettings;
    try {
      n = normalizeSettings(s[state]);
    } catch (e) {
      return `Voice state "${state}" failed to normalize: ${
        e instanceof Error ? e.message : String(e)
      }`;
    }
    for (const key of INTEGRITY_NUMERIC_KEYS) {
      const val = n[key] as unknown;
      if (typeof val !== "number" || !Number.isFinite(val))
        return `Voice state "${state}" has a non-finite "${String(key)}" after normalize (got ${String(val)}).`;
    }
    if (!WAVE_DIRECTIONS.includes(n.waveDirection))
      return `Voice state "${state}" has an invalid waveDirection "${String(n.waveDirection)}".`;
  }
  return null;
}

// CSW-010 §6 — circle's OWN dedicated, collision-checked Save-as name pool.
// Ported from otherexp's 20 names; 5 retuned to remove collisions against the
// Final-EXP radial-states / radial-waveform / blob-orb / linear-waveform name
// pools (Echo→Aubade, Ember→Refrain, Halcyon→Descant, Reverie→Vibrato,
// Tempo→Lilt). Verified ZERO cross-pool collisions (case-insensitive). Pool
// size is intentionally kept at 20 — size-expansion is a deferred follow-up
// (plan §6/§12), NOT part of this port. Same pickFreshName pattern as
// radial-states / blob gallery: draw a fresh unused name; fall back to
// "<name> 2/3/…" once all are taken.
const CURATED_VOICE_NAMES = [
  "Aria", "Bell", "Cadence", "Chime", "Aubade",
  "Refrain", "Descant", "Harmony", "Hush", "Lyric",
  "Murmur", "Octave", "Resonance", "Vibrato", "Sonnet",
  "Lilt", "Timbre", "Tonal", "Verse", "Whisper",
] as const;

/** Pick an unused curated name for Save-as (radial-states pickFreshName). */
export function pickVoiceProfileName(list: CircleVoiceProfile[]): string {
  const taken = new Set(list.map((p) => p.name.trim().toLowerCase()));
  const free = CURATED_VOICE_NAMES.filter((n) => !taken.has(n.toLowerCase()));
  if (free.length > 0)
    return free[Math.floor(Math.random() * free.length)];
  const base =
    CURATED_VOICE_NAMES[Math.floor(Math.random() * CURATED_VOICE_NAMES.length)];
  let i = 2;
  while (taken.has(`${base} ${i}`.toLowerCase())) i++;
  return `${base} ${i}`;
}
