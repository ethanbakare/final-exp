/**
 * RealtimeBlob — shader-aware dispatch for the realtime voice page.
 * Routes to <CoralRealtimeBlob> when the active orb is Coral D, or to
 * <NebularrBlob> when the active orb is Tube. Both wrappers own
 * their own canvas + shader; this component is a thin discriminator.
 *
 * The component-type swap (CoralRealtimeBlob ↔ NebularrBlob) is what
 * triggers the talking-to-idle intro on shader change. Same-shader
 * profile A → B is just prop changes flowing into the already-mounted
 * wrapper — no intro by design.
 */
import React from 'react';
import type { AudioData } from '@/projects/voiceinterface/types';
import { NebularrBlob } from './NebularrBlob';
import { CoralRealtimeBlob, type CoralRealtimeSettings } from './CoralRealtimeBlob';
import type { LinkedProfile } from './useLinkedProfileAnimator';

export type RealtimeVoiceState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';

/**
 * Discriminated union: every realtime orb is either Coral or Tube,
 * with a per-shader profile shape. The dispatch below branches on
 * `orb.shader` and TypeScript narrows `orb.profile` accordingly.
 */
export type RealtimeOrb =
  | { shader: 'coral'; profile: CoralRealtimeSettings | null }
  | { shader: 'tube'; profile: LinkedProfile | null };

interface RealtimeBlobProps {
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  orb: RealtimeOrb;
  width?: number;
  height?: number;
}

export const RealtimeBlob: React.FC<RealtimeBlobProps> = ({
  audioData,
  voiceState,
  orb,
  width = 328,
  height = 328,
}) => {
  if (orb.shader === 'coral') {
    return (
      <CoralRealtimeBlob
        audioData={audioData}
        voiceState={voiceState}
        profile={orb.profile}
        width={width}
        height={height}
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
    />
  );
};
