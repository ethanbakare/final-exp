/**
 * CoralRealtimeBlob — Coral D orb for the realtime page. Same
 * audioData/voiceState surface as NebularrBlob so RealtimeBlob can
 * dispatch by shader. Pure renderer: receives a CoralRealtimeSettings
 * object (or null), falls back to CORAL_FALLBACK_PROFILE.
 *
 * Coral's native morph animator drives the sphere ↔ torus transition.
 * morphRef inside CoralStoneMorph initializes to 0 (sphere); we pass
 * goal=0 for talking (sphere shape) and goal=1 otherwise (torus). On
 * fresh mount with the default voiceState='idle', morphRef advances
 * 0 → 1 — that's the talking-to-idle intro, no extra code needed.
 *
 * Switching profile A → B within Coral does NOT trigger an intro
 * because the wrapper stays mounted; only props change. Editor's
 * Replay button uses a key={replayCounter} prop on the editor canvas
 * to force remount within the same shader.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import CoralStoneMorph from '@/projects/blob-orb/variants/CoralStoneMorph';
import type { AudioData } from '@/projects/voiceinterface/types';

type RealtimeVoiceState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';

export interface CoralRealtimeSettings {
  base: {
    scale: number;
    torusRadius: number;
    waveIntensity: number;
    breathAmp: number;
    idleAmp: number;
    morphSpeed: number;
    color1: string;
    color2: string;
    color3: string;
    bgColor: string;
    /** Plan v8 Phase 4 — top of the thinking-pulse range. Optional;
     *  renderer falls back to CORAL_PULSE_DEFAULTS.thickRadius when
     *  missing (legacy entries pre-Phase-4). Pulse is only visible
     *  when thickRadius > torusRadius. */
    thickRadius?: number;
    /** Plan v8 Phase 4 — half-cycle duration in seconds (thin → thick).
     *  Full cycle (thin → thick → thin) = pulseSpeed * 2. Optional;
     *  renderer falls back to CORAL_PULSE_DEFAULTS.pulseSpeed when
     *  missing. Half-cycle semantics match LoopingBlob.tsx exactly. */
    pulseSpeed?: number;
  };
  talking?: {
    morphSpeed?: number;
    scale?: number;
    waveIntensity?: number;
    color3?: string;
  };
}

/** Defaults for Phase 4's optional pulse fields. Applied at use site
 *  by useCoralThinkingPulse and by VoiceRealtimeOpenAI's defensive
 *  orbs projection. */
export const CORAL_PULSE_DEFAULTS = {
  thickRadius: 0.45,
  pulseSpeed: 0.6,
} as const;

interface CoralRealtimeBlobProps {
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  profile: CoralRealtimeSettings | null;
  width?: number;
  height?: number;
}

/**
 * Hardcoded fallback used only when the profile prop is null AND the
 * fetched list for the realtime-coral variant came back empty or
 * unavailable. Values mirror today's live RealtimeBlob Coral props
 * (REALTIME_BASE.scale=1.04, REALTIME_BASE.thinRadius=0.275 passed as
 * torusRadius, DEFAULT_STATE_SETTINGS.idle/talking thickenSpeed × 1.08
 * for morphSpeed, plus WHIMSY_BASE colors). Same shape as the seed
 * entry in realtime-coral-profiles.json.
 */
export const CORAL_FALLBACK_PROFILE: CoralRealtimeSettings = {
  base: {
    scale: 1.04,
    torusRadius: 0.275,
    waveIntensity: 0.18,
    breathAmp: 0.03,
    idleAmp: 0.02,
    morphSpeed: 1.296,
    color1: '#944b2e',
    color2: '#ffa279',
    color3: '#ffc4c4',
    bgColor: '#f7f6f4',
    // Phase 4 pulse defaults explicit on the fallback so any consumer
    // reading `CORAL_FALLBACK_PROFILE.base.thickRadius` (without going
    // through the optional `?? CORAL_PULSE_DEFAULTS` path) gets a real
    // value.
    thickRadius: CORAL_PULSE_DEFAULTS.thickRadius,
    pulseSpeed: CORAL_PULSE_DEFAULTS.pulseSpeed,
  },
  talking: {
    morphSpeed: 0.54,
    waveIntensity: 0.2,
  },
};

/**
 * Plan v8 Phase 4B — Coral thinking pulse hook.
 *
 * Lifted from LoopingBlob.tsx:200-213's setPulseRadius RAF mechanism,
 * generalized over a plain `isThinking` boolean so both the realtime
 * page (this file's CoralRealtimeBlob) and the editor's canvas
 * dispatch (realtime-states.tsx) can consume the same code path.
 *
 * Returns a pulse value (number) while `isThinking` is true, or `null`
 * otherwise. Consumers do `effectiveTorusRadius = pulse ?? thinRadius`
 * — the static torusRadius applies in non-thinking states; the pulse
 * overrides it during thinking.
 *
 * Triangle wave: `phase = thin → thick → thin → thick → ...`. Each
 * thin → thick edge takes `pulseSpeed` seconds (half-cycle). A full
 * cycle is `pulseSpeed * 2` seconds. Half-cycle semantics match
 * LoopingBlob exactly; the slider label reads "Pulse Speed (thin → thick)"
 * to make this concrete in the editor.
 *
 * RAF cleanup is handled by the useEffect's return; switching out of
 * thinking cancels the running animation within ~1 frame.
 */
export function useCoralThinkingPulse(args: {
  isThinking: boolean;
  thinRadius: number;
  thickRadius?: number;
  pulseSpeed?: number;
}): number | null {
  const { isThinking, thinRadius } = args;
  const thickRadius = args.thickRadius ?? CORAL_PULSE_DEFAULTS.thickRadius;
  const pulseSpeed = args.pulseSpeed ?? CORAL_PULSE_DEFAULTS.pulseSpeed;
  const [pulseRadius, setPulseRadius] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isThinking) {
      setPulseRadius(null);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    const startTime = performance.now();
    const halfCycle = Math.max(0.05, pulseSpeed); // floor against 0 to avoid div-by-zero
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const cycleCount = elapsed / halfCycle;
      const t = cycleCount % 2;             // 0..2 oscillation
      const phase = t < 1 ? t : 2 - t;       // triangle wave 0..1..0
      setPulseRadius(thinRadius + phase * (thickRadius - thinRadius));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isThinking, thinRadius, thickRadius, pulseSpeed]);

  return pulseRadius;
}

/**
 * Plan v8 follow-up — Coral state-prop easing.
 *
 * Coral's CoralStoneMorph internally animates `morphRef` (sphere ↔
 * torus) but every other prop (scale, waveIntensity, color3, etc.)
 * applies instantly each render. That means when voiceState flips
 * (e.g., listening → talking), the morph eases over `talking.morphSpeed`
 * but `scale` SNAPS to `talking.scale` in one frame — visually
 * unnatural compared to Tube's animator which lerps everything.
 *
 * `useEasedNumber` gives us per-prop lerping at the wrapper level,
 * matching the geometric morph duration. Three of these run in
 * parallel for the three eased props (scale, waveIntensity, color3).
 *
 * The lerp is linear (matches Coral's morph philosophy — literal
 * seconds, no tau coefficient). Duration = morphSpeed parameter.
 *
 * Re-targeting mid-animation snaps the start value to the current
 * eased value, so rapid state flips don't produce jumps.
 */
export function useEasedNumber(
  target: number,
  duration: number,
  opts?: {
    /** Initial value on first mount. Also the value the hook snaps to
     *  when `resetKey` changes. Use this to start the eased value at
     *  a different point than the target — e.g., talking.scale on
     *  Coral mount so the orb visibly grows from talking shape to
     *  idle shape concurrent with the geometric sphere → torus
     *  intro. Defaults to `target`. */
    startValue?: number;
    /** Optional reset trigger. When this value changes, the hook
     *  snaps the eased value back to `startValue` and begins a new
     *  animation toward `target`. Use to retrigger the prop-easing
     *  intro on Replay (editor) or on cross-shader mount. */
    resetKey?: unknown;
  },
): number {
  const startValue = opts?.startValue ?? target;
  const [current, setCurrent] = useState(startValue);
  const currentRef = useRef(startValue);
  const rafRef = useRef<number | null>(null);
  const lastResetKeyRef = useRef(opts?.resetKey);

  // Keep ref in sync with the latest committed value so the next
  // animation can start from where we are right now (unless reset).
  useEffect(() => {
    currentRef.current = current;
  });

  useEffect(() => {
    let from = currentRef.current;
    // Reset trigger: snap to startValue then animate toward target.
    if (opts?.resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = opts?.resetKey;
      from = startValue;
      currentRef.current = startValue;
      setCurrent(startValue);
    }
    if (Math.abs(target - from) < 1e-9) return; // already at target
    const startTime = performance.now();
    const safeDuration = Math.max(0.05, duration);
    const fromValue = from;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const t = Math.min(1, elapsed / safeDuration);
      const value = fromValue + t * (target - fromValue);
      currentRef.current = value;
      setCurrent(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, opts?.resetKey, startValue]);

  return current;
}

/**
 * Color variant of useEasedNumber. Lerps RGB triples from `current`
 * toward `target` (both hex strings like '#ffa279'). Returns hex.
 *
 * Hex parse is forgiving — invalid hex (or shorthand like '#abc')
 * falls back to a reasonable default rather than crashing.
 */
export function useEasedColor(
  target: string,
  duration: number,
  opts?: { startValue?: string; resetKey?: unknown },
): string {
  const startValue = opts?.startValue ?? target;
  const [current, setCurrent] = useState(startValue);
  const currentRef = useRef(startValue);
  const rafRef = useRef<number | null>(null);
  const lastResetKeyRef = useRef(opts?.resetKey);

  useEffect(() => {
    currentRef.current = current;
  });

  useEffect(() => {
    let startHex = currentRef.current;
    if (opts?.resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = opts?.resetKey;
      startHex = startValue;
      currentRef.current = startValue;
      setCurrent(startValue);
    }
    if (target === startHex) return;
    const startRgb = parseHex(startHex);
    const targetRgb = parseHex(target);
    const startTime = performance.now();
    const safeDuration = Math.max(0.05, duration);

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const t = Math.min(1, elapsed / safeDuration);
      const r = startRgb[0] + t * (targetRgb[0] - startRgb[0]);
      const g = startRgb[1] + t * (targetRgb[1] - startRgb[1]);
      const b = startRgb[2] + t * (targetRgb[2] - startRgb[2]);
      const hex = rgbToHex(r, g, b);
      currentRef.current = hex;
      setCurrent(hex);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, opts?.resetKey, startValue]);

  return current;
}

function parseHex(hex: string): [number, number, number] {
  if (typeof hex !== 'string' || hex.length < 7 || hex[0] !== '#') return [128, 128, 128];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return [128, 128, 128];
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const CoralRealtimeBlob: React.FC<CoralRealtimeBlobProps> = ({
  audioData,
  voiceState,
  profile,
  width = 328,
  height = 328,
}) => {
  const active = profile ?? CORAL_FALLBACK_PROFILE;
  const isTalking = voiceState === 'ai_speaking';
  const isThinking = voiceState === 'ai_thinking';

  // Coral's morph axis: 0 = sphere (talking shape), 1 = torus (idle/listening/thinking).
  const goal = isTalking ? 0 : 1;

  // Phase 4B — thinking pulse on torusRadius. `pulse` is a number while
  // thinking, null otherwise; non-thinking states use the static
  // base.torusRadius.
  const pulse = useCoralThinkingPulse({
    isThinking,
    thinRadius: active.base.torusRadius,
    thickRadius: active.base.thickRadius,
    pulseSpeed: active.base.pulseSpeed,
  });
  const effectiveTorusRadius = pulse ?? active.base.torusRadius;

  // Per-state target values. Coral only differentiates talking today;
  // idle/listening/thinking all use base values. These are the TARGETS
  // for the easing hooks below — actual prop values flow through
  // useEasedNumber / useEasedColor so transitions feel coherent with
  // the geometric morph instead of snapping.
  const targetMorphSpeed =
    isTalking ? (active.talking?.morphSpeed ?? active.base.morphSpeed) : active.base.morphSpeed;
  const targetScale =
    isTalking ? (active.talking?.scale ?? active.base.scale) : active.base.scale;
  const targetWaveIntensity =
    isTalking
      ? (active.talking?.waveIntensity ?? active.base.waveIntensity)
      : active.base.waveIntensity;
  const targetColor3 =
    isTalking ? (active.talking?.color3 ?? active.base.color3) : active.base.color3;

  // Easing duration matches the geometric morph: `talking.morphSpeed`
  // going INTO talking (sphere collapse), `base.morphSpeed` coming
  // OUT (torus restore). Scale / waveIntensity / color3 lerp over the
  // same window so the visual transition feels unified.
  const transitionDuration = isTalking
    ? (active.talking?.morphSpeed ?? active.base.morphSpeed)
    : active.base.morphSpeed;

  // startValue mounts the eased values at the TALKING profile's
  // values. CoralStoneMorph initializes morphRef=0 (sphere = talking
  // shape) on mount; pairing the eased props with talking values means
  // the orb visibly starts at the talking shape AND the talking
  // scale/wave/color, then eases to the idle/base values concurrent
  // with the geometric morph (sphere → torus). This is the intro
  // animation the user expects.
  const startScale = active.talking?.scale ?? active.base.scale;
  const startWave = active.talking?.waveIntensity ?? active.base.waveIntensity;
  const startColor3 = active.talking?.color3 ?? active.base.color3;

  const effectiveScale = useEasedNumber(targetScale, transitionDuration, { startValue: startScale });
  const effectiveWaveIntensity = useEasedNumber(targetWaveIntensity, transitionDuration, { startValue: startWave });
  const effectiveColor3 = useEasedColor(targetColor3, transitionDuration, { startValue: startColor3 });

  // morphSpeed is the duration parameter for CoralStoneMorph's internal
  // morph animation — snapping is fine (and actually correct, since
  // changing it mid-morph would shift the active animation's clock).
  const effectiveMorphSpeed = targetMorphSpeed;

  // Math safety: CoralStoneMorph computes `delta / morphSpeed`. With both
  // delta and morphSpeed at 0 (rare but possible on the first frame after
  // mount), the result is NaN and propagates into morphRef permanently.
  // The 0.001 floor is small enough that 0 on the user-facing slider still
  // produces a near-instant transition.
  const safeMorphSpeed = Math.max(0.001, effectiveMorphSpeed);

  return (
    <div className="realtime-blob" style={{ width, height, position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        frameloop="always"
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <CoralStoneMorph
          audioData={audioData}
          goal={goal}
          scale={effectiveScale}
          morphSpeed={safeMorphSpeed}
          torusRadius={effectiveTorusRadius}
          waveIntensity={effectiveWaveIntensity}
          breathAmp={active.base.breathAmp}
          idleAmp={active.base.idleAmp}
          color1={active.base.color1}
          color2={active.base.color2}
          color3={effectiveColor3}
        />
      </Canvas>
    </div>
  );
};
