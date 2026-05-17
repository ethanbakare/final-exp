// CSW-010 P0/3d — per-state editor panel for circle voice.
// Pure relocation of the editor IIFE from CircleVoicePreview's VoiceStage
// (the linked-to-idle banner + the Layout/Visual/Motion/Bars/Audio/Ambient
// Wave control grid). No render-math, no audio, no persistence. Shared by
// the standalone page AND the Final-EXP realtime-states CircleEditorPanel
// (plan §3d/§5) so the editor is authored once.

import type React from "react";
import {
  type CircleSawSettings,
  type WaveDirection,
  MIN_BAR_HEIGHT_MAX,
} from "./circleWaveformCore";
import type { CircleTransitions, VoiceState } from "./circleVoice";
import {
  Slider,
  Toggle,
  ControlSection,
  ColorControl,
} from "./circleWaveformControls";

export interface CircleControlsPanelProps {
  /** focused state (= the live voiceState) */
  voiceState: VoiceState;
  /** idle/listening lock */
  linked: boolean;
  /** the focused state's snapshot (bundle.settings[voiceState]) */
  s: CircleSawSettings;
  /** live (possibly-unsaved) transition durations */
  transitions: CircleTransitions;
  /** Wave Amplitude eye pinned-state */
  waveReachVisible: boolean;
  onBreakLink: () => void;
  /** per-state / identity setting write (updateStateSetting) */
  onSetting: <K extends keyof CircleSawSettings>(
    key: K,
    value: CircleSawSettings[K],
  ) => void;
  /** motion-timing write (ref-write + parent re-render) */
  onTransition: (key: keyof CircleTransitions, value: number) => void;
  setPreviewEnvelope: React.Dispatch<
    React.SetStateAction<"max" | "min" | null>
  >;
  setWaveReachVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setWaveReachHovered: React.Dispatch<React.SetStateAction<boolean>>;
}

export function CircleControlsPanel({
  voiceState,
  linked,
  s,
  transitions,
  waveReachVisible,
  onBreakLink,
  onSetting,
  onTransition,
  setPreviewEnvelope,
  setWaveReachVisible,
  setWaveReachHovered,
}: CircleControlsPanelProps) {
  // While linked, listening mirrors idle and has no own editor —
  // show the radial-states-style banner + Break-link instead.
  if (voiceState === "listening" && linked) {
    return (
      <div className="flex items-center gap-4 border-t border-white/10 bg-[#1a1a1e] px-6 py-5 text-sm text-gray-400">
        <span>
          Linked to Idle — listening mirrors idle&apos;s settings while
          linked. Edit Idle to change both; break the link to give
          listening its own settings.
        </span>
        <button
          type="button"
          onClick={onBreakLink}
          className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-medium text-gray-200 hover:bg-white/10"
        >
          Break link
        </button>
      </div>
    );
  }
  const refScale = s.scaleMode === "reference-scale";
  const seg = (active: boolean) =>
    `rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] transition-colors ${
      active
        ? "bg-white/10 text-white"
        : "text-gray-500 hover:text-gray-300"
    } ${s.ambientWave ? "" : "cursor-not-allowed opacity-50"}`;
  const waveLabel = s.ambientWave ? "text-gray-400" : "text-gray-600";
  // Per-state motion timing (radial-states scoping): each state's
  // section shows ONLY the time(s) relevant to entering/leaving it.
  const motionForState: ReadonlyArray<
    readonly [keyof CircleTransitions, string]
  > =
    voiceState === "idle"
      ? [["toIdle", "Settle into idle"]]
      : voiceState === "listening"
        ? [["toListening", "Settle into listening"]]
        : voiceState === "thinking"
          ? [["toThinking", "Settle into thinking"]]
          : [
              ["toTalking", "Settle into talking"],
              ["talkingExit", "Talking exit"],
            ];
  return (
    <div className="border-t border-white/10 bg-[#1a1a1e] px-4 py-3">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <ControlSection title={`Layout · editing ${voiceState}`}>
            <Slider label="Circle Width" value={s.diameter} min={50} max={640} step={2} unit="px" onChange={(v) => onSetting("diameter", v)} />
            <div
              onMouseEnter={() => setPreviewEnvelope("max")}
              onMouseLeave={() => setPreviewEnvelope(null)}
            >
              <Slider label="Max Height" value={s.apexCircleHeight} min={20} max={640} step={2} unit="px" eyeIcon onChange={(v) => onSetting("apexCircleHeight", v)} />
            </div>
            <div
              onMouseEnter={() => setPreviewEnvelope("min")}
              onMouseLeave={() => setPreviewEnvelope(null)}
            >
              <Slider label="Min Height" value={s.arcCircleHeight} min={0} max={640} step={2} unit="px" eyeIcon onChange={(v) => onSetting("arcCircleHeight", v)} />
            </div>
          </ControlSection>
          <ControlSection title="Visual">
            <div className="grid grid-cols-2 items-center gap-x-4">
              <Toggle label="Show Circle" checked={s.circleVisible} onChange={(v) => onSetting("circleVisible", v)} />
              <Slider label="Opacity" value={Number(s.circleOpacity.toFixed(2))} min={0} max={1} step={0.01} onChange={(v) => onSetting("circleOpacity", v)} />
            </div>
            <ColorControl label="Circle" value={s.circleColor} onChange={(v) => onSetting("circleColor", v)} />
            <ColorControl label="Bars" value={s.barColor} onChange={(v) => onSetting("barColor", v)} />
            <ColorControl label="Page" value={s.pageColor} onChange={(v) => onSetting("pageColor", v)} />
          </ControlSection>
          <ControlSection title="Motion Timing (s)">
            {motionForState.map(([key, label]) => (
              <Slider
                key={key}
                label={label}
                value={Number(transitions[key].toFixed(2))}
                min={0.1}
                max={4}
                step={0.05}
                unit="s"
                onChange={(v) => onTransition(key, v)}
              />
            ))}
          </ControlSection>
        </div>
        <ControlSection title="Bars">
          <Toggle label="Reference scale" checked={refScale} onChange={(c) => onSetting("scaleMode", c ? "reference-scale" : "static")} />
          <Slider label="Line Thickness" value={s.barWidth} min={2} max={56} step={0.5} unit="px" disabled={refScale} onChange={(v) => onSetting("barWidth", v)} />
          <Slider label="Step Thinning" value={Number((s.thicknessFalloff * 100).toFixed(1))} min={0} max={45} step={1} unit="%" disabled={refScale} onChange={(v) => onSetting("thicknessFalloff", v / 100)} />
          <Slider label="Outer Minimum" value={Number((s.minThicknessRatio * 100).toFixed(1))} min={10} max={100} step={1} unit="%" disabled={refScale} onChange={(v) => onSetting("minThicknessRatio", v / 100)} />
          <Slider label="Gap Offset" value={s.barGap} min={-6} max={12} step={0.5} unit="px" onChange={(v) => onSetting("barGap", v)} />
          <Slider label="Min Bar Height" value={s.minBarHeight} min={0} max={MIN_BAR_HEIGHT_MAX} step={1} unit="px" onChange={(v) => onSetting("minBarHeight", v)} />
          <Slider label="Line Inset" value={s.lineInset} min={0} max={64} step={1} unit="px" onChange={(v) => onSetting("lineInset", v)} />
        </ControlSection>
        <ControlSection title="Audio">
          <Slider label="Spectral Mix" value={Number(s.spectralMix.toFixed(2))} min={0} max={1} step={0.01} onChange={(v) => onSetting("spectralMix", v)} />
          <Slider label="Sensitivity" value={Number(s.sensitivity.toFixed(2))} min={0.1} max={5} step={0.05} onChange={(v) => onSetting("sensitivity", v)} />
          <Slider label="Noise Floor" value={Number(s.noiseFloor.toFixed(2))} min={0} max={0.95} step={0.01} onChange={(v) => onSetting("noiseFloor", v)} />
          <Slider label="Update Rate" value={s.updateRate} min={16} max={200} step={1} unit="ms" onChange={(v) => onSetting("updateRate", v)} />
          <Slider label="Smoothing" value={s.smoothing} min={0} max={500} step={1} unit="ms" onChange={(v) => onSetting("smoothing", v)} />
          <Toggle label="Intensity Opacity" checked={s.intensityOpacity} onChange={(v) => onSetting("intensityOpacity", v)} />
        </ControlSection>
        <ControlSection title="Ambient Wave">
          <Toggle label="Ambient Wave" checked={s.ambientWave} onChange={(v) => { onSetting("ambientWave", v); setWaveReachVisible(v); }} />
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className={waveLabel}>Wave Direction</span>
            <div className="flex gap-1 rounded-md border border-white/10 bg-white/[0.03] p-1">
              {(
                [
                  { value: "inward", label: "inward" },
                  { value: "right", label: "right →" },
                  { value: "left", label: "← left" },
                ] as const
              ).map((opt) => (
                <button key={opt.value} type="button" disabled={!s.ambientWave} onClick={() => onSetting("waveDirection", opt.value as WaveDirection)} className={seg(s.waveDirection === opt.value)}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className={waveLabel}>Wave Shape</span>
            <div className="flex gap-1 rounded-md border border-white/10 bg-white/[0.03] p-1">
              {(
                [
                  { value: "sine", label: "sine" },
                  { value: "sine-pulse", label: "sine pulse" },
                  { value: "pulse", label: "pulse" },
                ] as const
              ).map((opt) => (
                <button key={opt.value} type="button" disabled={!s.ambientWave} onClick={() => onSetting("waveShape", opt.value)} className={seg(s.waveShape === opt.value)}>{opt.label}</button>
              ))}
            </div>
          </div>
          <Slider label="Wave Speed" value={Number(s.waveSpeed.toFixed(2))} min={0} max={10} step={0.1} disabled={!s.ambientWave} onChange={(v) => onSetting("waveSpeed", v)} />
          <Slider
            label="Wave Amplitude"
            value={Number(s.waveAmplitude.toFixed(2))}
            min={0}
            max={1}
            step={0.01}
            disabled={!s.ambientWave}
            eyeTitle={waveReachVisible ? "Hide the red wave-reach ghost" : "Show the red wave-reach ghost"}
            eyeActive={waveReachVisible}
            eyeColor="#dc2626"
            onEyeToggle={() => setWaveReachVisible((v) => !v)}
            onEyeHoverChange={setWaveReachHovered}
            onChange={(v) => onSetting("waveAmplitude", v)}
          />
          <Slider label="Audio Boost" value={Number(s.waveHeight.toFixed(2))} min={0} max={4} step={0.05} disabled={!s.ambientWave} onChange={(v) => onSetting("waveHeight", v)} />
          <Slider label="Wave Cycles" value={Number((s.waveCycles ?? 1).toFixed(2))} min={0.1} max={5} step={0.01} disabled={!s.ambientWave} onChange={(v) => onSetting("waveCycles", v)} />
          <Slider label="Pulse Width" value={Number(s.pulseWidth.toFixed(2))} min={0.05} max={1} step={0.01} disabled={!s.ambientWave} onChange={(v) => onSetting("pulseWidth", v)} />
          <Toggle label="Invert Audio (shrink on sound)" checked={s.audioInvert} onChange={(v) => onSetting("audioInvert", v)} />
        </ControlSection>
      </div>
    </div>
  );
}
