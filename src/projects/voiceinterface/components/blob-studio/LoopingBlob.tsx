/**
 * LoopingBlob — extracted core loop logic from BlobSequentialDemo.
 *
 * Single CoralStoneMorph that auto-loops through all voice states.
 * Renders just the blob canvas + state label. No card, no header,
 * no pause button — use this when embedding in other UIs (e.g. home
 * page preview card).
 *
 * Props let callers control dimensions, label visibility, background.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import CoralStoneMorph from '@/projects/blob-orb/variants/CoralStoneMorph';
import type { AudioData } from '@/projects/voiceinterface/types';
import {
  getSimulatedAudioData,
  getSimulatedAudioDataIntense,
  ZERO_AUDIO,
} from '@/projects/voiceinterface/utils/simulatedAudio';
import {
  type BlobVoiceState,
  type BlobStudioSettings,
  BLOB_STATE_LABELS,
  PHASE_IDLE,
  PHASE_LISTENING,
  PHASE_THINKING,
  PHASE_TALKING,
  CAMERA_Z,
  CAMERA_FOV,
} from './blobStudioTypes';

interface LoopingBlobProps {
  studioSettings: BlobStudioSettings;
  /** Canvas width (px). Default 400. */
  width?: number;
  /** Canvas height (px). Default 400. */
  height?: number;
  /** Show state label under blob. Default true. */
  showLabel?: boolean;
  /** Label font size (px). Default 16. */
  labelFontSize?: number;
  /** Pixels to pull the label up by negative margin. Default 120. */
  labelOffset?: number;
  /** Whether the loop is running. Default true. */
  isPlaying?: boolean;
}

// Morph hold + settle durations
const MORPH_HOLD = 1000;
const SETTLE_DURATION = 1500;

export const LoopingBlob: React.FC<LoopingBlobProps> = ({
  studioSettings,
  width = 400,
  height = 400,
  showLabel = true,
  labelFontSize = 16,
  labelOffset = 120,
  isPlaying = true,
}) => {
  const [voiceState, setVoiceState] = useState<BlobVoiceState>('idle');
  const [audioData, setAudioData] = useState<AudioData>(ZERO_AUDIO);
  const [pulseRadius, setPulseRadius] = useState<number | null>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number>(0);
  const pulseRafRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  const { base, states } = studioSettings;

  const clearTimers = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  const startLoop = useCallback(() => {
    clearTimers();
    setVoiceState('idle');
    setAudioData(ZERO_AUDIO);

    const at = (delay: number, fn: () => void) => {
      timerRefs.current.push(setTimeout(fn, delay));
    };

    const pulseCycleMs = states.thinking.thickenSpeed * 2 * 1000;
    // +1 extra cycle so thinking feels more substantial. We measure by
    // whole cycles (not wall-clock time) so the phase always ends on
    // the thin trough for a clean morph to sphere.
    const thinkingDuration = pulseCycleMs * (Math.round(PHASE_THINKING / pulseCycleMs) + 1);
    // Morph speed: 1.08x thickenSpeed (10% faster than previous 1.2x)
    const morphDurationMs = states.thinking.thickenSpeed * 1.08 * 1000;

    let t = 0;

    t += PHASE_IDLE;
    at(t, () => setVoiceState('listening'));

    t += PHASE_LISTENING;
    at(t, () => setVoiceState('thinking'));

    t += thinkingDuration;
    at(t, () => setVoiceState('talking'));

    t += morphDurationMs + PHASE_TALKING;
    at(t, () => setVoiceState('idle'));

    t += morphDurationMs + SETTLE_DURATION;
    at(t, () => startLoop());
  }, [clearTimers, states.thinking.thickenSpeed]);

  useEffect(() => {
    if (isPlaying) {
      startLoop();
    } else {
      clearTimers();
    }
    return () => clearTimers();
  }, [isPlaying, startLoop, clearTimers]);

  // Audio simulation
  useEffect(() => {
    if (voiceState === 'listening' || voiceState === 'talking') {
      startTimeRef.current = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current;
        if (voiceState === 'talking') {
          setAudioData(getSimulatedAudioDataIntense(elapsed));
        } else {
          setAudioData(getSimulatedAudioData(elapsed));
        }
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafRef.current);
    } else {
      setAudioData(ZERO_AUDIO);
      cancelAnimationFrame(rafRef.current);
    }
  }, [voiceState]);

  // TorusRadius management per state:
  // - idle / listening: thinRadius (0.275)
  // - thinking: oscillates thinRadius → thickRadius → thinner (0.22) ↔ thickRadius
  //             ends at the thinner value (0.22)
  // - talking: HOLDS at the thinner value (0.22) so the thinking→talking
  //            morph starts from where the pulse left off, no jump
  // - returning to idle: smoothly animate from 0.22 back up to 0.275
  const pulseRadiusRef = useRef<number | null>(null);
  useEffect(() => {
    pulseRadiusRef.current = pulseRadius;
  }, [pulseRadius]);

  useEffect(() => {
    const thickenSpeed = states.thinking.thickenSpeed;
    const newThin = base.thinRadius * 0.8; // 20% thinner than listening

    if (voiceState === 'thinking') {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        let radius: number;
        if (elapsed < thickenSpeed) {
          // First upstroke: thinRadius → thickRadius
          const t = (1 - Math.cos(elapsed * Math.PI / thickenSpeed)) / 2;
          radius = base.thinRadius + (base.thickRadius - base.thinRadius) * t;
        } else {
          // Subsequent oscillations between thickRadius and newThin
          const phase = elapsed - thickenSpeed;
          const t = (1 + Math.cos(phase * Math.PI / thickenSpeed)) / 2;
          radius = newThin + (base.thickRadius - newThin) * t;
        }
        setPulseRadius(radius);
        pulseRafRef.current = requestAnimationFrame(animate);
      };
      pulseRafRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(pulseRafRef.current);
    }

    if (voiceState === 'talking') {
      // Hold at the thinner value so the torus→sphere morph starts
      // from where the pulse left off (no jitter)
      setPulseRadius(newThin);
      return;
    }

    if (voiceState === 'idle') {
      // Smoothly animate back from wherever we are to thinRadius
      const startValue = pulseRadiusRef.current ?? base.thinRadius;
      if (startValue === base.thinRadius) {
        setPulseRadius(null);
        return;
      }
      const startTime = Date.now();
      const duration = 800; // ms
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        const radius = startValue + (base.thinRadius - startValue) * eased;
        if (t < 1) {
          setPulseRadius(radius);
          pulseRafRef.current = requestAnimationFrame(animate);
        } else {
          setPulseRadius(null); // back to default
        }
      };
      pulseRafRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(pulseRafRef.current);
    }

    // listening — use default thinRadius
    setPulseRadius(null);
  }, [voiceState, base.thinRadius, base.thickRadius, states.thinking.thickenSpeed]);

  const goal = voiceState === 'talking' ? 0 : 1;
  const morphSpeed = states.thinking.thickenSpeed * 1.08;
  const stateSettings = states[voiceState];
  const effectiveTorusRadius = pulseRadius ?? base.thinRadius;

  return (
    <div className="looping-blob">
      <div className="blob-canvas" style={{ width, height }}>
        <Canvas
          camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          frameloop="always"
          style={{ position: 'absolute', inset: 0, background: 'transparent' }}
        >
          <ambientLight intensity={0.5} />
          <CoralStoneMorph
            audioData={audioData}
            goal={goal}
            scale={base.scale}
            morphSpeed={morphSpeed}
            torusRadius={effectiveTorusRadius}
            waveIntensity={stateSettings.waveIntensity}
            breathAmp={stateSettings.breathAmp}
            idleAmp={stateSettings.idleAmp}
            color1={base.color1}
            color2={base.color2}
            color3={base.color3}
          />
        </Canvas>
      </div>

      {showLabel && (
        <div className="state-label-wrap" style={{ marginTop: -labelOffset }}>
          <div key={voiceState} className="state-label" style={{ fontSize: labelFontSize }}>
            {voiceState === 'listening' ? (
              <em>{BLOB_STATE_LABELS[voiceState]}</em>
            ) : (
              BLOB_STATE_LABELS[voiceState]
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .looping-blob {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .blob-canvas {
          position: relative;
          flex-shrink: 0;
        }
        .state-label-wrap {
          min-height: 20px;
          display: flex;
          justify-content: center;
        }
        .state-label-wrap :global(.state-label) {
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          color: rgba(38, 36, 36, 0.25);
          text-align: center;
          padding: 0 20px;
        }
      `}</style>
    </div>
  );
};
