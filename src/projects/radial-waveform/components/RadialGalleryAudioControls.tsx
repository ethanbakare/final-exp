import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Play, Pause, Square, Volume2, VolumeX,
  Music, Upload, Trash2, Loader,
} from "lucide-react";
import { audioService } from "../services/audioService";
import type { AudioEntry } from "../services/audioService";

interface Props {
  onAudioActive: (active: boolean) => void;
}

const RadialGalleryAudioControls: React.FC<Props> = ({ onAudioActive }) => {
  const [mode, setMode] = useState<"off" | "mic" | "file">("off");
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [entries, setEntries] = useState<AudioEntry[]>([]);
  const [loadProgress, setLoadProgress] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch file list, then pre-fetch each as a blob
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/audio-files");
        const files: string[] = await res.json();
        if (cancelled || files.length === 0) return;
        setEntries(files.map(name => ({ name, blob: null })));
        setLoadProgress(0);
        let loaded = 0;
        for (const name of files) {
          if (cancelled) return;
          try {
            const resp = await fetch(`/audio/${encodeURIComponent(name)}`);
            const blob = await resp.blob();
            if (cancelled) return;
            setEntries(prev => prev.map(e => e.name === name ? { ...e, blob } : e));
          } catch { /* skip */ }
          loaded++;
          setLoadProgress(Math.round((loaded / files.length) * 100));
        }
        setLoadProgress(null);
      } catch { setLoadProgress(null); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { audioService.stop(); };
  }, []);

  const playBlob = useCallback(async (blob: Blob, name: string) => {
    const file = new File([blob], name, { type: blob.type });
    await audioService.startAudioFile(file);
    setMode("file");
    setFileName(name);
    setIsPaused(false);
    onAudioActive(true);
    setShowDropdown(false);
  }, [onAudioActive]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await audioService.startAudioFile(file);
    setMode("file"); setFileName(file.name); setIsPaused(false);
    onAudioActive(true);
    try {
      const resp = await fetch("/api/audio-files", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream", "x-filename": file.name },
        body: file,
      });
      const { name: savedName } = await resp.json();
      const blob = file.slice();
      setEntries(prev => prev.some(en => en.name === savedName) ? prev : [...prev, { name: savedName, blob }]);
    } catch { /* ignore */ }
    e.target.value = "";
    setShowDropdown(false);
  };

  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/audio-files?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      setEntries(prev => prev.filter(en => en.name !== name));
      if (fileName === name && mode === "file") {
        audioService.stop(); setMode("off"); setFileName(null); onAudioActive(false);
      }
    } catch { /* ignore */ }
  };

  const toggleMic = async () => {
    if (mode === "mic") {
      audioService.stop(); setMode("off"); setFileName(null); onAudioActive(false);
    } else {
      try {
        await audioService.startMic(); setMode("mic"); setFileName(null); setIsPaused(false); onAudioActive(true);
      } catch { alert("Could not access microphone."); }
    }
  };

  const togglePlayPause = async () => {
    if (mode !== "file") return;
    if (isPaused) { await audioService.resume(); setIsPaused(false); }
    else { audioService.pause(); setIsPaused(true); }
  };

  const handleStop = () => {
    audioService.stop(); setMode("off"); setFileName(null); setIsPaused(false); onAudioActive(false);
  };

  const toggleMute = () => {
    const next = !isMuted; setIsMuted(next); audioService.setMuted(next);
  };

  const btnBase = "rounded-full transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-center";
  const btnSize = "h-8 w-8";

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#1a1a1e]/90 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 shadow-lg">
      {/* File picker */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(p => !p)}
          className={`${btnBase} ${btnSize} ${mode === "file" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}`}
        >
          <Music size={14} className={mode === "file" ? "text-white" : "text-gray-400"} />
        </button>
        {showDropdown && (
          <div className="absolute top-full right-0 mt-1 w-56 bg-[#1a1a1e] border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
            {loadProgress !== null && (
              <div className="px-3 py-1.5 text-xs text-gray-500 flex items-center gap-1.5">
                <Loader size={10} className="animate-spin" /> Loading… {loadProgress}%
              </div>
            )}
            {entries.length === 0 && loadProgress === null ? (
              <div className="px-3 py-2 text-xs text-gray-500">No audio files</div>
            ) : entries.map(entry => (
              <div
                key={entry.name}
                className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-white/5 flex items-center group ${fileName === entry.name ? "font-medium text-white" : "text-gray-400"}`}
                onClick={() => entry.blob && playBlob(entry.blob, entry.name)}
              >
                <span className="truncate flex-1">
                  {entry.blob === null && <Loader size={10} className="inline animate-spin mr-1" />}
                  {entry.name}
                </span>
                <button
                  className="ml-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-400 transition-opacity p-0.5"
                  onClick={e => handleDelete(entry.name, e)}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
            <div className="border-t border-white/5">
              <div
                className="px-3 py-1.5 text-xs cursor-pointer hover:bg-white/5 text-gray-500 flex items-center gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={12} /> Upload file…
              </div>
            </div>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} style={{ display: "none" }} />
      </div>

      {/* Play/Pause */}
      {mode === "file" && (
        <button onClick={togglePlayPause} className={`${btnBase} ${btnSize} bg-white/5 hover:bg-white/10`}>
          {isPaused ? <Play size={14} className="text-gray-300" /> : <Pause size={14} className="text-gray-300" />}
        </button>
      )}

      {/* Stop */}
      {mode !== "off" && (
        <button onClick={handleStop} className={`${btnBase} ${btnSize} bg-white/5 hover:bg-white/10`}>
          <Square size={12} className="text-gray-300" />
        </button>
      )}

      {/* Mute */}
      {mode !== "off" && (
        <button onClick={toggleMute} className={`${btnBase} ${btnSize} ${isMuted ? "bg-amber-500/20" : "bg-white/5 hover:bg-white/10"}`}>
          {isMuted ? <VolumeX size={14} className="text-amber-400" /> : <Volume2 size={14} className="text-gray-300" />}
        </button>
      )}

      {/* Mic */}
      <button onClick={toggleMic} className={`${btnBase} ${btnSize} ${mode === "mic" ? "bg-red-500/20" : "bg-white/5 hover:bg-white/10"}`}>
        {mode === "mic" ? <Mic size={14} className="text-red-400" /> : <MicOff size={14} className="text-gray-400" />}
      </button>

      {/* Current file name */}
      {fileName && mode === "file" && (
        <span className="text-xs text-gray-500 max-w-[120px] truncate ml-1">{fileName}</span>
      )}
    </div>
  );
};

export default RadialGalleryAudioControls;
