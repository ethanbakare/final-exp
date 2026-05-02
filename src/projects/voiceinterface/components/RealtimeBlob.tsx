/**
 * RealtimeBlob — adapter that hosts CoralStoneMorph for the realtime
 * voice page. Sibling of LoopingBlob (auto-loop preview) and
 * PreviewVoiceAnimated (homepage card). This one is driven by the
 * realtime page's live audioData + voiceState — no auto-loop.
 *
 * Sized at 252×252 to match the Figma spec for the realtime card.
 * base.scale is bumped from 0.55 (studio default at 400px) to 0.74
 * to keep blob-to-canvas proportion comparable in the smaller canvas,
 * mirroring the convention in PreviewVoiceAnimated (0.55 at 400px →
 * 0.7 at 282px).
 */
import React from 'react';
import { Canvas } from '@react-three/fiber';
import CoralStoneMorph from '@/projects/blob-orb/variants/CoralStoneMorph';
import type { AudioData } from '@/projects/voiceinterface/types';
import {
  WHIMSY_BASE,
  DEFAULT_STATE_SETTINGS,
  CAMERA_Z,
  CAMERA_FOV,
  type BlobVoiceState,
} from './blob-studio/blobStudioTypes';

export type RealtimeVoiceState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';

interface RealtimeBlobProps {
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  width?: number;
  height?: number;
}

// Canvas is sized 30% larger than the blob's visible diameter so the
// Speaking-state morph (sphere bigger than the idle torus) doesn't clip
// at the bounding box. At canvas 328×328 with FOV 45°/z=3.5, scale ≈ 1.04
// keeps the visible blob ~227px (same as scale 1.35 at 252×252).
const REALTIME_BASE = {
  ...WHIMSY_BASE,
  scale: 1.04,
};

const STATE_MAP: Record<RealtimeVoiceState, BlobVoiceState> = {
  idle: 'idle',
  listening: 'listening',
  ai_thinking: 'thinking',
  ai_speaking: 'talking',
};

export const RealtimeBlob: React.FC<RealtimeBlobProps> = ({
  audioData,
  voiceState,
  width = 328,
  height = 328,
}) => {
  const blobState = STATE_MAP[voiceState];
  const stateSettings = DEFAULT_STATE_SETTINGS[blobState];
  const goal = blobState === 'talking' ? 0 : 1;
  const morphSpeed = stateSettings.thickenSpeed * 1.08;

  return (
    <div className="realtime-blob" style={{ width, height, position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        frameloop="always"
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <CoralStoneMorph
          audioData={audioData}
          goal={goal}
          scale={REALTIME_BASE.scale}
          morphSpeed={morphSpeed}
          torusRadius={REALTIME_BASE.thinRadius}
          waveIntensity={stateSettings.waveIntensity}
          breathAmp={stateSettings.breathAmp}
          idleAmp={stateSettings.idleAmp}
          color1={REALTIME_BASE.color1}
          color2={REALTIME_BASE.color2}
          color3={REALTIME_BASE.color3}
        />
      </Canvas>
    </div>
  );
};
