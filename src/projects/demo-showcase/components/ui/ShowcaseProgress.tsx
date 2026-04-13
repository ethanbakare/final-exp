import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ShowcaseProgressProps {
  progress: number; // 0 to 1
}

export const ShowcaseProgress: React.FC<ShowcaseProgressProps> = ({ progress }) => (
  <div className="progress-section">
    <div className="progress-bar">
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </div>
    </div>
    <span className={`progress-caption ${styles.OpenRunde500_12}`}>
      playing simulation, click try demo to start
    </span>

    <style jsx>{`
      .progress-section {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 10px;
      }
      .progress-bar {
        display: flex;
        width: 181px;
        height: 32px;
        padding: 0 16px;
        justify-content: center;
        align-items: center;
        gap: 6px;
        border-radius: 23.158px;
        background: #F5F5F4;
      }
      .progress-track {
        display: flex;
        height: 4px;
        align-items: center;
        flex: 1;
        border-radius: 32px;
        background: rgba(38, 37, 36, 0.10);
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        border-radius: 121px 0 0 121px;
        background: rgba(38, 37, 36, 0.50);
        transition: width 0.3s linear;
      }
      .progress-caption {
        color: rgba(28, 25, 23, 0.50);
        text-align: center;
      }
    `}</style>
  </div>
);
