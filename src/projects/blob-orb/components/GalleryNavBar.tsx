/**
 * GalleryNavBar – Fixed bottom navigation bar for the Gallery page.
 *
 * Collapsed: variant pills | profile dropdown | control tab buttons | colour swatches | Save/Update
 * Expanded: full drawer showing all controls at once
 */
import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown, Save, Check, X, Lock, Unlock, Menu, Bookmark, Repeat,
} from "lucide-react";
import type { GalleryVariant, GallerySettings } from "../galleryTypes";
import {
  GALLERY_VARIANTS,
  GALLERY_VARIANT_LABELS,
  GALLERY_DEFAULTS,
  approxPixelDia,
  GALLERY_CELL_SIZE,
  hasThickenControls,
  hasMorphControls,
} from "../galleryTypes";
import SliderRow from "./shared/SliderRow";
import ColorRow from "./shared/ColorRow";
import { transformHex } from "./shared/colorUtils";

// ── Editable hex swatch label ─────────────────────────────────────

function EditableHex({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-16 text-[10px] tabular-nums text-gray-600 bg-gray-100 rounded px-1 outline-none uppercase"
        autoFocus
      />
    );
  }

  return (
    <span
      className="text-[10px] text-gray-400 tabular-nums uppercase cursor-pointer hover:text-gray-600 transition-colors"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value}
    </span>
  );
}

// ── Types ─────────────────────────────────────────────────────────

type ControlTab = "size" | "thickness" | "morph" | "motion" | "colours";

interface GalleryNavBarProps {
  activeVariant: GalleryVariant;
  activeProfileName: string;
  profileNames: string[];
  settings: GallerySettings;
  isDirty: boolean;
  isDefault: boolean;
  isBookmarked: boolean;
  bookmarkCount: number;
  onVariantChange: (v: GalleryVariant) => void;
  onProfileSelect: (index: number) => void;
  onSettingsChange: (s: Partial<GallerySettings>) => void;
  suggestedName: string;
  onSave: (name: string) => void;
  onUpdate: () => void;
  onBookmarkToggle: () => void;
  goal?: number;
  hasGoal?: boolean;
  isLooping?: boolean;
  onGoalToggle?: () => void;
  onLoopToggle?: () => void;
}

// ── Component ─────────────────────────────────────────────────────

const GalleryNavBar: React.FC<GalleryNavBarProps> = ({
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
  onBookmarkToggle,
  goal = 0,
  hasGoal = false,
  isLooping = false,
  onGoalToggle,
  onLoopToggle,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ControlTab | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Hue/sat/light transform state
  const [hueShift, setHueShift] = useState(0);
  const [saturation, setSaturation] = useState(1.0);
  const [lightness, setLightness] = useState(0);
  const baseColorsRef = useRef({
    c1: settings.color1,
    c2: settings.color2,
    c3: settings.color3,
  });

  // Idle lock
  const [idleLocked, setIdleLocked] = useState(true);

  // Reset colour transforms when profile/variant changes
  useEffect(() => {
    baseColorsRef.current = {
      c1: settings.color1,
      c2: settings.color2,
      c3: settings.color3,
    };
    setHueShift(0);
    setSaturation(1.0);
    setLightness(0);
  }, [activeProfileName, activeVariant]);

  // Close popover/dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-tab-button]")
      ) {
        setActiveTab(null);
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

  // ── Settings helpers ────────────────────────────────────────────

  const set = (key: keyof GallerySettings, value: number | string) => {
    onSettingsChange({ [key]: value });
  };

  const applyColorTransform = (hue: number, sat: number, light: number) => {
    const base = baseColorsRef.current;
    onSettingsChange({
      color1: transformHex(base.c1, hue, sat, light),
      color2: transformHex(base.c2, hue, sat, light),
      color3: transformHex(base.c3, hue, sat, light),
    });
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

  const handleManualColor = (key: "color1" | "color2" | "color3", baseKey: "c1" | "c2" | "c3") => (v: string) => {
    onSettingsChange({ [key]: v });
    baseColorsRef.current[baseKey] = v;
    setHueShift(0);
    setSaturation(1.0);
    setLightness(0);
  };

  // ── Tab availability ────────────────────────────────────────────

  const showThickness = hasThickenControls(activeVariant);
  const showMorph = hasMorphControls(activeVariant);

  const tabs: { key: ControlTab; label: string; show: boolean }[] = [
    { key: "size", label: "Size", show: true },
    { key: "thickness", label: "Thickness", show: showThickness },
    { key: "morph", label: "Morph", show: showMorph },
    { key: "motion", label: "Motion", show: true },
    { key: "colours", label: "Colours", show: true },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  const toggleTab = (tab: ControlTab) => {
    if (expanded) return; // In expanded mode, all are shown
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const pxDia = approxPixelDia(settings.scale, GALLERY_CELL_SIZE);

  // ── Render controls for a tab ─────────────────────────────────

  const renderTabControls = (tab: ControlTab) => {
    switch (tab) {
      case "size":
        return (
          <SliderRow
            label={`Orb Scale (~${pxDia}px)`}
            value={settings.scale}
            min={0.05}
            max={0.72}
            step={0.01}
            unit="x"
            onChange={(v) => set("scale", v)}
          />
        );

      case "thickness":
        return (
          <div className="space-y-3">
            <SliderRow label="Thin Radius" value={settings.thinRadius} min={0.05} max={0.3} step={0.005} onChange={(v) => set("thinRadius", v)} />
            <SliderRow label="Thick Radius" value={settings.thickRadius} min={0.15} max={0.45} step={0.005} onChange={(v) => set("thickRadius", v)} />
            <SliderRow label="Thicken Speed" value={settings.thickenSpeed} min={0.3} max={4.0} step={0.1} unit="s" onChange={(v) => set("thickenSpeed", v)} />
          </div>
        );

      case "morph":
        return (
          <div className="space-y-3">
            <SliderRow label="Morph Speed" value={settings.thickenSpeed} min={0.3} max={5.0} step={0.1} unit="s" onChange={(v) => set("thickenSpeed", v)} />
            <SliderRow label="Torus Radius" value={settings.torusRadius} min={0.1} max={0.45} step={0.005} onChange={(v) => set("torusRadius", v)} />
          </div>
        );

      case "motion":
        return (
          <div className="space-y-3">
            <SliderRow label="Wave Intensity" value={settings.waveIntensity} min={0.02} max={0.5} step={0.01} onChange={(v) => set("waveIntensity", v)} />
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <SliderRow
                  label={`Idle Intensity (${(settings.waveIntensity * settings.idleAmp).toFixed(4)})`}
                  value={settings.idleAmp * 100}
                  min={0}
                  max={20}
                  step={0.5}
                  unit="%"
                  disabled={idleLocked}
                  onChange={(v) => set("idleAmp", v / 100)}
                />
              </div>
              <button
                onClick={() => setIdleLocked((p) => !p)}
                className="mb-0.5 p-1 rounded transition-colors cursor-pointer hover:bg-gray-100"
              >
                {idleLocked
                  ? <Lock size={14} className="text-gray-400" />
                  : <Unlock size={14} className="text-gray-500" />}
              </button>
            </div>
            <SliderRow label="Breath Amplitude" value={settings.breathAmp} min={0} max={0.1} step={0.005} onChange={(v) => set("breathAmp", v)} />
          </div>
        );

      case "colours":
        return (
          <div className="space-y-3">
            <SliderRow label="Hue Shift" value={hueShift} min={0} max={360} step={1} unit="°" onChange={handleHueShift} />
            <SliderRow label="Saturation" value={saturation} min={0} max={2.0} step={0.05} unit="x" onChange={handleSaturation} />
            <SliderRow label="Lightness" value={lightness} min={-0.5} max={0.5} step={0.01} onChange={handleLightness} />
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────

  const colorSwatches = [
    { label: "Highlight", value: settings.color1, handler: handleManualColor("color1", "c1") },
    { label: "Mid Tone", value: settings.color2, handler: handleManualColor("color2", "c2") },
    { label: "Edge", value: settings.color3, handler: handleManualColor("color3", "c3") },
    { label: "Background", value: settings.bgColor, handler: (v: string) => set("bgColor", v) },
  ];

  return (
    <>
    {/* Mobile side drawer */}
    {isMobile && (
      <div
        className={`fixed top-0 right-0 bottom-0 w-[320px] z-[51] bg-white border-l border-gray-200 overflow-y-auto transition-transform duration-300 ease-in-out ${
          expanded ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 space-y-6">
          {visibleTabs.map((tab) => (
            <div key={tab.key}>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {tab.label}
              </h3>
              {renderTabControls(tab.key)}
            </div>
          ))}
          <div className="pt-3 border-t border-gray-200 space-y-2">
            {colorSwatches.map((c) => (
              <div key={c.label} className="flex items-center gap-1.5">
                <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-gray-200">
                  <div className="absolute inset-0" style={{ backgroundColor: c.value }} />
                  <input
                    type="color"
                    value={c.value}
                    onChange={(e) => c.handler(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-[10px] text-gray-500">{c.label}</span>
                <span className="text-[10px] text-gray-400 tabular-nums uppercase">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Popover for single tab (non-expanded mode) */}
      {!expanded && activeTab && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg animate-[slideUp_200ms_ease-out]"
          style={{ maxHeight: "50vh", overflowY: "auto" }}
        >
          <div className="max-w-3xl mx-auto p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              {visibleTabs.find((t) => t.key === activeTab)?.label}
            </h3>
            {renderTabControls(activeTab)}
          </div>
        </div>
      )}

      {/* Expanded drawer — slides up/down from behind the bar */}
      {!isMobile && <div className="absolute bottom-full left-0 right-0 overflow-hidden pointer-events-none" style={{ height: "60vh" }}>
        <div
          className={`absolute bottom-0 left-0 right-0 pointer-events-auto transition-transform duration-300 ease-in-out ${
            expanded ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="bg-white border-t border-gray-200 shadow-lg max-h-[60vh] overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4">
              <div className="flex gap-6">
                {visibleTabs.map((tab) => (
                  <div key={tab.key} className="flex-1 min-w-[200px]">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      {tab.label}
                    </h3>
                    {renderTabControls(tab.key)}
                  </div>
                ))}
              </div>
              {/* Colour swatches row */}
              <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-200">
                {colorSwatches.map((c) => (
                  <div key={c.label} className="flex items-center gap-1.5">
                    <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full border border-gray-200">
                      <div className="absolute inset-0" style={{ backgroundColor: c.value }} />
                      <input
                        type="color"
                        value={c.value}
                        onChange={(e) => c.handler(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <span className="text-[10px] text-gray-500">{c.label}</span>
                    <EditableHex value={c.value} onChange={c.handler} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>}

      {/* Main bar */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
          {/* Hamburger toggle */}
          <button
            onClick={() => { setExpanded((p) => !p); setActiveTab(null); }}
            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            {expanded ? <X size={14} /> : <Menu size={14} />}
          </button>

          <div className="w-px h-6 bg-gray-200" />

          {/* Variant pills */}
          <div className="flex items-center gap-1">
            {GALLERY_VARIANTS.map((v) => (
              <button
                key={v}
                onClick={() => onVariantChange(v)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                  activeVariant === v
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {GALLERY_VARIANT_LABELS[v]}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* Goal toggle + loop (only for variants with goal support) */}
          {hasGoal && (
            <>
              <button
                onClick={onGoalToggle}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
              >
                {showThickness
                  ? (goal === 0 ? "Thick" : "Thin")
                  : (goal === 0 ? "∞" : "⟲")}
              </button>
              <button
                onClick={onLoopToggle}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLooping
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                <Repeat size={14} />
              </button>
              <div className="w-px h-6 bg-gray-200" />
            </>
          )}

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown((p) => !p)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer min-w-[100px]"
            >
              <span className="truncate text-gray-600 max-w-[100px]">
                {activeProfileName}
              </span>
              <ChevronDown size={12} className="text-gray-400 shrink-0" />
            </button>
            {showProfileDropdown && (
              <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {/* Default always first */}
                <div
                  className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 ${
                    activeProfileName === "Default" ? "font-medium text-gray-700" : "text-gray-600"
                  }`}
                  onClick={() => { onProfileSelect(-1); setShowProfileDropdown(false); }}
                >
                  Default
                </div>
                {profileNames.map((name, i) => (
                  <div
                    key={i}
                    className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 ${
                      activeProfileName === name ? "font-medium text-gray-700" : "text-gray-600"
                    }`}
                    onClick={() => { onProfileSelect(i); setShowProfileDropdown(false); }}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* Tab buttons */}
          <div className="flex items-center gap-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                data-tab-button
                onClick={() => toggleTab(tab.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-gray-100 text-gray-800"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Colour swatches */}
          <div className="flex items-center gap-1">
            {[settings.color1, settings.color2, settings.color3].map((color, i) => (
              <div
                key={i}
                className="relative h-6 w-6 rounded-full border border-gray-200 overflow-hidden shrink-0"
              >
                <div className="absolute inset-0 rounded-full" style={{ backgroundColor: color }} />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const key = (["color1", "color2", "color3"] as const)[i];
                    const baseKey = (["c1", "c2", "c3"] as const)[i];
                    handleManualColor(key, baseKey)(e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="flex-1" />

          {/* Update / Bookmark / Save buttons */}
          {!isDefault && isDirty && (
            <button
              onClick={onUpdate}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
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
                ? "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 px-2 py-1.5"
                : bookmarkCount > 0
                  ? "bg-gray-100 text-gray-500 hover:bg-gray-200 px-2 py-1.5"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 p-1.5"
            }`}
          >
            <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} strokeWidth={1.5} />
            {bookmarkCount > 0 && (
              <span className={`text-[11px] tabular-nums ${isBookmarked ? "text-amber-600" : "text-gray-400"}`}>
                {bookmarkCount}
              </span>
            )}
          </button>

          {showSaveDialog ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
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
                className="w-28 px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-gray-400"
                autoFocus
              />
              <button
                onClick={() => {
                  if (saveName.trim()) {
                    onSave(saveName.trim());
                    setShowSaveDialog(false);
                    setSaveName("");
                  }
                }}
                className="text-gray-500 hover:text-green-600 transition-colors cursor-pointer"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => { setShowSaveDialog(false); setSaveName(""); }}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setSaveName(suggestedName); setShowSaveDialog(true); }}
              className="p-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <Save size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default GalleryNavBar;
