import { useEffect, useRef } from "react";
import { RadialWaveformProps } from "../types";
import { mapFrequencyToBars } from "../mapFrequency";

export default function RadialInward({
  frequencyData,
  radius,
  barWidth,
  barGap,
  minBarLength,
  maxBarLength,
  sensitivity,
  barColor,
  bgColor,
  segments,
  roundCaps,
  intensityOpacity,
  updateRate,
  rotationSpeed,
  ambientWave,
  waveSpeed,
  waveAmplitude,
  waveHeight,
  waveMode,
  waveShape,
  waveLobes,
  smoothing,
  waveEnvelope,
  envelopeAmplitude,
  envelopeSensitivity,
  showEnvelopeCeiling,
}: RadialWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastDrawRef = useRef(0);
  const waveTimeRef = useRef(0);
  const prevValuesRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const size = (radius + 20) * 2;
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

      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      rotationRef.current += (rotationSpeed * Math.PI) / 180 * dt;
      waveTimeRef.current += dt;

      if (updateRate > 0 && now - lastDrawRef.current < updateRate) return;
      lastDrawRef.current = now;

      ctx.clearRect(0, 0, size, size);

      const circumference = 2 * Math.PI * radius;
      const barCount = Math.max(1, Math.floor(circumference / (barWidth + barGap)));
      const minInnerRadius = (barCount * barGap) / (2 * Math.PI);
      const maxSafeInward = Math.max(0, radius - minInnerRadius);
      const values = mapFrequencyToBars(frequencyData, barCount, sensitivity, segments);

      if (prevValuesRef.current.length !== barCount) {
        prevValuesRef.current = new Array(barCount).fill(0);
      }

      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2 + rotationRef.current;
        let value = values[i];

        if (ambientWave) {
          const lobes = waveShape === "segments" ? segments : waveLobes;
          const phase = angle * lobes - waveTimeRef.current * waveSpeed;

          let wave: number;
          switch (waveShape) {
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

          if (envelopeSensitivity > 0) {
            const sensFactor = 1 - envelopeSensitivity * (1 - wave);
            value = value * sensFactor;
          }

          value = Math.min(1, value * waveHeight + wave * waveAmplitude);
          if (waveMode === "reactive") {
            value = value * (1 + wave * waveAmplitude * 3);
          }

          if (waveEnvelope > 0 && envelopeAmplitude > 0) {
            const ceiling = wave * envelopeAmplitude + envelopeAmplitude * 0.1;
            const effectiveCeiling = 1 - waveEnvelope * (1 - ceiling);
            value = Math.min(value, effectiveCeiling);
          }
        }

        if (smoothing > 0) {
          const lerpFactor = 1 - smoothing;
          value = prevValuesRef.current[i] + (value - prevValuesRef.current[i]) * lerpFactor;
        }
        prevValuesRef.current[i] = value;

        const barLength = Math.min(
          minBarLength + value * (maxBarLength - minBarLength),
          maxSafeInward
        );

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(0, -(radius - barLength));
        ctx.strokeStyle = barColor;
        ctx.lineWidth = barWidth;
        ctx.lineCap = roundCaps ? "round" : "butt";
        ctx.globalAlpha = intensityOpacity ? 0.4 + value * 0.6 : 1;
        ctx.stroke();
        ctx.restore();
      }

      // Ghost bars: envelope ceiling guide
      if (showEnvelopeCeiling && ambientWave && envelopeAmplitude > 0 && waveEnvelope > 0) {
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2 + rotationRef.current;
          const lobes = waveShape === "segments" ? segments : waveLobes;
          const phase = angle * lobes - waveTimeRef.current * waveSpeed;

          let wave: number;
          switch (waveShape) {
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

          const ceiling = wave * envelopeAmplitude + envelopeAmplitude * 0.1;
          const effectiveCeiling = 1 - waveEnvelope * (1 - ceiling);
          const ghostLength = Math.min(
            minBarLength + effectiveCeiling * (maxBarLength - minBarLength),
            maxSafeInward
          );

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, -radius);
          ctx.lineTo(0, -(radius - ghostLength));
          ctx.strokeStyle = barColor;
          ctx.lineWidth = barWidth;
          ctx.lineCap = roundCaps ? "round" : "butt";
          ctx.globalAlpha = 0.12;
          ctx.stroke();
          ctx.restore();
        }
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [frequencyData, radius, barWidth, barGap, minBarLength, maxBarLength, sensitivity, barColor, bgColor, segments, roundCaps, intensityOpacity, updateRate, rotationSpeed, ambientWave, waveSpeed, waveAmplitude, waveHeight, waveMode, waveShape, waveLobes, smoothing, waveEnvelope, envelopeAmplitude, envelopeSensitivity, showEnvelopeCeiling]);

  const size = (radius + 20) * 2;
  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}
