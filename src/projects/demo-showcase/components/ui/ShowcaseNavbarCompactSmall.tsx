/**
 * ShowcaseNavbarCompactSmall — mirror of ShowcaseNavbarCompact with
 * every dimension scaled ~0.7×, and the outer wrapper stripped of
 * horizontal padding so the pill fills edge-to-edge. Intended for
 * mobile use where the desktop-sized compact pill feels oversized.
 *
 * No transform: scale() — dimensions are baked in so the layout box
 * matches the visual size (no wasted space around a scaled pill).
 */
import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ShowcaseNavbarCompactSmallProps {
  projectName: string;
  currentIndex: number;
  totalCount: number;
  onNext: () => void;
  onPrev: () => void;
}

const ArrowDownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
    <path d="M5 7L9 11L13 7" stroke="#5E5E5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ShowcaseNavbarCompactSmall: React.FC<ShowcaseNavbarCompactSmallProps> = ({
  projectName,
  currentIndex,
  totalCount,
  onNext,
  onPrev,
}) => (
  <div className="top-navbar-compact-small">
    <div className="selector-pill">
      {/* Left: counter + project name + chevron */}
      <div className="selector-left">
        <div className={`project-counter ${styles.OpenRunde500_12}`}>
          {currentIndex + 1}/{totalCount}
        </div>
        <div className="selector-label">
          <span className={`project-name ${styles.OpenRunde500_12}`}>{projectName}</span>
          <ChevronDown />
        </div>
      </div>

      {/* Right: arrows */}
      <div className="nav-arrows">
        <button className="arrow-btn" onClick={onNext} aria-label="Next project">
          <ArrowDownIcon />
        </button>
        <button className="arrow-btn" onClick={onPrev} aria-label="Previous project">
          <ArrowUpIcon />
        </button>
      </div>
    </div>

    <style jsx>{`
      .top-navbar-compact-small {
        display: flex;
        padding: 0 0 14px;
        justify-content: center;
        align-items: center;
        align-self: stretch;
      }
      .selector-pill {
        display: flex;
        width: 100%;
        padding: 6px;
        justify-content: space-between;
        align-items: center;
        border-radius: 14px;
        background: #F7F6F2;
        box-shadow: inset 0 3px 4px rgba(0, 0, 0, 0.06);
      }
      .selector-label {
        display: flex;
        padding: 4px 0;
        align-items: center;
        gap: 4px;
      }
      .project-name {
        color: #5E5E5C;
      }
      .selector-left {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .project-counter {
        display: flex;
        width: 36px;
        box-sizing: border-box;
        padding: 4px 7px;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        border-radius: 22px;
        background: rgba(50, 51, 51, 0.10);
        color: #5E5E5C;
        font-variant-numeric: tabular-nums;
      }
      .nav-arrows {
        display: flex;
        align-items: center;
        gap: 1px;
      }
      .arrow-btn {
        display: flex;
        height: 25px;
        width: 28px;
        justify-content: center;
        align-items: center;
        border: none;
        border-radius: 22px;
        background: #525252;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .arrow-btn:first-child {
        border-top-right-radius: 3px;
        border-bottom-right-radius: 3px;
      }
      .arrow-btn:last-child {
        border-top-left-radius: 3px;
        border-bottom-left-radius: 3px;
      }
      .arrow-btn:hover {
        background: #616161;
      }
      .arrow-btn:active {
        background: #444;
      }
    `}</style>
  </div>
);
