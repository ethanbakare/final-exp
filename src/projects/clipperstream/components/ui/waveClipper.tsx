import React, { useRef, useLayoutEffect, useEffect } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

/* ============================================
   ┌─────────────────────────────────────────┐
   │  WAVE CLIPPER - AUDIO VISUALIZER        │
   │  Real-time Audio Waveform Display       │
   └─────────────────────────────────────────┘
   
   FEATURES:
   - Real-time audio reactivity (responds to mic input)
   - Smooth right-to-left scrolling animation
   - Ghost bars (10% opacity) for empty slots
   - Active bars (30% opacity) with audio data
   - DPI-aware rendering (sharp on Retina displays)
   
   AUDIO INTEGRATION:
   - Pass audioAnalyser prop from Web Audio API
   - Set isRecording=true to activate
   - Bars automatically react to volume levels
   
   CONFIGURATION:
   - See constants below to adjust appearance
   - MAX_BAR_HISTORY: Number of bars (42 default)
   - BAR_SPACING_FACTOR: Gap size (0.5 = 50% gap)
   
   ============================================ */

// ============================================
// 🎛️ CONFIGURATION CONSTANTS
// ============================================

// Visual appearance
const GHOST_OPACITY = 0.2;              // --RecWhite_10 (empty bars)
const ACTIVE_OPACITY = .7;             // --RecWhite_30 (bars with audio)
const BAR_COLOR = "#FFFFFF";

// Audio analysis
const SMOOTHING_ALPHA = 0.1;            // Audio smoothing (0-1, lower = smoother)

// Waveform behavior
const MAX_BAR_HISTORY = 30;             // Total number of bars (matches static design)
const PUSH_INTERVAL_MS = 300;           // New bar every 300ms
const BAR_SPACING_FACTOR = 0.6;         // 0.7 = 70% gap, 30% bar (wider spacing like morphing-recorder.html)
const MIN_BAR_HEIGHT_FACTOR = 0.15;      // Min bar height (10% of container)
const MAX_BAR_HEIGHT_SCALE_FACTOR = .9; // Max bar height (70% of container)

// ============================================
// COMPONENT INTERFACE
// ============================================

interface WaveClipperProps {
  /** Web Audio API AnalyserNode - provides real-time audio data */
  audioAnalyser?: AnalyserNode | null;
  /** Controls animation and audio reactivity */
  isRecording: boolean;
  /** Freezes the waveform at current state (stops animation, preserves bars) */
  isFrozen?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/* ============================================
   WAVE CLIPPER COMPONENT
   ============================================ */

export const WaveClipper: React.FC<WaveClipperProps> = ({ 
  audioAnalyser, 
  isRecording,
  isFrozen = false,
  className = '' 
}) => {
  // Refs for canvas and animation
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  // Audio data storage
  const volumeHistoryRef = useRef<number[]>(new Array(MAX_BAR_HISTORY).fill(0));
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  
  // Animation timing
  const lastPushTimeRef = useRef<number>(0);
  const pushedSinceRecordingStartCountRef = useRef<number>(0);
  const initialStaticBarsDrawnRef = useRef<boolean>(false);
  
  // Freeze state - capture scroll offset at moment of freezing
  const frozenScrollOffsetRef = useRef<number>(0);

  /* ============================================
     CANVAS SETUP - DPI Awareness with ResizeObserver
     Re-calculates canvas size when container resizes
     (Critical for morphing containers that change size)
     ============================================ */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Function to resize canvas to match container
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // Skip if container has no size yet (hidden/collapsed)
      if (rect.width === 0 || rect.height === 0) return;
      
      // Check if resize is actually needed (avoid unnecessary resets)
      const newWidth = Math.floor(rect.width * dpr);
      const newHeight = Math.floor(rect.height * dpr);
      
      if (canvas.width === newWidth && canvas.height === newHeight) return;
      
      // Set internal canvas resolution (accounts for Retina displays)
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Set display size
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      // Scale the drawing context to match DPI
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
        ctx.scale(dpr, dpr);
      }
    };
    
    // Initial resize
    resizeCanvas();
    
    // Watch for container size changes (critical for morphing animations)
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    
    resizeObserver.observe(canvas);
    
    // Initialize volume history
    if (volumeHistoryRef.current.length !== MAX_BAR_HISTORY) {
      volumeHistoryRef.current = new Array(MAX_BAR_HISTORY).fill(0);
    }
    
    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /* ============================================
     ANIMATION LOOP
     Main rendering and audio processing logic
     ============================================ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    // Initialize audio data array if analyser provided
    if (audioAnalyser) {
      const bufferLength = audioAnalyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    } else {
      dataArrayRef.current = null;
    }
    
    // Reset state when recording stops (but NOT when frozen)
    if (!isRecording && !isFrozen) {
      if (!initialStaticBarsDrawnRef.current || volumeHistoryRef.current.some(v => v !== 0)) {
        volumeHistoryRef.current = new Array(MAX_BAR_HISTORY).fill(0);
        initialStaticBarsDrawnRef.current = true;
      }
      pushedSinceRecordingStartCountRef.current = 0;
      lastPushTimeRef.current = 0;
      frozenScrollOffsetRef.current = 0;
    } else if (isRecording) {
      // Initialize timing when recording starts
      if (pushedSinceRecordingStartCountRef.current === 0) {
        lastPushTimeRef.current = performance.now();
      }
      initialStaticBarsDrawnRef.current = false;
    }
    // When frozen, preserve all state exactly as is (including frozen scroll offset)

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* ============================================
       DRAW FUNCTION - Runs every frame (~60fps)
       ============================================ */
    const draw = (timestamp: number) => {
      let currentNormalizedVolume = 0;

      // GET AUDIO DATA - If recording and analyser available (but NOT when frozen)
      if (!isFrozen && isRecording && audioAnalyser && dataArrayRef.current && dataArrayRef.current.length > 0) {
        // Get frequency data from analyser
        audioAnalyser.getByteFrequencyData(dataArrayRef.current);
        
        // Calculate average volume across all frequencies
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        const averageVolume = dataArrayRef.current.length > 0 ? sum / dataArrayRef.current.length : 0;
        
        // Normalize to 0-1 range (byte data is 0-255, divide by 128 for louder response)
        currentNormalizedVolume = Math.min(Math.max(averageVolume / 72, 0), 1);
      } else {
        currentNormalizedVolume = 0;
      }
      
      // SMOOTH THE VOLUME - Prevents jittery bars
      const lastPushedVolumeInHistory = volumeHistoryRef.current.length > 0 
        ? volumeHistoryRef.current[MAX_BAR_HISTORY - 1] 
        : 0;
      let smoothedVolumeForCurrentFrame = 
        lastPushedVolumeInHistory * (1 - SMOOTHING_ALPHA) + 
        currentNormalizedVolume * SMOOTHING_ALPHA;
      smoothedVolumeForCurrentFrame = Math.max(0, smoothedVolumeForCurrentFrame);

      // CALCULATE SCROLL OFFSET - For smooth animation
      let scrollOffset = 0;
      const timeSinceLastPush = timestamp - lastPushTimeRef.current;

      if (isFrozen) {
        // When frozen, use the captured scroll offset from the moment of freezing
        scrollOffset = frozenScrollOffsetRef.current;
      } else if (isRecording) {
        const dpr = window.devicePixelRatio || 1;
        const logicalWidth = canvas.width / dpr;
        const barSlotWidth = logicalWidth / MAX_BAR_HISTORY;
        
        // PUSH NEW BAR - Every PUSH_INTERVAL_MS
        if (timeSinceLastPush >= PUSH_INTERVAL_MS) {
          // Shift array left, push new value on right
          volumeHistoryRef.current.shift();
          volumeHistoryRef.current.push(smoothedVolumeForCurrentFrame);
          
          // Track how many bars have been pushed (for ghost bar logic)
          if (pushedSinceRecordingStartCountRef.current < MAX_BAR_HISTORY) {
            pushedSinceRecordingStartCountRef.current++;
          }
          
          // Update timing (maintain rhythm even if frames were skipped)
          lastPushTimeRef.current += PUSH_INTERVAL_MS * Math.floor(timeSinceLastPush / PUSH_INTERVAL_MS);
          
          // Calculate scroll offset for smooth continuation
          scrollOffset = -((timestamp - lastPushTimeRef.current) / PUSH_INTERVAL_MS) * barSlotWidth;
        } else {
          // UPDATE RIGHTMOST BAR - Every frame for immediate feedback
          if (volumeHistoryRef.current.length === MAX_BAR_HISTORY) {
            volumeHistoryRef.current[MAX_BAR_HISTORY - 1] = smoothedVolumeForCurrentFrame;
          }
          
          // Calculate smooth scroll offset between pushes
          scrollOffset = -(timeSinceLastPush / PUSH_INTERVAL_MS) * barSlotWidth;
        }
        
        // Capture scroll offset for potential freezing
        frozenScrollOffsetRef.current = scrollOffset;
      }
      
      /* ============================================
         DRAWING - Render all bars
         ============================================ */
      const dprDraw = window.devicePixelRatio || 1;
      const logicalWidthDraw = canvas.width / dprDraw;
      const logicalHeightDraw = canvas.height / dprDraw;
      
      // Clear canvas
      ctx.clearRect(0, 0, logicalWidthDraw, logicalHeightDraw);
      
      // Calculate bar dimensions
      const totalBarSlotWidth = logicalWidthDraw / MAX_BAR_HISTORY;
      const barSpacing = totalBarSlotWidth * BAR_SPACING_FACTOR;
      const effectiveBarWidth = Math.max(1, totalBarSlotWidth - barSpacing);
      const canvasHeight = logicalHeightDraw;

      // Calculate height range
      const minAbsHeight = canvasHeight * MIN_BAR_HEIGHT_FACTOR;
      const maxAbsHeight = canvasHeight * MAX_BAR_HEIGHT_SCALE_FACTOR;
      const dynamicHeightRange = Math.max(0, maxAbsHeight - minAbsHeight);

      // DRAW EACH BAR
      volumeHistoryRef.current.forEach((volume, index) => {
        let barOpacity;
        let barVolumeForHeightCalculation = volume;

        // DETERMINE BAR STATE - Ghost or Active
        if (isFrozen) {
          // When frozen, keep bars at active opacity if they have volume data
          if (index >= MAX_BAR_HISTORY - pushedSinceRecordingStartCountRef.current) {
            barOpacity = ACTIVE_OPACITY;
          } else {
            barOpacity = GHOST_OPACITY;
            barVolumeForHeightCalculation = 0;
          }
        } else if (isRecording) {
          // Active bars: have been pushed since recording started
          if (index >= MAX_BAR_HISTORY - pushedSinceRecordingStartCountRef.current) {
            barOpacity = ACTIVE_OPACITY;
          } else {
            // Ghost bars: not yet filled with audio data
            barOpacity = GHOST_OPACITY;
            barVolumeForHeightCalculation = 0;
          }
        } else {
          // When not recording and not frozen, all bars are ghosts
          barOpacity = GHOST_OPACITY;
          barVolumeForHeightCalculation = 0;
        }
        
        // CALCULATE BAR HEIGHT - Based on volume
        const cleanVolume = typeof barVolumeForHeightCalculation === 'number' && 
          !isNaN(barVolumeForHeightCalculation) 
            ? barVolumeForHeightCalculation 
            : 0;
        const actualBarHeight = minAbsHeight + (cleanVolume * dynamicHeightRange);
        
        // CALCULATE POSITION - With scroll offset
        const nominalX = index * totalBarSlotWidth + barSpacing / 2;
        const finalX = nominalX + scrollOffset;
        
        // Center bar vertically
        const y = (canvasHeight - actualBarHeight) / 2;
        
        // DRAW ROUNDED RECTANGLE
        ctx.fillStyle = BAR_COLOR;
        ctx.globalAlpha = barOpacity;
        
        const radius = Math.min(effectiveBarWidth / 2.5, 2.5);
        ctx.beginPath();
        ctx.moveTo(finalX + radius, y);
        ctx.lineTo(finalX + effectiveBarWidth - radius, y);
        ctx.quadraticCurveTo(finalX + effectiveBarWidth, y, finalX + effectiveBarWidth, y + radius);
        ctx.lineTo(finalX + effectiveBarWidth, y + actualBarHeight - radius);
        ctx.quadraticCurveTo(finalX + effectiveBarWidth, y + actualBarHeight, finalX + effectiveBarWidth - radius, y + actualBarHeight);
        ctx.lineTo(finalX + radius, y + actualBarHeight);
        ctx.quadraticCurveTo(finalX, y + actualBarHeight, finalX, y + actualBarHeight - radius);
        ctx.lineTo(finalX, y + radius);
        ctx.quadraticCurveTo(finalX, y, finalX + radius, y);
        ctx.closePath();
        ctx.fill();
      });
      
      ctx.globalAlpha = 1.0;

      // CONTINUE ANIMATION
      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    // Initialize timing for first frame
    if (isRecording && lastPushTimeRef.current === 0) {
      lastPushTimeRef.current = performance.now();
    }

    // Start animation loop
    animationFrameIdRef.current = requestAnimationFrame(draw);

    // Cleanup function
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [audioAnalyser, isRecording, isFrozen]);

  /* ============================================
     RENDER
     ============================================ */
  return (
    <>
      <div className={`wave-clipper ${className} ${styles.container}`}>
        <canvas ref={canvasRef}></canvas>
      </div>
      
      <style jsx>{`
        /* ============================================
           WAVE CLIPPER CONTAINER
           ============================================ */
        .wave-clipper {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          
          width: 100%;
          height: 32px;
          
          /* No background - transparent */
          background: transparent;
          
          /* Clips overflowing content (important for scroll animation) */
          overflow: clip;
          
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* Canvas fills container */
        canvas {
          display: block;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </>
  );
};

/* ============================================
   DEFAULT EXPORT
   ============================================ */
export default WaveClipper;

