/**
 * RadialRealtimeBlob — radial-waveform wrapper for the realtime voice page.
 *
 * Parallels CoralRealtimeBlob and NebularrBlob. Takes the realtime
 * page's `voiceState` ('idle' | 'listening' | 'ai_thinking' |
 * 'ai_speaking') and a `RadialLinkedProfile`, runs the V2 animator
 * (`useRadialAnimatorV2`), and renders `RadialBidirectional` with
 * the emitted geometry/style values plus `audioData.frequencyData`.
 *
 * Composition:
 *   - The static donut Backdrop sits behind the bars (mirrors the
 *     radial-states cells).
 *   - No card / no surrounding background — the wrapper is transparent
 *     so the realtime page's own bgColor shows through.
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
import type {
  RadialBackdrop,
  RadialLinkedProfile,
} from '@/projects/voiceinterface/radial-states/api';
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

// ── Backdrop helpers (mirrored from radial-states/index.tsx) ───────
//
// Kept inline rather than imported so RadialRealtimeBlob has no runtime
// dependency on the radial-states page module (which is a large editor
// surface). If the backdrop logic ever needs to evolve in two places,
// the right move is to extract it into a shared module — for now the
// duplication is small and self-contained.

const DEFAULT_BACKDROP: Required<RadialBackdrop> = {
  enabled: true,
  color: '#262424',
  opacity: 0.03,
  shape: 'circle',
  segments: 7,
  depth: 6,
  outerShape: 'circle',
  outerSegments: 7,
  outerDepth: 6,
};

function resolveBackdrop(b: RadialBackdrop | undefined): Required<RadialBackdrop> {
  return {
    enabled: b?.enabled ?? DEFAULT_BACKDROP.enabled,
    color: b?.color ?? DEFAULT_BACKDROP.color,
    opacity: b?.opacity ?? DEFAULT_BACKDROP.opacity,
    shape: b?.shape ?? DEFAULT_BACKDROP.shape,
    segments: b?.segments ?? DEFAULT_BACKDROP.segments,
    depth: b?.depth ?? DEFAULT_BACKDROP.depth,
    outerShape: b?.outerShape ?? DEFAULT_BACKDROP.outerShape,
    outerSegments: b?.outerSegments ?? DEFAULT_BACKDROP.outerSegments,
    outerDepth: b?.outerDepth ?? DEFAULT_BACKDROP.outerDepth,
  };
}

function backdropFill(color: string, opacity: number): string {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return `rgba(38, 36, 36, ${opacity})`;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(38, 36, 36, ${opacity})`;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, opacity))})`;
}

function buildBackdropContour(
  shape: 'circle' | 'segments',
  baseR: number,
  segments: number,
  depth: number,
): string {
  if (shape === 'circle' || segments < 1 || depth <= 0) {
    return `M ${baseR} 0 A ${baseR} ${baseR} 0 1 1 ${-baseR} 0 A ${baseR} ${baseR} 0 1 1 ${baseR} 0 Z`;
  }
  const samples = 360;
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * Math.PI * 2;
    const r = baseR + depth * Math.cos(segments * t);
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    pts.push(i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  pts.push('Z');
  return pts.join(' ');
}

const DONUT_PADDING = 14;

interface BackdropProps {
  outerShape: 'circle' | 'segments';
  outerR: number;
  outerSegments: number;
  outerDepth: number;
  innerShape: 'circle' | 'segments';
  innerR: number;
  innerSegments: number;
  innerDepth: number;
  color: string;
}

function Backdrop({
  outerShape,
  outerR,
  outerSegments,
  outerDepth,
  innerShape,
  innerR,
  innerSegments,
  innerDepth,
  color,
}: BackdropProps) {
  const outerExtent = outerR + Math.max(0, outerDepth);
  const size = outerExtent * 2;
  const outerPath = buildBackdropContour(outerShape, outerR, outerSegments, outerDepth);
  const innerPath = buildBackdropContour(innerShape, innerR, innerSegments, innerDepth);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-outerExtent} ${-outerExtent} ${size} ${size}`}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden
    >
      <path d={`${outerPath} ${innerPath}`} fill={color} fillRule="evenodd" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────

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

  // Canvas half-extent fits inside the wrapper box. Bars at the extreme
  // outer ring may clip on profiles where idleRadius + maxBarLength
  // exceeds the half-box, but for the shipped radial profiles (idleRadius
  // ≤ 134, maxBarLength ≤ 60) idle/listening/thinking/talking all sit
  // inside a 328-wide canvas.
  const halfExtent = Math.min(width, height) / 2;
  const frequencyData = audioData.frequencyData ?? null;

  // Bar count must be LOCKED across state transitions. Without this,
  // RadialBidirectional auto-recomputes barCount each frame from
  // (circumference / barWidth+barGap) — and as anchor lerps inward
  // during Phase A (listening → talking), circumference shrinks, so
  // barCount drops. Per-bar angle = (i / barCount) * 2π + rotation.
  // When barCount changes, every bar's baseline angle jumps, which
  // visually reads as super-fast rotation during the morph. Locking
  // to the idle circumference (matches the radial-states tune-mode
  // cell's behaviour when lockBarCount is true) keeps the angles
  // stable through the entire transition.
  const idleCircumference = 2 * Math.PI * profile.geometry.idleRadius;
  const lockedBarCount = Math.max(
    1,
    Math.floor(idleCircumference / (profile.bars.barWidth + profile.bars.barGap)),
  );

  // Backdrop ring envelope anchored on idle (matches radial-states cells).
  const backdrop = resolveBackdrop(profile.backdrop);
  const idleR = profile.geometry.idleRadius;
  const idleMaxLen = profile.idle.maxBarLength;
  const donutOuterR = idleR + DONUT_PADDING;
  const donutInnerR = Math.max(0, idleR - idleMaxLen - DONUT_PADDING);

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Mirror TuneCell — clip the canvas if a profile's geometry
        // overflows the wrapper box. Shipped profiles fit comfortably
        // (outer reach ≤ 151 vs halfExtent 164), but this is the
        // defensive default and matches the radial-states page exactly.
        overflow: 'hidden',
        lineHeight: 0,
      }}
    >
      {backdrop.enabled && (
        <Backdrop
          outerShape={backdrop.outerShape}
          outerR={donutOuterR}
          outerSegments={backdrop.outerSegments}
          outerDepth={backdrop.outerDepth}
          innerShape={backdrop.shape}
          innerR={donutInnerR}
          innerSegments={backdrop.segments}
          innerDepth={backdrop.depth}
          color={backdropFill(backdrop.color, backdrop.opacity)}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1, lineHeight: 0 }}>
        <RadialBidirectional
          frequencyData={frequencyData}
          radius={anim.anchor}
          barWidth={profile.bars.barWidth}
          barGap={profile.bars.barGap}
          minBarLength={anim.minBarLength}
          maxBarLength={anim.maxBarLength}
          sensitivity={anim.sensitivity}
          barColor={profile.bars.barColor}
          // bgColor is accepted by the renderer but never painted
          // (the canvas uses clearRect — transparent). Passing the
          // profile's bgColor for prop-parity with the radial-states
          // TuneCell rather than a hardcoded "transparent" string,
          // so future renderer changes that DO consume bgColor get
          // the right value automatically.
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
          barCount={lockedBarCount}
        />
      </div>
    </div>
  );
};
