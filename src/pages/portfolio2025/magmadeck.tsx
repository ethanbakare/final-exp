import React from 'react';
import { MagmaDeckLayout } from '@/projects/portfolio2025/components/ui/MagmaDeckLayout';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

/**
 * MagmaDeck Portfolio Page
 * Displays 11 MagmaDeck images grouped into sections:
 * - Section 01: Single image
 * - Section 02: 4 images (02v1 to 02v4)
 * - Section 03: 4 images (03v1 to 03v4)
 * - Section 04: 2 images (04v1 to 04v2)
 */
export default function MagmaDeckPage() {
  const magmadeckImages = {
    section01: {
      src: '/images/portfolio2025/magma_deck/01_magma.webp',
      alt: 'MagmaDeck Slide 01',
    },
    section02: [
      { src: '/images/portfolio2025/magma_deck/02v1_magma.webp', alt: 'MagmaDeck Slide 02v1' },
      { src: '/images/portfolio2025/magma_deck/02v2_magma.webp', alt: 'MagmaDeck Slide 02v2' },
      { src: '/images/portfolio2025/magma_deck/02v3_magma.webp', alt: 'MagmaDeck Slide 02v3' },
      { src: '/images/portfolio2025/magma_deck/02v4_magma.webp', alt: 'MagmaDeck Slide 02v4' },
    ],
    section03: [
      { src: '/images/portfolio2025/magma_deck/03v1_magma.webp', alt: 'MagmaDeck Slide 03v1' },
      { src: '/images/portfolio2025/magma_deck/03v2_magma.webp', alt: 'MagmaDeck Slide 03v2' },
      { src: '/images/portfolio2025/magma_deck/03v3_magma.webp', alt: 'MagmaDeck Slide 03v3' },
      { src: '/images/portfolio2025/magma_deck/03v4_magma.webp', alt: 'MagmaDeck Slide 03v4' },
    ],
    section04: [
      { src: '/images/portfolio2025/magma_deck/04v1_magma.webp', alt: 'MagmaDeck Slide 04v1' },
      { src: '/images/portfolio2025/magma_deck/04v2_magma.webp', alt: 'MagmaDeck Slide 04v2' },
    ],
  };

  return (
    <>
      <div className={styles['magmadeck-page-wrapper']}>
        <MagmaDeckLayout images={magmadeckImages} />
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
      `}</style>
    </>
  );
}
