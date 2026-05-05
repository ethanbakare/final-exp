/**
 * Linked-profile animator hook — JS owns all motion for the Kyoto-
 * style blob (GentleOrbThicken). idle / listening / thinking-rest /
 * talking-rest share `profile.base`; thinking and talking each have
 * their own peak overrides. State changes glide smoothly with no
 * shader-side snap because only the JS-computed target moves.
 *
 * See REALTIME_STATES_PLAN.md (v2.4 + patches) for the full spec.
 */
import { useEffect, useRef, useState } from 'react';

export interface BaseSettings {
  scale: number;
  thinRadius: number;
  thickenSpeed: number;
  waveIntensity: number;
  waveCount: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
  bgColor: string;
}

export interface PeakOverrides {
  scale?: number;
  thickRadius?: number;
  /** For thinking: pulse cycle rate (thin↔thick period).
   *  For talking: morph rate (entering talking). */
  thickenSpeed?: number;
  /** Per-state override for the *entry* tau (current → target).
   *  Only honored for the thinking peak today. Decouples how fast
   *  the orb enters thinking from how fast the pulse cycles —
   *  drop it low to make listening→thinking nearly instant
   *  without speeding up the pulse itself. */
  entrySpeed?: number;
  /** Per-state override for the *exit* tau used when transitioning
   *  AWAY from this state back toward base. Currently only honored
   *  for the talking peak — lets talking morph back to idle on its
   *  own clock without changing base.thickenSpeed (which would also
   *  affect idle/listening). */
  settleSpeed?: number;
  waveIntensity?: number;
  waveCount?: number;
  breathAmp?: number;
  idleAmp?: number;
  color1?: string;
  color2?: string;
  color3?: string;
}

export interface LinkedProfile {
  base: BaseSettings;
  thinking: PeakOverrides;
  talking: PeakOverrides;
}

export type LinkedState = 'idle' | 'listening' | 'thinking' | 'talking';

export interface RenderValues {
  scale: number;
  thickRadius: number;
  thickenSpeed: number; // bookkeeping only — not passed to shader
  waveIntensity: number;
  waveCount: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
}

const TALKING_GEOMETRY = 1.0;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpHex(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bv = Math.round(lerp(ab, bb, t));
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(bv)}`;
}

export function pickPeak(scope: PeakOverrides, base: BaseSettings): RenderValues {
  return {
    scale: scope.scale ?? base.scale,
    thickRadius: scope.thickRadius ?? base.thinRadius,
    thickenSpeed: scope.thickenSpeed ?? base.thickenSpeed,
    waveIntensity: scope.waveIntensity ?? base.waveIntensity,
    waveCount: scope.waveCount ?? base.waveCount ?? 8,
    breathAmp: scope.breathAmp ?? base.breathAmp,
    idleAmp: scope.idleAmp ?? base.idleAmp,
    color1: scope.color1 ?? base.color1,
    color2: scope.color2 ?? base.color2,
    color3: scope.color3 ?? base.color3,
  };
}

export function baseRender(base: BaseSettings): RenderValues {
  return {
    scale: base.scale,
    thickRadius: base.thinRadius,
    thickenSpeed: base.thickenSpeed,
    waveIntensity: base.waveIntensity,
    waveCount: base.waveCount ?? 8,
    breathAmp: base.breathAmp,
    idleAmp: base.idleAmp,
    color1: base.color1,
    color2: base.color2,
    color3: base.color3,
  };
}

export function lerpRender(a: RenderValues, b: RenderValues, t: number): RenderValues {
  return {
    scale: lerp(a.scale, b.scale, t),
    thickRadius: lerp(a.thickRadius, b.thickRadius, t),
    thickenSpeed: lerp(a.thickenSpeed, b.thickenSpeed, t),
    waveIntensity: lerp(a.waveIntensity, b.waveIntensity, t),
    waveCount: lerp(a.waveCount, b.waveCount, t),
    breathAmp: lerp(a.breathAmp, b.breathAmp, t),
    idleAmp: lerp(a.idleAmp, b.idleAmp, t),
    color1: lerpHex(a.color1, b.color1, t),
    color2: lerpHex(a.color2, b.color2, t),
    color3: lerpHex(a.color3, b.color3, t),
  };
}

/**
 * Drives a `current` RenderValues toward the active state's target,
 * updating once per animation frame. Caller passes `current` to the
 * GentleOrbThicken shader; the shader's internal animator stays out
 * of the way (caller should pin `goal=1` and `thickenSpeed=0.05`).
 */
export function useLinkedProfileAnimator(
  profile: LinkedProfile | null,
  state: LinkedState,
  paused = false,
): RenderValues | null {
  const [render, setRender] = useState<RenderValues | null>(() =>
    profile ? baseRender(profile.base) : null,
  );

  const profileRef = useRef(profile);
  const stateRef = useRef(state);
  const renderRef = useRef(render);
  const pausedRef = useRef(paused);
  const pulseRef = useRef({ phase: 0, dir: 1 });
  const lastTsRef = useRef(performance.now());

  profileRef.current = profile;
  stateRef.current = state;
  renderRef.current = render;
  pausedRef.current = paused;

  // Seed render once a profile is available.
  useEffect(() => {
    if (profile && !render) setRender(baseRender(profile.base));
  }, [profile, render]);

  // Reset pulse when leaving thinking so re-entering is clean.
  useEffect(() => {
    if (state !== 'thinking') {
      pulseRef.current = { phase: 0, dir: 1 };
    }
  }, [state]);

  // Talking-specific exit-tau handling. When state transitions away
  // from talking, capture talking.settleSpeed (with base.thickenSpeed
  // as fallback) into activeTauOverrideRef. The animator reads this
  // ref each frame and prefers it over target.thickenSpeed. On any
  // other state change the override is cleared so idle / listening /
  // thinking transitions resume using their own target speeds.
  const previousStateRef = useRef<LinkedState>(state);
  const activeTauOverrideRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = previousStateRef.current;
    if (prev === 'talking' && state !== 'talking') {
      const p = profileRef.current;
      activeTauOverrideRef.current =
        p?.talking.settleSpeed ?? p?.base.thickenSpeed ?? null;
    } else {
      activeTauOverrideRef.current = null;
    }
    previousStateRef.current = state;
  }, [state]);

  useEffect(() => {
    let raf = 0;
    const animate = (ts: number) => {
      const dt = Math.min((ts - lastTsRef.current) / 1000, 1 / 30);
      lastTsRef.current = ts;
      const p = profileRef.current;
      const s = stateRef.current;
      const cur = renderRef.current;
      if (!p || !cur) {
        raf = requestAnimationFrame(animate);
        return;
      }

      const baseR = baseRender(p.base);
      const thinkingR = pickPeak(p.thinking, p.base);
      const talkingR = {
        ...pickPeak(p.talking, p.base),
        thickRadius: TALKING_GEOMETRY,
      };

      let target: RenderValues;
      let stateTauSpeed: number;
      if (s === 'idle' || s === 'listening') {
        target = baseR;
        stateTauSpeed = baseR.thickenSpeed;
      } else if (s === 'talking') {
        target = talkingR;
        // Morph Speed = talking.thickenSpeed; pickPeak fell back to
        // base if the user hasn't overridden talking.thickenSpeed,
        // so talkingR.thickenSpeed is always defined.
        stateTauSpeed = talkingR.thickenSpeed;
      } else {
        if (!pausedRef.current) {
          // Pulse cycle rate uses thinkingR.thickenSpeed (Pulse Speed).
          const pulseSpeed = 1 / Math.max(0.05, thinkingR.thickenSpeed);
          pulseRef.current.phase += dt * pulseSpeed * pulseRef.current.dir;
          if (pulseRef.current.phase >= 1) {
            pulseRef.current.phase = 1;
            pulseRef.current.dir = -1;
          } else if (pulseRef.current.phase <= 0) {
            pulseRef.current.phase = 0;
            pulseRef.current.dir = 1;
          }
        }
        const t = pulseRef.current.phase;
        const eased = t * t * (3 - 2 * t);
        target = lerpRender(baseR, thinkingR, eased);
        // Entry tau (current → target smoothing) uses thinking.entrySpeed
        // when set, falling back to base.thickenSpeed. Decoupled from
        // the pulse cycle rate so the user can dial entry near zero
        // for fast responses without changing pulse rhythm.
        stateTauSpeed = p.thinking.entrySpeed ?? p.base.thickenSpeed;
      }

      // Talking's exit override wins when present (set on
      // transitions AWAY from talking). Otherwise use the active
      // state's tau speed computed above. A tiny floor (0.001)
      // keeps the math safe when the user dials a slider all the
      // way to 0 — alpha collapses to 1 and current snaps to
      // target instantly, which is what "instant transition" means.
      const tauSpeed = activeTauOverrideRef.current ?? stateTauSpeed;
      const tau = Math.max(0.001, tauSpeed) * 0.5;
      const alpha = 1 - Math.exp(-dt / tau);
      const next = lerpRender(cur, target, alpha);
      setRender(next);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return render;
}
