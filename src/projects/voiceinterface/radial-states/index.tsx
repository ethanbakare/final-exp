/**
 * Radial-states review page — three radial-waveform cells side by side
 * representing the target idle/listening, thinking, and talking states
 * for the radial voice UI. Each state is independently editable via
 * the bottom controls panel — pick a state tab, edit its sliders and
 * toggles, and see the change land in the corresponding cell live.
 *
 * Persistence is by linked-profile to disk
 * (`/api/studio-profiles?variant=radial-states` →
 * `radial-states-profiles.json`). One profile bundles idle + thinking +
 * talking RadialSettings. Active profile id persists in localStorage.
 *
 * Audio is shared across cells via the radial-waveform audioService.
 * Cell 1 (idle/listening) and cell 3 (talking) consume frequencyData;
 * cell 2 (thinking) is intentionally fed null so audio doesn't reach
 * `mapFrequencyToBars` (ambientWave is off too, so bars sit at
 * minBarLength and just rotate).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Menu, X, ChevronDown, Save, RotateCcw, Check, Pencil } from 'lucide-react';
import RadialInward from '@/projects/radial-waveform/variants/RadialInward';
import RadialOutward from '@/projects/radial-waveform/variants/RadialOutward';
import RadialGalleryAudioControls from '@/projects/radial-waveform/components/RadialGalleryAudioControls';
import { audioService } from '@/projects/radial-waveform/services/audioService';
import type { RadialSettings } from '@/projects/radial-waveform/types';
import {
  fetchRadialLinkedProfiles,
  persistRadialLinkedProfiles,
  type RadialBackdrop,
  type RadialLinkedProfile,
} from './api';

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

/** Compose hex `color` + scalar `opacity` into a CSS rgba() string for
 *  the SVG fill. Tolerant of bad input — falls back to transparent. */
function backdropFill(color: string, opacity: number): string {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return `rgba(38, 36, 36, ${opacity})`;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(38, 36, 36, ${opacity})`;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, opacity))})`;
}

// ── Presets (defaults) ────────────────────────────────────────────

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

const PLAIN_THORN: RadialSettings = {
  ...THORN,
  minBarLength: 12,
  ambientWave: false,
  waveSpeed: 1.9,
};

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

type StateKey = 'idle' | 'thinking' | 'talking';

interface AllSettings {
  idle: RadialSettings;
  thinking: RadialSettings;
  talking: RadialSettings;
}

const DEFAULT_ALL: AllSettings = {
  idle: THORN,
  thinking: PLAIN_THORN,
  talking: TALKING_SPOKE,
};

const ACTIVE_ID_STORAGE_KEY = 'radial-states-active-profile-id';

function makeNewId(): string {
  return `rs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// 50 curated names dedicated to radial-states. None overlap with the
// radial-waveform CURATED_NAMES list (which covers 100 names already
// used by Thorn / Peak / Kite / etc.). Same auto-pick pattern as the
// blob gallery / realtime-states use: pick a fresh name from the list,
// fall back to "<name> 2" if all are used.
const CURATED_NAMES = [
  'Aether', 'Astra', 'Boreal', 'Bramble', 'Cascade',
  'Caldera', 'Citrine', 'Clarion', 'Cobalt', 'Crescent',
  'Cyan', 'Dynasty', 'Elixir', 'Fathom', 'Flint',
  'Galaxy', 'Garnet', 'Glimmer', 'Hazel', 'Hyacinth',
  'Indigo', 'Kerria', 'Larkspur', 'Lattice', 'Lichen',
  'Lilac', 'Mariner', 'Maven', 'Mosaic', 'Nimbus',
  'Onyx', 'Oracle', 'Pearl', 'Pivot', 'Polaris',
  'Ravine', 'Sable', 'Saffron', 'Sapphire', 'Seraph',
  'Shimmer', 'Solstice', 'Sonata', 'Specter', 'Spire',
  'Tempo', 'Tonic', 'Verdant', 'Voyage', 'Yarrow',
] as const;

function pickFreshName(profiles: { name: string }[]): string {
  const used = new Set(profiles.map((p) => p.name.toLowerCase()));
  const available = CURATED_NAMES.filter((n) => !used.has(n.toLowerCase()));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  // All names in use — fall back to "<curated> 2", "<curated> 3"…
  const base = CURATED_NAMES[Math.floor(Math.random() * CURATED_NAMES.length)];
  let i = 2;
  while (used.has(`${base} ${i}`.toLowerCase())) i++;
  return `${base} ${i}`;
}

function settingsOf(p: RadialLinkedProfile): AllSettings {
  return { idle: p.idle, thinking: p.thinking, talking: p.talking };
}

interface ProfileSnapshot {
  settings: AllSettings;
  backdrop: Required<RadialBackdrop>;
}

function snapshotOf(p: RadialLinkedProfile): ProfileSnapshot {
  return {
    settings: settingsOf(p),
    backdrop: resolveBackdrop(p.backdrop),
  };
}

// ── Color picker (native + hex input) ────────────────────────────
//
// Two-part picker that mirrors the realtime-states picker SHAPE without
// pulling react-aria-components into this bundle (cross-project import
// of the realtime-states ColorPickerButton triggered a dev-build
// 'getStaticProps with getServerSideProps' error). Native <input
// type=color> drives the saturation/value picker (browser-supplied
// flyout), and an editable hex input below the swatch lets the user
// type colors directly. Same affordance — circular swatch — same
// editability, no extra deps.

interface ColorPickerButtonProps {
  value: string;
  onChange: (v: string) => void;
  title?: string;
  swatchSize?: number;
}

function ColorPickerButton({
  value,
  onChange,
  title = 'Open colour picker',
  swatchSize = 18,
}: ColorPickerButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hexDraft, setHexDraft] = useState(value);
  useEffect(() => {
    setHexDraft(value);
  }, [value]);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={title}
        style={{
          position: 'relative',
          width: swatchSize,
          height: swatchSize,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.15)',
          padding: 0,
          cursor: 'pointer',
          background: 'transparent',
        }}
      >
        <span style={{ position: 'absolute', inset: 0, backgroundColor: value }} />
      </button>
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          padding: 0,
          border: 0,
          opacity: 0,
          pointerEvents: 'none',
        }}
        aria-label={title}
      />
      <input
        type="text"
        value={hexDraft}
        onChange={(e) => setHexDraft(e.target.value)}
        onBlur={() => {
          const v = hexDraft.trim();
          if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
            onChange(v.startsWith('#') ? v.toLowerCase() : `#${v.toLowerCase()}`);
          } else {
            setHexDraft(value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setHexDraft(value);
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={{
          width: 64,
          padding: '2px 4px',
          fontSize: 10,
          fontVariantNumeric: 'tabular-nums',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 4,
          color: '#d1d5db',
          outline: 'none',
        }}
      />
    </div>
  );
}

// ── Ghost bars (Max Bar Length preview) ──────────────────────────
//
// Mirrors the geometry AND the envelope-ceiling math from
// RadialInward / RadialOutward. Each bar's reach is capped at
//   minBarLength + ceiling * (maxBarLength - minBarLength)
// where ceiling is 1 unless the envelope is active, in which case
//   ceiling = 1 - waveEnvelope * (1 - envValue)
//   envValue = wave * envelopeAmplitude + envelopeAmplitude * 0.1
// matching the renderer's `value = Math.min(value, effectiveCeiling)`
// branch (RadialInward.tsx:117-121). Animated via RAF so the wave
// moves and the ghost bars track the real ceiling over time.

interface GhostBarsProps {
  variant: 'inward' | 'outward';
  settings: RadialSettings;
  size: number;
  color: string;
}

function GhostBars({ variant, settings, size, color }: GhostBarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const {
      radius,
      barWidth,
      barGap,
      minBarLength,
      maxBarLength,
      roundCaps,
      ambientWave,
      waveShape,
      waveLobes,
      segments,
      waveSpeed,
      envelopeAmplitude,
      waveEnvelope,
    } = settings;

    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * radius;
    const barCount = Math.max(1, Math.floor(circumference / (barWidth + barGap)));

    let waveTime = 0;
    let lastTs = performance.now();
    let raf = 0;

    const envelopeActive = ambientWave && waveEnvelope > 0 && envelopeAmplitude > 0;

    const draw = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 1 / 30);
      lastTs = now;
      waveTime += dt;

      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = color;
      ctx.lineWidth = barWidth;
      ctx.lineCap = roundCaps ? 'round' : 'butt';

      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2;

        let ceiling = 1;
        if (envelopeActive) {
          const lobes = waveShape === 'segments' ? segments : waveLobes;
          const phase = angle * lobes - waveTime * waveSpeed;
          let wave: number;
          switch (waveShape) {
            case 'sine':
            case 'segments':
              wave = (Math.sin(phase) + 1) / 2;
              break;
            case 'triangle': {
              const t = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
              wave = t < Math.PI ? t / Math.PI : 2 - t / Math.PI;
              break;
            }
            case 'square':
              wave = Math.sin(phase) >= 0 ? 1 : 0;
              break;
            default:
              wave = 0;
          }
          const envValue = wave * envelopeAmplitude + envelopeAmplitude * 0.1;
          ceiling = 1 - waveEnvelope * (1 - envValue);
        }

        const barLen = minBarLength + ceiling * (maxBarLength - minBarLength);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(0, variant === 'outward' ? -(radius + barLen) : -(radius - barLen));
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [variant, settings, size, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}

// ── Backdrop (static donut ring) ──────────────────────────────────
//
// SVG-based replacement for the previous CSS donut. BOTH outer and
// inner contours can independently be a perfect circle or a parametric
// wavy curve with N lobes (cos(N*θ) modulating r). Even-odd fillRule
// cuts the inner shape out of the outer shape, leaving the donut band.

/** Build an SVG path 'd' string for one closed contour at base radius
 *  baseR. When shape='circle' (or segments < 1 / depth ≤ 0), emits two
 *  half-arcs. Otherwise emits a 360-sample polyline tracing
 *  r(θ) = baseR + depth * cos(N * θ). */
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
  // The outer wavy contour can bulge OUTWARD by `outerDepth` past
  // outerR. Size the SVG to cover that maximum extent so peaks aren't
  // clipped.
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

// ── Cell ──────────────────────────────────────────────────────────

interface CellProps {
  label: string;
  settings: RadialSettings;
  frequencyData: Uint8Array | null;
  variant: 'inward' | 'outward';
  focused: boolean;
  onClick: () => void;
  /** When true, render a red ghost ring on this cell at the bar's full
   *  extension zone (between the bars' base and their max reach). Used
   *  to preview where Max Bar Length lands while the user is hovering
   *  the Max Bar Length slider. */
  showMaxGhost?: boolean;
  /** Donut envelope dimensions, computed once at the page level from
   *  the active profile's idle settings so all three cells render the
   *  same envelope. Outer = idle.radius + DONUT_PADDING; inner =
   *  idle.radius - idle.maxBarLength - DONUT_PADDING. */
  donutSize: number;
  donutThickness: number;
  /** Backdrop config — both edges have independent shape/segments/depth.
   *  Resolved with defaults at the page level. */
  backdropEnabled: boolean;
  backdropColor: string;
  backdropOpacity: number;
  backdropShape: 'circle' | 'segments';
  backdropSegments: number;
  backdropDepth: number;
  backdropOuterShape: 'circle' | 'segments';
  backdropOuterSegments: number;
  backdropOuterDepth: number;
}

const CELL_SIZE = 360;
// Donut envelope is shared across ALL cells, anchored to the IDLE
// state's current bar range (radius + maxBarLength). Both edges use the
// same padding so the band hugs the bar zone symmetrically. Computed
// per render at the page level (not as module constants) so it tracks
// live edits to idle.radius / idle.maxBarLength.
const DONUT_PADDING = 14;
const DONUT_COLOR = 'rgba(38, 36, 36, 0.03)'; // #262424 at 3%

function Cell({
  label,
  settings,
  frequencyData,
  variant,
  focused,
  onClick,
  showMaxGhost,
  donutSize,
  donutThickness,
  backdropEnabled,
  backdropColor,
  backdropOpacity,
  backdropShape,
  backdropSegments,
  backdropDepth,
  backdropOuterShape,
  backdropOuterSegments,
  backdropOuterDepth,
}: CellProps) {
  const Renderer = variant === 'outward' ? RadialOutward : RadialInward;
  const backdropOuterR = donutSize / 2;
  const backdropInnerR = backdropOuterR - donutThickness;

  // Max-reach ghost: individual bars at maxBarLength shown via the
  // GhostBars overlay below. Sized to fit both inward and outward
  // ranges so the canvas never clips.
  const ghostCanvasSize = (settings.radius + settings.maxBarLength + 20) * 2;

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
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
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
          padding: 0,
          border: `2px solid ${focused ? '#FACC15' : 'transparent'}`,
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        aria-pressed={focused}
        aria-label={`Focus ${label}`}
      >
        {backdropEnabled && (
          <Backdrop
            outerShape={backdropOuterShape}
            outerR={backdropOuterR}
            outerSegments={backdropOuterSegments}
            outerDepth={backdropOuterDepth}
            innerShape={backdropShape}
            innerR={backdropInnerR}
            innerSegments={backdropSegments}
            innerDepth={backdropDepth}
            color={backdropFill(backdropColor, backdropOpacity)}
          />
        )}
        {showMaxGhost && (
          <GhostBars
            variant={variant}
            settings={settings}
            size={ghostCanvasSize}
            color="rgba(239, 68, 68, 0.18)"
          />
        )}
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
          color: focused ? '#FACC15' : '#fafafa',
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

// ── Controls (slim, inline) ───────────────────────────────────────

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  onReset,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  /** When provided, a small ↺ icon appears beside the value. The
   *  caller decides when to pass it (typically: only when the field
   *  diverges from baseline). Clicking calls the callback. */
  onReset?: () => void;
}) {
  const decimals = step < 0.1 ? 3 : step < 1 ? 2 : 0;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    setEditing(false);
    const n = parseFloat(draft);
    if (Number.isNaN(n)) return;
    const clamped = Math.min(max, Math.max(min, n));
    const stepped = Math.round(clamped / step) * step;
    onChange(stepped);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, gap: 6 }}>
        <span style={{ color: '#9ca3af' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {editing ? (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setEditing(false);
              }}
              autoFocus
              style={{
                width: 56,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fafafa',
                fontFamily: 'inherit',
                fontSize: 11,
                fontVariantNumeric: 'tabular-nums',
                padding: '1px 4px',
                borderRadius: 3,
                textAlign: 'right',
                outline: 'none',
              }}
            />
          ) : (
            <span
              role="button"
              tabIndex={0}
              onClick={() => {
                setDraft(value.toFixed(decimals));
                setEditing(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDraft(value.toFixed(decimals));
                  setEditing(true);
                }
              }}
              style={{
                color: '#6b7280',
                fontVariantNumeric: 'tabular-nums',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              title="Click to edit"
            >
              {value}
              {unit ?? ''}
            </span>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              title="Reset to last saved"
              aria-label={`Reset ${label} to last saved`}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: 0,
                fontSize: 11,
                lineHeight: 1,
                width: 14,
                height: 14,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ↺
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#FACC15' }}
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        color: '#9ca3af',
        cursor: 'pointer',
      }}
    >
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: '#FACC15' }}
      />
    </label>
  );
}

function ColorSwatch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
      <span>{label}</span>
      <div style={{ position: 'relative', width: 22, height: 22, borderRadius: 11, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: value }} />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}

function PillGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
      <span>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            style={{
              padding: '2px 8px',
              fontSize: 10,
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              background: value === o ? '#fff' : 'rgba(255,255,255,0.05)',
              color: value === o ? '#000' : '#9ca3af',
              fontWeight: value === o ? 500 : 400,
            }}
          >
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ControlsPanelProps {
  settings: RadialSettings;
  /** Baseline (last-saved) values for the focused state — used to
   *  decide which fields are dirty and to drive per-field reset. When
   *  null, no reset icons render. */
  baselineSettings: RadialSettings | null;
  onChange: (patch: Partial<RadialSettings>) => void;
  /** Hover signal for the Max Bar Length slider — drives the red ghost
   *  ring on the focused cell. */
  onMaxBarHover: (hover: boolean) => void;
  /** Profile-level backdrop config + setter (shared across all states). */
  backdrop: Required<RadialBackdrop>;
  baselineBackdrop: Required<RadialBackdrop> | null;
  onBackdropChange: (patch: Partial<RadialBackdrop>) => void;
}

function ControlsPanel({
  settings,
  baselineSettings,
  onChange,
  onMaxBarHover,
  backdrop,
  baselineBackdrop,
  onBackdropChange,
}: ControlsPanelProps) {
  const set = <K extends keyof RadialSettings>(key: K, value: RadialSettings[K]) =>
    onChange({ [key]: value } as Partial<RadialSettings>);
  // Returns a reset callback for one settings field if (and only if)
  // the current value differs from the baseline. Drives the ↺ icon
  // visibility per-slider in this panel.
  const settingReset = <K extends keyof RadialSettings>(key: K): (() => void) | undefined => {
    if (!baselineSettings) return undefined;
    if (settings[key] === baselineSettings[key]) return undefined;
    return () => set(key, baselineSettings[key] as RadialSettings[K]);
  };
  const backdropReset = <K extends keyof Required<RadialBackdrop>>(key: K): (() => void) | undefined => {
    if (!baselineBackdrop) return undefined;
    if (backdrop[key] === baselineBackdrop[key]) return undefined;
    return () => onBackdropChange({ [key]: baselineBackdrop[key] } as Partial<RadialBackdrop>);
  };

  // 5-column grid. Items have been redistributed across sections so each
  // column lands at ~5 items, eliminating the empty space that the
  // original section-by-purpose layout left under shorter columns
  // (Audio had 3, Style had 6 — 100px+ height delta). Moves:
  //   - Rotation Speed   : Style    → Audio (it's a rate, fits)
  //   - Round Caps       : Style    → Audio (visual response toggle)
  //   - Peak Boost       : Wave     → Envelope (shapes wave intensity)
  // Net: 5 / 5 / 5 / 5 / 4 columns.
  const columnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  };
  const headerStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 500,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    margin: 0,
    marginBottom: 4,
  };

  return (
    <div
      style={{
        background: '#1a1a1e',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 20,
      }}
    >
      <div style={columnStyle}>
        <h3 style={headerStyle}>Geometry</h3>
        <Slider label="Radius" value={settings.radius} min={30} max={200} step={1} unit="px" onChange={(v) => set('radius', v)} onReset={settingReset('radius')} />
        <Slider label="Bar Width" value={settings.barWidth} min={0.5} max={10} step={0.5} unit="px" onChange={(v) => set('barWidth', v)} onReset={settingReset('barWidth')} />
        <Slider label="Bar Gap" value={settings.barGap} min={0} max={12} step={0.5} unit="px" onChange={(v) => set('barGap', v)} onReset={settingReset('barGap')} />
        <Slider label="Min Bar Length" value={settings.minBarLength} min={0} max={30} step={1} unit="px" onChange={(v) => set('minBarLength', v)} onReset={settingReset('minBarLength')} />
        <div
          onMouseEnter={() => onMaxBarHover(true)}
          onMouseLeave={() => onMaxBarHover(false)}
        >
          <Slider label="Max Bar Length" value={settings.maxBarLength} min={10} max={120} step={1} unit="px" onChange={(v) => set('maxBarLength', v)} onReset={settingReset('maxBarLength')} />
        </div>
      </div>

      <div style={columnStyle}>
        <h3 style={headerStyle}>Audio</h3>
        <Slider label="Sensitivity" value={settings.sensitivity} min={0.1} max={5} step={0.1} unit="x" onChange={(v) => set('sensitivity', v)} onReset={settingReset('sensitivity')} />
        <Slider label="Segments" value={settings.segments} min={1} max={16} step={1} onChange={(v) => set('segments', v)} onReset={settingReset('segments')} />
        <Slider label="Smoothing" value={settings.smoothing} min={0} max={0.99} step={0.01} onChange={(v) => set('smoothing', v)} onReset={settingReset('smoothing')} />
        <Slider label="Rotation" value={settings.rotationSpeed} min={0} max={30} step={0.5} unit="°/s" onChange={(v) => set('rotationSpeed', v)} onReset={settingReset('rotationSpeed')} />
        <Toggle label="Round Caps" checked={settings.roundCaps} onChange={(v) => set('roundCaps', v)} />
      </div>

      <div style={columnStyle}>
        <h3 style={headerStyle}>Wave</h3>
        <Toggle label="Ambient Wave" checked={settings.ambientWave} onChange={(v) => set('ambientWave', v)} />
        {settings.ambientWave && (
          <>
            <PillGroup
              label="Shape"
              value={settings.waveShape}
              options={['sine', 'square', 'segments'] as const}
              onChange={(v) => set('waveShape', v)}
            />
            {settings.waveShape !== 'segments' && (
              <Slider label="Lobes" value={settings.waveLobes} min={1} max={16} step={1} onChange={(v) => set('waveLobes', v)} onReset={settingReset('waveLobes')} />
            )}
            <Slider label="Speed" value={settings.waveSpeed} min={0} max={10} step={0.1} unit=" rad/s" onChange={(v) => set('waveSpeed', v)} onReset={settingReset('waveSpeed')} />
            <Slider label="Amplitude" value={settings.waveAmplitude} min={0} max={1} step={0.01} onChange={(v) => set('waveAmplitude', v)} onReset={settingReset('waveAmplitude')} />
          </>
        )}
      </div>

      <div style={columnStyle}>
        <h3 style={headerStyle}>Envelope</h3>
        <Slider label="Envelope" value={settings.waveEnvelope} min={0} max={1} step={0.01} onChange={(v) => set('waveEnvelope', v)} onReset={settingReset('waveEnvelope')} />
        <Slider label="Env Amplitude" value={settings.envelopeAmplitude} min={0} max={1} step={0.01} onChange={(v) => set('envelopeAmplitude', v)} onReset={settingReset('envelopeAmplitude')} />
        <Slider label="Env Sensitivity" value={settings.envelopeSensitivity} min={0} max={1} step={0.01} onChange={(v) => set('envelopeSensitivity', v)} onReset={settingReset('envelopeSensitivity')} />
        <PillGroup
          label="Mode"
          value={settings.waveMode}
          options={['additive', 'reactive'] as const}
          onChange={(v) => set('waveMode', v)}
        />
        <Slider label="Peak Boost" value={settings.waveHeight} min={0.5} max={3} step={0.1} unit="x" onChange={(v) => set('waveHeight', v)} onReset={settingReset('waveHeight')} />
      </div>

      <div style={columnStyle}>
        <h3 style={headerStyle}>Style</h3>
        {/* Compact row: Intensity toggle + Bar / Cell color swatches in one line. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: '#9ca3af',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={settings.intensityOpacity}
              onChange={(e) => set('intensityOpacity', e.target.checked)}
              style={{ accentColor: '#FACC15' }}
            />
            Intensity
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af' }}>
            <span>Bar</span>
            <ColorPickerButton
              value={settings.barColor}
              onChange={(v) => set('barColor', v)}
              title="Bar color"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af' }}>
            <span>BG</span>
            <ColorPickerButton
              value={settings.previewBg}
              onChange={(v) => set('previewBg', v)}
              title="Cell background"
            />
          </div>
        </div>

        {/* Backdrop subsection — profile-level (shared across all three
         *  states). The header row carries the Show toggle on its right
         *  side so the toggle doesn't waste a whole row of its own. When
         *  Show is off, the inner/outer config rows hide entirely (saves
         *  ~80px when the user is just previewing bars). When Show is
         *  on, Inner and Outer each get a single compact row "Inner
         *  [Circle | Segments]" with conditional Segments/Depth sliders
         *  immediately beneath — no per-side sub-header. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          <h3 style={{ ...headerStyle, margin: 0 }}>Backdrop</h3>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: '#9ca3af',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={backdrop.enabled}
              onChange={(e) => onBackdropChange({ enabled: e.target.checked })}
              style={{ accentColor: '#FACC15' }}
            />
            Show
          </label>
        </div>
        {backdrop.enabled && (
          <>
            {/* Color + opacity row — inline so they share one line. The
             *  swatch shows the actual rendered fill (color × opacity)
             *  rather than just the hex; keeps the affordance honest. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af' }}>
                <span>Color</span>
                <ColorPickerButton
                  value={backdrop.color}
                  onChange={(v) => onBackdropChange({ color: v })}
                  title="Backdrop color"
                />
              </div>
              <div style={{ flex: 1 }}>
                <Slider
                  label="Opacity"
                  value={backdrop.opacity}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => onBackdropChange({ opacity: v })}
                  onReset={backdropReset('opacity')}
                />
              </div>
            </div>
            <PillGroup
              label="Inner"
              value={backdrop.shape}
              options={['circle', 'segments'] as const}
              onChange={(v) => onBackdropChange({ shape: v })}
            />
            {backdrop.shape === 'segments' && (
              <>
                <Slider
                  label="Segments"
                  value={backdrop.segments}
                  min={3}
                  max={16}
                  step={1}
                  onChange={(v) => onBackdropChange({ segments: v })}
                  onReset={backdropReset('segments')}
                />
                <Slider
                  label="Depth"
                  value={backdrop.depth}
                  min={0}
                  max={20}
                  step={0.5}
                  unit="px"
                  onChange={(v) => onBackdropChange({ depth: v })}
                  onReset={backdropReset('depth')}
                />
              </>
            )}
            <PillGroup
              label="Outer"
              value={backdrop.outerShape}
              options={['circle', 'segments'] as const}
              onChange={(v) => onBackdropChange({ outerShape: v })}
            />
            {backdrop.outerShape === 'segments' && (
              <>
                <Slider
                  label="Segments"
                  value={backdrop.outerSegments}
                  min={3}
                  max={16}
                  step={1}
                  onChange={(v) => onBackdropChange({ outerSegments: v })}
                  onReset={backdropReset('outerSegments')}
                />
                <Slider
                  label="Depth"
                  value={backdrop.outerDepth}
                  min={0}
                  max={20}
                  step={0.5}
                  unit="px"
                  onChange={(v) => onBackdropChange({ outerDepth: v })}
                  onReset={backdropReset('outerDepth')}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

const STATE_VARIANT: Record<StateKey, 'inward' | 'outward'> = {
  idle: 'inward',
  thinking: 'inward',
  talking: 'outward',
};

const STATE_LABEL: Record<StateKey, string> = {
  idle: 'Idle / Listening',
  thinking: 'Thinking',
  talking: 'Talking',
};

export default function RadialStatesReview() {
  const [audioActive, setAudioActive] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const [focused, setFocused] = useState<StateKey>('idle');
  const [profiles, setProfiles] = useState<RadialLinkedProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  // Baseline snapshot of the active profile's settings at last save / load.
  // Used for dirty detection (compared against current activeProfile.settings).
  const [baseline, setBaseline] = useState<ProfileSnapshot | null>(null);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [maxBarHovered, setMaxBarHovered] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [renameDraft, setRenameDraft] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Load profiles from disk on mount. Falls back to a single seed
  // profile if the API returns an empty list.
  useEffect(() => {
    let cancelled = false;
    fetchRadialLinkedProfiles().then((arr) => {
      if (cancelled) return;
      let initialList: RadialLinkedProfile[];
      if (arr.length === 0) {
        initialList = [
          {
            id: 'rs-default',
            name: 'Default',
            idle: DEFAULT_ALL.idle,
            thinking: DEFAULT_ALL.thinking,
            talking: DEFAULT_ALL.talking,
            lastModified: Date.now(),
          },
        ];
        // Persist the seed so the file exists for next load.
        persistRadialLinkedProfiles(initialList);
      } else {
        initialList = arr;
      }
      setProfiles(initialList);
      const savedId = window.localStorage.getItem(ACTIVE_ID_STORAGE_KEY);
      const initial = initialList.find((p) => p.id === savedId) ?? initialList[0];
      setActiveProfileId(initial.id);
      setBaseline(snapshotOf(initial));
      setProfilesLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist active profile id selection.
  useEffect(() => {
    if (!profilesLoaded || !activeProfileId) return;
    try {
      window.localStorage.setItem(ACTIVE_ID_STORAGE_KEY, activeProfileId);
    } catch {
      /* ignore */
    }
  }, [activeProfileId, profilesLoaded]);

  // Active profile + derived `all`.
  const activeProfile = useMemo<RadialLinkedProfile | null>(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId],
  );
  const all: AllSettings = activeProfile ? settingsOf(activeProfile) : DEFAULT_ALL;

  // Dirty detection: shallow JSON-compare current snapshot (settings +
  // backdrop) vs baseline.
  const isDirty = useMemo(() => {
    if (!activeProfile || !baseline) return false;
    return JSON.stringify(snapshotOf(activeProfile)) !== JSON.stringify(baseline);
  }, [activeProfile, baseline]);

  // Audio polling.
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

  // Outside-click close for profile dropdown.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Mutators: edit the focused state of the active profile (immutable
  // update of profiles[]). Settings live on disk per save; in-memory
  // edits are preserved across profile switches via the profiles array
  // until the user explicitly Saves or Resets.
  const updateFocused = (patch: Partial<RadialSettings>) => {
    if (!activeProfileId) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId
          ? { ...p, [focused]: { ...p[focused], ...patch }, lastModified: Date.now() }
          : p,
      ),
    );
  };

  const resetFocused = () => {
    if (!activeProfileId || !baseline) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId ? { ...p, [focused]: baseline.settings[focused] } : p,
      ),
    );
  };

  const handleUpdate = async () => {
    if (!activeProfile) return;
    const next = profiles.map((p) =>
      p.id === activeProfile.id ? { ...p, lastModified: Date.now() } : p,
    );
    setProfiles(next);
    setBaseline(snapshotOf(activeProfile));
    await persistRadialLinkedProfiles(next);
  };

  const handleReset = () => {
    if (!activeProfileId || !baseline) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId
          ? {
              ...p,
              idle: baseline.settings.idle,
              thinking: baseline.settings.thinking,
              talking: baseline.settings.talking,
              backdrop: baseline.backdrop,
            }
          : p,
      ),
    );
  };

  const handleSelectProfile = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    // Discard any uncommitted edits on the previous profile by reverting
    // it to its baseline before switching.
    if (activeProfileId && baseline) {
      setProfiles((prev) =>
        prev.map((q) =>
          q.id === activeProfileId
            ? {
                ...q,
                idle: baseline.settings.idle,
                thinking: baseline.settings.thinking,
                talking: baseline.settings.talking,
                backdrop: baseline.backdrop,
              }
            : q,
        ),
      );
    }
    setActiveProfileId(id);
    setBaseline(snapshotOf(p));
    setShowProfileDropdown(false);
  };

  const handleSaveAs = async () => {
    const name = saveName.trim();
    if (!name || !activeProfile) return;
    const newProfile: RadialLinkedProfile = {
      id: makeNewId(),
      name,
      idle: activeProfile.idle,
      thinking: activeProfile.thinking,
      talking: activeProfile.talking,
      backdrop: activeProfile.backdrop,
      lastModified: Date.now(),
    };
    const next = [...profiles, newProfile];
    setProfiles(next);
    setActiveProfileId(newProfile.id);
    setBaseline(snapshotOf(newProfile));
    setShowSaveDialog(false);
    setSaveName('');
    await persistRadialLinkedProfiles(next);
  };

  const handleRenameCommit = async () => {
    const name = (renameDraft ?? '').trim();
    if (!name || !activeProfile) {
      setRenameDraft(null);
      return;
    }
    if (name === activeProfile.name) {
      setRenameDraft(null);
      return;
    }
    const next = profiles.map((p) =>
      p.id === activeProfile.id ? { ...p, name, lastModified: Date.now() } : p,
    );
    setProfiles(next);
    setRenameDraft(null);
    await persistRadialLinkedProfiles(next);
  };

  // Donut envelope dimensions — anchored on the IDLE state's current
  // settings, so as the user dials idle.maxBarLength down (e.g. 60 →
  // 43), the donut's inner edge tracks at the same DONUT_PADDING (14px)
  // distance past the new innermost reach. All three cells share these.
  const donutOuter = all.idle.radius + DONUT_PADDING;
  const donutInner = Math.max(0, all.idle.radius - all.idle.maxBarLength - DONUT_PADDING);
  const donutSize = donutOuter * 2;
  const donutThickness = donutOuter - donutInner;
  const backdrop = resolveBackdrop(activeProfile?.backdrop);

  const updateBackdrop = (patch: Partial<RadialBackdrop>) => {
    if (!activeProfileId) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId
          ? {
              ...p,
              backdrop: { ...resolveBackdrop(p.backdrop), ...patch },
              lastModified: Date.now(),
            }
          : p,
      ),
    );
  };

  const cellsRow = (
    <div
      style={{
        display: 'flex',
        gap: 32,
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 24,
      }}
    >
      {(['idle', 'thinking', 'talking'] as const).map((k) => (
        <Cell
          key={k}
          label={STATE_LABEL[k]}
          settings={all[k]}
          // Thinking is intentionally fed null so audio doesn't reach it.
          frequencyData={k === 'thinking' ? null : frequencyData}
          variant={STATE_VARIANT[k]}
          focused={focused === k}
          onClick={() => setFocused(k)}
          showMaxGhost={focused === k && maxBarHovered}
          donutSize={donutSize}
          donutThickness={donutThickness}
          backdropEnabled={backdrop.enabled}
          backdropColor={backdrop.color}
          backdropOpacity={backdrop.opacity}
          backdropShape={backdrop.shape}
          backdropSegments={backdrop.segments}
          backdropDepth={backdrop.depth}
          backdropOuterShape={backdrop.outerShape}
          backdropOuterSegments={backdrop.outerSegments}
          backdropOuterDepth={backdrop.outerDepth}
        />
      ))}
    </div>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0F0F11',
        padding: controlsCollapsed ? '32px 16px 80px' : '32px 16px 360px',
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

      {cellsRow}

      {/* Fixed bottom dock — controls panel (when expanded) above the
       *  main bar. Main bar mirrors the realtime-states layout: hamburger,
       *  state pills, profile dropdown + save controls, all in one row. */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {!controlsCollapsed && (
          <ControlsPanel
            settings={all[focused]}
            baselineSettings={baseline?.settings[focused] ?? null}
            onChange={updateFocused}
            onMaxBarHover={setMaxBarHovered}
            backdrop={backdrop}
            baselineBackdrop={baseline?.backdrop ?? null}
            onBackdropChange={updateBackdrop}
          />
        )}
        <div
          style={{
            background: '#1a1a1e',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setControlsCollapsed((c) => !c)}
            style={{
              padding: 6,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.05)',
              color: '#9ca3af',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-expanded={!controlsCollapsed}
            aria-controls="controls-panel"
            aria-label={controlsCollapsed ? 'Show controls' : 'Hide controls'}
          >
            {controlsCollapsed ? <Menu size={14} /> : <X size={14} />}
          </button>

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />

          {/* State pills */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['idle', 'thinking', 'talking'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFocused(k)}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  borderRadius: 9999,
                  border: 'none',
                  cursor: 'pointer',
                  background: focused === k ? '#FACC15' : 'rgba(255,255,255,0.05)',
                  color: focused === k ? '#000' : '#9ca3af',
                  fontWeight: focused === k ? 500 : 400,
                }}
              >
                {STATE_LABEL[k]}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />

          {/* Profile dropdown — three states:
           *    showSaveDialog  → input for new profile name
           *    renameDraft !== null → input for renaming the active profile
           *    default         → button showing active name + chevron */}
          <div style={{ position: 'relative' }} ref={profileMenuRef}>
            {showSaveDialog ? (
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveAs();
                  if (e.key === 'Escape') {
                    setShowSaveDialog(false);
                    setSaveName('');
                  }
                }}
                placeholder="Profile name"
                autoFocus
                style={{
                  width: 140,
                  padding: '4px 8px',
                  fontSize: 12,
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fafafa',
                  border: '1px solid rgba(255,255,255,0.15)',
                  outline: 'none',
                }}
              />
            ) : renameDraft !== null ? (
              <input
                type="text"
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={handleRenameCommit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameCommit();
                  if (e.key === 'Escape') setRenameDraft(null);
                }}
                placeholder="Rename profile"
                autoFocus
                style={{
                  width: 140,
                  padding: '4px 8px',
                  fontSize: 12,
                  borderRadius: 6,
                  background: 'rgba(250,204,21,0.1)',
                  color: '#fafafa',
                  border: '1px solid rgba(250,204,21,0.4)',
                  outline: 'none',
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowProfileDropdown((p) => !p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  fontSize: 12,
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#d1d5db',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  minWidth: 100,
                }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>
                  {activeProfile?.name ?? '—'}
                </span>
                <ChevronDown size={12} style={{ color: '#9ca3af' }} />
              </button>
            )}
            {showProfileDropdown && !showSaveDialog && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  marginBottom: 4,
                  width: 200,
                  background: '#1a1a1e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                  maxHeight: 240,
                  overflowY: 'auto',
                  zIndex: 60,
                }}
              >
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p.id)}
                    style={{
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                      color: p.id === activeProfileId ? '#fafafa' : '#9ca3af',
                      fontWeight: p.id === activeProfileId ? 500 : 400,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showSaveDialog ? (
            <>
              <button
                type="button"
                onClick={handleSaveAs}
                disabled={!saveName.trim()}
                style={{
                  padding: 6,
                  borderRadius: 6,
                  background: 'transparent',
                  color: saveName.trim() ? '#22c55e' : '#4b5563',
                  border: 'none',
                  cursor: saveName.trim() ? 'pointer' : 'default',
                }}
                aria-label="Confirm save"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveName('');
                }}
                style={{
                  padding: 6,
                  borderRadius: 6,
                  background: 'transparent',
                  color: '#ef4444',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label="Cancel save"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              {/* Update — only visible when dirty */}
              {isDirty && (
                <button
                  type="button"
                  onClick={handleUpdate}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    borderRadius: 6,
                    background: 'rgba(245,158,11,0.2)',
                    color: '#facc15',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Update
                </button>
              )}
              {/* Rename (active profile, in place) */}
              {activeProfile && (
                <button
                  type="button"
                  onClick={() => setRenameDraft(activeProfile.name)}
                  style={{
                    padding: 6,
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.05)',
                    color: '#9ca3af',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label="Rename current profile"
                  title="Rename current profile"
                >
                  <Pencil size={12} />
                </button>
              )}
              {/* Save (Save As — auto-pick a fresh curated name) */}
              <button
                type="button"
                onClick={() => {
                  setSaveName(pickFreshName(profiles));
                  setShowSaveDialog(true);
                }}
                style={{
                  padding: 6,
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#9ca3af',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Save as new profile"
                title="Save as new profile"
              >
                <Save size={14} />
              </button>
              {/* Discard — only visible when dirty. Labeled as 'Discard'
               *  (not a refresh icon) so the affordance is honest about
               *  reverting unsaved edits, not reloading the page. */}
              {isDirty && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.05)',
                    color: '#9ca3af',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  aria-label="Discard unsaved edits"
                  title="Discard unsaved edits"
                >
                  <RotateCcw size={12} />
                  Discard
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
