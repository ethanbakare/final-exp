/**
 * ShowcaseButtonsSmall — mobile-scaled duplicates of ShowcaseButtons,
 * every dimension baked in at ~0.8x of the originals (no transform:
 * scale, so layout space is actually reduced).
 *
 * Original: height 44, padding 0 16, gap 6, radius 23.158, icon 20,
 *           font 16 (OpenRunde500_16).
 * Small:    height 35, padding 0 13, gap 5, radius 18.5,  icon 16,
 *           font 12 (OpenRunde500_12 — closest existing class).
 *
 * TryDemoButtonSmall animates its label between states (Try Demo ⇄
 * Play Simulation) with a crossfade + slight Y translate and width
 * that interpolates between the two label widths (layout animation).
 * Per the Emil design-eng skill: nothing appears from nothing, and
 * width changes should be animated rather than snapped.
 */
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ButtonProps {
  onClick?: () => void;
  label?: string;
}

// Shared timing: Emil-recommended ease-out for exits. Short enough to
// feel instant (180ms) but long enough to register as an animation.
const LABEL_TRANSITION = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const TryDemoButtonSmall: React.FC<ButtonProps> = ({ onClick, label = 'Try Demo' }) => (
  <motion.button
    layout
    transition={LABEL_TRANSITION}
    className={`try-demo-btn-small ${styles.OpenRunde500_12}`}
    onClick={onClick}
  >
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M6.5 4.5L15.5 10L6.5 15.5V4.5Z" fill="white" />
    </svg>
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={label}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={LABEL_TRANSITION}
        className="label"
      >
        {label}
      </motion.span>
    </AnimatePresence>

    <style jsx>{`
      .try-demo-btn-small {
        display: flex;
        height: 35px;
        padding: 0 13px;
        justify-content: center;
        align-items: center;
        gap: 5px;
        border: none;
        border-radius: 18.5px;
        background: #1C1917;
        color: #FFF;
        cursor: pointer;
        /* Only opacity + transform — not 'all' — per Emil.
           Width is animated by framer-motion (layout prop). */
        transition:
          opacity 0.2s ease,
          transform 0.15s cubic-bezier(0.22, 1, 0.36, 1);
        /* Prevent text wrapping during the width interpolation. */
        white-space: nowrap;
      }
      .try-demo-btn-small:hover {
        opacity: 0.85;
      }
      /* Responsive press feedback — real mousedown/touchdown only. */
      .try-demo-btn-small:active {
        transform: scale(0.97);
        opacity: 0.7;
      }
      .try-demo-btn-small :global(.label) {
        display: inline-block;
      }
    `}</style>
  </motion.button>
);

export const ViewCaseStudyButtonSmall: React.FC<ButtonProps> = ({ onClick }) => (
  <button className={`view-case-study-btn-small ${styles.OpenRunde500_12}`} onClick={onClick}>
    View Case Study

    <style jsx>{`
      .view-case-study-btn-small {
        display: flex;
        height: 35px;
        padding: 0 13px;
        justify-content: center;
        align-items: center;
        gap: 5px;
        border: none;
        border-radius: 18.5px;
        background: #F5F5F4;
        color: #1C1917;
        cursor: pointer;
        transition:
          opacity 0.2s ease,
          transform 0.15s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .view-case-study-btn-small:hover {
        opacity: 0.85;
      }
      .view-case-study-btn-small:active {
        transform: scale(0.97);
        opacity: 0.7;
      }
    `}</style>
  </button>
);
