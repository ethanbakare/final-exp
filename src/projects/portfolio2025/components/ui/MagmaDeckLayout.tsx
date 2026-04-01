import React from 'react';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

interface MagmaDeckImage {
  src: string;
  alt: string;
}

interface MagmaDeckLayoutProps {
  images: {
    section01: MagmaDeckImage;
    section02: MagmaDeckImage[];
    section03: MagmaDeckImage[];
    section04: MagmaDeckImage[];
  };
}

/**
 * MagmaDeck Layout Component
 * Displays 11 magmadeck images in grouped sections:
 * - Section 01: Single edge-to-edge image
 * - Section 02: Four images (02v1 to 02v4)
 * - Section 03: Four images (03v1 to 03v4)
 * - Section 04: Two images (04v1 to 04v2)
 */
export const MagmaDeckLayout: React.FC<MagmaDeckLayoutProps> = ({ images }) => {
  return (
    <div className={styles['magmadeck-container']}>
      {/* Section 01 - First image (edge-to-edge) */}
      <section className={styles['magmadeck-section-01']}>
        <img src={images.section01.src} alt={images.section01.alt} />
      </section>

      {/* Section 02 - Four images (02v1 to 02v4) */}
      <section className={styles['magmadeck-section-02']}>
        {images.section02.map((image, index) => (
          <img key={`section02-${index}`} src={image.src} alt={image.alt} />
        ))}
      </section>

      {/* Section 03 - Four images (03v1 to 03v4) */}
      <section className={styles['magmadeck-section-03']}>
        {images.section03.map((image, index) => (
          <img key={`section03-${index}`} src={image.src} alt={image.alt} />
        ))}
      </section>

      {/* Section 04 - Two images (04v1 to 04v2) */}
      <section className={styles['magmadeck-section-04']}>
        {images.section04.map((image, index) => (
          <img key={`section04-${index}`} src={image.src} alt={image.alt} />
        ))}
      </section>
    </div>
  );
};
