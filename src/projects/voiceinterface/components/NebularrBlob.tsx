/**
 * NebularrBlob — Kyoto-style GentleOrbThicken orb for the realtime
 * page. Same audioData/voiceState surface as RealtimeBlob so it can
 * drop in alongside the Coral variant. Fetches its profile (Nebularr)
 * from the saved realtime-state-profiles.json via the studio-profiles
 * API, so tweaks made on /voiceinterface/realtime-states show up here
 * after a refresh.
 */
import React from 'react';
import { Canvas } from '@react-three/fiber';
import GentleOrbThicken from '@/projects/blob-orb/variants/GentleOrbThicken';
import type { AudioData } from '@/projects/voiceinterface/types';
import {
  baseRender,
  useLinkedProfileAnimator,
  type LinkedProfile,
  type LinkedState,
} from './useLinkedProfileAnimator';

type RealtimeVoiceState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';

interface NebularrBlobProps {
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  profile: LinkedProfile | null;
  width?: number;
  height?: number;
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
}) => {
  const linkedState = STATE_MAP[voiceState];
  const activeProfile = profile ?? NEBULARR_FALLBACK_PROFILE;
  const render = useLinkedProfileAnimator(activeProfile, linkedState);

  // Until the first animator frame lands, render the seed values
  // directly so we don't pop on mount.
  const display = render ?? baseRender(activeProfile.base);

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
