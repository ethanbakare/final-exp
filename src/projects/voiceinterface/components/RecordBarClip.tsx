import React from 'react';
import { ClipRecordRedBtn } from './ui/voicebuttons-clip';

/**
 * RecordBarClip — visual shell for the dark RecordBar card
 * (Figma: Dictation app, record-bar-* frames).
 *
 * This is a port of variation 1 (VoiceTextBoxStandard) restyled to
 * match the Figma dark-card design. State machine, audio recording,
 * and other internals are deliberately not lifted here — this is
 * the visual starting point we'll iterate on.
 *
 * Defaults to the idle / placeholder state ("Tap to dictate").
 */

type Props = {
  placeholder?: string;
  className?: string;
};

export const RecordBarClip: React.FC<Props> = ({ placeholder = 'Tap to dictate', className = '' }) => (
  <>
    <div className={`record-bar ${className}`}>
      <div className="text-container">
        <div className="text-placeholder">{placeholder}</div>
      </div>
      <div className="nav-pill">
        <div className="nav-right">
          <ClipRecordRedBtn />
        </div>
      </div>
    </div>

    <style jsx>{`
      .record-bar {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        gap: 24px;
        width: 393px;
        height: 160px;
        padding: 12px;
        border-radius: 28px;
        border: 1.5px solid #4D4747;
        background: #2C2929;
        box-shadow:
          0 4px 4px -2px rgba(12, 12, 13, 0.12),
          0 1px 1px -1px rgba(12, 12, 13, 0.08);
        box-sizing: border-box;
      }

      .text-container {
        display: flex;
        flex: 1 0 0;
        align-self: stretch;
        padding: 12px 9px;
        justify-content: center;
        align-items: flex-start;
        gap: 10px;
      }

      .text-placeholder {
        flex: 1 0 0;
        color: rgba(255, 255, 255, 0.30);
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 16px;
        font-weight: 400;
        line-height: normal;
      }

      .nav-pill {
        display: flex;
        align-self: stretch;
        padding: 4px;
        justify-content: flex-end; /* right-align: idle has only the mic */
        align-items: center;
        border-radius: 28.8px;
        box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
      }

      .nav-right {
        display: flex;
        align-items: center;
        gap: 9px;
      }
    `}</style>
  </>
);

export default RecordBarClip;
