import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ButtonProps {
  onClick?: () => void;
  label?: string;
}

export const TryDemoButton: React.FC<ButtonProps> = ({ onClick, label = 'Try Demo' }) => (
  <button className={`try-demo-btn ${styles.OpenRunde500_16}`} onClick={onClick}>
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M6.5 4.5L15.5 10L6.5 15.5V4.5Z" fill="white" />
    </svg>
    {label}

    <style jsx>{`
      .try-demo-btn {
        display: flex;
        height: 44px;
        padding: 0 16px;
        justify-content: center;
        align-items: center;
        gap: 6px;
        border: none;
        border-radius: 23.158px;
        background: #1C1917;
        color: #FFF;
        cursor: pointer;
        transition: opacity 0.2s ease;
      }
      .try-demo-btn:hover {
        opacity: 0.85;
      }
      .try-demo-btn:active {
        opacity: 0.7;
      }
    `}</style>
  </button>
);

export const ViewCaseStudyButton: React.FC<ButtonProps> = ({ onClick }) => (
  <button className={`view-case-study-btn ${styles.OpenRunde500_16}`} onClick={onClick}>
    View Case Study

    <style jsx>{`
      .view-case-study-btn {
        display: flex;
        height: 44px;
        padding: 0 16px;
        justify-content: center;
        align-items: center;
        gap: 6px;
        border: none;
        border-radius: 23.158px;
        background: #F5F5F4;
        color: #1C1917;
        cursor: pointer;
        transition: opacity 0.2s ease;
      }
      .view-case-study-btn:hover {
        opacity: 0.85;
      }
      .view-case-study-btn:active {
        opacity: 0.7;
      }
    `}</style>
  </button>
);
