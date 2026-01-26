import React from 'react';
import { ActDeckLayout } from '@/projects/portfolio2025/components/ui/ActDeckLayout';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

/**
 * ActDeck Portfolio Page
 * Displays 11 ActDeck presentation images with various layouts:
 * - V1: Full-width image
 * - Text section with right-aligned typography
 * - V2-V4: Various single-image sections with different backgrounds/padding
 * - V5: Two-column layout (typography + image)
 * - V6-V7: Gradient/solid backgrounds
 * - V8-V9: Dual-image container
 * - V10-V11: Final images
 */
export default function ActDeckPage() {
  const actdeckImages = {
    v1: { src: '/images/portfolio2025/actdeck/03v1_activedeck.webp', alt: 'ActDeck Slide 1' },
    v2: { src: '/images/portfolio2025/actdeck/03v2_activedeck.gif', alt: 'ActDeck Slide 2' },
    v3: { src: '/images/portfolio2025/actdeck/03v3_activedeck.webp', alt: 'ActDeck Slide 3' },
    v4: { src: '/images/portfolio2025/actdeck/03v4_activedeck.webp', alt: 'ActDeck Slide 4' },
    v5: { src: '/images/portfolio2025/actdeck/03v5_activedeck.webp', alt: 'ActDeck Iconography' },
    v6: { src: '/images/portfolio2025/actdeck/03v6_activedeck.webp', alt: 'ActDeck Slide 6' },
    v7: { src: '/images/portfolio2025/actdeck/03v7_activedeck.gif', alt: 'ActDeck Slide 7' },
    v8: { src: '/images/portfolio2025/actdeck/03v8_activedeck.webp', alt: 'ActDeck Slide 8' },
    v9: { src: '/images/portfolio2025/actdeck/03v9_activedeck.webp', alt: 'ActDeck Slide 9' },
    v10: { src: '/images/portfolio2025/actdeck/03v10_activedeck.webp', alt: 'ActDeck Slide 10' },
    v11: { src: '/images/portfolio2025/actdeck/03v11_activedeck.webp', alt: 'ActDeck Slide 11' },
  };

  return (
    <>
      <div className={styles['actdeck-page-wrapper']}>
        <ActDeckLayout images={actdeckImages} />
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
