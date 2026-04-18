/**
 * Sequential demo — thin wrapper around LoopingBlob that adds the
 * "Sequential Demo" header and a play/pause button for the studio page.
 */
import React, { useState } from 'react';
import { LoopingBlob } from './LoopingBlob';
import type { BlobStudioSettings } from './blobStudioTypes';

interface BlobSequentialDemoProps {
  studioSettings: BlobStudioSettings;
}

export const BlobSequentialDemo: React.FC<BlobSequentialDemoProps> = ({
  studioSettings,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);

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
        <LoopingBlob
          studioSettings={studioSettings}
          width={400}
          height={400}
          showLabel
          labelFontSize={16}
          labelOffset={120}
          isPlaying={isPlaying}
        />
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
      `}</style>
    </div>
  );
};
