import React from 'react';
import {
  ClipClearBtn,
  ClipCloseBtn,
  ClipRecordRedBtn,
  ClipRecordActiveBtn,
  ClipProcessingDimBtn,
  ClipProcessingWhiteBtn,
  ClipProcessingDarkBtn,
  ClipTimer,
} from '@/projects/voiceinterface/components/ui/voicebuttons-clip';

/**
 * Showcase of the 34px clip-style buttons destined for the dark
 * RecordBar card (Figma: Dictation app, record-bar-* frames).
 * Dark background so the buttons render on the target surface.
 */

const Cell: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <>
    <div className="cell">
      <div className="center">{children}</div>
      <div className="label">{label}</div>
    </div>
    <style jsx>{`
      .cell {
        position: relative;
        width: 200px;
        height: 200px;
        display: flex;
        flex-direction: column;
        border: 0.8px solid rgba(255, 255, 255, 0.06);
      }
      .center {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .label {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 9px;
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: rgba(255, 255, 255, 0.4);
        white-space: nowrap;
      }
    `}</style>
  </>
);

const VoiceComponentsClip: React.FC = () => (
  <>
    <div className="page">
      <div className="grid">
        <Cell label="Clear Btn — 34px">
          <ClipClearBtn />
        </Cell>
        <Cell label="Close Btn — 34px">
          <ClipCloseBtn />
        </Cell>
        <Cell label="Record Red — 34px">
          <ClipRecordRedBtn />
        </Cell>
        <Cell label="Record Active — 34px">
          <ClipRecordActiveBtn />
        </Cell>
        <Cell label="Processing Dim — 34px">
          <ClipProcessingDimBtn />
        </Cell>
        <Cell label="Processing White — 34px">
          <ClipProcessingWhiteBtn />
        </Cell>
        <Cell label="Processing Dark — 34px">
          <ClipProcessingDarkBtn />
        </Cell>
        <Cell label="Timer — 0:26">
          <ClipTimer value="0:26" />
        </Cell>
      </div>
    </div>
    <style jsx>{`
      .page {
        min-height: 100vh;
        background: #2C2929;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, 200px);
        gap: 0;
        border: 0.8px solid rgba(255, 255, 255, 0.06);
      }
    `}</style>
  </>
);

export default VoiceComponentsClip;
