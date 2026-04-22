/**
 * DemoProgressSectionTransparent — duplicate of DemoProgressSection
 * intended as the starting point for a transparent / edge-to-edge
 * variant. Uses its own `progressTransparent*` CSS classes so edits
 * stay isolated from the desktop DemoProgressSection.
 */
import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface DemoProgressSectionTransparentProps {
  duration: number;
  loopKey: number;
  caption?: string;
  isPaused?: boolean;
}

const DEFAULT_CAPTION = 'playing simulation, click try demo to start';

export const DemoProgressSectionTransparent: React.FC<DemoProgressSectionTransparentProps> = ({
  duration,
  loopKey,
  caption = DEFAULT_CAPTION,
  isPaused = false,
}) => (
  <div className={styles.progressTransparent}>
    <span className={`${styles.OpenRunde500_12} ${styles.progressTransparentCaption}`}>
      {caption}
    </span>
    <div className={styles.progressTransparentBar}>
      <div className={styles.progressTransparentTrack}>
        <div
          key={loopKey}
          className={`${styles.progressTransparentThumb} ${isPaused ? styles.progressTransparentThumbPaused : ''}`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  </div>
);
