import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LinearSettings,
  LinearProfile,
  LINEAR_DEFAULTS,
  LINEAR_API_KEY,
  pickUnusedName,
} from "../types";
import { audioService } from "../../../radial-waveform/services/audioService";
import LinearWaveform from "../LinearWaveform";
import LinearNavBar from "./LinearNavBar";

// Audio controls (inline, matching radial showcase pattern)
import { Music, Play, Pause, Square, Mic, MicOff, Volume2, VolumeX, Upload } from "lucide-react";
import type { AudioEntry } from "../../../radial-waveform/services/audioService";

const DEFAULT_ID = "default";

/* ── API helpers ── */

async function fetchProfiles(): Promise<LinearProfile[]> {
  try {
    const res = await fetch(`/api/studio-profiles?variant=${LINEAR_API_KEY}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch { return []; }
}

async function persistProfiles(profiles: LinearProfile[]) {
  try {
    await fetch(`/api/studio-profiles?variant=${LINEAR_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profiles),
    });
  } catch { /* ignore */ }
}

/* ── Component ── */

export default function LinearPlayground() {
  // ── State ──
  const [profiles, setProfiles] = useState<LinearProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState(DEFAULT_ID);
  const [editingSettings, setEditingSettings] = useState<LinearSettings>({ ...LINEAR_DEFAULTS });

  const [audioActive, setAudioActive] = useState(false);
  const [freqData, setFreqData] = useState<Uint8Array | null>(null);

  // Audio controls state
  const [audioMode, setAudioMode] = useState<"off" | "mic" | "file">("off");
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [entries, setEntries] = useState<AudioEntry[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPaddingHGuide, setShowPaddingHGuide] = useState(false);
  const [showPaddingVGuide, setShowPaddingVGuide] = useState(false);
  const [showWaveDebug, setShowWaveDebug] = useState(false);
  const [isPreviewColorHovered, setIsPreviewColorHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Ref that always mirrors the latest profiles state ──
  // Callbacks read from this ref instead of closed-over state,
  // so they always see the current profiles regardless of when
  // the closure was created.
  const profilesRef = useRef<LinearProfile[]>([]);
  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  // Same pattern for activeProfileId
  const activeProfileIdRef = useRef(DEFAULT_ID);
  useEffect(() => {
    activeProfileIdRef.current = activeProfileId;
  }, [activeProfileId]);

  // Same pattern for editingSettings
  const editingSettingsRef = useRef<LinearSettings>({ ...LINEAR_DEFAULTS });
  useEffect(() => {
    editingSettingsRef.current = editingSettings;
  }, [editingSettings]);

  // ── Derived ──
  const isDefaultActive = activeProfileId === DEFAULT_ID;
  const activeProfile = isDefaultActive ? null : profiles.find(p => p.id === activeProfileId) ?? null;
  const activeProfileName = isDefaultActive ? "Default" : activeProfile?.name ?? "Default";
  const bookmarkCount = profiles.filter(p => p.bookmarked).length;

  const isDirty = (() => {
    if (isDefaultActive) return JSON.stringify(LINEAR_DEFAULTS) !== JSON.stringify(editingSettings);
    if (!activeProfile) return false;
    const stored = { ...LINEAR_DEFAULTS, ...activeProfile.settings };
    return JSON.stringify(stored) !== JSON.stringify(editingSettings);
  })();

  // ── Audio loop ──
  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (audioActive) {
        const data = audioService.getFrequencyData();
        setFreqData(data ? new Uint8Array(data) : null);
      } else {
        setFreqData(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioActive]);

  // ── Load audio entries ──
  useEffect(() => {
    fetch("/api/audio-files")
      .then(r => r.json())
      .then(async (names: string[]) => {
        const loaded: AudioEntry[] = [];
        for (const name of names) {
          try {
            const r = await fetch(`/audio/${encodeURIComponent(name)}`);
            loaded.push({ name, blob: r.ok ? await r.blob() : null });
          } catch { loaded.push({ name, blob: null }); }
        }
        setEntries(loaded);
      })
      .catch(() => {});
  }, []);

  // ── Fetch profiles ──
  useEffect(() => {
    fetchProfiles().then(setProfiles);
  }, []);

  // ── Audio controls ──
  const startMic = async () => {
    await audioService.init();
    await audioService.startMic();
    setAudioMode("mic");
    setAudioActive(true);
    setFileName(null);
  };

  const playFile = async (entry: AudioEntry) => {
    if (!entry.blob) return;
    await audioService.init();
    const file = new File([entry.blob], entry.name);
    await audioService.startAudioFile(file);
    setAudioMode("file");
    setAudioActive(true);
    setFileName(entry.name);
    setIsPaused(false);
    setShowDropdown(false);
  };

  const stopAudio = () => {
    audioService.stop();
    setAudioMode("off");
    setAudioActive(false);
    setFileName(null);
    setIsPaused(false);
    setIsMuted(false);
  };

  const togglePause = () => {
    if (isPaused) { audioService.resume(); setIsPaused(false); }
    else { audioService.pause(); setIsPaused(true); }
  };

  const toggleMute = () => {
    audioService.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      await fetch("/api/audio-files", { method: "POST", body: form });
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      setEntries(prev => [...prev, { name: file.name, blob }]);
    } catch { /* ignore */ }
  };

  // ── Profile CRUD ──
  // All callbacks read from refs (always current) instead of
  // closed-over state. No stale closure issues.

  const selectProfileById = useCallback((profileId: string) => {
    setActiveProfileId(profileId);
    if (profileId === DEFAULT_ID) {
      setEditingSettings({ ...LINEAR_DEFAULTS });
    } else {
      // Read from ref — always the latest profiles array
      const p = profilesRef.current.find(pr => pr.id === profileId);
      if (p) setEditingSettings({ ...LINEAR_DEFAULTS, ...p.settings });
    }
  }, []); // No dependencies — reads from ref

  const handleProfileSelect = useCallback((index: number) => {
    if (index === -1) {
      selectProfileById(DEFAULT_ID);
    } else {
      // Read from ref — always the latest profiles array
      const current = profilesRef.current;
      if (current[index]) selectProfileById(current[index].id);
    }
  }, [selectProfileById]);

  const saveProfile = useCallback(async (name: string) => {
    const settings = editingSettingsRef.current;
    const current = profilesRef.current;
    const profile: LinearProfile = {
      id: `l-${crypto.randomUUID()}`,
      name,
      settings: { ...settings },
      lastModified: Date.now(),
    };
    const next = [...current, profile];
    setProfiles(next);
    setActiveProfileId(profile.id);
    await persistProfiles(next);
  }, []);

  const updateProfile = useCallback(async () => {
    const id = activeProfileIdRef.current;
    if (id === DEFAULT_ID) return;
    const settings = editingSettingsRef.current;
    const current = profilesRef.current;
    const next = current.map(p =>
      p.id === id ? { ...p, settings: { ...settings }, lastModified: Date.now() } : p
    );
    setProfiles(next);
    await persistProfiles(next);
  }, []);

  const toggleBookmark = useCallback(async () => {
    const id = activeProfileIdRef.current;
    if (id === DEFAULT_ID) return;
    const current = profilesRef.current;
    const next = current.map(p =>
      p.id === id ? { ...p, bookmarked: !p.bookmarked } : p
    );
    setProfiles(next);
    await persistProfiles(next);
  }, []);

  const handleReset = useCallback(() => {
    setEditingSettings({ ...LINEAR_DEFAULTS });
    setActiveProfileId(DEFAULT_ID);
  }, []);

  const handleSettingsChange = useCallback((partial: Partial<LinearSettings>) => {
    setEditingSettings(prev => ({ ...prev, ...partial }));
  }, []);

  // ── Container styling ──
  const containerStyle: React.CSSProperties = {
    paddingLeft: editingSettings.containerPadding,
    paddingRight: editingSettings.containerPadding,
    paddingTop: editingSettings.containerPaddingVertical,
    paddingBottom: editingSettings.containerPaddingVertical,
    backgroundColor: editingSettings.containerBg
      ? `${editingSettings.containerBg}${Math.round(editingSettings.containerBgOpacity * 255).toString(16).padStart(2, "0")}`
      : "transparent",
    borderRadius: editingSettings.containerRadius,
    outline: editingSettings.showOutline
      ? `${editingSettings.outlineWidth}px solid ${editingSettings.outlineColor}`
      : "none",
    outlineOffset: editingSettings.showOutline ? `-${editingSettings.outlineWidth}px` : "0",
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#0F0F11] text-white select-none">
      {/* Header + Audio Controls */}
      <div className="max-w-6xl mx-auto px-8 pt-8 pb-4">
        <h1 className="text-2xl font-bold mb-2">Linear Waveform</h1>
        <p className="text-sm text-gray-500 mb-6">Static and scrolling audio bar visualizer</p>

        {/* Audio control bar */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          {/* File picker */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(d => !d)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-gray-400"
            >
              <Music size={14} />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-[#1a1a1e] border border-white/10 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                {entries.map(entry => (
                  <div
                    key={entry.name}
                    onClick={() => playFile(entry)}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5 cursor-pointer truncate"
                  >
                    {entry.name}
                  </div>
                ))}
                <div
                  onClick={() => { fileInputRef.current?.click(); setShowDropdown(false); }}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:bg-white/5 cursor-pointer border-t border-white/5 flex items-center gap-1"
                >
                  <Upload size={10} /> Upload
                </div>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload} />

          {/* Play/Pause (file mode) */}
          {audioMode === "file" && (
            <button onClick={togglePause} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-gray-400">
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          )}

          {/* Stop */}
          {audioMode !== "off" && (
            <button onClick={stopAudio} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-gray-400">
              <Square size={14} />
            </button>
          )}

          {/* Mute */}
          {audioMode !== "off" && (
            <button onClick={toggleMute} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-gray-400">
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          )}

          {/* Mic toggle */}
          <button
            onClick={audioMode === "mic" ? stopAudio : startMic}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              audioMode === "mic" ? "bg-red-500/20 text-red-400" : "hover:bg-white/10 text-gray-400"
            }`}
          >
            {audioMode === "mic" ? <MicOff size={14} /> : <Mic size={14} />}
          </button>

          {/* File name */}
          {fileName && (
            <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{fileName}</span>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex items-center justify-center pb-32" style={{ minHeight: "60vh" }}>
        <div
          className="h-[400px] w-full max-w-4xl flex items-center justify-center rounded-2xl relative overflow-hidden"
          style={{ backgroundColor: editingSettings.previewBg }}
        >
          {/* Preview background colour picker — top right corner */}
          <div
            className="absolute top-3 right-3 z-20"
            onMouseEnter={() => setIsPreviewColorHovered(true)}
            onMouseLeave={() => setIsPreviewColorHovered(false)}
          >
            <div
              className="flex items-center gap-2 rounded-full transition-all duration-200 ease-out"
              style={{
                background: isPreviewColorHovered ? 'rgba(24,24,27,0.9)' : 'rgba(39,39,42,0.6)',
                backdropFilter: 'blur(8px)',
                padding: isPreviewColorHovered ? '6px 12px' : '6px',
              }}
            >
              {/* Colour swatch with hidden native picker */}
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: editingSettings.previewBg }}
                />
                <input
                  type="color"
                  value={editingSettings.previewBg}
                  onChange={(e) => handleSettingsChange({ previewBg: e.target.value })}
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Hex input — shown on hover */}
              {isPreviewColorHovered && (
                <input
                  type="text"
                  value={editingSettings.previewBg}
                  onChange={(e) => handleSettingsChange({ previewBg: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = editingSettings.previewBg.trim();
                      if (val && !val.startsWith('#')) {
                        handleSettingsChange({ previewBg: '#' + val });
                      }
                    }
                  }}
                  placeholder="#000000"
                  className="w-20 bg-transparent text-white text-xs font-mono uppercase border-none outline-none placeholder-gray-500"
                  maxLength={7}
                />
              )}
            </div>
          </div>

          <div style={{ ...containerStyle, position: "relative" }}>
            {/* Padding H guides */}
            {showPaddingHGuide && editingSettings.containerPadding > 0 && (
              <>
                <div style={{
                  position: "absolute", top: 0, bottom: 0,
                  left: 0, width: editingSettings.containerPadding,
                  backgroundColor: "rgba(59,130,246,0.12)",
                  borderRight: "1px dashed rgba(59,130,246,0.4)",
                  pointerEvents: "none",
                }} />
                <div style={{
                  position: "absolute", top: 0, bottom: 0,
                  right: 0, width: editingSettings.containerPadding,
                  backgroundColor: "rgba(59,130,246,0.12)",
                  borderLeft: "1px dashed rgba(59,130,246,0.4)",
                  pointerEvents: "none",
                }} />
              </>
            )}
            {/* Padding V guides */}
            {showPaddingVGuide && editingSettings.containerPaddingVertical > 0 && (
              <>
                <div style={{
                  position: "absolute", left: 0, right: 0,
                  top: 0, height: editingSettings.containerPaddingVertical,
                  backgroundColor: "rgba(168,85,247,0.12)",
                  borderBottom: "1px dashed rgba(168,85,247,0.4)",
                  pointerEvents: "none",
                }} />
                <div style={{
                  position: "absolute", left: 0, right: 0,
                  bottom: 0, height: editingSettings.containerPaddingVertical,
                  backgroundColor: "rgba(168,85,247,0.12)",
                  borderTop: "1px dashed rgba(168,85,247,0.4)",
                  pointerEvents: "none",
                }} />
              </>
            )}
            <LinearWaveform
              frequencyData={freqData}
              barWidth={editingSettings.barWidth}
              barHeight={editingSettings.barHeight}
              barGap={editingSettings.barGap}
              barRadius={editingSettings.barRadius}
              barColor={editingSettings.barColor}
              containerWidth={editingSettings.containerWidth}
              containerHeight={editingSettings.containerHeight}
              mode={editingSettings.mode}
              sensitivity={editingSettings.sensitivity}
              updateRate={editingSettings.updateRate}
              ambientWave={editingSettings.ambientWave}
              waveMode={editingSettings.waveMode}
              waveSpeed={editingSettings.waveSpeed}
              waveAmplitude={editingSettings.waveAmplitude}
              waveHeight={editingSettings.waveHeight}
              ghostBarOpacity={editingSettings.ghostBarOpacity}
              fadeEdges={editingSettings.fadeEdges}
              fadeWidth={editingSettings.fadeWidth}
              smoothing={editingSettings.smoothing}
              intensityOpacity={editingSettings.intensityOpacity}
              showWaveDebug={showWaveDebug}
            />
          </div>
        </div>
      </div>

      {/* Nav bar */}
      <LinearNavBar
        activeProfileName={activeProfileName}
        profileNames={profiles.map(p => p.name)}
        settings={editingSettings}
        isDirty={isDirty}
        isDefault={isDefaultActive}
        isBookmarked={!!activeProfile?.bookmarked}
        bookmarkCount={bookmarkCount}
        suggestedName={pickUnusedName(profiles)}
        onProfileSelect={handleProfileSelect}
        onSettingsChange={handleSettingsChange}
        onSave={saveProfile}
        onUpdate={updateProfile}
        onReset={handleReset}
        onBookmarkToggle={toggleBookmark}
        showPaddingHGuide={showPaddingHGuide}
        onShowPaddingHGuideChange={setShowPaddingHGuide}
        showPaddingVGuide={showPaddingVGuide}
        onShowPaddingVGuideChange={setShowPaddingVGuide}
        showWaveDebug={showWaveDebug}
        onShowWaveDebugChange={setShowWaveDebug}
      />
    </div>
  );
}
