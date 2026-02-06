import React, { useRef, useEffect, useState } from "react";
import type { RadialVariant, RadialSettings } from "../types";
import RadialOutward from "../variants/RadialOutward";
import RadialBidirectional from "../variants/RadialBidirectional";
import RadialInward from "../variants/RadialInward";
import { Trash2, Bookmark } from "lucide-react";

const CELL_SIZE = 350;
const CELL_BORDER = 0.8;

/** WCAG relative luminance from a hex color. Returns true if light background. */
function isLightBg(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.4;
}

interface Props {
  variant: RadialVariant;
  settings: RadialSettings;
  profileName: string;
  profileId: string;
  isActive: boolean;
  isDefault: boolean;
  frequencyData: Uint8Array | null;
  isBookmarked: boolean;
  isActiveSection: boolean;
  showEnvelopeCeiling?: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onBookmarkToggle?: () => void;
}

function VariantRenderer({
  variant,
  settings,
  frequencyData,
  showEnvelopeCeiling,
}: {
  variant: RadialVariant;
  settings: RadialSettings;
  frequencyData: Uint8Array | null;
  showEnvelopeCeiling?: boolean;
}) {
  const props = {
    frequencyData,
    radius: settings.radius,
    barWidth: settings.barWidth,
    barGap: settings.barGap,
    minBarLength: settings.minBarLength,
    maxBarLength: settings.maxBarLength,
    sensitivity: settings.sensitivity,
    barColor: settings.barColor,
    bgColor: "transparent",
    segments: settings.segments,
    roundCaps: settings.roundCaps,
    intensityOpacity: settings.intensityOpacity,
    updateRate: settings.updateRate,
    rotationSpeed: settings.rotationSpeed,
    ambientWave: settings.ambientWave,
    waveSpeed: settings.waveSpeed,
    waveAmplitude: settings.waveAmplitude,
    waveHeight: settings.waveHeight,
    waveMode: settings.waveMode,
    waveShape: settings.waveShape,
    waveLobes: settings.waveLobes,
    smoothing: settings.smoothing,
    waveEnvelope: settings.waveEnvelope,
    envelopeAmplitude: settings.envelopeAmplitude,
    envelopeSensitivity: settings.envelopeSensitivity,
    showEnvelopeCeiling,
  };

  switch (variant) {
    case "outward":
      return <RadialOutward {...props} />;
    case "bidirectional":
      return <RadialBidirectional {...props} inwardRatio={settings.inwardRatio} />;
    case "inward":
      return <RadialInward {...props} />;
  }
}

const RadialGalleryCell: React.FC<Props> = React.memo(({
  variant,
  settings,
  profileName,
  profileId,
  isActive,
  isDefault,
  isBookmarked,
  frequencyData,
  isActiveSection,
  showEnvelopeCeiling,
  onSelect,
  onDelete,
  onBookmarkToggle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const light = isLightBg(settings.previewBg);

  // Only pass real freq data if in the active section
  const cellFreqData = isActiveSection ? frequencyData : null;

  // Container + outline styles
  const containerStyle: React.CSSProperties = {
    backgroundColor: settings.containerBg
      ? `${settings.containerBg}${Math.round(settings.containerBgOpacity * 255).toString(16).padStart(2, "0")}`
      : undefined,
    borderRadius: settings.containerRadius > 0 ? settings.containerRadius : undefined,
    padding: settings.containerPadding > 0 ? settings.containerPadding : undefined,
    outline: settings.showOutline ? `${settings.outlineWidth}px solid ${settings.outlineColor}` : undefined,
    outlineOffset: settings.showOutline ? -settings.outlineWidth : undefined,
  };

  return (
    <div
      ref={containerRef}
      data-cell-key={`${variant}:${profileId}`}
      onClick={onSelect}
      onDoubleClick={() => { if (!isDefault && onBookmarkToggle) onBookmarkToggle(); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex-none cursor-pointer select-none overflow-hidden"
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        border: `${CELL_BORDER}px solid ${light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)"}`,
        marginLeft: -CELL_BORDER,
        marginTop: -CELL_BORDER,
        backgroundColor: settings.previewBg,
      }}
    >
      {/* Live variant */}
      {isVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={containerStyle} className="inline-flex items-center justify-center">
            <VariantRenderer
              variant={variant}
              settings={settings}
              frequencyData={cellFreqData}
              showEnvelopeCeiling={showEnvelopeCeiling}
            />
          </div>
        </div>
      )}

      {/* Delete button (top-left, hover-reveal) */}
      {!isDefault && onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="absolute top-2 left-2 p-1.5 rounded-md transition-all cursor-pointer"
          style={{
            backgroundColor: isHovered
              ? (light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)")
              : "transparent",
            border: isHovered
              ? "none"
              : `${CELL_BORDER}px solid ${light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.2)"}`,
            color: light
              ? (isHovered ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.07)")
              : (isHovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)"),
          }}
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Selection indicator (top-right) */}
      <div
        className="absolute top-2 right-2 rounded-full pointer-events-none transition-all"
        style={{
          width: 14,
          height: 14,
          ...(isActive
            ? { backgroundColor: "#22c55e", border: "none" }
            : {
                backgroundColor: "transparent",
                border: `${CELL_BORDER}px solid ${light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.2)"}`,
              }),
        }}
      />

      {/* Bookmark indicator (bottom-left) */}
      {isBookmarked && (
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <Bookmark
            size={14}
            fill="none"
            strokeWidth={1.2}
            style={{ color: light ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.45)" }}
          />
        </div>
      )}

      {/* Profile name (bottom center) */}
      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
        <span
          className="text-xs"
          style={{ color: light ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" }}
        >{profileName}</span>
      </div>
    </div>
  );
});

RadialGalleryCell.displayName = "RadialGalleryCell";

export { CELL_SIZE, CELL_BORDER };
export default RadialGalleryCell;
