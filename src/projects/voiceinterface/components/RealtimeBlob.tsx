/**
 * RealtimeBlob — shader-aware dispatch for the realtime voice page.
 * Routes to <CoralRealtimeBlob> for Coral D, <NebularrBlob> for Tube,
 * or <RadialRealtimeBlob> for the radial waveform. Each wrapper owns
 * its own canvas + shader; this component is a thin discriminator.
 *
 * The component-type swap (CoralRealtimeBlob ↔ NebularrBlob ↔
 * RadialRealtimeBlob) is what triggers the talking-to-idle intro on
 * shader change. Same-shader profile A → B is just prop changes
 * flowing into the already-mounted wrapper — no intro by design.
 */
import React from 'react';
import type { AudioData } from '@/projects/voiceinterface/types';
import { NebularrBlob } from './NebularrBlob';
import { CoralRealtimeBlob, type CoralRealtimeSettings } from './CoralRealtimeBlob';
import { RadialRealtimeBlob } from './RadialRealtimeBlob';
import { CircleRealtimeBlob } from './CircleRealtimeBlob';
import type { LinkedProfile } from './useLinkedProfileAnimator';
import type { RadialLinkedProfile } from '@/projects/voiceinterface/radial-states/api';
import type { CircleVoiceProfile } from '@/projects/voiceinterface/circle-voice/circleVoice';

export type RealtimeVoiceState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';

/**
 * Discriminated union: every realtime orb is Coral, Tube, or Radial,
 * with a per-shader profile shape. The dispatch below branches on
 * `orb.shader` and TypeScript narrows `orb.profile` accordingly.
 */
export type RealtimeOrb =
  | { shader: 'coral'; profile: CoralRealtimeSettings | null }
  | { shader: 'tube'; profile: LinkedProfile | null }
  | { shader: 'radial'; profile: RadialLinkedProfile | null }
  | { shader: 'circle'; profile: CircleVoiceProfile | null };

interface RealtimeBlobProps {
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  orb: RealtimeOrb;
  width?: number;
  height?: number;
  /** When true, the inner blob suppresses its mount-time talking →
   *  idle intro animation. The eased props mount at base values
   *  rather than talking values, and the geometric morph (sphere ↔
   *  torus on Coral, talking-shape crossfade on Tube) is skipped on
   *  first mount. Sourced from the active profile's persisted
   *  `skipIntroOnSelect` flag. Replay button is unaffected by this. */
  skipIntro?: boolean;
}

export const RealtimeBlob: React.FC<RealtimeBlobProps> = ({
  audioData,
  voiceState,
  orb,
  width = 328,
  height = 328,
  skipIntro,
}) => {
  if (orb.shader === 'coral') {
    return (
      <CoralRealtimeBlob
        audioData={audioData}
        voiceState={voiceState}
        profile={orb.profile}
        width={width}
        height={height}
        skipIntro={skipIntro}
      />
    );
  }
  if (orb.shader === 'radial') {
    return (
      <RadialRealtimeBlob
        audioData={audioData}
        voiceState={voiceState}
        profile={orb.profile}
        width={width}
        height={height}
        skipIntro={skipIntro}
      />
    );
  }
  if (orb.shader === 'circle') {
    return (
      <CircleRealtimeBlob
        audioData={audioData}
        voiceState={voiceState}
        profile={orb.profile}
        width={width}
        height={height}
        skipIntro={skipIntro}
      />
    );
  }
  return (
    <NebularrBlob
      audioData={audioData}
      voiceState={voiceState}
      profile={orb.profile}
      width={width}
      height={height}
      skipIntro={skipIntro}
    />
  );
};
