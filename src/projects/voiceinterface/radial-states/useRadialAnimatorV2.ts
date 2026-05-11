/**
 * useRadialAnimatorV2 — per-property eased animator for radial state morphs.
 *
 * Structural model (see tasks/radial-animator-rewrite.md):
 *  - Each lerpable property (anchor, minBarLength, ...) is an independent
 *    EasedNum {current, fromValue, target, startMs, duration}. Re-targeting
 *    mid-animation snaps fromValue to current — no leg-boundary snap.
 *  - Discrete properties (inwardRatio, freezeAtMin, ambientWave, ...) are
 *    latched on the animator and flipped at phase boundaries or by derived
 *    rules.
 *  - Phase scheduler: 'rest' | 'forwardA' | 'forwardB' | 'reverseA' |
 *    'reverseB' | 'simple'. Each phase entry sets per-property targets and
 *    durations. RAF advances all eased values and transitions phases when
 *    the phase clock elapses.
 *
 * Forward (idle/listening → talking) Phase A: damp + translate run in
 * parallel, with damp on A*0.5 and translation on full A. By tA = 0.5
 * the reactive amplitudes are at 0 and bars look thinking-shaped; by
 * tA = 1.0 the anchor is at talkingAnchor + morphPin, ready to flip
 * invisibly into Phase B.
 *
 * Output type and call signature match V1 (`useLinkedRadialAnimator`)
 * so consumers can swap with a one-line import change.
 */
import { useEffect, useRef, useState } from 'react';
import type { RadialLinkedProfile } from './api';
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

interface EasedNum {
  current: number;
  fromValue: number;
  target: number;
  startMs: number;
  duration: number; // seconds
}

function makeEased(v: number): EasedNum {
  return { current: v, fromValue: v, target: v, startMs: 0, duration: 0 };
}

function retarget(e: EasedNum, target: number, duration: number, nowMs: number) {
  e.fromValue = e.current;
  e.target = target;
  e.startMs = nowMs;
  e.duration = Math.max(0.001, duration);
}

function snap(e: EasedNum, value: number, nowMs: number) {
  e.current = value;
  e.fromValue = value;
  e.target = value;
  e.startMs = nowMs;
  e.duration = 0;
}

function step(e: EasedNum, nowMs: number): number {
  if (e.duration <= 0) {
    e.current = e.target;
    return e.current;
  }
  const t = Math.min(1, (nowMs - e.startMs) / 1000 / e.duration);
  e.current = e.fromValue + (e.target - e.fromValue) * t;
  return e.current;
}

type Phase = 'rest' | 'forwardA' | 'forwardB' | 'reverseA' | 'reverseB' | 'simple';

interface Props {
  anchor: EasedNum;
  minBarLength: EasedNum;
  maxBarLength: EasedNum;
  sensitivity: EasedNum;
  waveAmplitude: EasedNum;
  waveEnvelope: EasedNum;
  envelopeAmplitude: EasedNum;
  smoothing: EasedNum;
}

interface Anim {
  phase: Phase;
  phaseStartMs: number;
  phaseDuration: number; // seconds (longest prop in the phase)
  finalTarget: RadialState;
  inwardRatio: 0 | 1;
  freezeAtMin: boolean;
  ambientWave: boolean;
  waveMode: 'additive' | 'reactive';
  waveShape: 'sine' | 'triangle' | 'square' | 'segments';
  waveLobes: number;
  waveHeight: number;
  waveSpeed: number;
  envelopeSensitivity: number;
  intensityOpacity: boolean;
}

function restingValues(profile: RadialLinkedProfile, state: RadialState): RadialRenderValues {
  const s = profile[state];
  const isTalking = state === 'talking';
  const isThinking = state === 'thinking';
  return {
    anchor: isTalking ? deriveTalkingAnchor(profile) : profile.geometry.idleRadius,
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

function adoptDiscrete(anim: Anim, r: RadialRenderValues) {
  anim.ambientWave = r.ambientWave;
  anim.waveMode = r.waveMode;
  anim.waveShape = r.waveShape;
  anim.waveLobes = r.waveLobes;
  anim.waveHeight = r.waveHeight;
  anim.waveSpeed = r.waveSpeed;
  anim.envelopeSensitivity = r.envelopeSensitivity;
  anim.intensityOpacity = r.intensityOpacity;
}

export function useRadialAnimatorV2(
  profile: RadialLinkedProfile | null,
  requestedState: RadialState,
): RadialRenderValues | null {
  const [render, setRender] = useState<RadialRenderValues | null>(() =>
    profile ? restingValues(profile, requestedState) : null,
  );

  const profileRef = useRef(profile);
  const requestedRef = useRef(requestedState);
  const propsRef = useRef<Props | null>(null);
  const animRef = useRef<Anim | null>(null);

  profileRef.current = profile;
  requestedRef.current = requestedState;

  // Initialize once profile is available.
  useEffect(() => {
    if (!profile) return;
    if (propsRef.current) return;
    const rest = restingValues(profile, requestedState);
    propsRef.current = {
      anchor: makeEased(rest.anchor),
      minBarLength: makeEased(rest.minBarLength),
      maxBarLength: makeEased(rest.maxBarLength),
      sensitivity: makeEased(rest.sensitivity),
      waveAmplitude: makeEased(rest.waveAmplitude),
      waveEnvelope: makeEased(rest.waveEnvelope),
      envelopeAmplitude: makeEased(rest.envelopeAmplitude),
      smoothing: makeEased(rest.smoothing),
    };
    animRef.current = {
      phase: 'rest',
      phaseStartMs: performance.now(),
      phaseDuration: 0,
      finalTarget: requestedState,
      inwardRatio: rest.inwardRatio,
      freezeAtMin: rest.freezeAtMin,
      ambientWave: rest.ambientWave,
      waveMode: rest.waveMode,
      waveShape: rest.waveShape,
      waveLobes: rest.waveLobes,
      waveHeight: rest.waveHeight,
      waveSpeed: rest.waveSpeed,
      envelopeSensitivity: rest.envelopeSensitivity,
      intensityOpacity: rest.intensityOpacity,
    };
    setRender(rest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // On state change, start a transition.
  useEffect(() => {
    const p = profileRef.current;
    const props = propsRef.current;
    const anim = animRef.current;
    if (!p || !props || !anim) return;
    if (anim.finalTarget === requestedState && anim.phase === 'rest') return;
    startTransition(p, props, anim, requestedState, performance.now());
  }, [requestedState]);

  // RAF loop.
  useEffect(() => {
    let raf = 0;
    const tick = (ts: number) => {
      const p = profileRef.current;
      const props = propsRef.current;
      const anim = animRef.current;
      if (p && props && anim) {
        updateFrame(p, props, anim, ts);
        setRender(buildRender(props, anim));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return render;
}

function startTransition(
  p: RadialLinkedProfile,
  props: Props,
  anim: Anim,
  targetState: RadialState,
  nowMs: number,
) {
  anim.finalTarget = targetState;

  // Decide phase by current geometry: outward-talking-like vs inward-resting-like.
  const isInward = anim.inwardRatio === 1;

  if (targetState === 'talking') {
    if (isInward) {
      // From any outer-ring state into talking. Forward Phase A.
      enterForwardA(p, props, anim, nowMs);
    } else {
      // Already in talking-like geometry (mid-reverse or already there). Simple retarget.
      enterSimple(p, props, anim, 'talking', nowMs);
    }
  } else if (targetState === 'idle' || targetState === 'listening') {
    if (!isInward) {
      // From talking-like. Reverse path.
      enterReverseA(p, props, anim, nowMs);
    } else {
      enterSimple(p, props, anim, targetState, nowMs);
    }
  } else {
    // thinking
    if (!isInward) {
      // From talking-like. Reverse path; final target carried as thinking.
      enterReverseA(p, props, anim, nowMs);
    } else {
      enterSimple(p, props, anim, 'thinking', nowMs);
    }
  }
}

/** Forward Phase A — damp + translate in parallel, damp finishes first. */
function enterForwardA(p: RadialLinkedProfile, props: Props, anim: Anim, nowMs: number) {
  const talkingAnchor = deriveTalkingAnchor(p);
  const morphPin = p.thinking.minBarLength;
  const A = p.morph.thinkingToTalking;
  const dampDur = A * 0.5;

  retarget(props.anchor, talkingAnchor + morphPin, A, nowMs);
  retarget(props.minBarLength, morphPin, dampDur, nowMs);
  retarget(props.maxBarLength, p.talking.maxBarLength, A, nowMs);
  retarget(props.sensitivity, 0, dampDur, nowMs);
  retarget(props.waveAmplitude, 0, dampDur, nowMs);
  retarget(props.waveEnvelope, 0, dampDur, nowMs);
  retarget(props.envelopeAmplitude, 0, dampDur, nowMs);
  retarget(props.smoothing, 0, dampDur, nowMs);

  anim.phase = 'forwardA';
  anim.phaseStartMs = nowMs;
  anim.phaseDuration = A;
  anim.inwardRatio = 1;
  anim.freezeAtMin = false; // flips true mid-phase when damp completes
  anim.ambientWave = false;
}

/** Forward Phase B — flip (invisible) + reactive ramp into talking. */
function enterForwardB(p: RadialLinkedProfile, props: Props, anim: Anim, nowMs: number) {
  const talkingAnchor = deriveTalkingAnchor(p);
  const A = p.morph.thinkingToTalking;
  const Bdur = A * (1 - p.morph.reactiveStartAt);
  const talkingRest = restingValues(p, 'talking');

  // Flip: snap anchor to talkingAnchor (was at talkingAnchor + morphPin),
  // inwardRatio flips 1→0. Same pixel position, invisible.
  snap(props.anchor, talkingAnchor, nowMs);

  retarget(props.minBarLength, talkingRest.minBarLength, Bdur, nowMs);
  retarget(props.maxBarLength, talkingRest.maxBarLength, Bdur, nowMs);
  retarget(props.sensitivity, talkingRest.sensitivity, Bdur, nowMs);
  retarget(props.waveAmplitude, talkingRest.waveAmplitude, Bdur, nowMs);
  retarget(props.waveEnvelope, talkingRest.waveEnvelope, Bdur, nowMs);
  retarget(props.envelopeAmplitude, talkingRest.envelopeAmplitude, Bdur, nowMs);
  retarget(props.smoothing, talkingRest.smoothing, Bdur, nowMs);

  anim.phase = 'forwardB';
  anim.phaseStartMs = nowMs;
  anim.phaseDuration = Bdur;
  anim.inwardRatio = 0;
  anim.freezeAtMin = false;
  adoptDiscrete(anim, talkingRest);
}

/** Reverse Phase A — symmetric mirror of forward Phase A.
 *  Damp + translate-outward in parallel, damp finishes first.
 *  Anchor travels talkingAnchor → idleRadius - morphPin over full A
 *  (while inwardRatio=0, so the outer tip of the bar reaches idleRadius
 *  at phase end). Damp props decay over A * 0.5. */
function enterReverseA(p: RadialLinkedProfile, props: Props, anim: Anim, nowMs: number) {
  const target = anim.finalTarget;
  const targetRest = restingValues(p, target);
  const morphPin = p.thinking.minBarLength;
  const idleRadius = p.geometry.idleRadius;
  const A = p.morph.thinkingToTalking;
  const dampDur = A * 0.5;

  retarget(props.anchor, idleRadius - morphPin, A, nowMs);
  retarget(props.minBarLength, morphPin, dampDur, nowMs);
  retarget(props.maxBarLength, targetRest.maxBarLength, A, nowMs);
  retarget(props.sensitivity, 0, dampDur, nowMs);
  retarget(props.waveAmplitude, 0, dampDur, nowMs);
  retarget(props.waveEnvelope, 0, dampDur, nowMs);
  retarget(props.envelopeAmplitude, 0, dampDur, nowMs);
  retarget(props.smoothing, 0, dampDur, nowMs);

  anim.phase = 'reverseA';
  anim.phaseStartMs = nowMs;
  anim.phaseDuration = A;
  anim.inwardRatio = 0;
  anim.freezeAtMin = false; // flips true mid-phase when damp completes
  anim.ambientWave = false;
}

/** Reverse Phase B — invisible flip + reactive ramp to target.
 *  Anchor snaps idleRadius - morphPin → idleRadius (with inwardRatio
 *  flipping 0→1, same pixels). Reactive ramps up. No translation. */
function enterReverseB(p: RadialLinkedProfile, props: Props, anim: Anim, nowMs: number) {
  const target = anim.finalTarget;
  const targetRest = restingValues(p, target);
  const idleRadius = p.geometry.idleRadius;
  const A = p.morph.thinkingToTalking;
  const Bdur = A * (1 - p.morph.reactiveStartAt);

  // Flip: anchor jumps (idleRadius - morphPin) → idleRadius with
  // inwardRatio flipping 0→1. Same pixel position, invisible.
  snap(props.anchor, idleRadius, nowMs);

  retarget(props.minBarLength, targetRest.minBarLength, Bdur, nowMs);
  retarget(props.maxBarLength, targetRest.maxBarLength, Bdur, nowMs);
  retarget(props.sensitivity, targetRest.sensitivity, Bdur, nowMs);
  retarget(props.waveAmplitude, targetRest.waveAmplitude, Bdur, nowMs);
  retarget(props.waveEnvelope, targetRest.waveEnvelope, Bdur, nowMs);
  retarget(props.envelopeAmplitude, targetRest.envelopeAmplitude, Bdur, nowMs);
  retarget(props.smoothing, targetRest.smoothing, Bdur, nowMs);

  anim.phase = 'reverseB';
  anim.phaseStartMs = nowMs;
  anim.phaseDuration = Bdur;
  anim.inwardRatio = 1;
  anim.freezeAtMin = false;
  adoptDiscrete(anim, targetRest);
}

/** Simple — direct lerp to target rest. */
function enterSimple(
  p: RadialLinkedProfile,
  props: Props,
  anim: Anim,
  targetState: RadialState,
  nowMs: number,
) {
  const targetRest = restingValues(p, targetState);
  const dur = p.morph.idleToThinking;

  retarget(props.anchor, targetRest.anchor, dur, nowMs);
  retarget(props.minBarLength, targetRest.minBarLength, dur, nowMs);
  retarget(props.maxBarLength, targetRest.maxBarLength, dur, nowMs);
  retarget(props.sensitivity, targetRest.sensitivity, dur, nowMs);
  retarget(props.waveAmplitude, targetRest.waveAmplitude, dur, nowMs);
  retarget(props.waveEnvelope, targetRest.waveEnvelope, dur, nowMs);
  retarget(props.envelopeAmplitude, targetRest.envelopeAmplitude, dur, nowMs);
  // When landing in thinking, decay smoothing → 0 so the renderer's
  // prevValuesRef catches up to the (near-zero) input. Otherwise
  // smoothing lag holds `value` elevated for bars in the middle of
  // wave peaks; when freezeAtMin engages at phase end, those bars
  // snap down by 1-2px while the bell-curve extremes don't.
  // At phase-end the resting snap restores thinking's profile smoothing.
  const smoothingTarget = targetState === 'thinking' ? 0 : targetRest.smoothing;
  retarget(props.smoothing, smoothingTarget, dur, nowMs);

  anim.phase = 'simple';
  anim.phaseStartMs = nowMs;
  anim.phaseDuration = dur;
  anim.finalTarget = targetState;
  anim.inwardRatio = targetRest.inwardRatio;
  anim.freezeAtMin = false; // flips true at end if target is thinking
  adoptDiscrete(anim, targetRest);
}

function updateFrame(p: RadialLinkedProfile, props: Props, anim: Anim, nowMs: number) {
  step(props.anchor, nowMs);
  step(props.minBarLength, nowMs);
  step(props.maxBarLength, nowMs);
  step(props.sensitivity, nowMs);
  step(props.waveAmplitude, nowMs);
  step(props.waveEnvelope, nowMs);
  step(props.envelopeAmplitude, nowMs);
  step(props.smoothing, nowMs);

  const elapsed = (nowMs - anim.phaseStartMs) / 1000;

  // freezeAtMin: latch true once the damp portion completes (in phases
  // where reactive should reach 0). This lets the renderer clamp bars
  // to exact min length while anchor continues translating.
  if (anim.phase === 'forwardA') {
    const dampDur = anim.phaseDuration * 0.5;
    if (elapsed >= dampDur * 0.98) anim.freezeAtMin = true;
  } else if (anim.phase === 'reverseA') {
    const dampDur = anim.phaseDuration * 0.5;
    if (elapsed >= dampDur * 0.98) anim.freezeAtMin = true;
  }
  // simple → thinking: don't engage freezeAtMin early. The smoothing
  // decay in enterSimple brings prevValue to ~0 by phase end, and the
  // resting snap at t = 1.0 latches freezeAtMin = true without a snap
  // (min == max == 12 at that point, so length is already exactly 12).

  // Phase advance when this phase's clock is done.
  if (elapsed >= anim.phaseDuration) {
    if (anim.phase === 'forwardA') {
      enterForwardB(p, props, anim, nowMs);
    } else if (anim.phase === 'reverseA') {
      enterReverseB(p, props, anim, nowMs);
    } else if (
      anim.phase === 'forwardB' ||
      anim.phase === 'reverseB' ||
      anim.phase === 'simple'
    ) {
      anim.phase = 'rest';
      anim.phaseDuration = 0;
      // Snap to exact resting at landing to avoid sub-pixel drift.
      const rest = restingValues(p, anim.finalTarget);
      snap(props.anchor, rest.anchor, nowMs);
      snap(props.minBarLength, rest.minBarLength, nowMs);
      snap(props.maxBarLength, rest.maxBarLength, nowMs);
      snap(props.sensitivity, rest.sensitivity, nowMs);
      snap(props.waveAmplitude, rest.waveAmplitude, nowMs);
      snap(props.waveEnvelope, rest.waveEnvelope, nowMs);
      snap(props.envelopeAmplitude, rest.envelopeAmplitude, nowMs);
      snap(props.smoothing, rest.smoothing, nowMs);
      anim.inwardRatio = rest.inwardRatio;
      anim.freezeAtMin = rest.freezeAtMin;
      adoptDiscrete(anim, rest);
    }
  }

  // Live sync at rest. Without this, slider edits to geometry /
  // bars / display fields update the profile object but the animator
  // keeps emitting its cached eased values (anchor, minBarLength,
  // etc.) — so the donut and bar count react instantly while the
  // bars themselves stay frozen until the user state-pill-switches
  // and the next transition re-snaps to restingValues(profile, ...).
  //
  // This branch runs only when phase === 'rest' so it never disturbs
  // an in-flight morph (phase-end resets phase to 'rest' below,
  // but by then this frame has already processed). Cheap — one
  // pure restingValues() call + a handful of assignments.
  if (anim.phase === 'rest') {
    const rest = restingValues(p, anim.finalTarget);
    snap(props.anchor, rest.anchor, nowMs);
    snap(props.minBarLength, rest.minBarLength, nowMs);
    snap(props.maxBarLength, rest.maxBarLength, nowMs);
    snap(props.sensitivity, rest.sensitivity, nowMs);
    snap(props.waveAmplitude, rest.waveAmplitude, nowMs);
    snap(props.waveEnvelope, rest.waveEnvelope, nowMs);
    snap(props.envelopeAmplitude, rest.envelopeAmplitude, nowMs);
    snap(props.smoothing, rest.smoothing, nowMs);
    anim.inwardRatio = rest.inwardRatio;
    anim.freezeAtMin = rest.freezeAtMin;
    adoptDiscrete(anim, rest);
  }
}

function buildRender(props: Props, anim: Anim): RadialRenderValues {
  return {
    anchor: props.anchor.current,
    inwardRatio: anim.inwardRatio,
    minBarLength: props.minBarLength.current,
    maxBarLength: props.maxBarLength.current,
    sensitivity: props.sensitivity.current,
    freezeAtMin: anim.freezeAtMin,
    ambientWave: anim.ambientWave,
    waveSpeed: anim.waveSpeed,
    waveAmplitude: props.waveAmplitude.current,
    waveHeight: anim.waveHeight,
    waveMode: anim.waveMode,
    waveShape: anim.waveShape,
    waveLobes: anim.waveLobes,
    smoothing: props.smoothing.current,
    waveEnvelope: props.waveEnvelope.current,
    envelopeAmplitude: props.envelopeAmplitude.current,
    envelopeSensitivity: anim.envelopeSensitivity,
    intensityOpacity: anim.intensityOpacity,
  };
}
