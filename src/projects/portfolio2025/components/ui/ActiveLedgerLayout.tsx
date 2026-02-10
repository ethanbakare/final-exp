import React from 'react';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

interface ActiveLedgerImage {
  src: string;
  alt: string;
}

interface ActiveLedgerLayoutProps {
  images: {
    section01: ActiveLedgerImage;
    section02: ActiveLedgerImage;
    section03: ActiveLedgerImage;
    section04: ActiveLedgerImage;
    section05: ActiveLedgerImage;
    section06: ActiveLedgerImage;
    section07: ActiveLedgerImage;
    section08: ActiveLedgerImage;
    section09: ActiveLedgerImage;
    section10: ActiveLedgerImage;
    section11: ActiveLedgerImage;
    section12: ActiveLedgerImage;
    section13: ActiveLedgerImage;
    section14: ActiveLedgerImage;
    section15: ActiveLedgerImage;
    section16: ActiveLedgerImage;
    section17: ActiveLedgerImage;
  };
}

/**
 * ActiveLedger Layout Component
 * Displays 17 sections for the ActiveLedger portfolio project
 */
export const ActiveLedgerLayout: React.FC<ActiveLedgerLayoutProps> = ({ images }) => {
  return (
    <div className={styles['activeledger-container']}>
      {/* Section 01 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section01.src} alt={images.section01.alt} />
      </section>

      {/* Section 02 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section02.src} alt={images.section02.alt} />
      </section>

      {/* Section 03 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section03.src} alt={images.section03.alt} />
      </section>

      {/* Section 04 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section04.src} alt={images.section04.alt} />
      </section>

      {/* Section 05 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section05.src} alt={images.section05.alt} />
      </section>

      {/* Section 06 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section06.src} alt={images.section06.alt} />
      </section>

      {/* Section 07 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section07.src} alt={images.section07.alt} />
      </section>

      {/* Section 08 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section08.src} alt={images.section08.alt} />
      </section>

      {/* Section 09 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section09.src} alt={images.section09.alt} />
      </section>

      {/* Section 10 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section10.src} alt={images.section10.alt} />
      </section>

      {/* Section 11 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section11.src} alt={images.section11.alt} />
      </section>

      {/* Section 12 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section12.src} alt={images.section12.alt} />
      </section>

      {/* Section 13 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section13.src} alt={images.section13.alt} />
      </section>

      {/* Section 14 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section14.src} alt={images.section14.alt} />
      </section>

      {/* Section 15 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section15.src} alt={images.section15.alt} />
      </section>

      {/* Section 16 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section16.src} alt={images.section16.alt} />
      </section>

      {/* Section 17 */}
      <section className={styles['activeledger-section']}>
        <img src={images.section17.src} alt={images.section17.alt} />
      </section>
    </div>
  );
};
