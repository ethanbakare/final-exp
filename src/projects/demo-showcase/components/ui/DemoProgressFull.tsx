/**
 * DemoProgressFull — edge-to-edge progress section with a soft
 * vertical wash behind it. The wash is the component's own
 * background; its hue is driven by the `hue` prop, with
 * saturation + brightness held constant via the CSS rule
 * `hsla(var(--fade-hue), 2%, 96%, α)`. Each variation (warm brown,
 * lavender, warm pink) passes in its own hue.
 *
 * Figma: progress-section (3077:672) — mobile variant.
 */
import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface DemoProgressFullProps {
  duration: number;
  loopKey: number;
  caption?: string;
  hue?: number;
  isPaused?: boolean;
}

type FadeStyle = React.CSSProperties & { ['--fade-hue']?: number | string };

const DEFAULT_CAPTION = 'playing simulation, click try demo to start';

export const DemoProgressFull: React.FC<DemoProgressFullProps> = ({
  duration,
  loopKey,
  caption = DEFAULT_CAPTION,
  hue,
  isPaused = false,
}) => {
  const style: FadeStyle = {};
  if (hue != null) style['--fade-hue'] = hue;

  return (
    <div className={styles.progressFull} style={style}>
      <span className={`${styles.OpenRunde500_12} ${styles.progressCaption}`}>
        {caption}
      </span>
      <div className={styles.progressFullBar}>
        <div className={styles.progressFullTrack}>
          <div
            key={loopKey}
            className={`${styles.progressFullThumb} ${isPaused ? styles.progressFullThumbPaused : ''}`}
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </div>
  );
};
