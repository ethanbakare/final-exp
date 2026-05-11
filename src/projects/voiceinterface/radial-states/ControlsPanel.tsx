/**
 * ControlsPanel — radial-waveform per-state editor.
 *
 * Extracted from radial-states/index.tsx so the realtime-states editor
 * can reuse the same controls when a radial profile is active.
 *
 * The panel is purely presentational: it takes a `RadialSettings`
 * (materialised view of the focused state from a `RadialLinkedProfile`),
 * a backdrop config, morph timings, and change callbacks; it does not
 * own any persistence or link-propagation state. The parent decides
 * how to apply the patches (see `applyPatch` + `materializeState` on
 * the radial-states page, or RadialEditorPanel in realtime-states).
 *
 * Helpers exported alongside (`Slider`, `Toggle`, `ColorSwatch`,
 * `PillGroup`) are general-purpose UI primitives. Other surfaces can
 * import them too if needed.
 */
import React, { useState } from 'react';
import type { RadialSettings } from '@/projects/radial-waveform/types';
import type { RadialBackdrop } from './api';
import type { RadialState } from './types';
import { ColorPickerButton } from './ColorPicker';

// ── UI primitives ──────────────────────────────────────────────────

export function Slider({
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

export function Toggle({
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

export function ColorSwatch({
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

export function PillGroup<T extends string>({
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

// ── ControlsPanel ──────────────────────────────────────────────────

export interface ControlsPanelProps {
  settings: RadialSettings;
  /** Baseline (last-saved) values for the focused state — used to
   *  decide which fields are dirty and to drive per-field reset. When
   *  null, no reset icons render. */
  baselineSettings: RadialSettings | null;
  onChange: (patch: Partial<RadialSettings>) => void;
  /** Hover signal for the Max Bar Length slider — drives the red ghost
   *  ring on the focused cell (radial-states page only; pass a no-op
   *  on surfaces that don't show the ghost ring). */
  onMaxBarHover: (hover: boolean) => void;
  /** Which state the panel is currently editing — used to conditionally
   *  show talking-only controls (e.g. the bar-count lock). */
  focused: RadialState;
  /** Profile-level: lock all cells to idle's bar count. Toggle visible
   *  only on the Talking state's Geometry panel. */
  lockBarCount: boolean;
  onLockBarCountChange: (v: boolean) => void;
  /** When focused === 'talking' and lockBarCount is on, the effective
   *  bar gap is derived from the locked count over talking's smaller
   *  circumference. Undefined otherwise (slider is live). */
  talkingDerivedGap: number | undefined;
  /** Gap between the donut's inner edge and talking's bar root.
   *  Only shown / editable when focused === 'talking'. */
  talkingInnerGap: number;
  onTalkingInnerGapChange: (v: number) => void;
  /** Profile-level backdrop config + setter (shared across all states). */
  backdrop: Required<RadialBackdrop>;
  baselineBackdrop: Required<RadialBackdrop> | null;
  onBackdropChange: (patch: Partial<RadialBackdrop>) => void;
  /** Morph subsection — visible only in tune mode AND only when focused
   *  is thinking or talking (the states involved in the morphs). */
  showMorphSubsection: boolean;
  morph: { idleToThinking: number; thinkingToTalking: number; reactiveStartAt: number };
  onMorphChange: (
    patch: Partial<{ idleToThinking: number; thinkingToTalking: number; reactiveStartAt: number }>,
  ) => void;
  /** Listening-link state. When focused is listening and link is on,
   *  the panel renders read-only with a Break-link button. */
  idleListeningLinked: boolean;
  onBreakLink: () => void;
}

export function ControlsPanel({
  settings,
  baselineSettings,
  onChange,
  onMaxBarHover,
  focused,
  lockBarCount,
  onLockBarCountChange,
  talkingDerivedGap,
  talkingInnerGap,
  onTalkingInnerGapChange,
  backdrop,
  baselineBackdrop,
  onBackdropChange,
  showMorphSubsection,
  morph,
  onMorphChange,
  idleListeningLinked,
  onBreakLink,
}: ControlsPanelProps) {
  if (focused === 'listening' && idleListeningLinked) {
    return (
      <div
        id="controls-panel"
        style={{
          background: '#0F0F11',
          padding: '20px 32px',
          color: '#9ca3af',
          fontSize: 13,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span>Linked to Idle — listening mirrors idle&apos;s settings while linked.</span>
        <button
          type="button"
          onClick={onBreakLink}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#e5e7eb',
            borderRadius: 999,
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Break link
        </button>
      </div>
    );
  }
  const set = <K extends keyof RadialSettings>(key: K, value: RadialSettings[K]) =>
    onChange({ [key]: value } as Partial<RadialSettings>);
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
        {focused === 'talking' ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280' }}>
            <span style={{ color: '#9ca3af' }}>Radius</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {settings.radius}px <span style={{ color: '#4b5563' }}>(from idle)</span>
            </span>
          </div>
        ) : (
          <Slider label="Radius" value={settings.radius} min={30} max={200} step={1} unit="px" onChange={(v) => set('radius', v)} onReset={settingReset('radius')} />
        )}
        {focused === 'talking' && (
          <Slider
            label="Inner gap"
            value={talkingInnerGap}
            min={0}
            max={60}
            step={1}
            unit="px"
            onChange={onTalkingInnerGapChange}
          />
        )}
        <Slider label="Bar Width" value={settings.barWidth} min={0.5} max={10} step={0.5} unit="px" onChange={(v) => set('barWidth', v)} onReset={settingReset('barWidth')} />
        {focused === 'talking' && talkingDerivedGap != null ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280' }}>
            <span style={{ color: '#9ca3af' }}>Bar Gap</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {talkingDerivedGap.toFixed(1)}px <span style={{ color: '#4b5563' }}>(calculated)</span>
            </span>
          </div>
        ) : (
          <Slider label="Bar Gap" value={settings.barGap} min={0} max={12} step={0.5} unit="px" onChange={(v) => set('barGap', v)} onReset={settingReset('barGap')} />
        )}
        <Slider label="Min Bar Length" value={settings.minBarLength} min={0} max={30} step={1} unit="px" onChange={(v) => set('minBarLength', v)} onReset={settingReset('minBarLength')} />
        <div
          onMouseEnter={() => onMaxBarHover(true)}
          onMouseLeave={() => onMaxBarHover(false)}
        >
          <Slider label="Max Bar Length" value={settings.maxBarLength} min={10} max={120} step={1} unit="px" onChange={(v) => set('maxBarLength', v)} onReset={settingReset('maxBarLength')} />
        </div>
        {focused === 'talking' && (
          <Toggle
            label="Lock bars to idle"
            checked={lockBarCount}
            onChange={onLockBarCountChange}
          />
        )}
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
            <span>Cell</span>
            <ColorPickerButton
              value={settings.previewBg}
              onChange={(v) => set('previewBg', v)}
              title="Cell background"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af' }}>
            <span>Page</span>
            <ColorPickerButton
              value={settings.bgColor}
              onChange={(v) => set('bgColor', v)}
              title="Page background"
            />
          </div>
        </div>

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

      {showMorphSubsection && (
        <div style={columnStyle}>
          <h3 style={headerStyle}>Morph</h3>
          {focused === 'thinking' && (
            <Slider
              label="Idle ↔ Thinking"
              value={morph.idleToThinking}
              min={0.05}
              max={2}
              step={0.05}
              unit="s"
              onChange={(v) => onMorphChange({ idleToThinking: v })}
            />
          )}
          <Slider
            label="Thinking ↔ Talking"
            value={morph.thinkingToTalking}
            min={0.1}
            max={3}
            step={0.05}
            unit="s"
            onChange={(v) => onMorphChange({ thinkingToTalking: v })}
          />
          <Slider
            label="Reactive Start"
            value={morph.reactiveStartAt}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => onMorphChange({ reactiveStartAt: v })}
          />
        </div>
      )}
    </div>
  );
}
