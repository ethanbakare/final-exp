/**
 * Sequential demo — single blob that auto-loops through all 4 states.
 * Uses settings from the gallery cells above.
 *
 * Transition: idle → listening → thinking → (morph torus→sphere) → talking → (morph sphere→torus) → idle
 *
 * Uses CoralStoneTorusDamped for idle/listening/thinking,
 * swaps to CoralStoneMorph for the talking transition.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import CoralStoneTorusDamped from '@/projects/blob-orb/variants/CoralStoneTorusDamped';
import CoralStoneMorph from '@/projects/blob-orb/variants/CoralStoneMorph';
import type { AudioData } from '@/projects/voiceinterface/types';
import {
  getSimulatedAudioData,
  getSimulatedAudioDataIntense,
  ZERO_AUDIO,
} from '@/projects/voiceinterface/utils/simulatedAudio';
import {
  type BlobVoiceState,
  type BlobBaseSettings,
  type BlobStateSettings,
  type BlobStudioSettings,
  BLOB_STATE_LABELS,
  PHASE_IDLE,
  PHASE_LISTENING,
  PHASE_THINKING,
  PHASE_TALKING,
  PHASE_PAUSE,
  TOTAL_LOOP,
  CAMERA_Z,
  CAMERA_FOV,
} from './blobStudioTypes';

interface BlobSequentialDemoProps {
  studioSettings: BlobStudioSettings;
}

// Internal state includes a morph transition phase
type InternalState = BlobVoiceState | 'morph_to_sphere' | 'morph_to_torus' | 'pause';

const MORPH_DURATION = 500; // ms for torus↔sphere morph

export const BlobSequentialDemo: React.FC<BlobSequentialDemoProps> = ({
  studioSettings,
}) => {
  const [internalState, setInternalState] = useState<InternalState>('idle');
  const [isPlaying, setIsPlaying] = useState(true);
  const [audioData, setAudioData] = useState<AudioData>(ZERO_AUDIO);
  const [thinkingGoal, setThinkingGoal] = useState(0);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  const { base, states } = studioSettings;

  const clearTimers = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  const startLoop = useCallback(() => {
    clearTimers();
    setInternalState('idle');
    setAudioData(ZERO_AUDIO);
    setThinkingGoal(0);

    const at = (delay: number, fn: () => void) => {
      timerRefs.current.push(setTimeout(fn, delay));
    };

    let t = 0;

    // Idle
    t += PHASE_IDLE;
    at(t, () => setInternalState('listening'));

    // Listening
    t += PHASE_LISTENING;
    at(t, () => setInternalState('thinking'));

    // Thinking
    t += PHASE_THINKING;
    // Morph torus → sphere
    at(t, () => setInternalState('morph_to_sphere'));
    t += MORPH_DURATION;
    at(t, () => setInternalState('talking'));

    // Talking
    t += PHASE_TALKING;
    // Morph sphere → torus (smooth transition back)
    at(t, () => setInternalState('morph_to_torus'));
    t += MORPH_DURATION;
    // Land back in idle (torus resting state) — seamless loop
    at(t, () => setInternalState('idle'));

    // Idle hold before next cycle
    t += PHASE_IDLE;
    // Restart the full loop
    at(t, () => startLoop());
  }, [clearTimers]);

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
    const needsAudio = internalState === 'listening' || internalState === 'talking' || internalState === 'morph_to_sphere' || internalState === 'morph_to_torus';
    if (!needsAudio) {
      setAudioData(ZERO_AUDIO);
      cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (internalState === 'talking') {
        setAudioData(getSimulatedAudioDataIntense(elapsed));
      } else {
        setAudioData(getSimulatedAudioData(elapsed));
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [internalState]);

  // Thinking goal pulsing
  useEffect(() => {
    if (internalState !== 'thinking') {
      if (internalState !== 'morph_to_sphere') setThinkingGoal(0);
      return;
    }
    setThinkingGoal(1);
    const ms = states.thinking.thickenSpeed * 1000;
    const id = setInterval(() => setThinkingGoal((p) => (p === 0 ? 1 : 0)), ms);
    return () => clearInterval(id);
  }, [internalState, states.thinking.thickenSpeed]);

  // Determine which component and props to use
  const useMorphComponent = internalState === 'morph_to_sphere' || internalState === 'talking' || internalState === 'morph_to_torus';

  // Map internal state to display state for label
  const displayState: BlobVoiceState | null =
    internalState === 'pause' ? null :
    internalState === 'morph_to_sphere' ? 'thinking' :
    internalState === 'morph_to_torus' ? 'idle' :
    internalState as BlobVoiceState;

  // Get the right per-state settings
  const currentStateSettings = useMorphComponent
    ? states.talking
    : internalState === 'thinking'
      ? states.thinking
      : internalState === 'listening'
        ? states.listening
        : states.idle;

  // Morph goal: 0=sphere, 1=torus
  const morphGoal =
    internalState === 'morph_to_sphere' ? 0 :
    internalState === 'talking' ? 0 :
    1; // morph_to_torus or default

  // Thicken goal for CoralStoneTorusDamped
  const thickenGoal = internalState === 'thinking' ? thinkingGoal : 0;

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

      {/* Card — matches realtime page layout */}
      <div className="demo-card">
        {/* Orb + Label Group */}
        <div className="orb-label-group">
          <div className="orb-container">
            <Canvas
              camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
              dpr={[1, 1.5]}
              gl={{ antialias: true }}
              frameloop="always"
              style={{ position: 'absolute', inset: 0 }}
            >
              <color attach="background" args={[base.bgColor]} />
              <ambientLight intensity={0.5} />
              {useMorphComponent ? (
                <CoralStoneMorph
                  audioData={audioData}
                  goal={morphGoal}
                  scale={base.scale}
                  morphSpeed={states.talking.thickenSpeed}
                  torusRadius={base.torusRadius}
                  waveIntensity={currentStateSettings.waveIntensity}
                  breathAmp={currentStateSettings.breathAmp}
                  idleAmp={currentStateSettings.idleAmp}
                  color1={base.color1}
                  color2={base.color2}
                  color3={base.color3}
                />
              ) : (
                <CoralStoneTorusDamped
                  audioData={audioData}
                  goal={thickenGoal}
                  scale={base.scale}
                  thinRadius={base.thinRadius}
                  thickRadius={base.thickRadius}
                  thickenSpeed={currentStateSettings.thickenSpeed}
                  waveIntensity={currentStateSettings.waveIntensity}
                  breathAmp={currentStateSettings.breathAmp}
                  idleAmp={currentStateSettings.idleAmp}
                  color1={base.color1}
                  color2={base.color2}
                  color3={base.color3}
                />
              )}
            </Canvas>
          </div>

          {/* State label — directly under orb inside the group */}
          <div className="state-label" key={displayState || 'none'}>
            {displayState ? <em>{BLOB_STATE_LABELS[displayState]}</em> : '\u00A0'}
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

        /* Card — matches realtime voice-realtime-card */
        .demo-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
          max-width: 1000px;
          padding: 40px 20px 20px;
          background: #F7F6F4;
          border: 1px solid #F2F2F2;
          box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.06);
          border-radius: 16px;
        }

        /* Orb + Label Group */
        .orb-label-group {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Orb Container */
        .orb-container {
          position: relative;
          flex-shrink: 0;
          width: 400px;
          height: 400px;
        }

        /* State Label — directly under orb */
        .state-label {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: rgba(38, 36, 36, 0.3);
          text-align: center;
          min-height: 24px;
          padding: 4px 20px;
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
