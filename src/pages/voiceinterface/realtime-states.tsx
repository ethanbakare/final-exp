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
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import type { CoralRealtimeSettings } from '@/projects/voiceinterface/components/CoralRealtimeBlob';

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
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  // Coral profiles live in a parallel file. Read here so the dropdown
  // can show them with shader glyphs and the bookmark toggle works for
  // both shaders. Editing Coral controls is a separate phase — for now
  // selecting a Coral entry routes bookmark/rename to its file and
  // swaps the canvas to a Coral preview.
  const [coralProfiles, setCoralProfiles] = useState<SavedCoralProfile[]>([]);
  const [activeId, setActiveId] = useState<string>('rt-kyoto');
  // Editor-active shader. 'kyoto' uses the existing JS animator + tube
  // controls; 'coral' renders a Coral preview from the active Coral
  // profile's settings (controls are read-only in this phase).
  const [activeShader, setActiveShader] = useState<'kyoto' | 'coral'>('kyoto');
  const [activeCoralId, setActiveCoralId] = useState<string | null>(null);
  // Replay counter for Coral (forces canvas remount → morphRef resets
  // to 0 → sphere → torus intro replays).
  const [replayCounter, setReplayCounter] = useState(0);
  const [profile, setProfile] = useState<LinkedProfile>(KYOTO_SEED);
  const [activeBaseline, setActiveBaseline] = useState<LinkedProfile>(KYOTO_SEED);
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
  const [externalProfileNames, setExternalProfileNames] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [colorFormat, setColorFormat] = useState<ColorFormat>('hex');
  const [thinkingPaused, setThinkingPaused] = useState(false);

  const profileRef = useRef(profile);
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

  profileRef.current = profile;
  stateRef.current = state;
  renderRef.current = render;

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

  // ── First-load: fetch + defensive recreate (§10.2) ───────────
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
        setProfiles(next);
        setActiveId(seedEntry.id);
        setProfile(seedEntry.settings);
        setActiveBaseline(seedEntry.settings);
        restartIntro(seedEntry.settings);
      } else {
        setProfiles(arr);
        const first = arr[0];
        setActiveId(first.id);
        setProfile(first.settings);
        setActiveBaseline(first.settings);
        restartIntro(first.settings);
      }
    });
    // Coral profiles loaded separately (parallel file). Failure / empty
    // is fine — just means no Coral entries appear in the dropdown.
    fetchCoralProfiles().then(setCoralProfiles);
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
  const setBase = (patch: Partial<BaseSettings>) =>
    setProfile((p) => ({ ...p, base: { ...p.base, ...patch } }));

  const setPeak = (scope: PeakScope, patch: Partial<PeakOverrides>) =>
    setProfile((p) => ({ ...p, [scope]: { ...p[scope], ...patch } }));

  const clearPeak = <K extends keyof PeakOverrides>(scope: PeakScope, field: K) =>
    setProfile((p) => {
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

  // ── Profile actions ─────────────────────────────────────────
  const isDirty = JSON.stringify(profile) !== JSON.stringify(activeBaseline);
  const activeProfile = profiles.find((p) => p.id === activeId);
  const activeCoralProfile = coralProfiles.find((p) => p.id === activeCoralId);
  const activeName =
    activeShader === 'coral'
      ? activeCoralProfile?.name ?? 'Coral Realtime'
      : activeProfile?.name ?? REALTIME_SEED_NAME;
  const activePinned =
    activeShader === 'coral'
      ? activeCoralProfile?.pinned === true
      : activeProfile?.pinned === true;
  const toggleActivePinned = () => {
    if (activeShader === 'coral' && activeCoralId) {
      togglePinnedCoral(activeCoralId);
    } else if (activeId) {
      togglePinned(activeId);
    }
  };

  const profileNameExists = (name: string, exceptId?: string) => {
    const normalized = normalizeProfileName(name);
    if (!normalized) return false;
    if (externalProfileNames.has(normalized)) return true;
    return profiles.some((p) => p.id !== exceptId && normalizeProfileName(p.name) === normalized);
  };

  const pickRealtimeUnusedName = () => {
    const used = new Set([
      ...Array.from(externalProfileNames),
      ...profiles.map((p) => normalizeProfileName(p.name)),
    ]);
    const available = CURATED_NAMES.filter((name) => !used.has(normalizeProfileName(name)));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
    const base = 'Realtime Profile';
    let i = profiles.length + 1;
    while (used.has(normalizeProfileName(`${base} ${i}`))) i += 1;
    return `${base} ${i}`;
  };

  const saveNameInvalid = !saveName.trim() || profileNameExists(saveName);

  const selectProfile = (id: string) => {
    const found = profiles.find((p) => p.id === id);
    if (!found) return;
    setActiveShader('kyoto');
    setActiveCoralId(null);
    setActiveId(id);
    setProfile(found.settings);
    setActiveBaseline(found.settings);
    restartIntro(found.settings);
    setShowProfileDropdown(false);
  };

  const selectCoralProfile = (id: string) => {
    const found = coralProfiles.find((p) => p.id === id);
    if (!found) return;
    setActiveShader('coral');
    setActiveCoralId(id);
    // Bump replay counter so the preview canvas remounts and the
    // sphere → torus intro plays for the new Coral profile.
    setReplayCounter((c) => c + 1);
    // Force preview state to idle so goal=1 on remount, otherwise
    // talking pill would land us at goal=0 with morphRef=0 (no morph).
    setState('idle');
    setShowProfileDropdown(false);
  };

  const activeCoralSettings: CoralRealtimeSettings | null =
    activeShader === 'coral' && activeCoralId
      ? coralProfiles.find((p) => p.id === activeCoralId)?.settings ?? null
      : null;

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name || profileNameExists(name)) return;
    const entry: SavedProfile = {
      id: `rt-${crypto.randomUUID()}`,
      name,
      settings: profile,
      lastModified: Date.now(),
    };
    const next = [...profiles, entry];
    setProfiles(next);
    setActiveId(entry.id);
    setActiveBaseline(entry.settings);
    setShowSaveDialog(false);
    setSaveName('');
    await persistProfiles(next);
  };

  const beginRename = (entry: SavedProfile) => {
    setRenamingId(entry.id);
    setRenameDraft(entry.name);
  };

  const togglePinned = async (id: string) => {
    // Flip the `pinned` flag on the named Tube/Kyoto profile and
    // persist. Live page picks up the change on next refresh.
    const next = profiles.map((pr) =>
      pr.id === id ? { ...pr, pinned: !pr.pinned, lastModified: Date.now() } : pr,
    );
    setProfiles(next);
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
    const next = profiles.map((pr) =>
      pr.id === id ? { ...pr, name, lastModified: Date.now() } : pr
    );
    setProfiles(next);
    cancelRename();
    await persistProfiles(next);
  };

  const handleUpdate = async () => {
    if (!isDirty) return;
    const next = profiles.map((pr) =>
      pr.id === activeId ? { ...pr, settings: profile, lastModified: Date.now() } : pr
    );
    setProfiles(next);
    setActiveBaseline(profile);
    await persistProfiles(next);
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
  const activeBgColor =
    activeShader === 'coral' && activeCoralSettings
      ? activeCoralSettings.base.bgColor
      : profile.base.bgColor;

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
          Dispatches by activeShader: GentleOrbThicken for Tube/Kyoto
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
            args={[
              activeShader === 'coral' && activeCoralSettings
                ? activeCoralSettings.base.bgColor
                : profile.base.bgColor,
            ]}
          />
          <ambientLight intensity={0.5} />
          {activeShader === 'coral' && activeCoralSettings ? (
            (() => {
              const isTalking = state === 'talking';
              const baseS = activeCoralSettings.base;
              const tlk = activeCoralSettings.talking;
              const effMorphSpeed = isTalking ? tlk?.morphSpeed ?? baseS.morphSpeed : baseS.morphSpeed;
              const effScale = isTalking ? tlk?.scale ?? baseS.scale : baseS.scale;
              const effWaveIntensity = isTalking
                ? tlk?.waveIntensity ?? baseS.waveIntensity
                : baseS.waveIntensity;
              const effColor3 = isTalking ? tlk?.color3 ?? baseS.color3 : baseS.color3;
              return (
                <CoralStoneMorph
                  key={`coral-${activeCoralId}-${replayCounter}`}
                  audioData={blobAudioData}
                  goal={isTalking ? 0 : 1}
                  scale={effScale}
                  morphSpeed={Math.max(0.001, effMorphSpeed)}
                  torusRadius={baseS.torusRadius}
                  waveIntensity={effWaveIntensity}
                  breathAmp={baseS.breathAmp}
                  idleAmp={baseS.idleAmp}
                  color1={baseS.color1}
                  color2={baseS.color2}
                  color3={effColor3}
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
        {/* Single-tab popover */}
        {!expanded && activeTab && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg max-h-[50vh] overflow-y-auto">
            <div className="max-w-3xl mx-auto p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {tabs.find((t) => t.key === activeTab)?.label} — {state}
              </h3>
              {renderTabControls(activeTab)}
            </div>
          </div>
        )}

        {/* Expanded 4-column drawer */}
        {expanded && (
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
                    {renderTabControls(tab.key)}
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
                {activeShader === 'coral' ? (
                  <Circle size={11} className="shrink-0 text-[#ffa279]" aria-label="Coral D profile" />
                ) : (
                  <Disc size={11} className="shrink-0 text-[#949e05]" aria-label="Tube/Kyoto profile" />
                )}
                <span className="truncate text-gray-600 max-w-[120px]">{activeName}</span>
                <ChevronDown size={12} className="text-gray-400 shrink-0" />
              </button>
              {showProfileDropdown && (
                <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {profiles.map((p) => {
                    const isRenaming = renamingId === p.id;
                    const renameInvalid = !renameDraft.trim() || profileNameExists(renameDraft, p.id);

                    return (
                      <div
                        key={p.id}
                        className={`min-h-[32px] px-3 py-1.5 text-xs hover:bg-gray-50 ${
                          p.id === activeId ? 'font-medium text-gray-700' : 'text-gray-600'
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
                          activeShader === 'coral' && p.id === activeCoralId
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

            {/* Tab buttons */}
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

            {/* Bottom swatches (state-aware Rest vs Peak per §4.6) */}
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
                if (activeShader === 'coral') {
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

            {/* Discard + Update — both visible when isDirty */}
            {isDirty && (
              <>
                <button
                  onClick={() => setProfile(activeBaseline)}
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

            {/* Save */}
            {showSaveDialog ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') {
                      setShowSaveDialog(false);
                      setSaveName('');
                    }
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
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveName('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSaveName(pickRealtimeUnusedName());
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
