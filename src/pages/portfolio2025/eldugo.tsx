import React from 'react';
import { Playfair_Display, Montserrat } from 'next/font/google';
import { EldugoLayout } from '@/projects/portfolio2025/components/ui/EldugoLayout';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

// Playfair Display - Main heading font
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair-display',
  display: 'swap',
});

// Montserrat - Primary font (headers, body, app text)
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
});

/**
 * Eldugo Portfolio Page
 * Displays the Eldugo brand identity project with 11+ sections:
 * - Hero with overlay
 * - Approach (3-column grid)
 * - Logo development sections
 * - Product and brand applications
 * - Related projects
 */
export default function EldugoPage() {
  const eldugoImages = {
    // Hero
    hero: { src: '/images/portfolio2025/eldugo/01-intro.webp', alt: 'Eldugo Intro' },
    textLogo: { src: '/images/portfolio2025/eldugo/02-text-logo.webp', alt: 'Eldugo Logo' },

    // Approach
    approachHelp: { src: '/images/portfolio2025/eldugo/03-approach-help.webp', alt: 'Approach' },
    approachCul: { src: '/images/portfolio2025/eldugo/04-approach-cul.webp', alt: 'Culture' },
    approachCol: { src: '/images/portfolio2025/eldugo/05-approach-col.webp', alt: 'Color' },
    approachSty: { src: '/images/portfolio2025/eldugo/06-approach-sty.webp', alt: 'Style' },
    advertise1: { src: '/images/portfolio2025/eldugo/07-advertise-1.webp', alt: 'Advertisement' },

    // Idea
    idea: { src: '/images/portfolio2025/eldugo/08-idea.webp', alt: 'Logo Idea' },
    noteCircle: { src: '/images/portfolio2025/eldugo/09-note-circle.png', alt: 'Note' },

    // Wordmark
    logoSkeleton: { src: '/images/portfolio2025/eldugo/10-logo-skeleton.webp', alt: 'Logo Skeleton' },
    logoAnim1: { src: '/images/portfolio2025/eldugo/11-logo-anim-1.gif', alt: 'Animation 1' },
    flaunt: { src: '/images/portfolio2025/eldugo/12-flaunt.webp', alt: 'Flaunt' },

    // Logo Variation
    logoVariationConcept: { src: '/images/portfolio2025/eldugo/13-logo-variation-concept.webp', alt: 'Variation Concept' },
    logoVariationLarge: { src: '/images/portfolio2025/eldugo/14-logo-variation-large.webp', alt: 'Variation Large' },
    logoAnim2: { src: '/images/portfolio2025/eldugo/15-logo-anim-2.gif', alt: 'Animation 2' },

    // Variations Gallery
    variationTopLeft: { src: '/images/portfolio2025/eldugo/16-variation-top-left.webp', alt: 'Top Left' },
    variationTopRight: { src: '/images/portfolio2025/eldugo/17-variation-top-right.webp', alt: 'Top Right' },
    variationBottomLeft: { src: '/images/portfolio2025/eldugo/18-variation-bottom-left.webp', alt: 'Bottom Left' },
    variationBottomRight: { src: '/images/portfolio2025/eldugo/19-variation-bottom-right.webp', alt: 'Bottom Right' },

    // Visual Identity
    visualIdentity: { src: '/images/portfolio2025/eldugo/20-visual-identity.jpg', alt: 'Visual Identity' },

    // Brand Applications
    advertise2: { src: '/images/portfolio2025/eldugo/21-advertise-2.webp', alt: 'Advertisement 2' },
    brandMockup: { src: '/images/portfolio2025/eldugo/22-brand-mockup.jpg', alt: 'Brand Mockup' },
    bagSquare: { src: '/images/portfolio2025/eldugo/23-bag-square.webp', alt: 'Square Bag' },

    // Product Applications
    priceTagFrontBack: { src: '/images/portfolio2025/eldugo/24-price-tag-front-back.png', alt: 'Price Tag' },
    priceTagFront: { src: '/images/portfolio2025/eldugo/25-price-tag-front.png', alt: 'Price Tag Front' },
    shirt: { src: '/images/portfolio2025/eldugo/26-shirt.webp', alt: 'Shirt' },
    bag1: { src: '/images/portfolio2025/eldugo/27-bag-1.webp', alt: 'Bag Mockup' },

    // Business Cards
    businessCard: { src: '/images/portfolio2025/eldugo/28-business-card.webp', alt: 'Business Card' },
    cardVariations: { src: '/images/portfolio2025/eldugo/29-card-variations.webp', alt: 'Card Variations' },

    // Other Projects
    projectImv: { src: '/images/portfolio2025/eldugo/30-project-imv.jpg', alt: 'Ideas Made Visual' },
    projectActdeck: { src: '/images/portfolio2025/eldugo/31-project-actdeck.jpg', alt: 'Activeledger' },
    projectMagma: { src: '/images/portfolio2025/eldugo/32-project-magma.jpg', alt: 'Magma Deck' },

    // Navigation
    arrow: { src: '/images/portfolio2025/eldugo/33-arrow.png', alt: 'Arrow' },
    etLogo: { src: '/images/portfolio2025/eldugo/34-et-logo.png', alt: 'ET Logo' },
  };

  return (
    <>
      <div
        className={`${playfairDisplay.variable} ${montserrat.variable} ${styles['eldugo-page-wrapper']}`}
      >
        <EldugoLayout images={eldugoImages} />
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
