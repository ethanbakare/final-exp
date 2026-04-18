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
import { VoiceTextBoxClip } from '@/projects/voiceinterface/components/VoiceTextBoxClip';

/**
 * Showcase of the 34px clip-style buttons destined for the dark
 * RecordBar card (Figma: Dictation app, record-bar-* frames).
 * Dark background so the buttons render on the target surface.
 */

const Cell: React.FC<{ children: React.ReactNode; label: string; tinted?: boolean }> = ({ children, label, tinted }) => (
  <>
    <div className={`cell ${tinted ? 'tinted' : ''}`}>
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
      /* Subtle lift behind the dark Processing button so its #2C2929
         circle is visible — mirrors the white-10 nav-pill context
         the button sits in when used inside a real RecordBar. */
      .cell.tinted {
        background: rgba(255, 255, 255, 0.04);
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
    <section className="section-buttons">
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
        <Cell label="Processing Dark — 34px" tinted>
          <ClipProcessingDarkBtn />
        </Cell>
        <Cell label="Timer — 0:26">
          <ClipTimer value="0:26" />
        </Cell>
      </div>
    </section>

    <section className="section-card">
      <div className="card-row">
        <div className="card-label">VoiceTextBox Clip — verbatim clone of variation 1 (no style changes yet)</div>
        <VoiceTextBoxClip />
      </div>
    </section>
    <style jsx>{`
      .section-buttons {
        min-height: 100vh;
        background: #2C2929;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
      }
      .section-card {
        min-height: 100vh;
        background: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, 200px);
        justify-content: center;
        gap: 0;
        border: 0.8px solid rgba(255, 255, 255, 0.06);
        max-width: 100%;
      }
      .card-row {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
      .card-label {
        font-family: 'Inter', -apple-system, sans-serif;
        font-size: 9px;
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: rgba(0, 0, 0, 0.4);
      }
    `}</style>
  </>
);

export default VoiceComponentsClip;
