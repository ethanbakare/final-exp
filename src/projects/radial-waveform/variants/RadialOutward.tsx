import { useEffect, useRef } from "react";
import { RadialWaveformProps } from "../types";
import { mapFrequencyToBars } from "../mapFrequency";

/**
 * Refs-based renderer (post tasks/radial-states-animator-plan.md §6.5).
 * Main draw effect depends only on `effectiveRenderExtent` — every other
 * live prop, including `frequencyData`, flows through `propsRef`.
 */
export default function RadialOutward(props: RadialWaveformProps) {
  const { radius, maxBarLength, renderExtent } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastDrawRef = useRef(0);
  const rotationRef = useRef(0);
  const lastTimeRef = useRef(0);
  const waveTimeRef = useRef(0);
  const prevValuesRef = useRef<number[]>([]);
  const wasFreezeAtMinRef = useRef(false);

  const propsRef = useRef(props);
  propsRef.current = props;

  // Outward variant: bars extend OUTWARD — canvas needs radius + maxBarLength + padding.
  const effectiveRenderExtent = renderExtent ?? radius + maxBarLength + 20;

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

        const barLength = p.minBarLength + value * (p.maxBarLength - p.minBarLength);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, -p.radius);
        ctx.lineTo(0, -(p.radius + barLength));
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
