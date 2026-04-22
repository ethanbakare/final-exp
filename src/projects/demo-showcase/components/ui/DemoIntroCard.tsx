/**
 * DemoIntroCard — pill card that sits at the top of a DemoCanvas
 * and announces the project headline.
 *
 * Figma: demo-intro (3077:411).
 */
import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface DemoIntroCardProps {
  headline: string;
}

export const DemoIntroCard: React.FC<DemoIntroCardProps> = ({ headline }) => (
  <div className={styles.demoIntroCard}>
    <div className={styles.demoHeadline}>
      <span className={`${styles.OpenRunde600_16} ${styles.demoHeadlineText}`}>
        {headline}
      </span>
    </div>
  </div>
);
