/**
 * NebularrBlob — Tube-style GentleOrbThicken orb for the realtime
 * page. Same audioData/voiceState surface as RealtimeBlob so it can
 * drop in alongside the Coral variant. Fetches its profile (Nebularr)
 * from the saved realtime-state-profiles.json via the studio-profiles
 * API, so tweaks made on /voiceinterface/realtime-states show up here
 * after a refresh.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import GentleOrbThicken from '@/projects/blob-orb/variants/GentleOrbThicken';
import type { AudioData } from '@/projects/voiceinterface/types';
import {
  baseRender,
  lerpRender,
  pickPeak,
  useLinkedProfileAnimator,
  type LinkedProfile,
  type LinkedState,
  type RenderValues,
} from './useLinkedProfileAnimator';

// Mirrors the constant inside useLinkedProfileAnimator. Talking shape =
// torus with thickRadius==1.0 (vertex shader collapses the hole, looks
// like a filled sphere).
const TALKING_GEOMETRY = 1.0;

type RealtimeVoiceState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';

interface NebularrBlobProps {
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  profile: LinkedProfile | null;
  width?: number;
  height?: number;
  /** When true, suppress the talking → idle intro crossfade on mount;
   *  display the animator output directly without lerping from the
   *  introTalking shape. */
  skipIntro?: boolean;
}

const STATE_MAP: Record<RealtimeVoiceState, LinkedState> = {
  idle: 'idle',
  listening: 'listening',
  ai_thinking: 'thinking',
  ai_speaking: 'talking',
};

export const NEBULARR_FALLBACK_PROFILE: LinkedProfile = {
  base: {
    scale: 1.0,
    thinRadius: 0.15,
    thickenSpeed: 1.2,
    waveIntensity: 0.3,
    waveCount: 4,
    breathAmp: 0.015,
    idleAmp: 0.04,
    color1: '#080602',
    color2: '#efff08',
    color3: '#4f5715',
    bgColor: '#fefffa',
  },
  thinking: { thickRadius: 0.35 },
  talking: {
    color3: '#949e05',
    scale: 0.75,
    waveCount: 9,
    waveIntensity: 0.4,
  },
};

export const NebularrBlob: React.FC<NebularrBlobProps> = ({
  audioData,
  voiceState,
  profile,
  width = 328,
  height = 328,
  skipIntro = false,
}) => {
  const linkedState = STATE_MAP[voiceState];
  const activeProfile = profile ?? NEBULARR_FALLBACK_PROFILE;
  const animatorRender = useLinkedProfileAnimator(activeProfile, linkedState);

  // Local intro overlay: on fresh mount the orb appears as the
  // talking shape (sphere) and crossfades into whatever the animator
  // is producing (typically idle on the live demo). Each Nebularr
  // thumbnail click is a fresh mount of this component, so the intro
  // re-plays. Crossfade rate uses talking.settleSpeed (with
  // base.thickenSpeed as fallback) to match the editor's replay.
  const [introT, setIntroT] = useState(0); // 0 = full intro, 1 = pure animator
  const introStartRef = useRef<number | null>(null);
  useEffect(() => {
    const tau =
      Math.max(
        0.001,
        activeProfile.talking.settleSpeed ?? activeProfile.base.thickenSpeed,
      ) * 0.5;
    let raf = 0;
    const tick = (ts: number) => {
      if (introStartRef.current === null) introStartRef.current = ts;
      const elapsed = (ts - introStartRef.current) / 1000;
      const t = 1 - Math.exp(-elapsed / tau);
      setIntroT(t);
      if (t < 0.999) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Intentional empty deps — runs once on mount; profile changes
    // mid-flight reuse the rate captured at mount, which is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const introTalking: RenderValues = useMemo(
    () => ({
      ...pickPeak(activeProfile.talking, activeProfile.base),
      thickRadius: TALKING_GEOMETRY,
    }),
    [activeProfile],
  );

  // Until the first animator frame lands, fall back to the talking
  // shape too (so we don't pop briefly to base before the crossfade).
  const animatorOrBase = animatorRender ?? baseRender(activeProfile.base);
  // When skipIntro is set, bypass the talking → animator crossfade
  // entirely and display the animator output directly. The first frame
  // falls back to base (animator hasn't run yet), so the orb mounts
  // visibly at idle/base — no sphere → torus morph.
  const display = skipIntro
    ? animatorOrBase
    : lerpRender(introTalking, animatorOrBase, introT);

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
        <GentleOrbThicken
          audioData={audioData}
          goal={1}
          scale={display.scale}
          thinRadius={activeProfile.base.thinRadius}
          thickRadius={display.thickRadius}
          thickenSpeed={0.05}
          waveIntensity={display.waveIntensity}
          waveCount={display.waveCount}
          breathAmp={display.breathAmp}
          idleAmp={display.idleAmp}
          color1={display.color1}
          color2={display.color2}
          color3={display.color3}
        />
      </Canvas>
    </div>
  );
};
