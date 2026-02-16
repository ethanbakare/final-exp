import React from 'react';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

interface EldugoImage {
  src: string;
  alt: string;
}

interface EldugoLayoutProps {
  images: {
    // Section 01 - Hero
    hero: EldugoImage;
    heroMobile: EldugoImage;
    textLogo: EldugoImage;
    // Section 02 - Approach
    approachHelp: EldugoImage;
    approachCul: EldugoImage;
    approachCol: EldugoImage;
    approachSty: EldugoImage;
    // Section 03 - Banner
    advertise1: EldugoImage;
    // Section 04 - Idea
    idea: EldugoImage;
    noteCircle: EldugoImage;
    // Section 05 - Wordmark
    logoSkeleton: EldugoImage;
    // Section 06 - Logo Anim
    logoAnim1: EldugoImage;
    // Section 07 - Flaunt
    flaunt: EldugoImage;
    // Section 08 - Logo Variation
    logoVariationConcept: EldugoImage;
    // Section 09 - Logo Variation Details
    logoVariationLarge: EldugoImage;
    // Section 10 - Logo Anim 2
    logoAnim2: EldugoImage;
    // Section 11 - Variations Gallery
    variationTopLeft: EldugoImage;
    variationTopRight: EldugoImage;
    variationBottomLeft: EldugoImage;
    variationBottomRight: EldugoImage;
    // Section 12 - Visual Identity
    visualIdentity: EldugoImage;
    // Section 13 - Banner 2
    advertise2: EldugoImage;
    // Section 14 - Brand Mockup
    brandMockup: EldugoImage;
    // Section 15 - Bag Square
    bagSquare: EldugoImage;
    // Section 16 - Price Tags
    priceTagFrontBack: EldugoImage;
    priceTagFront: EldugoImage;
    // Section 17 - Shirt
    shirt: EldugoImage;
    // Section 18 - Bag
    bag1: EldugoImage;
    // Section 19 - Business Card
    businessCard: EldugoImage;
    // Section 20 - Card Variations
    cardVariations: EldugoImage;
    // Section 21 - Other Projects
    projectImv: EldugoImage;
    projectActdeck: EldugoImage;
    projectMagma: EldugoImage;
    // Section 22 - Navigation
    arrow: EldugoImage;
    etLogo: EldugoImage;
  };
}

/**
 * Eldugo Layout Component
 * Displays 22 sections for the Eldugo brand identity presentation:
 * Sections 01-04: Hero, Approach, Banner, Idea
 * Sections 05-10: Wordmark, Logo Anim, Flaunt, Logo Variation, Logo Details, Logo Anim 2
 * Sections 11-15: Variations Gallery, Visual Identity, Banner 2, Brand Mockup, Bag Square
 * Sections 16-20: Price Tags, Shirt, Bag, Business Card, Card Variations
 * Sections 21-22: Other Projects, Navigation (not yet rendered)
 */
export const EldugoLayout: React.FC<EldugoLayoutProps> = ({ images }) => {
  return (
    <div className={styles['eldugo-container']}>
      {/* Section 01 - Hero (DESKTOP ONLY, hidden on mobile) */}
      <section className={styles['eldugo-section-hero-desktop']}>
        <img src={images.hero.src} alt={images.hero.alt} className={styles['eldugo-hero-bg']} />
      </section>

      {/* Section 01 - Hero (MOBILE ONLY, hidden on desktop) */}
      <section className={styles['eldugo-section-hero-mobile']}>
        <img src={images.heroMobile.src} alt={images.heroMobile.alt} className={styles['eldugo-hero-mobile-bg']} />
        <img src={images.textLogo.src} alt={images.textLogo.alt} className={styles['eldugo-hero-logo']} />
        <div className={styles['text-block-3']}>
          Eldugo is a brand which works predominantly within the industry of creating and selling handmade
          bags and quality accessories, incorporating traditional African designs into modern use cases.
        </div>
      </section>

      {/* Section 02 - Approach (3-column grid) */}
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
            <div className={`${styles['eldugo-approach-card']} ${styles['eldugo-approach-card-cul']}`}>
              <img src={images.approachCul.src} alt={images.approachCul.alt} />
              <div className={styles['app-text']}>
                Eldugo strongly identifies with its roots within African heritage, especially the practice of
                using Ankara strips to design unique pieces
              </div>
            </div>
            <div className={`${styles['eldugo-approach-card']} ${styles['eldugo-approach-card-col']}`}>
              <img src={images.approachCol.src} alt={images.approachCol.alt} />
              <div className={styles['app-text']}>
                Eldugo as a brand is identified by its use of its primary colour orange, along with a
                combination of grey and beige variations
              </div>
            </div>
            <div className={`${styles['eldugo-approach-card']} ${styles['eldugo-approach-card-sty']}`}>
              <img src={images.approachSty.src} alt={images.approachSty.alt} />
              <div className={styles['app-text']}>
                Eldugo&apos;s style is minimal, by attaching Ankara strips on plain canvas and letting the strip
                designs do the talking
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03 - Banner (full width) */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.advertise1.src} alt={images.advertise1.alt} />
      </section>

      {/* Section 04 - Idea (logo concept) */}
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

      {/* Section 05 - Wordmark (logo skeleton) */}
      <section className={styles['eldugo-section-wordmark']}>
        <div className={styles['eldugo-wordmark-header']}>
          <div className={styles['header-el-caps']}>wordmark</div>
          <div className={styles['eldugo-divider-orange']}></div>
        </div>
        <div className={styles['eldugo-section-content']}>
          <img src={images.logoSkeleton.src} alt={images.logoSkeleton.alt} />
        </div>
      </section>

      {/* Section 06 - Logo Anim */}
      <section className={styles['eldugo-section-logo-anim']}>
        <div className={styles['eldugo-logo-anim-wrapper']}>
          <img src={images.logoAnim1.src} alt={images.logoAnim1.alt} />
        </div>
      </section>

      {/* Section 07 - Flaunt (full width) */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.flaunt.src} alt={images.flaunt.alt} />
      </section>

      {/* Section 08 - Logo Variation */}
      <section className={styles['eldugo-section-logo-variation']}>
        <div className={styles['eldugo-section-content']}>
          <h1 className={styles['el-header-main']}>Logo Variation</h1>
          <div className={styles['text-block-5']}>
            Flowers come in a broad variety of colours; and african<br />
            fabrics likewise, displaying a diverse range of patterns.<br /><br />
            This idea of variety is employed in the logo variation.<br />
            The flower petals in the logo change colour and<br />
            embody the print of various african fabrics, With this<br />
            the logo sports a different look in specific scenarios<br />
            e.g. media campaigns, public holidays etc.
          </div>
          <div className={`${styles['text-block-5']} ${styles['text-block-5-mobile']}`}>
            Flowers come in a broad variety of colours; and african fabrics likewise, displaying a diverse range of patterns.<br /><br />
            This idea of variety is employed in the logo variation. The flower petals in the logo change colour and embody the print of various african fabrics, With this the logo sports a different look in specific scenarios e.g. media campaigns, public holidays etc.
          </div>
          <img src={images.logoVariationConcept.src} alt={images.logoVariationConcept.alt} className={styles['eldugo-logo-variation-concept']} />
        </div>
      </section>

      {/* Section 09 - Logo Variation Details */}
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

      {/* Section 10 - Logo Anim 2 (full width) */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.logoAnim2.src} alt={images.logoAnim2.alt} />
      </section>

      {/* Section 11 - Variations Gallery (header + 2x2 grid) */}
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

      {/* Section 12 - Visual Identity */}
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

      {/* Section 13 - Banner 2 (full width) */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.advertise2.src} alt={images.advertise2.alt} />
      </section>

      {/* Section 14 - Brand Mockup (full width) */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.brandMockup.src} alt={images.brandMockup.alt} />
      </section>

      {/* Section 15 - Bag Square (full width) */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.bagSquare.src} alt={images.bagSquare.alt} />
      </section>

      {/* Section 16 - Price Tags (2-column layout) */}
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

      {/* Section 17 - Shirt (full width) */}
      <section className={styles['eldugo-section-full-img']}>
        <img src={images.shirt.src} alt={images.shirt.alt} />
      </section>

      {/* Section 18 - Bag (centered) */}
      <section className={styles['eldugo-section-centered']}>
        <div className={styles['eldugo-section-content']}>
          <img src={images.bag1.src} alt={images.bag1.alt} />
        </div>
      </section>

      {/* Section 19 - Business Card (centered) */}
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

      {/* Section 20 - Card Variations (centered) */}
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
