/**
 * ShowcaseButtonsSmall — mobile-scaled duplicates of ShowcaseButtons,
 * every dimension baked in at ~0.8x of the originals (no transform:
 * scale, so layout space is actually reduced).
 *
 * Original: height 44, padding 0 16, gap 6, radius 23.158, icon 20,
 *           font 16 (OpenRunde500_16).
 * Small:    height 35, padding 0 13, gap 5, radius 18.5,  icon 16,
 *           font 12 (OpenRunde500_12 — closest existing class).
 */
import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ButtonProps {
  onClick?: () => void;
  label?: string;
}

export const TryDemoButtonSmall: React.FC<ButtonProps> = ({ onClick, label = 'Try Demo' }) => (
  <button className={`try-demo-btn-small ${styles.OpenRunde500_12}`} onClick={onClick}>
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M6.5 4.5L15.5 10L6.5 15.5V4.5Z" fill="white" />
    </svg>
    {label}

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
        transition: opacity 0.2s ease;
      }
      .try-demo-btn-small:hover {
        opacity: 0.85;
      }
      .try-demo-btn-small:active {
        opacity: 0.7;
      }
    `}</style>
  </button>
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
        transition: opacity 0.2s ease;
      }
      .view-case-study-btn-small:hover {
        opacity: 0.85;
      }
      .view-case-study-btn-small:active {
        opacity: 0.7;
      }
    `}</style>
  </button>
);
