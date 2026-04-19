import React from 'react';
import {
  ClipRecordRedBtn,
  ClipRecordActiveBtn,
  ClipProcessingDarkBtn,
} from './voicebuttons-clip';

export type ClipRecordMorphState = 'idle' | 'rec' | 'proc';

interface Props {
  state: ClipRecordMorphState;
  onClick?: () => void;
  className?: string;
}

/**
 * ClipRecordMorph — 3-state record button morph for the dark clip card.
 *
 *   idle  → ClipRecordRedBtn     (red mic, red-tint pill)
 *   rec   → ClipRecordActiveBtn  (white pill, red dot)
 *   proc  → ClipProcessingDarkBtn (dark pill, red spinner spinning)
 *
 * All three buttons are layered at the same 34×34 position; only the
 * active one is visible via opacity cross-fade. Because every state
 * is already a 34×34 circle, there's no shape tween — just an
 * icon/bg swap that reads as a smooth state change.
 *
 * Click is routed through the outer wrapper so the caller controls
 * transitions (e.g. idle → rec on click, rec → proc on click).
 */
export const ClipRecordMorph: React.FC<Props> = ({ state, onClick, className = '' }) => (
  <>
    <div
      className={`clip-record-morph ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className={`layer ${state === 'idle' ? 'active' : ''}`}>
        <ClipRecordRedBtn />
      </div>
      <div className={`layer ${state === 'rec' ? 'active' : ''}`}>
        <ClipRecordActiveBtn />
      </div>
      <div className={`layer ${state === 'proc' ? 'active' : ''}`}>
        <ClipProcessingDarkBtn />
      </div>
    </div>
    <style jsx>{`
      .clip-record-morph {
        position: relative;
        width: 34px;
        height: 34px;
        cursor: pointer;
      }
      /* Layers sit on top of each other; only the active one shows. */
      .layer {
        position: absolute;
        inset: 0;
        opacity: 0;
        pointer-events: none;
        transition: opacity 200ms ease-in-out;
      }
      .layer.active {
        opacity: 1;
      }
      /* Inner buttons shouldn't receive their own clicks — the outer
         wrapper handles the whole tap. */
      .clip-record-morph :global(button) {
        pointer-events: none;
      }
    `}</style>
  </>
);
