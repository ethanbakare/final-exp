/**
 * RadialRealtimeBlob — radial-waveform wrapper for the realtime voice page.
 *
 * Parallels CoralRealtimeBlob and NebularrBlob. Takes the realtime
 * page's `voiceState` ('idle' | 'listening' | 'ai_thinking' |
 * 'ai_speaking') and a `RadialLinkedProfile`, runs the V2 animator
 * (`useRadialAnimatorV2`), and renders `RadialBidirectional` with
 * the emitted geometry/style values plus `audioData.frequencyData`.
 *
 * Voice-state mapping:
 *   idle         → radial 'idle'
 *   listening    → radial 'listening'
 *   ai_thinking  → radial 'thinking'
 *   ai_speaking  → radial 'talking'
 *
 * Audio: the V2 animator emits only geometry/style — it doesn't read
 * audio. The renderer (`RadialBidirectional`) consumes `frequencyData`
 * directly. This wrapper forwards `audioData.frequencyData` (a
 * `Uint8Array | null` produced by the realtime page's AnalyserNode)
 * through to the renderer; if absent, bars render as ambient-wave only.
 */
import React from 'react';
import RadialBidirectional from '@/projects/radial-waveform/variants/RadialBidirectional';
import type { AudioData } from '@/projects/voiceinterface/types';
import type { RadialLinkedProfile } from '@/projects/voiceinterface/radial-states/api';
import type { RadialState } from '@/projects/voiceinterface/radial-states/types';
import { useRadialAnimatorV2 } from '@/projects/voiceinterface/radial-states/useRadialAnimatorV2';
import type { RealtimeVoiceState } from './RealtimeBlob';

interface RadialRealtimeBlobProps {
  audioData: AudioData;
  voiceState: RealtimeVoiceState;
  profile: RadialLinkedProfile | null;
  width?: number;
  height?: number;
  /** Reserved for parity with the other Realtime blobs. The V2
   *  animator doesn't currently have an intro animation (it always
   *  starts from the requested state's resting values), so this
   *  prop is accepted but not yet consumed. */
  skipIntro?: boolean;
}

const VOICE_TO_RADIAL: Record<RealtimeVoiceState, RadialState> = {
  idle: 'idle',
  listening: 'listening',
  ai_thinking: 'thinking',
  ai_speaking: 'talking',
};

export const RadialRealtimeBlob: React.FC<RadialRealtimeBlobProps> = ({
  audioData,
  voiceState,
  profile,
  width = 328,
  height = 328,
}) => {
  const targetState = VOICE_TO_RADIAL[voiceState];
  const anim = useRadialAnimatorV2(profile, targetState);

  if (!profile || !anim) {
    return <div style={{ width, height }} aria-hidden />;
  }

  // Canvas half-extent — must accommodate the largest possible bar
  // reach across all states so the anchor lerp + reactive ramp stay
  // inside the canvas. Mirrors the tune-mode logic in radial-states.
  const halfExtent =
    profile.geometry.idleRadius +
    Math.max(
      profile.idle.maxBarLength,
      profile.listening.maxBarLength,
      profile.thinking.maxBarLength,
      profile.talking.maxBarLength,
    ) +
    20;

  const frequencyData = audioData.frequencyData ?? null;

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: profile.display.bgColor,
        borderRadius: 12,
        lineHeight: 0,
      }}
    >
      <RadialBidirectional
        frequencyData={frequencyData}
        radius={anim.anchor}
        barWidth={profile.bars.barWidth}
        barGap={profile.bars.barGap}
        minBarLength={anim.minBarLength}
        maxBarLength={anim.maxBarLength}
        sensitivity={anim.sensitivity}
        barColor={profile.bars.barColor}
        bgColor={profile.display.bgColor}
        segments={profile.bars.segments}
        roundCaps={profile.bars.roundCaps}
        intensityOpacity={anim.intensityOpacity}
        updateRate={profile.bars.updateRate}
        rotationSpeed={profile.bars.rotationSpeed}
        ambientWave={anim.ambientWave}
        waveSpeed={anim.waveSpeed}
        waveAmplitude={anim.waveAmplitude}
        waveHeight={anim.waveHeight}
        waveMode={anim.waveMode}
        waveShape={anim.waveShape}
        waveLobes={anim.waveLobes}
        smoothing={anim.smoothing}
        waveEnvelope={anim.waveEnvelope}
        envelopeAmplitude={anim.envelopeAmplitude}
        envelopeSensitivity={anim.envelopeSensitivity}
        inwardRatio={anim.inwardRatio}
        freezeAtMin={anim.freezeAtMin}
        renderExtent={halfExtent}
      />
    </div>
  );
};
