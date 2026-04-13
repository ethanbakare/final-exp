import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ShowcaseNavbarProps {
  projectName: string;
  currentIndex: number;
  totalCount: number;
  onNext: () => void;
  onPrev: () => void;
}

const ArrowDownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 19V5M12 5L5 12M12 5L19 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M5 7L9 11L13 7" stroke="#5E5E5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ShowcaseNavbar: React.FC<ShowcaseNavbarProps> = ({
  projectName,
  currentIndex,
  totalCount,
  onNext,
  onPrev,
}) => (
  <div className="top-navbar">
    <div className="navbar-content">
      <div className="project-selector">
        <div className="selector-label">
          <span className={`project-name ${styles.OpenRunde600_16}`}>{projectName}</span>
          <ChevronDown />
        </div>
        <div className={`project-counter ${styles.OpenRunde600_16}`}>
          {currentIndex + 1}/{totalCount}
        </div>
      </div>

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
      .top-navbar {
        display: flex;
        padding: 40px 0;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        align-self: stretch;
      }
      .navbar-content {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
      }
      .project-selector {
        display: flex;
        width: 668px;
        padding: 8px 16px;
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
        gap: 6px;
      }
      .arrow-btn {
        display: flex;
        height: 48px;
        width: 56px;
        padding: 12px 16px;
        justify-content: center;
        align-items: center;
        border: none;
        border-radius: 32px;
        background: #525252;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .arrow-btn:hover {
        background: #616161;
      }
      .arrow-btn:active {
        background: #444;
      }
      @media (max-width: 768px) {
        .project-selector {
          width: auto;
          flex: 1;
        }
        .navbar-content {
          width: 100%;
          padding: 0 16px;
        }
      }
    `}</style>
  </div>
);
