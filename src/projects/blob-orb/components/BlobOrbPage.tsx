import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { audioService } from "../services/audioService";
import { DEFAULT_CONFIG } from "../constants";
import { AudioData } from "../types";
import { Mic, MicOff, Music, Square } from "lucide-react";

// Dynamic import to avoid SSR issues with Three.js
const Scene = dynamic(() => import("./Scene"), { ssr: false });

type AudioMode = "off" | "mic" | "file";

const BlobOrbPage: React.FC = () => {
  const [mode, setMode] = useState<AudioMode>("off");
  const [fileName, setFileName] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<AudioData>({
    bass: 0,
    mid: 0,
    treble: 0,
    rms: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio processing loop
  useEffect(() => {
    let animationFrameId: number;

    const update = () => {
      if (mode !== "off") {
        setAudioData(audioService.getAudioData());
      } else {
        setAudioData({ bass: 0, mid: 0, treble: 0, rms: 0 });
      }
      animationFrameId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [mode]);

  // Cleanup on unmount
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
      } catch (_e) {
        alert(
          "Could not access microphone. Please ensure permissions are granted."
        );
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
    } catch (_e) {
      alert("Could not play audio file.");
    }

    // Reset input so the same file can be re-selected
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
    <div className="relative w-full h-screen bg-white overflow-hidden select-none">
      <Scene audioData={audioData} config={DEFAULT_CONFIG} />

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <div className="absolute bottom-12 left-0 w-full flex flex-col items-center gap-3 pointer-events-none">
        {/* File name label */}
        {fileName && mode === "file" && (
          <span
            style={{
              fontSize: "13px",
              color: "#888",
              maxWidth: "240px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {fileName}
          </span>
        )}

        <div className="flex gap-4 pointer-events-auto">
          {/* Mic button */}
          <button
            onClick={toggleMic}
            className="rounded-full transition-all duration-300 shadow-lg cursor-pointer"
            style={{
              padding: "20px",
              backgroundColor: mode === "mic" ? "#FFC4C4" : "#FFE4D6",
            }}
          >
            {mode === "mic" ? (
              <Mic size={28} color="#111" />
            ) : (
              <MicOff size={28} color="#888" />
            )}
          </button>

          {/* Audio file button */}
          <button
            onClick={handleFileButtonClick}
            className="rounded-full transition-all duration-300 shadow-lg cursor-pointer"
            style={{
              padding: "20px",
              backgroundColor: mode === "file" ? "#FFC4C4" : "#FFE4D6",
            }}
          >
            {mode === "file" ? (
              <Square size={28} color="#111" />
            ) : (
              <Music size={28} color="#888" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlobOrbPage;
