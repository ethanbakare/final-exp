/**
 * CircleRealtimeBlob — CSW-010. Circle-voice wrapper for the realtime
 * voice page + the realtime-states editor canvas. Parallels
 * RadialRealtimeBlob / CoralRealtimeBlob / NebularrBlob.
 *
 * Takes the realtime page's `voiceState` ('idle' | 'listening' |
 * 'ai_thinking' | 'ai_speaking') and a `CircleVoiceProfile` bundle,
 * drives the shared `useCircleVoiceAnimator`, and renders the shared
 * render-only `CircleVoiceOrb` (no editor ghosts on the live orb —
 * plan §3c). The SVG is authored ONCE in CircleVoiceOrb; this wrapper
 * does NOT re-implement it.
 *
 * Voice-state mapping (handoff §4):
 *   idle         → circle 'idle'
 *   listening    → circle 'listening'
 *   ai_thinking  → circle 'thinking'
 *   ai_speaking  → circle 'talking'
 *
 * Audio (handoff §4 / §5, finding A): the hook is audio-source-agnostic
 * and pulls a frame via a STABLE getter each RAF tick. We inject
 * `audioData.frequencyData ?? null` — it is `undefined` (NOT zeroed) in
 * idle/ai_thinking, so the `?? null` is load-bearing (raw-typed would
 * crash mapFrequencyToPairs). The getter reads the LATEST frame via a
 * ref so the ~16 ms audio frame is never a RAF-effect dependency
 * (would tear the loop + wipe smoothing). The shared pooled buffer is
 * read-and-consumed each tick, never retained.
 *
 * Mount (plan §3b): the hook seeds eased state at the INCOMING
 * voiceState's target (NOT idle) with no flourish / dip / talkingExit
 * and transitioning=false — so mounting mid-conversation lands at the
 * correct state with no intro. `skipIntro` is accepted for parity
 * (circle is effectively always skip-intro by this ease-from-rest
 * design); reserved.
 */
import React, { useEffect, useRef } from 'react';
import type { AudioData } from '@/projects/voiceinterface/types';
import { CircleVoiceOrb } from '@/projects/voiceinterface/circle-voice/CircleVoiceOrb';
import { useCircleVoiceAnimator } from '@/projects/voiceinterface/circle-voice/useCircleVoiceAnimator';
import type {
  CircleTransitions,
  CircleVoiceProfile,
  VoiceState,
} from '@/projects/voiceinterface/circle-voice/circleVoice';
import type { RealtimeVoiceState } from './RealtimeBlob';

/** Editor-only eye-ghost flags (plan §3c). The TRUE live page
 *  (VoiceRealtimeOpenAI → RealtimeBlob) NEVER passes this, so the live
 *  orb stays ghost-free per §3c. Only the realtime-states editor canvas
 *  passes it, to bring its circle preview to parity with the standalone
 *  circle-voice page's Max/Min-Height + Wave-Amplitude hover/eye
 *  overlays. The heavy ghost geometry (apexBars/arcRyByPair/ambientWave/
 *  waveAmplitude) is sourced from this wrapper's own animator so callers
 *  only pass the three editor flags. */
export interface CircleEditorGhostFlags {
  previewEnvelope: 'max' | 'min' | null;
  waveReachVisible: boolean;
  waveReachHovered: boolean;
}

interface CircleRealtimeBlobProps {
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  profile: CircleVoiceProfile | null;
  width?: number;
  height?: number;
  /** Parity with the other Realtime blobs. Circle eases from the
   *  incoming state's resting values on mount (no talking→idle
   *  flourish by construction), so this is accepted but not consumed. */
  skipIntro?: boolean;
  /** Editor-only (realtime-states canvas). Omitted by the live page —
   *  see CircleEditorGhostFlags. */
  editorGhosts?: CircleEditorGhostFlags;
}

const VOICE_TO_CIRCLE: Record<RealtimeVoiceState, VoiceState> = {
  idle: 'idle',
  listening: 'listening',
  ai_thinking: 'thinking',
  ai_speaking: 'talking',
};

/** Inner component — only mounted when `profile` is non-null so the
 *  hook always has a valid bundle. Keyed by bundle id upstream so a
 *  profile swap cleanly re-inits the animator (mirrors the standalone
 *  page keying on activeId). */
const CircleRealtimeInner: React.FC<{
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  profile: CircleVoiceProfile;
  width: number;
  height: number;
  editorGhosts?: CircleEditorGhostFlags;
}> = ({ audioData, voiceState, profile, width, height, editorGhosts }) => {
  const circleState = VOICE_TO_CIRCLE[voiceState];

  // Live frame, ref-backed so the ~16 ms-changing audioData is never a
  // RAF dependency. frequencyData is undefined (not zeroed) in
  // idle/ai_thinking — `?? null` is mandatory (finding A).
  const audioDataRef = useRef(audioData);
  useEffect(() => {
    audioDataRef.current = audioData;
  }, [audioData]);
  const getAudioFrame = useRef<() => Uint8Array | null>(
    () => audioDataRef.current.frequencyData ?? null,
  ).current;

  // Stable bundle identity (verbatim-hook contract — see
  // useCircleVoiceAnimator: "bundle: Fixed for the hook's lifetime").
  // The hook's RAF effect deps are [bundle, getAudioFrame,
  // transitionsRef]; a NEW bundle object tears the loop down and
  // re-subscribes, momentarily severing the audio pull. The standalone
  // circle-voice page satisfies the contract by mutating
  // bundle.settings IN PLACE on edits (stable identity). realtime-states
  // is immutable and hands a FRESH CircleVoiceProfile on every slider
  // edit AND on Update — which would re-subscribe the RAF every frame
  // of a drag and freeze the orb / "short off" the mic (the bug). So
  // mirror the standalone pattern: hold ONE stable bundle object and
  // refresh its CONTENTS in place each render. CircleRealtimeInner is
  // keyed by profile.id upstream, so a profile SWITCH remounts with a
  // correctly-seeded fresh ref; within a profile's lifetime the
  // identity is constant and the hook reads the latest settings each
  // RAF tick via this ref (exactly how the standalone page works).
  const stableBundleRef = useRef<CircleVoiceProfile>(profile);
  {
    const sb = stableBundleRef.current;
    sb.schemaVersion = profile.schemaVersion;
    sb.id = profile.id;
    sb.name = profile.name;
    sb.pinned = profile.pinned;
    sb.idleListeningLinked = profile.idleListeningLinked;
    sb.settings = profile.settings;
    sb.lastModified = profile.lastModified;
  }

  // Live-editable transition durations; ref-synced to the bundle so a
  // profile edit takes effect without making it a RAF dep.
  const transitionsRef = useRef<CircleTransitions>(
    profile.settings.transitions,
  );
  transitionsRef.current = profile.settings.transitions;

  const anim = useCircleVoiceAnimator({
    bundle: stableBundleRef.current,
    voiceState: circleState,
    transitionsRef,
    getAudioFrame,
  });

  // Identity (idle-pinned, plan §3): diameter / colors / intensity
  // never morph — read from the idle snapshot.
  const identity = profile.settings.idle;

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <CircleVoiceOrb
        diameter={identity.diameter}
        viewHeight={anim.viewHeight}
        radiusX={anim.radiusX}
        radiusY={anim.radiusY}
        circleOpacityEff={anim.circleOpacityEff}
        circleColor={identity.circleColor}
        barColor={identity.barColor}
        intensityOpacity={identity.intensityOpacity}
        bars={anim.bars}
        // Plan §3c: the live orb passes `undefined` (no ghosts). Only
        // the realtime-states editor canvas supplies `editorGhosts`,
        // and we source the heavy geometry from this wrapper's own
        // animator so the overlay matches the standalone page exactly.
        ghosts={
          editorGhosts
            ? {
                apexBars: anim.apexBars,
                arcRyByPair: anim.arcRyByPair,
                previewEnvelope: editorGhosts.previewEnvelope,
                waveReachVisible: editorGhosts.waveReachVisible,
                waveReachHovered: editorGhosts.waveReachHovered,
                ambientWave: anim.ambientWave,
                waveAmplitude: anim.waveAmplitude,
              }
            : undefined
        }
      />
    </div>
  );
};

export const CircleRealtimeBlob: React.FC<CircleRealtimeBlobProps> = ({
  audioData,
  voiceState,
  profile,
  width = 328,
  height = 328,
  editorGhosts,
}) => {
  if (!profile) {
    return <div style={{ width, height }} />;
  }
  return (
    <CircleRealtimeInner
      key={profile.id}
      audioData={audioData}
      voiceState={voiceState}
      profile={profile}
      width={width}
      height={height}
      editorGhosts={editorGhosts}
    />
  );
};
