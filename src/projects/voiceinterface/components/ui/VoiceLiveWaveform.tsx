"use client"

import { useEffect, useRef, type HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export type VoiceLiveWaveformProps = HTMLAttributes<HTMLDivElement> & {
  active?: boolean
  processing?: boolean
  deviceId?: string
  barWidth?: number
  barHeight?: number
  barGap?: number
  barRadius?: number
  barColor?: string
  fadeEdges?: boolean
  fadeWidth?: number
  height?: string | number
  sensitivity?: number
  smoothingTimeConstant?: number
  fftSize?: number
  historySize?: number
  updateRate?: number
  mode?: "scrolling" | "static"
  // Ambient Wave Props (Static mode only)
  ambientWave?: boolean
  waveSpeed?: number
  waveAmplitude?: number
  waveHeight?: number
  // Ghost Bar Props (Scrolling mode only)
  ghostBarOpacity?: number
  // Container Styling
  containerBg?: string
  containerBgOpacity?: number
  containerRadius?: number
  containerPadding?: number  // Horizontal padding (left/right)
  containerPaddingVertical?: number  // Vertical padding (top/bottom)
  // Outline Styling
  showOutline?: boolean
  outlineColor?: string
  outlineWidth?: number
  // Bar Opacity
  intensityOpacity?: boolean  // When true, bar opacity varies with audio intensity (legacy behavior)
  onError?: (error: Error) => void
  onStreamReady?: (stream: MediaStream) => void
  onStreamEnd?: () => void
  // Callback to reset history (for parent to trigger)
  resetHistoryTrigger?: number
}

export const VoiceLiveWaveform = ({
  active = false,
  processing = false,
  deviceId,
  barWidth = 2.5,
  barGap = 5,
  barRadius = 10,
  barColor = "#FFFFFF",
  fadeEdges = false,
  fadeWidth = 0,
  barHeight: baseBarHeight = 5,
  height = "100%",
  sensitivity = 1.3,
  smoothingTimeConstant = 0.8,
  fftSize = 256,
  historySize = 60,
  updateRate = 40,
  mode = "static",
  // Ambient Wave Defaults
  ambientWave = true,
  waveSpeed = 6,
  waveAmplitude = 0.55,
  waveHeight = 1.4,
  // Ghost Bar Defaults
  ghostBarOpacity = 0.2,
  // Container Styling Defaults
  containerBg = "",
  containerBgOpacity = 1,
  containerRadius = 24,
  containerPadding = 0,
  containerPaddingVertical = 0,
  // Outline Styling Defaults
  showOutline = false,
  outlineColor = "#FFFFFF",
  outlineWidth = 2,
  // Bar Opacity Default
  intensityOpacity = false,
  onError,
  onStreamReady,
  onStreamEnd,
  resetHistoryTrigger = 0,
  className,
  style,
  ...restProps
}: VoiceLiveWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<number[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number>(0)
  const lastUpdateRef = useRef<number>(0)
  const processingAnimationRef = useRef<number | null>(null)
  const lastActiveDataRef = useRef<number[]>([])
  const transitionProgressRef = useRef(0)
  const staticBarsRef = useRef<number[]>([])
  const needsRedrawRef = useRef(true)
  const gradientCacheRef = useRef<CanvasGradient | null>(null)
  const lastWidthRef = useRef(0)
  const lastFadeWidthRef = useRef(0)

  const heightStyle = typeof height === "number" ? `${height}px` : height

  // Reset history when resetHistoryTrigger changes (used when switching to scrolling mode)
  useEffect(() => {
    if (resetHistoryTrigger > 0) {
      historyRef.current = []
      staticBarsRef.current = []
      lastActiveDataRef.current = []
      needsRedrawRef.current = true
    }
  }, [resetHistoryTrigger])

  // Handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      gradientCacheRef.current = null
      lastWidthRef.current = rect.width
      needsRedrawRef.current = true
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (processing && !active) {
      let time = 0
      transitionProgressRef.current = 0

      const animateProcessing = () => {
        time += 0.03
        transitionProgressRef.current = Math.min(
          1,
          transitionProgressRef.current + 0.02
        )

        const processingData = []
        const barCount = Math.floor(
          (containerRef.current?.getBoundingClientRect().width || 200) /
          (barWidth + barGap)
        )

        if (mode === "static") {
          const halfCount = Math.floor(barCount / 2)

          for (let i = 0; i < barCount; i++) {
            const normalizedPosition = (i - halfCount) / halfCount
            const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4

            const wave1 = Math.sin(time * 1.5 + normalizedPosition * 3) * 0.25
            const wave2 = Math.sin(time * 0.8 - normalizedPosition * 2) * 0.2
            const wave3 = Math.cos(time * 2 + normalizedPosition) * 0.15
            const combinedWave = wave1 + wave2 + wave3
            const processingValue = (0.2 + combinedWave) * centerWeight

            let finalValue = processingValue
            if (
              lastActiveDataRef.current.length > 0 &&
              transitionProgressRef.current < 1
            ) {
              const lastDataIndex = Math.min(
                i,
                lastActiveDataRef.current.length - 1
              )
              const lastValue = lastActiveDataRef.current[lastDataIndex] || 0
              finalValue =
                lastValue * (1 - transitionProgressRef.current) +
                processingValue * transitionProgressRef.current
            }

            processingData.push(Math.max(0.15, Math.min(1, finalValue)))
          }
        } else {
          for (let i = 0; i < barCount; i++) {
            const normalizedPosition = (i - barCount / 2) / (barCount / 2)
            const centerWeight = 1 - Math.abs(normalizedPosition) * 0.4

            const wave1 = Math.sin(time * 1.5 + i * 0.15) * 0.25
            const wave2 = Math.sin(time * 0.8 - i * 0.1) * 0.2
            const wave3 = Math.cos(time * 2 + i * 0.05) * 0.15
            const combinedWave = wave1 + wave2 + wave3
            const processingValue = (0.2 + combinedWave) * centerWeight

            let finalValue = processingValue
            if (
              lastActiveDataRef.current.length > 0 &&
              transitionProgressRef.current < 1
            ) {
              const lastDataIndex = Math.floor(
                (i / barCount) * lastActiveDataRef.current.length
              )
              const lastValue = lastActiveDataRef.current[lastDataIndex] || 0
              finalValue =
                lastValue * (1 - transitionProgressRef.current) +
                processingValue * transitionProgressRef.current
            }

            processingData.push(Math.max(0.15, Math.min(1, finalValue)))
          }
        }

        if (mode === "static") {
          staticBarsRef.current = processingData
        } else {
          historyRef.current = processingData
        }

        needsRedrawRef.current = true
        processingAnimationRef.current =
          requestAnimationFrame(animateProcessing)
      }

      animateProcessing()

      return () => {
        if (processingAnimationRef.current) {
          cancelAnimationFrame(processingAnimationRef.current)
        }
      }
    } else if (!active && !processing) {
      const hasData =
        mode === "static"
          ? staticBarsRef.current.length > 0
          : historyRef.current.length > 0

      if (hasData) {
        // Fade to baseline (0.05) instead of 0, and keep bars populated
        const baselineValue = 0.05
        let fadeProgress = 0
        const fadeToIdle = () => {
          fadeProgress += 0.03
          if (fadeProgress < 1) {
            if (mode === "static") {
              staticBarsRef.current = staticBarsRef.current.map(
                (value) => value * (1 - fadeProgress) + baselineValue * fadeProgress
              )
            } else {
              historyRef.current = historyRef.current.map(
                (value) => value * (1 - fadeProgress) + baselineValue * fadeProgress
              )
            }
            needsRedrawRef.current = true
            requestAnimationFrame(fadeToIdle)
          } else {
            // Set all bars to baseline value (don't clear to empty)
            if (mode === "static") {
              staticBarsRef.current = staticBarsRef.current.map(() => baselineValue)
            } else {
              historyRef.current = historyRef.current.map(() => baselineValue)
            }
            needsRedrawRef.current = true
          }
        }
        fadeToIdle()
      } else {
        // No data yet - initialize with baseline bars
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const barCount = Math.floor(rect.width / (barWidth + barGap))
          const baselineBars = Array(barCount).fill(0.05)

          if (mode === "static") {
            staticBarsRef.current = baselineBars
          } else {
            historyRef.current = baselineBars
          }
          needsRedrawRef.current = true
        }
      }
    }
  }, [processing, active, barWidth, barGap, mode])

  // Handle microphone setup and teardown
  useEffect(() => {
    if (!active) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        onStreamEnd?.()
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = 0
      }
      return
    }

    const setupMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId
            ? {
              deviceId: { exact: deviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
            : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
        })
        streamRef.current = stream
        onStreamReady?.(stream)

        const AudioContextConstructor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        const audioContext = new AudioContextConstructor()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = fftSize
        analyser.smoothingTimeConstant = smoothingTimeConstant

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        audioContextRef.current = audioContext
        analyserRef.current = analyser

        // Clear history when starting
        historyRef.current = []
      } catch (error) {
        onError?.(error as Error)
      }
    }

    setupMicrophone()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        onStreamEnd?.()
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = 0
      }
    }
  }, [
    active,
    deviceId,
    fftSize,
    smoothingTimeConstant,
    onError,
    onStreamReady,
    onStreamEnd,
  ])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let rafId: number
    lastUpdateRef.current = performance.now() // Initialize

    const animate = (currentTime: number) => {
      // 1. DATA UPDATE PHASE
      // Check if it's time to push new data based on updateRate
      // This controls the "Rhythm" of the waveform
      if (active && currentTime - lastUpdateRef.current >= updateRate) {
        // Calculate how many frames we might have missed (usually just 1)
        const timeSinceLast = currentTime - lastUpdateRef.current
        const stepsToPush = Math.floor(timeSinceLast / updateRate)

        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)

          // We might need to push multiple times if the thread lagged,
          // or just once. For simplicity/smoothness, usually we just update once
          // and reset the timer, but precise timing handles 'catch up'.
          // For a visualizer, dropping frames is better than speeding up,
          // so we'll just push the LATEST data once and reset the timer
          // relative to now (or relative to expected time for strict rhythm).

          // Let's stick to "Push Latest" to avoid processing backlog
          lastUpdateRef.current = currentTime

          // --- Process Data ---
          if (mode === "static") {
            // Static mode update (same as before)
            const startFreq = Math.floor(dataArray.length * 0.05)
            const endFreq = Math.floor(dataArray.length * 0.4)
            const relevantData = dataArray.slice(startFreq, endFreq)

            const rect = canvas.getBoundingClientRect()
            const barCount = Math.floor(rect.width / (barWidth + barGap))
            // Use ceil and floor to correctly handle odd barCounts
            const leftHalf = Math.ceil(barCount / 2)
            const rightHalf = Math.floor(barCount / 2)
            const newBars: number[] = []

            // Left side (mirrored from center outward)
            for (let i = leftHalf - 1; i >= 0; i--) {
              const dataIndex = Math.floor((i / Math.max(1, leftHalf)) * relevantData.length)
              const value = Math.min(1, (relevantData[dataIndex] / 255) * sensitivity)
              // Use 0.15 minimum for visible baseline when active
              newBars.push(Math.max(0.15, value))
            }
            // Right side
            for (let i = 0; i < rightHalf; i++) {
              const dataIndex = Math.floor((i / Math.max(1, rightHalf)) * relevantData.length)
              const value = Math.min(1, (relevantData[dataIndex] / 255) * sensitivity)
              // Use 0.15 minimum for visible baseline when active
              newBars.push(Math.max(0.15, value))
            }
            staticBarsRef.current = newBars
            lastActiveDataRef.current = newBars
          } else {
            // Scrolling mode update
            let sum = 0
            const startFreq = Math.floor(dataArray.length * 0.05)
            const endFreq = Math.floor(dataArray.length * 0.4)
            const relevantData = dataArray.slice(startFreq, endFreq)

            for (let i = 0; i < relevantData.length; i++) {
              sum += relevantData[i]
            }
            const average = (sum / relevantData.length / 255) * sensitivity

            // Push to history (0.15 minimum for visible baseline)
            historyRef.current.push(Math.min(1, Math.max(0.15, average)))
            lastActiveDataRef.current = [...historyRef.current]

            // Pruning: Keep enough history to fill screen + buffer
            // We need slightly more than visible to handle the scrolling off-screen bar
            const rect = canvas.getBoundingClientRect()
            const step = barWidth + barGap
            const maxBars = Math.ceil(rect.width / step) + 2
            if (historyRef.current.length > maxBars) {
              historyRef.current.shift()
            }
          }
          needsRedrawRef.current = true
        }
      }

      // 2. RENDER PHASE
      // Always clear and redraw if active (for smooth animation)
      // OR if a static redraw is requested.
      if (active || processing || needsRedrawRef.current) {
        const rect = canvas.getBoundingClientRect()
        ctx.clearRect(0, 0, rect.width, rect.height)

        const computedBarColor = barColor || "#000" // Fallback simplified
        const centerY = rect.height / 2

        // CENTERING ALIGNMENT:
        // 1. Calculate step and bar count using standard gap
        const step = barWidth + barGap
        const barCount = Math.floor(rect.width / step)

        // 2. Calculate visual width (last bar doesn't need trailing gap)
        const visualWidth = barCount * barWidth + (barCount - 1) * barGap

        // 3. Calculate offset to center the grid
        const offsetX = (rect.width - visualWidth) / 2

        if (mode === "static") {
          // Draw Static
          const dataToRender = processing ? staticBarsRef.current : staticBarsRef.current

          // Only draw up to barCount
          for (let i = 0; i < barCount && i < dataToRender.length; i++) {
            const value = dataToRender[i] || 0.15
            const x = offsetX + (i * step)  // Apply centering offset

            // Ambient Wave Effect: Apply a traveling sine wave to modulate bar height
            let waveMultiplier = 1
            if (ambientWave) {
              // Create a traveling wave: phase based on bar position + time
              // waveSpeed controls how fast the wave travels
              // waveAmplitude controls how much the wave affects height (0-1)
              // waveHeight is the peak multiplier (e.g., 1.5 = 50% boost at peak)
              const wavePhase = (currentTime / 1000 * waveSpeed) + (i * 0.5)
              const waveSine = Math.sin(wavePhase)  // -1 to 1
              // Map waveSine to a multiplier: at peak (+1), multiply by waveHeight; at trough (-1), stay at 1
              // waveMultiplier = 1 + (waveSine + 1) / 2 * (waveHeight - 1) * waveAmplitude
              waveMultiplier = 1 + ((waveSine + 1) / 2) * (waveHeight - 1) * waveAmplitude
            }

            // Clamp bar height to never exceed container height
            const barHeight = Math.min(rect.height, Math.max(baseBarHeight, value * rect.height * 0.8 * waveMultiplier))
            const y = centerY - barHeight / 2

            ctx.fillStyle = computedBarColor
            ctx.globalAlpha = intensityOpacity ? (0.4 + value * 0.6) : 1
            if (barRadius > 0) {
              ctx.beginPath()
              ctx.roundRect(x, y, barWidth, barHeight, barRadius)
              ctx.fill()
            } else {
              ctx.fillRect(x, y, barWidth, barHeight)
            }
          }

          // Only stop redrawing in static mode if not active/processing
          if (!active && !processing) needsRedrawRef.current = false

        } else {
          // Draw Scrolling with Interpolation
          const timeSincePush = currentTime - lastUpdateRef.current
          // 0 to 1 progress between pushes
          const progress = Math.min(1, timeSincePush / updateRate)

          // Pixel offset: We want to move 1 full 'step' (bar+gap) over the course of 'updateRate'
          // Bars are drawn from Right to Left.
          // Newest bar (index end) is at the Right edge.
          // As progress increases, everything shifts Left.

          const scrollOffset = progress * step

          // We iterate history from end (newest) to start (oldest)
          // Conceptually:
          // Bar 0 (Newest) starts at: Width + step (offscreen right) ?
          // Or starts at Width and moves to Width - step?
          // WaveClipper logic: New bar pushed, array shifts.
          // Between pushes, we simply render the CURRENT array, but shifted left by `scrollOffset`.
          // The newest bar in the array is "current".
          // Actually, in WaveClipper, the "newest" bar is visibly growing or just existing?
          // Let's assume the array contains the [old ... new].
          // We draw [new] at (Width - step - scrollOffset).
          // At progress=0: (Width - step).
          // At progress=1: (Width - 2*step). At this moment, we PUSH a new bar.
          // The old [new] becomes [new-1]. Its base pos becomes (Width - 2*step).
          // And we start animating offset from 0 again.
          // Ideally: x = Width - ((i+1) * step) - scrollOffset
          // Where i=0 is newest.

          const history = processing ? historyRef.current : historyRef.current

          // V3: GHOST BARS for scrolling mode
          // Draw ghost bars for all positions first (before real data)
          // Ghost bars fill the container where there's no audio data yet
          for (let i = 0; i < barCount; i++) {
            const baseX = rect.width - offsetX - barWidth - (i * step)
            const x = baseX - scrollOffset

            // Skip if off screen
            if (x + barWidth < 0 || x > rect.width) continue

            // Skip if this position will be covered by real data
            if (i < history.length) continue

            // Draw ghost bar (same color, lower opacity)
            const ghostHeight = baseBarHeight  // Minimum height for ghost bars
            const y = centerY - ghostHeight / 2

            ctx.fillStyle = computedBarColor
            ctx.globalAlpha = ghostBarOpacity
            if (barRadius > 0) {
              ctx.beginPath()
              ctx.roundRect(x, y, barWidth, ghostHeight, barRadius)
              ctx.fill()
            } else {
              ctx.fillRect(x, y, barWidth, ghostHeight)
            }
          }

          // Draw real data bars (NO ambient wave in scrolling mode for V3)
          for (let i = 0; i < history.length; i++) {
            const dataIndex = history.length - 1 - i
            const value = history[dataIndex] || 0.15

            // Base Position (CENTERED)
            const baseX = rect.width - offsetX - barWidth - (i * step)
            const x = baseX - scrollOffset

            // Skip if off screen
            if (x + barWidth < 0) continue

            // V3: No ambient wave in scrolling mode
            const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8)
            const y = centerY - barHeight / 2

            ctx.fillStyle = computedBarColor
            ctx.globalAlpha = intensityOpacity ? (0.4 + value * 0.6) : 1
            if (barRadius > 0) {
              ctx.beginPath()
              ctx.roundRect(x, y, barWidth, barHeight, barRadius)
              ctx.fill()
            } else {
              ctx.fillRect(x, y, barWidth, barHeight)
            }
          }
        }

        if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
          // Rebuild gradient if width OR fadeWidth changed
          if (!gradientCacheRef.current || lastWidthRef.current !== rect.width || lastFadeWidthRef.current !== fadeWidth) {
            const gradient = ctx.createLinearGradient(0, 0, rect.width, 0)
            const fadePercent = Math.min(0.5, fadeWidth / rect.width)
            gradient.addColorStop(0, "rgba(255,255,255,1)")
            gradient.addColorStop(fadePercent, "rgba(255,255,255,0)")
            gradient.addColorStop(1 - fadePercent, "rgba(255,255,255,0)")
            gradient.addColorStop(1, "rgba(255,255,255,1)")
            gradientCacheRef.current = gradient
            lastWidthRef.current = rect.width
            lastFadeWidthRef.current = fadeWidth
          }
          ctx.globalAlpha = 1  // CRITICAL: Reset alpha before masking
          ctx.globalCompositeOperation = "destination-out"
          ctx.fillStyle = gradientCacheRef.current
          ctx.fillRect(0, 0, rect.width, rect.height)
          ctx.globalCompositeOperation = "source-over"
        }
      }

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [
    active,
    processing,
    sensitivity,
    updateRate,
    historySize,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
    mode,
    ambientWave,
    waveSpeed,
    waveAmplitude,
    waveHeight,
    ghostBarOpacity,
  ])

  return (
    <div
      className={cn("relative inline-flex", className)}
      style={{
        paddingLeft: `${containerPadding}px`,
        paddingRight: `${containerPadding}px`,
        paddingTop: `${containerPaddingVertical}px`,
        paddingBottom: `${containerPaddingVertical}px`,
        backgroundColor: containerBg ? `${containerBg}${Math.round(containerBgOpacity * 255).toString(16).padStart(2, '0')}` : 'transparent',
        borderRadius: `${containerRadius}px`,
        outline: showOutline ? `${outlineWidth}px solid ${outlineColor}` : 'none',
        outlineOffset: showOutline ? `-${outlineWidth}px` : '0',
      }}
      aria-label={
        active
          ? "Live audio waveform"
          : processing
            ? "Processing audio"
            : "Audio waveform idle"
      }
      role="img"
      {...restProps}
    >
      <div
        ref={containerRef}
        className="relative"
        style={{
          ...style,
          height: heightStyle,
        }}
      >
        <canvas
          className="block h-full w-full"
          ref={canvasRef}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
