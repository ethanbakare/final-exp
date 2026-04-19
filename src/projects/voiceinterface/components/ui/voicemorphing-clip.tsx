import React from 'react';
import {
  ClipRecordRedBtn,
  ClipRecordActiveBtn,
  ClipProcessingDarkBtn,
  ClipCloseBtn,
  ClipClearBtn,
} from './voicebuttons-clip';

export type ClipRecordMorphState = 'idle' | 'rec' | 'proc';
export type ClipLeftMorphState = 'idle' | 'rec' | 'proc' | 'complete';

interface Props {
  state: ClipRecordMorphState;
  onClick?: () => void;
  /** Programmatic press trigger. Set true briefly to replay the
   *  scale-down feedback when the state change originates from
   *  somewhere other than a direct press on this element (e.g. a
   *  toggle button outside it). */
  isPressed?: boolean;
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
export const ClipRecordMorph: React.FC<Props> = ({ state, onClick, isPressed, className = '' }) => (
  <>
    <div
      className={`clip-record-morph ${isPressed ? 'is-pressed' : ''} ${className}`}
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
      /* Easing curves (per Emil's design-eng skill): built-in easings are
         too weak; these custom bezier curves have more intentional punch. */
      .clip-record-morph {
        position: relative;
        width: 34px;
        height: 34px;
        cursor: pointer;
        /* Press feedback — :active only fires on real mousedown/touchdown,
           so programmatic state changes (e.g. proc → idle on completion)
           don't trigger a scale, only real user presses do. */
        transition: transform 140ms cubic-bezier(0.23, 1, 0.32, 1);
      }
      /* Both real presses (:active) and programmatic presses
         (.is-pressed, set briefly when state is changed from a
         toggle outside the morph) apply the same scale so the
         feedback reads the same regardless of origin. */
      .clip-record-morph:active,
      .clip-record-morph.is-pressed {
        transform: scale(0.97);
      }
      /* Layers sit on top of each other; only the active one shows.
         Blur during crossfade (per Emil) masks the "two distinct objects
         overlapping" artifact you get from plain opacity fades — each
         layer blurs out while fading, the incoming blurs in while fading,
         so mid-transition you read a single blended element instead of
         two swapping ones. */
      .layer {
        position: absolute;
        inset: 0;
        opacity: 0;
        filter: blur(2px);
        pointer-events: none;
        transition:
          opacity 200ms cubic-bezier(0.77, 0, 0.175, 1),
          filter 200ms cubic-bezier(0.77, 0, 0.175, 1);
      }
      .layer.active {
        opacity: 1;
        filter: blur(0);
      }
      /* Inner buttons shouldn't receive their own clicks — the outer
         wrapper handles the whole tap. */
      .clip-record-morph :global(button) {
        pointer-events: none;
      }
    `}</style>
  </>
);

interface LeftProps {
  state: ClipLeftMorphState;
  onClick?: () => void;
  isPressed?: boolean;
  className?: string;
}

/**
 * ClipLeftSlotMorph — 4-state morph for the LEFT slot of the dark clip card.
 *
 *   idle     → (nothing, empty slot)
 *   rec      → ClipCloseBtn (X)
 *   proc     → ClipCloseBtn (same visual as rec — state progresses invisibly)
 *   complete → ClipClearBtn (trash)
 *
 * Two real button layers (close + clear) cross-fade via opacity + blur.
 * When state is 'idle' neither is active — both fade out, leaving nothing.
 * Same Emil-based animation primitives as ClipRecordMorph (scale 0.97 on
 * press, blur 2px crossfade, cubic-bezier(0.77, 0, 0.175, 1) over 200ms).
 */
export const ClipLeftSlotMorph: React.FC<LeftProps> = ({ state, onClick, isPressed, className = '' }) => {
  const showClose = state === 'rec' || state === 'proc';
  const showClear = state === 'complete';
  return (
    <>
      <div
        className={`clip-left-morph ${isPressed ? 'is-pressed' : ''} ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        <div className={`layer ${showClose ? 'active' : ''}`}>
          <ClipCloseBtn />
        </div>
        <div className={`layer ${showClear ? 'active' : ''}`}>
          <ClipClearBtn />
        </div>
      </div>
      <style jsx>{`
        .clip-left-morph {
          position: relative;
          width: 34px;
          height: 34px;
          cursor: pointer;
          transition: transform 140ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .clip-left-morph:active,
        .clip-left-morph.is-pressed {
          transform: scale(0.97);
        }
        .layer {
          position: absolute;
          inset: 0;
          opacity: 0;
          filter: blur(2px);
          pointer-events: none;
          transition:
            opacity 200ms cubic-bezier(0.77, 0, 0.175, 1),
            filter 200ms cubic-bezier(0.77, 0, 0.175, 1);
        }
        .layer.active {
          opacity: 1;
          filter: blur(0);
        }
        .clip-left-morph :global(button) {
          pointer-events: none;
        }
      `}</style>
    </>
  );
};
