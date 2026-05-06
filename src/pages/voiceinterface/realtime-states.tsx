/**
 * Kyoto preview surface for the realtime page's blob states.
 *
 * Linked-profile model: idle, listening, thinking-rest, and talking-rest
 * share `profile.base`. Thinking and talking each carry their own peak
 * overrides that diverge only at peak. JS animator owns all motion so
 * state changes (and thinking pulses) glide smoothly with no shader
 * snap. Persists via /api/studio-profiles?variant=realtime-state, with
 * realtime-state-profiles.json at repo root pre-seeded with Kyoto Realtime.
 *
 * Plan: REALTIME_STATES_PLAN.md (v2.4 + patches)
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { Menu, X, Repeat, ChevronDown, Save, Check, Pause, Play, RotateCcw, Pencil, Bookmark, Disc, Circle } from 'lucide-react';
import {
  ColorArea,
  ColorSlider,
  ColorThumb,
  SliderTrack,
  parseColor,
  type Color,
} from 'react-aria-components';
import GentleOrbThicken from '@/projects/blob-orb/variants/GentleOrbThicken';
import CoralStoneMorph from '@/projects/blob-orb/variants/CoralStoneMorph';
import GalleryAudioControls from '@/projects/blob-orb/components/GalleryAudioControls';
import SliderRow from '@/projects/blob-orb/components/shared/SliderRow';
import { Slider } from '@/components/ui/slider';
import { audioService } from '@/projects/blob-orb/services/audioService';
import { CURATED_NAMES, GALLERY_API_KEYS, approxPixelDia } from '@/projects/blob-orb/galleryTypes';
import type { AudioData } from '@/projects/voiceinterface/types';
import { CORAL_FALLBACK_PROFILE, CORAL_PULSE_DEFAULTS, useCoralThinkingPulse, useEasedColor, useEasedNumber, type CoralRealtimeSettings } from '@/projects/voiceinterface/components/CoralRealtimeBlob';

// ── Types ─────────────────────────────────────────────────────────

type PreviewState = 'idle' | 'listening' | 'thinking' | 'talking';
type PeakScope = 'thinking' | 'talking';
type ControlTab = 'size' | 'thickness' | 'motion' | 'colours';
type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsb';

interface BaseSettings {
  scale: number;
  thinRadius: number;
  thickenSpeed: number;
  waveIntensity: number;
  waveCount: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
  bgColor: string;
}

interface PeakOverrides {
  scale?: number;
  thickRadius?: number;
  thickenSpeed?: number;
  entrySpeed?: number;
  settleSpeed?: number;
  waveIntensity?: number;
  waveCount?: number;
  breathAmp?: number;
  idleAmp?: number;
  color1?: string;
  color2?: string;
  color3?: string;
}

interface LinkedProfile {
  base: BaseSettings;
  thinking: PeakOverrides;
  talking: PeakOverrides;
}

interface SavedProfile {
  id: string;
  name: string;
  /** When true, this profile appears in the live realtime page's
   *  thumbnail strip. Toggleable via the bookmark button next to each
   *  entry in the dropdown. Default false (a profile must be explicitly
   *  pinned to show on the live page). */
  pinned?: boolean;
  settings: LinkedProfile;
  lastModified: number;
}

/** Saved-profile shape for the Coral D shader (parallel file). */
interface SavedCoralProfile {
  id: string;
  name: string;
  pinned?: boolean;
  settings: CoralRealtimeSettings;
  lastModified: number;
}

/** Combined display row used by the dropdown — keeps the source
 *  variant so save/rename/pin can route to the right file. The editor
 *  preserves separate per-source arrays internally; this union is just
 *  the read-side projection. */
type DropdownRow =
  | {
      shader: 'kyoto';
      sourceVariant: 'realtime-state';
      id: string;
      name: string;
      pinned: boolean;
    }
  | {
      shader: 'coral';
      sourceVariant: 'realtime-coral';
      id: string;
      name: string;
      pinned: boolean;
    };

/** Plan v8 (3D-0) — full discriminated union over both source files.
 *  Used as the editor's canonical active-orb shape. The dropdown's
 *  `DropdownRow` is a read-side projection of this; `BaselineSnapshot`
 *  is the dirty-detection projection. */
type LoadedOrb =
  | {
      shader: 'kyoto';
      sourceVariant: 'realtime-state';
      id: string;
      name: string;
      pinned: boolean;
      settings: LinkedProfile;
      lastModified: number;
    }
  | {
      shader: 'coral';
      sourceVariant: 'realtime-coral';
      id: string;
      name: string;
      pinned: boolean;
      settings: CoralRealtimeSettings;
      lastModified: number;
    };

/** Plan v8 round-7 F1 — narrow shape for dirty detection. Inspects only
 *  `settings`, never `name`/`pinned`/`lastModified`/`sourceVariant`. */
type BaselineSnapshot =
  | { key: string; shader: 'kyoto'; settings: LinkedProfile }
  | { key: string; shader: 'coral'; settings: CoralRealtimeSettings };

/** Composite key format `${sourceVariant}:${id}` — ids aren't unique
 *  across the two source files, so the key glues them. */
const compositeKey = (orb: { sourceVariant: string; id: string }) =>
  `${orb.sourceVariant}:${orb.id}`;

interface RenderValues {
  scale: number;
  thickRadius: number;
  thickenSpeed: number; // animator bookkeeping; not passed to shader
  waveIntensity: number;
  waveCount: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
}

// ── Constants ─────────────────────────────────────────────────────

const KYOTO_SEED: LinkedProfile = {
  base: {
    scale: 0.55,
    thinRadius: 0.15,
    thickenSpeed: 1.2,
    waveIntensity: 0.18,
    waveCount: 8,
    breathAmp: 0.015,
    idleAmp: 0.04,
    color1: '#080602',
    color2: '#efff08',
    color3: '#693a22',
    bgColor: '#fffafa',
  },
  thinking: { thickRadius: 0.25 },
  talking: { color3: '#949e05', waveCount: 16 },
};

const STATES: PreviewState[] = ['idle', 'listening', 'thinking', 'talking'];
const TALKING_GEOMETRY = 1.0;
const SILENT: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };
const API = '/api/studio-profiles?variant=realtime-state';
const REALTIME_SEED_NAME = 'Kyoto Realtime';

// ── Helpers ───────────────────────────────────────────────────────

async function fetchProfiles(): Promise<SavedProfile[]> {
  try {
    const r = await fetch(API);
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

async function fetchProfileNames(variant: string): Promise<string[]> {
  try {
    const r = await fetch(`/api/studio-profiles?variant=${variant}`);
    const j = await r.json();
    return Array.isArray(j)
      ? j.map((p) => (typeof p?.name === 'string' ? p.name : '')).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

async function persistProfiles(arr: SavedProfile[]) {
  try {
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arr),
    });
  } catch (e) {
    console.error('[realtime-states] persist failed', e);
  }
}

const CORAL_API = '/api/studio-profiles?variant=realtime-coral';

async function fetchCoralProfiles(): Promise<SavedCoralProfile[]> {
  try {
    const r = await fetch(CORAL_API);
    const j = await r.json();
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

async function persistCoralProfiles(arr: SavedCoralProfile[]) {
  try {
    await fetch(CORAL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arr),
    });
  } catch (e) {
    console.error('[realtime-states] persist coral failed', e);
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function normalizeProfileName(name: string) {
  return name.trim().toLowerCase();
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => Math.round(clampNumber(n, 0, 255)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = (((h % 360) + 360) % 360) / 60;
  const sat = clampNumber(s, 0, 100) / 100;
  const light = clampNumber(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs((hue % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 1) [r, g, b] = [c, x, 0];
  else if (hue < 2) [r, g, b] = [x, c, 0];
  else if (hue < 3) [r, g, b] = [0, c, x];
  else if (hue < 4) [r, g, b] = [0, x, c];
  else if (hue < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function rgbToHsb(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return [Math.round(h), Math.round(max === 0 ? 0 : (delta / max) * 100), Math.round(max * 100)];
}

function hsbToRgb(h: number, s: number, b: number): [number, number, number] {
  const hue = (((h % 360) + 360) % 360) / 60;
  const sat = clampNumber(s, 0, 100) / 100;
  const bright = clampNumber(b, 0, 100) / 100;
  const c = bright * sat;
  const x = c * (1 - Math.abs((hue % 2) - 1));
  const m = bright - c;
  let r = 0;
  let g = 0;
  let bl = 0;

  if (hue < 1) [r, g, bl] = [c, x, 0];
  else if (hue < 2) [r, g, bl] = [x, c, 0];
  else if (hue < 3) [r, g, bl] = [0, c, x];
  else if (hue < 4) [r, g, bl] = [0, x, c];
  else if (hue < 5) [r, g, bl] = [x, 0, c];
  else [r, g, bl] = [c, 0, x];

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((bl + m) * 255),
  ];
}

function readColorNumbers(value: string) {
  return value.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
}

function parseHexColor(value: string) {
  let hex = value.trim();
  if (!hex) return null;
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

function formatColorValue(hex: string, format: ColorFormat) {
  const [r, g, b] = hexToRgb(hex);
  if (format === 'rgb') return `rgb(${r}, ${g}, ${b})`;
  if (format === 'hsl') {
    const [h, s, l] = rgbToHsl(r, g, b);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  if (format === 'hsb') {
    const [h, s, br] = rgbToHsb(r, g, b);
    return `hsb(${h}, ${s}%, ${br}%)`;
  }
  return hex;
}

function parseColorValue(value: string, format: ColorFormat) {
  const hex = parseHexColor(value);
  if (hex) return hex;
  const numbers = readColorNumbers(value);
  if (numbers.length < 3) return null;
  const [a, b, c] = numbers;

  if (format === 'rgb') return rgbToHex(a, b, c);
  if (format === 'hsl') return rgbToHex(...hslToRgb(a, b, c));
  if (format === 'hsb') return rgbToHex(...hsbToRgb(a, b, c));
  return null;
}

// Speed sliders store a "tau coefficient": tau = value * 0.5, then the
// animator decays toward target with alpha = 1 - exp(-dt/tau). Visually
// "feels done" at ~3 tau (95% settled), so the *visible* duration the
// user perceives is approximately value * 1.5 seconds. We surface this
// number under each speed slider so the labelled "s" stays honest.
const SETTLE_DURATION_MULTIPLIER = 1.5;

function lerpHex(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bv = Math.round(lerp(ab, bb, t));
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(bv)}`;
}

function pickPeak(scope: PeakOverrides, base: BaseSettings): RenderValues {
  return {
    scale: scope.scale ?? base.scale,
    thickRadius: scope.thickRadius ?? base.thinRadius,
    thickenSpeed: scope.thickenSpeed ?? base.thickenSpeed,
    waveIntensity: scope.waveIntensity ?? base.waveIntensity,
    waveCount: scope.waveCount ?? base.waveCount ?? 8,
    breathAmp: scope.breathAmp ?? base.breathAmp,
    idleAmp: scope.idleAmp ?? base.idleAmp,
    color1: scope.color1 ?? base.color1,
    color2: scope.color2 ?? base.color2,
    color3: scope.color3 ?? base.color3,
  };
}

function baseRender(base: BaseSettings): RenderValues {
  return {
    scale: base.scale,
    thickRadius: base.thinRadius,
    thickenSpeed: base.thickenSpeed,
    waveIntensity: base.waveIntensity,
    waveCount: base.waveCount ?? 8,
    breathAmp: base.breathAmp,
    idleAmp: base.idleAmp,
    color1: base.color1,
    color2: base.color2,
    color3: base.color3,
  };
}

function talkingRenderForProfile(profile: LinkedProfile): RenderValues {
  return {
    ...pickPeak(profile.talking, profile.base),
    thickRadius: TALKING_GEOMETRY,
  };
}

function lerpRender(a: RenderValues, b: RenderValues, t: number): RenderValues {
  return {
    scale: lerp(a.scale, b.scale, t),
    thickRadius: lerp(a.thickRadius, b.thickRadius, t),
    thickenSpeed: lerp(a.thickenSpeed, b.thickenSpeed, t),
    waveIntensity: lerp(a.waveIntensity, b.waveIntensity, t),
    waveCount: lerp(a.waveCount, b.waveCount, t),
    breathAmp: lerp(a.breathAmp, b.breathAmp, t),
    idleAmp: lerp(a.idleAmp, b.idleAmp, t),
    color1: lerpHex(a.color1, b.color1, t),
    color2: lerpHex(a.color2, b.color2, t),
    color3: lerpHex(a.color3, b.color3, t),
  };
}

// ── Local PeakSliderRow ──────────────────────────────────────────
// Reimplemented locally rather than wrapping the shared SliderRow,
// since the shared one has hardcoded label classes and renders its
// own internal label (would produce duplicate visible labels).

interface PeakSliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  inherited: boolean;
  onChange: (v: number) => void;
  onReset?: () => void;
}

const PeakSliderRow: React.FC<PeakSliderRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  inherited,
  onChange,
  onReset,
}) => {
  const decimals = step < 0.1 ? 3 : step < 1 ? 2 : 1;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const labelClass = inherited ? 'text-gray-400' : 'text-gray-700';
  const commit = () => {
    setEditing(false);
    const n = parseFloat(draft);
    if (isNaN(n)) return;
    onChange(Math.round(Math.min(max, Math.max(min, n)) / step) * step);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm items-center gap-2">
        <span className={labelClass}>{label}</span>
        <div className="flex items-center gap-1">
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
              className="w-20 text-right text-gray-600 tabular-nums bg-gray-100 rounded px-1 outline-none text-sm"
              autoFocus
            />
          ) : (
            <span
              className="text-gray-400 tabular-nums cursor-pointer hover:text-gray-600 transition-colors"
              onClick={() => {
                setDraft(value.toFixed(decimals));
                setEditing(true);
              }}
            >
              {value.toFixed(decimals)}
              {unit}
            </span>
          )}
          {!inherited && onReset && (
            <button
              onClick={onReset}
              className="text-gray-300 hover:text-gray-500 text-xs px-1"
              title="Reset to inherited"
            >
              ↺
            </button>
          )}
        </div>
      </div>
      {unit === 's' && (
        <div className="text-[11px] text-gray-400 tabular-nums">
          ≈ {(value * SETTLE_DURATION_MULTIPLIER).toFixed(2)}s visible
        </div>
      )}
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
};

// ── Local colour rows ───────────────────────────────────────────

const COLOR_FORMATS: ColorFormat[] = ['hex', 'rgb', 'hsl', 'hsb'];

interface ColorFormatControlProps {
  value: ColorFormat;
  onChange: (format: ColorFormat) => void;
}

const ColorFormatControl: React.FC<ColorFormatControlProps> = ({ value, onChange }) => (
  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
    <span className="text-[11px] uppercase tracking-[0.16em] text-gray-400 font-semibold">
      Format
    </span>
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
      {COLOR_FORMATS.map((format) => (
        <button
          key={format}
          onClick={() => onChange(format)}
          className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase transition-colors ${
            value === format
              ? 'bg-white text-gray-700 shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {format}
        </button>
      ))}
    </div>
  </div>
);

interface EditableColorValueProps {
  value: string;
  colorFormat: ColorFormat;
  onChange: (v: string) => void;
}

const EditableColorValue: React.FC<EditableColorValueProps> = ({ value, colorFormat, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const display = formatColorValue(value, colorFormat);

  const commit = () => {
    setEditing(false);
    const next = parseColorValue(draft, colorFormat);
    if (next) onChange(next);
  };

  return editing ? (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
      className="w-32 text-right text-xs text-gray-600 tabular-nums bg-gray-100 rounded px-1 outline-none"
      autoFocus
    />
  ) : (
    <span
      className="text-xs text-gray-400 tabular-nums cursor-pointer hover:text-gray-600 transition-colors"
      onClick={() => {
        setDraft(display);
        setEditing(true);
      }}
    >
      {display}
    </span>
  );
};

interface ColorPickerButtonProps {
  value: string;
  colorFormat: ColorFormat;
  onChange: (v: string) => void;
  onColorFormatChange?: (format: ColorFormat) => void;
  title?: string;
  className?: string;
  swatchClassName?: string;
}

interface ColorChannelFieldsProps {
  value: string;
  colorFormat: ColorFormat;
  onChange: (v: string) => void;
}

function colorFieldValues(hex: string, format: ColorFormat) {
  const [r, g, b] = hexToRgb(hex);
  if (format === 'rgb') {
    return [
      { label: 'R', value: String(r) },
      { label: 'G', value: String(g) },
      { label: 'B', value: String(b) },
    ];
  }
  if (format === 'hsl') {
    const [h, s, l] = rgbToHsl(r, g, b);
    return [
      { label: 'H', value: String(h) },
      { label: 'S', value: String(s) },
      { label: 'L', value: String(l) },
    ];
  }
  if (format === 'hsb') {
    const [h, s, br] = rgbToHsb(r, g, b);
    return [
      { label: 'H', value: String(h) },
      { label: 'S', value: String(s) },
      { label: 'B', value: String(br) },
    ];
  }
  return [{ label: 'HEX', value: hex.toUpperCase() }];
}

function colorDraftsToHex(format: ColorFormat, drafts: string[]) {
  if (format === 'hex') return parseHexColor(drafts[0] ?? '');
  if (drafts.length < 3) return null;

  const numbers = drafts.map((draft) => Number(draft));
  if (numbers.some((n) => !Number.isFinite(n))) return null;
  const [a, b, c] = numbers;

  if (format === 'rgb') return rgbToHex(a, b, c);
  if (format === 'hsl') return rgbToHex(...hslToRgb(a, b, c));
  if (format === 'hsb') return rgbToHex(...hsbToRgb(a, b, c));
  return null;
}

const ColorChannelFields: React.FC<ColorChannelFieldsProps> = ({ value, colorFormat, onChange }) => {
  const fields = colorFieldValues(value, colorFormat);
  const [drafts, setDrafts] = useState<string[]>(() => fields.map((field) => field.value));

  useEffect(() => {
    setDrafts(colorFieldValues(value, colorFormat).map((field) => field.value));
  }, [value, colorFormat]);

  const commit = () => {
    const next = colorDraftsToHex(colorFormat, drafts);
    if (next) onChange(next);
    else setDrafts(colorFieldValues(value, colorFormat).map((field) => field.value));
  };

  return (
    <div className={`mt-3 grid gap-2 text-center ${colorFormat === 'hex' ? 'grid-cols-1' : 'grid-cols-3'}`}>
      {fields.map((field, i) => (
        <label key={field.label} className="block">
          <input
            type="text"
            value={drafts[i] ?? ''}
            onChange={(e) => {
              const next = [...drafts];
              next[i] = e.target.value;
              setDrafts(next);
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
                e.currentTarget.blur();
              }
              if (e.key === 'Escape') {
                setDrafts(colorFieldValues(value, colorFormat).map((item) => item.value));
                e.currentTarget.blur();
              }
            }}
            className="w-full rounded-md border border-gray-200 px-2 py-1 text-center text-sm tabular-nums text-gray-700 outline-none transition-colors focus:border-gray-400"
          />
          <span className="mt-1 block text-[10px] font-medium uppercase text-gray-400">
            {field.label}
          </span>
        </label>
      ))}
    </div>
  );
};

const ColorPickerButton: React.FC<ColorPickerButtonProps> = ({
  value,
  colorFormat,
  onChange,
  onColorFormatChange,
  title = 'Open colour picker',
  className = '',
  swatchClassName = 'h-7 w-7 rounded-md',
}) => {
  const [open, setOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState<Color>(() => parseColor(value).toFormat('hsb'));
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPickerValue(parseColor(value).toFormat('hsb'));
  }, [value]);

  // Position the popover relative to the trigger button. Renders into a
  // portal so parent overflow:auto containers (the bottom-bar tab
  // popover / expanded drawer) can't clip it.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const popoverWidth = popoverRef.current?.offsetWidth ?? 256;
      const popoverHeight = popoverRef.current?.offsetHeight ?? 360;
      const gap = 8;
      const maxLeft = window.innerWidth - popoverWidth - gap;
      const maxTop = window.innerHeight - popoverHeight - gap;
      const aboveTop = rect.top - popoverHeight - gap;
      const belowTop = rect.bottom + gap;
      const fitsAbove = aboveTop >= gap;
      const fitsBelow = belowTop + popoverHeight <= window.innerHeight - gap;
      const top = fitsAbove
        ? aboveTop
        : fitsBelow
          ? belowTop
          : Math.max(gap, Math.min(maxTop, aboveTop));
      const left = Math.max(gap, Math.min(maxLeft, rect.right - popoverWidth));
      setPosition({ left, top });
    };
    place();
    const frame = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, colorFormat]);

  // Outside-click closes the popover. Has to consider both the trigger
  // button AND the portaled popover (can't use a single ref for both).
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const commitColor = (next: Color) => {
    const hsb = next.toFormat('hsb');
    setPickerValue(hsb);
    onChange(hsb.toString('hex').toLowerCase());
  };

  const popover = open && typeof document !== 'undefined' ? (
    createPortal(
      <div
        ref={popoverRef}
        onMouseDown={(e) => e.stopPropagation()}
        className="fixed z-[100] w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
        style={{
          left: position?.left ?? -9999,
          top: position?.top ?? 8,
          visibility: position ? 'visible' : 'hidden',
        }}
      >
        {onColorFormatChange && (
          <div className="mb-3 space-y-2 border-b border-gray-100 pb-2">
            <span className="text-[10px] uppercase tracking-[0.16em] text-gray-400 font-semibold">
              Format
            </span>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-gray-100 p-0.5">
              {COLOR_FORMATS.map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => onColorFormatChange(format)}
                  className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase transition-colors ${
                    colorFormat === format
                      ? 'bg-white text-gray-700 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
        )}
        <ColorArea
          aria-label="Saturation and brightness"
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
          value={pickerValue}
          onChange={commitColor}
          className="relative h-36 w-full overflow-hidden rounded-md border border-gray-200"
        >
          <ColorThumb className="h-4 w-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.55)]" />
        </ColorArea>
        <ColorSlider
          aria-label="Hue"
          colorSpace="hsb"
          channel="hue"
          value={pickerValue}
          onChange={commitColor}
          className="mt-3"
        >
          <SliderTrack className="relative h-3 rounded-full bg-[linear-gradient(90deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]">
            <ColorThumb className="top-1/2 h-5 w-5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" />
          </SliderTrack>
        </ColorSlider>
        <ColorChannelFields value={value} colorFormat={colorFormat} onChange={onChange} />
      </div>,
      document.body,
    )
  ) : null;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`${swatchClassName} relative shrink-0 overflow-hidden border border-gray-200 shadow-sm cursor-pointer`}
        title={title}
      >
        <span className="absolute inset-0" style={{ backgroundColor: value }} />
      </button>
      {popover}
    </div>
  );
};

interface RealtimeColorRowProps {
  label: string;
  value: string;
  colorFormat: ColorFormat;
  onChange: (v: string) => void;
  onColorFormatChange?: (format: ColorFormat) => void;
}

const RealtimeColorRow: React.FC<RealtimeColorRowProps> = ({
  label,
  value,
  colorFormat,
  onChange,
  onColorFormatChange,
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600">{label}</span>
    <div className="flex items-center gap-2">
      <EditableColorValue value={value} colorFormat={colorFormat} onChange={onChange} />
      <ColorPickerButton
        value={value}
        colorFormat={colorFormat}
        onChange={onChange}
        onColorFormatChange={onColorFormatChange}
      />
    </div>
  </div>
);

interface PeakColorRowProps {
  label: string;
  value: string;
  colorFormat: ColorFormat;
  inherited: boolean;
  onChange: (v: string) => void;
  onReset?: () => void;
  onColorFormatChange?: (format: ColorFormat) => void;
}

const PeakColorRow: React.FC<PeakColorRowProps> = ({
  label,
  value,
  colorFormat,
  inherited,
  onChange,
  onReset,
  onColorFormatChange,
}) => {
  const labelClass = inherited ? 'text-sm text-gray-400' : 'text-sm text-gray-700';

  return (
    <div className="flex items-center justify-between">
      <span className={labelClass}>{label}</span>
      <div className="flex items-center gap-2">
        <EditableColorValue value={value} colorFormat={colorFormat} onChange={onChange} />
        {!inherited && onReset && (
          <button
            onClick={onReset}
            className="text-gray-300 hover:text-gray-500 text-xs px-1"
            title="Reset to inherited"
          >
            ↺
          </button>
        )}
        <ColorPickerButton
          value={value}
          colorFormat={colorFormat}
          onChange={onChange}
          onColorFormatChange={onColorFormatChange}
        />
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────

export default function RealtimeStates() {
  const [kyotoProfiles, setKyotoProfiles] = useState<SavedProfile[]>([]);
  // Coral profiles live in a parallel file. Read here so the dropdown
  // can show them with shader glyphs and the bookmark toggle works for
  // both shaders. Editing Coral controls is a separate phase — for now
  // selecting a Coral entry routes bookmark/rename to its file and
  // swaps the canvas to a Coral preview.
  const [coralProfiles, setCoralProfiles] = useState<SavedCoralProfile[]>([]);
  // Per-source loaded flags. Cascade waits until BOTH are true so that
  // a persisted key in either file can be resolved without depending
  // on which fetch resolved first. (Round-7 round-3 race fix.)
  const [kyotoLoaded, setKyotoLoaded] = useState(false);
  const [coralLoaded, setCoralLoaded] = useState(false);
  // Replay counter for Coral (forces canvas remount → morphRef resets
  // to 0 → sphere → torus intro replays).
  const [replayCounter, setReplayCounter] = useState(0);
  // Plan v8 (3D-0 step 4 + round-7 F1) — BaselineSnapshot. Inspects
  // only `settings` for dirty comparison — `name` / `pinned` /
  // `lastModified` / `sourceVariant` changes do NOT mark the editor
  // dirty.
  const [activeBaseline, setActiveBaseline] = useState<BaselineSnapshot | null>(null);

  // ── Plan v8 (3D-0) — canonical state ──────────────────────────────
  //
  // `activeOrbKey` (composite `${sourceVariant}:${id}`) is the single
  // source of truth for selection. `orbs` is the unified discriminated
  // union over both source files (kyotoProfiles + coralProfiles).
  // `activeOrb` resolves the key against orbs. `profile` is kept as a
  // derived useMemo for the Tube tab renderer's existing `profile.X`
  // bindings — falls back to KYOTO_SEED when no Kyoto orb is active.
  // No more mirror state (activeId / activeShader / activeCoralId /
  // profile-as-state) — those were removed in step 5.
  const [activeOrbKey, setActiveOrbKey] = useState<string | null>(
    () => `realtime-state:rt-kyoto`,
  );
  const [state, setState] = useState<PreviewState>('idle');
  const [autoLoop, setAutoLoop] = useState(false);
  const [audioActive, setAudioActive] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>(SILENT);
  const [render, setRender] = useState<RenderValues>(() => talkingRenderForProfile(KYOTO_SEED));
  const [activeTab, setActiveTab] = useState<ControlTab | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  // Phase 3F — two-step Save-as-new-profile dialog. saveStep gates
  // which sub-UI is visible; saveShader is the chosen target shader
  // for the new entry (defaults to the active shader on dialog open).
  const [saveStep, setSaveStep] = useState<'shader' | 'name'>('shader');
  const [saveShader, setSaveShader] = useState<'kyoto' | 'coral'>('kyoto');
  const [externalProfileNames, setExternalProfileNames] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [colorFormat, setColorFormat] = useState<ColorFormat>('hex');
  const [thinkingPaused, setThinkingPaused] = useState(false);

  // profileRef initialized to KYOTO_SEED; the per-render assignment
  // below syncs it to the derived `profile` value. Step 5 — `profile`
  // moved from useState to useMemo, so the ref initializer + sync had
  // to move below the useMemo declaration.
  const profileRef = useRef<LinkedProfile>(KYOTO_SEED);
  const stateRef = useRef(state);
  const renderRef = useRef(render);
  const pulseRef = useRef({ phase: 0, dir: 1 });
  const lastTsRef = useRef(performance.now());
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(thinkingPaused);
  pausedRef.current = thinkingPaused;
  // Talking-exit tau override (mirrors useLinkedProfileAnimator). Set
  // when the previous state was 'talking' and the new state isn't —
  // lets talking → idle settle on talking.settleSpeed instead of the
  // target's own thickenSpeed (which for Nebularr is 0 → instant snap).
  const previousStateRef = useRef<PreviewState>(state);
  const activeTauOverrideRef = useRef<number | null>(null);

  stateRef.current = state;
  renderRef.current = render;

  // ── Plan v8 (3D-0 step 1) — derived canonical projections ─────────
  //
  // `orbs` is the unified read-side projection of both source arrays
  // into the LoadedOrb discriminated union. `activeOrb` resolves the
  // canonical key against the unified list. Both are computed lazily
  // and stay null until source arrays load.
  const orbs = useMemo<LoadedOrb[]>(() => {
    const kyotoOrbs: LoadedOrb[] = kyotoProfiles.map((p) => ({
      shader: 'kyoto' as const,
      sourceVariant: 'realtime-state' as const,
      id: p.id,
      name: p.name,
      pinned: p.pinned === true,
      settings: p.settings,
      lastModified: p.lastModified,
    }));
    const coralOrbs: LoadedOrb[] = coralProfiles.map((p) => ({
      shader: 'coral' as const,
      sourceVariant: 'realtime-coral' as const,
      id: p.id,
      name: p.name,
      pinned: p.pinned === true,
      settings: p.settings,
      lastModified: p.lastModified,
    }));
    return [...kyotoOrbs, ...coralOrbs];
  }, [kyotoProfiles, coralProfiles]);

  const activeOrb = useMemo<LoadedOrb | null>(() => {
    if (!activeOrbKey) return null;
    return orbs.find((o) => compositeKey(o) === activeOrbKey) ?? null;
  }, [orbs, activeOrbKey]);

  // Plan v8 (3D-0 step 5) — `profile` is now derived from activeOrb,
  // not its own state. Tube tab renderer reads `profile.base.X` etc.;
  // this useMemo keeps those bindings working without rewriting them.
  // Falls back to KYOTO_SEED when activeOrb is null or shader is
  // 'coral' (Tube renderer is gated and won't read profile in that
  // case anyway, but the fallback prevents crashes).
  const profile = useMemo<LinkedProfile>(() => {
    return activeOrb?.shader === 'kyoto' ? activeOrb.settings : KYOTO_SEED;
  }, [activeOrb]);

  // Sync profileRef to the derived `profile` each render so the
  // animator + restartIntro callers see the latest Kyoto settings.
  profileRef.current = profile;

  const setRenderNow = (next: RenderValues) => {
    renderRef.current = next;
    setRender(next);
  };

  const restartIntro = (nextProfile = profileRef.current) => {
    lastTsRef.current = performance.now();
    pulseRef.current = { phase: 0, dir: 1 };
    setAutoLoop(false);
    setThinkingPaused(false);
    // Replay seeds talking values into render with state=idle, so the
    // settle back to base must use talking.settleSpeed (with
    // base.thickenSpeed as fallback). Arm the override directly so it
    // is in effect even when setState('idle') is a no-op (state
    // already idle). When state IS changing, lie that previousState
    // was 'talking' so the state-effect re-arms instead of clearing.
    activeTauOverrideRef.current =
      nextProfile.talking.settleSpeed ?? nextProfile.base.thickenSpeed;
    if (stateRef.current !== 'idle') {
      previousStateRef.current = 'talking';
    }
    setState('idle');
    setRenderNow(talkingRenderForProfile(nextProfile));
  };

  // ── First-load: fetch both source files in parallel ─────────
  //
  // Round-7 testing round 3: the prior approach had a race. Cascade
  // fired as soon as `orbs` became non-empty (i.e., as soon as
  // EITHER source loaded), so if the persisted key was for a Coral
  // profile but the Kyoto fetch resolved first, cascade would fail
  // to find the Coral entry, fall back to Kyoto Realtime, and lock
  // `cascadeAppliedRef`. When the Coral fetch resolved seconds
  // later, cascade was already locked — non-deterministic Kyoto
  // flips on Coral-pinned reloads.
  //
  // New architecture: the first-load handler is responsible ONLY
  // for populating the source arrays + flipping per-source loaded
  // flags. It does NOT install any default selection. The cascade
  // is the sole authority for the active selection and waits until
  // BOTH `kyotoLoaded` AND `coralLoaded` are true before resolving
  // localStorage. Until cascade fires, the editor renders the
  // useState defaults (`activeId='rt-kyoto'`, `profile=KYOTO_SEED`,
  // etc.) — that's the brief placeholder state on initial load.
  useEffect(() => {
    fetchProfiles().then(async (arr) => {
      if (arr.length === 0) {
        const seedEntry: SavedProfile = {
          id: 'rt-kyoto',
          name: REALTIME_SEED_NAME,
          settings: KYOTO_SEED,
          lastModified: Date.now(),
        };
        const next = [seedEntry];
        await persistProfiles(next);
        setKyotoProfiles(next);
      } else {
        setKyotoProfiles(arr);
      }
      setKyotoLoaded(true);
    });
    fetchCoralProfiles().then((arr) => {
      setCoralProfiles(arr);
      setCoralLoaded(true);
    });
  }, []);

  useEffect(() => {
    Promise.all(Object.values(GALLERY_API_KEYS).map(fetchProfileNames)).then((groups) => {
      setExternalProfileNames(new Set(groups.flat().map(normalizeProfileName)));
    });
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem('realtime-states-color-format');
    if (stored && COLOR_FORMATS.includes(stored as ColorFormat)) {
      setColorFormat(stored as ColorFormat);
    }
  }, []);

  // ── Plan v8 (3D-0 step 2) — localStorage persistence ──────────────
  //
  // F3 round 7: editor cascade is `persisted → Kyoto Realtime → first
  // available` until 3D-1 ships Coral controls. The live page cascade
  // (different localStorage key) is unchanged at Coral-first.
  //
  // Round-7 testing round 3 — race fix: cascade now gates on BOTH
  // `kyotoLoaded` and `coralLoaded` flags rather than on
  // `orbs.length > 0`. The old gate fired as soon as either source
  // resolved, which meant a Coral persisted key could fail to
  // resolve if Kyoto's fetch came back first (cascade locked on
  // Kyoto fallback before Coral data arrived). Now cascade only
  // fires once we know BOTH source arrays are populated — including
  // empty arrays (a load that returned [] still flips its flag, so
  // cascade can resolve a Kyoto key even when Coral has no entries
  // and vice versa).
  const cascadeAppliedRef = useRef(false);
  useEffect(() => {
    if (cascadeAppliedRef.current) return;
    if (!kyotoLoaded || !coralLoaded) return; // wait for BOTH sources
    cascadeAppliedRef.current = true;

    const persisted = window.localStorage.getItem('realtime-states-active-orb-key');
    const persistedOrb = persisted
      ? orbs.find((o) => compositeKey(o) === persisted)
      : null;
    const kyotoDefault = orbs.find(
      (o) => o.shader === 'kyoto' && o.name === REALTIME_SEED_NAME,
    );
    const fallback = persistedOrb ?? kyotoDefault ?? orbs[0];
    if (!fallback) return;

    const targetKey = compositeKey(fallback);

    // Canonical write — `profile` is derived from activeOrb so no
    // mirror dual-write needed. Just snapshot baseline + intro.
    setActiveOrbKey(targetKey);
    if (fallback.shader === 'kyoto') {
      setActiveBaseline({
        key: targetKey,
        shader: 'kyoto',
        settings: structuredClone(fallback.settings),
      });
      restartIntro(fallback.settings);
    } else {
      setActiveBaseline({
        key: targetKey,
        shader: 'coral',
        settings: structuredClone(fallback.settings),
      });
    }
  }, [kyotoLoaded, coralLoaded, orbs]);

  useEffect(() => {
    // Bug-fix (round 7 testing feedback): the persist effect must NOT
    // run before the cascade has had a chance to read localStorage.
    // Otherwise the default activeOrbKey ('realtime-state:rt-kyoto')
    // gets written on mount, blowing away the user's previous selection
    // before the cascade can pick it up. Gate on cascadeAppliedRef so
    // persist only kicks in once the cascade has finished its
    // first-resolution pass.
    if (!cascadeAppliedRef.current) return;
    if (!activeOrbKey) return;
    window.localStorage.setItem('realtime-states-active-orb-key', activeOrbKey);
  }, [activeOrbKey]);

  const chooseColorFormat = (format: ColorFormat) => {
    setColorFormat(format);
    window.localStorage.setItem('realtime-states-color-format', format);
  };

  // Audio data polling
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setAudioData(audioActive ? audioService.getAudioData() : SILENT);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [audioActive]);

  // Auto-loop
  useEffect(() => {
    if (!autoLoop) return;
    const id = setInterval(() => {
      setState((p) => STATES[(STATES.indexOf(p) + 1) % STATES.length]);
    }, 2500);
    return () => clearInterval(id);
  }, [autoLoop]);

  // Audio start: cancel auto-loop, then jump to talking once (§4.4)
  useEffect(() => {
    if (audioActive) {
      setAutoLoop(false);
      setState('talking');
    }
  }, [audioActive]);

  // Leaving thinking clears the paused flag so re-entering resumes pulsing.
  useEffect(() => {
    if (state !== 'thinking') setThinkingPaused(false);
  }, [state]);

  // Talking-exit tau override (mirrors useLinkedProfileAnimator).
  useEffect(() => {
    const prev = previousStateRef.current;
    const p = profileRef.current;
    if (prev === 'talking' && state !== 'talking') {
      activeTauOverrideRef.current =
        p.talking.settleSpeed ?? p.base.thickenSpeed;
    } else {
      activeTauOverrideRef.current = null;
    }
    previousStateRef.current = state;
  }, [state]);

  // Profile dropdown outside-click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Animator — JS owns all motion (§3)
  useEffect(() => {
    let raf = 0;
    const animate = (ts: number) => {
      const dt = Math.min((ts - lastTsRef.current) / 1000, 1 / 30);
      lastTsRef.current = ts;
      const p = profileRef.current;
      const s = stateRef.current;
      const cur = renderRef.current;

      const baseR = baseRender(p.base);
      const thinkingR = pickPeak(p.thinking, p.base);
      const talkingR = talkingRenderForProfile(p);

      let target: RenderValues;
      if (s === 'idle' || s === 'listening') {
        target = baseR;
      } else if (s === 'talking') {
        target = talkingR;
      } else {
        // Thinking pulse — clock uses effective thinking peak speed (§3.1),
        // not cur.thickenSpeed. When paused, phase doesn't advance.
        if (!pausedRef.current) {
          const pulseSpeed = 1 / Math.max(0.05, thinkingR.thickenSpeed);
          pulseRef.current.phase += dt * pulseSpeed * pulseRef.current.dir;
          if (pulseRef.current.phase >= 1) {
            pulseRef.current.phase = 1;
            pulseRef.current.dir = -1;
          } else if (pulseRef.current.phase <= 0) {
            pulseRef.current.phase = 0;
            pulseRef.current.dir = 1;
          }
        }
        const t = pulseRef.current.phase;
        const eased = t * t * (3 - 2 * t);
        target = lerpRender(baseR, thinkingR, eased);
      }

      // Reset pulse phase whenever state isn't thinking, so re-entering
      // thinking starts cleanly from the rest side. Also clears any
      // paused state so re-entering doesn't start frozen.
      if (s !== 'thinking') {
        pulseRef.current.phase = 0;
        pulseRef.current.dir = 1;
      }

      // Override (when armed) wins over target.thickenSpeed so the
      // talking → idle settle uses talking.settleSpeed instead of
      // base.thickenSpeed (which on Nebularr is 0 → instant snap).
      const tauSpeed = activeTauOverrideRef.current ?? target.thickenSpeed;
      const tau = Math.max(0.05, tauSpeed) * 0.5;
      const alpha = 1 - Math.exp(-dt / tau);
      const next = lerpRender(cur, target, alpha);

      setRender(next);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Cleanup audio on unmount
  useEffect(() => () => audioService.stop(), []);

  // ── Mutators ────────────────────────────────────────────────
  // Plan v8 (3D-0 step 4 + round-7 F4) — slider write paths dual-write
  // to BOTH the Kyoto profile mirror AND the kyotoProfiles source
  // array. Without the source-array write, isDirty's settings
  // comparison runs against stale activeOrb.settings (still equal to
  // baseline) so slider edits would not register as dirty. Spread
  // updates only — no nested in-place mutation.
  const updateActiveKyotoSettings = (mutate: (s: LinkedProfile) => LinkedProfile) => {
    if (activeOrb?.shader !== 'kyoto') return;
    // Step 5 — profile is derived; only the source array needs an
    // immutable update. profile useMemo will recompute from the new
    // kyotoProfiles[i].settings on the next render.
    setKyotoProfiles((arr) =>
      arr.map((pr) => (pr.id === activeOrb.id ? { ...pr, settings: mutate(pr.settings) } : pr)),
    );
  };

  const setBase = (patch: Partial<BaseSettings>) =>
    updateActiveKyotoSettings((p) => ({ ...p, base: { ...p.base, ...patch } }));

  const setPeak = (scope: PeakScope, patch: Partial<PeakOverrides>) =>
    updateActiveKyotoSettings((p) => ({ ...p, [scope]: { ...p[scope], ...patch } }));

  const clearPeak = <K extends keyof PeakOverrides>(scope: PeakScope, field: K) =>
    updateActiveKyotoSettings((p) => {
      const next = { ...p[scope] };
      delete next[field];
      return { ...p, [scope]: next };
    });

  // Effective getters
  const peakEff = (scope: PeakScope, field: keyof PeakOverrides & keyof BaseSettings): number | string => {
    const ovr = profile[scope][field];
    if (ovr !== undefined) return ovr as number | string;
    return profile.base[field] as number | string;
  };
  const peakHas = (scope: PeakScope, field: keyof PeakOverrides) =>
    profile[scope][field] !== undefined;

  // ── Plan v8 Phase 3D-1 — Coral mutators + peak helpers ────────────
  //
  // Parallel set of write helpers for the Coral D shader. Coral has a
  // single peak slot (`talking`) with its own narrow shape — there's
  // no `thinking` peak (Coral's idle/listening/thinking all render
  // identically). Helpers operate on `coralProfiles[i].settings`
  // immutably (round-7 F4 rule) so dirty detection works against
  // canonical settings, not a stale mirror.
  type CoralBase = CoralRealtimeSettings['base'];
  type CoralTalking = NonNullable<CoralRealtimeSettings['talking']>;

  const updateActiveCoralSettings = (
    mutate: (s: CoralRealtimeSettings) => CoralRealtimeSettings,
  ) => {
    if (activeOrb?.shader !== 'coral') return;
    setCoralProfiles((arr) =>
      arr.map((pr) => (pr.id === activeOrb.id ? { ...pr, settings: mutate(pr.settings) } : pr)),
    );
  };

  const coralSetBase = (patch: Partial<CoralBase>) =>
    updateActiveCoralSettings((s) => ({ ...s, base: { ...s.base, ...patch } }));

  const coralSetPeak = (patch: Partial<CoralTalking>) =>
    updateActiveCoralSettings((s) => ({
      ...s,
      talking: { ...(s.talking ?? {}), ...patch },
    }));

  const coralClearPeak = <K extends keyof CoralTalking>(field: K) =>
    updateActiveCoralSettings((s) => {
      const next: CoralTalking = { ...(s.talking ?? {}) };
      delete next[field];
      return { ...s, talking: next };
    });

  const coralPeakHas = <K extends keyof CoralTalking>(field: K) =>
    activeCoralSettings?.talking?.[field] !== undefined;

  const coralPeakEff = <K extends keyof CoralTalking>(
    field: K,
  ): CoralTalking[K] | CoralBase[K extends keyof CoralBase ? K : never] | undefined => {
    if (!activeCoralSettings) return undefined;
    const ovr = activeCoralSettings.talking?.[field];
    if (ovr !== undefined) return ovr;
    // All Coral talking-peak fields exist on base; safe lookup.
    return (activeCoralSettings.base as Record<string, unknown>)[field as string] as CoralBase[
      K extends keyof CoralBase ? K : never
    ];
  };

  // ── Profile actions ─────────────────────────────────────────
  // Plan v8 round-7 F1 — dirty comparator inspects ONLY settings.
  // Returns false on key/shader mismatch (during cross-shader switch
  // in flight) rather than throwing. Bookmark/rename/Save's
  // lastModified bump cannot mark the editor dirty by construction
  // because they don't touch settings.
  const isDirty = (() => {
    if (!activeOrb || !activeBaseline) return false;
    if (compositeKey(activeOrb) !== activeBaseline.key) return false;
    if (activeOrb.shader !== activeBaseline.shader) return false;
    return JSON.stringify(activeOrb.settings) !== JSON.stringify(activeBaseline.settings);
  })();
  // Plan v8 (3D-0 step 3) — read from canonical `activeOrb`. Mirror
  // reads like `kyotoProfiles.find((p) => p.id === activeId)` are no
  // longer needed for these fields; activeOrb already carries name +
  // pinned. Settings-shaped reads still use mirrors below until step 3
  // gets to them.
  const activeName =
    activeOrb?.name ??
    (activeOrb?.shader === 'coral' ? 'Coral Realtime' : REALTIME_SEED_NAME);
  const activePinned = activeOrb?.pinned === true;
  const toggleActivePinned = () => {
    if (!activeOrb) return;
    if (activeOrb.shader === 'coral') {
      togglePinnedCoral(activeOrb.id);
    } else {
      togglePinned(activeOrb.id);
    }
  };

  const profileNameExists = (name: string, exceptId?: string) => {
    const normalized = normalizeProfileName(name);
    if (!normalized) return false;
    if (externalProfileNames.has(normalized)) return true;
    if (kyotoProfiles.some((p) => p.id !== exceptId && normalizeProfileName(p.name) === normalized)) {
      return true;
    }
    // Plan v8 (F3): Coral entries must collide with Tube + gallery
    // names AND with each other. Without this check, two Coral
    // entries could be renamed to the same name. id space is shared
    // across Coral + Tube source arrays in practice (uuid-based), so
    // exceptId disambiguation is safe.
    return coralProfiles.some(
      (p) => p.id !== exceptId && normalizeProfileName(p.name) === normalized,
    );
  };

  const pickRealtimeUnusedName = () => {
    // Plan v8 round-6 (F2): suggestion pool must mirror profileNameExists
    // — gallery names + Kyoto profiles + Coral profiles. Otherwise the
    // helper can hand back a name that already exists in coralProfiles,
    // and the rename-validation flow flips it red the moment the user
    // accepts the suggestion.
    const used = new Set([
      ...Array.from(externalProfileNames),
      ...kyotoProfiles.map((p) => normalizeProfileName(p.name)),
      ...coralProfiles.map((p) => normalizeProfileName(p.name)),
    ]);
    const available = CURATED_NAMES.filter((name) => !used.has(normalizeProfileName(name)));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
    const base = 'Realtime Profile';
    let i = kyotoProfiles.length + 1;
    while (used.has(normalizeProfileName(`${base} ${i}`))) i += 1;
    return `${base} ${i}`;
  };

  const saveNameInvalid = !saveName.trim() || profileNameExists(saveName);

  const selectProfile = (id: string) => {
    const found = kyotoProfiles.find((p) => p.id === id);
    if (!found) return;
    // Step 5 — single canonical write. activeOrb / profile / etc. all
    // derive from activeOrbKey + source arrays. BaselineSnapshot
    // captured via structuredClone (round-7 F1 + F4).
    setActiveOrbKey(`realtime-state:${id}`);
    setActiveBaseline({
      key: `realtime-state:${id}`,
      shader: 'kyoto',
      settings: structuredClone(found.settings),
    });
    restartIntro(found.settings);
    setShowProfileDropdown(false);
  };

  const selectCoralProfile = (id: string) => {
    const found = coralProfiles.find((p) => p.id === id);
    if (!found) return;
    setActiveOrbKey(`realtime-coral:${id}`);
    setActiveBaseline({
      key: `realtime-coral:${id}`,
      shader: 'coral',
      settings: structuredClone(found.settings),
    });
    // Plan v8 (F1): same-shader Coral switch is prop-only — no remount,
    // no intro replay. The new profile's settings flow into the
    // already-mounted CoralStoneMorph and the orb smoothly transitions
    // to the new values. Replay button is the only same-shader remount
    // path. Cross-shader switching (Coral ↔ Kyoto) still remounts
    // naturally because the canvas branches between two component
    // types.
    setShowProfileDropdown(false);
  };

  // Plan v8 (3D-0 step 3) — derive from canonical activeOrb.
  const activeCoralSettings: CoralRealtimeSettings | null =
    activeOrb?.shader === 'coral' ? activeOrb.settings : null;

  // Phase 4B — Coral thinking-pulse RAF, sourced from the same hook
  // that CoralRealtimeBlob uses on the live page. Returns a number
  // while previewState === 'thinking', null otherwise. The editor
  // canvas's Coral branch overrides its static torusRadius prop with
  // this pulse value during thinking. Hook is gated on `isThinking`
  // internally — when activeCoralSettings is null (Tube active), the
  // RAF doesn't run (no allocation, no work).
  const coralPulse = useCoralThinkingPulse({
    isThinking: activeOrb?.shader === 'coral' && state === 'thinking',
    thinRadius: activeCoralSettings?.base.torusRadius ?? 0.275,
    thickRadius: activeCoralSettings?.base.thickRadius,
    pulseSpeed: activeCoralSettings?.base.pulseSpeed,
  });

  // Coral state-prop easing — same pattern as the live page. Targets
  // are computed from activeCoralSettings + state; eased values flow
  // into the canvas's Coral branch. When Tube is active, the targets
  // are coral-fallback values and the eased values are unused — RAFs
  // still run but the work is negligible (one frame per render until
  // they settle).
  const coralIsTalking = state === 'talking';
  const coralTargetScale = coralIsTalking
    ? (activeCoralSettings?.talking?.scale ?? activeCoralSettings?.base.scale ?? CORAL_FALLBACK_PROFILE.base.scale)
    : (activeCoralSettings?.base.scale ?? CORAL_FALLBACK_PROFILE.base.scale);
  const coralTargetWave = coralIsTalking
    ? (activeCoralSettings?.talking?.waveIntensity ?? activeCoralSettings?.base.waveIntensity ?? CORAL_FALLBACK_PROFILE.base.waveIntensity)
    : (activeCoralSettings?.base.waveIntensity ?? CORAL_FALLBACK_PROFILE.base.waveIntensity);
  const coralTargetColor3 = coralIsTalking
    ? (activeCoralSettings?.talking?.color3 ?? activeCoralSettings?.base.color3 ?? CORAL_FALLBACK_PROFILE.base.color3)
    : (activeCoralSettings?.base.color3 ?? CORAL_FALLBACK_PROFILE.base.color3);
  // morphSpeed is direction-aware — mirrors the live page's
  // activeMorphSpeed pattern. Track previous editor state so that
  // when the user clicks the Idle pill from the Talking pill, the
  // morph back to torus uses talking.settleSpeed if set (parity with
  // Tube's settle override pattern).
  const prevCoralStateRef = useRef(state);
  const [coralActiveMorphSpeed, setCoralActiveMorphSpeed] = useState<number>(
    () => activeCoralSettings?.base.morphSpeed ?? CORAL_FALLBACK_PROFILE.base.morphSpeed,
  );
  useEffect(() => {
    if (activeOrb?.shader !== 'coral') {
      // Tube active — morphSpeed isn't used. Don't update.
      prevCoralStateRef.current = state;
      return;
    }
    const wasTalking = prevCoralStateRef.current === 'talking';
    const isCurrentlyTalking = state === 'talking';
    const baseSpeed = activeCoralSettings?.base.morphSpeed ?? CORAL_FALLBACK_PROFILE.base.morphSpeed;
    if (isCurrentlyTalking) {
      setCoralActiveMorphSpeed(activeCoralSettings?.talking?.morphSpeed ?? baseSpeed);
    } else if (wasTalking) {
      setCoralActiveMorphSpeed(activeCoralSettings?.talking?.settleSpeed ?? baseSpeed);
    }
    prevCoralStateRef.current = state;
  }, [
    state,
    activeOrb?.shader,
    activeCoralSettings?.talking?.morphSpeed,
    activeCoralSettings?.talking?.settleSpeed,
    activeCoralSettings?.base.morphSpeed,
  ]);
  const coralTransitionDuration = coralActiveMorphSpeed;

  // startValue mounts the eased values at the TALKING profile's
  // values so the editor's Coral intro shows the same talking →
  // base ease as the live page. resetKey re-runs the intro on:
  //   (a) shader change (kyoto → coral or fresh mount), and
  //   (b) Replay button click (replayCounter bump).
  // Same-shader profile switch (Coral A → Coral B) does NOT change
  // resetKey — eases smoothly from current to new target instead
  // of replaying the intro, matching the round-7 F1 contract.
  const coralStartScale = activeCoralSettings?.talking?.scale ?? activeCoralSettings?.base.scale ?? CORAL_FALLBACK_PROFILE.base.scale;
  const coralStartWave = activeCoralSettings?.talking?.waveIntensity ?? activeCoralSettings?.base.waveIntensity ?? CORAL_FALLBACK_PROFILE.base.waveIntensity;
  const coralStartColor3 = activeCoralSettings?.talking?.color3 ?? activeCoralSettings?.base.color3 ?? CORAL_FALLBACK_PROFILE.base.color3;
  const coralResetKey = `${activeOrb?.shader ?? 'none'}-${replayCounter}`;

  const coralEasedScale = useEasedNumber(coralTargetScale, coralTransitionDuration, {
    startValue: coralStartScale,
    resetKey: coralResetKey,
  });
  const coralEasedWave = useEasedNumber(coralTargetWave, coralTransitionDuration, {
    startValue: coralStartWave,
    resetKey: coralResetKey,
  });
  const coralEasedColor3 = useEasedColor(coralTargetColor3, coralTransitionDuration, {
    startValue: coralStartColor3,
    resetKey: coralResetKey,
  });

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name || profileNameExists(name)) return;

    // Phase 3F — route by saveShader, not by activeOrb.shader. Same-
    // shader new = clone active settings; cross-shader new = start
    // from the target shader's fallback default.
    const sameShader = saveShader === activeOrb?.shader;

    if (saveShader === 'kyoto') {
      const settings: LinkedProfile = sameShader
        ? structuredClone(profile)
        : structuredClone(KYOTO_SEED);
      const entry: SavedProfile = {
        id: `rt-${crypto.randomUUID()}`,
        name,
        pinned: false,
        settings,
        lastModified: Date.now(),
      };
      const next = [...kyotoProfiles, entry];
      setKyotoProfiles(next);
      setActiveOrbKey(`realtime-state:${entry.id}`);
      setActiveBaseline({
        key: `realtime-state:${entry.id}`,
        shader: 'kyoto',
        settings: structuredClone(settings),
      });
      restartIntro(settings);
      closeSaveDialog();
      await persistProfiles(next);
      return;
    }

    // saveShader === 'coral'
    const coralSettings: CoralRealtimeSettings = sameShader
      ? structuredClone(activeCoralSettings ?? CORAL_FALLBACK_PROFILE)
      : structuredClone(CORAL_FALLBACK_PROFILE);
    const coralEntry: SavedCoralProfile = {
      id: `rt-coral-${crypto.randomUUID()}`,
      name,
      pinned: false,
      settings: coralSettings,
      lastModified: Date.now(),
    };
    const nextCoral = [...coralProfiles, coralEntry];
    setCoralProfiles(nextCoral);
    setActiveOrbKey(`realtime-coral:${coralEntry.id}`);
    setActiveBaseline({
      key: `realtime-coral:${coralEntry.id}`,
      shader: 'coral',
      settings: structuredClone(coralSettings),
    });
    closeSaveDialog();
    await persistCoralProfiles(nextCoral);
  };

  const closeSaveDialog = () => {
    setShowSaveDialog(false);
    setSaveName('');
    setSaveStep('shader');
  };

  const beginRename = (entry: SavedProfile) => {
    setRenamingId(entry.id);
    setRenameDraft(entry.name);
  };

  const togglePinned = async (id: string) => {
    // Flip the `pinned` flag on the named Tube/Kyoto profile and
    // persist. Live page picks up the change on next refresh.
    const next = kyotoProfiles.map((pr) =>
      pr.id === id ? { ...pr, pinned: !pr.pinned, lastModified: Date.now() } : pr,
    );
    setKyotoProfiles(next);
    await persistProfiles(next);
  };

  const togglePinnedCoral = async (id: string) => {
    // Same as togglePinned but routes to the Coral profile file.
    const next = coralProfiles.map((pr) =>
      pr.id === id ? { ...pr, pinned: !pr.pinned, lastModified: Date.now() } : pr,
    );
    setCoralProfiles(next);
    await persistCoralProfiles(next);
  };

  const commitRenameCoral = async (id: string, draft: string) => {
    const name = draft.trim();
    if (!name || profileNameExists(name, id)) return;
    const next = coralProfiles.map((pr) =>
      pr.id === id ? { ...pr, name, lastModified: Date.now() } : pr,
    );
    setCoralProfiles(next);
    cancelRename();
    await persistCoralProfiles(next);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft('');
  };

  const commitRename = async (id: string, draft: string) => {
    const name = draft.trim();
    if (!name || profileNameExists(name, id)) return;
    const next = kyotoProfiles.map((pr) =>
      pr.id === id ? { ...pr, name, lastModified: Date.now() } : pr
    );
    setKyotoProfiles(next);
    cancelRename();
    await persistProfiles(next);
  };

  const handleUpdate = async () => {
    if (!isDirty || !activeOrb) return;
    // Phase 3E — route by activeOrb.shader. Kyoto persists to the
    // realtime-state file; Coral persists to realtime-coral. Same
    // BaselineSnapshot re-snapshot pattern in both branches.
    if (activeOrb.shader === 'kyoto') {
      const next = kyotoProfiles.map((pr) =>
        pr.id === activeOrb.id
          ? { ...pr, settings: profile, lastModified: Date.now() }
          : pr,
      );
      setKyotoProfiles(next);
      setActiveBaseline({
        key: `realtime-state:${activeOrb.id}`,
        shader: 'kyoto',
        settings: structuredClone(profile),
      });
      await persistProfiles(next);
      return;
    }
    // Coral path — slider edits already wrote through to coralProfiles
    // via updateActiveCoralSettings, so the source array is the truth.
    // Just re-snapshot baseline + persist.
    if (activeOrb.shader === 'coral') {
      const currentCoralEntry = coralProfiles.find((p) => p.id === activeOrb.id);
      if (!currentCoralEntry) return;
      const next = coralProfiles.map((pr) =>
        pr.id === activeOrb.id ? { ...pr, lastModified: Date.now() } : pr,
      );
      setCoralProfiles(next);
      setActiveBaseline({
        key: `realtime-coral:${activeOrb.id}`,
        shader: 'coral',
        settings: structuredClone(currentCoralEntry.settings),
      });
      await persistCoralProfiles(next);
    }
  };

  // ── Tab definitions / rendering ─────────────────────────────
  const tabs: { key: ControlTab; label: string }[] = [
    { key: 'size', label: 'Size' },
    { key: 'thickness', label: 'Thickness' },
    { key: 'motion', label: 'Motion' },
    { key: 'colours', label: 'Colours' },
  ];

  const renderTabControls = (tab: ControlTab) => {
    const isPeakState = state === 'thinking' || state === 'talking';
    const peakScope: PeakScope = state === 'thinking' ? 'thinking' : 'talking';

    const restSuffix = isPeakState ? ' (Rest)' : '';
    const restPx = approxPixelDia(profile.base.scale, 328);

    switch (tab) {
      case 'size': {
        const restRow = (
          <SliderRow
            label={`Scale${restSuffix} (~${restPx}px)`}
            value={profile.base.scale}
            min={0.05}
            max={1.5}
            step={0.01}
            unit="x"
            onChange={(v) => setBase({ scale: v })}
          />
        );
        const waveRows = (
          <div className="pt-3 mt-3 border-t border-gray-100 space-y-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-gray-400 font-semibold">
              Wave Count
            </div>
            <SliderRow
              label={`Wave Count${restSuffix}`}
              value={profile.base.waveCount ?? 8}
              min={1}
              max={24}
              step={1}
              onChange={(v) => setBase({ waveCount: v })}
            />
          </div>
        );
        if (!isPeakState) {
          return (
            <div className="space-y-3">
              {restRow}
              {waveRows}
            </div>
          );
        }
        const inherited = !peakHas(peakScope, 'scale');
        const eff = peakEff(peakScope, 'scale') as number;
        const wcInh = !peakHas(peakScope, 'waveCount');
        const wcEff = peakEff(peakScope, 'waveCount') as number;
        return (
          <div className="space-y-3">
            {restRow}
            <PeakSliderRow
              label={`Scale (Peak) (~${approxPixelDia(eff, 328)}px)`}
              value={eff}
              min={0.05}
              max={1.5}
              step={0.01}
              unit="x"
              inherited={inherited}
              onChange={(v) => setPeak(peakScope, { scale: v })}
              onReset={inherited ? undefined : () => clearPeak(peakScope, 'scale')}
            />
            {waveRows}
            {peakScope === 'talking' && (
              <PeakSliderRow
                label="Wave Count (Peak)"
                value={wcEff}
                min={1}
                max={24}
                step={1}
                inherited={wcInh}
                onChange={(v) => setPeak('talking', { waveCount: v })}
                onReset={wcInh ? undefined : () => clearPeak('talking', 'waveCount')}
              />
            )}
          </div>
        );
      }

      case 'thickness': {
        const thinRest = (
          <SliderRow
            label={`Tube Thickness${restSuffix}`}
            value={profile.base.thinRadius}
            min={0.05}
            max={0.3}
            step={0.005}
            onChange={(v) => setBase({ thinRadius: v })}
          />
        );
        // idle/listening: just the shared base.thickenSpeed under
        // a directional label. This is the "speed of returning to
        // idle from any state" knob, shared across the experience.
        if (state === 'idle' || state === 'listening') {
          return (
            <div className="space-y-3">
              {thinRest}
              <div className="space-y-1">
                <SliderRow
                  label="Settle Speed (→ idle)"
                  value={profile.base.thickenSpeed}
                  min={0}
                  max={4.0}
                  step={0.02}
                  unit="s"
                  onChange={(v) => setBase({ thickenSpeed: v })}
                />
                <div className="text-[11px] text-gray-400 tabular-nums">
                  ≈ {(profile.base.thickenSpeed * SETTLE_DURATION_MULTIPLIER).toFixed(2)}s visible
                </div>
              </div>
            </div>
          );
        }

        if (state === 'thinking') {
          // Thinking gets its own Entry Speed (decoupled from the
          // pulse cycle) and its own Pulse Speed.
          // Settle Speed is intentionally NOT shown here — it lives
          // on idle/listening as the shared base.
          const tInherited = !peakHas('thinking', 'thickRadius');
          const tEff = (profile.thinking.thickRadius ?? profile.base.thinRadius) as number;
          const entryInherited = !peakHas('thinking', 'entrySpeed');
          const entryEff = (profile.thinking.entrySpeed ?? profile.base.thickenSpeed) as number;
          const pulseInherited = !peakHas('thinking', 'thickenSpeed');
          const pulseEff = (profile.thinking.thickenSpeed ?? profile.base.thickenSpeed) as number;
          return (
            <div className="space-y-3">
              {thinRest}
              <PeakSliderRow
                label="Tube Thickness (Peak)"
                value={tEff}
                min={0.15}
                max={0.45}
                step={0.005}
                inherited={tInherited}
                onChange={(v) => setPeak('thinking', { thickRadius: v })}
                onReset={tInherited ? undefined : () => clearPeak('thinking', 'thickRadius')}
              />
              <PeakSliderRow
                label="Entry Speed (→ thinking)"
                value={entryEff}
                min={0}
                max={4.0}
                step={0.02}
                unit="s"
                inherited={entryInherited}
                onChange={(v) => setPeak('thinking', { entrySpeed: v })}
                onReset={entryInherited ? undefined : () => clearPeak('thinking', 'entrySpeed')}
              />
              <PeakSliderRow
                label="Pulse Speed (thin↔thick)"
                value={pulseEff}
                min={0}
                max={4.0}
                step={0.02}
                unit="s"
                inherited={pulseInherited}
                onChange={(v) => setPeak('thinking', { thickenSpeed: v })}
                onReset={pulseInherited ? undefined : () => clearPeak('thinking', 'thickenSpeed')}
              />
            </div>
          );
        }

        // talking: italic note in place of Peak Radius row, then
        // talking-specific Settle (exit) and Morph (entry) sliders.
        // Both override-able; both inherit base.thickenSpeed when
        // unset (greyed label, no reset arrow).
        const settleInherited = !peakHas('talking', 'settleSpeed');
        const settleEff = (profile.talking.settleSpeed ?? profile.base.thickenSpeed) as number;
        const morphInherited = !peakHas('talking', 'thickenSpeed');
        const morphEff = (profile.talking.thickenSpeed ?? profile.base.thickenSpeed) as number;
        return (
          <div className="space-y-3">
            {thinRest}
            <div className="text-xs text-gray-400 italic">
              Geometry pinned to sphere — no peak slider.
            </div>
            <PeakSliderRow
              label="Settle Speed (talking → idle)"
              value={settleEff}
              min={0}
              max={4.0}
              step={0.02}
              unit="s"
              inherited={settleInherited}
              onChange={(v) => setPeak('talking', { settleSpeed: v })}
              onReset={settleInherited ? undefined : () => clearPeak('talking', 'settleSpeed')}
            />
            <PeakSliderRow
              label="Morph Speed (→ talking)"
              value={morphEff}
              min={0}
              max={4.0}
              step={0.02}
              unit="s"
              inherited={morphInherited}
              onChange={(v) => setPeak('talking', { thickenSpeed: v })}
              onReset={morphInherited ? undefined : () => clearPeak('talking', 'thickenSpeed')}
            />
          </div>
        );
      }

      case 'motion': {
        const restRows = (
          <>
            <SliderRow
              label={`Wave Intensity${restSuffix}`}
              value={profile.base.waveIntensity}
              min={0.02}
              max={0.5}
              step={0.01}
              onChange={(v) => setBase({ waveIntensity: v })}
            />
            <SliderRow
              label={`Idle Intensity${restSuffix}`}
              value={profile.base.idleAmp * 100}
              min={0}
              max={20}
              step={0.5}
              unit="%"
              onChange={(v) => setBase({ idleAmp: v / 100 })}
            />
            <SliderRow
              label={`Breath Amplitude${restSuffix}`}
              value={profile.base.breathAmp}
              min={0}
              max={0.1}
              step={0.005}
              onChange={(v) => setBase({ breathAmp: v })}
            />
          </>
        );
        if (!isPeakState) return <div className="space-y-3">{restRows}</div>;
        const wInh = !peakHas(peakScope, 'waveIntensity');
        const iInh = !peakHas(peakScope, 'idleAmp');
        const bInh = !peakHas(peakScope, 'breathAmp');
        const wEff = peakEff(peakScope, 'waveIntensity') as number;
        const iEff = peakEff(peakScope, 'idleAmp') as number;
        const bEff = peakEff(peakScope, 'breathAmp') as number;
        return (
          <div className="space-y-3">
            {restRows}
            <PeakSliderRow
              label="Wave Intensity (Peak)"
              value={wEff}
              min={0.02}
              max={0.5}
              step={0.01}
              inherited={wInh}
              onChange={(v) => setPeak(peakScope, { waveIntensity: v })}
              onReset={wInh ? undefined : () => clearPeak(peakScope, 'waveIntensity')}
            />
            <PeakSliderRow
              label="Idle Intensity (Peak)"
              value={iEff * 100}
              min={0}
              max={20}
              step={0.5}
              unit="%"
              inherited={iInh}
              onChange={(v) => setPeak(peakScope, { idleAmp: v / 100 })}
              onReset={iInh ? undefined : () => clearPeak(peakScope, 'idleAmp')}
            />
            <PeakSliderRow
              label="Breath Amplitude (Peak)"
              value={bEff}
              min={0}
              max={0.1}
              step={0.005}
              inherited={bInh}
              onChange={(v) => setPeak(peakScope, { breathAmp: v })}
              onReset={bInh ? undefined : () => clearPeak(peakScope, 'breathAmp')}
            />
          </div>
        );
      }

      case 'colours': {
        const restRows = (
          <>
            <ColorFormatControl value={colorFormat} onChange={chooseColorFormat} />
            <RealtimeColorRow
              label={`Highlight${restSuffix}`}
              value={profile.base.color1}
              colorFormat={colorFormat}
              onChange={(v) => setBase({ color1: v })}
              onColorFormatChange={chooseColorFormat}
            />
            <RealtimeColorRow
              label={`Mid Tone${restSuffix}`}
              value={profile.base.color2}
              colorFormat={colorFormat}
              onChange={(v) => setBase({ color2: v })}
              onColorFormatChange={chooseColorFormat}
            />
            <RealtimeColorRow
              label={`Edge${restSuffix}`}
              value={profile.base.color3}
              colorFormat={colorFormat}
              onChange={(v) => setBase({ color3: v })}
              onColorFormatChange={chooseColorFormat}
            />
            <RealtimeColorRow
              label={`Background${restSuffix}`}
              value={profile.base.bgColor}
              colorFormat={colorFormat}
              onChange={(v) => setBase({ bgColor: v })}
              onColorFormatChange={chooseColorFormat}
            />
          </>
        );
        if (!isPeakState) return <div className="space-y-3">{restRows}</div>;
        const c1Inh = !peakHas(peakScope, 'color1');
        const c2Inh = !peakHas(peakScope, 'color2');
        const c3Inh = !peakHas(peakScope, 'color3');
        const c1 = (peakEff(peakScope, 'color1') as string);
        const c2 = (peakEff(peakScope, 'color2') as string);
        const c3 = (peakEff(peakScope, 'color3') as string);
        return (
          <div className="space-y-3">
            {restRows}
            <PeakColorRow
              label="Highlight (Peak)"
              value={c1}
              colorFormat={colorFormat}
              inherited={c1Inh}
              onChange={(v) => setPeak(peakScope, { color1: v })}
              onReset={c1Inh ? undefined : () => clearPeak(peakScope, 'color1')}
              onColorFormatChange={chooseColorFormat}
            />
            <PeakColorRow
              label="Mid Tone (Peak)"
              value={c2}
              colorFormat={colorFormat}
              inherited={c2Inh}
              onChange={(v) => setPeak(peakScope, { color2: v })}
              onReset={c2Inh ? undefined : () => clearPeak(peakScope, 'color2')}
              onColorFormatChange={chooseColorFormat}
            />
            <PeakColorRow
              label="Edge (Peak)"
              value={c3}
              colorFormat={colorFormat}
              inherited={c3Inh}
              onChange={(v) => setPeak(peakScope, { color3: v })}
              onReset={c3Inh ? undefined : () => clearPeak(peakScope, 'color3')}
              onColorFormatChange={chooseColorFormat}
            />
          </div>
        );
      }
    }
  };

  // ── Plan v8 Phase 3D-1 — Coral tab renderer ───────────────────────
  //
  // Parallel to renderTabControls but binds to Coral's settings shape.
  // Slider ranges per the explicit Coral table in the plan. Coral
  // speed sliders show LITERAL seconds with no "≈ visible" hint
  // (round-7 F9): morphSpeed is fed directly to CoralStoneMorph as
  // delta-divisor seconds, no tau coefficient. Coral has only the
  // talking peak slot — thinking/listening render as idle.
  const renderCoralTabControls = (tab: ControlTab) => {
    if (!activeCoralSettings) {
      return (
        <div className="text-xs text-gray-400 italic">
          No Coral profile selected.
        </div>
      );
    }
    const baseS = activeCoralSettings.base;
    const isTalking = state === 'talking';
    const isThinking = state === 'thinking';
    const restSuffix = isTalking ? ' (Rest)' : '';

    switch (tab) {
      case 'size': {
        const restRow = (
          <SliderRow
            label={`Scale${restSuffix}`}
            value={baseS.scale}
            min={0.05}
            max={1.5}
            step={0.01}
            unit="x"
            onChange={(v) => coralSetBase({ scale: v })}
          />
        );
        const torusRow = (
          <SliderRow
            label="Torus Radius"
            value={baseS.torusRadius}
            min={0.05}
            max={0.45}
            step={0.005}
            onChange={(v) => coralSetBase({ torusRadius: v })}
          />
        );
        if (!isTalking) {
          return (
            <div className="space-y-3">
              {restRow}
              {torusRow}
            </div>
          );
        }
        const sInh = !coralPeakHas('scale');
        const sEff = (coralPeakEff('scale') as number) ?? baseS.scale;
        // Torus Radius is hidden on Talking — the orb is a sphere there
        // so editing it produces no visible change. Editable from the
        // other three pills where the orb is a torus.
        return (
          <div className="space-y-3">
            {restRow}
            <PeakSliderRow
              label="Scale (Peak)"
              value={sEff}
              min={0.05}
              max={1.5}
              step={0.01}
              unit="x"
              inherited={sInh}
              onChange={(v) => coralSetPeak({ scale: v })}
              onReset={sInh ? undefined : () => coralClearPeak('scale')}
            />
          </div>
        );
      }

      case 'thickness': {
        if (isThinking) {
          // Phase 4C — Coral thinking-pulse controls. Both fields are
          // optional in the schema; the value display falls back to
          // CORAL_PULSE_DEFAULTS so legacy entries lacking the fields
          // still show a sensible slider position. Edits go through
          // coralSetBase (already immutable per round-7 F4).
          const thickEff = baseS.thickRadius ?? CORAL_PULSE_DEFAULTS.thickRadius;
          const pulseEff = baseS.pulseSpeed ?? CORAL_PULSE_DEFAULTS.pulseSpeed;
          return (
            <div className="space-y-3">
              <SliderRow
                label="Thick Radius"
                value={thickEff}
                min={0.05}
                max={0.6}
                step={0.005}
                onChange={(v) => coralSetBase({ thickRadius: v })}
              />
              <SliderRow
                label="Pulse Speed (thin → thick)"
                value={pulseEff}
                min={0.05}
                max={2.0}
                step={0.02}
                unit="s"
                onChange={(v) => coralSetBase({ pulseSpeed: v })}
              />
              {thickEff <= baseS.torusRadius && (
                <div className="text-[11px] text-amber-600">
                  Thick Radius should be greater than Torus Radius
                  ({baseS.torusRadius.toFixed(3)}) for the pulse to be
                  visible.
                </div>
              )}
            </div>
          );
        }
        if (isTalking) {
          // Two peak sliders mirror Tube's Talking Thickness tab:
          // - Settle Speed (talking → idle): peak override for going
          //   OUT of talking back to torus. Inherits base.morphSpeed
          //   when unset.
          // - Morph Speed (→ talking): speed of going INTO talking
          //   from any other state. Inherits base.morphSpeed when
          //   unset.
          const settleInh = !coralPeakHas('settleSpeed');
          const settleEff = (coralPeakEff('settleSpeed') as number | undefined) ?? baseS.morphSpeed;
          const mInh = !coralPeakHas('morphSpeed');
          const mEff = (coralPeakEff('morphSpeed') as number) ?? baseS.morphSpeed;
          return (
            <div className="space-y-3">
              <PeakSliderRow
                label="Settle Speed (talking → idle)"
                value={settleEff}
                min={0}
                max={4.0}
                step={0.02}
                unit="s"
                inherited={settleInh}
                onChange={(v) => coralSetPeak({ settleSpeed: v })}
                onReset={settleInh ? undefined : () => coralClearPeak('settleSpeed')}
              />
              <PeakSliderRow
                label="Morph Speed (→ talking)"
                value={mEff}
                min={0}
                max={4.0}
                step={0.02}
                unit="s"
                inherited={mInh}
                onChange={(v) => coralSetPeak({ morphSpeed: v })}
                onReset={mInh ? undefined : () => coralClearPeak('morphSpeed')}
              />
            </div>
          );
        }
        // idle / listening — base.morphSpeed is the default for ANY
        // morph that returns the orb to the torus shape (talking →
        // idle, plus the first-mount intro). Direction-clarified label.
        return (
          <div className="space-y-3">
            <SliderRow
              label="Settle Speed (→ idle)"
              value={baseS.morphSpeed}
              min={0}
              max={4.0}
              step={0.02}
              unit="s"
              onChange={(v) => coralSetBase({ morphSpeed: v })}
            />
          </div>
        );
      }

      case 'motion': {
        const waveRest = (
          <SliderRow
            label={`Wave Intensity${restSuffix}`}
            value={baseS.waveIntensity}
            min={0}
            max={1.0}
            step={0.01}
            onChange={(v) => coralSetBase({ waveIntensity: v })}
          />
        );
        const breathRow = (
          <SliderRow
            label="Breath Amplitude"
            value={baseS.breathAmp}
            min={0}
            max={0.1}
            step={0.005}
            onChange={(v) => coralSetBase({ breathAmp: v })}
          />
        );
        const idleRow = (
          <SliderRow
            label="Idle Intensity"
            value={baseS.idleAmp * 100}
            min={0}
            max={20}
            step={0.5}
            unit="%"
            onChange={(v) => coralSetBase({ idleAmp: v / 100 })}
          />
        );
        if (!isTalking) {
          return (
            <div className="space-y-3">
              {waveRest}
              {breathRow}
              {idleRow}
            </div>
          );
        }
        const wInh = !coralPeakHas('waveIntensity');
        const wEff = (coralPeakEff('waveIntensity') as number) ?? baseS.waveIntensity;
        return (
          <div className="space-y-3">
            {waveRest}
            <PeakSliderRow
              label="Wave Intensity (Peak)"
              value={wEff}
              min={0}
              max={1.0}
              step={0.01}
              inherited={wInh}
              onChange={(v) => coralSetPeak({ waveIntensity: v })}
              onReset={wInh ? undefined : () => coralClearPeak('waveIntensity')}
            />
            {breathRow}
            {idleRow}
          </div>
        );
      }

      case 'colours': {
        const restRows = (
          <>
            <ColorFormatControl value={colorFormat} onChange={chooseColorFormat} />
            <RealtimeColorRow
              label={`Highlight${restSuffix}`}
              value={baseS.color1}
              colorFormat={colorFormat}
              onChange={(v) => coralSetBase({ color1: v })}
              onColorFormatChange={chooseColorFormat}
            />
            <RealtimeColorRow
              label={`Mid Tone${restSuffix}`}
              value={baseS.color2}
              colorFormat={colorFormat}
              onChange={(v) => coralSetBase({ color2: v })}
              onColorFormatChange={chooseColorFormat}
            />
            <RealtimeColorRow
              label={`Edge${restSuffix}`}
              value={baseS.color3}
              colorFormat={colorFormat}
              onChange={(v) => coralSetBase({ color3: v })}
              onColorFormatChange={chooseColorFormat}
            />
            <RealtimeColorRow
              label={`Background${restSuffix}`}
              value={baseS.bgColor}
              colorFormat={colorFormat}
              onChange={(v) => coralSetBase({ bgColor: v })}
              onColorFormatChange={chooseColorFormat}
            />
          </>
        );
        if (!isTalking) return <div className="space-y-3">{restRows}</div>;
        const c3Inh = !coralPeakHas('color3');
        const c3Eff = (coralPeakEff('color3') as string) ?? baseS.color3;
        return (
          <div className="space-y-3">
            {restRows}
            <PeakColorRow
              label="Edge (Peak)"
              value={c3Eff}
              colorFormat={colorFormat}
              inherited={c3Inh}
              onChange={(v) => coralSetPeak({ color3: v })}
              onReset={c3Inh ? undefined : () => coralClearPeak('color3')}
              onColorFormatChange={chooseColorFormat}
            />
          </div>
        );
      }
    }
  };

  // Bottom swatch behavior: Rest on idle/listening, Peak on thinking/talking
  const swatchValue = (i: 0 | 1 | 2): string => {
    const key = (['color1', 'color2', 'color3'] as const)[i];
    if (state === 'idle' || state === 'listening') return profile.base[key];
    const scope: PeakScope = state === 'thinking' ? 'thinking' : 'talking';
    return (profile[scope][key] ?? profile.base[key]) as string;
  };
  const swatchSet = (i: 0 | 1 | 2, v: string) => {
    const key = (['color1', 'color2', 'color3'] as const)[i];
    if (state === 'idle' || state === 'listening') {
      setBase({ [key]: v });
      return;
    }
    const scope: PeakScope = state === 'thinking' ? 'thinking' : 'talking';
    setPeak(scope, { [key]: v });
  };

  const toggleTab = (tab: ControlTab) => {
    if (expanded) return;
    setActiveTab((p) => (p === tab ? null : tab));
  };

  const blobAudioData = audioActive && state !== 'idle' ? audioData : SILENT;

  // Page bg sources from the active shader's profile so swapping a
  // Coral entry tints the whole editor with its bgColor.
  // Plan v8 (3D-0 step 3) — read from activeOrb. The path is uniform
  // since both shader settings types expose `base.bgColor` at the same
  // path (deliberate design from v4).
  const activeBgColor = activeOrb?.settings.base.bgColor ?? profile.base.bgColor;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: activeBgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: '48px 16px 200px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <GalleryAudioControls onAudioActive={setAudioActive} />

      {/* Canvas size matches production /voiceinterface/realtime (RealtimeBlob.tsx:53).
          Dispatches by activeOrb.shader: GentleOrbThicken for Tube/Kyoto
          (driven by the existing JS animator's `render` state), or
          CoralStoneMorph for Coral D (driven by its native morph
          animator with state-aware effective values). */}
      <div style={{ width: 328, height: 328 }}>
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
        >
          <color
            attach="background"
            args={[activeOrb?.settings.base.bgColor ?? profile.base.bgColor]}
          />
          <ambientLight intensity={0.5} />
          {activeOrb?.shader === 'coral' && activeCoralSettings ? (
            (() => {
              const isTalking = state === 'talking';
              const baseS = activeCoralSettings.base;
              // effMorphSpeed comes from coralActiveMorphSpeed at top
              // of component scope — direction-aware (talking.morphSpeed
              // entering, talking.settleSpeed exiting, base.morphSpeed
              // otherwise). Mirrors CoralRealtimeBlob's logic on the
              // live page so editor preview matches production
              // behavior.
              const effMorphSpeed = coralActiveMorphSpeed;
              return (
                <CoralStoneMorph
                  // Plan v8 (F1): key is replayCounter only — NOT
                  // activeCoralId. Same-shader Coral A → Coral B is
                  // prop-only (no remount, no intro). Replay button
                  // bumps replayCounter and is the sole same-shader
                  // remount path.
                  key={`coral-${replayCounter}`}
                  audioData={blobAudioData}
                  goal={isTalking ? 0 : 1}
                  scale={coralEasedScale}
                  morphSpeed={Math.max(0.001, effMorphSpeed)}
                  torusRadius={coralPulse ?? baseS.torusRadius}
                  waveIntensity={coralEasedWave}
                  breathAmp={baseS.breathAmp}
                  idleAmp={baseS.idleAmp}
                  color1={baseS.color1}
                  color2={baseS.color2}
                  color3={coralEasedColor3}
                />
              );
            })()
          ) : (
            <GentleOrbThicken
              audioData={blobAudioData}
              goal={1}
              scale={render.scale}
              thinRadius={profile.base.thinRadius}
              thickRadius={render.thickRadius}
              thickenSpeed={0.05}
              waveIntensity={render.waveIntensity}
              waveCount={render.waveCount}
              breathAmp={render.breathAmp}
              idleAmp={render.idleAmp}
              color1={render.color1}
              color2={render.color2}
              color3={render.color3}
            />
          )}
        </Canvas>
      </div>

      {/* Bottom bar (mirrors GalleryNavBar) */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Single-tab popover — shader-aware (round-7 F5 gate flip).
            Dispatches to the appropriate per-shader tab renderer based
            on activeOrb.shader. Hidden when no orb is selected. */}
        {activeOrb && !expanded && activeTab && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg max-h-[50vh] overflow-y-auto">
            <div className="max-w-3xl mx-auto p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {tabs.find((t) => t.key === activeTab)?.label} — {state}
              </h3>
              {activeOrb.shader === 'coral'
                ? renderCoralTabControls(activeTab)
                : renderTabControls(activeTab)}
            </div>
          </div>
        )}

        {/* Expanded 4-column drawer — shader-aware. */}
        {activeOrb && expanded && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg max-h-[60vh] overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4">
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">
                Editing: {state}
              </div>
              <div className="flex gap-6 flex-wrap">
                {tabs.map((tab) => (
                  <div key={tab.key} className="flex-1 min-w-[220px]">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      {tab.label}
                    </h3>
                    {activeOrb.shader === 'coral'
                      ? renderCoralTabControls(tab.key)
                      : renderTabControls(tab.key)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main bar */}
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setExpanded((p) => !p);
                setActiveTab(null);
              }}
              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {expanded ? <X size={14} /> : <Menu size={14} />}
            </button>

            <div className="w-px h-6 bg-gray-200" />

            {/* State pills */}
            <div className="flex items-center gap-1">
              {STATES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setAutoLoop(false);
                    setState(s);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                    state === s
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-gray-200" />

            {/* Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileDropdown((p) => !p)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer min-w-[100px]"
              >
                {activeOrb?.shader === 'coral' ? (
                  <Circle size={11} className="shrink-0 text-[#ffa279]" aria-label="Coral D profile" />
                ) : (
                  <Disc size={11} className="shrink-0 text-[#949e05]" aria-label="Tube/Kyoto profile" />
                )}
                <span className="truncate text-gray-600 max-w-[120px]">{activeName}</span>
                <ChevronDown size={12} className="text-gray-400 shrink-0" />
              </button>
              {showProfileDropdown && (
                <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {kyotoProfiles.map((p) => {
                    const isRenaming = renamingId === p.id;
                    const renameInvalid = !renameDraft.trim() || profileNameExists(renameDraft, p.id);

                    return (
                      <div
                        key={p.id}
                        className={`min-h-[32px] px-3 py-1.5 text-xs hover:bg-gray-50 ${
                          activeOrb?.shader === 'kyoto' && p.id === activeOrb.id
                            ? 'font-medium text-gray-700'
                            : 'text-gray-600'
                        } ${isRenaming ? '' : 'cursor-pointer'}`}
                        onClick={() => {
                          if (!isRenaming) selectProfile(p.id);
                        }}
                      >
                        {isRenaming ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename(p.id, renameDraft);
                                if (e.key === 'Escape') cancelRename();
                              }}
                              className={`min-w-0 flex-1 px-2 py-1 text-xs border rounded-md outline-none focus:border-gray-400 ${
                                renameInvalid ? 'border-red-200' : 'border-gray-200'
                              }`}
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                commitRename(p.id, renameDraft);
                              }}
                              disabled={renameInvalid}
                              className={`transition-colors ${
                                renameInvalid
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-green-600 cursor-pointer'
                              }`}
                              title="Save name"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelRename();
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Cancel rename"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Disc
                              size={11}
                              className="shrink-0 text-[#949e05]"
                              aria-label="Tube/Kyoto profile"
                            />
                            <span className="min-w-0 flex-1 truncate">{p.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinned(p.id);
                              }}
                              className={`shrink-0 transition-colors cursor-pointer ${
                                p.pinned
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-gray-300 hover:text-gray-600'
                              }`}
                              title={p.pinned ? 'Pinned to live page (click to unpin)' : 'Pin to live page'}
                            >
                              <Bookmark
                                size={12}
                                fill={p.pinned ? 'currentColor' : 'none'}
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                beginRename(p);
                              }}
                              className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Rename profile"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Coral D entries from realtime-coral-profiles.json.
                      Selecting a Coral row currently shows a no-op
                      placeholder — full Coral preview + controls
                      arrive in a later phase. Bookmark + rename work
                      end-to-end and route to the Coral file. */}
                  {coralProfiles.map((p) => {
                    const isRenaming = renamingId === p.id;
                    const renameInvalid = !renameDraft.trim() || profileNameExists(renameDraft, p.id);
                    return (
                      <div
                        key={p.id}
                        className={`min-h-[32px] px-3 py-1.5 text-xs hover:bg-gray-50 ${
                          activeOrb?.shader === 'coral' && p.id === activeOrb.id
                            ? 'font-medium text-gray-700'
                            : 'text-gray-600'
                        } ${isRenaming ? '' : 'cursor-pointer'}`}
                        onClick={() => {
                          if (!isRenaming) selectCoralProfile(p.id);
                        }}
                      >
                        {isRenaming ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRenameCoral(p.id, renameDraft);
                                if (e.key === 'Escape') cancelRename();
                              }}
                              className={`min-w-0 flex-1 px-2 py-1 text-xs border rounded-md outline-none focus:border-gray-400 ${
                                renameInvalid ? 'border-red-200' : 'border-gray-200'
                              }`}
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                commitRenameCoral(p.id, renameDraft);
                              }}
                              disabled={renameInvalid}
                              className={`transition-colors ${
                                renameInvalid
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-green-600 cursor-pointer'
                              }`}
                              title="Save name"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelRename();
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Cancel rename"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Circle
                              size={11}
                              className="shrink-0 text-[#ffa279]"
                              aria-label="Coral D profile"
                            />
                            <span className="min-w-0 flex-1 truncate">{p.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePinnedCoral(p.id);
                              }}
                              className={`shrink-0 transition-colors cursor-pointer ${
                                p.pinned
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-gray-300 hover:text-gray-600'
                              }`}
                              title={p.pinned ? 'Pinned to live page (click to unpin)' : 'Pin to live page'}
                            >
                              <Bookmark
                                size={12}
                                fill={p.pinned ? 'currentColor' : 'none'}
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                beginRename(p as unknown as SavedProfile);
                              }}
                              className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Rename profile"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-gray-200" />

            {/* Tab buttons — shader-aware. Both Tube and Coral show
                tabs; the Coral renderer (renderCoralTabControls)
                handles its own slider set per state pill. */}
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => toggleTab(tab.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-gray-100 text-gray-800'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Bottom swatches — Tube-only per round-7 F8. Coral users
                edit colours from the Colours tab. */}
            {activeOrb?.shader === 'kyoto' && (
              <div className="flex items-center gap-1 ml-2">
                {([0, 1, 2] as const).map((i) => (
                  <ColorPickerButton
                    key={i}
                    value={swatchValue(i)}
                    colorFormat={colorFormat}
                    onChange={(v) => swatchSet(i, v)}
                    title={state === 'idle' || state === 'listening' ? 'Rest' : 'Peak'}
                    swatchClassName="h-6 w-6 rounded-full"
                  />
                ))}
              </div>
            )}

            {/* Pause / resume thinking pulse — only visible while thinking */}
            {state === 'thinking' && (
              <button
                onClick={() => setThinkingPaused((p) => !p)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ml-2 ${
                  thinkingPaused
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={thinkingPaused ? 'Resume pulse' : 'Pause pulse'}
              >
                {thinkingPaused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            )}

            {/* Pin / unpin the active profile to the live realtime page.
                Mirrors the bookmark inside the dropdown row but is
                always reachable without opening the dropdown. */}
            <button
              onClick={toggleActivePinned}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ml-2 ${
                activePinned
                  ? 'bg-amber-50 text-amber-500 hover:text-amber-600'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
              }`}
              title={activePinned ? 'Pinned to live page (click to unpin)' : 'Pin active profile to live page'}
            >
              <Bookmark size={14} fill={activePinned ? 'currentColor' : 'none'} />
            </button>

            {/* Replay first-load talking → idle intro for the active
                profile. Branches by shader: Tube uses the existing JS
                animator's seed-render trick; Coral forces previewState
                to idle (so goal=1) and bumps replayCounter to remount
                the canvas → morphRef resets to 0 → sphere → torus
                intro plays via Coral's native animator. */}
            <button
              onClick={() => {
                if (activeOrb?.shader === 'coral') {
                  setState('idle');
                  setReplayCounter((c) => c + 1);
                } else {
                  restartIntro();
                }
              }}
              className="p-1.5 rounded-lg transition-colors cursor-pointer ml-2 bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              title="Replay talking-to-idle intro"
            >
              <RotateCcw size={14} />
            </button>

            {/* Auto-loop through states (idle → listening → thinking → talking, every 2.5s) */}
            <button
              onClick={() => setAutoLoop((p) => !p)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ml-2 ${
                autoLoop
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title="Cycle through states (2.5s each)"
            >
              <Repeat size={14} />
            </button>

            <div className="flex-1" />

            {/* Discard + Update — shader-aware (Phase 3E). Both shaders
                use the same BaselineSnapshot dirty contract; routing
                differs only in which source array + persist endpoint
                gets the write. */}
            {isDirty && (
              <>
                <button
                  onClick={() => {
                    // Plan v8 round-7 F1 — Discard runs the inverse of
                    // a baseline capture: clone baseline.settings back
                    // into active source array, leaving baseline
                    // untouched. Active becomes equal to baseline by
                    // clone, isDirty returns false.
                    if (!activeOrb || !activeBaseline) return;
                    if (activeOrb.shader !== activeBaseline.shader) return;
                    if (activeOrb.shader === 'kyoto' && activeBaseline.shader === 'kyoto') {
                      const reverted = structuredClone(activeBaseline.settings);
                      // profile is derived; only the source array
                      // needs to be updated. profile useMemo will
                      // recompute on next render.
                      setKyotoProfiles((arr) =>
                        arr.map((pr) => (pr.id === activeOrb.id ? { ...pr, settings: reverted } : pr)),
                      );
                    } else if (activeOrb.shader === 'coral' && activeBaseline.shader === 'coral') {
                      const reverted = structuredClone(activeBaseline.settings);
                      setCoralProfiles((arr) =>
                        arr.map((pr) => (pr.id === activeOrb.id ? { ...pr, settings: reverted } : pr)),
                      );
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-1"
                  title="Discard unsaved edits and reset to last saved"
                >
                  <RotateCcw size={12} />
                  Discard
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Update
                </button>
              </>
            )}

            {/* Save — Phase 3F two-step shader-choice modal. */}
            {showSaveDialog ? (
              saveStep === 'shader' ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-500 uppercase tracking-wider">Shader:</span>
                  <button
                    onClick={() => {
                      setSaveShader('kyoto');
                      setSaveName(pickRealtimeUnusedName());
                      setSaveStep('name');
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    <Disc size={11} className="text-[#949e05]" />
                    Tube
                  </button>
                  <button
                    onClick={() => {
                      setSaveShader('coral');
                      setSaveName(pickRealtimeUnusedName());
                      setSaveStep('name');
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    <Circle size={11} className="text-[#ffa279]" />
                    Coral
                  </button>
                  <button
                    onClick={closeSaveDialog}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  {saveShader === 'coral' ? (
                    <Circle size={11} className="text-[#ffa279]" />
                  ) : (
                    <Disc size={11} className="text-[#949e05]" />
                  )}
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') closeSaveDialog();
                    }}
                    placeholder="Profile name"
                    className={`w-28 px-2 py-1 text-xs border rounded-lg outline-none focus:border-gray-400 ${
                      saveNameInvalid ? 'border-red-200' : 'border-gray-200'
                    }`}
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    disabled={saveNameInvalid}
                    className={`transition-colors ${
                      saveNameInvalid
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:text-green-600 cursor-pointer'
                    }`}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={closeSaveDialog}
                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={() => {
                  setSaveShader(activeOrb?.shader ?? 'kyoto');
                  setSaveStep('shader');
                  setShowSaveDialog(true);
                }}
                className="p-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                title="Save as new profile"
              >
                <Save size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
