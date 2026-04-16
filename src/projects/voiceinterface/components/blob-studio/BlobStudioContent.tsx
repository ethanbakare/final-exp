/**
 * BlobStudioContent — main content for the Blob Studio page.
 * Renders the state gallery (4 cells) and sequential demo,
 * with shared settings state. Click a cell to activate it.
 */
import React, { useState, useCallback } from 'react';
import { BlobStateCell } from './BlobStateCell';
import { BlobSequentialDemo } from './BlobSequentialDemo';
import SliderRow from '@/projects/blob-orb/components/shared/SliderRow';
import {
  type BlobVoiceState,
  type BlobStateSettings,
  type BlobStudioSettings,
  WHIMSY_BASE,
  DEFAULT_STATE_SETTINGS,
  BLOB_STATE_LABELS,
} from './blobStudioTypes';

const STATES: BlobVoiceState[] = ['idle', 'listening', 'thinking', 'talking'];

const BlobStudioContent: React.FC = () => {
  const [studioSettings, setStudioSettings] = useState<BlobStudioSettings>({
    base: WHIMSY_BASE,
    states: DEFAULT_STATE_SETTINGS,
  });
  const [activeState, setActiveState] = useState<BlobVoiceState | null>(null);

  const handleStateSettingsChange = useCallback(
    (state: BlobVoiceState, newSettings: BlobStateSettings) => {
      setStudioSettings((prev) => ({
        ...prev,
        states: {
          ...prev.states,
          [state]: newSettings,
        },
      }));
    },
    []
  );

  const handleSliderChange = useCallback(
    (key: keyof BlobStateSettings, value: number) => {
      if (!activeState) return;
      setStudioSettings((prev) => ({
        ...prev,
        states: {
          ...prev.states,
          [activeState]: {
            ...prev.states[activeState],
            [key]: value,
          },
        },
      }));
    },
    [activeState]
  );

  const activeSettings = activeState ? studioSettings.states[activeState] : null;

  return (
    <div className="blob-studio">
      {/* Header */}
      <div className="studio-header">
        <h1 className="studio-title">Blob Studio</h1>
        <p className="studio-subtitle">
          Craft voice interface blob states for the home page
        </p>
      </div>

      {/* Section A: State Gallery */}
      <div className="gallery-section">
        <div className="gallery-grid">
          {STATES.map((state) => (
            <BlobStateCell
              key={state}
              state={state}
              base={studioSettings.base}
              settings={studioSettings.states[state]}
              isActive={activeState === state}
              onSelect={() => setActiveState((prev) => prev === state ? null : state)}
              onSettingsChange={(s) => handleStateSettingsChange(state, s)}
            />
          ))}
        </div>
      </div>

      {/* Bottom controls — only show when a cell is selected */}
      {activeState && activeSettings && (
        <div className="controls-bar">
          <div className="controls-header">
            <span className="controls-label">{BLOB_STATE_LABELS[activeState]}</span>
          </div>
          <div className="controls-row">
            <SliderRow
              label="Wave Intensity"
              value={activeSettings.waveIntensity}
              min={0.02}
              max={0.5}
              step={0.01}
              onChange={(v) => handleSliderChange('waveIntensity', v)}
            />
            <SliderRow
              label="Breath Amp"
              value={activeSettings.breathAmp}
              min={0}
              max={0.1}
              step={0.005}
              onChange={(v) => handleSliderChange('breathAmp', v)}
            />
            <SliderRow
              label="Idle Amp"
              value={activeSettings.idleAmp}
              min={0}
              max={0.1}
              step={0.005}
              onChange={(v) => handleSliderChange('idleAmp', v)}
            />
            <SliderRow
              label={activeState === 'thinking' ? 'Pulse Speed' : activeState === 'talking' ? 'Morph Speed' : 'Thicken Speed'}
              value={activeSettings.thickenSpeed}
              min={0.3}
              max={4.0}
              step={0.1}
              unit="s"
              onChange={(v) => handleSliderChange('thickenSpeed', v)}
            />
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="divider" />

      {/* Section B: Sequential Demo */}
      <BlobSequentialDemo studioSettings={studioSettings} />

      <style jsx>{`
        .blob-studio {
          min-height: 100vh;
          padding: 40px 20px 80px;
          background: #fafafa;
          font-family: 'Open Runde', 'Inter', sans-serif;
        }
        .studio-header {
          max-width: 1800px;
          margin: 0 auto 32px;
          text-align: center;
        }
        .studio-title {
          font-size: 32px;
          font-weight: 700;
          color: #262424;
          margin: 0 0 8px;
        }
        .studio-subtitle {
          font-size: 16px;
          font-weight: 500;
          color: rgba(38, 36, 36, 0.5);
          margin: 0;
        }
        .gallery-section {
          max-width: 1800px;
          margin: 0 auto;
        }
        .gallery-grid {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .controls-bar {
          max-width: 1000px;
          margin: 24px auto 0;
          padding: 16px 24px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .controls-header {
          margin-bottom: 12px;
        }
        .controls-label {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(38, 36, 36, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .controls-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .divider {
          max-width: 1800px;
          margin: 40px auto;
          height: 1px;
          background: rgba(0, 0, 0, 0.08);
        }
        @media (max-width: 900px) {
          .controls-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default BlobStudioContent;
