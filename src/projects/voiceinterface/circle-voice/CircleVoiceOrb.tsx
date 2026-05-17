// CSW-010 P0/3c — render-only SVG for the circle voice orb.
// Pure relocation of the <svg> block from CircleVoicePreview's VoiceStage
// (no math, no audio acquisition, no persistence, no editor UI). Shared by
// the standalone page AND the Final-EXP CircleRealtimeBlob so the SVG is
// authored once (P3 must NOT re-implement it — plan §3c). The editor-only
// eye ghosts are an optional injected prop; the live orb passes `ghosts`
// undefined.

import type { GeneratedBar, RenderedBar } from "./circleWaveformCore";

export interface CircleVoiceOrbGhosts {
  /** apex bars (geometry-centred) used for both ghost overlays */
  apexBars: GeneratedBar[];
  /** per-pair arc radiusY lookup (min envelope) */
  arcRyByPair: Map<number, number>;
  previewEnvelope: "max" | "min" | null;
  waveReachVisible: boolean;
  waveReachHovered: boolean;
  ambientWave: boolean;
  waveAmplitude: number;
}

export interface CircleVoiceOrbProps {
  /** identity diameter (viewBox width + element width) */
  diameter: number;
  /** eased apex height (viewBox height + element height) */
  viewHeight: number;
  /** backdrop ellipse geometry (eased apex envelope) */
  radiusX: number;
  radiusY: number;
  /** eased backdrop opacity (circleVisible*circleOpacity) */
  circleOpacityEff: number;
  circleColor: string;
  barColor: string;
  intensityOpacity: boolean;
  /** per-frame rendered bars (already combined audio+wave+invert) */
  bars: RenderedBar[];
  /** editor-only eye-ghost overlays; live orb omits this */
  ghosts?: CircleVoiceOrbGhosts;
}

export function CircleVoiceOrb({
  diameter,
  viewHeight,
  radiusX,
  radiusY,
  circleOpacityEff,
  circleColor,
  barColor,
  intensityOpacity,
  bars,
  ghosts,
}: CircleVoiceOrbProps) {
  return (
    <svg
      aria-label="Circle voice preview"
      role="img"
      viewBox={`0 0 ${diameter} ${viewHeight}`}
      className="block max-h-[56vh] max-w-[76vw]"
      style={{ width: diameter, height: viewHeight }}
    >
      {circleOpacityEff > 0.001 && (
        <ellipse
          cx={radiusX}
          cy={radiusY}
          rx={radiusX}
          ry={radiusY}
          fill={circleColor}
          opacity={circleOpacityEff}
        />
      )}
      {bars.map((bar, index) => {
        const intensityFactor = intensityOpacity
          ? 0.4 + bar.value * 0.6
          : 1;
        return (
          <ellipse
            key={index}
            cx={bar.x}
            cy={bar.y}
            rx={bar.radiusX}
            ry={bar.radiusY}
            fill={barColor}
            opacity={intensityFactor}
          />
        );
      })}
      {/* Ghost overlays render AFTER the bars so the dashed outlines
          sit IN FRONT (SVG paint order = later on top). Max/Min Height
          hover ghosts both map over apexBars (geometry-centred); the
          "min" ghost uses each pair's arc ry so it reads at the
          centre relative to the real bars (not pinned to the viewBox
          top), and is stroked white to stay visible over the bars. */}
      {ghosts?.previewEnvelope &&
        ghosts.apexBars.map((bar, index) => {
          const ry =
            ghosts.previewEnvelope === "max"
              ? bar.radiusY
              : (ghosts.arcRyByPair.get(bar.pair) ?? bar.radiusY);
          return (
            <ellipse
              key={`ghost-${ghosts.previewEnvelope}-${index}`}
              cx={bar.x}
              cy={bar.y}
              rx={bar.radiusX}
              ry={ry}
              fill="none"
              stroke={ghosts.previewEnvelope === "max" ? barColor : "#ffffff"}
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={ghosts.previewEnvelope === "max" ? 0.45 : 0.9}
              pointerEvents="none"
            />
          );
        })}
      {/* Wave-reach ghosts — red (max) ceiling + blue (min) baseline.
          Gated by ambient wave + Wave Amplitude eye (click-pinned) OR
          eye-hover. Suppressed during a Max/Min hover preview. */}
      {ghosts &&
        ghosts.ambientWave &&
        !ghosts.previewEnvelope &&
        (ghosts.waveReachVisible || ghosts.waveReachHovered) && (
          <>
            {ghosts.apexBars.map((bar, index) => {
              const apexRy = bar.radiusY;
              const arcRy = ghosts.arcRyByPair.get(bar.pair) ?? apexRy;
              const ry = arcRy + ghosts.waveAmplitude * (apexRy - arcRy);
              return (
                <ellipse
                  key={`apex-ghost-${index}`}
                  cx={bar.x}
                  cy={bar.y}
                  rx={bar.radiusX}
                  ry={ry}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  opacity={0.85}
                  pointerEvents="none"
                />
              );
            })}
            {ghosts.apexBars.map((bar, index) => {
              const arcRy = ghosts.arcRyByPair.get(bar.pair) ?? bar.radiusY;
              return (
                <ellipse
                  key={`arc-ghost-${index}`}
                  cx={bar.x}
                  cy={bar.y}
                  rx={bar.radiusX}
                  ry={arcRy}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  opacity={0.85}
                  pointerEvents="none"
                />
              );
            })}
          </>
        )}
    </svg>
  );
}
