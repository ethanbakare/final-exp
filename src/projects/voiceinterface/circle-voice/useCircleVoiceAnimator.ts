// CSW-010 P0/3a — the circle-voice transition animator, extracted from
// CircleVoicePreview's VoiceStage as a reusable hook.
//
// Behaviour-preserving relocation of: the eased-param refs, the RAF loop
// (tau ease-from-current, §4.7 transitionActive→settle→snap lifecycle),
// the CSW-002C amplitude-dip wave-direction flip, effectiveSettings, the
// audio-smoothing accumulators, and the per-frame geometry/bars compute.
//
// Two deliberate boundary changes vs the inline original (plan §3a/§3b):
//
//  • Audio-source-agnostic. The hook NEVER imports audioService. The
//    caller owns acquisition and passes a STABLE `getAudioFrame()`
//    getter (page = test pill; Final-EXP CircleRealtimeBlob =
//    `() => audioData.frequencyData ?? null`). The RAF calls it each
//    tick exactly where the inline code read audioService — so RAF deps
//    stay `[bundle]` (never the 16 ms audio frame) and the smoothing
//    accumulators survive. This is the concrete, churn-free realisation
//    of reviewer Finding-4's "ref-backed audio frame, not a RAF dep".
//
//  • Imperative → declarative trigger (Finding-2/6). The caller owns
//    `voiceState` (useState); the hook detects a change via a
//    post-commit `useEffect([voiceState])` and runs the same
//    prevState/dip/lifecycle the old imperative `setVoiceState` did.
//    First render: prev = current = incoming state, eased seeded from
//    that state's target, NO talkingExit, NO dip, transitioning false.
//
// Wave-frozen settled-endpoint parity (plan §3 gate) is invariant to the
// 1-frame trigger-timing shift (it measures settled idle/talking, not
// transition phase), so the extraction is parity-safe by construction
// and verified numerically.

import { useEffect, useRef, useState } from "react";
import {
  type CircleSawSettings,
  type GeneratedBar,
  type RenderedBar,
  type WaveDirection,
  generateBars,
  buildPairRyMap,
  getBarEnvelopeSpatial,
  signedBarIndex,
  computeWaveForBar,
  computeWaveForBarV2,
  combineAudioAndWave,
  computeEnergyAudioScalar,
  mapFrequencyToPairs,
} from "./circleWaveformCore";
import {
  type CircleVoiceProfile,
  type CircleTransitions,
  type EasedParams,
  type VoiceState,
  stateEasedTargets,
  effectiveSettings,
  stepEased,
  easedSettled,
  pickTransitionSeconds,
} from "./circleVoice";

export interface CircleVoiceAnimatorArgs {
  /** Fixed for the hook's lifetime (caller keys the component on id). */
  bundle: CircleVoiceProfile;
  /** Declarative current state (caller-owned useState). */
  voiceState: VoiceState;
  /** Live-editable motion durations (caller-owned ref; read in RAF). */
  transitionsRef: React.MutableRefObject<CircleTransitions>;
  /** Stable audio-frame getter. Hook never acquires audio itself. */
  getAudioFrame: () => Uint8Array | null;
}

export interface CircleVoiceAnimatorResult {
  bars: RenderedBar[];
  /** eased apex height (SVG viewBox height + element height) */
  viewHeight: number;
  radiusX: number;
  radiusY: number;
  circleOpacityEff: number;
  /** apex bars + arc ry map for the editor eye-ghost overlays */
  apexBars: GeneratedBar[];
  arcRyByPair: Map<number, number>;
  /** eased ghost gate inputs */
  ambientWave: boolean;
  waveAmplitude: number;
  transitioning: boolean;
}

export function useCircleVoiceAnimator({
  bundle,
  voiceState,
  transitionsRef,
  getAudioFrame,
}: CircleVoiceAnimatorArgs): CircleVoiceAnimatorResult {
  const identity: CircleSawSettings = bundle.settings.idle;

  const [audioValues, setAudioValues] = useState<Map<number, number>>(
    () => new Map(),
  );
  const [transitioning, setTransitioning] = useState(false);

  const voiceStateRef = useRef<VoiceState>(voiceState);
  const prevStateRef = useRef<VoiceState>(voiceState);
  const easedRef = useRef<EasedParams>(stateEasedTargets(bundle, voiceState));
  const targetRef = useRef<EasedParams>(stateEasedTargets(bundle, voiceState));
  const effectiveRef = useRef<CircleSawSettings>(
    effectiveSettings(bundle, easedRef.current),
  );
  const transitionActiveRef = useRef(false);
  const settledFramesRef = useRef(0);

  // CSW-002C wave-direction dip refs.
  const appliedDirRef = useRef<WaveDirection>(
    bundle.settings[voiceState].waveDirection,
  );
  const waveGateRef = useRef(1);
  const flipPhaseRef = useRef<"none" | "dip" | "rise">("none");

  // First-render guard (plan §3b): the initial voiceState must NOT
  // produce a transition/dip/talkingExit — refs are already seeded to it.
  const mountedRef = useRef(false);

  // Trigger-model conversion: detect a voiceState change AFTER commit
  // (never an in-render ref mutation — Finding-2). Runs the exact
  // prevState/lifecycle/dip the old imperative setVoiceState did.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return; // first render: no edge, no flourish
    }
    if (voiceState === voiceStateRef.current) return;
    prevStateRef.current = voiceStateRef.current;
    voiceStateRef.current = voiceState;
    transitionActiveRef.current = true;
    settledFramesRef.current = 0;
    if (
      bundle.settings[voiceState].waveDirection !== appliedDirRef.current
    ) {
      flipPhaseRef.current = "dip";
    }
    setTransitioning(true);
  }, [voiceState, bundle]);

  // Audio-smoothing accumulators in refs so a resubscribe can never wipe
  // smoothing history mid-transition (plan §4.7).
  const renderTimeRef = useRef(performance.now());
  const audioTargetRef = useRef<Map<number, number>>(new Map());
  const audioCurrentRef = useRef<Map<number, number>>(new Map());
  const apexPairCountRef = useRef(
    Math.max(
      1,
      generateBars(identity, identity.apexCircleHeight).reduce(
        (m, b) => Math.max(m, b.pair),
        0,
      ) + 1,
    ),
  );

  // ambientWave is integrity-guaranteed true, so the loop always runs;
  // deps = [bundle] only (audio frame is pulled via the stable getter,
  // never a dependency — Finding-4).
  useEffect(() => {
    let rafId = 0;
    let lastUpdate = performance.now();
    let lastFrameTime = lastUpdate;

    const tick = (now: number) => {
      const dtMs = Math.min(100, now - lastFrameTime);
      lastFrameTime = now;

      targetRef.current = stateEasedTargets(bundle, voiceStateRef.current);
      const durationSec = pickTransitionSeconds(
        transitionsRef.current,
        prevStateRef.current,
        voiceStateRef.current,
      );
      stepEased(easedRef.current, targetRef.current, durationSec, dtMs / 1000);
      if (transitionActiveRef.current) {
        if (easedSettled(easedRef.current, targetRef.current)) {
          settledFramesRef.current += 1;
          if (settledFramesRef.current >= 4) {
            easedRef.current = { ...targetRef.current };
            transitionActiveRef.current = false;
            prevStateRef.current = voiceStateRef.current;
            setTransitioning(false);
          }
        } else {
          settledFramesRef.current = 0;
        }
      }

      if (flipPhaseRef.current !== "none") {
        const flipTau = 0.18;
        const a = 1 - Math.exp(-Math.min(dtMs / 1000, 1 / 30) / flipTau);
        if (flipPhaseRef.current === "dip") {
          waveGateRef.current += (0 - waveGateRef.current) * a;
          if (waveGateRef.current < 0.03) {
            appliedDirRef.current =
              bundle.settings[voiceStateRef.current].waveDirection;
            flipPhaseRef.current = "rise";
          }
        } else {
          waveGateRef.current += (1 - waveGateRef.current) * a;
          if (waveGateRef.current > 0.97) {
            waveGateRef.current = 1;
            flipPhaseRef.current = "none";
          }
        }
      }

      effectiveRef.current = effectiveSettings(bundle, easedRef.current);

      const s = effectiveRef.current;
      const pc = apexPairCountRef.current;
      const freq = getAudioFrame();
      if (now - lastUpdate >= s.updateRate) {
        lastUpdate = now;
        const mix = s.spectralMix;
        const energyScalar = computeEnergyAudioScalar(
          freq,
          s.sensitivity,
          s.noiseFloor,
        );
        const spectralMap = mapFrequencyToPairs(
          freq,
          pc,
          s.sensitivity,
          s.noiseFloor,
        );
        const nextTarget = new Map<number, number>();
        for (let p = 0; p < pc; p++) {
          const sv = spectralMap.get(p) ?? 0;
          nextTarget.set(p, energyScalar * (1 - mix) + sv * mix);
        }
        audioTargetRef.current = nextTarget;
      }
      const smoothingMs = s.smoothing;
      const lerp = smoothingMs > 0 ? 1 - Math.exp(-dtMs / smoothingMs) : 1;
      const next = new Map<number, number>();
      for (let p = 0; p < pc; p++) {
        const cur = audioCurrentRef.current.get(p) ?? 0;
        const tgt = audioTargetRef.current.get(p) ?? 0;
        next.set(p, cur + (tgt - cur) * lerp);
      }
      audioCurrentRef.current = next;
      renderTimeRef.current = now;
      setAudioValues(next);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [bundle, getAudioFrame, transitionsRef]);

  // ── Per-frame geometry from the EASED heights (plan §4.5). Recomputed
  // every render (= every RAF frame via setAudioValues). ──
  const eff = effectiveRef.current;
  const eased = easedRef.current;
  const apexBars = generateBars(eff, eased.apexCircleHeight);
  const arcBars = generateBars(eff, eased.arcCircleHeight);
  const arcRyByPair = buildPairRyMap(arcBars);
  const { radiusX, radiusY } = getBarEnvelopeSpatial(
    eff,
    eased.apexCircleHeight,
  );
  const apexPairCount = apexBars.length
    ? apexBars.reduce((m, b) => Math.max(m, b.pair), 0) + 1
    : 0;
  apexPairCountRef.current = Math.max(1, apexPairCount);

  const time = renderTimeRef.current / 1000;
  const useWave = eff.ambientWave;
  const isLegacyPath =
    eff.waveShape === "sine" && eff.waveCycles === undefined;
  const maxPairIndex = apexPairCount > 0 ? apexPairCount - 1 : 0;
  const effectiveCycles = eff.waveCycles ?? 1;
  const invertMix = eased.invertMix;
  const circleOpacityEff = eased.circleOpacityEff;
  const audioGain = eased.audioGain;
  const waveDir = appliedDirRef.current;
  const waveGate = waveGateRef.current;
  const bars: RenderedBar[] = apexBars.map((bar) => {
    const audioEff = (audioValues.get(bar.pair) ?? 0) * audioGain;
    let v = audioEff;
    if (useWave) {
      const idx = signedBarIndex(bar, radiusX);
      const wave = isLegacyPath
        ? computeWaveForBar(waveDir, idx, time, eff.waveSpeed, eff.waveSpread)
        : computeWaveForBarV2(
            eff.waveShape,
            waveDir,
            idx,
            maxPairIndex,
            time,
            eff.waveSpeed,
            effectiveCycles,
            eff.pulseWidth,
          );
      v = combineAudioAndWave(
        audioEff,
        wave,
        eff.waveMode,
        eff.waveAmplitude * waveGate,
        eff.waveHeight,
      );
    }
    const arcRy = arcRyByPair.get(bar.pair) ?? bar.radiusY;
    const apexRy = bar.radiusY;
    const heightV = v + invertMix * (1 - 2 * v);
    return {
      ...bar,
      radiusY: arcRy + heightV * (apexRy - arcRy),
      value: v,
    };
  });

  return {
    bars,
    viewHeight: eff.apexCircleHeight,
    radiusX,
    radiusY,
    circleOpacityEff,
    apexBars,
    arcRyByPair,
    ambientWave: eff.ambientWave,
    waveAmplitude: eff.waveAmplitude,
    transitioning,
  };
}
