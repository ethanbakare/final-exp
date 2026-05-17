// CSW-010 Final-EXP port v1 — standalone Circle Voice editor page.
//
// Ported from otherexp `CircleVoicePreview.tsx` (the residual page shell
// after the P0 split). Adaptations:
//  • Network via ./api (loadCircleProfiles / persistCircleProfiles) — the
//    otherexp loose-seeder is gone (R2/R3).
//  • R-11: the standalone page exposes NO live-pin affordance. The pinned
//    checkbox, the `★` markers, and `pinned` in the dirty/Discard set are
//    removed. Update PRESERVES the existing bundle.pinned via the `{ ...p }`
//    spread (no UI to change it). Save-As creates bundles with pinned:false.
//    `pinned` is owned/toggled ONLY by realtime-states (plan §0b/§5).
// Authoring-only; it does not control live visibility (exactly like the
// radial-states standalone page).

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Menu,
  Mic,
  MicOff,
  Music,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Save,
  Square,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { audioService } from "@radial-waveform/services/audioService";
import type { AudioEntry } from "@radial-waveform/services/audioService";
import type { CircleSawSettings } from "./circleWaveformCore";
import { CircleVoiceOrb } from "./CircleVoiceOrb";
import { CircleControlsPanel } from "./CircleControlsPanel";
import { useCircleVoiceAnimator } from "./useCircleVoiceAnimator";
import {
  type CircleVoiceProfile,
  type CircleTransitions,
  type VoiceState,
  DEFAULT_TRANSITIONS,
  checkBundleIntegrity,
  pickVoiceProfileName,
} from "./circleVoice";
import { loadCircleProfiles, persistCircleProfiles } from "./api";

const ACTIVE_ID_KEY = "circle-voice-active-id";

export default function CircleVoicePage() {
  const [profiles, setProfiles] = useState<CircleVoiceProfile[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCircleProfiles()
      .then((list) => {
        if (cancelled) return;
        const bad = list.map(checkBundleIntegrity).find(Boolean);
        if (bad) {
          setLoadError(bad);
          return;
        }
        setProfiles(list);
        const stored =
          typeof window !== "undefined"
            ? window.localStorage.getItem(ACTIVE_ID_KEY)
            : null;
        const initial =
          (stored && list.find((p) => p.id === stored)?.id) || list[0]?.id;
        setActiveId(initial ?? null);
      })
      .catch((e: unknown) =>
        setLoadError(e instanceof Error ? e.message : String(e)),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f0f10] px-6 text-center">
        <div className="max-w-md text-sm text-red-400">
          <p className="mb-2 font-semibold">Voice bundle unavailable</p>
          <p className="text-red-300/80">{loadError}</p>
        </div>
      </main>
    );
  }

  if (!profiles || !activeId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f0f10] text-sm text-gray-500">
        Loading voice bundle…
      </main>
    );
  }

  // key on activeId so the animator cleanly re-inits per profile switch.
  return (
    <VoiceStage
      key={activeId}
      initialProfiles={profiles}
      initialActiveId={activeId}
      onProfilesChange={setProfiles}
      onActiveIdChange={(id) => {
        setActiveId(id);
        if (typeof window !== "undefined")
          window.localStorage.setItem(ACTIVE_ID_KEY, id);
      }}
    />
  );
}

interface VoiceStageProps {
  initialProfiles: CircleVoiceProfile[];
  initialActiveId: string;
  onProfilesChange: (list: CircleVoiceProfile[]) => void;
  onActiveIdChange: (id: string) => void;
}

function VoiceStage({
  initialProfiles,
  initialActiveId,
  onProfilesChange,
  onActiveIdChange,
}: VoiceStageProps) {
  // Studio-profiles dock state (mirrors bench/radial/realtime-states). This
  // component is keyed by activeId upstream, so `bundle` is fixed for the
  // mount; switching profiles bumps the key → clean animator re-init.
  const [profiles, setProfiles] = useState<CircleVoiceProfile[]>(
    initialProfiles,
  );
  const bundle: CircleVoiceProfile =
    profiles.find((p) => p.id === initialActiveId) ??
    initialProfiles.find((p) => p.id === initialActiveId) ??
    initialProfiles[0];
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const profileDockRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (
        profileDockRef.current &&
        !profileDockRef.current.contains(e.target as Node)
      )
        setShowProfileDropdown(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Identity (idle-pinned, plan §3): diameter/colors/intensityOpacity never
  // morph. apex/arc heights, circle visibility/opacity and invert ARE eased
  // (phase 3) — they are NOT read from identity here.
  const identity: CircleSawSettings = bundle.settings.idle;
  const { diameter, circleColor, barColor, pageColor, intensityOpacity } =
    identity;

  // ── Declarative voice state (page-owned). Nav buttons call
  // setVoiceState; the animator hook (P0/3a) derives transitions from
  // the prop delta + owns the RAF/eased/dip/geometry. ──
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  // Live-editable transition durations (feel-testing). Persistence = phase 6.
  const transitionsRef = useRef({ ...bundle.settings.transitions });
  const [, forceTransitionsRender] = useState(0);

  // ── Studio-profiles dock: select / Save-as / Update / Reset / Discard /
  // rename (mirrors bench/radial/realtime-states). R-11: NO live-pin
  // affordance — `pinned` is owned/toggled ONLY by realtime-states; the
  // standalone page never reads it into UI state nor writes it for live. ──
  // idle/listening lock (radial-states model). Absent ⇒ linked (back-compat).
  // While linked: idle per-state edits mirror to listening, and the listening
  // editor is replaced by a read-only "Linked to Idle" banner + Break-link.
  const [linked, setLinked] = useState(bundle.idleListeningLinked !== false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  // ── Per-state editing (radial-states model): the focused state IS the
  // live voiceState. Edits write that state's snapshot; identity-class keys
  // mirror to all 4 so shared identity stays coherent (effectiveSettings
  // pins identity from idle). Per-state keys = the eased set + invert +
  // circle vis/opacity + waveDirection. ──
  const PER_STATE_KEYS = useRef(
    new Set<keyof CircleSawSettings>([
      "apexCircleHeight",
      "arcCircleHeight",
      "waveAmplitude",
      "pulseWidth",
      "spectralMix",
      "waveSpeed",
      "waveHeight",
      "sensitivity",
      "noiseFloor",
      "smoothing",
      "audioInvert",
      "circleVisible",
      "circleOpacity",
      "waveDirection",
    ]),
  ).current;
  const editBaselineRef = useRef(JSON.stringify(bundle.settings));
  const updateStateSetting = <K extends keyof CircleSawSettings>(
    key: K,
    value: CircleSawSettings[K],
  ) => {
    if (PER_STATE_KEYS.has(key)) {
      bundle.settings[voiceState][key] = value;
      // Link-propagation: while linked, idle per-state edits mirror to
      // listening so the two stay identical (radial-states §8a).
      if (voiceState === "idle" && linked) {
        bundle.settings.listening[key] = value;
      }
    } else {
      // shared identity → mirror to all four snapshots
      (["idle", "listening", "thinking", "talking"] as VoiceState[]).forEach(
        (st) => {
          bundle.settings[st][key] = value;
        },
      );
    }
    forceTransitionsRender((n) => n + 1);
  };

  const transitionsEqual = (a: CircleTransitions, b: CircleTransitions) =>
    (Object.keys(a) as (keyof CircleTransitions)[]).every(
      (k) => a[k] === b[k],
    );
  // R-11: `pinned` is intentionally NOT a dirty term — the standalone page
  // cannot dirty/Discard it; only realtime-states owns it.
  const isDirty =
    !transitionsEqual(transitionsRef.current, bundle.settings.transitions) ||
    linked !== (bundle.idleListeningLinked !== false) ||
    JSON.stringify(bundle.settings) !== editBaselineRef.current;

  const commitList = async (next: CircleVoiceProfile[]) => {
    setProfiles(next);
    onProfilesChange(next);
    setSaveState("saving");
    try {
      await persistCircleProfiles(next);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("idle");
    }
  };

  const selectProfile = (id: string) => {
    setShowProfileDropdown(false);
    if (id !== bundle.id) onActiveIdChange(id); // parent bumps key → re-init
  };

  const updateProfile = async () => {
    // fold edited transitions into the live bundle, then persist the WHOLE
    // bundle (all 4 edited snapshots + transitions). R-11: `pinned` is
    // PRESERVED via the `{ ...p }` spread — never set from page UI.
    bundle.settings.transitions = { ...transitionsRef.current };
    bundle.idleListeningLinked = linked;
    const next = profiles.map((p) =>
      p.id === bundle.id
        ? {
            ...p,
            idleListeningLinked: linked,
            settings: bundle.settings,
            lastModified: Date.now(),
          }
        : p,
    );
    editBaselineRef.current = JSON.stringify(bundle.settings);
    await commitList(next);
  };

  const saveAsProfile = async () => {
    const name = saveName.trim();
    if (
      !name ||
      profiles.some((p) => p.name.trim().toLowerCase() === name.toLowerCase())
    )
      return;
    const nb: CircleVoiceProfile = {
      schemaVersion: 1,
      id: `cv-${crypto.randomUUID()}`,
      name,
      // R-11: new bundles are NOT live — only realtime-states promotes a
      // bundle to live by toggling its pinned.
      pinned: false,
      idleListeningLinked: linked,
      settings: JSON.parse(
        JSON.stringify({
          ...bundle.settings,
          transitions: { ...transitionsRef.current },
        }),
      ),
      lastModified: Date.now(),
    };
    setShowSaveDialog(false);
    setSaveName("");
    await commitList([...profiles, nb]);
    onActiveIdChange(nb.id);
  };

  const resetTransitions = () => {
    transitionsRef.current = { ...DEFAULT_TRANSITIONS };
    forceTransitionsRender((n) => n + 1);
  };
  const discardChanges = () => {
    // revert ALL unsaved edits (snapshots + transitions) to the last-saved
    // baseline. R-11: `pinned` is not part of the standalone dirty set.
    const base = JSON.parse(
      editBaselineRef.current,
    ) as CircleVoiceProfile["settings"];
    (["idle", "listening", "thinking", "talking"] as VoiceState[]).forEach(
      (st) => {
        bundle.settings[st] = base[st];
      },
    );
    bundle.settings.transitions = { ...base.transitions };
    transitionsRef.current = { ...base.transitions };
    setLinked(bundle.idleListeningLinked !== false);
    forceTransitionsRender((n) => n + 1);
  };

  /** Break the idle ↔ listening link. Listening keeps its current values
   *  (== idle's at the moment of break) and becomes independently editable.
   *  Persisted on Update; revertable via Discard (radial-states parity). */
  const breakLink = () => {
    setLinked(false);
    forceTransitionsRender((n) => n + 1);
  };

  const renameDup = (draft: string, exceptId: string) => {
    const n = draft.trim().toLowerCase();
    return (
      !!n &&
      profiles.some(
        (p) => p.id !== exceptId && p.name.trim().toLowerCase() === n,
      )
    );
  };
  const commitRename = async (id: string, draft: string) => {
    const name = draft.trim();
    if (!name || renameDup(draft, id)) return;
    const next = profiles.map((p) =>
      p.id === id ? { ...p, name, lastModified: Date.now() } : p,
    );
    setRenamingId(null);
    setRenameDraft("");
    await commitList(next);
  };

  // ── Audio test pipeline (mic / music file) + collapsible controls. Manual
  // test affordance so reactivity (and phase-4 thinking-suppression) can be
  // felt; autonomous mic→state wiring is still CSW-002B. Mirrors the bench. ──
  const [audioMode, setAudioMode] = useState<"off" | "mic" | "file">("off");
  const [audioEntries, setAudioEntries] = useState<AudioEntry[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  // Eye-icon ghost overlays (ported from the bench). Max/Min Height hover →
  // dashed envelope silhouette; Wave Amplitude eye → red/blue wave-reach.
  const [previewEnvelope, setPreviewEnvelope] = useState<
    "max" | "min" | null
  >(null);
  const [waveReachVisible, setWaveReachVisible] = useState(false);
  const [waveReachHovered, setWaveReachHovered] = useState(false);
  const audioDropdownRef = useRef<HTMLDivElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  // audioMode read by the RAF via a ref so toggling mic/file does NOT
  // resubscribe the loop (would wipe smoothing history — plan §4.7).
  const audioModeRef = useRef(audioMode);
  useEffect(() => {
    audioModeRef.current = audioMode;
  }, [audioMode]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/audio-files")
      .then((r) => r.json())
      .then(async (names: string[]) => {
        if (!Array.isArray(names)) return;
        const loaded: AudioEntry[] = [];
        for (const name of names) {
          try {
            const r = await fetch(`/audio/${encodeURIComponent(name)}`);
            loaded.push({ name, blob: r.ok ? await r.blob() : null });
          } catch {
            loaded.push({ name, blob: null });
          }
        }
        if (!cancelled) setAudioEntries(loaded);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => audioService.stop(), []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (
        audioDropdownRef.current &&
        !audioDropdownRef.current.contains(e.target as Node)
      ) {
        setShowAudioDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const startMic = async () => {
    await audioService.init();
    await audioService.startMic();
    setAudioMode("mic");
    setFileName(null);
    setIsPaused(false);
  };
  const playAudioFile = async (entry: AudioEntry) => {
    if (!entry.blob) return;
    await audioService.init();
    await audioService.startAudioFile(new File([entry.blob], entry.name));
    setAudioMode("file");
    setFileName(entry.name);
    setIsPaused(false);
    setShowAudioDropdown(false);
  };
  const stopAudio = () => {
    audioService.stop();
    setAudioMode("off");
    setFileName(null);
    setIsPaused(false);
    setIsMuted(false);
  };
  const togglePause = () => {
    if (isPaused) {
      audioService.resume();
      setIsPaused(false);
    } else {
      audioService.pause();
      setIsPaused(true);
    }
  };
  const toggleMute = () => {
    const next = !isMuted;
    audioService.setMuted(next);
    setIsMuted(next);
  };
  const handleAudioUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      await fetch("/api/audio-files", { method: "POST", body: form });
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      setAudioEntries((prev) => [...prev, { name: file.name, blob }]);
    } catch {
      /* ignore */
    }
  };

  // Stable audio-frame getter — the page owns acquisition (test pill);
  // the animator hook never imports audioService (plan §3a). Reads
  // audioModeRef (defined above) lazily so toggling audio never
  // resubscribes the RAF.
  const getAudioFrame = useRef<() => Uint8Array | null>(() =>
    audioModeRef.current === "off"
      ? null
      : audioService.getFrequencyData(),
  ).current;

  const anim = useCircleVoiceAnimator({
    bundle,
    voiceState,
    transitionsRef,
    getAudioFrame,
  });
  const transitioning = anim.transitioning;

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-start px-6 pt-16 ${
        controlsCollapsed ? "pb-[72px]" : "pb-[300px]"
      }`}
      style={{ backgroundColor: pageColor }}
    >
      <div className="mb-4 h-8 text-center text-xs tabular-nums text-gray-500">
        Voice: {bundle.name} — {voiceState}
        {transitioning && <span className="text-gray-400"> · morphing…</span>}
      </div>

      {/* Audio test bar: music-file dropdown + mic (so reactivity / phase-4
          thinking-suppression can be felt). */}
      <div className="mb-4 flex items-center justify-center">
        <div
          ref={audioDropdownRef}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white"
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAudioDropdown((o) => !o)}
              className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10"
              title="Select audio file"
            >
              <Music size={14} />
            </button>
            {showAudioDropdown && (
              <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-52 overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a1e] shadow-lg">
                {audioEntries.map((entry) => (
                  <div
                    key={entry.name}
                    onClick={() => playAudioFile(entry)}
                    className="cursor-pointer truncate px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5"
                  >
                    {entry.name}
                  </div>
                ))}
                <div
                  onClick={() => {
                    audioFileInputRef.current?.click();
                    setShowAudioDropdown(false);
                  }}
                  className="flex cursor-pointer items-center gap-1 border-t border-white/5 px-3 py-1.5 text-xs text-gray-500 hover:bg-white/5"
                >
                  <Upload size={10} /> Upload
                </div>
              </div>
            )}
          </div>
          <input
            ref={audioFileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleAudioUpload}
          />
          {audioMode === "file" && (
            <button
              type="button"
              onClick={togglePause}
              className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10"
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          )}
          {audioMode !== "off" && (
            <button
              type="button"
              onClick={stopAudio}
              className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10"
              title="Stop"
            >
              <Square size={14} />
            </button>
          )}
          {audioMode !== "off" && (
            <button
              type="button"
              onClick={toggleMute}
              className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          )}
          <button
            type="button"
            onClick={audioMode === "mic" ? stopAudio : startMic}
            className={`cursor-pointer rounded-lg p-1.5 transition-colors ${
              audioMode === "mic"
                ? "bg-red-500/20 text-red-400"
                : "text-gray-400 hover:bg-white/10"
            }`}
            title={audioMode === "mic" ? "Stop microphone" : "Use microphone"}
          >
            {audioMode === "mic" ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          {fileName && (
            <span className="max-w-[160px] truncate text-[10px] text-gray-500">
              {fileName}
            </span>
          )}
        </div>
      </div>
      <div className="flex h-[30vh] w-full items-center justify-center">
        <CircleVoiceOrb
          diameter={diameter}
          viewHeight={anim.viewHeight}
          radiusX={anim.radiusX}
          radiusY={anim.radiusY}
          circleOpacityEff={anim.circleOpacityEff}
          circleColor={circleColor}
          barColor={barColor}
          intensityOpacity={intensityOpacity}
          bars={anim.bars}
          ghosts={{
            apexBars: anim.apexBars,
            arcRyByPair: anim.arcRyByPair,
            previewEnvelope,
            waveReachVisible,
            waveReachHovered,
            ambientWave: anim.ambientWave,
            waveAmplitude: anim.waveAmplitude,
          }}
        />
      </div>

      <aside className="fixed bottom-0 left-0 right-0 z-50 text-white shadow-2xl">
        {!controlsCollapsed && (
          <CircleControlsPanel
            voiceState={voiceState}
            linked={linked}
            s={bundle.settings[voiceState]}
            transitions={transitionsRef.current}
            waveReachVisible={waveReachVisible}
            onBreakLink={breakLink}
            onSetting={updateStateSetting}
            onTransition={(key, v) => {
              transitionsRef.current[key] = v;
              forceTransitionsRender((n) => n + 1);
            }}
            setPreviewEnvelope={setPreviewEnvelope}
            setWaveReachVisible={setWaveReachVisible}
            setWaveReachHovered={setWaveReachHovered}
          />
        )}
        <div className="border-t border-white/10 bg-[#1a1a1e] px-4 py-2">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setControlsCollapsed((c) => !c)}
              aria-label={controlsCollapsed ? "Show controls" : "Hide controls"}
              aria-expanded={!controlsCollapsed}
              title={controlsCollapsed ? "Show controls" : "Hide controls"}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-gray-400 transition-colors hover:bg-white/10"
            >
              {controlsCollapsed ? <Menu size={14} /> : <X size={14} />}
            </button>
            <div className="h-6 w-px bg-white/10" />
            <div className="min-w-32">
              <h1 className="text-sm font-semibold leading-tight text-white">
                Circle Voice
              </h1>
              <p className="mt-0.5 text-xs capitalize text-gray-500">
                {voiceState}
                {transitioning ? " · morphing…" : ""}
              </p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-1">
              {(
                ["idle", "listening", "thinking", "talking"] as VoiceState[]
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setVoiceState(st)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                    voiceState === st
                      ? "bg-white text-black"
                      : "bg-white/[0.06] text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-white/10" />
          <div
            ref={profileDockRef}
            className="flex flex-wrap items-center gap-2 text-xs"
          >
            <div className="relative">
              {showSaveDialog ? (
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveAsProfile();
                    if (e.key === "Escape") {
                      setShowSaveDialog(false);
                      setSaveName("");
                    }
                  }}
                  placeholder="Voice profile name"
                  autoFocus
                  className="h-7 w-40 rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white outline-none focus:border-white/30"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowProfileDropdown((o) => !o)}
                  className="flex h-7 min-w-32 items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 text-xs text-gray-300 hover:bg-white/10"
                >
                  <span className="max-w-32 truncate text-left">
                    {bundle.name}
                  </span>
                  <ChevronDown size={12} className="shrink-0 text-gray-500" />
                </button>
              )}
              {showProfileDropdown && !showSaveDialog && (
                <div className="absolute bottom-full left-0 z-50 mb-1 max-h-56 w-56 overflow-y-auto rounded-md border border-white/10 bg-[#1a1a1e] py-1 shadow-xl">
                  {profiles.map((p) => {
                    const isRenaming = renamingId === p.id;
                    const renameInvalid =
                      !renameDraft.trim() || renameDup(renameDraft, p.id);
                    return (
                      <div
                        key={p.id}
                        className={`group flex items-center gap-1 px-1.5 py-0.5 ${
                          isRenaming ? "" : "hover:bg-white/5"
                        }`}
                      >
                        {isRenaming ? (
                          <>
                            <input
                              type="text"
                              autoFocus
                              value={renameDraft}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  void commitRename(p.id, renameDraft);
                                else if (e.key === "Escape") {
                                  setRenamingId(null);
                                  setRenameDraft("");
                                }
                              }}
                              className={`h-6 min-w-0 flex-1 rounded border bg-transparent px-1.5 text-xs text-white outline-none ${
                                renameInvalid
                                  ? "border-red-500/60"
                                  : "border-white/20"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => void commitRename(p.id, renameDraft)}
                              disabled={renameInvalid}
                              title="Save name"
                              className="flex h-6 w-6 items-center justify-center rounded text-emerald-400 hover:bg-white/5 disabled:text-gray-600"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRenamingId(null);
                                setRenameDraft("");
                              }}
                              title="Cancel"
                              className="flex h-6 w-6 items-center justify-center rounded text-red-400 hover:bg-white/5"
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => selectProfile(p.id)}
                              className={`flex-1 truncate px-1.5 py-1 text-left text-xs ${
                                p.id === bundle.id
                                  ? "font-medium text-white"
                                  : "text-gray-400"
                              }`}
                            >
                              {p.name}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingId(p.id);
                                setRenameDraft(p.name);
                              }}
                              title="Rename"
                              className="flex h-6 w-6 items-center justify-center rounded text-gray-500 opacity-0 hover:bg-white/5 hover:text-gray-200 group-hover:opacity-100"
                            >
                              <Pencil size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {showSaveDialog ? (
              <>
                <button
                  type="button"
                  onClick={() => void saveAsProfile()}
                  disabled={
                    !saveName.trim() ||
                    profiles.some(
                      (p) =>
                        p.name.trim().toLowerCase() ===
                        saveName.trim().toLowerCase(),
                    )
                  }
                  title="Save as new voice profile"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-emerald-400 hover:bg-white/10 disabled:text-gray-600"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveName("");
                  }}
                  title="Cancel"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-red-400 hover:bg-white/10"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                {isDirty && (
                  <button
                    type="button"
                    onClick={() => void updateProfile()}
                    className="h-7 rounded-md bg-amber-400/15 px-2.5 text-xs text-amber-300 hover:bg-amber-400/20"
                  >
                    Update
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSaveName(pickVoiceProfileName(profiles));
                    setShowSaveDialog(true);
                    setShowProfileDropdown(false);
                  }}
                  title="Save as new voice profile"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-gray-400 hover:bg-white/10"
                >
                  <Save size={14} />
                </button>
                <button
                  type="button"
                  onClick={resetTransitions}
                  title="Reset motion timings to defaults"
                  className="h-7 rounded-md bg-white/5 px-2.5 text-xs text-gray-400 hover:bg-white/10"
                >
                  Reset
                </button>
                {isDirty && (
                  <button
                    type="button"
                    onClick={discardChanges}
                    title="Discard unsaved edits"
                    className="flex h-7 items-center gap-1.5 rounded-md bg-white/5 px-2.5 text-xs text-gray-400 hover:bg-white/10"
                  >
                    <RotateCcw size={12} />
                    Discard
                  </button>
                )}
              </>
            )}
            <span className="text-[10px] text-gray-500">
              {saveState === "saving"
                ? "saving…"
                : saveState === "saved"
                  ? "saved ✓"
                  : ""}
            </span>
          </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
