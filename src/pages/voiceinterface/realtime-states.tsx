/**
 * Kyoto preview surface for the realtime page's blob states.
 *
 * Linked-profile model: idle, listening, thinking-rest, and talking-rest
 * share `profile.base`. Thinking and talking each carry their own peak
 * overrides that diverge only at peak. JS animator owns all motion so
 * state changes (and thinking pulses) glide smoothly with no shader
 * snap. Persists via /api/studio-profiles?variant=realtime-state, with
 * realtime-state-profiles.json at repo root pre-seeded with Kyoto.
 *
 * Plan: REALTIME_STATES_PLAN.md (v2.4 + patches)
 */
import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Menu, X, Repeat, ChevronDown, Save, Check, Pause, Play, RotateCcw } from 'lucide-react';
import GentleOrbThicken from '@/projects/blob-orb/variants/GentleOrbThicken';
import GalleryAudioControls from '@/projects/blob-orb/components/GalleryAudioControls';
import SliderRow from '@/projects/blob-orb/components/shared/SliderRow';
import ColorRow from '@/projects/blob-orb/components/shared/ColorRow';
import { Slider } from '@/components/ui/slider';
import { audioService } from '@/projects/blob-orb/services/audioService';
import type { AudioData } from '@/projects/voiceinterface/types';

// ── Types ─────────────────────────────────────────────────────────

type PreviewState = 'idle' | 'listening' | 'thinking' | 'talking';
type PeakScope = 'thinking' | 'talking';
type ControlTab = 'size' | 'thickness' | 'motion' | 'colours';

interface BaseSettings {
  scale: number;
  thinRadius: number;
  thickenSpeed: number;
  waveIntensity: number;
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
  waveIntensity?: number;
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
  settings: LinkedProfile;
  lastModified: number;
}

interface RenderValues {
  scale: number;
  thickRadius: number;
  thickenSpeed: number; // animator bookkeeping; not passed to shader
  waveIntensity: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
}

// ── Constants ─────────────────────────────────────────────────────

const KYOTO_SEED: LinkedProfile = {
  base: {
    scale: 0.5,
    thinRadius: 0.15,
    thickenSpeed: 1.2,
    waveIntensity: 0.18,
    breathAmp: 0.015,
    idleAmp: 0.04,
    color1: '#080602',
    color2: '#efff08',
    color3: '#693a22',
    bgColor: '#fffafa',
  },
  thinking: { thickRadius: 0.25 },
  talking: {},
};

const STATES: PreviewState[] = ['idle', 'listening', 'thinking', 'talking'];
const TALKING_GEOMETRY = 1.0;
const SILENT: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };
const API = '/api/studio-profiles?variant=realtime-state';

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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

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
    breathAmp: base.breathAmp,
    idleAmp: base.idleAmp,
    color1: base.color1,
    color2: base.color2,
    color3: base.color3,
  };
}

function lerpRender(a: RenderValues, b: RenderValues, t: number): RenderValues {
  return {
    scale: lerp(a.scale, b.scale, t),
    thickRadius: lerp(a.thickRadius, b.thickRadius, t),
    thickenSpeed: lerp(a.thickenSpeed, b.thickenSpeed, t),
    waveIntensity: lerp(a.waveIntensity, b.waveIntensity, t),
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
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
};

// ── Local PeakColorRow ───────────────────────────────────────────

interface PeakColorRowProps {
  label: string;
  value: string;
  inherited: boolean;
  onChange: (v: string) => void;
  onReset?: () => void;
}

const PeakColorRow: React.FC<PeakColorRowProps> = ({
  label,
  value,
  inherited,
  onChange,
  onReset,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const labelClass = inherited ? 'text-sm text-gray-400' : 'text-sm text-gray-700';
  const commit = () => {
    setEditing(false);
    let hex = draft.trim();
    if (!hex) return;
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex.toLowerCase());
    } else if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
      const r = hex[1],
        g = hex[2],
        b = hex[3];
      onChange(`#${r}${r}${g}${g}${b}${b}`.toLowerCase());
    }
  };
  return (
    <div className="flex items-center justify-between">
      <span className={labelClass}>{label}</span>
      <div className="flex items-center gap-2">
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
            className="w-20 text-right text-xs text-gray-600 tabular-nums bg-gray-100 rounded px-1 outline-none"
            autoFocus
          />
        ) : (
          <span
            className="text-xs text-gray-400 tabular-nums cursor-pointer hover:text-gray-600 transition-colors"
            onClick={() => {
              setDraft(value);
              setEditing(true);
            }}
          >
            {value}
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
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-gray-200 shadow-sm">
          <div className="absolute inset-0" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────

export default function RealtimeStates() {
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [activeId, setActiveId] = useState<string>('rt-kyoto');
  const [profile, setProfile] = useState<LinkedProfile>(KYOTO_SEED);
  const [activeBaseline, setActiveBaseline] = useState<LinkedProfile>(KYOTO_SEED);
  const [state, setState] = useState<PreviewState>('idle');
  const [autoLoop, setAutoLoop] = useState(false);
  const [audioActive, setAudioActive] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>(SILENT);
  const [render, setRender] = useState<RenderValues>(() => baseRender(KYOTO_SEED.base));
  const [activeTab, setActiveTab] = useState<ControlTab | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [thinkingPaused, setThinkingPaused] = useState(false);

  const profileRef = useRef(profile);
  const stateRef = useRef(state);
  const renderRef = useRef(render);
  const pulseRef = useRef({ phase: 0, dir: 1 });
  const lastTsRef = useRef(performance.now());
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(thinkingPaused);
  pausedRef.current = thinkingPaused;

  profileRef.current = profile;
  stateRef.current = state;
  renderRef.current = render;

  // ── First-load: fetch + defensive recreate (§10.2) ───────────
  useEffect(() => {
    fetchProfiles().then(async (arr) => {
      if (arr.length === 0) {
        const seedEntry: SavedProfile = {
          id: 'rt-kyoto',
          name: 'Kyoto',
          settings: KYOTO_SEED,
          lastModified: Date.now(),
        };
        const next = [seedEntry];
        await persistProfiles(next);
        setProfiles(next);
        setActiveId(seedEntry.id);
        setProfile(seedEntry.settings);
        setActiveBaseline(seedEntry.settings);
      } else {
        setProfiles(arr);
        const first = arr[0];
        setActiveId(first.id);
        setProfile(first.settings);
        setActiveBaseline(first.settings);
      }
    });
  }, []);

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
      const talkingR = {
        ...pickPeak(p.talking, p.base),
        thickRadius: TALKING_GEOMETRY,
      };

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

      const tau = Math.max(0.05, target.thickenSpeed) * 0.5;
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
  const activeName = activeProfile?.name ?? 'Kyoto';

  const selectProfile = (id: string) => {
    const found = profiles.find((p) => p.id === id);
    if (!found) return;
    setActiveId(id);
    setProfile(found.settings);
    setActiveBaseline(found.settings);
    setShowProfileDropdown(false);
  };

  const handleSave = async () => {
    const name = saveName.trim();
    if (!name) return;
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

    switch (tab) {
      case 'size': {
        const restRow = (
          <SliderRow
            label={`Scale${restSuffix}`}
            value={profile.base.scale}
            min={0.05}
            max={0.72}
            step={0.01}
            unit="x"
            onChange={(v) => setBase({ scale: v })}
          />
        );
        if (!isPeakState) return restRow;
        const inherited = !peakHas(peakScope, 'scale');
        const eff = peakEff(peakScope, 'scale') as number;
        return (
          <div className="space-y-3">
            {restRow}
            <PeakSliderRow
              label="Scale (Peak)"
              value={eff}
              min={0.05}
              max={0.72}
              step={0.01}
              unit="x"
              inherited={inherited}
              onChange={(v) => setPeak(peakScope, { scale: v })}
              onReset={inherited ? undefined : () => clearPeak(peakScope, 'scale')}
            />
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
        // Thicken Speed has no immediate visible effect on idle/listening
        // (those states aren't morphing), so show the value but mute it.
        const speedRest = (
          <SliderRow
            label={`Thicken Speed${restSuffix}`}
            value={profile.base.thickenSpeed}
            min={0.3}
            max={4.0}
            step={0.1}
            unit="s"
            disabled={!isPeakState}
            onChange={(v) => setBase({ thickenSpeed: v })}
          />
        );
        if (state === 'idle' || state === 'listening') {
          return (
            <div className="space-y-3">
              {thinRest}
              {speedRest}
            </div>
          );
        }
        const speedInherited = !peakHas(peakScope, 'thickenSpeed');
        const speedEff = peakEff(peakScope, 'thickenSpeed') as number;
        const speedPeak = (
          <PeakSliderRow
            label="Thicken Speed (Peak)"
            value={speedEff}
            min={0.3}
            max={4.0}
            step={0.1}
            unit="s"
            inherited={speedInherited}
            onChange={(v) => setPeak(peakScope, { thickenSpeed: v })}
            onReset={speedInherited ? undefined : () => clearPeak(peakScope, 'thickenSpeed')}
          />
        );
        if (state === 'thinking') {
          const tInherited = !peakHas('thinking', 'thickRadius');
          const tEff = (profile.thinking.thickRadius ?? profile.base.thinRadius) as number;
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
              {speedRest}
              {speedPeak}
            </div>
          );
        }
        // talking: italic note in place of Peak Radius row
        return (
          <div className="space-y-3">
            {thinRest}
            <div className="text-xs text-gray-400 italic">
              Geometry pinned to sphere — no peak slider.
            </div>
            {speedRest}
            {speedPeak}
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
            <ColorRow
              label={`Highlight${restSuffix}`}
              value={profile.base.color1}
              onChange={(v) => setBase({ color1: v })}
            />
            <ColorRow
              label={`Mid Tone${restSuffix}`}
              value={profile.base.color2}
              onChange={(v) => setBase({ color2: v })}
            />
            <ColorRow
              label={`Edge${restSuffix}`}
              value={profile.base.color3}
              onChange={(v) => setBase({ color3: v })}
            />
            <ColorRow
              label={`Background${restSuffix}`}
              value={profile.base.bgColor}
              onChange={(v) => setBase({ bgColor: v })}
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
              inherited={c1Inh}
              onChange={(v) => setPeak(peakScope, { color1: v })}
              onReset={c1Inh ? undefined : () => clearPeak(peakScope, 'color1')}
            />
            <PeakColorRow
              label="Mid Tone (Peak)"
              value={c2}
              inherited={c2Inh}
              onChange={(v) => setPeak(peakScope, { color2: v })}
              onReset={c2Inh ? undefined : () => clearPeak(peakScope, 'color2')}
            />
            <PeakColorRow
              label="Edge (Peak)"
              value={c3}
              inherited={c3Inh}
              onChange={(v) => setPeak(peakScope, { color3: v })}
              onReset={c3Inh ? undefined : () => clearPeak(peakScope, 'color3')}
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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: profile.base.bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        padding: '48px 16px 200px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <GalleryAudioControls onAudioActive={setAudioActive} />

      <div style={{ width: 400, height: 400 }}>
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
        >
          <color attach="background" args={[profile.base.bgColor]} />
          <ambientLight intensity={0.5} />
          <GentleOrbThicken
            audioData={blobAudioData}
            goal={1}
            scale={render.scale}
            thinRadius={profile.base.thinRadius}
            thickRadius={render.thickRadius}
            thickenSpeed={0.05}
            waveIntensity={render.waveIntensity}
            breathAmp={render.breathAmp}
            idleAmp={render.idleAmp}
            color1={render.color1}
            color2={render.color2}
            color3={render.color3}
          />
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
                <span className="truncate text-gray-600 max-w-[120px]">{activeName}</span>
                <ChevronDown size={12} className="text-gray-400 shrink-0" />
              </button>
              {showProfileDropdown && (
                <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {profiles.map((p) => (
                    <div
                      key={p.id}
                      className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 ${
                        p.id === activeId ? 'font-medium text-gray-700' : 'text-gray-600'
                      }`}
                      onClick={() => selectProfile(p.id)}
                    >
                      {p.name}
                    </div>
                  ))}
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
                <div
                  key={i}
                  className="relative h-6 w-6 rounded-full border border-gray-200 overflow-hidden shrink-0"
                  style={{ backgroundColor: swatchValue(i) }}
                  title={state === 'idle' || state === 'listening' ? 'Rest' : 'Peak'}
                >
                  <input
                    type="color"
                    value={swatchValue(i)}
                    onChange={(e) => swatchSet(i, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
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
                  className="w-28 px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  className="text-gray-500 hover:text-green-600 transition-colors cursor-pointer"
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
                  setSaveName('');
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
