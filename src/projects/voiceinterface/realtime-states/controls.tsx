/**
 * UI primitives + tab panels for the realtime-states editor.
 *
 * Two pieces:
 *
 * 1. Leaf UI components — PeakSliderRow, color picker stack, etc.
 *    Self-contained; render row / color row / picker. Pure components.
 *
 * 2. Tab panels — TubeTabPanel and CoralTabPanel.
 *    Renamed from the in-component `renderTabControls` /
 *    `renderCoralTabControls` arrow functions. Now prop-driven via
 *    `TubeController` / `CoralController` bundles. The panel JSX bodies
 *    are byte-equal to the source modulo the closure-to-prop substitution
 *    (every `profile` → `controller.profile`, etc.).
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ColorArea,
  ColorSlider,
  ColorThumb,
  SliderTrack,
  parseColor,
  type Color,
} from 'react-aria-components';
import SliderRow from '@/projects/blob-orb/components/shared/SliderRow';
import { Slider } from '@/components/ui/slider';
import { approxPixelDia } from '@/projects/blob-orb/galleryTypes';
import { CORAL_PULSE_DEFAULTS } from '@/projects/voiceinterface/components/CoralRealtimeBlob';
import { COLOR_FORMATS, SETTLE_DURATION_MULTIPLIER } from './constants';
import {
  colorDraftsToHex,
  colorFieldValues,
  formatColorValue,
  parseColorValue,
} from './helpers';
import type {
  BaseSettings,
  ColorFormat,
  ControlTab,
  CoralRealtimeSettings,
  LinkedProfile,
  PeakOverrides,
  PeakScope,
  PreviewState,
} from './types';

// ── Controller prop bundles ─────────────────────────────────────

export interface TubeController {
  profile: LinkedProfile;
  state: PreviewState;
  setBase: (patch: Partial<BaseSettings>) => void;
  setPeak: (scope: PeakScope, patch: Partial<PeakOverrides>) => void;
  clearPeak: <K extends keyof PeakOverrides>(scope: PeakScope, field: K) => void;
  peakHas: (scope: PeakScope, field: keyof PeakOverrides) => boolean;
  peakEff: (scope: PeakScope, field: keyof PeakOverrides & keyof BaseSettings) => number | string;
}

export interface CoralController {
  settings: CoralRealtimeSettings;
  state: PreviewState;
  coralSetBase: (patch: Partial<CoralRealtimeSettings['base']>) => void;
  coralSetPeak: (patch: Partial<NonNullable<CoralRealtimeSettings['talking']>>) => void;
  coralClearPeak: <K extends keyof NonNullable<CoralRealtimeSettings['talking']>>(field: K) => void;
  coralPeakHas: <K extends keyof NonNullable<CoralRealtimeSettings['talking']>>(field: K) => boolean;
  coralPeakEff: <K extends keyof NonNullable<CoralRealtimeSettings['talking']>>(
    field: K,
  ) =>
    | NonNullable<CoralRealtimeSettings['talking']>[K]
    | CoralRealtimeSettings['base'][K extends keyof CoralRealtimeSettings['base'] ? K : never]
    | undefined;
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

export const PeakSliderRow: React.FC<PeakSliderRowProps> = ({
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

interface ColorFormatControlProps {
  value: ColorFormat;
  onChange: (format: ColorFormat) => void;
}

export const ColorFormatControl: React.FC<ColorFormatControlProps> = ({ value, onChange }) => (
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

export const ColorPickerButton: React.FC<ColorPickerButtonProps> = ({
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

// ── Tube tab panel ───────────────────────────────────────────────
//
// Was `renderTabControls(tab)` inside RealtimeStatesEditor. Now a
// component, with closures (profile, state, setBase, setPeak,
// clearPeak, peakHas, peakEff) replaced by destructured controller
// props. The chooseColorFormat closure is now the onColorFormatChange
// prop. Body is byte-equal to the source modulo those substitutions.

export interface TubeTabPanelProps {
  tab: ControlTab;
  controller: TubeController;
  colorFormat: ColorFormat;
  onColorFormatChange: (format: ColorFormat) => void;
}

export const TubeTabPanel: React.FC<TubeTabPanelProps> = ({
  tab,
  controller,
  colorFormat,
  onColorFormatChange,
}) => {
  const { profile, state, setBase, setPeak, clearPeak, peakHas, peakEff } = controller;

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
          <ColorFormatControl value={colorFormat} onChange={onColorFormatChange} />
          <RealtimeColorRow
            label={`Highlight${restSuffix}`}
            value={profile.base.color1}
            colorFormat={colorFormat}
            onChange={(v) => setBase({ color1: v })}
            onColorFormatChange={onColorFormatChange}
          />
          <RealtimeColorRow
            label={`Mid Tone${restSuffix}`}
            value={profile.base.color2}
            colorFormat={colorFormat}
            onChange={(v) => setBase({ color2: v })}
            onColorFormatChange={onColorFormatChange}
          />
          <RealtimeColorRow
            label={`Edge${restSuffix}`}
            value={profile.base.color3}
            colorFormat={colorFormat}
            onChange={(v) => setBase({ color3: v })}
            onColorFormatChange={onColorFormatChange}
          />
          <RealtimeColorRow
            label={`Background${restSuffix}`}
            value={profile.base.bgColor}
            colorFormat={colorFormat}
            onChange={(v) => setBase({ bgColor: v })}
            onColorFormatChange={onColorFormatChange}
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
            onColorFormatChange={onColorFormatChange}
          />
          <PeakColorRow
            label="Mid Tone (Peak)"
            value={c2}
            colorFormat={colorFormat}
            inherited={c2Inh}
            onChange={(v) => setPeak(peakScope, { color2: v })}
            onReset={c2Inh ? undefined : () => clearPeak(peakScope, 'color2')}
            onColorFormatChange={onColorFormatChange}
          />
          <PeakColorRow
            label="Edge (Peak)"
            value={c3}
            colorFormat={colorFormat}
            inherited={c3Inh}
            onChange={(v) => setPeak(peakScope, { color3: v })}
            onReset={c3Inh ? undefined : () => clearPeak(peakScope, 'color3')}
            onColorFormatChange={onColorFormatChange}
          />
        </div>
      );
    }
  }
};

// ── Coral tab panel ──────────────────────────────────────────────
//
// Plan v8 Phase 3D-1 — parallel to TubeTabPanel but binds to Coral's
// settings shape. Slider ranges per the explicit Coral table in the
// plan. Coral speed sliders show LITERAL seconds with no "≈ visible"
// hint (round-7 F9): morphSpeed is fed directly to CoralStoneMorph as
// delta-divisor seconds, no tau coefficient. Coral has only the
// talking peak slot — thinking/listening render as idle.
//
// Was `renderCoralTabControls(tab)` inside RealtimeStatesEditor.
// Closures (activeCoralSettings, state, coralSet*, coralPeak*) replaced
// by destructured controller props. chooseColorFormat closure replaced
// by onColorFormatChange prop. Body is byte-equal to the source modulo
// those substitutions.

export interface CoralTabPanelProps {
  tab: ControlTab;
  controller: CoralController;
  colorFormat: ColorFormat;
  onColorFormatChange: (format: ColorFormat) => void;
}

export const CoralTabPanel: React.FC<CoralTabPanelProps> = ({
  tab,
  controller,
  colorFormat,
  onColorFormatChange,
}) => {
  const {
    settings,
    state,
    coralSetBase,
    coralSetPeak,
    coralClearPeak,
    coralPeakHas,
    coralPeakEff,
  } = controller;

  const baseS = settings.base;
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
          <ColorFormatControl value={colorFormat} onChange={onColorFormatChange} />
          <RealtimeColorRow
            label={`Highlight${restSuffix}`}
            value={baseS.color1}
            colorFormat={colorFormat}
            onChange={(v) => coralSetBase({ color1: v })}
            onColorFormatChange={onColorFormatChange}
          />
          <RealtimeColorRow
            label={`Mid Tone${restSuffix}`}
            value={baseS.color2}
            colorFormat={colorFormat}
            onChange={(v) => coralSetBase({ color2: v })}
            onColorFormatChange={onColorFormatChange}
          />
          <RealtimeColorRow
            label={`Edge${restSuffix}`}
            value={baseS.color3}
            colorFormat={colorFormat}
            onChange={(v) => coralSetBase({ color3: v })}
            onColorFormatChange={onColorFormatChange}
          />
          <RealtimeColorRow
            label={`Background${restSuffix}`}
            value={baseS.bgColor}
            colorFormat={colorFormat}
            onChange={(v) => coralSetBase({ bgColor: v })}
            onColorFormatChange={onColorFormatChange}
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
            onColorFormatChange={onColorFormatChange}
          />
        </div>
      );
    }
  }
};
