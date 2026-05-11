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
import RadialBidirectional from '@/projects/radial-waveform/variants/RadialBidirectional';
import { ColorPickerButton } from './ColorPicker';
import {
  ControlsPanel,
  Slider,
  Toggle,
  PillGroup,
} from './ControlsPanel';
import {
  fetchRadialLinkedProfiles,
  persistRadialLinkedProfiles,
  makeDefaultProfile,
  deriveTalkingAnchor,
  type RadialBackdrop,
  type RadialBars,
  type RadialDisplay,
  type RadialLinkedProfile,
  type RadialStateSettings,
} from './api';
import type { RadialState } from './types';
import { useRadialAnimatorV2 as useLinkedRadialAnimator } from './useRadialAnimatorV2';

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

// ── State key — 4 pills total; static-mode cell count stays 3 because
// idle/listening share visually while idleListeningLinked is true. ──

type StateKey = 'idle' | 'listening' | 'thinking' | 'talking';

interface AllSettings {
  idle: RadialSettings;
  listening: RadialSettings;
  thinking: RadialSettings;
  talking: RadialSettings;
}

/** Materialize a v2 profile's per-state settings into the legacy
 *  RadialSettings shape that Cell + ControlsPanel + GhostBars consume.
 *  Bar identity comes from `profile.bars`; display from `profile.display`;
 *  radius is derived for talking. inwardRatio is variant-implied (1 for
 *  inward variants, 0 for talking) — Phase 1 doesn't lerp it. */
function materializeState(
  profile: RadialLinkedProfile,
  state: StateKey,
): RadialSettings {
  const s = profile[state];
  const radius =
    state === 'talking' ? deriveTalkingAnchor(profile) : profile.geometry.idleRadius;
  return {
    radius,
    barWidth: profile.bars.barWidth,
    barGap: profile.bars.barGap,
    minBarLength: s.minBarLength,
    maxBarLength: s.maxBarLength,
    sensitivity: s.sensitivity,
    barColor: profile.bars.barColor,
    bgColor: profile.display.bgColor,
    segments: profile.bars.segments,
    roundCaps: profile.bars.roundCaps,
    intensityOpacity: s.intensityOpacity,
    updateRate: profile.bars.updateRate,
    inwardRatio: state === 'talking' ? 0 : 1,
    rotationSpeed: profile.bars.rotationSpeed,
    ambientWave: s.ambientWave,
    waveSpeed: s.waveSpeed,
    waveAmplitude: s.waveAmplitude,
    waveHeight: s.waveHeight,
    waveMode: s.waveMode,
    waveShape: s.waveShape,
    waveLobes: s.waveLobes,
    smoothing: s.smoothing,
    waveEnvelope: s.waveEnvelope,
    envelopeAmplitude: s.envelopeAmplitude,
    envelopeSensitivity: s.envelopeSensitivity,
    containerBg: profile.display.containerBg,
    containerBgOpacity: profile.display.containerBgOpacity,
    containerRadius: profile.display.containerRadius,
    containerPadding: profile.display.containerPadding,
    showOutline: profile.display.showOutline,
    outlineColor: profile.display.outlineColor,
    outlineWidth: profile.display.outlineWidth,
    previewBg: profile.display.previewBg,
  };
}

// Field-dispatch sets — used by applyPatch to route a controls-panel
// edit to the right slot in the v2 schema. Every field on RadialSettings
// is in exactly one of these (or is the special `radius` / `inwardRatio`
// case handled inline).
// minBarLength is per-state (RadialStateSettings), not bar identity —
// idle's silent-state min stays short, thinking's frozen min stays large.
const BAR_IDENTITY_FIELDS: ReadonlySet<keyof RadialBars> = new Set([
  'barWidth', 'barGap', 'roundCaps', 'barColor', 'segments',
  'rotationSpeed', 'updateRate',
]);
const DISPLAY_FIELDS: ReadonlySet<keyof RadialDisplay> = new Set([
  'bgColor', 'previewBg', 'containerBg', 'containerBgOpacity',
  'containerRadius', 'containerPadding', 'showOutline', 'outlineColor',
  'outlineWidth',
]);

/** Apply a controls-panel patch (in legacy RadialSettings shape) to a
 *  v2 profile, dispatching each field to the right v2 slot. Pure —
 *  returns a new profile, structurally clones every touched block.
 *
 *  - bar identity (barWidth/barGap/etc) → profile.bars
 *  - display chrome (bgColor/etc) → profile.display
 *  - radius → profile.geometry.idleRadius (only when focused !== 'talking';
 *    talking's radius is derived)
 *  - inwardRatio → ignored (variant-implied in Phase 1)
 *  - everything else → profile[focused] (per-state)
 *
 *  Side effects:
 *  - When `bars.minBarLength` increases, clamps each state's
 *    `maxBarLength` upward to maintain the invariant max >= min
 *    (R6 P2.1 / R7 P1.4).
 *  - When focused === 'idle' and idleListeningLinked is true, mirrors
 *    per-state writes to `listening` (link-propagation rule §8a). */
function applyPatch(
  profile: RadialLinkedProfile,
  focused: StateKey,
  patch: Partial<RadialSettings>,
): RadialLinkedProfile {
  const next: RadialLinkedProfile = {
    ...profile,
    bars: { ...profile.bars },
    display: { ...profile.display },
    geometry: { ...profile.geometry },
    idle: { ...profile.idle },
    listening: { ...profile.listening },
    thinking: { ...profile.thinking },
    talking: { ...profile.talking },
  };

  for (const [k, v] of Object.entries(patch) as [keyof RadialSettings, any][]) {
    if (BAR_IDENTITY_FIELDS.has(k as any)) {
      (next.bars as any)[k] = v;
    } else if (k === 'minBarLength') {
      // Per-state: write to focused, optionally mirror to listening,
      // and clamp focused's maxBarLength upward if it dropped below.
      if (typeof v === 'number') {
        (next[focused] as any).minBarLength = v;
        if (next[focused].maxBarLength < v) {
          next[focused] = { ...next[focused], maxBarLength: v };
        }
        if (focused === 'idle' && next.idleListeningLinked) {
          (next.listening as any).minBarLength = v;
          if (next.listening.maxBarLength < v) {
            next.listening = { ...next.listening, maxBarLength: v };
          }
        }
      }
    } else if (DISPLAY_FIELDS.has(k as any)) {
      (next.display as any)[k] = v;
    } else if (k === 'radius') {
      if (focused !== 'talking' && typeof v === 'number') {
        next.geometry.idleRadius = v;
      }
      // Ignore radius edits on talking — it's derived.
    } else if (k === 'inwardRatio') {
      // Not represented in v2 schema (variant-implied); ignore.
    } else {
      // Per-state field.
      (next[focused] as any)[k] = v;
      // Link-propagation: idle edits mirror to listening when linked.
      if (focused === 'idle' && next.idleListeningLinked) {
        (next.listening as any)[k] = v;
      }
    }
  }
  next.lastModified = Date.now();
  return next;
}

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
  return {
    idle: materializeState(p, 'idle'),
    listening: materializeState(p, 'listening'),
    thinking: materializeState(p, 'thinking'),
    talking: materializeState(p, 'talking'),
  };
}

/** Snapshot of the entire profile shape. Used as baseline for dirty
 *  detection + Discard. Replaces the v1 ProfileSnapshot which only
 *  tracked settings/backdrop/lockBarCount/talkingInnerGap — the v2
 *  schema added bars/display/geometry/listening/idleListeningLinked/
 *  morph, all of which need to round-trip through Discard correctly.
 *
 *  CRITICAL: structuredClone deep-clones every nested object so baseline
 *  does NOT share references with the live profile. Without this,
 *  baseline and the active profile point at the same nested blocks;
 *  Discard / profile-switch then propagate a shared reference into
 *  another profile, and persist serializes the cross-bleed.
 *  (Same discipline that fixed commit 63a2394 in v1.) */
type ProfileSnapshot = RadialLinkedProfile;

function snapshotOf(p: RadialLinkedProfile): ProfileSnapshot {
  return structuredClone(p);
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
  /** Match the rendered bar count override so the ghost bars line up
   *  with the real bars when radial-states forces a shared count. */
  barCountOverride?: number;
}

function GhostBars({ variant, settings, size, color, barCountOverride }: GhostBarsProps) {
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

    const { radius, barWidth, barGap, maxBarLength, roundCaps } = settings;

    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * radius;
    const barCount =
      barCountOverride ?? Math.max(1, Math.floor(circumference / (barWidth + barGap)));

    // Match the renderer's clamp so ghost shows what the renderer can
    // actually draw (R5 P2.5 / R7 — pure geometric envelope, no audio,
    // no wave, no envelope-modulation; just full max length, clamped
    // by maxSafeInward for inward variants).
    const minInnerRadius = (barCount * barGap) / (2 * Math.PI);
    const maxSafeInward = Math.max(0, radius - minInnerRadius);
    const barLen =
      variant === 'outward' ? maxBarLength : Math.min(maxBarLength, maxSafeInward);

    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = color;
    ctx.lineWidth = barWidth;
    ctx.lineCap = roundCaps ? 'round' : 'butt';

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.lineTo(0, variant === 'outward' ? -(radius + barLen) : -(radius - barLen));
      ctx.stroke();
      ctx.restore();
    }
    // Static draw — no RAF loop needed since the ghost is the
    // geometric envelope, not an animated ceiling.
    return undefined;
  }, [variant, settings, size, color, barCountOverride]);

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
  /** Bar-count override applied to all three cells, computed once at
   *  the page level from the active profile's idle settings. Undefined
   *  when lockBarCount is off — each cell then auto-computes from its
   *  own circumference. */
  barCountOverride: number | undefined;
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
  barCountOverride,
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
            barCountOverride={barCountOverride}
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
            barCount={barCountOverride}
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

// ── Controls extracted to ./ControlsPanel ──────────────────────

// ── Tune-mode single cell (animator-driven) ────────────────────────

interface TuneCellProps {
  profile: RadialLinkedProfile;
  targetState: RadialState;
  frequencyData: Uint8Array | null;
  /** Reserved canvas extent — derived from the largest possible bar reach
   *  across all states so anchor lerp + audio + reactive ramp stay inside
   *  a stable canvas. */
  renderExtent: number;
  /** Backdrop config (shared). */
  backdrop: Required<RadialBackdrop>;
  /** Donut envelope dimensions for the backdrop. */
  donutSize: number;
  donutThickness: number;
  barCountOverride: number;
}

function TuneCell({
  profile,
  targetState,
  frequencyData,
  renderExtent,
  backdrop,
  donutSize,
  donutThickness,
  barCountOverride,
}: TuneCellProps) {
  const anim = useLinkedRadialAnimator(profile, targetState);
  if (!anim) return null;

  const cellSize = renderExtent * 2;
  const backdropOuterR = donutSize / 2;
  const backdropInnerR = backdropOuterR - donutThickness;

  return (
    <div
      style={{
        width: cellSize,
        height: cellSize,
        background: profile.display.previewBg,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {backdrop.enabled && (
        <Backdrop
          outerShape={backdrop.outerShape}
          outerR={backdropOuterR}
          outerSegments={backdrop.outerSegments}
          outerDepth={backdrop.outerDepth}
          innerShape={backdrop.shape}
          innerR={backdropInnerR}
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
          renderExtent={renderExtent}
          barCount={barCountOverride}
        />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

const STATE_VARIANT: Record<StateKey, 'inward' | 'outward'> = {
  idle: 'inward',
  listening: 'inward',
  thinking: 'inward',
  talking: 'outward',
};

const STATE_LABEL: Record<StateKey, string> = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  talking: 'Talking',
};

const MODE_STORAGE_KEY = 'radial-states-mode';
type Mode = 'static' | 'tune';

export default function RadialStatesReview() {
  const [audioActive, setAudioActive] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const [focused, setFocused] = useState<StateKey>('idle');
  const [mode, setMode] = useState<Mode>('static');
  // Persist mode separately from active profile id.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === 'static' || saved === 'tune') setMode(saved);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);
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
        initialList = [makeDefaultProfile('rs-default', 'Default')];
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
  const all: AllSettings = useMemo(() => {
    if (activeProfile) return settingsOf(activeProfile);
    // No active profile yet — synthesize from a default profile so the
    // page can render before fetch completes.
    const seed = makeDefaultProfile('seed', 'seed');
    return settingsOf(seed);
  }, [activeProfile]);

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
      prev.map((p) => (p.id === activeProfileId ? applyPatch(p, focused, patch) : p)),
    );
  };

  /** Reset only the per-state slot of `focused`. Reverts that state's
   *  per-state fields (sensitivity, wave/envelope, maxBarLength,
   *  intensityOpacity) to baseline. Bar identity, display chrome,
   *  geometry, etc are NOT touched here — those belong to other
   *  reset paths. */
  const resetFocused = () => {
    if (!activeProfileId || !baseline) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId
          ? { ...p, [focused]: structuredClone(baseline[focused]) }
          : p,
      ),
    );
  };

  const handleUpdate = async () => {
    if (!activeProfile) return;
    // Build the updated profile FIRST so baseline can snapshot the
    // exact same object that lands in profiles[]. Snapshotting
    // `activeProfile` here would capture the old lastModified, leaving
    // baseline.lastModified stale and the dirty-compare permanently
    // true — which is what kept the Update button visible after save.
    const updated = { ...activeProfile, lastModified: Date.now() };
    const next = profiles.map((p) => (p.id === activeProfile.id ? updated : p));
    setProfiles(next);
    setBaseline(snapshotOf(updated));
    await persistRadialLinkedProfiles(next);
  };

  /** Discard: revert the active profile to its baseline shape entirely.
   *  Deep-clones every block so baseline isn't aliased afterward. */
  const handleReset = () => {
    if (!activeProfileId || !baseline) return;
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfileId ? structuredClone(baseline) : p)),
    );
  };

  const handleSelectProfile = (id: string) => {
    const p = profiles.find((x) => x.id === id);
    if (!p) return;
    // Discard any uncommitted edits on the previous profile by reverting
    // it to its baseline before switching. structuredClone ensures the
    // reverted profile doesn't share references with baseline.
    if (activeProfileId && baseline) {
      setProfiles((prev) =>
        prev.map((q) => (q.id === activeProfileId ? structuredClone(baseline) : q)),
      );
    }
    setActiveProfileId(id);
    setBaseline(snapshotOf(p));
    setShowProfileDropdown(false);
  };

  const handleSaveAs = async () => {
    const name = saveName.trim();
    if (!name || !activeProfile) return;
    // structuredClone the whole profile so the new entry is fully
    // decoupled from the source. (The cross-bleed bug fixed in 63a2394
    // was caused by sharing nested references; structuredClone on the
    // whole shape is the v2-equivalent guard.)
    const newProfile: RadialLinkedProfile = {
      ...structuredClone(activeProfile),
      id: makeNewId(),
      name,
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
    // Build the renamed profile FIRST and use it for both profiles[]
    // and baseline so the dirty-compare doesn't flag a stale name
    // (same closure-stale issue handleUpdate had, fixed in bc2f70d).
    const renamed = { ...activeProfile, name, lastModified: Date.now() };
    const next = profiles.map((p) => (p.id === activeProfile.id ? renamed : p));
    setProfiles(next);
    setBaseline(snapshotOf(renamed));
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
  // Shared bar count — anchored on idle's circumference so talking
  // (smaller radius) packs the same number of bars on its smaller
  // ring. Lock can be toggled off via the Talking-state Geometry
  // panel; when off, each cell auto-computes its own count.
  const lockBarCount = activeProfile?.lockBarCount ?? true;
  const idleCircumference = 2 * Math.PI * all.idle.radius;
  const barCountOverride = lockBarCount
    ? Math.max(1, Math.floor(idleCircumference / (all.idle.barWidth + all.idle.barGap)))
    : undefined;
  const backdrop = resolveBackdrop(activeProfile?.backdrop);

  // Talking's radius is DERIVED via deriveTalkingAnchor() in api.ts —
  // preserves the clamp behavior (R7 P1.1: Math.max(0, ...) inner +
  // Math.max(1, ...) outer).
  const talkingInnerGap = activeProfile?.geometry.talkingInnerGap ?? DONUT_PADDING;
  const talkingDerivedRadius = activeProfile
    ? deriveTalkingAnchor(activeProfile)
    : Math.max(1, donutInner + talkingInnerGap);
  const effectiveTalkingSettings: RadialSettings = {
    ...all.talking,
    radius: talkingDerivedRadius,
  };
  // Locked-bar-count: talking's gap is computed from talking's smaller
  // circumference / locked count, surfaced read-only so the user sees
  // the real spacing.
  const talkingDerivedGap =
    lockBarCount && barCountOverride != null
      ? Math.max(0, (2 * Math.PI * talkingDerivedRadius) / barCountOverride - effectiveTalkingSettings.barWidth)
      : undefined;

  const updateLockBarCount = (next: boolean) => {
    if (!activeProfileId) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId ? { ...p, lockBarCount: next, lastModified: Date.now() } : p,
      ),
    );
  };

  const updateTalkingInnerGap = (next: number) => {
    if (!activeProfileId) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId
          ? { ...p, geometry: { ...p.geometry, talkingInnerGap: next }, lastModified: Date.now() }
          : p,
      ),
    );
  };

  /** Morph durations + reactiveStartAt (profile-level). Visible only in
   *  tune mode on thinking/talking panels. */
  const updateMorph = (
    patch: Partial<{ idleToThinking: number; thinkingToTalking: number; reactiveStartAt: number }>,
  ) => {
    if (!activeProfileId) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId
          ? { ...p, morph: { ...p.morph, ...patch }, lastModified: Date.now() }
          : p,
      ),
    );
  };

  /** Break the idle/listening link. Listening keeps its current values
   *  (which equal idle's at the moment of break) and becomes
   *  independently editable from then on. */
  const breakIdleListeningLink = () => {
    if (!activeProfileId) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId
          ? { ...p, idleListeningLinked: false, lastModified: Date.now() }
          : p,
      ),
    );
  };

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

  // Tune-mode render extent — reserves space for the largest possible
  // bar reach across all states, so anchor lerp + reactive ramp stay
  // inside a stable canvas (per plan §6.5).
  const tuneRenderExtent =
    (activeProfile?.geometry.idleRadius ?? 134) +
    Math.max(
      activeProfile?.idle.maxBarLength ?? 60,
      activeProfile?.listening.maxBarLength ?? 60,
      activeProfile?.thinking.maxBarLength ?? 60,
      activeProfile?.talking.maxBarLength ?? 40,
    ) +
    20;

  const cellsRow =
    mode === 'tune' && activeProfile ? (
      <div
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 24,
        }}
      >
        <TuneCell
          profile={activeProfile}
          targetState={focused as RadialState}
          frequencyData={frequencyData}
          renderExtent={tuneRenderExtent}
          backdrop={backdrop}
          donutSize={donutSize}
          donutThickness={donutThickness}
          barCountOverride={barCountOverride ?? Math.floor(idleCircumference / (all.idle.barWidth + all.idle.barGap))}
        />
      </div>
    ) : (
      <div
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 24,
        }}
      >
        {(['idle', 'listening', 'thinking', 'talking'] as const).map((k) => (
          <Cell
            key={k}
            label={STATE_LABEL[k]}
            settings={k === 'talking' ? effectiveTalkingSettings : all[k]}
            // Thinking is intentionally fed null so audio doesn't reach it.
            // Idle is also silent (it's the resting state); listening
            // reacts to audio. Talking reacts when audio is active.
            frequencyData={k === 'idle' || k === 'thinking' ? null : frequencyData}
            variant={STATE_VARIANT[k]}
            focused={focused === k}
            onClick={() => setFocused(k)}
            showMaxGhost={focused === k && maxBarHovered}
            donutSize={donutSize}
            donutThickness={donutThickness}
            barCountOverride={barCountOverride}
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
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginTop: 16,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ color: '#fafafa', fontSize: 16, fontWeight: 500 }}>
          Radial states — {mode === 'tune' ? 'tune' : 'review'}
        </div>
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 999,
            padding: 2,
          }}
        >
          {(['static', 'tune'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                background: mode === m ? '#FACC15' : 'transparent',
                color: mode === m ? '#0F0F11' : '#e5e7eb',
                border: 'none',
                borderRadius: 999,
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: 0.3,
                textTransform: 'capitalize',
              }}
              aria-pressed={mode === m}
            >
              {m}
            </button>
          ))}
        </div>
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
            settings={focused === 'talking' ? effectiveTalkingSettings : all[focused]}
            baselineSettings={baseline ? materializeState(baseline, focused) : null}
            onChange={updateFocused}
            onMaxBarHover={setMaxBarHovered}
            focused={focused}
            lockBarCount={lockBarCount}
            onLockBarCountChange={updateLockBarCount}
            talkingDerivedGap={talkingDerivedGap}
            talkingInnerGap={talkingInnerGap}
            onTalkingInnerGapChange={updateTalkingInnerGap}
            backdrop={backdrop}
            baselineBackdrop={baseline ? resolveBackdrop(baseline.backdrop) : null}
            onBackdropChange={updateBackdrop}
            showMorphSubsection={mode === 'tune' && (focused === 'thinking' || focused === 'talking')}
            morph={activeProfile?.morph ?? { idleToThinking: 0.4, thinkingToTalking: 0.6, reactiveStartAt: 0.75 }}
            onMorphChange={updateMorph}
            idleListeningLinked={activeProfile?.idleListeningLinked ?? true}
            onBreakLink={breakIdleListeningLink}
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
            {(['idle', 'listening', 'thinking', 'talking'] as const).map((k) => (
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
