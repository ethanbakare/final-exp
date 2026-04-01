/**
 * Full-screen scene for the thicken experiment.
 * GentleOrbThicken variant with toggle button, audio controls, and parameter sliders.
 */
import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { AudioData } from "../types";
import { audioService } from "../services/audioService";
import { Mic, MicOff, Music, Square, Repeat, Save, ChevronDown, Trash2, Check, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import GentleOrbThicken from "../variants/GentleOrbThicken";

type AudioMode = "off" | "mic" | "file";

const DEFAULTS = {
  scale: 1.0,
  thinRadius: 0.15,
  thickRadius: 0.25,
  thickenSpeed: 1.2,
  waveIntensity: 0.18,
  breathAmp: 0.015,
  color1: "#FFF5F0",
  color2: "#FFD6C0",
  color3: "#FFC4C4",
  bgColor: "#FFFFFF",
};

type ThickenSettings = typeof DEFAULTS;

interface Profile {
  id: string;
  name: string;
  settings: ThickenSettings;
  lastModified: number;
}

const PROFILE_NAMES = [
  "Kyoto", "Sierra", "Arcadia", "Theta", "Radius", "Nova", "Ember",
  "Glacier", "Prism", "Echo", "Drift", "Pulse", "Bloom", "Helix",
  "Velvet", "Onyx", "Coral", "Zenith", "Amber", "Dusk",
];

const randomName = () => PROFILE_NAMES[Math.floor(Math.random() * PROFILE_NAMES.length)];

async function fetchProfiles(): Promise<Profile[]> {
  try {
    const res = await fetch("/api/thicken-profiles");
    return await res.json();
  } catch { return []; }
}

async function persistProfiles(profiles: Profile[]) {
  try {
    await fetch("/api/thicken-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profiles),
    });
  } catch (e) { console.error("Failed to persist profiles", e); }
}

// ── Hex ↔ HSL helpers ──────────────────────────────────────────
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function transformHex(hex: string, hueDeg: number, satMul: number, lightOff: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h + hueDeg, Math.min(1, s * satMul), Math.min(1, Math.max(0, l + lightOff)));
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({ label, value, min, max, step, unit = "", onChange }) => {
  const decimals = step < 0.1 ? 3 : step < 1 ? 2 : 1;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    const n = parseFloat(draft);
    if (isNaN(n)) return;
    onChange(Math.round(Math.min(max, Math.max(min, n)) / step) * step);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            className="w-20 text-right text-gray-600 tabular-nums bg-gray-100 rounded px-1 outline-none text-sm"
            autoFocus
          />
        ) : (
          <span
            className="text-gray-400 tabular-nums cursor-pointer hover:text-gray-600 transition-colors"
            onClick={() => { setDraft(value.toFixed(decimals)); setEditing(true); }}
          >
            {value.toFixed(decimals)}{unit}
          </span>
        )}
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
};

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

const ColorRow: React.FC<ColorRowProps> = ({ label, value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    setEditing(false);
    let hex = draft.trim();
    if (!hex) return;
    if (!hex.startsWith("#")) hex = "#" + hex;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex.toLowerCase());
    } else if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
      const r = hex[1], g = hex[2], b = hex[3];
      onChange(`#${r}${r}${g}${g}${b}${b}`.toLowerCase());
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
            className="w-20 text-right text-xs text-gray-600 tabular-nums bg-gray-100 rounded px-1 outline-none"
            autoFocus
          />
        ) : (
          <span
            className="text-xs text-gray-400 tabular-nums cursor-pointer hover:text-gray-600 transition-colors"
            onClick={() => { setDraft(value); setEditing(true); }}
          >
            {value}
          </span>
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

const ThickenScene: React.FC = () => {
  const [mode, setMode] = useState<AudioMode>("off");
  const [fileName, setFileName] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<AudioData>({
    bass: 0, mid: 0, treble: 0, rms: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isThick, setIsThick] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Configurable parameters
  const [orbScale, setOrbScale] = useState(DEFAULTS.scale);
  const [thinRadius, setThinRadius] = useState(DEFAULTS.thinRadius);
  const [thickRadius, setThickRadius] = useState(DEFAULTS.thickRadius);
  const [thickenSpeed, setThickenSpeed] = useState(DEFAULTS.thickenSpeed);
  const [waveIntensity, setWaveIntensity] = useState(DEFAULTS.waveIntensity);
  const [breathAmp, setBreathAmp] = useState(DEFAULTS.breathAmp);
  const [color1, setColor1] = useState(DEFAULTS.color1);
  const [color2, setColor2] = useState(DEFAULTS.color2);
  const [color3, setColor3] = useState(DEFAULTS.color3);
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor);

  // Hue shift + saturation + lightness — transform all 3 orb colors together
  const [hueShift, setHueShift] = useState(0);
  const [saturation, setSaturation] = useState(1.0);
  const [lightness, setLightness] = useState(0);
  const baseColorsRef = useRef({ c1: DEFAULTS.color1, c2: DEFAULTS.color2, c3: DEFAULTS.color3 });

  const applyColorTransform = (hue: number, sat: number, light: number) => {
    const base = baseColorsRef.current;
    setColor1(transformHex(base.c1, hue, sat, light));
    setColor2(transformHex(base.c2, hue, sat, light));
    setColor3(transformHex(base.c3, hue, sat, light));
  };

  const handleHueShift = (deg: number) => {
    setHueShift(deg);
    applyColorTransform(deg, saturation, lightness);
  };

  const handleSaturation = (mul: number) => {
    setSaturation(mul);
    applyColorTransform(hueShift, mul, lightness);
  };

  const handleLightness = (off: number) => {
    setLightness(off);
    applyColorTransform(hueShift, saturation, off);
  };

  // When a user manually picks a single color, update the base and reset transforms
  const handleManualColor = (setter: (v: string) => void, key: "c1" | "c2" | "c3") => (v: string) => {
    setter(v);
    baseColorsRef.current[key] = v;
    setHueShift(0);
    setSaturation(1.0);
    setLightness(0);
  };

  // Profiles
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const currentSettings = (): ThickenSettings => ({
    scale: orbScale, thinRadius, thickRadius, thickenSpeed,
    waveIntensity, breathAmp, color1, color2, color3, bgColor,
  });

  const applySettings = (s: ThickenSettings) => {
    setOrbScale(s.scale); setThinRadius(s.thinRadius); setThickRadius(s.thickRadius);
    setThickenSpeed(s.thickenSpeed); setWaveIntensity(s.waveIntensity); setBreathAmp(s.breathAmp);
    setColor1(s.color1); setColor2(s.color2); setColor3(s.color3);
    setBgColor(s.bgColor ?? DEFAULTS.bgColor);
    baseColorsRef.current = { c1: s.color1, c2: s.color2, c3: s.color3 };
    setHueShift(0);
    setSaturation(1.0);
    setLightness(0);
  };

  // Load profiles on mount
  useEffect(() => {
    fetchProfiles().then(setProfiles);
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSaveProfile = async () => {
    const name = newProfileName.trim() || randomName();
    const profile: Profile = {
      id: crypto.randomUUID(),
      name,
      settings: currentSettings(),
      lastModified: Date.now(),
    };
    const next = [...profiles, profile];
    setProfiles(next);
    setActiveProfileId(profile.id);
    setShowSaveDialog(false);
    setNewProfileName("");
    await persistProfiles(next);
  };

  const handleUpdateProfile = async () => {
    if (!activeProfileId) return;
    const next = profiles.map((p) =>
      p.id === activeProfileId ? { ...p, settings: currentSettings(), lastModified: Date.now() } : p
    );
    setProfiles(next);
    await persistProfiles(next);
  };

  const handleDeleteProfile = async (id: string) => {
    const next = profiles.filter((p) => p.id !== id);
    setProfiles(next);
    if (activeProfileId === id) setActiveProfileId(null);
    await persistProfiles(next);
  };

  const loadProfile = (p: Profile) => {
    applySettings(p.settings);
    setActiveProfileId(p.id);
    setShowProfileMenu(false);
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const isDirty = activeProfile
    ? JSON.stringify(currentSettings()) !== JSON.stringify(activeProfile.settings)
    : JSON.stringify(currentSettings()) !== JSON.stringify(DEFAULTS);

  useEffect(() => {
    let raf: number;
    const update = () => {
      if (mode !== "off") {
        setAudioData(audioService.getAudioData());
      } else {
        setAudioData({ bass: 0, mid: 0, treble: 0, rms: 0 });
      }
      raf = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  useEffect(() => {
    return () => { audioService.stop(); };
  }, []);

  // Loop: auto-toggle thick/thin
  useEffect(() => {
    if (!isLooping) return;
    const ms = thickenSpeed * 1000;
    const id = setInterval(() => setIsThick((p) => !p), ms);
    return () => clearInterval(id);
  }, [isLooping, thickenSpeed]);

  const toggleMic = async () => {
    if (mode === "mic") {
      audioService.stop();
      setMode("off");
    } else {
      try {
        await audioService.startMic();
        setMode("mic");
        setFileName(null);
      } catch {
        alert("Could not access microphone.");
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await audioService.startAudioFile(file);
      setMode("file");
      setFileName(file.name);
    } catch {
      alert("Could not play audio file.");
    }
    e.target.value = "";
  };

  const handleFileButtonClick = () => {
    if (mode === "file") {
      audioService.stop();
      setMode("off");
      setFileName(null);
    } else {
      fileInputRef.current?.click();
    }
  };

  const resetDefaults = () => {
    applySettings(DEFAULTS);
    setActiveProfileId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 select-none">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Preview + actions */}
        <div className="lg:col-span-2 flex flex-col items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800">Tube Thicken</h1>
          <p className="text-xs text-gray-400">Toggle thickness and adjust parameters</p>

          <div className="relative w-full max-w-xl aspect-square bg-white rounded-2xl overflow-hidden shadow-md">
            <Canvas
              camera={{ position: [0, 0, 3.5], fov: 45 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true }}
            >
              <color attach="background" args={[bgColor]} />
              <ambientLight intensity={0.5} />
              <GentleOrbThicken
                audioData={audioData}
                goal={isThick ? 1 : 0}
                scale={orbScale}
                thinRadius={thinRadius}
                thickRadius={thickRadius}
                thickenSpeed={thickenSpeed}
                waveIntensity={waveIntensity}
                breathAmp={breathAmp}
                idleAmp={0.04}
                color1={color1}
                color2={color2}
                color3={color3}
              />
            </Canvas>
          </div>

          {/* Thick toggle + audio controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsThick((p) => !p)}
              className="px-6 py-2 rounded-full border border-gray-200 bg-white text-gray-500 text-sm font-medium shadow-sm hover:shadow-md hover:text-gray-700 transition-all cursor-pointer"
            >
              {isThick ? "Thin" : "Thick"}
            </button>

            <button
              onClick={() => setIsLooping((p) => !p)}
              className="rounded-full transition-all duration-300 shadow-sm cursor-pointer"
              style={{ padding: "10px", backgroundColor: isLooping ? "#FFC4C4" : "#FFE4D6" }}
              title="Loop thick/thin"
            >
              <Repeat size={18} color={isLooping ? "#111" : "#888"} />
            </button>

            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileSelect} style={{ display: "none" }} />

            <button
              onClick={toggleMic}
              className="rounded-full transition-all duration-300 shadow-sm cursor-pointer"
              style={{ padding: "10px", backgroundColor: mode === "mic" ? "#FFC4C4" : "#FFE4D6" }}
            >
              {mode === "mic" ? <Mic size={18} color="#111" /> : <MicOff size={18} color="#888" />}
            </button>
            <button
              onClick={handleFileButtonClick}
              className="rounded-full transition-all duration-300 shadow-sm cursor-pointer"
              style={{ padding: "10px", backgroundColor: mode === "file" ? "#FFC4C4" : "#FFE4D6" }}
            >
              {mode === "file" ? <Square size={18} color="#111" /> : <Music size={18} color="#888" />}
            </button>

            {/* Background color picker */}
            <div className="relative h-[38px] w-[38px] shrink-0 rounded-full overflow-hidden shadow-sm border border-gray-200" title="Background color">
              <div className="absolute inset-0 rounded-full" style={{ backgroundColor: bgColor }} />
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {fileName && mode === "file" && (
            <span className="text-xs text-gray-400 max-w-[240px] truncate">{fileName}</span>
          )}
        </div>

        {/* Right: Controls panel */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Controls</h2>
            <button
              onClick={resetDefaults}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Profiles */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Profiles</h3>
            <div className="flex gap-2">
              {/* Profile dropdown */}
              <div className="relative flex-1" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu((p) => !p)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <span className="truncate text-gray-600">
                    {activeProfile ? activeProfile.name : "No profile"}
                  </span>
                  <ChevronDown size={14} className="text-gray-400 shrink-0 ml-1" />
                </button>
                {showProfileMenu && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {profiles.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-400">No profiles saved</div>
                    ) : (
                      profiles.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer group"
                          onClick={() => loadProfile(p)}
                        >
                          {p.id === activeProfileId && <Check size={12} className="text-gray-500 shrink-0" />}
                          <span className={`flex-1 text-sm truncate ${p.id === activeProfileId ? "text-gray-700 font-medium" : "text-gray-600"}`}>
                            {p.name}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteProfile(p.id); }}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Save / Update buttons */}
              {activeProfile && isDirty ? (
                <button
                  onClick={handleUpdateProfile}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Update
                </button>
              ) : null}
              <button
                onClick={() => { setNewProfileName(randomName()); setShowSaveDialog(true); }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <Save size={14} />
              </button>
            </div>

            {/* Save dialog */}
            {showSaveDialog && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveProfile(); if (e.key === "Escape") setShowSaveDialog(false); }}
                  placeholder="Profile name"
                  className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                  autoFocus
                />
                <button
                  onClick={handleSaveProfile}
                  className="text-gray-500 hover:text-green-600 transition-colors cursor-pointer"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Size */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Size</h3>
            <SliderRow label="Orb Scale" value={orbScale} min={0.05} max={2.0} step={0.05} unit="x" onChange={setOrbScale} />
          </div>

          {/* Thickness */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Thickness</h3>
            <SliderRow label="Thin Radius" value={thinRadius} min={0.05} max={0.3} step={0.005} onChange={setThinRadius} />
            <SliderRow label="Thick Radius" value={thickRadius} min={0.15} max={0.45} step={0.005} onChange={setThickRadius} />
            <SliderRow label="Thicken Speed" value={thickenSpeed} min={0.3} max={4.0} step={0.1} unit="s" onChange={setThickenSpeed} />
          </div>

          {/* Motion */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Motion</h3>
            <SliderRow label="Wave Intensity" value={waveIntensity} min={0.02} max={0.5} step={0.01} onChange={setWaveIntensity} />
            <SliderRow label="Breath Amplitude" value={breathAmp} min={0} max={0.1} step={0.005} onChange={setBreathAmp} />
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Colors</h3>
            <SliderRow label="Hue Shift" value={hueShift} min={0} max={360} step={1} unit="°" onChange={handleHueShift} />
            <SliderRow label="Saturation" value={saturation} min={0} max={2.0} step={0.05} unit="x" onChange={handleSaturation} />
            <SliderRow label="Lightness" value={lightness} min={-0.5} max={0.5} step={0.01} onChange={handleLightness} />
            <ColorRow label="Highlight" value={color1} onChange={handleManualColor(setColor1, "c1")} />
            <ColorRow label="Mid Tone" value={color2} onChange={handleManualColor(setColor2, "c2")} />
            <ColorRow label="Edge" value={color3} onChange={handleManualColor(setColor3, "c3")} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ThickenScene;
