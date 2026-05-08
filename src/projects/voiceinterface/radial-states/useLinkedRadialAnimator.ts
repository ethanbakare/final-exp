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
    minBarLength: profile.bars.minBarLength,
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

/** Pick the next leg's `from` for a composed transition, or null if
 *  direct. idle/listening → talking goes via thinking. talking → thinking
 *  goes via idle. */
function nextLegFrom(start: RadialState, finalTarget: RadialState): RadialState | null {
  if (start === finalTarget) return null;
  // idle/listening ↔ thinking ↔ talking — at most one intermediate.
  if ((start === 'idle' || start === 'listening') && finalTarget === 'talking') return 'thinking';
  if (start === 'talking' && finalTarget === 'thinking') return 'idle';
  if (start === 'talking' && (finalTarget === 'idle' || finalTarget === 'listening')) return null;
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
        }),
        currentlyIn: targetState,
      };
      return;
    }

    // Determine first leg. For composed transitions (idle→talking), set
    // intendedFinalState and start leg 1 toward the intermediate state.
    const fromState = anim?.currentlyIn ?? targetState;
    const intermediate = nextLegFrom(fromState, targetState);
    const legTarget = intermediate ?? targetState;
    const legFrom = fromState;

    animRef.current = {
      morphActive: true,
      morphStart: cur,
      morphFrom: legFrom,
      morphTarget: legTarget,
      morphT: 0,
      morphDuration: pickDuration(legFrom, legTarget, p),
      intendedFinalState: targetState,
      currentlyIn: legFrom,
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

  // --- thinking → talking (forward Phase A + B) ---
  if (anim.morphFrom === 'thinking' && anim.morphTarget === 'talking') {
    const talkingAnchor = deriveTalkingAnchor(profile);
    const phaseAEnd = reactiveStartAt;
    if (t < phaseAEnd) {
      // Phase A: translate, freezeAtMin, anchor → talkingAnchor + min
      const tA = phaseAEnd > 0 ? t / phaseAEnd : 1;
      const anchorTarget = talkingAnchor + profile.bars.minBarLength;
      return {
        ...start,
        anchor: lerp(start.anchor, anchorTarget, tA),
        inwardRatio: 1,
        freezeAtMin: true,
        sensitivity: 0,
        ambientWave: false,
        waveAmplitude: 0,
        waveEnvelope: 0,
        envelopeAmplitude: 0,
        // Full-morph maxBarLength lerp (not phase-scoped) — never zero
        maxBarLength: lerp(start.maxBarLength, target.maxBarLength, t),
      };
    } else {
      // Phase B: anchor pinned at talkingAnchor (post-flip), inwardRatio 0,
      // freezeAtMin off, reactive params ramp from 0 → talking values.
      const tB = (1 - phaseAEnd) > 0 ? (t - phaseAEnd) / (1 - phaseAEnd) : 1;
      return {
        ...target,
        anchor: talkingAnchor,
        inwardRatio: 0,
        freezeAtMin: false,
        sensitivity: lerp(0, target.sensitivity, tB),
        ambientWave: target.ambientWave,
        waveAmplitude: lerp(0, target.waveAmplitude, tB),
        waveEnvelope: lerp(0, target.waveEnvelope, tB),
        envelopeAmplitude: lerp(0, target.envelopeAmplitude, tB),
        maxBarLength: lerp(start.maxBarLength, target.maxBarLength, t),
      };
    }
  }

  // --- talking → idle/listening (reverse) ---
  if (anim.morphFrom === 'talking' && (anim.morphTarget === 'idle' || anim.morphTarget === 'listening')) {
    const talkingAnchor = deriveTalkingAnchor(profile);
    const reverseAEnd = 1 - reactiveStartAt;
    if (t < reverseAEnd) {
      // Reverse Phase A: anchor pinned at talkingAnchor, reactive fade
      const tA = reverseAEnd > 0 ? t / reverseAEnd : 1;
      const tailClamp = tA >= 0.9; // last 10% of Phase A
      return {
        ...start,
        anchor: talkingAnchor,
        inwardRatio: 0,
        freezeAtMin: tailClamp,
        sensitivity: lerp(start.sensitivity, 0, tA),
        ambientWave: tA < 0.5 ? start.ambientWave : false,
        waveAmplitude: lerp(start.waveAmplitude, 0, tA),
        waveEnvelope: lerp(start.waveEnvelope, 0, tA),
        envelopeAmplitude: lerp(start.envelopeAmplitude, 0, tA),
        maxBarLength: lerp(start.maxBarLength, target.maxBarLength, t),
      };
    } else {
      // Reverse Phase B: translation, parallel idle-params lerp.
      const tB = reactiveStartAt > 0 ? (t - reverseAEnd) / reactiveStartAt : 1;
      const startAnchor = talkingAnchor + profile.bars.minBarLength;
      return {
        ...target,
        anchor: lerp(startAnchor, target.anchor, tB),
        inwardRatio: 1,
        freezeAtMin: tB < 1, // freeze through translation; release at completion
        sensitivity: lerp(0, target.sensitivity, tB),
        ambientWave: tB > 0.5 ? target.ambientWave : false,
        waveAmplitude: lerp(0, target.waveAmplitude, tB),
        waveEnvelope: lerp(0, target.waveEnvelope, tB),
        envelopeAmplitude: lerp(0, target.envelopeAmplitude, tB),
        maxBarLength: lerp(start.maxBarLength, target.maxBarLength, t),
      };
    }
  }

  // --- everything else: simple lerp ---
  return {
    anchor: lerp(start.anchor, target.anchor, t),
    inwardRatio: t < 0.5 ? start.inwardRatio : target.inwardRatio,
    minBarLength: target.minBarLength,
    maxBarLength: lerp(start.maxBarLength, target.maxBarLength, t),
    sensitivity: lerp(start.sensitivity, target.sensitivity, t),
    freezeAtMin: t >= 0.9 && target.freezeAtMin ? true : start.freezeAtMin && target.freezeAtMin,
    ambientWave: t < 0.5 ? start.ambientWave : target.ambientWave,
    waveSpeed: lerp(start.waveSpeed, target.waveSpeed, t),
    waveAmplitude: lerp(start.waveAmplitude, target.waveAmplitude, t),
    waveHeight: lerp(start.waveHeight, target.waveHeight, t),
    waveMode: t < 0.5 ? start.waveMode : target.waveMode,
    waveShape: t < 0.5 ? start.waveShape : target.waveShape,
    waveLobes: lerp(start.waveLobes, target.waveLobes, t),
    smoothing: lerp(start.smoothing, target.smoothing, t),
    waveEnvelope: lerp(start.waveEnvelope, target.waveEnvelope, t),
    envelopeAmplitude: lerp(start.envelopeAmplitude, target.envelopeAmplitude, t),
    envelopeSensitivity: lerp(start.envelopeSensitivity, target.envelopeSensitivity, t),
    intensityOpacity: t < 0.5 ? start.intensityOpacity : target.intensityOpacity,
  };
}
