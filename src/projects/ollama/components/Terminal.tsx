import React from 'react';
import styles from '@/projects/ollama/styles/ollama.module.css';

/**
 * Terminal Component
 * A macOS-style terminal window with traffic light controls
 * and a gradient shadow that fades into the dark background.
 */
export const Terminal: React.FC = () => {
  return (
    <div className={styles['terminal']}>
      <div className={styles['terminal-window']}>
        <div className={styles['terminal-control']}>
          <span className={`${styles['terminal-dot']} ${styles['terminal-dot-close']}`} />
          <span className={`${styles['terminal-dot']} ${styles['terminal-dot-minimize']}`} />
          <span className={`${styles['terminal-dot']} ${styles['terminal-dot-maximize']}`} />
        </div>
      </div>
      <div className={styles['terminal-shadow']} />
    </div>
  );
};
