/**
 * GalleryCell – A single 400×400 cell containing a live orb preview.
 * Each cell has its own Canvas, renders the appropriate variant,
 * shows a label at the bottom, and highlights when selected.
 */
import React, { useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { AudioData, OrbConfig } from "../types";
import type { GalleryVariant, GallerySettings } from "../galleryTypes";
import {
  GALLERY_CELL_SIZE,
  GALLERY_BORDER,
  CAMERA_Z,
  CAMERA_FOV,
  approxPixelDia,
  isLightColor,
} from "../galleryTypes";
import GentleOrbThicken from "../variants/GentleOrbThicken";
import CoralStone from "../variants/CoralStone";
import CoralStoneTorusDamped from "../variants/CoralStoneTorusDamped";
import CoralStoneMorph from "../variants/CoralStoneMorph";
import { Trash2, Bookmark, Check, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────

interface GalleryCellProps {
  variant: GalleryVariant;
  settings: GallerySettings;
  profileName: string;
  profileId: string;
  isActive: boolean;
  isDefault: boolean;
  isBookmarked: boolean;
  audioData: AudioData;
  goal?: number;
  isActiveSection: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onBookmarkToggle?: () => void;
}

// ── Zero audio for idle cells ─────────────────────────────────────

const ZERO_AUDIO: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };

// ── Orb Renderer ──────────────────────────────────────────────────

function OrbRenderer({
  variant,
  settings,
  audioData,
  goal = 0,
}: {
  variant: GalleryVariant;
  settings: GallerySettings;
  audioData: AudioData;
  goal?: number;
}) {
  const {
    scale,
    thinRadius,
    thickRadius,
    thickenSpeed,
    torusRadius,
    waveIntensity,
    breathAmp,
    idleAmp,
    color1,
    color2,
    color3,
  } = settings;

  switch (variant) {
    case "thicken":
      return (
        <GentleOrbThicken
          audioData={audioData}
          goal={goal}
          scale={scale}
          thinRadius={thinRadius}
          thickRadius={thickRadius}
          thickenSpeed={thickenSpeed}
          waveIntensity={waveIntensity}
          breathAmp={breathAmp}
          idleAmp={idleAmp}
          color1={color1}
          color2={color2}
          color3={color3}
        />
      );

    case "coralstone": {
      const config: OrbConfig = {
        palette: [color1, color2, color3],
        bloomStrength: 0.0,
        maxDisplacement: waveIntensity,
        breatheAmp: breathAmp,
        smoothingConstant: 0.15,
        idleAmp,
      };
      return (
        <group scale={scale}>
          <CoralStone audioData={audioData} config={config} />
        </group>
      );
    }

    case "coralstonedamped":
      return (
        <CoralStoneTorusDamped
          audioData={audioData}
          goal={goal}
          scale={scale}
          thinRadius={thinRadius}
          thickRadius={thickRadius}
          thickenSpeed={thickenSpeed}
          waveIntensity={waveIntensity}
          breathAmp={breathAmp}
          idleAmp={idleAmp}
          color1={color1}
          color2={color2}
          color3={color3}
        />
      );

    case "coralmorph":
      return (
        <CoralStoneMorph
          audioData={audioData}
          goal={goal}
          scale={scale}
          morphSpeed={thickenSpeed}
          torusRadius={torusRadius}
          waveIntensity={waveIntensity}
          breathAmp={breathAmp}
          idleAmp={idleAmp}
          color1={color1}
          color2={color2}
          color3={color3}
        />
      );

    default:
      return null;
  }
}

// ── Main Cell Component ───────────────────────────────────────────

const GalleryCell: React.FC<GalleryCellProps> = ({
  variant,
  settings,
  profileName,
  profileId,
  isActive,
  isDefault,
  isBookmarked,
  audioData,
  goal = 0,
  isActiveSection,
  onSelect,
  onDelete,
  onBookmarkToggle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // IntersectionObserver: only render when visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const lightBg = isLightColor(settings.bgColor);
  const textColor = lightBg ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.55)";
  const pxDia = approxPixelDia(settings.scale, GALLERY_CELL_SIZE);

  // Only pass audio data if cell is in the active section, otherwise idle
  const cellAudio = isActiveSection ? audioData : ZERO_AUDIO;

  return (
    <div
      ref={containerRef}
      onClick={onSelect}
      onDoubleClick={() => { if (!isDefault && onBookmarkToggle) onBookmarkToggle(); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setConfirmingDelete(false); }}
      className="relative flex-none cursor-pointer select-none"
      style={{
        width: GALLERY_CELL_SIZE,
        height: GALLERY_CELL_SIZE,
        border: `${GALLERY_BORDER}px solid rgba(38,36,36,0.05)`,
        marginLeft: -GALLERY_BORDER,
        marginTop: -GALLERY_BORDER,
        backgroundColor: settings.bgColor,
      }}
    >
      {/* Live Canvas */}
      {isVisible && (
        <Canvas
          camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
          frameloop={isVisible && isActiveSection ? "always" : "demand"}
          style={{ position: "absolute", inset: 0 }}
        >
          <color attach="background" args={[settings.bgColor]} />
          <ambientLight intensity={0.5} />
          <OrbRenderer
            variant={variant}
            settings={settings}
            audioData={cellAudio}
            goal={goal}
          />
        </Canvas>
      )}

      {/* Bookmark icon (bottom-left) */}
      {isBookmarked && (
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <Bookmark
            size={14}
            fill="none"
            strokeWidth={1.2}
            style={{ color: lightBg ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.45)" }}
          />
        </div>
      )}

      {/* Label at bottom */}
      <div
        className="absolute bottom-2 left-0 right-0 text-center pointer-events-none"
        style={{ color: textColor }}
      >
        <span className="text-xs font-medium">
          {profileName}
          <span className="opacity-60"> – ~{pxDia}px</span>
        </span>
      </div>

      {/* Delete button (top-left, always visible but subtle, not for Default) */}
      {!isDefault && onDelete && (
        confirmingDelete ? (
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setConfirmingDelete(false);
              }}
              className="p-1.5 rounded-md transition-all cursor-pointer"
              style={{
                backgroundColor: lightBg ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)",
                color: lightBg ? "rgba(34,197,94,0.8)" : "rgba(34,197,94,0.9)",
              }}
            >
              <Check size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDelete(false);
              }}
              className="p-1.5 rounded-md transition-all cursor-pointer"
              style={{
                backgroundColor: lightBg ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)",
                color: lightBg ? "rgba(239,68,68,0.8)" : "rgba(239,68,68,0.9)",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmingDelete(true);
            }}
            className="absolute top-2 left-2 p-1.5 rounded-md transition-all cursor-pointer"
            style={{
              backgroundColor: isHovered
                ? (lightBg ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)")
                : "transparent",
              border: isHovered
                ? "none"
                : `${GALLERY_BORDER}px solid ${lightBg ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.2)"}`,
              color: lightBg
                ? (isHovered ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.07)")
                : (isHovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)"),
            }}
          >
            <Trash2 size={14} />
          </button>
        )
      )}

      {/* Selection circle (top-right) */}
      <div
        className="absolute top-2 right-2 rounded-full pointer-events-none transition-all"
        style={{
          width: 14,
          height: 14,
          ...(isActive
            ? { backgroundColor: "#22c55e", border: "none" }
            : {
                backgroundColor: "transparent",
                border: `${GALLERY_BORDER}px solid ${lightBg ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.2)"}`,
              }),
        }}
      />
    </div>
  );
};

export default GalleryCell;
