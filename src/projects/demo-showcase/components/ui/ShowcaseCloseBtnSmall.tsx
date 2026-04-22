/**
 * ShowcaseCloseBtnSmall — mobile-only close affordance that appears
 * to the left of the navbar pill when the lab enters demo mode.
 *
 * 35px tall (matches .top-navbar-compact-small pill height), 56px
 * wide (~1.6x height — wider than tall per the "a bit fat" spec).
 * Dark #1C1917 bg to match TryDemoButtonSmall.
 *
 * The component itself renders at its natural 56px width. The LAB
 * controls appearance via a wrapper slot whose width animates from
 * 0 -> 56px so the sibling pill shrinks on a flex recompute each
 * frame — no explicit calc() math.
 */
import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ShowcaseCloseBtnSmallProps {
  onClick?: () => void;
}

export const ShowcaseCloseBtnSmall: React.FC<ShowcaseCloseBtnSmallProps> = ({ onClick }) => (
  <button
    type="button"
    aria-label="Close demo"
    className={styles.closeBtnSmall}
    onClick={onClick}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 18L6 6M18 6L6 18"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);
