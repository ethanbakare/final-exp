import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { audioService } from "../services/audioService";
import { DEFAULT_CONFIG } from "../constants";
import { AudioData } from "../types";
import { Mic, MicOff, Music, Square } from "lucide-react";

const MiniScene = dynamic(() => import("./MiniScene"), { ssr: false });
const LayeredSineWaves = dynamic(
  () => import("../variants/archived/LayeredSineWaves"),
  { ssr: false }
);
const DenseSineWavesA = dynamic(
  () => import("../variants/archived/DenseSineWavesA"),
  { ssr: false }
);
const CoralStone = dynamic(
  () => import("../variants/CoralStone"),
  { ssr: false }
);
const GentleOrb = dynamic(
  () => import("../variants/GentleOrb"),
  { ssr: false }
);
const GentleOrbTorus = dynamic(
  () => import("../variants/GentleOrbTorus"),
  { ssr: false }
);
const CoralStoneTorus = dynamic(
  () => import("../variants/archived/CoralStoneTorus"),
  { ssr: false }
);

type AudioMode = "off" | "mic" | "file";

const config = {
  ...DEFAULT_CONFIG,
  maxDisplacement: 0.18,
};

const SineWaveCompare: React.FC = () => {
  const [mode, setMode] = useState<AudioMode>("off");
  const [fileName, setFileName] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<AudioData>({
    bass: 0,
    mid: 0,
    treble: 0,
    rms: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    return () => {
      audioService.stop();
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-32 select-none">
      <h1 className="text-center text-lg font-semibold text-gray-700 mb-2">
        Sine Wave Variants
      </h1>
      <p className="text-center text-xs text-gray-400 mb-6">
        Sphere vs Torus — GentleOrb and CoralStone
      </p>

      {/* 3x2 grid: top row = spheres, bottom row = torus */}
      <div className="max-w-5xl mx-auto grid grid-cols-3 gap-5">
        <MiniScene label="GentleOrb (sphere)">
          <GentleOrb audioData={audioData} config={config} />
        </MiniScene>
        <MiniScene label="CoralStone (sphere)">
          <CoralStone audioData={audioData} config={config} />
        </MiniScene>
        <MiniScene label="Original (8 waves)">
          <LayeredSineWaves audioData={audioData} config={config} />
        </MiniScene>
        <MiniScene label="GentleOrbTorus">
          <GentleOrbTorus audioData={audioData} config={config} />
        </MiniScene>
        <MiniScene label="CoralStoneTorus">
          <CoralStoneTorus audioData={audioData} config={config} />
        </MiniScene>
        <MiniScene label="Highlight Only (archived)">
          <DenseSineWavesA audioData={audioData} config={config} />
        </MiniScene>
      </div>

      {/* Audio controls */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <div className="fixed bottom-8 left-0 w-full flex flex-col items-center gap-3 pointer-events-none z-10">
        {fileName && mode === "file" && (
          <span className="text-xs text-gray-400 max-w-[240px] truncate">
            {fileName}
          </span>
        )}
        <div className="flex gap-4 pointer-events-auto">
          <button
            onClick={toggleMic}
            className="rounded-full transition-all duration-300 shadow-lg cursor-pointer"
            style={{
              padding: "16px",
              backgroundColor: mode === "mic" ? "#FFC4C4" : "#FFE4D6",
            }}
          >
            {mode === "mic" ? (
              <Mic size={22} color="#111" />
            ) : (
              <MicOff size={22} color="#888" />
            )}
          </button>
          <button
            onClick={handleFileButtonClick}
            className="rounded-full transition-all duration-300 shadow-lg cursor-pointer"
            style={{
              padding: "16px",
              backgroundColor: mode === "file" ? "#FFC4C4" : "#FFE4D6",
            }}
          >
            {mode === "file" ? (
              <Square size={22} color="#111" />
            ) : (
              <Music size={22} color="#888" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SineWaveCompare;
