/**
 * Kyoto preview surface for the realtime page's blob states.
 * Linked-profile model: base shared by idle/listening/thinking-rest/
 * talking-rest; thinking and talking each carry override scopes for
 * their peak-state values. JS animator lerps current → target every
 * frame so state changes (and thinking pulses) glide smoothly with
 * no shader-side snap.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Menu, X, Repeat } from 'lucide-react';
import GentleOrbThicken from '@/projects/blob-orb/variants/GentleOrbThicken';
import GalleryAudioControls from '@/projects/blob-orb/components/GalleryAudioControls';
import SliderRow from '@/projects/blob-orb/components/shared/SliderRow';
import ColorRow from '@/projects/blob-orb/components/shared/ColorRow';
import { audioService } from '@/projects/blob-orb/services/audioService';
import type { AudioData } from '@/projects/voiceinterface/types';

type PreviewState = 'idle' | 'listening' | 'thinking' | 'talking';
type ScopeKey = 'base' | 'thinking' | 'talking';
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

interface OverrideScope {
  scale?: number;
  thickRadius?: number;       // only meaningful for thinking
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
  thinking: OverrideScope;
  talking: OverrideScope;
}

const KYOTO_PROFILE: LinkedProfile = {
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

const SILENT: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };
const STATES: PreviewState[] = ['idle', 'listening', 'thinking', 'talking'];
const TALKING_GEOMETRY = 1.0; // sphere collapse — pinned, not user-editable

interface RenderValues {
  scale: number;
  thickRadius: number;
  thickenSpeed: number;
  waveIntensity: number;
  breathAmp: number;
  idleAmp: number;
  color1: string;
  color2: string;
  color3: string;
}

function pickOverrides(scope: OverrideScope, base: BaseSettings): RenderValues {
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

function baseRenderValues(base: BaseSettings): RenderValues {
  return {
    scale: base.scale,
    thickRadius: base.thinRadius, // resting torus thickness
    thickenSpeed: base.thickenSpeed,
    waveIntensity: base.waveIntensity,
    breathAmp: base.breathAmp,
    idleAmp: base.idleAmp,
    color1: base.color1,
    color2: base.color2,
    color3: base.color3,
  };
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

export default function RealtimeStates() {
  const [profile, setProfile] = useState<LinkedProfile>(KYOTO_PROFILE);
  const [state, setState] = useState<PreviewState>('idle');
  const [autoLoop, setAutoLoop] = useState(false);
  const [audioActive, setAudioActive] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>(SILENT);
  const [render, setRender] = useState<RenderValues>(() =>
    baseRenderValues(KYOTO_PROFILE.base)
  );
  const [activeScope, setActiveScope] = useState<ScopeKey>('base');
  const [activeTab, setActiveTab] = useState<ControlTab | null>(null);
  const [expanded, setExpanded] = useState(false);

  const profileRef = useRef(profile);
  const stateRef = useRef(state);
  const renderRef = useRef(render);
  const pulseRef = useRef({ phase: 0, dir: 1 }); // 0..1 thinking pulse progress
  const rafRef = useRef(0);
  const lastTsRef = useRef(performance.now());

  profileRef.current = profile;
  stateRef.current = state;
  renderRef.current = render;

  // Audio polling
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setAudioData(audioActive ? audioService.getAudioData() : SILENT);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [audioActive]);

  // Auto-loop state cycling
  useEffect(() => {
    if (!autoLoop) return;
    const id = setInterval(() => {
      setState((p) => STATES[(STATES.indexOf(p) + 1) % STATES.length]);
    }, 2500);
    return () => clearInterval(id);
  }, [autoLoop]);

  // Audio start → talking once
  useEffect(() => {
    if (audioActive) setState('talking');
  }, [audioActive]);

  // JS animator — single source of truth for visible values.
  // Computes target each frame from current state and lerps current
  // toward it with an exponential approach whose tau matches the
  // active scope's thickenSpeed. Thinking adds a pulse oscillation.
  useEffect(() => {
    const animate = (ts: number) => {
      const dt = Math.min((ts - lastTsRef.current) / 1000, 1 / 30);
      lastTsRef.current = ts;

      const p = profileRef.current;
      const s = stateRef.current;
      const cur = renderRef.current;

      const baseR = baseRenderValues(p.base);
      const thinkingR = pickOverrides(p.thinking, p.base);
      const talkingR = {
        ...pickOverrides(p.talking, p.base),
        thickRadius: TALKING_GEOMETRY,
      };

      let target: RenderValues;
      if (s === 'idle' || s === 'listening') {
        target = baseR;
      } else if (s === 'talking') {
        target = talkingR;
      } else {
        // Thinking: oscillate pulseRef.phase 0↔1, lerp baseR ↔ thinkingR
        const pulseSpeed = 1 / Math.max(0.05, thinkingR.thickenSpeed);
        pulseRef.current.phase += dt * pulseSpeed * pulseRef.current.dir;
        if (pulseRef.current.phase >= 1) {
          pulseRef.current.phase = 1;
          pulseRef.current.dir = -1;
        } else if (pulseRef.current.phase <= 0) {
          pulseRef.current.phase = 0;
          pulseRef.current.dir = 1;
        }
        const t = pulseRef.current.phase;
        const eased = t * t * (3 - 2 * t);
        target = lerpRender(baseR, thinkingR, eased);
      }

      // Reset pulse when leaving thinking so we re-enter cleanly
      if (s !== 'thinking') {
        pulseRef.current.phase = 0;
        pulseRef.current.dir = 1;
      }

      // Exponential lerp current → target. tau scales with thickenSpeed
      // so faster speeds chase the target faster.
      const tau = Math.max(0.05, target.thickenSpeed) * 0.5;
      const alpha = 1 - Math.exp(-dt / tau);
      const next = lerpRender(cur, target, alpha);

      setRender(next);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => () => audioService.stop(), []);

  // ── Scope mutation ───────────────────────────────────────────
  const setBase = (patch: Partial<BaseSettings>) =>
    setProfile((p) => ({ ...p, base: { ...p.base, ...patch } }));

  const setOverride = (scope: 'thinking' | 'talking', patch: Partial<OverrideScope>) =>
    setProfile((p) => ({ ...p, [scope]: { ...p[scope], ...patch } }));

  // Effective settings for the active scope's controls (so unset
  // overrides display the inherited base value).
  const activeSettings: BaseSettings & { thickRadius: number } = (() => {
    const baseT = profile.thinking.thickRadius ?? KYOTO_PROFILE.thinking.thickRadius!;
    if (activeScope === 'base') {
      return { ...profile.base, thickRadius: baseT };
    }
    const ovr = activeScope === 'thinking' ? profile.thinking : profile.talking;
    return {
      scale: ovr.scale ?? profile.base.scale,
      thinRadius: profile.base.thinRadius,
      thickenSpeed: ovr.thickenSpeed ?? profile.base.thickenSpeed,
      waveIntensity: ovr.waveIntensity ?? profile.base.waveIntensity,
      breathAmp: ovr.breathAmp ?? profile.base.breathAmp,
      idleAmp: ovr.idleAmp ?? profile.base.idleAmp,
      color1: ovr.color1 ?? profile.base.color1,
      color2: ovr.color2 ?? profile.base.color2,
      color3: ovr.color3 ?? profile.base.color3,
      bgColor: profile.base.bgColor,
      thickRadius: activeScope === 'thinking' ? (profile.thinking.thickRadius ?? baseT) : TALKING_GEOMETRY,
    };
  })();

  const setSetting = <K extends keyof BaseSettings>(key: K, v: BaseSettings[K]) => {
    if (activeScope === 'base') {
      setBase({ [key]: v } as Partial<BaseSettings>);
    } else if (key !== 'bgColor' && key !== 'thinRadius') {
      setOverride(activeScope, { [key]: v } as Partial<OverrideScope>);
    }
  };

  const setThickRadius = (v: number) => {
    if (activeScope === 'thinking') setOverride('thinking', { thickRadius: v });
    // base/talking: ignored (talking pinned, base doesn't have it)
  };

  // ── Tab definitions ──────────────────────────────────────────
  const tabs: { key: ControlTab; label: string }[] = [
    { key: 'size', label: 'Size' },
    { key: 'thickness', label: 'Thickness' },
    { key: 'motion', label: 'Motion' },
    { key: 'colours', label: 'Colours' },
  ];

  const renderTabControls = (tab: ControlTab) => {
    const s = activeSettings;
    switch (tab) {
      case 'size':
        return (
          <SliderRow
            label="Orb Scale"
            value={s.scale}
            min={0.05}
            max={0.72}
            step={0.01}
            unit="x"
            onChange={(v) => setSetting('scale', v)}
          />
        );
      case 'thickness':
        return (
          <div className="space-y-3">
            {activeScope === 'base' && (
              <SliderRow
                label="Thin Radius"
                value={s.thinRadius}
                min={0.05}
                max={0.3}
                step={0.005}
                onChange={(v) => setBase({ thinRadius: v })}
              />
            )}
            {activeScope === 'thinking' && (
              <SliderRow
                label="Thick Radius (pulse target)"
                value={s.thickRadius}
                min={0.15}
                max={0.45}
                step={0.005}
                onChange={setThickRadius}
              />
            )}
            {activeScope === 'talking' && (
              <div className="text-xs text-gray-400 italic">
                Talking geometry is pinned to a sphere ({TALKING_GEOMETRY.toFixed(2)}). Use Colours
                or Motion to differentiate the talking peak.
              </div>
            )}
            <SliderRow
              label="Thicken Speed"
              value={s.thickenSpeed}
              min={0.3}
              max={4.0}
              step={0.1}
              unit="s"
              onChange={(v) => setSetting('thickenSpeed', v)}
            />
          </div>
        );
      case 'motion':
        return (
          <div className="space-y-3">
            <SliderRow
              label="Wave Intensity"
              value={s.waveIntensity}
              min={0.02}
              max={0.5}
              step={0.01}
              onChange={(v) => setSetting('waveIntensity', v)}
            />
            <SliderRow
              label="Idle Intensity"
              value={s.idleAmp * 100}
              min={0}
              max={20}
              step={0.5}
              unit="%"
              onChange={(v) => setSetting('idleAmp', v / 100)}
            />
            <SliderRow
              label="Breath Amplitude"
              value={s.breathAmp}
              min={0}
              max={0.1}
              step={0.005}
              onChange={(v) => setSetting('breathAmp', v)}
            />
          </div>
        );
      case 'colours':
        return (
          <div className="space-y-3">
            <ColorRow
              label="Highlight"
              value={s.color1}
              onChange={(v) => setSetting('color1', v)}
            />
            <ColorRow
              label="Mid Tone"
              value={s.color2}
              onChange={(v) => setSetting('color2', v)}
            />
            <ColorRow
              label="Edge"
              value={s.color3}
              onChange={(v) => setSetting('color3', v)}
            />
            {activeScope === 'base' && (
              <ColorRow
                label="Background"
                value={s.bgColor}
                onChange={(v) => setBase({ bgColor: v })}
              />
            )}
          </div>
        );
    }
  };

  const toggleTab = (tab: ControlTab) => {
    if (expanded) return;
    setActiveTab((p) => (p === tab ? null : tab));
  };

  const colorSwatches: string[] = [
    activeSettings.color1,
    activeSettings.color2,
    activeSettings.color3,
  ];

  const scopePills: { key: ScopeKey; label: string }[] = [
    { key: 'base', label: 'Base' },
    { key: 'thinking', label: 'Thinking →' },
    { key: 'talking', label: 'Talking →' },
  ];

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
            audioData={audioData}
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

      {/* State pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {STATES.map((st) => (
          <button
            key={st}
            onClick={() => {
              setAutoLoop(false);
              setState(st);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: state === st ? '1px solid #333' : '1px solid #ddd',
              background: state === st ? '#333' : '#fff',
              color: state === st ? '#fff' : '#333',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {st}
          </button>
        ))}
      </div>

      <button
        onClick={() => setAutoLoop((p) => !p)}
        title="Cycle states"
        style={{
          padding: 10,
          borderRadius: 999,
          border: 'none',
          background: autoLoop ? '#FFC4C4' : '#FFE4D6',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Repeat size={18} color={autoLoop ? '#111' : '#888'} />
      </button>

      {/* Bottom control bar — mirrors GalleryNavBar structure */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {!expanded && activeTab && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
            <div className="max-w-3xl mx-auto p-4">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {tabs.find((t) => t.key === activeTab)?.label} —{' '}
                {scopePills.find((s) => s.key === activeScope)?.label}
              </h3>
              {renderTabControls(activeTab)}
            </div>
          </div>
        )}

        {expanded && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg max-h-[60vh] overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4">
              <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">
                Editing: {scopePills.find((s) => s.key === activeScope)?.label}
              </div>
              <div className="flex gap-6">
                {tabs.map((tab) => (
                  <div key={tab.key} className="flex-1 min-w-[200px]">
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

            <div className="flex items-center gap-1">
              {scopePills.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveScope(s.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                    activeScope === s.key
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-gray-200" />

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

            <div className="flex items-center gap-1 ml-2">
              {colorSwatches.map((c, i) => (
                <div
                  key={i}
                  className="relative h-6 w-6 rounded-full border border-gray-200 overflow-hidden shrink-0"
                  style={{ backgroundColor: c }}
                >
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => {
                      const key = (['color1', 'color2', 'color3'] as const)[i];
                      setSetting(key, e.target.value);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
