/**
 * GalleryAudioControls – Floating audio panel (top-right).
 *
 * File picker dropdown (lists public/audio/ files + upload),
 * Play/Pause/Stop, Mute, Loop toggle, Mic input.
 *
 * Audio files are pre-fetched as blobs on page load so playback
 * always goes through the working blob→MediaElementSource pipeline.
 * Uploads save to disk and play in parallel.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Play, Pause, Square, Volume2, VolumeX,
  Music, Upload, Trash2, Loader, Check, X,
} from "lucide-react";
import { audioService } from "../services/audioService";

interface GalleryAudioControlsProps {
  onAudioActive: (active: boolean) => void;
}

interface AudioEntry {
  name: string;
  blob: Blob | null; // null while loading
}

const GalleryAudioControls: React.FC<GalleryAudioControlsProps> = ({
  onAudioActive,
}) => {
  const [mode, setMode] = useState<"off" | "mic" | "file">("off");
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [entries, setEntries] = useState<AudioEntry[]>([]);
  const [loadProgress, setLoadProgress] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
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

        // Init entries with null blobs
        setEntries(files.map((name) => ({ name, blob: null })));
        setLoadProgress(0);

        let loaded = 0;
        for (const name of files) {
          if (cancelled) return;
          try {
            const resp = await fetch(`/audio/${encodeURIComponent(name)}`);
            const blob = await resp.blob();
            if (cancelled) return;
            setEntries((prev) =>
              prev.map((e) => (e.name === name ? { ...e, blob } : e))
            );
          } catch {
            // Skip files that fail to fetch
          }
          loaded++;
          setLoadProgress(Math.round((loaded / files.length) * 100));
        }
        setLoadProgress(null);
      } catch {
        setLoadProgress(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setConfirmingDelete(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { audioService.stop(); };
  }, []);

  // Play from a pre-fetched blob
  const playBlob = useCallback(async (blob: Blob, name: string) => {
    try {
      const file = new File([blob], name, { type: blob.type });
      await audioService.startAudioFile(file);
      setMode("file");
      setFileName(name);
      setIsPaused(false);
      onAudioActive(true);
    } catch (err) {
      console.error("[GalleryAudio] playBlob failed:", err);
      alert("Could not play audio file.");
    }
    setShowDropdown(false);
  }, [onAudioActive]);

  // Upload: play immediately + save to disk in parallel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Pipeline 1: Play the blob immediately
    const playPromise = (async () => {
      try {
        await audioService.startAudioFile(file);
        setMode("file");
        setFileName(file.name);
        setIsPaused(false);
        onAudioActive(true);
      } catch (err) {
        console.error("[GalleryAudio] upload play failed:", err);
        alert("Could not play audio file.");
      }
    })();

    // Pipeline 2: Save to disk in the background
    const savePromise = (async () => {
      try {
        const resp = await fetch("/api/audio-files", {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream", "x-filename": file.name },
          body: file,
        });
        const { name: savedName } = await resp.json();
        // Add to entries with the blob already available
        const blob = file.slice();
        setEntries((prev) => {
          if (prev.some((e) => e.name === savedName)) return prev;
          return [...prev, { name: savedName, blob }];
        });
      } catch (err) {
        console.error("[GalleryAudio] upload save failed:", err);
      }
    })();

    await Promise.all([playPromise, savePromise]);
    e.target.value = "";
    setShowDropdown(false);
  };

  // Delete an audio file
  const handleDelete = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/audio-files?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((entry) => entry.name !== name));
      // If currently playing this file, stop
      if (fileName === name && mode === "file") {
        audioService.stop();
        setMode("off");
        setFileName(null);
        onAudioActive(false);
      }
    } catch (err) {
      console.error("[GalleryAudio] delete failed:", err);
    }
  };

  const toggleMic = async () => {
    if (mode === "mic") {
      audioService.stop();
      setMode("off");
      setFileName(null);
      onAudioActive(false);
    } else {
      try {
        await audioService.startMic();
        setMode("mic");
        setFileName(null);
        setIsPaused(false);
        onAudioActive(true);
      } catch {
        alert("Could not access microphone.");
      }
    }
  };

  const togglePlayPause = async () => {
    if (mode !== "file") return;
    if (isPaused) {
      await audioService.resume();
      setIsPaused(false);
    } else {
      audioService.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    audioService.stop();
    setMode("off");
    setFileName(null);
    setIsPaused(false);
    onAudioActive(false);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioService.setMuted(next);
  };

  const btnBase = "rounded-full transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-center";
  const btnSize = "h-8 w-8";

  return (
    <div className="fixed top-4 right-36 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
      {/* File picker */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown((p) => !p)}
          className={`${btnBase} ${btnSize} ${mode === "file" ? "bg-pink-100" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          <Music size={14} className={mode === "file" ? "text-gray-800" : "text-gray-500"} />
        </button>
        {showDropdown && (
          <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {loadProgress !== null && (
              <div className="px-3 py-1.5 text-xs text-gray-400 flex items-center gap-1.5">
                <Loader size={10} className="animate-spin" />
                Loading audio… {loadProgress}%
              </div>
            )}
            {entries.length === 0 && loadProgress === null ? (
              <div className="px-3 py-2 text-xs text-gray-400">No audio files found</div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.name}
                  className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 flex items-center group ${
                    fileName === entry.name ? "font-medium text-gray-700" : "text-gray-600"
                  }`}
                  onClick={() => entry.blob && playBlob(entry.blob, entry.name)}
                >
                  <span className="truncate flex-1">
                    {entry.blob === null && <Loader size={10} className="inline animate-spin mr-1" />}
                    {entry.name}
                  </span>
                  {confirmingDelete === entry.name ? (
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        className="p-0.5 text-green-500 hover:text-green-600 transition-colors"
                        onClick={(e) => {
                          handleDelete(entry.name, e);
                          setConfirmingDelete(null);
                        }}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        className="p-0.5 text-red-400 hover:text-red-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmingDelete(null);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="ml-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-500 transition-opacity p-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingDelete(entry.name);
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))
            )}
            <div className="border-t border-gray-100">
              <div
                className="px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 text-gray-500 flex items-center gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={12} />
                Upload file...
              </div>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
      </div>

      {/* Play/Pause (file mode only) */}
      {mode === "file" && (
        <button
          onClick={togglePlayPause}
          className={`${btnBase} ${btnSize} bg-gray-100 hover:bg-gray-200`}
        >
          {isPaused
            ? <Play size={14} className="text-gray-600" />
            : <Pause size={14} className="text-gray-600" />}
        </button>
      )}

      {/* Stop */}
      {mode !== "off" && (
        <button
          onClick={handleStop}
          className={`${btnBase} ${btnSize} bg-gray-100 hover:bg-gray-200`}
        >
          <Square size={12} className="text-gray-600" />
        </button>
      )}

      {/* Mute */}
      {mode !== "off" && (
        <button
          onClick={toggleMute}
          className={`${btnBase} ${btnSize} ${isMuted ? "bg-amber-50" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          {isMuted
            ? <VolumeX size={14} className="text-amber-600" />
            : <Volume2 size={14} className="text-gray-600" />}
        </button>
      )}

      {/* Mic */}
      <button
        onClick={toggleMic}
        className={`${btnBase} ${btnSize} ${mode === "mic" ? "bg-pink-100" : "bg-gray-100 hover:bg-gray-200"}`}
      >
        {mode === "mic"
          ? <Mic size={14} className="text-gray-800" />
          : <MicOff size={14} className="text-gray-500" />}
      </button>

      {/* Current file name */}
      {fileName && mode === "file" && (
        <span className="text-xs text-gray-400 max-w-[120px] truncate ml-1">
          {fileName}
        </span>
      )}
    </div>
  );
};

export default GalleryAudioControls;
