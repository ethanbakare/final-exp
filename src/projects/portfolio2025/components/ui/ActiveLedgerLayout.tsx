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
      {/* Section 01 - Background image with overlay content */}
      <section className={styles['al-section-01']}>
        <img
          src={images.section01[0].src}
          alt={images.section01[0].alt}
          className={styles['al-section-01-bg']}
        />
        <div className={styles['al-section-01-outer']}>
          <div className={`${styles['al-section-content']} ${styles['al-section-01-master']}`}>
            {/* Container 1 - Project Task header + paragraph */}
            <div className={styles['al-section-01-col1']}>
              <h2 className={styles['al-section1-head']}>Project Task</h2>
              <p className={styles['al-section1-paragraph']}>
                The rebrands goal was to visually reposition activeledger in the
                blockchain space and improve its brand recognition.
              </p>
              <p className={styles['al-section1-paragraph']}>
                It was important for the company to come across as a sustainable
                Distributed Ledger Technology (DLT) brand in a sense a &ldquo;Red-hat
                linux&rdquo; for blockchain rather than fall into the cryptocurrency space.
              </p>
            </div>

            {/* Container 2 - Challenge + Tasks */}
            <div className={styles['al-section-01-col2']}>
              <div className={styles['al-section-01-col2-sub']}>
                <h3 className={styles['al-section1-subheader']}>Challenge</h3>
                <p className={styles['al-section1-paragraph']}>
                  How might we differentiate activeledger in its<br />
                  market &amp; visually communicate it USP?
                </p>
              </div>
              <div className={styles['al-section-01-col2-sub']}>
                <h3 className={styles['al-section1-subheader']}>Tasks</h3>
                <p className={styles['al-section1-paragraph']}>
                  - Brand Strategy &amp; Audit<br />
                  - Visual Identity &amp; Positioning
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02 */}
      <section className={styles['activeledger-section']}>
        <div className={`${styles['al-section-content']} ${styles['al-section-02']}`}>
          {images.section02.map((img, i) => (
            <img key={`s02-${i}`} src={img.src} alt={img.alt} />
          ))}
        </div>
      </section>

      {/* Section 03 - Background image with gradient + text overlay */}
      <section className={styles['al-section-03']}>
        <img
          src={images.section03[0].src}
          alt={images.section03[0].alt}
          className={styles['al-section-03-bg']}
        />
        <div className={styles['al-section-03-gradient']}></div>
        <div className={`${styles['al-section-content']} ${styles['al-section-03-content']}`}>
          <h1 className={`${styles['al-soleil-head']} ${styles['al-soleil-head-blue']}`}>
            What is Activeledger?
          </h1>
          <p className={`${styles['al-act-paragraph']} ${styles['al-act-paragraph-grey']} ${styles['sec3']}`}>
            Blockchain is a distributed ledger technology (DLT) that stores records immutably on a public
            ledger across a decentralised network.{' '}
            <strong>
              Activeledger is an open source DLT made for enterprise and developers
            </strong>{' '}
            which provides the benefits of blockchain (legacy tech) and more without its limitations
            such as speed, high energy consumption etc.
          </p>
        </div>
      </section>

      {/* Section 04 */}
      <section className={styles['activeledger-section']}>
        <div className={`${styles['al-section-content']} ${styles['al-section-04']}`}>
          {images.section04.map((img, i) => (
            <img key={`s04-${i}`} src={img.src} alt={img.alt} />
          ))}
        </div>
      </section>

      {/* Section 05 - Strategy text + images (desktop/mobile variants) */}
      <section className={styles['activeledger-section']}>
        <div className={`${styles['al-section-content']} ${styles['al-section-05']}`}>
          <div className={styles['al-section-05-text']}>
            <h1 className={`${styles['al-soleil-head']} ${styles['al-soleil-head-beige']}`}>
              Strategy
            </h1>
            <p className={`${styles['al-act-paragraph']} ${styles['al-act-paragraph-grey']}`}>
              A consultation session gave an idea what success looked like, the narrative in the
              blockchain space and how Activeledger could uniquely position itself. The steps below
              followed.
            </p>
          </div>
          <div className={styles['al-section-05-images']}>
            <img src={images.section05[0].src} alt={images.section05[0].alt} className={styles['al-section-05-desktop']} />
            <img src={images.section05[2].src} alt={images.section05[2].alt} className={styles['al-section-05-mobile']} />
            <img src={images.section05[1].src} alt={images.section05[1].alt} className={styles['al-section-05-mobile-quote']} />
          </div>
        </div>
      </section>

      {/* Section 06 - Background image with text overlay */}
      <section className={styles['al-section-06']}>
        <img
          src={images.section06[1].src}
          alt={images.section06[1].alt}
          className={styles['al-section-06-bg']}
        />
        <div className={styles['al-section-06-button-wrap']}>
          <div className={styles['al-button']}>EXPLORATION</div>
        </div>
        <div className={`${styles['al-section-content']} ${styles['al-section-06-content']}`}>
          <h1 className={`${styles['al-soleil-head']} ${styles['al-soleil-head-blue']}`}>
            Attributes and Metaphors
          </h1>
          <p className={`${styles['al-act-paragraph']} ${styles['al-act-paragraph-grey']} ${styles['sec6']}`}>
            This was the first step in the exploration process, informed by the interactive
            session earlier carried out. A list functional verbal traits and metaphors were
            outlined. A snippet of which is shown below.
          </p>
          <img
            src={images.section06[0].src}
            alt={images.section06[0].alt}
            className={styles['al-section-06-img']}
          />
        </div>
      </section>

      {/* Section 07 - Sketches */}
      <section className={styles['activeledger-section']}>
        <div className={styles['al-section-06-button-wrap']}>
          <div className={styles['al-button']}>EXPLORATION</div>
        </div>
        <div className={`${styles['al-section-content']} ${styles['al-section-07-content']}`}>
          <h1 className={`${styles['al-soleil-head']} ${styles['al-soleil-head-beige']}`}>
            Sketches
          </h1>
          <p className={`${styles['al-act-paragraph']} ${styles['al-act-paragraph-grey']} ${styles['sec7']}`}>
            A series of grouped metaphors are explored through iterative sketches to
            develop visual concepts. A portion of which is shown below, each row of
            concepts beneath its own bucket of metaphors.
          </p>
          <img
            src={images.section07[0].src}
            alt={images.section07[0].alt}
            className={styles['al-section-07-img']}
          />
        </div>
      </section>

      {/* Section 08 - Logo Concept */}
      <section className={styles['activeledger-section']}>
        <div className={styles['al-section-06-button-wrap']}>
          <div className={styles['al-button']}>CONCEPT</div>
        </div>
        <div className={styles['al-section-08-top']}>
          <h1 className={`${styles['al-soleil-head']} ${styles['al-soleil-head-slate']} ${styles['al-section-08-head']}`}>
            Logo Concept
          </h1>
          <img src={images.section08[0].src} alt={images.section08[0].alt} className={styles['al-section-08-img']} />
          <img src={images.section08[1].src} alt={images.section08[1].alt} className={styles['al-section-08-img']} />
        </div>
        <div className={`${styles['al-section-content']} ${styles['al-section-08-bottom']}`}>
          <img src={images.section08[2].src} alt={images.section08[2].alt} className={styles['al-section-08-breakdown']} />
          <div className={styles['sec8']}>
            <p className={`${styles['al-act-paragraph']} ${styles['al-act-paragraph-grey']}`}>
              Blockchain is a term synonymous with the distributed ledger tech (DLT) space. The chosen
              concept embodied its visual attributes and met the desired outcomes outlined in the strategy
              session
            </p>
            <p className={`${styles['al-act-paragraph']} ${styles['al-act-paragraph-grey']}`}>
              <strong>Simple</strong> - Two interlocking &lsquo;block-like&rsquo; chain links.<br />
              <strong>Distinct</strong> - Possessing the hidden form of an &ldquo;A&rdquo;.<br />
              <strong>Memorable</strong> - Visually tied to the term blockchain.
            </p>
          </div>
        </div>
      </section>

      {/* Section 09 */}
      <section className={styles['activeledger-section']}>
        {images.section09.map((img, i) => (
          <img key={`s09-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 10 */}
      <section className={styles['activeledger-section']}>
        <div className={styles['al-section-06-button-wrap']}>
          <div className={styles['al-button']}>BRAND IDENTITY</div>
        </div>
        <div className={styles['al-section-10']}>
          <div className={styles['al-section-content']}>
            <img src={images.section10[0].src} alt={images.section10[0].alt} className={styles['al-section-10-icon']} />
            <h1 className={`${styles['al-soleil-head']} ${styles['al-soleil-head-grey']} ${styles['al-section-10-head']}`}>
              Using a block shaped<br />chain as a visual identity
            </h1>
            <p className={`${styles['al-act-paragraph']} ${styles['al-act-paragraph-grey']} ${styles['sec10']}`}>
              Activeledger&rsquo;s visual identity stems from the use of a single primary element present in
              the logo &ldquo;a block-shaped chain&rdquo;. This central piece is used to form a variety of patterns
              which extends across visual collateral to form a strong and flexible identity.
            </p>
            <img src={images.section10[1].src} alt={images.section10[1].alt} className={styles['al-section-10-breakdown']} />
          </div>
          <h2 className={styles['al-soleil-subhead']}>
            Brand Pattern Exploration
          </h2>
          <div className={styles['al-section-10-small-wrap']}>
            <p className={`${styles['al-act-paragraph']} ${styles['al-act-paragraph-grey']} ${styles['al-act-small']}`}>
              A strong yet flexible system for patterns. With the top left sample
              coincidentally resembling &ldquo;0&rsquo;s&rdquo; and &ldquo;1&rsquo;s&rdquo; the binary digits a computer
              understands, subtly referencing digitisation.
            </p>
          </div>
          <div className={styles['al-section-10-pattern-wrap']}>
            <img src={images.section10[2].src} alt={images.section10[2].alt} className={styles['al-section-10-pattern']} />
          </div>
        </div>
      </section>

      {/* Section 11 */}
      <section className={styles['al-section-11']}>
        <div className={`${styles['al-section-content']} ${styles['al-section-11-inner']}`}>
          <img src={images.section11[0].src} alt={images.section11[0].alt} className={styles['al-section-11-img']} />
        </div>
      </section>

      {/* Section 12 */}
      <section className={styles['activeledger-section']}>
        {images.section12.map((img, i) => (
          <img key={`s12-${i}`} src={img.src} alt={img.alt} />
        ))}
      </section>

      {/* Section 13 */}
      <section className={styles['activeledger-section']}>
        <div className={styles['al-section-13']}>
          <img src={images.section13[0].src} alt={images.section13[0].alt} />
        </div>
      </section>

      {/* Section 14 */}
      <section className={styles['activeledger-section']}>
        <div className={styles['al-section-14']}>
          <div className={styles['al-section-content']}>
            <img src={images.section14[0].src} alt={images.section14[0].alt} className={styles['al-section-14-img']} />
          </div>
          <img src={images.section14[1].src} alt={images.section14[1].alt} className={styles['al-section-14-data']} />
        </div>
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
        <div className={styles['al-section-17']}>
          <img src={images.section17[0].src} alt={images.section17[0].alt} />
        </div>
      </section>
    </div>
  );
};
