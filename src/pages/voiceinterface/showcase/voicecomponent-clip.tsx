import React, { useState } from 'react';
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
import {
  ClipRecordMorph,
  ClipRecordMorphState,
} from '@/projects/voiceinterface/components/ui/voicemorphing-clip';
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

/**
 * MorphCell — showcase cell with internal IDLE/REC/PROC toggle that
 * drives a child render function. Mirrors the toggle pattern used in
 * the existing voicecomponent.tsx morph section.
 */
const MorphCell: React.FC<{
  label: string;
  render: (state: ClipRecordMorphState, setState: (s: ClipRecordMorphState) => void) => React.ReactNode;
}> = ({ label, render }) => {
  const [state, setState] = useState<ClipRecordMorphState>('idle');
  return (
    <>
      <div className="cell">
        <div className="toggle">
          <button
            className={`toggle-btn first ${state === 'idle' ? 'active' : ''}`}
            onClick={() => setState('idle')}
          >
            IDLE
          </button>
          <button
            className={`toggle-btn ${state === 'rec' ? 'active' : ''}`}
            onClick={() => setState('rec')}
          >
            REC
          </button>
          <button
            className={`toggle-btn last ${state === 'proc' ? 'active' : ''}`}
            onClick={() => setState('proc')}
          >
            PROC
          </button>
        </div>
        <div className="center">{render(state, setState)}</div>
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
        .toggle {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0;
        }
        .toggle-btn {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.7);
          background: rgba(255, 255, 255, 0.05);
          border: none;
          padding: 4px 8px;
          cursor: pointer;
          transition: background 150ms ease;
        }
        .toggle-btn.first {
          border-radius: 8px 0 0 8px;
        }
        .toggle-btn.last {
          border-radius: 0 8px 8px 0;
        }
        .toggle-btn.active {
          background: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 1);
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
};

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

      {/* Morph cells — Cell A: button-only morph. Cell B (timer + button) coming next. */}
      <div className="morph-grid">
        <MorphCell
          label="Record Morph — Idle / Rec / Proc (click to cycle)"
          render={(s, set) => (
            <ClipRecordMorph
              state={s}
              onClick={() => {
                // Cycle idle -> rec -> proc -> idle so you can press the
                // morph itself and feel the :active scale(0.97) feedback.
                const next: Record<ClipRecordMorphState, ClipRecordMorphState> = {
                  idle: 'rec',
                  rec: 'proc',
                  proc: 'idle',
                };
                set(next[s]);
              }}
            />
          )}
        />
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
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 40px;
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
      .morph-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, 200px);
        justify-content: center;
        gap: 0;
        border: 0.8px solid rgba(255, 255, 255, 0.06);
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
