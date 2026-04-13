import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ShowcaseProgressProps {
  /** Total time the simulation takes to play through (ms), excluding pause */
  duration: number;
  /** Incremented each time the loop restarts — remounts the fill element to restart animation */
  loopKey: number;
  /** Whether the simulation is paused (e.g. user hovering) */
  isPaused?: boolean;
}

export const ShowcaseProgress: React.FC<ShowcaseProgressProps> = ({
  duration,
  loopKey,
  isPaused = false,
}) => (
  <div className="progress-section">
    <div className="progress-bar">
      <div className="progress-track">
        <div
          key={loopKey}
          className={`progress-fill ${isPaused ? 'paused' : ''}`}
          style={{ animationDuration: `${duration}ms` }}
        />
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
        width: 0%;
        border-radius: 121px;
        background: rgba(38, 37, 36, 0.50);
        animation: sim-fill linear 1 forwards;
        animation-play-state: running;
      }
      .progress-fill.paused {
        animation-play-state: paused;
      }
      @keyframes sim-fill {
        from { width: 0%; }
        to { width: 100%; }
      }
      .progress-caption {
        color: rgba(28, 25, 23, 0.50);
        text-align: center;
      }
    `}</style>
  </div>
);
