/**
 * ShowcaseButtonsSmall — mobile-scaled duplicates of ShowcaseButtons,
 * every dimension baked in at ~0.8x of the originals.
 *
 * TryDemoButtonSmall animates its label between states (Try Demo ⇄
 * Play Simulation) with a crossfade + slight Y translate + a subtle
 * blur (per Emil design-eng skill: blur masks imperfect crossfades by
 * blending two distinct objects into one perceived transformation).
 *
 * Label crossfade is an absolute stack (not AnimatePresence popLayout)
 * so the outgoing doesn't end up orphaned at its old coordinates while
 * the button's width animates. The width is driven by a hidden "ghost"
 * span of the current label inside the relative wrapper — it takes up
 * the exact width the incoming label needs, and the button's layout
 * prop animates the button size to match.
 *
 * Styles live in showcase.module.css (CSS module), not styled-jsx.
 * Reason: motion.button strips styled-jsx's injected scope class on
 * the root element, so a `<style jsx>` selector on the root matches
 * nothing. CSS module classes are unaffected.
 */
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ButtonProps {
  onClick?: () => void;
  label?: string;
}

// Emil-style timing: ease-out curve, fast enough to feel instant
// (180ms) but long enough for the eye to register the transformation.
const LABEL_TRANSITION = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export const TryDemoButtonSmall: React.FC<ButtonProps> = ({ onClick, label = 'Try Demo' }) => (
  <motion.button
    layout
    transition={LABEL_TRANSITION}
    className={`${styles.tryDemoBtnSmall} ${styles.OpenRunde500_12}`}
    onClick={onClick}
  >
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M6.5 4.5L15.5 10L6.5 15.5V4.5Z" fill="white" />
    </svg>
    <span className={styles.labelStack}>
      {/* Ghost: drives the width the absolute labels crossfade into.
          Visible-invisible (opacity 0) so screen readers skip it; the
          real label below is read aloud. aria-hidden defensive. */}
      <span className={styles.labelGhost} aria-hidden="true">{label}</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={label}
          className={styles.labelFloat}
          initial={{ opacity: 0, y: 3, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -3, filter: 'blur(2px)' }}
          transition={LABEL_TRANSITION}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </span>
  </motion.button>
);

export const ViewCaseStudyButtonSmall: React.FC<ButtonProps> = ({ onClick }) => (
  <button className={`${styles.viewCaseStudyBtnSmall} ${styles.OpenRunde500_12}`} onClick={onClick}>
    View Case Study
  </button>
);
