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
  /** Optional trailing text shown only on desktop (>768px). Stays in
   *  the DOM so assistive tech reads the full headline; hidden via
   *  CSS on mobile for space. */
  headlineSuffix?: string;
}

export const DemoIntroCard: React.FC<DemoIntroCardProps> = ({ headline, headlineSuffix }) => (
  <div className={styles.demoIntroCard}>
    <div className={styles.demoHeadline}>
      <span className={`${styles.OpenRunde600_16} ${styles.demoHeadlineText}`}>
        {headline}
        {headlineSuffix && (
          <span className={styles.demoHeadlineSuffix}>{headlineSuffix}</span>
        )}
      </span>
    </div>
  </div>
);
