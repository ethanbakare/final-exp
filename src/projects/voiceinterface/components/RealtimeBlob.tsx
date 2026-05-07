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
  /** Force-intro plan §5.3 — when this number changes, the inner
   *  blob remounts (via React `key`) and the talking-to-idle intro
   *  animation replays. The dispatcher itself doesn't remount; only
   *  the per-shader inner blob does, so cross-shader switches still
   *  go through the natural component-type swap path. Bumped only
   *  by VoiceRealtimeOpenAI's handleThumbnailClick under the
   *  four-condition guard (force-intro flag + non-self-select +
   *  same-shader + non-speaking). */
  selectionReplayKey?: number;
}

export const RealtimeBlob: React.FC<RealtimeBlobProps> = ({
  audioData,
  voiceState,
  orb,
  width = 328,
  height = 328,
  selectionReplayKey,
}) => {
  const replayKey = selectionReplayKey ?? 0;
  if (orb.shader === 'coral') {
    return (
      <CoralRealtimeBlob
        key={`coral-${replayKey}`}
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
      key={`tube-${replayKey}`}
      audioData={audioData}
      voiceState={voiceState}
      profile={orb.profile}
      width={width}
      height={height}
    />
  );
};
