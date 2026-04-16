/**
 * Sequential demo — single CoralStoneMorph blob that auto-loops through
 * all 4 voice states by changing prop values over time.
 *
 * NO component swapping. One component, different values:
 *   - goal: 1 = torus (idle/listening/thinking), 0 = sphere (talking)
 *   - morphSpeed: controls how fast torus↔sphere transition happens
 *   - waveIntensity/breathAmp/idleAmp: per-state motion values
 *   - audioData: zero for idle/thinking, simulated for listening/talking
 *
 * Flow:
 *   idle (torus, goal=1) → listening (torus, goal=1, audio)
 *   → thinking (torus, goal=1, elevated breathAmp for breathing pulse)
 *   → talking (goal changes to 0, sphere forms, audio reactive)
 *   → idle (goal changes back to 1, torus reforms, settle)
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

interface BlobSequentialDemoProps {
  studioSettings: BlobStudioSettings;
}

// Morph needs time to complete before next state
const MORPH_HOLD = 1000;
// Settle time after morphing back to torus before restarting
const SETTLE_DURATION = 1500;

export const BlobSequentialDemo: React.FC<BlobSequentialDemoProps> = ({
  studioSettings,
}) => {
  const [voiceState, setVoiceState] = useState<BlobVoiceState>('idle');
  const [isPlaying, setIsPlaying] = useState(true);
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

    // One full pulse cycle (thin→thick→thin) = 2 * thickenSpeed
    const pulseCycleMs = states.thinking.thickenSpeed * 2 * 1000;
    // Thinking duration = whole number of cycles so it ends on thinRadius
    const thinkingDuration = pulseCycleMs * Math.round(PHASE_THINKING / pulseCycleMs);

    // Morph speed matches thicken speed + 20% for extra distance (closing the hole)
    const morphDurationMs = states.thinking.thickenSpeed * 1.2 * 1000;

    let t = 0;

    // 1. Idle (torus, goal=1)
    t += PHASE_IDLE;
    at(t, () => setVoiceState('listening'));

    // 2. Listening (torus, goal=1, audio reactive)
    t += PHASE_LISTENING;
    at(t, () => setVoiceState('thinking'));

    // 3. Thinking — ends precisely on thinRadius (whole cycle count)
    t += thinkingDuration;

    // 4. Talking — goal becomes 0, torus morphs smoothly to sphere
    //    Morph speed proportional to thickenSpeed
    at(t, () => setVoiceState('talking'));
    t += morphDurationMs + PHASE_TALKING;

    // 5. Back to idle — goal becomes 1, sphere morphs back to torus
    at(t, () => setVoiceState('idle'));
    t += morphDurationMs + SETTLE_DURATION;

    // 6. Restart
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

  // ── Audio simulation ──────────────────────────────────────
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

  // ── Thinking pulse — oscillate torusRadius between thinRadius and thickRadius ──
  // Matches exactly what CoralStoneTorusDamped does in the gallery cell:
  //   goal=0 → thinRadius (0.275), goal=1 → thickRadius (0.35)
  useEffect(() => {
    if (voiceState === 'thinking') {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        // Cosine oscillation — starts at 0 (thinRadius) and rises to 1 (thickRadius)
        // cos starts at 1, so (1 - cos) / 2 starts at 0 = thinRadius, matching listening
        const t = (1 - Math.cos(elapsed * Math.PI / states.thinking.thickenSpeed)) / 2;
        setPulseRadius(base.thinRadius + (base.thickRadius - base.thinRadius) * t);
        pulseRafRef.current = requestAnimationFrame(animate);
      };
      pulseRafRef.current = requestAnimationFrame(animate);
      return () => {
        cancelAnimationFrame(pulseRafRef.current);
        setPulseRadius(null);
      };
    }
    setPulseRadius(null);
  }, [voiceState, base.thinRadius, base.thickRadius, states.thinking.thickenSpeed]);

  // ── Derive prop values from current state ─────────────────
  // goal: 0=sphere (talking), 1=torus (everything else)
  const goal = voiceState === 'talking' ? 0 : 1;

  // morphSpeed: matches thickenSpeed + 20% for extra distance (closing the hole)
  const morphSpeed = states.thinking.thickenSpeed * 1.2;

  // Per-state motion values
  const stateSettings = states[voiceState];

  // torusRadius must match the gallery cells:
  //   idle/listening: thinRadius (0.275) — matches CoralStoneTorusDamped at goal=0
  //   thinking: oscillates thinRadius↔thickRadius (0.275↔0.35)
  //   talking: thinRadius (sphere morph starts from thin state)
  const effectiveTorusRadius = pulseRadius ?? base.thinRadius;

  return (
    <div className="sequential-demo">
      <div className="demo-header">
        <h2 className="demo-title">Sequential Demo</h2>
        <button
          className="play-pause"
          onClick={() => setIsPlaying((p) => !p)}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>

      <div className="demo-card">
        <div className="orb-label-group">
          <div className="orb-container">
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

          <div className="state-label" key={voiceState}>
            <em>{BLOB_STATE_LABELS[voiceState]}</em>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sequential-demo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 20px 0;
        }
        .demo-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .demo-title {
          font-family: 'Open Runde', 'Inter', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #262424;
          margin: 0;
        }
        .play-pause {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #262424;
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 6px 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .play-pause:hover {
          background: rgba(0, 0, 0, 0.08);
          border-color: rgba(0, 0, 0, 0.2);
        }
        .demo-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 1000px;
          padding: 20px;
        }
        .orb-label-group {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .orb-container {
          position: relative;
          flex-shrink: 0;
          width: 400px;
          height: 400px;
        }
        .state-label {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: rgba(38, 36, 36, 0.3);
          text-align: center;
          min-height: 20px;
          /* Blob is rendered via perspective camera and fills ~40% of the
             400×400 canvas. Pull label up so it sits ~10px below the
             visible blob shape, not the canvas bounds. */
          margin-top: -120px;
          padding: 0 20px;
          animation: fadeIn 150ms ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 768px) {
          .demo-card {
            padding: 30px 15px 15px;
          }
          .orb-container {
            width: 300px;
            height: 300px;
          }
        }
      `}</style>
    </div>
  );
};
