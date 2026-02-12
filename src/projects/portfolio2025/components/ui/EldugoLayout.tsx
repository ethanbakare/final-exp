import React from 'react';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

interface EldugoImage {
  src: string;
  alt: string;
}

interface EldugoLayoutProps {
  images: {
    // Hero
    hero: EldugoImage;
    heroMobile: EldugoImage;
    textLogo: EldugoImage;
    // Approach
    approachHelp: EldugoImage;
    approachCul: EldugoImage;
    approachCol: EldugoImage;
    approachSty: EldugoImage;
    advertise1: EldugoImage;
    // Idea
    idea: EldugoImage;
    noteCircle: EldugoImage;
    // Wordmark
    logoSkeleton: EldugoImage;
    logoAnim1: EldugoImage;
    flaunt: EldugoImage;
    // Logo Variation
    logoVariationConcept: EldugoImage;
    logoVariationLarge: EldugoImage;
    logoAnim2: EldugoImage;
    // Variations Gallery
    variationTopLeft: EldugoImage;
    variationTopRight: EldugoImage;
    variationBottomLeft: EldugoImage;
    variationBottomRight: EldugoImage;
    // Visual Identity
    visualIdentity: EldugoImage;
    // Brand Applications
    advertise2: EldugoImage;
    brandMockup: EldugoImage;
    bagSquare: EldugoImage;
    // Product Applications
    priceTagFrontBack: EldugoImage;
    priceTagFront: EldugoImage;
    shirt: EldugoImage;
    bag1: EldugoImage;
    // Business Cards
    businessCard: EldugoImage;
    cardVariations: EldugoImage;
    // Other Projects
    projectImv: EldugoImage;
    projectActdeck: EldugoImage;
    projectMagma: EldugoImage;
    // Navigation
    arrow: EldugoImage;
    etLogo: EldugoImage;
  };
}

/**
 * Eldugo Layout Component
 * Displays the complete Eldugo brand identity presentation with:
 * - Hero section with overlay
 * - Approach (3-column grid)
 * - Logo development sections
 * - Product and brand mockups
 * - Related projects and footer
 */
export const EldugoLayout: React.FC<EldugoLayoutProps> = ({ images }) => {
  return (
    <div className={styles['eldugo-container']}>
      {/* Hero Section - DESKTOP ONLY (hidden on mobile) */}
      <section className={styles['eldugo-section-hero-desktop']}>
        <img src={images.hero.src} alt={images.hero.alt} className={styles['eldugo-hero-bg']} />
      </section>

      {/* Hero Section - MOBILE ONLY (hidden on desktop) */}
      <section
        className={styles['eldugo-section-hero-mobile']}
        style={{ backgroundImage: `url(${images.heroMobile.src})` }}
      >
        <img src={images.textLogo.src} alt={images.textLogo.alt} className={styles['eldugo-hero-logo']} />
        <div className={styles['text-block-3']}>
          Eldugo is a brand which works predominantly within the industry of creating and selling handmade
          bags and quality accessories, incorporating traditional African designs into modern use cases.
        </div>
      </section>

      {/* Approach Section (Section 36) - 3-column grid */}
      <section className={styles['eldugo-section-approach']}>
        <div className={styles['eldugo-section-content']}>
          <div className={styles['eldugo-approach-header']}>
            <div className={styles['header-el-caps']}>APPROACH</div>
            <div className={styles['eldugo-divider-orange']}></div>
            <div className={styles['header-el-sp']}>
              Eldugo as a brand is characterised by three major themes
            </div>
          </div>
          <img src={images.approachHelp.src} alt={images.approachHelp.alt} className={styles['eldugo-approach-main-img']} />
          <div className={styles['eldugo-approach-grid']}>
            <div className={styles['eldugo-approach-card']}>
              <img src={images.approachCul.src} alt={images.approachCul.alt} />
              <div className={styles['app-text']}>
                Eldugo strongly identifies with its roots within African heritage, especially the practice of
                using Ankara strips to design unique pieces
              </div>
            </div>
            <div className={styles['eldugo-approach-card']}>
              <img src={images.approachCol.src} alt={images.approachCol.alt} />
              <div className={styles['app-text']}>
                Eldugo as a brand is identified by its use of its primary colour orange, along with a
                combination of grey and beige variations
              </div>
            </div>
            <div className={styles['eldugo-approach-card']}>
              <img src={images.approachSty.src} alt={images.approachSty.alt} />
              <div className={styles['app-text']}>
                Eldugo&apos;s style is minimal, by attaching Ankara strips on plain canvas and letting the strip
                designs do the talking
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advertisement 1 - Full width */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.advertise1.src} alt={images.advertise1.alt} />
      </section>

      {/* Idea Section (Section 19) - Logo concept */}
      <section className={styles['eldugo-section-idea']}>
        <div className={styles['eldugo-idea-header']}>
          <div className={styles['header-el-caps']}>IDEA</div>
          <div className={styles['eldugo-divider-orange']}></div>
          <div className={styles['header-el-sp']}>
            Concept, process and visual interpretation of the logo
          </div>
        </div>
        <div className={styles['eldugo-section-content']}>
          <img src={images.idea.src} alt={images.idea.alt} className={styles['eldugo-idea-main-img']} />
          <div className={styles['eldugo-note-row']}>
            <img src={images.noteCircle.src} alt={images.noteCircle.alt} className={styles['eldugo-note-circle']} />
            <div className={styles['text-block-4']}>
              NOTE. The term &ldquo;02&rdquo; and &ldquo;O3&rdquo; above refer to specific themes &ldquo;colour&rdquo; and &ldquo;style&rdquo;
            </div>
          </div>
        </div>
      </section>

      {/* Wordmark Section (Section 37) - Logo skeleton */}
      <section className={styles['eldugo-section-wordmark']}>
        <div className={styles['eldugo-wordmark-header']}>
          <div className={styles['header-el-caps']}>wordmark</div>
          <div className={styles['eldugo-divider-orange']}></div>
        </div>
        <div className={styles['eldugo-section-content']}>
          <img src={images.logoSkeleton.src} alt={images.logoSkeleton.alt} />
        </div>
      </section>

      {/* Logo Animation 1 - Full width */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.logoAnim1.src} alt={images.logoAnim1.alt} />
      </section>

      {/* Flaunt - Full width */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.flaunt.src} alt={images.flaunt.alt} />
      </section>

      {/* Logo Variation Section (Section 21) */}
      <section className={styles['eldugo-section-logo-variation']}>
        <div className={styles['eldugo-section-content']}>
          <h1 className={styles['el-header-main']}>Logo Variation</h1>
          <div className={styles['text-block-5']}>
            The logo for Eldugo was designed in a way where it could be<br />
            used in a multitude of ways, while still passing the same<br />
            message and embodying the same identity of the Eldugo brand
          </div>
          <div className={`${styles['text-block-5']} ${styles['text-block-5-mobile']}`}>
            The logo for Eldugo was designed in a way where it could be used in a multitude of ways, while
            still passing the same message and embodying the same identity of the Eldugo brand
          </div>
          <img src={images.logoVariationConcept.src} alt={images.logoVariationConcept.alt} className={styles['eldugo-logo-variation-concept']} />
        </div>
      </section>

      {/* Logo Variation Details (Section 27) */}
      <section className={styles['eldugo-section-logo-details']}>
        <div className={styles['eldugo-logo-details-header']}>
          <div className={styles['header-el-caps']}>LOGO VARIATION</div>
          <div className={styles['eldugo-divider-orange']}></div>
          <div className={styles['header-el-sp']}>
            Concept and process behind logo variation
          </div>
        </div>
        <img src={images.logoVariationLarge.src} alt={images.logoVariationLarge.alt} className={styles['eldugo-logo-details-main-img']} />
        <div className={styles['eldugo-section-content']}>
          <div className={styles['eldugo-note-row']}>
            <img src={images.noteCircle.src} alt={images.noteCircle.alt} className={styles['eldugo-note-circle']} />
            <div className={styles['text-block-4']}>
              NOTE. The term &ldquo;01&rdquo; above refers to specific theme &ldquo;culture&rdquo;
            </div>
          </div>
        </div>
      </section>

      {/* Logo Animation 2 - Full width */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.logoAnim2.src} alt={images.logoAnim2.alt} />
      </section>

      {/* Logo Variations Section (Section 38) - Header + 2x2 grid */}
      <section className={styles['eldugo-section-variations']}>
        <div className={styles['eldugo-variations-header']}>
          <div className={styles['header-el-caps']}>LOGO VARIATIONS</div>
          <div className={styles['eldugo-divider-orange']}></div>
          <div className={styles['header-el-sp']}>Possible logo variations</div>
        </div>
        <div className={styles['eldugo-variations-container']}>
          <div className={styles['eldugo-variations-row']}>
            <img src={images.variationTopLeft.src} alt={images.variationTopLeft.alt} />
            <img src={images.variationTopRight.src} alt={images.variationTopRight.alt} />
          </div>
        </div>
        <div className={styles['eldugo-variations-container']}>
          <div className={styles['eldugo-variations-row']}>
            <img src={images.variationBottomLeft.src} alt={images.variationBottomLeft.alt} />
            <img src={images.variationBottomRight.src} alt={images.variationBottomRight.alt} />
          </div>
        </div>
      </section>

      {/* Visual Identity Section (Section 39) */}
      <section className={styles['eldugo-section-visual-identity']}>
        <div className={styles['eldugo-visual-identity-content']}>
          <div className={styles['eldugo-visual-identity-text']}>
            <h1 className={styles['el-header-main']}>Visual Identity</h1>
            <div className={styles['text-block-5']}>
              Eldugo&apos;s packaging is characterized by the use of a<br />
              single ankara strip on a plain canvas which:<br /><br />
              1.) Places emphasis: The textile patterned strip is the<br />
              first thing to be noticed, drawing its origin from<br />
              african culture.<br /><br />
              2.) Reflects style: Less is more, the use of little or<br />
              nothing reflects a style of minimalism which gives<br />
              a modern look.
            </div>
            <div className={`${styles['text-block-5']} ${styles['text-block-5-mobile']}`}>
              Eldugo&apos;s packaging is characterised by the use of a single ankara strip on a plain canvas which:<br /><br />
              1.) Places emphasis: The textile patterned strip is the first thing to be noticed, drawing its origin from african culture.<br /><br />
              2.) Reflects style: Less is more, the use of little or nothing reflects a style of minimalism which gives a modern look.
            </div>
          </div>
        </div>
        <div className={styles['eldugo-divider-orange-wide']}></div>
        <img src={images.visualIdentity.src} alt={images.visualIdentity.alt} className={styles['eldugo-visual-identity-img']} />
      </section>

      {/* Advertisement 2 - Full width */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.advertise2.src} alt={images.advertise2.alt} />
      </section>

      {/* Brand Mockup - Full width */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.brandMockup.src} alt={images.brandMockup.alt} />
      </section>

      {/* Square Bag - Full width */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.bagSquare.src} alt={images.bagSquare.alt} />
      </section>

      {/* Price Tags - 2-column layout */}
      <section className={styles['eldugo-section-price-tags']}>
        <div className={styles['eldugo-price-tags-header']}>
          <div className={styles['header-el-caps']}>PRICE TAGS</div>
          <div className={styles['eldugo-divider-orange']}></div>
          <div className={styles['header-el-sp']}>
            Tags with single ankara strips
          </div>
        </div>
        <div className={styles['eldugo-section-content']}>
          <div className={styles['eldugo-price-tags-grid']}>
            <img src={images.priceTagFrontBack.src} alt={images.priceTagFrontBack.alt} />
            <img src={images.priceTagFront.src} alt={images.priceTagFront.alt} />
          </div>
        </div>
      </section>

      {/* Shirt - Full width */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.shirt.src} alt={images.shirt.alt} />
      </section>

      {/* Bag Mockup - Centered */}
      <section className={styles['eldugo-section-centered']}>
        <div className={styles['eldugo-section-content']}>
          <img src={images.bag1.src} alt={images.bag1.alt} />
        </div>
      </section>

      {/* Business Cards - Centered */}
      <section className={styles['eldugo-section-centered']}>
        <div className={styles['eldugo-centered-header']}>
          <div className={styles['header-el-caps']}>BUSINESS CARD</div>
          <div className={styles['eldugo-divider-orange']}></div>
          <div className={styles['header-el-sp']}>Main business card</div>
        </div>
        <div className={styles['eldugo-section-content']}>
          <img src={images.businessCard.src} alt={images.businessCard.alt} />
        </div>
      </section>

      {/* Card Variations - Centered */}
      <section className={styles['eldugo-section-centered']}>
        <div className={styles['eldugo-centered-header']}>
          <div className={styles['header-el-caps']}>BUSINESS CARD</div>
          <div className={styles['eldugo-divider-orange']}></div>
          <div className={styles['header-el-sp']}>Possible card variations</div>
        </div>
        <div className={styles['eldugo-section-content']}>
          <img src={images.cardVariations.src} alt={images.cardVariations.alt} />
        </div>
      </section>
    </div>
  );
};
