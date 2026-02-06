import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Save, Check, X, RotateCcw, Bookmark, Menu } from "lucide-react";
import type { RadialVariant, RadialSettings } from "../types";
import {
  RADIAL_VARIANTS,
  RADIAL_VARIANT_LABELS,
} from "../types";

// ── Control tab types ──────────────────────────────────────────

type ControlTab = "geometry" | "audio" | "wave" | "wave2" | "style";

// ── Props ──────────────────────────────────────────────────────

interface Props {
  activeVariant: RadialVariant;
  activeProfileName: string;
  profileNames: string[];
  settings: RadialSettings;
  isDirty: boolean;
  isDefault: boolean;
  isBookmarked: boolean;
  bookmarkCount: number;
  suggestedName: string;
  onVariantChange: (v: RadialVariant) => void;
  onProfileSelect: (index: number) => void;
  onSettingsChange: (s: Partial<RadialSettings>) => void;
  onSave: (name: string) => void;
  onUpdate: () => void;
  onReset: () => void;
  onBookmarkToggle: () => void;
  showEnvelopeCeiling: boolean;
  onShowEnvelopeCeilingChange: (v: boolean) => void;
}

// ── Helpers ────────────────────────────────────────────────────

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-500 tabular-nums">{value}{unit ?? ""}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 accent-white bg-white/10 rounded-full appearance-none cursor-pointer"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-8 h-4.5 rounded-full transition-colors cursor-pointer ${checked ? "bg-white/30" : "bg-white/10"}`}
      >
        <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <div className="relative h-5 w-5 rounded-full overflow-hidden border border-white/10">
          <div className="absolute inset-0" style={{ backgroundColor: value }} />
          <input
            type="color" value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
        <input
          type="text" value={value}
          onChange={e => onChange(e.target.value)}
          className="w-[60px] text-[10px] font-mono bg-transparent text-gray-400 border-none outline-none uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────

const RadialGalleryNavBar: React.FC<Props> = ({
  activeVariant,
  activeProfileName,
  profileNames,
  settings,
  isDirty,
  isDefault,
  isBookmarked,
  bookmarkCount,
  suggestedName,
  onVariantChange,
  onProfileSelect,
  onSettingsChange,
  onSave,
  onUpdate,
  onReset,
  onBookmarkToggle,
  showEnvelopeCeiling,
  onShowEnvelopeCeilingChange,
}) => {
  const [activeTab, setActiveTab] = useState<ControlTab | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [ceilingPinned, setCeilingPinned] = useState(false);
  const [ceilingHover, setCeilingHover] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync ceiling visibility to parent
  const envelopeActive = settings.envelopeAmplitude > 0 && settings.waveEnvelope > 0;
  useEffect(() => {
    onShowEnvelopeCeilingChange(envelopeActive && (ceilingHover || ceilingPinned));
  }, [ceilingHover, ceilingPinned, envelopeActive, onShowEnvelopeCeilingChange]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Track mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const set = (key: keyof RadialSettings, value: RadialSettings[keyof RadialSettings]) => {
    onSettingsChange({ [key]: value });
  };

  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openTab = (tab: ControlTab) => {
    if (hoverTimeout.current) { clearTimeout(hoverTimeout.current); hoverTimeout.current = null; }
    setActiveTab(tab);
  };

  const scheduleClose = () => {
    hoverTimeout.current = setTimeout(() => setActiveTab(null), 150);
  };

  const cancelClose = () => {
    if (hoverTimeout.current) { clearTimeout(hoverTimeout.current); hoverTimeout.current = null; }
  };

  // ── Tab definitions ──────────────────────────────────────────

  const tabs: { key: ControlTab; label: string; show: boolean }[] = [
    { key: "geometry", label: "Geometry", show: true },
    { key: "audio", label: "Audio", show: true },
    { key: "wave", label: "Wave", show: true },
    { key: "wave2", label: "Wave 2", show: true },
    { key: "style", label: "Style", show: true },
  ];

  const visibleTabs = tabs.filter(t => t.show);

  // ── Tab content renderer ─────────────────────────────────────

  const renderTabControls = (tab: ControlTab) => {
    switch (tab) {
      case "geometry":
        return (
          <div className="space-y-3">
            <Slider label="Radius" value={settings.radius} min={30} max={200} step={1} unit="px" onChange={v => set("radius", v)} />
            <Slider label="Bar Width" value={settings.barWidth} min={0.5} max={10} step={0.5} unit="px" onChange={v => set("barWidth", v)} />
            <Slider label="Bar Gap" value={settings.barGap} min={0} max={12} step={0.5} unit="px" onChange={v => set("barGap", v)} />
            <Slider label="Min Bar Length" value={settings.minBarLength} min={0} max={20} step={1} unit="px" onChange={v => set("minBarLength", v)} />
            <Slider label="Max Bar Length" value={settings.maxBarLength} min={10} max={120} step={1} unit="px" onChange={v => set("maxBarLength", v)} />
          </div>
        );

      case "audio":
        return (
          <div className="space-y-3">
            <Slider label="Sensitivity" value={settings.sensitivity} min={0.1} max={5} step={0.1} unit="x" onChange={v => set("sensitivity", v)} />
            <Slider label="Segments" value={settings.segments} min={1} max={16} step={1} onChange={v => set("segments", v)} />
            <Slider label="Smoothing" value={settings.smoothing} min={0} max={0.99} step={0.01} onChange={v => set("smoothing", v)} />
          </div>
        );

      case "wave":
        return (
          <div className="space-y-3">
            <Toggle label="Enable" checked={settings.ambientWave} onChange={v => set("ambientWave", v)} />
            {settings.ambientWave && (
              <>
                <div className="flex gap-1">
                  {(["sine", "square", "segments"] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => set("waveShape", s)}
                      className={`px-1.5 py-0.5 text-[10px] rounded-full transition-colors cursor-pointer ${
                        settings.waveShape === s ? "bg-white text-black font-medium" : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                {settings.waveShape !== "segments" && (
                  <Slider label="Lobes" value={settings.waveLobes} min={1} max={16} step={1} onChange={v => set("waveLobes", v)} />
                )}
                <Slider label="Speed" value={settings.waveSpeed} min={0} max={10} step={0.1} unit=" rad/s" onChange={v => set("waveSpeed", v)} />
                <Slider label="Amplitude" value={settings.waveAmplitude} min={0} max={1} step={0.01} onChange={v => set("waveAmplitude", v)} />
                <Slider label="Peak Boost" value={settings.waveHeight} min={0.5} max={3} step={0.1} unit="x" onChange={v => set("waveHeight", v)} />
              </>
            )}
          </div>
        );

      case "wave2":
        return (
          <div className="space-y-3">
            <div
              onMouseEnter={() => setCeilingHover(true)}
              onMouseLeave={() => setCeilingHover(false)}
            >
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Envelope</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 tabular-nums">{settings.waveEnvelope}</span>
                    {envelopeActive && (
                      <button
                        onClick={e => { e.stopPropagation(); setCeilingPinned(p => !p); }}
                        className="w-2.5 h-2.5 rounded-full border transition-colors cursor-pointer"
                        style={{
                          borderColor: ceilingPinned ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                          backgroundColor: ceilingPinned ? "rgba(255,255,255,0.4)" : "transparent",
                        }}
                        title={ceilingPinned ? "Hide ceiling guide" : "Show ceiling guide"}
                      />
                    )}
                  </div>
                </div>
                <input
                  type="range" min={0} max={1} step={0.01} value={settings.waveEnvelope}
                  onChange={e => set("waveEnvelope", parseFloat(e.target.value))}
                  className="w-full h-1 accent-white bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
            <Slider label="Envelope Amplitude" value={settings.envelopeAmplitude} min={0} max={1} step={0.01} onChange={v => set("envelopeAmplitude", v)} />
            <Slider label="Envelope Sensitivity" value={settings.envelopeSensitivity} min={0} max={1} step={0.01} onChange={v => set("envelopeSensitivity", v)} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Wave Mode</span>
              <div className="flex gap-1">
                {(["additive", "reactive"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => set("waveMode", m)}
                    className={`px-1.5 py-0.5 text-[10px] rounded-full transition-colors cursor-pointer ${
                      settings.waveMode === m ? "bg-white text-black font-medium" : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {m === "additive" ? "Additive" : "Reactive"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "style":
        return (
          <div className="space-y-3">
            <Toggle label="Round Caps" checked={settings.roundCaps} onChange={v => set("roundCaps", v)} />
            <Toggle label="Intensity Opacity" checked={settings.intensityOpacity} onChange={v => set("intensityOpacity", v)} />
            <Slider label="Rotation Speed" value={settings.rotationSpeed} min={0} max={30} step={0.5} unit="°/s" onChange={v => set("rotationSpeed", v)} />
            {activeVariant === "bidirectional" && (
              <Slider label="Inward Ratio" value={settings.inwardRatio} min={0} max={1} step={0.05} onChange={v => set("inwardRatio", v)} />
            )}
            <ColorPicker label="Container BG" value={settings.containerBg || "#000000"} onChange={v => set("containerBg", v)} />
            <Slider label="Container BG Opacity" value={settings.containerBgOpacity} min={0} max={1} step={0.05} onChange={v => set("containerBgOpacity", v)} />
            <Toggle label="Outline" checked={settings.showOutline} onChange={v => set("showOutline", v)} />
            {settings.showOutline && (
              <>
                <ColorPicker label="Outline Color" value={settings.outlineColor} onChange={v => set("outlineColor", v)} />
                <Slider label="Outline Width" value={settings.outlineWidth} min={1} max={8} step={0.5} unit="px" onChange={v => set("outlineWidth", v)} />
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <>
    {/* Mobile side drawer */}
    {isMobile && (
      <div
        className={`fixed top-0 right-0 bottom-0 w-[320px] z-[51] bg-[#1a1a1e] border-l border-white/10 overflow-y-auto transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 space-y-6">
          {visibleTabs.map(tab => (
            <div key={tab.key}>
              <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">
                {tab.label}
              </h3>
              {renderTabControls(tab.key)}
            </div>
          ))}
        </div>
      </div>
    )}
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Desktop drawer — slides up/down from behind the bar */}
      {!isMobile && (
        <div className="absolute bottom-full left-0 right-0 overflow-hidden pointer-events-none" style={{ height: "60vh" }}>
          <div
            className={`absolute bottom-0 left-0 right-0 pointer-events-auto transition-transform duration-300 ease-in-out ${
              drawerOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="bg-[#1a1a1e] border-t border-white/10 max-h-[60vh] overflow-y-auto">
              <div className="max-w-6xl mx-auto flex gap-6 p-4">
                {visibleTabs.map(tab => (
                  <div key={tab.key} className="flex-1 min-w-[200px]">
                    <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">
                      {tab.label}
                    </h3>
                    {renderTabControls(tab.key)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Main bar */}
      <div className="bg-[#1a1a1e] border-t border-white/10 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
          {/* Hamburger toggle */}
          <button
            onClick={() => setDrawerOpen(o => !o)}
            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {drawerOpen ? <X size={14} /> : <Menu size={14} />}
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* Variant pills */}
          <div className="flex items-center gap-1">
            {RADIAL_VARIANTS.map((v, i) => (
              <button
                key={v}
                onClick={() => onVariantChange(v)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors cursor-pointer ${
                  activeVariant === v
                    ? "bg-white text-black font-medium"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {RADIAL_VARIANT_LABELS[v]}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            {showSaveDialog ? (
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && saveName.trim()) {
                    onSave(saveName.trim());
                    setShowSaveDialog(false);
                    setSaveName("");
                  }
                  if (e.key === "Escape") {
                    setShowSaveDialog(false);
                    setSaveName("");
                  }
                }}
                placeholder="Profile name"
                className="w-28 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded-lg outline-none focus:border-white/30 text-white"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setShowProfileDropdown(p => !p)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer min-w-[80px]"
              >
                <span className="truncate text-gray-300 max-w-[100px]">{activeProfileName}</span>
                <ChevronDown size={12} className="text-gray-500 shrink-0" />
              </button>
            )}
            {showProfileDropdown && !showSaveDialog && (
              <div className="absolute bottom-full left-0 mb-1 w-48 bg-[#1a1a1e] border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div
                  className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-white/5 ${
                    activeProfileName === "Default" ? "font-medium text-white" : "text-gray-400"
                  }`}
                  onClick={() => { onProfileSelect(-1); setShowProfileDropdown(false); }}
                >
                  Default
                </div>
                {profileNames.map((name, i) => (
                  <div
                    key={i}
                    className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-white/5 ${
                      activeProfileName === name ? "font-medium text-white" : "text-gray-400"
                    }`}
                    onClick={() => { onProfileSelect(i); setShowProfileDropdown(false); }}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Tab buttons (hover to open popover) */}
          <div className="flex items-center gap-1">
            {visibleTabs.map(tab => (
              <div
                key={tab.key}
                className="relative"
                onMouseEnter={() => !drawerOpen && openTab(tab.key)}
                onMouseLeave={scheduleClose}
              >
                <button
                  data-tab-button
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-white/10 text-white"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
                {!drawerOpen && activeTab === tab.key && (
                  <div
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2"
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  >
                    <div
                      ref={popoverRef}
                      className="bg-[#1a1a1e] border border-white/10 rounded-xl shadow-lg p-4 w-[280px]"
                    >
                      <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">
                        {tab.label}
                      </h3>
                      {renderTabControls(tab.key)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Colour swatches */}
          <div className="flex items-center gap-1.5">
            <div className="relative h-6 w-6 rounded-full overflow-hidden border border-white/10 shrink-0">
              <div className="absolute inset-0" style={{ backgroundColor: settings.barColor }} />
              <input
                type="color" value={settings.barColor}
                onChange={e => set("barColor", e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <div className="relative h-6 w-6 rounded-full overflow-hidden border border-white/10 shrink-0">
              <div className="absolute inset-0" style={{ backgroundColor: settings.previewBg }} />
              <input
                type="color" value={settings.previewBg}
                onChange={e => set("previewBg", e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex-1" />

          {/* Save / Update / Reset */}
          {showSaveDialog ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (saveName.trim()) {
                    onSave(saveName.trim());
                    setShowSaveDialog(false);
                    setSaveName("");
                  }
                }}
                className="text-gray-400 hover:text-green-400 transition-colors cursor-pointer"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => { setShowSaveDialog(false); setSaveName(""); }}
                className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Update */}
              {!isDefault && isDirty && (
                <button
                  onClick={onUpdate}
                  className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors cursor-pointer"
                >
                  Update
                </button>
              )}
              {/* Bookmark */}
              <button
                onClick={!isDefault ? onBookmarkToggle : undefined}
                className={`flex items-center gap-1 rounded-lg transition-colors ${
                  !isDefault ? "cursor-pointer" : "cursor-default"
                } ${
                  isBookmarked
                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 px-2 py-1.5"
                    : bookmarkCount > 0
                      ? "bg-white/5 text-gray-400 hover:bg-white/10 px-2 py-1.5"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 p-1.5"
                }`}
              >
                <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} strokeWidth={1.5} />
                {bookmarkCount > 0 && (
                  <span className={`text-[11px] tabular-nums ${isBookmarked ? "text-amber-400" : "text-gray-500"}`}>
                    {bookmarkCount}
                  </span>
                )}
              </button>
              {/* Save */}
              <button
                onClick={() => { setSaveName(suggestedName); setShowSaveDialog(true); }}
                className="p-1.5 text-xs rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Save size={14} />
              </button>
              {/* Reset */}
              <button
                onClick={onReset}
                className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default RadialGalleryNavBar;
