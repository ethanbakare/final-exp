/**
 * Radial-states review page — three radial-waveform cells side by side
 * representing the target idle/listening, thinking, and talking states
 * for the radial voice UI. Static review surface — no animator, no
 * morphing. Each cell mounts the existing variant component
 * (RadialInward / RadialOutward) with hardcoded settings so we can
 * see the three states next to each other and iterate on numbers
 * before designing the morph.
 *
 * Audio is shared across cells via the radial-waveform audioService
 * (the same source that drives the playground). Cell 1 (idle/listening)
 * and cell 3 (talking) consume frequencyData; cell 2 (thinking) is
 * intentionally fed null so audio doesn't reach `mapFrequencyToBars`
 * (ambientWave is off too, so bars sit at minBarLength and just rotate).
 */
import React, { useEffect, useState } from 'react';
import RadialInward from '@/projects/radial-waveform/variants/RadialInward';
import RadialOutward from '@/projects/radial-waveform/variants/RadialOutward';
import RadialGalleryAudioControls from '@/projects/radial-waveform/components/RadialGalleryAudioControls';
import { audioService } from '@/projects/radial-waveform/services/audioService';
import type { RadialSettings } from '@/projects/radial-waveform/types';

// ── Presets ────────────────────────────────────────────────────────
//
// Hardcoded for the review pass — when values are settled we'll move
// them into the realtime-states editor for proper editing. Plain Thorn
// and Thorn live in radial-inward-profiles.json today; their values
// here are mirrored so the page is self-contained.

const THORN: RadialSettings = {
  radius: 134,
  barWidth: 6.5,
  barGap: 9,
  minBarLength: 3,
  maxBarLength: 60,
  sensitivity: 0.7,
  barColor: '#0f0f11',
  bgColor: '#0F0F11',
  segments: 7,
  roundCaps: true,
  intensityOpacity: false,
  updateRate: 0,
  inwardRatio: 0,
  rotationSpeed: 6,
  ambientWave: true,
  waveSpeed: 1.5,
  waveAmplitude: 0.36,
  waveHeight: 1.5,
  waveMode: 'additive',
  waveShape: 'segments',
  waveLobes: 2,
  smoothing: 0.95,
  waveEnvelope: 0.4,
  envelopeAmplitude: 1,
  envelopeSensitivity: 0.5,
  containerBg: '',
  containerBgOpacity: 1,
  containerRadius: 0,
  containerPadding: 0,
  showOutline: false,
  outlineColor: '#FFFFFF',
  outlineWidth: 2,
  previewBg: '#f7f6f4',
};

// Thorn with ambientWave off, minBarLength bumped (3 → 12) so the
// rotating ring reads with strong presence at rest.
const PLAIN_THORN: RadialSettings = {
  ...THORN,
  minBarLength: 12,
  ambientWave: false,
  waveSpeed: 1.9,
};

// Talking — Outward variant carrying Thorn's bar identity (barWidth,
// barGap, segments, color) but spoking outward with a Kite-ish wave
// rhythm. radius 94 keeps the visual outer edge near Thorn's ~134
// (94 + maxBarLength 40 ≈ 134). rotationSpeed kept at 6 to match
// Thorn — talking shouldn't lose the rotation that idle/listening
// already has. Strawman; iterate from here.
const TALKING_SPOKE: RadialSettings = {
  ...THORN,
  radius: 94,
  maxBarLength: 40,
  sensitivity: 1.7,
  waveShape: 'sine',
  waveLobes: 7,
  waveAmplitude: 0.35,
  waveSpeed: 2,
  waveEnvelope: 0,
  envelopeAmplitude: 0,
  envelopeSensitivity: 0,
};

// ── Cell ───────────────────────────────────────────────────────────

interface CellProps {
  label: string;
  settings: RadialSettings;
  frequencyData: Uint8Array | null;
  variant: 'inward' | 'outward';
}

const CELL_SIZE = 360;
// Donut envelope is shared across ALL cells (idle/listening, thinking,
// talking). Anchored to Thorn's bar range so idle/listening/thinking
// have 10px padding outside outer reach + 10px past inner reach. The
// talking cell's smaller bar range sits inside this same donut.
const DONUT_PADDING = 10;
const DONUT_COLOR = 'rgba(38, 36, 36, 0.03)'; // #262424 at 3%
const DONUT_OUTER = THORN.radius + DONUT_PADDING;
const DONUT_INNER = Math.max(0, THORN.radius - THORN.maxBarLength - DONUT_PADDING);
const DONUT_SIZE = DONUT_OUTER * 2;
const DONUT_THICKNESS = DONUT_OUTER - DONUT_INNER;

function Cell({ label, settings, frequencyData, variant }: CellProps) {
  const Renderer = variant === 'outward' ? RadialOutward : RadialInward;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          background: settings.previewBg,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: DONUT_SIZE,
            height: DONUT_SIZE,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: `${DONUT_THICKNESS}px solid ${DONUT_COLOR}`,
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, lineHeight: 0 }}>
          <Renderer
            frequencyData={frequencyData}
            radius={settings.radius}
            barWidth={settings.barWidth}
            barGap={settings.barGap}
            minBarLength={settings.minBarLength}
            maxBarLength={settings.maxBarLength}
            sensitivity={settings.sensitivity}
            barColor={settings.barColor}
            bgColor={settings.bgColor}
            segments={settings.segments}
            roundCaps={settings.roundCaps}
            intensityOpacity={settings.intensityOpacity}
            updateRate={settings.updateRate}
            rotationSpeed={settings.rotationSpeed}
            ambientWave={settings.ambientWave}
            waveSpeed={settings.waveSpeed}
            waveAmplitude={settings.waveAmplitude}
            waveHeight={settings.waveHeight}
            waveMode={settings.waveMode}
            waveShape={settings.waveShape}
            waveLobes={settings.waveLobes}
            smoothing={settings.smoothing}
            waveEnvelope={settings.waveEnvelope}
            envelopeAmplitude={settings.envelopeAmplitude}
            envelopeSensitivity={settings.envelopeSensitivity}
          />
        </div>
      </div>
      <div
        style={{
          color: '#fafafa',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 13,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────

export default function RadialStatesReview() {
  const [audioActive, setAudioActive] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (audioActive) {
        const data = audioService.getFrequencyData();
        setFrequencyData(data ? new Uint8Array(data) : null);
      } else {
        setFrequencyData(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioActive]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0F0F11',
        padding: '32px 16px 96px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32,
      }}
    >
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50 }}>
        <RadialGalleryAudioControls onAudioActive={setAudioActive} />
      </div>

      <div
        style={{
          color: '#fafafa',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 16,
          fontWeight: 500,
          marginTop: 16,
        }}
      >
        Radial states — review
      </div>

      <div
        style={{
          display: 'flex',
          gap: 32,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 24,
        }}
      >
        <Cell
          label="Idle / Listening (Thorn)"
          settings={THORN}
          frequencyData={frequencyData}
          variant="inward"
        />
        <Cell
          label="Thinking (Plain Thorn)"
          settings={PLAIN_THORN}
          frequencyData={null}
          variant="inward"
        />
        <Cell
          label="Talking (Spoke)"
          settings={TALKING_SPOKE}
          frequencyData={frequencyData}
          variant="outward"
        />
      </div>
    </div>
  );
}
