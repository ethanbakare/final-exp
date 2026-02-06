/**
 * Full-screen scene for the metal torus thicken experiment.
 * MetalTorusThicken variant with toggle, audio controls, and parameter sliders
 * including PBR-specific properties (metalness, roughness, envMapIntensity).
 *
 * Layout matches ThickenScene: light bg, canvas in white card, controls on right.
 */
import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { AudioData } from "../types";
import { audioService } from "../services/audioService";
import { Mic, MicOff, Music, Square, Repeat } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import MetalTorusThicken from "../variants/MetalTorusThicken";

type AudioMode = "off" | "mic" | "file";

const DEFAULTS = {
  scale: 1.0,
  thinRadius: 0.15,
  thickRadius: 0.3,
  thickenSpeed: 1.2,
  waveIntensity: 0.18,
  breathAmp: 0.015,
  metalness: 1.0,
  roughness: 0.08,
  envMapIntensity: 1.2,
  metalColor: "#c0c0c7",
  bgColor: "#1a1a1a",
};

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

const MetalThickenScene: React.FC = () => {
  const [mode, setMode] = useState<AudioMode>("off");
  const [fileName, setFileName] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<AudioData>({
    bass: 0, mid: 0, treble: 0, rms: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isThick, setIsThick] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Parameters
  const [orbScale, setOrbScale] = useState(DEFAULTS.scale);
  const [thinRadius, setThinRadius] = useState(DEFAULTS.thinRadius);
  const [thickRadius, setThickRadius] = useState(DEFAULTS.thickRadius);
  const [thickenSpeed, setThickenSpeed] = useState(DEFAULTS.thickenSpeed);
  const [waveIntensity, setWaveIntensity] = useState(DEFAULTS.waveIntensity);
  const [breathAmp, setBreathAmp] = useState(DEFAULTS.breathAmp);
  const [metalness, setMetalness] = useState(DEFAULTS.metalness);
  const [roughness, setRoughness] = useState(DEFAULTS.roughness);
  const [envMapIntensity, setEnvMapIntensity] = useState(DEFAULTS.envMapIntensity);
  const [metalColor, setMetalColor] = useState(DEFAULTS.metalColor);
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor);

  // Audio loop
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
    setOrbScale(DEFAULTS.scale);
    setThinRadius(DEFAULTS.thinRadius);
    setThickRadius(DEFAULTS.thickRadius);
    setThickenSpeed(DEFAULTS.thickenSpeed);
    setWaveIntensity(DEFAULTS.waveIntensity);
    setBreathAmp(DEFAULTS.breathAmp);
    setMetalness(DEFAULTS.metalness);
    setRoughness(DEFAULTS.roughness);
    setEnvMapIntensity(DEFAULTS.envMapIntensity);
    setMetalColor(DEFAULTS.metalColor);
    setBgColor(DEFAULTS.bgColor);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 select-none">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Preview + actions */}
        <div className="lg:col-span-2 flex flex-col items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-800">Metal Torus Thicken</h1>
          <p className="text-xs text-gray-400">Toggle thickness and adjust PBR parameters</p>

          <div className="relative w-full max-w-xl aspect-square bg-white rounded-2xl overflow-hidden shadow-md">
            <Canvas
              camera={{ position: [0, 0, 3.5], fov: 45 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true }}
            >
              <color attach="background" args={[bgColor]} />
              <ambientLight intensity={0.5} />
              <Environment preset="studio" />
              <MetalTorusThicken
                audioData={audioData}
                goal={isThick ? 1 : 0}
                scale={orbScale}
                thinRadius={thinRadius}
                thickRadius={thickRadius}
                thickenSpeed={thickenSpeed}
                waveIntensity={waveIntensity}
                breathAmp={breathAmp}
                idleAmp={0.04}
                metalness={metalness}
                roughness={roughness}
                envMapIntensity={envMapIntensity}
                metalColor={metalColor}
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

          {/* Metal PBR */}
          <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Metal</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Color</span>
              <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-gray-200 shadow-sm">
                <div className="absolute inset-0" style={{ backgroundColor: metalColor }} />
                <input
                  type="color"
                  value={metalColor}
                  onChange={(e) => setMetalColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <SliderRow label="Metalness" value={metalness} min={0} max={1.0} step={0.01} onChange={setMetalness} />
            <SliderRow label="Roughness" value={roughness} min={0} max={1.0} step={0.01} onChange={setRoughness} />
            <SliderRow label="Env Map Intensity" value={envMapIntensity} min={0} max={3.0} step={0.05} onChange={setEnvMapIntensity} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetalThickenScene;
