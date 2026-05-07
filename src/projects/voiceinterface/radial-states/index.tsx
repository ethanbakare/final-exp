/**
 * Radial-states review page — three radial-waveform cells side by side
 * representing the target idle/listening, thinking, and talking states
 * for the radial voice UI. Each state is independently editable via
 * the bottom controls panel — pick a state tab, edit its sliders and
 * toggles, and see the change land in the corresponding cell live.
 *
 * Persistence is local (localStorage key `radial-states-review-v1`) so
 * iteration survives reloads. Save-as-disk-profile is intentionally
 * deferred — once values stabilize, this moves to the realtime-states
 * editor with a proper linked-profile schema (base + per-state peaks).
 *
 * Audio is shared across cells via the radial-waveform audioService.
 * Cell 1 (idle/listening) and cell 3 (talking) consume frequencyData;
 * cell 2 (thinking) is intentionally fed null so audio doesn't reach
 * `mapFrequencyToBars` (ambientWave is off too, so bars sit at
 * minBarLength and just rotate).
 */
import React, { useEffect, useMemo, useState } from 'react';
import RadialInward from '@/projects/radial-waveform/variants/RadialInward';
import RadialOutward from '@/projects/radial-waveform/variants/RadialOutward';
import RadialGalleryAudioControls from '@/projects/radial-waveform/components/RadialGalleryAudioControls';
import { audioService } from '@/projects/radial-waveform/services/audioService';
import type { RadialSettings } from '@/projects/radial-waveform/types';

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

const STORAGE_KEY = 'radial-states-review-v1';

// ── Cell ──────────────────────────────────────────────────────────

interface CellProps {
  label: string;
  settings: RadialSettings;
  frequencyData: Uint8Array | null;
  variant: 'inward' | 'outward';
  focused: boolean;
  onClick: () => void;
}

const CELL_SIZE = 308;
// Donut envelope is shared across ALL cells, anchored to Thorn's bar
// range. Talking's smaller bar range sits inside this same donut.
const DONUT_PADDING = 10;
const DONUT_COLOR = 'rgba(38, 36, 36, 0.03)'; // #262424 at 3%
const DONUT_OUTER = THORN.radius + DONUT_PADDING;
const DONUT_INNER = Math.max(0, THORN.radius - THORN.maxBarLength - DONUT_PADDING);
const DONUT_SIZE = DONUT_OUTER * 2;
const DONUT_THICKNESS = DONUT_OUTER - DONUT_INNER;

function Cell({ label, settings, frequencyData, variant, focused, onClick }: CellProps) {
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
  width = 120,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  width?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width, flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, lineHeight: 1.2 }}>
        <span style={{ color: '#9ca3af' }}>{label}</span>
        <span style={{ color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
          {value}
          {unit ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#FACC15', height: 4 }}
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
        gap: 6,
        fontSize: 10,
        color: '#9ca3af',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: '#FACC15', margin: 0 }}
      />
      <span>{label}</span>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
      <span>{label}</span>
      <div style={{ position: 'relative', width: 18, height: 18, borderRadius: 9, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
      <span>{label}</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            style={{
              padding: '2px 6px',
              fontSize: 9,
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
  onChange: (patch: Partial<RadialSettings>) => void;
  onResetState: () => void;
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 500,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginRight: 4,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />;
}

function ControlsPanel({ settings, onChange, onResetState }: ControlsPanelProps) {
  const set = <K extends keyof RadialSettings>(key: K, value: RadialSettings[K]) =>
    onChange({ [key]: value } as Partial<RadialSettings>);

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    rowGap: 10,
  };

  return (
    <div
      style={{
        background: '#1a1a1e',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Row 1 — Geometry + Audio */}
      <div style={rowStyle}>
        <SectionTag>Geometry</SectionTag>
        <Slider label="Radius" value={settings.radius} min={30} max={200} step={1} unit="px" onChange={(v) => set('radius', v)} />
        <Slider label="Bar W" value={settings.barWidth} min={0.5} max={10} step={0.5} unit="px" onChange={(v) => set('barWidth', v)} />
        <Slider label="Bar Gap" value={settings.barGap} min={0} max={12} step={0.5} unit="px" onChange={(v) => set('barGap', v)} />
        <Slider label="Min Len" value={settings.minBarLength} min={0} max={30} step={1} unit="px" onChange={(v) => set('minBarLength', v)} />
        <Slider label="Max Len" value={settings.maxBarLength} min={10} max={120} step={1} unit="px" onChange={(v) => set('maxBarLength', v)} />
        <Divider />
        <SectionTag>Audio</SectionTag>
        <Slider label="Sensitivity" value={settings.sensitivity} min={0.1} max={5} step={0.1} unit="x" onChange={(v) => set('sensitivity', v)} />
        <Slider label="Segments" value={settings.segments} min={1} max={16} step={1} onChange={(v) => set('segments', v)} />
        <Slider label="Smoothing" value={settings.smoothing} min={0} max={0.99} step={0.01} onChange={(v) => set('smoothing', v)} />
      </div>

      {/* Row 2 — Wave + Envelope */}
      <div style={rowStyle}>
        <SectionTag>Wave</SectionTag>
        <Toggle label="Ambient" checked={settings.ambientWave} onChange={(v) => set('ambientWave', v)} />
        {settings.ambientWave && (
          <>
            <PillGroup
              label="Shape"
              value={settings.waveShape}
              options={['sine', 'square', 'segments'] as const}
              onChange={(v) => set('waveShape', v)}
            />
            {settings.waveShape !== 'segments' && (
              <Slider label="Lobes" value={settings.waveLobes} min={1} max={16} step={1} onChange={(v) => set('waveLobes', v)} />
            )}
            <Slider label="Speed" value={settings.waveSpeed} min={0} max={10} step={0.1} unit=" rad/s" onChange={(v) => set('waveSpeed', v)} />
            <Slider label="Amp" value={settings.waveAmplitude} min={0} max={1} step={0.01} onChange={(v) => set('waveAmplitude', v)} />
            <Slider label="Peak" value={settings.waveHeight} min={0.5} max={3} step={0.1} unit="x" onChange={(v) => set('waveHeight', v)} />
          </>
        )}
        <Divider />
        <SectionTag>Envelope</SectionTag>
        <Slider label="Env" value={settings.waveEnvelope} min={0} max={1} step={0.01} onChange={(v) => set('waveEnvelope', v)} />
        <Slider label="Env Amp" value={settings.envelopeAmplitude} min={0} max={1} step={0.01} onChange={(v) => set('envelopeAmplitude', v)} />
        <Slider label="Env Sens" value={settings.envelopeSensitivity} min={0} max={1} step={0.01} onChange={(v) => set('envelopeSensitivity', v)} />
        <PillGroup
          label="Mode"
          value={settings.waveMode}
          options={['additive', 'reactive'] as const}
          onChange={(v) => set('waveMode', v)}
        />
      </div>

      {/* Row 3 — Style */}
      <div style={rowStyle}>
        <SectionTag>Style</SectionTag>
        <Slider label="Rotation" value={settings.rotationSpeed} min={0} max={30} step={0.5} unit="°/s" onChange={(v) => set('rotationSpeed', v)} />
        <Toggle label="Round Caps" checked={settings.roundCaps} onChange={(v) => set('roundCaps', v)} />
        <Toggle label="Intensity" checked={settings.intensityOpacity} onChange={(v) => set('intensityOpacity', v)} />
        <ColorSwatch label="Bar" value={settings.barColor} onChange={(v) => set('barColor', v)} />
        <ColorSwatch label="BG" value={settings.previewBg} onChange={(v) => set('previewBg', v)} />
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onResetState}
          style={{
            padding: '4px 10px',
            fontSize: 10,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.05)',
            color: '#9ca3af',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Reset state
        </button>
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
  const [all, setAll] = useState<AllSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_ALL;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_ALL;
      const parsed = JSON.parse(raw) as Partial<AllSettings>;
      return {
        idle: { ...DEFAULT_ALL.idle, ...(parsed.idle ?? {}) },
        thinking: { ...DEFAULT_ALL.thinking, ...(parsed.thinking ?? {}) },
        talking: { ...DEFAULT_ALL.talking, ...(parsed.talking ?? {}) },
      };
    } catch {
      return DEFAULT_ALL;
    }
  });

  // Persist on every change.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [all]);

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

  const updateFocused = (patch: Partial<RadialSettings>) => {
    setAll((prev) => ({ ...prev, [focused]: { ...prev[focused], ...patch } }));
  };

  const resetFocused = () => {
    setAll((prev) => ({ ...prev, [focused]: DEFAULT_ALL[focused] }));
  };

  const resetAll = () => {
    if (window.confirm('Reset all three states to defaults?')) setAll(DEFAULT_ALL);
  };

  const cellsRow = useMemo(
    () => (
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
          />
        ))}
      </div>
    ),
    [all, frequencyData, focused],
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0F0F11',
        padding: '24px 16px 280px',
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
          color: '#fafafa',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 16,
          fontWeight: 500,
          marginTop: 16,
        }}
      >
        <span>Radial states — review</span>
        <button
          type="button"
          onClick={resetAll}
          style={{
            padding: '4px 10px',
            fontSize: 11,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.05)',
            color: '#9ca3af',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
          }}
        >
          Reset all
        </button>
      </div>

      {cellsRow}

      {/* Fixed bottom controls panel — state tabs + sliders for the focused state. */}
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
        <div
          style={{
            background: '#1a1a1e',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
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
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            Editing: {STATE_LABEL[focused]} — saved to localStorage
          </span>
        </div>
        <ControlsPanel
          settings={all[focused]}
          onChange={updateFocused}
          onResetState={resetFocused}
        />
      </div>
    </div>
  );
}
