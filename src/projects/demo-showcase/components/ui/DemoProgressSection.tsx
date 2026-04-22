/**
 * DemoProgressSection — caption + playhead pill that sits at the
 * bottom of a DemoCanvas. The thumb fills from 0 → 100% over
 * `duration` ms; `loopKey` restarts the animation when bumped.
 *
 * Figma: progress-section (3077:458). Children order from Figma:
 * caption first (top), bar second (bottom).
 */
import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface DemoProgressSectionProps {
  duration: number;
  loopKey: number;
  caption?: string;
  isPaused?: boolean;
}

const DEFAULT_CAPTION = 'playing simulation, click try demo to start';

export const DemoProgressSection: React.FC<DemoProgressSectionProps> = ({
  duration,
  loopKey,
  caption = DEFAULT_CAPTION,
  isPaused = false,
}) => (
  <div className={styles.progressSection}>
    <span className={`${styles.OpenRunde500_12} ${styles.progressCaption}`}>
      {caption}
    </span>
    <div className={styles.progressBar}>
      <div className={styles.progressTrack}>
        <div
          key={loopKey}
          className={`${styles.progressThumb} ${isPaused ? styles.progressThumbPaused : ''}`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  </div>
);
