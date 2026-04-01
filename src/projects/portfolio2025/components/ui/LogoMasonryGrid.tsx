import React from 'react';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

interface LogoItem {
  src: string;
  alt: string;
}

interface LogoOffsetGridProps {
  items: LogoItem[];
}

/**
 * Logo Offset Grid - 2-column grid with right column offset downward
 * Splits items evenly between left and right columns
 * Left column starts from top, right column is pushed down for staggered effect
 */
export const LogoOffsetGrid: React.FC<LogoOffsetGridProps> = ({ items }) => {
  // Split items into left and right columns (even indices left, odd indices right)
  const leftColumnItems = items.filter((_, index) => index % 2 === 0);
  const rightColumnItems = items.filter((_, index) => index % 2 === 1);

  return (
    <div className={styles['logo-offset-grid']}>
      {/* Left Column */}
      <div className={styles['logo-column-left']}>
        {leftColumnItems.map((item, index) => (
          <div key={`left-${index}`} className={styles['logo-item']}>
            <img src={item.src} alt={item.alt} />
          </div>
        ))}
      </div>

      {/* Right Column - Offset */}
      <div className={styles['logo-column-right']}>
        {rightColumnItems.map((item, index) => (
          <div key={`right-${index}`} className={styles['logo-item']}>
            <img src={item.src} alt={item.alt} />
          </div>
        ))}
      </div>
    </div>
  );
};
