import React from 'react';
import styles from '../styles/madeforhumans.module.css';
import { ILLUSTRATIONS } from '../data/illustrations';

const MadeForHumansLayout: React.FC = () => {
  return (
    <div className={`${styles.container} ${styles.pageContainer}`}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Made for Humans</h1>
          <p className={styles.subtitle}>
            An illustration series explaining AI concepts to everyday people
          </p>
        </div>

        {/* Illustrations */}
        {ILLUSTRATIONS.map((illust) => (
          <div key={illust.id} className={styles.illustrationSection}>
            <h2 className={styles.illustrationTitle}>{illust.title}</h2>
            <img
              src={illust.main}
              alt={illust.title}
              className={styles.illustrationImage}
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MadeForHumansLayout;
