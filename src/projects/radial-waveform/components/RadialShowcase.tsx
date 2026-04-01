import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Play, Pause, Square, Volume2, VolumeX,
  Music, Upload, Trash2, Loader,
} from "lucide-react";
import RadialOutward from "../variants/RadialOutward";
import RadialBidirectional from "../variants/RadialBidirectional";
import RadialInward from "../variants/RadialInward";

/* ── Audio engine (self-contained, no blob-orb dependency) ── */

class RadialAudioService {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private activeMode: "mic" | "file" | null = null;
  private muted = false;
  private gainNode: GainNode | null = null;

  async init() {
    if (this.context) return;
    const Ctor = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.context = new Ctor();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = this.muted ? 0 : 1;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async startMic() {
    this.stop();
    await this.init();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.stream = stream;
    if (this.context && this.analyser) {
      const src = this.context.createMediaStreamSource(stream);
      src.connect(this.analyser);
      this.source = src;
      this.activeMode = "mic";
      if (this.context.state === "suspended") await this.context.resume();
    }
  }

  async startAudioFile(file: File) {
    this.stop();
    await this.init();
    if (!this.context || !this.analyser || !this.gainNode) return;
    const url = URL.createObjectURL(file);
    this.audioElement = new Audio(url);
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.loop = true;
    const src = this.context.createMediaElementSource(this.audioElement);
    src.connect(this.analyser);
    this.analyser.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.source = src;
    this.activeMode = "file";
    if (this.context.state === "suspended") await this.context.resume();
    await this.audioElement.play();
  }

  async startAudioUrl(url: string) {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const file = new File([blob], "audio", { type: blob.type });
    await this.startAudioFile(file);
  }

  pause() { this.audioElement?.pause(); }
  async resume() { await this.audioElement?.play(); }
  setMuted(m: boolean) { this.muted = m; if (this.gainNode) this.gainNode.gain.value = m ? 0 : 1; }
  isMuted() { return this.muted; }
  isPaused() { return this.audioElement ? this.audioElement.paused : true; }
  getActiveMode() { return this.activeMode; }

  stop() {
    if (this.audioElement) { this.audioElement.pause(); this.audioElement.src = ""; this.audioElement = null; }
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    if (this.source) { this.source.disconnect(); this.source = null; }
    if (this.analyser) { this.analyser.disconnect(); }
    if (this.gainNode) { this.gainNode.disconnect(); this.gainNode = null; }
    if (this.context && this.context.state !== "closed") { this.context.close(); this.context = null; }
    this.analyser = null;
    this.dataArray = null;
    this.activeMode = null;
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.dataArray) return null;
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }
}

/* ── Audio file entry ── */
interface AudioEntry { name: string; blob: Blob | null; }

/* ── Component ── */

export default function RadialShowcase() {
  const audioRef = useRef(new RadialAudioService());
  const rafRef = useRef<number>(0);

  const [mode, setMode] = useState<"off" | "mic" | "file">("off");
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [entries, setEntries] = useState<AudioEntry[]>([]);
  const [loadProgress, setLoadProgress] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Frequency data pushed to variants each frame
  const [freqData, setFreqData] = useState<Uint8Array | null>(null);

  // Animation loop — poll analyser each frame
  useEffect(() => {
    const tick = () => {
      const data = audioRef.current.getFrequencyData();
      if (data) {
        setFreqData(new Uint8Array(data));
      } else {
        setFreqData(null);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Fetch audio file list
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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => { audio.stop(); };
  }, []);

  /* ── Audio handlers ── */

  const playBlob = useCallback(async (blob: Blob, name: string) => {
    const file = new File([blob], name, { type: blob.type });
    await audioRef.current.startAudioFile(file);
    setMode("file"); setFileName(name); setIsPaused(false);
    setShowDropdown(false);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Play immediately
    await audioRef.current.startAudioFile(file);
    setMode("file"); setFileName(file.name); setIsPaused(false);
    // Save to disk in background
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
      if (fileName === name && mode === "file") { audioRef.current.stop(); setMode("off"); setFileName(null); }
    } catch { /* ignore */ }
  };

  const toggleMic = async () => {
    if (mode === "mic") {
      audioRef.current.stop(); setMode("off"); setFileName(null);
    } else {
      try { await audioRef.current.startMic(); setMode("mic"); setFileName(null); setIsPaused(false); }
      catch { alert("Could not access microphone."); }
    }
  };

  const togglePlayPause = async () => {
    if (mode !== "file") return;
    if (isPaused) { await audioRef.current.resume(); setIsPaused(false); }
    else { audioRef.current.pause(); setIsPaused(true); }
  };

  const handleStop = () => {
    audioRef.current.stop(); setMode("off"); setFileName(null); setIsPaused(false);
  };

  const toggleMute = () => {
    const next = !isMuted; setIsMuted(next); audioRef.current.setMuted(next);
  };

  /* ── Shared variant props ── */
  const sharedProps = {
    frequencyData: freqData,
    radius: 100,
    barWidth: 2,
    barGap: 4,
    minBarLength: 3,
    maxBarLength: 40,
    sensitivity: 1.8,
    barColor: "#FFFFFF",
    bgColor: "#0F0F11",
    segments: 8,
    roundCaps: true,
    intensityOpacity: true,
    updateRate: 0,
    rotationSpeed: 0,
    ambientWave: true,
    waveSpeed: 2,
    waveAmplitude: 0.15,
    waveHeight: 1.5,
    waveMode: "additive" as const,
    waveShape: "sine" as const,
    waveLobes: 2,
    smoothing: 0,
    waveEnvelope: 0,
    envelopeAmplitude: 0,
    envelopeSensitivity: 0,
  };

  const btnBase = "rounded-full transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-center";
  const btnSize = "h-9 w-9";

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white p-6 select-none">
      {/* Header + Audio Controls */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Radial Waveform</h1>
        <p className="text-gray-500 text-sm mb-6">Three variants — outward, bidirectional, inward + rotation</p>

        {/* Audio control bar */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          {/* File picker */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(p => !p)}
              className={`${btnBase} ${btnSize} ${mode === "file" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"}`}
            >
              <Music size={15} className={mode === "file" ? "text-white" : "text-gray-400"} />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#1a1a1e] border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
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
              {isPaused ? <Play size={15} className="text-gray-300" /> : <Pause size={15} className="text-gray-300" />}
            </button>
          )}

          {/* Stop */}
          {mode !== "off" && (
            <button onClick={handleStop} className={`${btnBase} ${btnSize} bg-white/5 hover:bg-white/10`}>
              <Square size={13} className="text-gray-300" />
            </button>
          )}

          {/* Mute */}
          {mode !== "off" && (
            <button onClick={toggleMute} className={`${btnBase} ${btnSize} ${isMuted ? "bg-amber-500/20" : "bg-white/5 hover:bg-white/10"}`}>
              {isMuted ? <VolumeX size={15} className="text-amber-400" /> : <Volume2 size={15} className="text-gray-300" />}
            </button>
          )}

          {/* Mic */}
          <button onClick={toggleMic} className={`${btnBase} ${btnSize} ${mode === "mic" ? "bg-red-500/20" : "bg-white/5 hover:bg-white/10"}`}>
            {mode === "mic" ? <Mic size={15} className="text-red-400" /> : <MicOff size={15} className="text-gray-400" />}
          </button>

          {/* File name */}
          {fileName && mode === "file" && (
            <span className="text-xs text-gray-500 max-w-[140px] truncate ml-1">{fileName}</span>
          )}
        </div>
      </div>

      {/* Variants grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outward */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex items-center justify-center">
            <RadialOutward {...sharedProps} />
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">Outward</span>
        </div>

        {/* Bidirectional */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex items-center justify-center">
            <RadialBidirectional {...sharedProps} inwardRatio={0.3} />
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">Bidirectional</span>
        </div>

        {/* Inward + Rotation */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex items-center justify-center">
            <RadialInward {...sharedProps} maxBarLength={70} rotationSpeed={6} />
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">Inward + Rotation</span>
        </div>
      </div>
    </div>
  );
}
