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
  // Tracks the previous user-selected state so we can detect transitions
  // even on first click (when animRef is still null). Without this, the
  // state-change effect couldn't tell "the user was at listening and just
  // clicked talking" from "the user is initially at talking" — and routed
  // every first-click as a same-target no-op or a same-state degenerate
  // lerp that bypassed the forward/reverse Phase A/B branches.
  const lastRequestedStateRef = useRef<RadialState>(requestedState);

  // Seed render once profile becomes available.
  useEffect(() => {
    if (profile && !render) {
      const r = restingValues(profile, requestedState);
      setRender(r);
      renderRef.current = r;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // On state change, start a new morph.
  useEffect(() => {
    const p = profileRef.current;
    if (!p) return;
    const cur = renderRef.current;
    if (!cur) return;

    const previousRequestedState = lastRequestedStateRef.current;
    lastRequestedStateRef.current = requestedState;

    // Same state — no-op. (Also covers React 18 StrictMode double-fire
    // on initial mount: the second fire reads lastRequestedStateRef
    // already updated to requestedState.)
    if (previousRequestedState === requestedState) return;

    const anim = animRef.current;
    const targetState = requestedState;

    // Already heading there in an active morph — don't restart.
    if (anim?.morphActive && anim.morphTarget === targetState) return;

    // Classify captured frame from its actual rendered shape, not from
    // a phantom `currentlyIn`. This is the key fix: on the FIRST click
    // (animRef null), cur tells us if we're at listening/idle (inward,
    // not frozen), thinking (inward, frozen), or talking (outward).
    // morphFrom is set to 'talking' for talking-like frames so the
    // reverse branch in computeMorphFrame fires; 'idle' otherwise so
    // the forward branch fires (when target is talking) or simple-lerp
    // fires (when target is also non-talking). Specific non-talking
    // label doesn't matter — only the talking/non-talking distinction.
    const isTalkingLike =
      cur.inwardRatio === 0 ||
      anim?.morphFrom === 'talking' ||
      anim?.morphTarget === 'talking';
    const morphFromForBranching: RadialState = isTalkingLike ? 'talking' : 'idle';

    animRef.current = {
      morphActive: true,
      morphStart: cur,
      morphFrom: morphFromForBranching,
      morphTarget: targetState,
      morphT: 0,
      morphDuration: pickDuration(morphFromForBranching, targetState, p),
      intendedFinalState: targetState,
      currentlyIn: previousRequestedState,
      minPinnedFor: anim?.minPinnedFor ?? 0,
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
      // Compress the damp into the first 30% of Phase A so bars reach
      // uniform thinking-shape (single fixed min height) quickly. The
      // remaining 70% is pure translation with bars frozen at min —
      // matches user spec: "transformation to thinking in real time
      // while it's moving" + "they have to adjust all to one fixed
      // height". If damp ran the full Phase A, bars retained
      // listening's wave variation throughout the translation, which
      // is what the user saw and reported.
      const dampEnd = 0.3;
      const tDamp = Math.min(1, tA / dampEnd);
      const damping = tA < dampEnd;
      return {
        ...start,
        anchor: lerp(start.anchor, anchorTarget, tA),
        inwardRatio: 1,
        // Engage freezeAtMin once the damp portion is done — bars then
        // hold at exact min length for the rest of Phase A.
        freezeAtMin: !damping,
        // During damp: lerp min from start to thinking-pin. After damp:
        // pinned at thinking-pin.
        minBarLength: damping ? lerp(start.minBarLength, morphPinLength, tDamp) : morphPinLength,
        sensitivity: damping ? lerp(start.sensitivity, 0, tDamp) : 0,
        ambientWave: tDamp < 0.95 ? start.ambientWave : false,
        waveAmplitude: damping ? lerp(start.waveAmplitude, 0, tDamp) : 0,
        waveEnvelope: damping ? lerp(start.waveEnvelope, 0, tDamp) : 0,
        envelopeAmplitude: damping ? lerp(start.envelopeAmplitude, 0, tDamp) : 0,
        envelopeSensitivity: damping ? lerp(start.envelopeSensitivity, 0, tDamp) : 0,
        // Smoothing taper linearly to 0 over the damp window so the
        // audio path converges value to 0 by the end of the damp.
        smoothing: damping ? lerp(start.smoothing, 0, tDamp) : 0,
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
      // Same shape as forward Phase A: damp compressed to first 30%,
      // then bars hold at uniform min length for the rest of reverse
      // Phase A (which is purely the reactive fade-out before the
      // inverse flip; anchor stays pinned at talkingAnchor here).
      const dampEnd = 0.3;
      const tDamp = Math.min(1, tA / dampEnd);
      const damping = tA < dampEnd;
      return {
        ...start,
        anchor: talkingAnchor,
        inwardRatio: 0,
        freezeAtMin: !damping,
        minBarLength: damping ? lerp(start.minBarLength, morphPinLength, tDamp) : morphPinLength,
        sensitivity: damping ? lerp(start.sensitivity, 0, tDamp) : 0,
        ambientWave: tDamp < 0.95 ? start.ambientWave : false,
        waveAmplitude: damping ? lerp(start.waveAmplitude, 0, tDamp) : 0,
        waveEnvelope: damping ? lerp(start.waveEnvelope, 0, tDamp) : 0,
        envelopeAmplitude: damping ? lerp(start.envelopeAmplitude, 0, tDamp) : 0,
        maxBarLength: lerp(start.maxBarLength, target.maxBarLength, t),
        smoothing: damping ? lerp(start.smoothing, 0, tDamp) : 0,
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
