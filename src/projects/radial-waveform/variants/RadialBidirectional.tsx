import { useEffect, useRef } from "react";
import { RadialWaveformProps } from "../types";
import { mapFrequencyToBars } from "../mapFrequency";

export interface RadialBidirectionalProps extends RadialWaveformProps {
  inwardRatio: number;
  /** Pin all bars at minBarLength regardless of audio/wave state. Used by
   *  the radial-states animator to enforce frozen-min during thinking and
   *  Phase A of any thinking-related morph. Bypasses the smoothing block
   *  entirely; on the false→true transition, zeros prevValuesRef so
   *  re-entry to reactive state starts clean. */
  freezeAtMin?: boolean;
}

/**
 * Refs-based renderer (post tasks/radial-states-animator-plan.md §6.5).
 * Main draw effect depends only on `effectiveRenderExtent` — every other
 * live prop, including `frequencyData`, flows through `propsRef` so
 * per-frame parent re-renders never tear down the canvas + RAF loop.
 */
export default function RadialBidirectional(props: RadialBidirectionalProps) {
  const {
    radius,
    barWidth,
    barGap,
    minBarLength,
    maxBarLength,
    barColor,
    bgColor,
    roundCaps,
    showEnvelopeCeiling,
    renderExtent,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastDrawRef = useRef(0);
  const rotationRef = useRef(0);
  const lastTimeRef = useRef(0);
  const waveTimeRef = useRef(0);
  const prevValuesRef = useRef<number[]>([]);
  const wasFreezeAtMinRef = useRef(false);

  // Live props ref — synced every render, read inside the RAF loop.
  const propsRef = useRef(props);
  propsRef.current = props;

  // Per-variant fallback: bars extend BOTH inward (limited) and outward;
  // canvas needs to fit radius + maxBarLength outward + padding.
  const effectiveRenderExtent =
    renderExtent ?? radius + maxBarLength + 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const size = effectiveRenderExtent * 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    lastTimeRef.current = performance.now();

    const draw = (now: number) => {
      rafRef.current = requestAnimationFrame(draw);
      const p = propsRef.current;

      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      rotationRef.current += (p.rotationSpeed * Math.PI) / 180 * dt;
      waveTimeRef.current += dt;

      if (p.updateRate > 0 && now - lastDrawRef.current < p.updateRate) return;
      lastDrawRef.current = now;

      ctx.clearRect(0, 0, size, size);

      const circumference = 2 * Math.PI * p.radius;
      const barCount =
        p.barCount ?? Math.max(1, Math.floor(circumference / (p.barWidth + p.barGap)));
      const minInnerRadius = (barCount * p.barGap) / (2 * Math.PI);
      const maxSafeInward = Math.max(0, p.radius - minInnerRadius);

      // Entry-frame zero rule: when freezeAtMin transitions false→true,
      // wipe prevValuesRef so re-entry to reactive state has no residue.
      if (p.freezeAtMin && !wasFreezeAtMinRef.current) {
        prevValuesRef.current = new Array(barCount).fill(0);
      }
      wasFreezeAtMinRef.current = !!p.freezeAtMin;

      let values: number[];
      if (p.freezeAtMin) {
        values = new Array(barCount).fill(0);
      } else {
        values = mapFrequencyToBars(p.frequencyData, barCount, p.sensitivity, p.segments);
      }

      if (prevValuesRef.current.length !== barCount) {
        prevValuesRef.current = new Array(barCount).fill(0);
      }

      const inwardRatio = (p as RadialBidirectionalProps).inwardRatio ?? 0;

      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2 + rotationRef.current;
        let value = values[i];

        if (!p.freezeAtMin && p.ambientWave) {
          const lobes = p.waveShape === "segments" ? p.segments : p.waveLobes;
          const phase = angle * lobes - waveTimeRef.current * p.waveSpeed;

          let wave: number;
          switch (p.waveShape) {
            case "sine":
            case "segments":
              wave = (Math.sin(phase) + 1) / 2;
              break;
            case "triangle": {
              const t = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
              wave = t < Math.PI ? t / Math.PI : 2 - t / Math.PI;
              break;
            }
            case "square":
              wave = Math.sin(phase) >= 0 ? 1 : 0;
              break;
          }

          if (p.envelopeSensitivity > 0) {
            const sensFactor = 1 - p.envelopeSensitivity * (1 - wave);
            value = value * sensFactor;
          }

          value = Math.min(1, value * p.waveHeight + wave * p.waveAmplitude);
          if (p.waveMode === "reactive") {
            value = value * (1 + wave * p.waveAmplitude * 3);
          }

          if (p.waveEnvelope > 0 && p.envelopeAmplitude > 0) {
            const ceiling = wave * p.envelopeAmplitude + p.envelopeAmplitude * 0.1;
            const effectiveCeiling = 1 - p.waveEnvelope * (1 - ceiling);
            value = Math.min(value, effectiveCeiling);
          }
        }

        if (!p.freezeAtMin && p.smoothing > 0) {
          const lerpFactor = 1 - p.smoothing;
          value = prevValuesRef.current[i] + (value - prevValuesRef.current[i]) * lerpFactor;
        }
        if (!p.freezeAtMin) prevValuesRef.current[i] = value;

        const totalLength = p.minBarLength + value * (p.maxBarLength - p.minBarLength);
        const inwardLength = Math.min(totalLength * inwardRatio, maxSafeInward);
        const outwardLength = totalLength * (1 - inwardRatio);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, -(p.radius - inwardLength));
        ctx.lineTo(0, -(p.radius + outwardLength));
        ctx.strokeStyle = p.barColor;
        ctx.lineWidth = p.barWidth;
        ctx.lineCap = p.roundCaps ? "round" : "butt";
        ctx.globalAlpha = p.intensityOpacity ? 0.4 + value * 0.6 : 1;
        ctx.stroke();
        ctx.restore();
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [effectiveRenderExtent]);

  const size = effectiveRenderExtent * 2;
  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}
