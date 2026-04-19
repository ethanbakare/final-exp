import React, { useState, useRef, useEffect } from 'react';
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
  ClipLeftSlotMorph,
  ClipLeftMorphState,
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
/**
 * Generic MorphCell — same primitive for 3-state and 4-state morphs.
 * `states` drives the toggle buttons. Optional `autoAdvance` simulates
 * automatic transitions (like processing completing).
 */
function MorphCell<S extends string>(props: {
  label: string;
  states: readonly S[];
  initialState: S;
  autoAdvance?: { from: S; to: S; delayMs: number };
  render: (state: S, triggerPress: (s: S) => void, isPressed: boolean) => React.ReactNode;
}) {
  const { label, states, initialState, autoAdvance, render } = props;
  const [state, setState] = useState<S>(initialState);
  const [isPressed, setIsPressed] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Same feedback whether the state change came from the morph or a toggle.
  const triggerPress = (next: S) => {
    setState(next);
    setIsPressed(true);
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setIsPressed(false), 140);
  };

  // Optional auto-transition (e.g. proc -> idle/complete after 3s).
  // Uses setState directly, not triggerPress, so no press-scale fires.
  useEffect(() => {
    if (!autoAdvance || state !== autoAdvance.from) return;
    const t = setTimeout(() => setState(autoAdvance.to), autoAdvance.delayMs);
    return () => clearTimeout(t);
  }, [state, autoAdvance]);

  return (
    <>
      <div className="cell">
        <div className="toggle">
          {states.map((s, i) => (
            <button
              key={s}
              className={`toggle-btn ${i === 0 ? 'first' : ''} ${i === states.length - 1 ? 'last' : ''} ${state === s ? 'active' : ''}`}
              onClick={() => triggerPress(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="center">{render(state, triggerPress, isPressed)}</div>
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

      {/* Morph cells
          A: right slot — red mic ↔ red dot ↔ red spinner (3 states)
          B: left slot — nothing ↔ close ↔ clear (4 states) */}
      <div className="morph-grid">
        <MorphCell<ClipRecordMorphState>
          label="Record Morph — 34px"
          states={['idle', 'rec', 'proc'] as const}
          initialState="idle"
          autoAdvance={{ from: 'proc', to: 'idle', delayMs: 3000 }}
          render={(s, triggerPress, pressed) => (
            <ClipRecordMorph
              state={s}
              isPressed={pressed}
              // Proc not clickable — it auto-advances.
              onClick={
                s === 'proc'
                  ? undefined
                  : () => triggerPress(s === 'idle' ? 'rec' : 'proc')
              }
            />
          )}
        />
        <MorphCell<ClipLeftMorphState>
          label="Left Slot Morph — 34px"
          states={['idle', 'rec', 'proc', 'complete'] as const}
          initialState="idle"
          autoAdvance={{ from: 'proc', to: 'complete', delayMs: 3000 }}
          render={(s, triggerPress, pressed) => (
            <ClipLeftSlotMorph
              state={s}
              isPressed={pressed}
              // Idle = no button shown, so no click target. Proc auto-advances
              // to complete. rec and complete are the press-driven states.
              onClick={
                s === 'idle' || s === 'proc'
                  ? undefined
                  : () => triggerPress(s === 'rec' ? 'complete' : 'idle')
              }
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
