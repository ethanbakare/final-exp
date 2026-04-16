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
  onSettingsChange: (settings: BlobStateSettings) => void;
}

export const BlobStateCell: React.FC<BlobStateCellProps> = ({
  state,
  base,
  settings,
  onSettingsChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [audioData, setAudioData] = useState<AudioData>(ZERO_AUDIO);
  const [thinkingGoal, setThinkingGoal] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  // Audio simulation loop
  useEffect(() => {
    if (state === 'idle' || state === 'thinking') {
      setAudioData(ZERO_AUDIO);
      return;
    }

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
  }, [state]);

  // Thinking goal pulsing
  useEffect(() => {
    if (state !== 'thinking') {
      setThinkingGoal(0);
      return;
    }
    setThinkingGoal(1);
    const ms = settings.thickenSpeed * 1000;
    const id = setInterval(() => setThinkingGoal((p) => (p === 0 ? 1 : 0)), ms);
    return () => clearInterval(id);
  }, [state, settings.thickenSpeed]);

  const handleChange = useCallback(
    (key: keyof BlobStateSettings, value: number) => {
      onSettingsChange({ ...settings, [key]: value });
    },
    [settings, onSettingsChange]
  );

  // Determine goal for the blob
  const goal = state === 'thinking' ? thinkingGoal : state === 'talking' ? 0 : 0;

  return (
    <div className="blob-state-cell">
      {/* Canvas */}
      <div className="cell-canvas" style={{ width: CELL_SIZE, height: CELL_SIZE }}>
        <Canvas
          camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV }}
          dpr={[1, 1.5]}
          gl={{ antialias: true }}
          frameloop="always"
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

      {/* Label */}
      <div className="cell-label">{BLOB_STATE_LABELS[state]}</div>

      {/* Expand/collapse controls */}
      <button className="cell-toggle" onClick={() => setExpanded((e) => !e)}>
        {expanded ? '▲ Hide Controls' : '▼ Controls'}
      </button>

      {/* Sliders */}
      {expanded && (
        <div className="cell-controls">
          <SliderRow
            label="Wave Intensity"
            value={settings.waveIntensity}
            min={0.02}
            max={0.5}
            step={0.01}
            onChange={(v) => handleChange('waveIntensity', v)}
          />
          <SliderRow
            label="Breath Amp"
            value={settings.breathAmp}
            min={0}
            max={0.1}
            step={0.005}
            onChange={(v) => handleChange('breathAmp', v)}
          />
          <SliderRow
            label="Idle Amp"
            value={settings.idleAmp}
            min={0}
            max={0.1}
            step={0.005}
            onChange={(v) => handleChange('idleAmp', v)}
          />
          <SliderRow
            label={state === 'thinking' ? 'Pulse Speed (s)' : state === 'talking' ? 'Morph Speed (s)' : 'Thicken Speed (s)'}
            value={settings.thickenSpeed}
            min={0.3}
            max={4.0}
            step={0.1}
            onChange={(v) => handleChange('thickenSpeed', v)}
          />
        </div>
      )}

      <style jsx>{`
        .blob-state-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .cell-canvas {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .cell-label {
          font-family: 'Open Runde', 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #262424;
        }
        .cell-toggle {
          font-family: 'Open Runde', 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: rgba(38, 36, 36, 0.4);
          background: none;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 6px;
          padding: 4px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .cell-toggle:hover {
          color: rgba(38, 36, 36, 0.6);
          border-color: rgba(0, 0, 0, 0.2);
        }
        .cell-controls {
          width: ${CELL_SIZE}px;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      `}</style>
    </div>
  );
};
