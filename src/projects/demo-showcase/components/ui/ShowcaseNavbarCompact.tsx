/**
 * ShowcaseNavbarCompact — arrows inside the selector pill.
 * Saves vertical space by combining everything into one bar.
 * The original ShowcaseNavbar (with external dark arrow buttons) is preserved.
 */
import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ShowcaseNavbarCompactProps {
  projectName: string;
  currentIndex: number;
  totalCount: number;
  onNext: () => void;
  onPrev: () => void;
}

const ArrowDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M5 7L9 11L13 7" stroke="#5E5E5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ShowcaseNavbarCompact: React.FC<ShowcaseNavbarCompactProps> = ({
  projectName,
  currentIndex,
  totalCount,
  onNext,
  onPrev,
}) => (
  <div className="top-navbar-compact">
    <div className="selector-pill">
      {/* Left: counter + project name + chevron */}
      <div className="selector-left">
        <div className={`project-counter ${styles.OpenRunde600_16}`}>
          {currentIndex + 1}/{totalCount}
        </div>
        <div className="selector-label">
          <span className={`project-name ${styles.OpenRunde600_16}`}>{projectName}</span>
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
      .top-navbar-compact {
        display: flex;
        padding: 20px 16px;
        justify-content: center;
        align-items: center;
        align-self: stretch;
      }
      .selector-pill {
        display: flex;
        width: 100%;
        max-width: 668px;
        padding: 8px 8px 8px 16px;
        justify-content: space-between;
        align-items: center;
        border-radius: 20px;
        background: #F7F6F2;
        box-shadow: inset 0 4px 6px rgba(0, 0, 0, 0.04);
      }
      .selector-label {
        display: flex;
        padding: 6px 0;
        align-items: center;
        gap: 6px;
      }
      .project-name {
        color: #5E5E5C;
      }
      .selector-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .project-counter {
        display: flex;
        padding: 6px 10px;
        justify-content: center;
        align-items: center;
        border-radius: 32px;
        background: rgba(50, 51, 51, 0.10);
        color: #5E5E5C;
      }
      .nav-arrows {
        display: flex;
        align-items: center;
        gap: 2px;
      }
      .arrow-btn {
        display: flex;
        height: 35px;
        width: 40px;
        justify-content: center;
        align-items: center;
        border: none;
        border-radius: 32px;
        background: #525252;
        cursor: pointer;
        transition: background 0.15s ease;
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
