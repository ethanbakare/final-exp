import React from 'react';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

interface ActDeckImage {
  src: string;
  alt: string;
}

interface ActDeckLayoutProps {
  images: {
    v1: ActDeckImage;
    v2: ActDeckImage;
    v3: ActDeckImage;
    v4: ActDeckImage;
    v5: ActDeckImage;
    v6: ActDeckImage;
    v7: ActDeckImage;
    v8: ActDeckImage;
    v9: ActDeckImage;
    v10: ActDeckImage;
    v11: ActDeckImage;
  };
}

/**
 * ActDeck Layout Component
 * Displays 11 actdeck images with various section layouts and styling
 * Each section has specific padding, backgrounds, and responsive behavior
 */
export const ActDeckLayout: React.FC<ActDeckLayoutProps> = ({ images }) => {
  return (
    <div className={styles['actdeck-container']}>
      {/* V1 - First image (no padding, no background) */}
      <section className={styles['actdeck-section-v1']}>
        <img src={images.v1.src} alt={images.v1.alt} />
      </section>

      {/* Text Section (After V1) */}
      <section className={styles['actdeck-text-section']}>
        <div className={styles['actdeck-text-intro']}>
          Activeledger is an Open Source Distributed Ledger Technology{' '}
          <strong>made for enterprise and developers</strong> which provides the benefits
          of blockchain (legacy tech) and more without its limitations such as speed, high
          energy consumption
        </div>

        <div className={styles['actdeck-text-task-wrapper']}>
          <h2 className={styles['actdeck-text-task-title']}>THE TASK</h2>
          <p className={styles['actdeck-text-task-description']}>
            The brief was to create an effective presentation deck which leveraged
            activeledger's brand identity and was to be used for making pitches to
            investors.
          </p>
        </div>
      </section>

      {/* V2 - Second image (background #EDEDED, padding top) */}
      <section className={styles['actdeck-section-v2']}>
        <img src={images.v2.src} alt={images.v2.alt} />
      </section>

      {/* V3 - Third image (padding top) */}
      <section className={styles['actdeck-section-v3']}>
        <img src={images.v3.src} alt={images.v3.alt} />
      </section>

      {/* V4 - Fourth image (no padding) */}
      <section className={styles['actdeck-section-v4']}>
        <img src={images.v4.src} alt={images.v4.alt} />
      </section>

      {/* V5 - Two-column layout (typography + image) */}
      <section className={styles['actdeck-section-v5']}>
        <div className={styles['actdeck-v5-typography']}>
          <h1 className={styles['actdeck-v5-title']}>Iconography</h1>
          <p className={styles['actdeck-v5-description']}>
            Carousel of icons used within the pitch deck
          </p>
        </div>
        <div className={styles['actdeck-v5-image-wrapper']}>
          <img src={images.v5.src} alt={images.v5.alt} />
        </div>
      </section>

      {/* V6 - Sixth image (gradient background, padding top/bottom) */}
      <section className={styles['actdeck-section-v6']}>
        <img src={images.v6.src} alt={images.v6.alt} />
      </section>

      {/* V7 - Seventh image (white background, padding top/bottom) */}
      <section className={styles['actdeck-section-v7']}>
        <img src={images.v7.src} alt={images.v7.alt} />
      </section>

      {/* V8 & V9 - Container holds both images */}
      <section className={styles['actdeck-section-v8-v9']}>
        <img src={images.v8.src} alt={images.v8.alt} />
        <img src={images.v9.src} alt={images.v9.alt} />
      </section>

      {/* V10 - Tenth image (padding bottom only) */}
      <section className={styles['actdeck-section-v10']}>
        <img src={images.v10.src} alt={images.v10.alt} />
      </section>

      {/* V11 - Eleventh image (no padding) */}
      <section className={styles['actdeck-section-v11']}>
        <img src={images.v11.src} alt={images.v11.alt} />
      </section>
    </div>
  );
};
