/**
 * Individual blob state cell — renders the blob for one voice state
 * with a canvas, label, and expandable slider controls.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import CoralStoneTorusDamped from '@/projects/blob-orb/variants/CoralStoneTorusDamped';
import CoralStoneMorph from '@/projects/blob-orb/variants/CoralStoneMorph';
import SliderRow from '@/projects/blob-orb/components/shared/SliderRow';
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
  BLOB_STATE_LABELS,
  CELL_SIZE,
  CAMERA_Z,
  CAMERA_FOV,
} from './blobStudioTypes';

interface BlobStateCellProps {
  state: BlobVoiceState;
  base: BlobBaseSettings;
  settings: BlobStateSettings;
  isActive: boolean;
  onSelect: () => void;
  onSettingsChange: (settings: BlobStateSettings) => void;
}

export const BlobStateCell: React.FC<BlobStateCellProps> = ({
  state,
  base,
  settings,
  isActive,
  onSelect,
  onSettingsChange,
}) => {
  const [audioData, setAudioData] = useState<AudioData>(ZERO_AUDIO);
  const [thinkingGoal, setThinkingGoal] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  // Audio simulation loop — only runs when cell is active
  useEffect(() => {
    if (!isActive || state === 'idle' || state === 'thinking') {
      setAudioData(ZERO_AUDIO);
      cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (state === 'talking') {
        setAudioData(getSimulatedAudioDataIntense(elapsed));
      } else {
        setAudioData(getSimulatedAudioData(elapsed));
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, isActive]);

  // Thinking goal pulsing — only when active
  useEffect(() => {
    if (!isActive || state !== 'thinking') {
      setThinkingGoal(0);
      return;
    }
    setThinkingGoal(1);
    const ms = settings.thickenSpeed * 1000;
    const id = setInterval(() => setThinkingGoal((p) => (p === 0 ? 1 : 0)), ms);
    return () => clearInterval(id);
  }, [state, isActive, settings.thickenSpeed]);

  const handleChange = useCallback(
    (key: keyof BlobStateSettings, value: number) => {
      onSettingsChange({ ...settings, [key]: value });
    },
    [settings, onSettingsChange]
  );

  // Determine goal for the blob
  const goal = state === 'thinking' ? thinkingGoal : state === 'talking' ? 0 : 0;

  return (
    <div className={`blob-state-cell ${isActive ? 'active' : ''}`} onClick={onSelect}>
      {/* Canvas */}
      <div className="cell-canvas" style={{ width: CELL_SIZE, height: CELL_SIZE }}>
        <Canvas
          camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
          frameloop={isActive ? 'always' : 'demand'}
          style={{ position: 'absolute', inset: 0 }}
        >
          <color attach="background" args={[base.bgColor]} />
          <ambientLight intensity={0.5} />
          {state === 'talking' ? (
            <CoralStoneMorph
              audioData={audioData}
              goal={goal}
              scale={base.scale}
              morphSpeed={settings.thickenSpeed}
              torusRadius={base.torusRadius}
              waveIntensity={settings.waveIntensity}
              breathAmp={settings.breathAmp}
              idleAmp={settings.idleAmp}
              color1={base.color1}
              color2={base.color2}
              color3={base.color3}
            />
          ) : (
            <CoralStoneTorusDamped
              audioData={audioData}
              goal={goal}
              scale={base.scale}
              thinRadius={base.thinRadius}
              thickRadius={base.thickRadius}
              thickenSpeed={settings.thickenSpeed}
              waveIntensity={settings.waveIntensity}
              breathAmp={settings.breathAmp}
              idleAmp={settings.idleAmp}
              color1={base.color1}
              color2={base.color2}
              color3={base.color3}
            />
          )}
        </Canvas>
      </div>

      {/* Label — italic Inter, directly under blob */}
      <div className="cell-label">
        <em>{BLOB_STATE_LABELS[state]}</em>
      </div>

      <style jsx>{`
        .blob-state-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .blob-state-cell:not(.active) {
          opacity: 0.6;
        }
        .blob-state-cell.active {
          opacity: 1;
        }
        .cell-canvas {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
          transition: border-color 0.15s ease;
        }
        .blob-state-cell.active .cell-canvas {
          border-color: rgba(0, 0, 0, 0.15);
        }
        .cell-label {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 400;
          color: rgba(38, 36, 36, 0.35);
        }
      `}</style>
    </div>
  );
};
