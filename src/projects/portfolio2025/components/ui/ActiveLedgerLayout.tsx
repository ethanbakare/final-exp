import React from 'react';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

interface ActiveLedgerImage {
  src: string;
  alt: string;
}

interface ActiveLedgerLayoutProps {
  images: {
    section01: ActiveLedgerImage[];
    section02: ActiveLedgerImage[];
    section03: ActiveLedgerImage[];
    section04: ActiveLedgerImage[];
    section05: ActiveLedgerImage[];
    section06: ActiveLedgerImage[];
    section07: ActiveLedgerImage[];
    section08: ActiveLedgerImage[];
    section09: ActiveLedgerImage[];
    section10: ActiveLedgerImage[];
    section11: ActiveLedgerImage[];
    section12: ActiveLedgerImage[];
    section13: ActiveLedgerImage[];
    section14: ActiveLedgerImage[];
    section15: ActiveLedgerImage[];
    section16: ActiveLedgerImage[];
    section17: ActiveLedgerImage[];
  };
}

/**
 * ActiveLedger Layout Component
 * Displays 17 sections for the ActiveLedger portfolio project
 * Each section contains one or more images mapped by filename prefix (01-017)
 */
export const ActiveLedgerLayout: React.FC<ActiveLedgerLayoutProps> = ({ images }) => {
  return (
    <div className={styles['activeledger-container']}>
      {/* Section 01 */}
      <section className={styles['activeledger-section']}>
        {images.section01.map((img, i) => (
          <img key={`s01-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 02 */}
      <section className={styles['activeledger-section']}>
        {images.section02.map((img, i) => (
          <img key={`s02-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 03 */}
      <section className={styles['activeledger-section']}>
        {images.section03.map((img, i) => (
          <img key={`s03-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 04 */}
      <section className={styles['activeledger-section']}>
        {images.section04.map((img, i) => (
          <img key={`s04-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 05 */}
      <section className={styles['activeledger-section']}>
        {images.section05.map((img, i) => (
          <img key={`s05-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 06 */}
      <section className={styles['activeledger-section']}>
        {images.section06.map((img, i) => (
          <img key={`s06-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 07 */}
      <section className={styles['activeledger-section']}>
        {images.section07.map((img, i) => (
          <img key={`s07-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 08 */}
      <section className={styles['activeledger-section']}>
        {images.section08.map((img, i) => (
          <img key={`s08-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 09 */}
      <section className={styles['activeledger-section']}>
        {images.section09.map((img, i) => (
          <img key={`s09-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 10 */}
      <section className={styles['activeledger-section']}>
        {images.section10.map((img, i) => (
          <img key={`s10-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 11 */}
      <section className={styles['activeledger-section']}>
        {images.section11.map((img, i) => (
          <img key={`s11-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 12 */}
      <section className={styles['activeledger-section']}>
        {images.section12.map((img, i) => (
          <img key={`s12-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 13 */}
      <section className={styles['activeledger-section']}>
        {images.section13.map((img, i) => (
          <img key={`s13-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 14 */}
      <section className={styles['activeledger-section']}>
        {images.section14.map((img, i) => (
          <img key={`s14-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 15 */}
      <section className={styles['activeledger-section']}>
        {images.section15.map((img, i) => (
          <img key={`s15-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 16 */}
      <section className={styles['activeledger-section']}>
        {images.section16.map((img, i) => (
          <img key={`s16-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 17 */}
      <section className={styles['activeledger-section']}>
        {images.section17.map((img, i) => (
          <img key={`s17-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>
    </div>
  );
};
