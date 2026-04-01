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
 * Displays the Eldugo brand identity project with 22 sections:
 * Sections 01-04: Hero, Approach, Banner, Idea
 * Sections 05-10: Wordmark, Logo Anim, Flaunt, Logo Variation, Logo Details, Logo Anim 2
 * Sections 11-15: Variations Gallery, Visual Identity, Banner 2, Brand Mockup, Bag Square
 * Sections 16-20: Price Tags, Shirt, Bag, Business Card, Card Variations
 * Sections 21-22: Other Projects, Navigation
 */
export default function EldugoPage() {
  const eldugoImages = {
    // Section 01 - Hero
    hero: { src: '/images/portfolio2025/eldugo/01-hero.webp', alt: 'Eldugo Intro' },
    heroMobile: { src: '/images/portfolio2025/eldugo/01v2-hero-mobile.webp', alt: 'Eldugo Hero Mobile' },
    textLogo: { src: '/images/portfolio2025/eldugo/01v3-text-logo.webp', alt: 'Eldugo Logo' },

    // Section 02 - Approach
    approachHelp: { src: '/images/portfolio2025/eldugo/02-approach-help.webp', alt: 'Approach' },
    approachCul: { src: '/images/portfolio2025/eldugo/02v2-approach-cul.webp', alt: 'Culture' },
    approachCol: { src: '/images/portfolio2025/eldugo/02v3-approach-col.webp', alt: 'Color' },
    approachSty: { src: '/images/portfolio2025/eldugo/02v4-approach-sty.webp', alt: 'Style' },

    // Section 03 - Banner
    advertise1: { src: '/images/portfolio2025/eldugo/03-banner.webp', alt: 'Eldugo Banner' },

    // Section 04 - Idea
    idea: { src: '/images/portfolio2025/eldugo/04-idea.webp', alt: 'Logo Idea' },
    noteCircle: { src: '/images/portfolio2025/eldugo/04v2-note-circle.png', alt: 'Note' },

    // Section 05 - Wordmark
    logoSkeleton: { src: '/images/portfolio2025/eldugo/05-logo-skeleton.webp', alt: 'Logo Skeleton' },

    // Section 06 - Logo Anim
    logoAnim1: { src: '/images/portfolio2025/eldugo/06-logo-anim.gif', alt: 'Animation 1' },

    // Section 07 - Flaunt
    flaunt: { src: '/images/portfolio2025/eldugo/07-flaunt.webp', alt: 'Flaunt' },

    // Section 08 - Logo Variation
    logoVariationConcept: { src: '/images/portfolio2025/eldugo/08-logo-variation-concept.webp', alt: 'Variation Concept' },

    // Section 09 - Logo Variation Details
    logoVariationLarge: { src: '/images/portfolio2025/eldugo/09-logo-variation-large.webp', alt: 'Variation Large' },

    // Section 10 - Logo Anim 2
    logoAnim2: { src: '/images/portfolio2025/eldugo/10-logo-anim.gif', alt: 'Animation 2' },

    // Section 11 - Variations Gallery
    variationTopLeft: { src: '/images/portfolio2025/eldugo/11-variation-top-left.webp', alt: 'Top Left' },
    variationTopRight: { src: '/images/portfolio2025/eldugo/11v2-variation-top-right.webp', alt: 'Top Right' },
    variationBottomLeft: { src: '/images/portfolio2025/eldugo/11v3-variation-bottom-left.webp', alt: 'Bottom Left' },
    variationBottomRight: { src: '/images/portfolio2025/eldugo/11v4-variation-bottom-right.webp', alt: 'Bottom Right' },

    // Section 12 - Visual Identity
    visualIdentity: { src: '/images/portfolio2025/eldugo/12-visual-identity.jpg', alt: 'Visual Identity' },

    // Section 13 - Banner 2
    advertise2: { src: '/images/portfolio2025/eldugo/13-banner.webp', alt: 'Eldugo Banner 2' },

    // Section 14 - Brand Mockup
    brandMockup: { src: '/images/portfolio2025/eldugo/14-brand-mockup.jpg', alt: 'Brand Mockup' },

    // Section 15 - Bag Square
    bagSquare: { src: '/images/portfolio2025/eldugo/15-bag-square.webp', alt: 'Square Bag' },

    // Section 16 - Price Tags
    priceTagFrontBack: { src: '/images/portfolio2025/eldugo/16-price-tag-front-back.png', alt: 'Price Tag' },
    priceTagFront: { src: '/images/portfolio2025/eldugo/16v2-price-tag-front.png', alt: 'Price Tag Front' },

    // Section 17 - Shirt
    shirt: { src: '/images/portfolio2025/eldugo/17-shirt.webp', alt: 'Shirt' },

    // Section 18 - Bag
    bag1: { src: '/images/portfolio2025/eldugo/18-bag.webp', alt: 'Bag Mockup' },

    // Section 19 - Business Card
    businessCard: { src: '/images/portfolio2025/eldugo/19-business-card.webp', alt: 'Business Card' },

    // Section 20 - Card Variations
    cardVariations: { src: '/images/portfolio2025/eldugo/20-card-variations.webp', alt: 'Card Variations' },

    // Section 21 - Other Projects
    projectImv: { src: '/images/portfolio2025/eldugo/21-project-imv.jpg', alt: 'Ideas Made Visual' },
    projectActdeck: { src: '/images/portfolio2025/eldugo/21v2-project-actdeck.jpg', alt: 'Activeledger' },
    projectMagma: { src: '/images/portfolio2025/eldugo/21v3-project-magma.jpg', alt: 'Magma Deck' },

    // Section 22 - Navigation
    arrow: { src: '/images/portfolio2025/eldugo/22-arrow.png', alt: 'Arrow' },
    etLogo: { src: '/images/portfolio2025/eldugo/22v2-et-logo.png', alt: 'ET Logo' },
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
