/**
 * Individual blob state cell — renders the blob for one voice state.
 * Follows the GalleryCell pattern: click to activate, green dot indicator.
 * Label sits inside the cell directly under the blob.
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

  const goal = state === 'thinking' ? thinkingGoal : state === 'talking' ? 0 : 0;

  return (
    <div className="blob-state-cell" onClick={onSelect}>
      {/* Green active indicator — top right, inside the cell */}
      {isActive && <div className="active-dot" />}

      {/* Canvas */}
      <div className="cell-canvas">
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

      {/* Label — inside the cell, directly under blob */}
      <div className="cell-label">
        {state === 'listening' || state === 'thinking' ? (
          <em>{BLOB_STATE_LABELS[state]}</em>
        ) : (
          BLOB_STATE_LABELS[state]
        )}
      </div>

      <style jsx>{`
        .blob-state-cell {
          position: relative;
          width: ${CELL_SIZE}px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          border: 0.8px solid rgba(38, 36, 36, 0.05);
          background: ${base.bgColor};
          overflow: hidden;
        }
        .active-dot {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #4ade80;
          z-index: 2;
        }
        .cell-canvas {
          position: relative;
          width: ${CELL_SIZE}px;
          height: ${CELL_SIZE}px;
        }
        .cell-label {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: rgba(38, 36, 36, 0.35);
          text-align: center;
          padding: 6px 0 10px;
        }
      `}</style>
    </div>
  );
};
