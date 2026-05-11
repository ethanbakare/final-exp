/**
 * useLinkedRadialAnimator — JS-owned animator for radial state morphs.
 *
 * Driven by `state` (the requested target). When state changes, the hook
 * captures the current emitted values as the morph start and lerps toward
 * the new state's row over the appropriate `morph.*` duration. The output
 * (`RadialRenderValues`) is meant to be merged with `composeBaseWaveformProps`
 * by the cell consumer.
 *
 * Phase 1 v1 of the hook:
 *  - thinking ↔ idle/listening damp (no Phase A/B, single-segment lerp)
 *  - thinking → talking forward path: Phase A translation + flip + Phase B
 *    reactive ramp, anchor target = talkingAnchor + minBarLength,
 *    inwardRatio steps 1 → 0 at flip
 *  - talking → idle/listening reverse path: reverse-reactive Phase A +
 *    inverse flip + translation Phase B with idle params lerping in parallel
 *  - composed transitions (idle → talking) run as two sequential legs via
 *    intendedFinalState
 *  - mid-morph interruption: capture current values, classify
 *    (talking-like vs idle-like) by inwardRatio, restart lerp toward new
 *    target. The collapse-to-min flip-precondition for idle/talking
 *    interruptions is deferred to a follow-up — v1 accepts a small
 *    visual snap if the user clicks Talking mid-damp before tail-clamp.
 */
import { useEffect, useRef, useState } from 'react';
import type { RadialLinkedProfile, RadialStateSettings } from './api';
import { deriveTalkingAnchor } from './api';
import type { RadialState } from './types';

export interface RadialRenderValues {
  anchor: number;
  inwardRatio: 0 | 1;
  minBarLength: number;
  maxBarLength: number;
  sensitivity: number;
  freezeAtMin: boolean;
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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Resting-state RenderValues for a given state — what the cell should
 *  show when no morph is in progress. */
function restingValues(profile: RadialLinkedProfile, state: RadialState): RadialRenderValues {
  const s: RadialStateSettings = profile[state];
  const isTalking = state === 'talking';
  const anchor = isTalking ? deriveTalkingAnchor(profile) : profile.geometry.idleRadius;
  // Thinking is frozen at min — driven by freezeAtMin in renderer.
  const isThinking = state === 'thinking';
  return {
    anchor,
    inwardRatio: isTalking ? 0 : 1,
    minBarLength: s.minBarLength,
    maxBarLength: s.maxBarLength,
    sensitivity: isThinking ? 0 : s.sensitivity,
    freezeAtMin: isThinking,
    ambientWave: isThinking ? false : s.ambientWave,
    waveSpeed: s.waveSpeed,
    waveAmplitude: isThinking ? 0 : s.waveAmplitude,
    waveHeight: s.waveHeight,
    waveMode: s.waveMode,
    waveShape: s.waveShape,
    waveLobes: s.waveLobes,
    smoothing: s.smoothing,
    waveEnvelope: isThinking ? 0 : s.waveEnvelope,
    envelopeAmplitude: isThinking ? 0 : s.envelopeAmplitude,
    envelopeSensitivity: s.envelopeSensitivity,
    intensityOpacity: s.intensityOpacity,
  };
}

/** Pick the appropriate morph duration for a (from, to) leg. */
function pickDuration(from: RadialState, to: RadialState, profile: RadialLinkedProfile): number {
  if (from === 'talking' || to === 'talking') return profile.morph.thinkingToTalking;
  return profile.morph.idleToThinking;
}

/** All transitions are direct now. Forward to talking from any state
 *  damps + translates IN PARALLEL in Phase A (bars shrink to min while
 *  the ring slides inward); reverse from talking to any state mirrors
 *  it. No composed pre-leg through thinking — that produced the "bars
 *  stop at thinking shape, then slide inward" double-motion the user
 *  flagged. */
function nextLegFrom(_start: RadialState, _finalTarget: RadialState): RadialState | null {
  return null;
}

interface AnimatorState {
  morphActive: boolean;
  morphStart: RadialRenderValues;
  morphFrom: RadialState;
  morphTarget: RadialState;
  morphT: number; // 0..1
  morphDuration: number;
  intendedFinalState: RadialState | null;
  currentlyIn: RadialState;
  /** Frames since freezeAtMin became true; reset to 0 when false.
   *  Used as flip-precondition proxy (R7 P1.2): smoothing converges
   *  within ~6 frames at default. */
  minPinnedFor: number;
}

export function useLinkedRadialAnimator(
  profile: RadialLinkedProfile | null,
  requestedState: RadialState,
): RadialRenderValues | null {
  const [render, setRender] = useState<RadialRenderValues | null>(() =>
    profile ? restingValues(profile, requestedState) : null,
  );

  const profileRef = useRef(profile);
  const requestedStateRef = useRef(requestedState);
  const renderRef = useRef(render);
  const animRef = useRef<AnimatorState | null>(null);
  const lastTsRef = useRef(performance.now());

  profileRef.current = profile;
  requestedStateRef.current = requestedState;
  renderRef.current = render;

  // Seed render once profile becomes available.
  useEffect(() => {
    if (profile && !render) {
      const r = restingValues(profile, requestedState);
      setRender(r);
      renderRef.current = r;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // On state change, start a new morph (or no-op if already there).
  useEffect(() => {
    const p = profileRef.current;
    if (!p) return;
    const cur = renderRef.current;
    if (!cur) return;

    const anim = animRef.current;
    const targetState = requestedState;

    // Same-target during morph: no-op (don't restart).
    if (anim?.morphActive && anim.intendedFinalState === targetState) return;
    // Already at target, no morph: no-op.
    if (!anim?.morphActive && (anim?.currentlyIn ?? targetState) === targetState && cur) {
      // Snap currentlyIn for first call.
      animRef.current = {
        ...(anim ?? {
          morphActive: false,
          morphStart: cur,
          morphFrom: targetState,
          morphTarget: targetState,
          morphT: 1,
          morphDuration: 0.3,
          intendedFinalState: null,
          currentlyIn: targetState,
          minPinnedFor: 0,
        }),
        currentlyIn: targetState,
      };
      return;
    }

    // Direct routing — no more collapse-to-min through thinking. Forward
    // Phase A (to-talking) and reverse Phase A (from-talking) both damp
    // bars to min IN PARALLEL with the translation, so the bars settle
    // at min by the end of Phase A naturally. classifiedSource is still
    // needed for talking-like captured frames so an interrupted forward
    // morph reverses via the right path.
    const fromState = anim?.currentlyIn ?? targetState;
    const isTalkingLike =
      cur.inwardRatio === 0 ||
      anim?.morphFrom === 'talking' ||
      anim?.morphTarget === 'talking';
    const classifiedSource: RadialState = isTalkingLike ? 'talking' : fromState;
    const legTarget: RadialState = targetState;
    const legFrom = classifiedSource;
    const minPinnedFor = anim?.minPinnedFor ?? 0;

    animRef.current = {
      morphActive: true,
      morphStart: cur,
      morphFrom: legFrom,
      morphTarget: legTarget,
      morphT: 0,
      morphDuration: pickDuration(legFrom, legTarget, p),
      intendedFinalState: targetState,
      currentlyIn: legFrom,
      minPinnedFor,
    };
  }, [requestedState]);

  // RAF loop.
  useEffect(() => {
    let raf = 0;
    const tick = (ts: number) => {
      const dt = Math.min((ts - lastTsRef.current) / 1000, 1 / 30);
      lastTsRef.current = ts;
      const p = profileRef.current;
      const anim = animRef.current;
      const cur = renderRef.current;

      if (!p || !cur) {
        raf = requestAnimationFrame(tick);
        return;
      }

      if (!anim || !anim.morphActive) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // Advance morphT.
      anim.morphT = Math.min(1, anim.morphT + dt / Math.max(0.001, anim.morphDuration));
      const t = anim.morphT;

      const next = computeMorphFrame(p, anim, t);
      // Maintain minPinnedFor counter (used for interruption logic).
      if (next.freezeAtMin) anim.minPinnedFor += 1;
      else anim.minPinnedFor = 0;
      renderRef.current = next;
      setRender(next);

      // Leg complete?
      if (t >= 1) {
        anim.currentlyIn = anim.morphTarget;
        // Next leg if composed.
        if (
          anim.intendedFinalState &&
          anim.intendedFinalState !== anim.currentlyIn
        ) {
          const legFrom = anim.currentlyIn;
          const intermediate = nextLegFrom(legFrom, anim.intendedFinalState);
          const legTarget = intermediate ?? anim.intendedFinalState;
          anim.morphStart = next;
          anim.morphFrom = legFrom;
          anim.morphTarget = legTarget;
          anim.morphT = 0;
          anim.morphDuration = pickDuration(legFrom, legTarget, p);
        } else {
          anim.morphActive = false;
          anim.intendedFinalState = null;
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return render;
}

/** Per-frame compute. Handles the three morph kinds:
 *  - thinking → talking forward: Phase A translation + flip + Phase B reactive
 *  - talking → idle/listening reverse: reverse-reactive + flip + translation
 *  - everything else: single-segment lerp from start to target's resting */
function computeMorphFrame(
  profile: RadialLinkedProfile,
  anim: AnimatorState,
  t: number,
): RadialRenderValues {
  const start = anim.morphStart;
  const target = restingValues(profile, anim.morphTarget);
  const reactiveStartAt = profile.morph.reactiveStartAt;

  // --- FORWARD to talking (from any non-talking state) ---
  // Phase A: translate + damp simultaneously. Bars shrink toward the
  // morph pin (thinking.minBarLength) while the ring slides inward, so
  // by the end of Phase A they're at min length at talkingAnchor+min,
  // ready to flip into talking's outward orientation. No "stop at
  // thinking shape" middle frame.
  if (anim.morphFrom !== 'talking' && anim.morphTarget === 'talking') {
    const talkingAnchor = deriveTalkingAnchor(profile);
    const phaseAEnd = reactiveStartAt;
    const morphPinLength = profile.thinking.minBarLength;
    if (t < phaseAEnd) {
      const tA = phaseAEnd > 0 ? t / phaseAEnd : 1;
      const anchorTarget = talkingAnchor + morphPinLength;
      return {
        ...start,
        anchor: lerp(start.anchor, anchorTarget, tA),
        inwardRatio: 1,
        // Engage freezeAtMin only in the last 10% of Phase A so the
        // smoothing taper below has time to bring value (and therefore
        // length) close to min before the renderer-side clamp fires.
        // Avoids the value=0 snap that would happen at tA=0 from a
        // listening start (where bars are still at reactive height).
        freezeAtMin: tA >= 0.9,
        // Lerp minBarLength from start's value to thinking's pin so
        // bars visibly shrink to min height during translation. From
        // thinking, start.minBarLength === morphPinLength so this is
        // a no-op (still works from thinking → talking too).
        minBarLength: lerp(start.minBarLength, morphPinLength, tA),
        // Damp all reactive params to 0 over Phase A.
        sensitivity: lerp(start.sensitivity, 0, tA),
        ambientWave: tA < 0.95 ? start.ambientWave : false,
        waveAmplitude: lerp(start.waveAmplitude, 0, tA),
        waveEnvelope: lerp(start.waveEnvelope, 0, tA),
        envelopeAmplitude: lerp(start.envelopeAmplitude, 0, tA),
        envelopeSensitivity: lerp(start.envelopeSensitivity, 0, tA),
        // Taper smoothing toward 0 in second half so value converges
        // to 0 via audio path BEFORE freezeAtMin engages at tA=0.9.
        smoothing: tA > 0.5
          ? lerp(start.smoothing, 0, (tA - 0.5) / 0.5)
          : start.smoothing,
        waveSpeed: lerp(start.waveSpeed, target.waveSpeed, t),
        waveHeight: lerp(start.waveHeight, target.waveHeight, t),
        waveMode: tA < 0.5 ? start.waveMode : target.waveMode,
        waveShape: tA < 0.5 ? start.waveShape : target.waveShape,
        waveLobes: lerp(start.waveLobes, target.waveLobes, t),
        intensityOpacity: tA < 0.5 ? start.intensityOpacity : target.intensityOpacity,
        maxBarLength: lerp(start.maxBarLength, target.maxBarLength, t),
      };
    } else {
      const tB = (1 - phaseAEnd) > 0 ? (t - phaseAEnd) / (1 - phaseAEnd) : 1;
      return {
        ...target,
        anchor: talkingAnchor,
        inwardRatio: 0,
        freezeAtMin: false,
        // minBarLength lerps from morph pin → talking's resting min
        minBarLength: lerp(morphPinLength, target.minBarLength, tB),
        sensitivity: lerp(0, target.sensitivity, tB),
        ambientWave: target.ambientWave,
        waveAmplitude: lerp(0, target.waveAmplitude, tB),
        waveEnvelope: lerp(0, target.waveEnvelope, tB),
        envelopeAmplitude: lerp(0, target.envelopeAmplitude, tB),
        maxBarLength: lerp(start.maxBarLength, target.maxBarLength, t),
        // Taper smoothing IN — start at 0 (immediate audio response so
        // bars catch up to the growing reactive target during the morph),
        // ease up to target.smoothing by morph end. Without this, the
        // renderer's smoothing lag (~30 frames at smoothing=0.95) means
        // talking's reactive style only blooms ~0.5s AFTER the morph
        // completes — that's the "suddenly appears abruptly" the user saw.
        smoothing: lerp(0, target.smoothing, tB),
      };
    }
  }

  // --- REVERSE from talking to any non-talking state ---
  // Phase A: bars stay at talkingAnchor, reactive fades to 0, smoothing
  // tapers, freezeAtMin engages in the tail. Flip inverts direction
  // (inwardRatio 0 → 1, anchor → talkingAnchor + min). Phase B: bars
  // translate outward to target.anchor while target's reactive params
  // ramp in (or stay at 0 if target is frozen / thinking).
  if (anim.morphFrom === 'talking' && anim.morphTarget !== 'talking') {
    const talkingAnchor = deriveTalkingAnchor(profile);
    const reverseAEnd = 1 - reactiveStartAt;
    const morphPinLength = profile.thinking.minBarLength;
    const targetIsFrozen = target.freezeAtMin;
    if (t < reverseAEnd) {
      const tA = reverseAEnd > 0 ? t / reverseAEnd : 1;
      const tailClamp = tA >= 0.9;
      return {
        ...start,
        anchor: talkingAnchor,
        inwardRatio: 0,
        freezeAtMin: tailClamp,
        minBarLength: lerp(start.minBarLength, morphPinLength, tA),
        sensitivity: lerp(start.sensitivity, 0, tA),
        ambientWave: tA < 0.5 ? start.ambientWave : false,
        waveAmplitude: lerp(start.waveAmplitude, 0, tA),
        waveEnvelope: lerp(start.waveEnvelope, 0, tA),
        envelopeAmplitude: lerp(start.envelopeAmplitude, 0, tA),
        maxBarLength: lerp(start.maxBarLength, target.maxBarLength, t),
        smoothing: tA > 0.5
          ? lerp(start.smoothing, 0, (tA - 0.5) / 0.5)
          : start.smoothing,
      };
    } else {
      const tB = reactiveStartAt > 0 ? (t - reverseAEnd) / reactiveStartAt : 1;
      const startAnchor = talkingAnchor + morphPinLength;
      return {
        ...target,
        anchor: lerp(startAnchor, target.anchor, tB),
        inwardRatio: 1,
        // If destination is frozen (thinking), keep freezeAtMin true
        // throughout. Otherwise release at the very end so the audio
        // path takes over.
        freezeAtMin: targetIsFrozen ? true : tB < 1,
        minBarLength: lerp(morphPinLength, target.minBarLength, tB),
        sensitivity: targetIsFrozen ? 0 : lerp(0, target.sensitivity, tB),
        ambientWave: targetIsFrozen ? false : (tB > 0.5 ? target.ambientWave : false),
        waveAmplitude: targetIsFrozen ? 0 : lerp(0, target.waveAmplitude, tB),
        waveEnvelope: targetIsFrozen ? 0 : lerp(0, target.waveEnvelope, tB),
        envelopeAmplitude: targetIsFrozen ? 0 : lerp(0, target.envelopeAmplitude, tB),
        maxBarLength: lerp(start.maxBarLength, target.maxBarLength, t),
        smoothing: lerp(0, target.smoothing, tB),
      };
    }
  }

  // --- everything else: simple lerp (idle/listening ↔ thinking damp) ---
  // When the target is frozen (thinking), we taper smoothing toward 0 in
  // the second half so the audio path converges value to 0 BEFORE t=1.
  // This lets freezeAtMin engage at t=1 as a no-op rather than a snap.
  // The previous code engaged freezeAtMin at t=0.9 and yanked length to
  // min in one frame — that's the listening→thinking glitch.
  const headedToFrozen = target.freezeAtMin;
  const smoothingTaper =
    headedToFrozen && t > 0.5
      ? lerp(start.smoothing, 0, (t - 0.5) / 0.5)
      : lerp(start.smoothing, target.smoothing, t);
  // If target silences wave (ambientWave=false on thinking), fade
  // amplitude smoothly across the whole damp rather than stepping
  // ambientWave off mid-damp (which yanks the wave contribution).
  const targetSilencesWave = !target.ambientWave;
  const waveAmpLerp = targetSilencesWave
    ? lerp(start.waveAmplitude, 0, t)
    : lerp(start.waveAmplitude, target.waveAmplitude, t);
  const waveEnvLerp = targetSilencesWave
    ? lerp(start.waveEnvelope, 0, t)
    : lerp(start.waveEnvelope, target.waveEnvelope, t);
  const envAmpLerp = targetSilencesWave
    ? lerp(start.envelopeAmplitude, 0, t)
    : lerp(start.envelopeAmplitude, target.envelopeAmplitude, t);

  return {
    anchor: lerp(start.anchor, target.anchor, t),
    inwardRatio: t < 0.5 ? start.inwardRatio : target.inwardRatio,
    minBarLength: lerp(start.minBarLength, target.minBarLength, t),
    maxBarLength: lerp(start.maxBarLength, target.maxBarLength, t),
    sensitivity: lerp(start.sensitivity, target.sensitivity, t),
    // Engage freezeAtMin only at the very end (when target requires it).
    // Smoothing taper has brought value ~0 by then, so the engagement
    // is visually a no-op rather than a snap.
    freezeAtMin: t >= 1 ? target.freezeAtMin : false,
    // Defer ambientWave step until late in the damp, after waveAmplitude
    // has had time to fade — prevents the wave from "vanishing" at t=0.5.
    ambientWave: t < 0.95 ? start.ambientWave : target.ambientWave,
    waveSpeed: lerp(start.waveSpeed, target.waveSpeed, t),
    waveAmplitude: waveAmpLerp,
    waveHeight: lerp(start.waveHeight, target.waveHeight, t),
    waveMode: t < 0.5 ? start.waveMode : target.waveMode,
    waveShape: t < 0.5 ? start.waveShape : target.waveShape,
    waveLobes: lerp(start.waveLobes, target.waveLobes, t),
    smoothing: smoothingTaper,
    waveEnvelope: waveEnvLerp,
    envelopeAmplitude: envAmpLerp,
    envelopeSensitivity: lerp(start.envelopeSensitivity, target.envelopeSensitivity, t),
    intensityOpacity: t < 0.5 ? start.intensityOpacity : target.intensityOpacity,
  };
}
