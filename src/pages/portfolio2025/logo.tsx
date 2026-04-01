import React from 'react';
import { LogoOffsetGrid } from '@/projects/portfolio2025/components/ui/LogoMasonryGrid';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

/**
 * Logo Portfolio Page
 * Displays 20 logo variations (001v1 - 001v20) in an offset 2-column grid
 * Left column: v1, v3, v5, v7, v9, v11, v13, v15, v17, v19
 * Right column (offset): v2, v4, v6, v8, v10, v12, v14, v16, v18, v20
 */
export default function LogoPage() {
  const logos = [
    { src: '/images/portfolio2025/logo/001v1_logo.webp', alt: 'Logo Variation 1' },
    { src: '/images/portfolio2025/logo/001v2_logo.webp', alt: 'Logo Variation 2' },
    { src: '/images/portfolio2025/logo/001v3_logo.webp', alt: 'Logo Variation 3' },
    { src: '/images/portfolio2025/logo/001v4_logo.gif', alt: 'Logo Variation 4' },
    { src: '/images/portfolio2025/logo/001v5_logo.webp', alt: 'Logo Variation 5' },
    { src: '/images/portfolio2025/logo/001v6_logo.webp', alt: 'Logo Variation 6' },
    { src: '/images/portfolio2025/logo/001v7_logo.gif', alt: 'Logo Variation 7' },
    { src: '/images/portfolio2025/logo/001v8_logo.webp', alt: 'Logo Variation 8' },
    { src: '/images/portfolio2025/logo/001v9_logo.webp', alt: 'Logo Variation 9' },
    { src: '/images/portfolio2025/logo/001v10_logo.webp', alt: 'Logo Variation 10' },
    { src: '/images/portfolio2025/logo/001v11_logo.webp', alt: 'Logo Variation 11' },
    { src: '/images/portfolio2025/logo/001v12_logo.png', alt: 'Logo Variation 12' },
    { src: '/images/portfolio2025/logo/001v13_logo.gif', alt: 'Logo Variation 13' },
    { src: '/images/portfolio2025/logo/001v14_logo.webp', alt: 'Logo Variation 14' },
    { src: '/images/portfolio2025/logo/001v15_logo.webp', alt: 'Logo Variation 15' },
    { src: '/images/portfolio2025/logo/001v16_logo.gif', alt: 'Logo Variation 16' },
    { src: '/images/portfolio2025/logo/001v17_logo.webp', alt: 'Logo Variation 17' },
    { src: '/images/portfolio2025/logo/001v18_logo.webp', alt: 'Logo Variation 18' },
    { src: '/images/portfolio2025/logo/001v19_logo.webp', alt: 'Logo Variation 19' },
    { src: '/images/portfolio2025/logo/001v20_logo.webp', alt: 'Logo Variation 20' },
  ];

  return (
    <>
      <div className={styles['page-wrapper']}>
        <div className={styles.container}>
          <LogoOffsetGrid items={logos} />
        </div>
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
