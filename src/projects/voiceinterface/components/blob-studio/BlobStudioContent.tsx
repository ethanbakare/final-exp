/**
 * BlobStudioContent — main content for the Blob Studio page.
 * Renders the state gallery (4 cells) and sequential demo,
 * with shared settings state.
 */
import React, { useState, useCallback } from 'react';
import { BlobStateCell } from './BlobStateCell';
import { BlobSequentialDemo } from './BlobSequentialDemo';
import {
  type BlobVoiceState,
  type BlobStateSettings,
  type BlobStudioSettings,
  WHIMSY_BASE,
  DEFAULT_STATE_SETTINGS,
} from './blobStudioTypes';

const STATES: BlobVoiceState[] = ['idle', 'listening', 'thinking', 'talking'];

const BlobStudioContent: React.FC = () => {
  const [studioSettings, setStudioSettings] = useState<BlobStudioSettings>({
    base: WHIMSY_BASE,
    states: DEFAULT_STATE_SETTINGS,
  });

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
        <h2 className="section-title">State Gallery</h2>
        <div className="gallery-grid">
          {STATES.map((state) => (
            <BlobStateCell
              key={state}
              state={state}
              base={studioSettings.base}
              settings={studioSettings.states[state]}
              onSettingsChange={(s) => handleStateSettingsChange(state, s)}
            />
          ))}
        </div>
      </div>

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
          margin: 0 auto 40px;
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
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #262424;
          margin: 0 0 20px;
          padding-left: 8px;
        }
        .gallery-grid {
          display: flex;
          gap: 24px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .divider {
          max-width: 1800px;
          margin: 40px auto;
          height: 1px;
          background: rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </div>
  );
};

export default BlobStudioContent;
