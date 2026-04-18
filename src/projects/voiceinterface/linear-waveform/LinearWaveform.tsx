import React, { useEffect, useRef } from "react";
import type { LinearWaveformProps } from "./types";

/**
 * Canvas-based linear waveform renderer.
 * Supports two modes:
 *   - static: frequency bars mirrored around center with optional ambient wave
 *   - scrolling: averaged audio history scrolling right-to-left with ghost bars
 *
 * Audio data comes in via `frequencyData` prop (Uint8Array from AnalyserNode).
 */
const LinearWaveform: React.FC<LinearWaveformProps> = ({
  frequencyData,
  barWidth,
  barHeight: baseBarHeight,
  barGap,
  barRadius,
  barColor,
  containerWidth,
  containerHeight,
  mode,
  sensitivity,
  updateRate,
  ambientWave,
  waveMode,
  waveSpeed,
  waveAmplitude,
  waveHeight,
  ghostBarOpacity,
  fadeEdges,
  fadeWidth,
  smoothing,
  intensityOpacity,
  showWaveDebug = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store frequencyData in a ref so the animation loop can read it
  // without being in the useEffect dependency array
  const freqRef = useRef<Uint8Array | null>(frequencyData);
  freqRef.current = frequencyData;

  // Data refs (don't trigger re-renders)
  const historyRef = useRef<number[]>([]);
  const staticBarsRef = useRef<number[]>([]);
  const lastUpdateRef = useRef(0);
  const needsRedrawRef = useRef(true);
  const gradientCacheRef = useRef<CanvasGradient | null>(null);
  const lastWidthRef = useRef(0);
  const lastFadeWidthRef = useRef(0);
  const prevValuesRef = useRef<number[]>([]);
  const prevModeRef = useRef(mode);

  // Reset data when mode changes
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      historyRef.current = [];
      staticBarsRef.current = [];
      needsRedrawRef.current = true;
      prevModeRef.current = mode;
    }
  }, [mode]);

  // Canvas resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      gradientCacheRef.current = null;
      lastWidthRef.current = rect.width;
      needsRedrawRef.current = true;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    lastUpdateRef.current = performance.now();

    const animate = (currentTime: number) => {
      rafId = requestAnimationFrame(animate);

      const fd = freqRef.current;
      const hasData = fd && fd.length > 0;

      // ── Data update phase ──
      if (hasData && currentTime - lastUpdateRef.current >= updateRate) {
        lastUpdateRef.current = currentTime;

        const startBin = Math.floor(fd.length * 0.05);
        const endBin = Math.floor(fd.length * 0.4);
        const relevant = fd.slice(startBin, endBin);

        if (mode === "static") {
          const rect = canvas.getBoundingClientRect();
          const barCount = Math.floor(rect.width / (barWidth + barGap));
          const leftHalf = Math.ceil(barCount / 2);
          const rightHalf = Math.floor(barCount / 2);
          const newBars: number[] = [];

          for (let i = leftHalf - 1; i >= 0; i--) {
            const idx = Math.floor((i / Math.max(1, leftHalf)) * relevant.length);
            const val = Math.min(1, (relevant[idx] / 255) * sensitivity);
            newBars.push(Math.max(0.05, val));
          }
          for (let i = 0; i < rightHalf; i++) {
            const idx = Math.floor((i / Math.max(1, rightHalf)) * relevant.length);
            const val = Math.min(1, (relevant[idx] / 255) * sensitivity);
            newBars.push(Math.max(0.05, val));
          }
          if (smoothing > 0) {
            const lerpFactor = 1 - smoothing;
            for (let i = 0; i < newBars.length; i++) {
              const prev = prevValuesRef.current[i] ?? newBars[i];
              newBars[i] = prev + (newBars[i] - prev) * lerpFactor;
            }
          }
          prevValuesRef.current = newBars;
          staticBarsRef.current = newBars;
        } else {
          let sum = 0;
          for (let i = 0; i < relevant.length; i++) sum += relevant[i];
          const avg = (sum / relevant.length / 255) * sensitivity;
          historyRef.current.push(Math.min(1, Math.max(0.05, avg)));

          const rect = canvas.getBoundingClientRect();
          const step = barWidth + barGap;
          const maxBars = Math.ceil(rect.width / step) + 2;
          if (historyRef.current.length > maxBars) historyRef.current.shift();
        }
        needsRedrawRef.current = true;
      }

      // ── Decay phase (audio stopped, bars still up) ──
      if (!hasData && mode === "static" && staticBarsRef.current.length > 0) {
        const decay = 1 - Math.max(smoothing, 0.85);
        let allIdle = true;
        for (let i = 0; i < staticBarsRef.current.length; i++) {
          const v = staticBarsRef.current[i];
          if (v > 0.06) {
            staticBarsRef.current[i] = v + (0.05 - v) * decay;
            allIdle = false;
          } else {
            staticBarsRef.current[i] = 0.05;
          }
        }
        prevValuesRef.current = staticBarsRef.current;
        needsRedrawRef.current = !allIdle;
      }

      // ── Render phase ──
      const shouldRender = hasData || needsRedrawRef.current || (mode === "static" && ambientWave);
      if (!shouldRender) return;

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const color = barColor || "#000";
      const centerY = rect.height / 2;
      const step = barWidth + barGap;
      const barCount = Math.floor(rect.width / step);
      const visualWidth = barCount * barWidth + (barCount - 1) * barGap;
      const offsetX = (rect.width - visualWidth) / 2;

      if (mode === "static") {
        const data = staticBarsRef.current;
        const drawCount = data.length > 0 ? Math.min(barCount, data.length) : barCount;
        for (let i = 0; i < drawCount; i++) {
          const value = data[i] ?? 0;
          const x = offsetX + i * step;

          // Base height (no wave)
          const hBase = Math.min(rect.height, Math.max(baseBarHeight, value * rect.height * 0.8));

          let h: number;
          if (ambientWave) {
            const phase = (currentTime / 1000) * waveSpeed + i * 0.5;
            const wave = (Math.sin(phase) + 1) / 2;

            if (waveMode === "add") {
              const v = Math.min(1, value * waveHeight + wave * waveAmplitude);
              h = Math.min(rect.height, Math.max(baseBarHeight, v * rect.height * 0.8));
            } else {
              const waveMultiplier = 1 + wave * (waveHeight - 1) * waveAmplitude;
              h = Math.min(rect.height, Math.max(baseBarHeight, value * rect.height * 0.8 * waveMultiplier));
            }
          } else {
            h = hBase;
          }

          // Draw the main bar
          const y = centerY - h / 2;
          ctx.fillStyle = color;
          ctx.globalAlpha = intensityOpacity ? 0.4 + value * 0.6 : 1;
          if (barRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, h, barRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, h);
          }

          // MUL mode debug: show the wave's contribution as red tips
          if (showWaveDebug && ambientWave && waveMode === "mul" && h > hBase) {
            const diff = h - hBase;
            const halfDiff = diff / 2;
            ctx.fillStyle = "#EF4444";
            ctx.globalAlpha = 0.8;
            // Top tip
            ctx.fillRect(x, centerY - h / 2, barWidth, halfDiff);
            // Bottom tip
            ctx.fillRect(x, centerY + hBase / 2, barWidth, halfDiff);
          }
        }

        // Ambient wave renders continuously; otherwise stop redraws
        if (!hasData && !ambientWave) needsRedrawRef.current = false;
      } else {
        // Scrolling mode
        const timeSincePush = currentTime - lastUpdateRef.current;
        const progress = Math.min(1, timeSincePush / updateRate);
        const scrollOffset = progress * step;
        const history = historyRef.current;

        // Ghost bars (empty positions)
        for (let i = 0; i < barCount; i++) {
          const baseX = rect.width - offsetX - barWidth - i * step;
          const x = baseX - scrollOffset;
          if (x + barWidth < 0 || x > rect.width) continue;
          if (i < history.length) continue;

          const gh = baseBarHeight;
          const gy = centerY - gh / 2;
          ctx.fillStyle = color;
          ctx.globalAlpha = ghostBarOpacity;
          if (barRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(x, gy, barWidth, gh, barRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, gy, barWidth, gh);
          }
        }

        // Real bars
        for (let i = 0; i < history.length; i++) {
          const dataIdx = history.length - 1 - i;
          const value = history[dataIdx] || 0.1;
          const baseX = rect.width - offsetX - barWidth - i * step;
          const x = baseX - scrollOffset;
          if (x + barWidth < 0) continue;

          const h = Math.max(baseBarHeight, value * rect.height * 0.8);
          const y = centerY - h / 2;
          ctx.fillStyle = color;
          ctx.globalAlpha = intensityOpacity ? 0.4 + value * 0.6 : 1;
          if (barRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, h, barRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, h);
          }
        }
      }

      // Fade edges
      if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
        if (!gradientCacheRef.current || lastWidthRef.current !== rect.width || lastFadeWidthRef.current !== fadeWidth) {
          const g = ctx.createLinearGradient(0, 0, rect.width, 0);
          const fp = Math.min(0.5, fadeWidth / rect.width);
          g.addColorStop(0, "rgba(255,255,255,1)");
          g.addColorStop(fp, "rgba(255,255,255,0)");
          g.addColorStop(1 - fp, "rgba(255,255,255,0)");
          g.addColorStop(1, "rgba(255,255,255,1)");
          gradientCacheRef.current = g;
          lastWidthRef.current = rect.width;
          lastFadeWidthRef.current = fadeWidth;
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = gradientCacheRef.current;
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.globalCompositeOperation = "source-over";
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [
    barWidth, baseBarHeight, barGap, barRadius, barColor,
    containerWidth, containerHeight, mode, sensitivity, updateRate,
    ambientWave, waveMode, waveSpeed, waveAmplitude, waveHeight,
    ghostBarOpacity, fadeEdges, fadeWidth, smoothing, intensityOpacity, showWaveDebug,
  ]);

  return (
    <div
      ref={containerRef}
      style={{ width: containerWidth, height: containerHeight }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  );
};

export default React.memo(LinearWaveform);
