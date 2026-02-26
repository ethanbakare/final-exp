import React from 'react';
import styles from '@/projects/ollama/styles/ollama.module.css';
import { OllamaTerminal } from './OllamaTerminal';
import { ExpressionShowcase } from './ExpressionShowcase';

interface OllamaImage {
  src: string;
  alt: string;
}

interface OllamaLayoutProps {
  images: {
    // Section 02 - Visual Audit
    visualAudit: OllamaImage;
    // Section 03 - Mood Board (images hardcoded in component for animation)
    // Section 04 - Character Bible
    characterBible: OllamaImage;
    // Section 05 - Product Posters
    magicWords: OllamaImage;
    terminalPoster: OllamaImage;
    itsTimeToBuild: OllamaImage;
    // Section 06 - Model Announcements
    dolphin: OllamaImage;
    gemma: OllamaImage;
    // Section 07 - Community & Values
    weLoveOpenSource: OllamaImage;
    openSourceCelebration: OllamaImage;
    ollamaRocks: OllamaImage;
    ollamaEnlightenment: OllamaImage;
    gpuRich: OllamaImage;
  };
}

/**
 * Ollama Layout Component
 * Full case study page for the Ollama brand.
 * Section 01: Hero / Intro
 * Section 02: Visual Audit
 * Section 03: Mood Board
 * Section 04: Character Bible
 * Section 05: Product Posters
 * Section 06: Model Announcements
 * Section 07: Community & Values
 * Section 08: Closing
 */
export const OllamaLayout: React.FC<OllamaLayoutProps> = ({ images }) => {
  return (
    <div className={styles['ollama-container']}>
      {/* Section 01 — Hero / Intro */}
      <section className={styles['ollama-hero-banner']}>
        <div className={styles['ollama-hero-card']}>
          <div className={styles['ollama-hero-component']}>
            <OllamaTerminal />
          </div>
          <div className={styles['ollama-hero-body']}>
            <div className={styles['ollama-description-wrapper']}>
              <p className={styles['ollama-hero-description']}>
                Ollama lets you run open-source LLMs locally. This project? It&apos;s a personal
                exploration of how its mascot and visual identity system narrates the product
                — and the community values built around it.
              </p>
              <div className={styles['ollama-stats-row']}>
                <div className={styles['ollama-stat']}>
                  <div className={styles['ollama-stat-value']}>
                    <svg width="24" height="23" viewBox="0 0 24 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M11.7895 0.00397912C5.27943 0.00397912 0 5.28252 0 11.7934C0 17.0028 3.37775 21.4206 8.06233 22.9803C8.65198 23.0895 8.86869 22.7239 8.86869 22.4124C8.86869 22.1312 8.85694 21.2026 8.85215 20.2183C5.57189 20.9315 4.88041 18.8266 4.88041 18.8266C4.34426 17.4636 3.5714 17.1012 3.5714 17.1012C2.50175 16.3688 3.65278 16.3849 3.65278 16.3849C4.83642 16.4676 5.45959 17.599 5.45959 17.599C6.51185 19.4015 8.21855 18.8797 8.89087 18.579C8.99706 17.817 9.30168 17.2966 9.63935 17.002C7.02051 16.7047 4.26767 15.6934 4.26767 11.1755C4.26767 9.88871 4.72895 8.83649 5.48222 8.01138C5.35953 7.71376 4.95568 6.51531 5.5958 4.89169C5.5958 4.89169 6.58579 4.57446 8.83911 6.10016C9.77906 5.83949 10.7873 5.70807 11.7887 5.70372C12.7908 5.70807 13.8008 5.83905 14.7421 6.10016C16.9924 4.57535 17.9815 4.89169 17.9815 4.89169C18.6225 6.51575 18.2204 7.71505 18.0977 8.01142C18.8536 8.83649 19.3109 9.88871 19.3109 11.1755C19.3109 15.7038 16.552 16.6995 13.9275 16.9915C14.3505 17.357 14.7282 18.0746 14.7282 19.1738C14.7282 20.7505 14.7147 22.0211 14.7147 22.4089C14.7147 22.7226 14.9271 23.0895 15.525 22.9746C20.2069 21.4141 23.5803 16.9958 23.5803 11.7895C23.5803 5.27943 18.3018 0 11.7904 0L11.7895 0.00394228L11.7895 0.00397912Z" fill="currentColor" />
                    </svg>
                    <span>163K</span>
                  </div>
                  <span className={styles['ollama-stat-label']}>GITHUB STARS</span>
                </div>
                <div className={styles['ollama-stat']}>
                  <div className={styles['ollama-stat-value']}>
                    <svg width="24" height="19" viewBox="0 0 24 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.3303 1.52302C18.753 0.801615 17.088 0.289676 15.3779 0.000234375C15.1457 0.416157 14.9331 0.851298 14.7454 1.28972C13.8358 1.15248 12.9172 1.08342 11.9972 1.0831C11.0787 1.0831 10.1558 1.15289 9.24859 1.28794C9.06334 0.850595 8.84813 0.416954 8.6146 0C6.90671 0.291188 5.23749 0.806064 3.66103 1.52602C0.526635 6.1629 -0.322789 10.6839 0.1019 15.1407C1.93728 16.4963 3.99145 17.5274 6.17518 18.189C6.66488 17.5279 7.10358 16.8242 7.47605 16.0918C6.76544 15.827 6.0797 15.4997 5.42686 15.1139C5.59866 14.9893 5.76666 14.8609 5.92899 14.7363C7.82724 15.6278 9.90142 16.0929 12 16.0929C14.0986 16.0929 16.1727 15.6278 18.0711 14.7362C18.2353 14.8702 18.4033 14.9986 18.5732 15.1137C17.9191 15.5003 17.2321 15.8284 16.5203 16.0943C16.894 16.8282 17.3292 17.5293 17.8211 18.1898C20.0069 17.5303 22.0627 16.4993 23.8985 15.1421L23.898 15.1426C24.3964 9.97413 23.0466 5.49465 20.3303 1.52302ZM8.01319 12.3998C6.82965 12.3998 5.85179 11.3257 5.85179 10.0043C5.85179 8.68295 6.79561 7.59944 8.0094 7.59944C9.22323 7.59944 10.1934 8.68295 10.1727 10.0043C10.1519 11.3257 9.21943 12.3998 8.01319 12.3998ZM15.9867 12.3998C14.8013 12.3998 13.8273 11.3257 13.8273 10.0043C13.8273 8.68295 14.7711 7.59944 15.9867 7.59944C17.2024 7.59944 18.1651 8.68295 18.1444 10.0043C18.1236 11.3257 17.193 12.3998 15.9867 12.3998Z" fill="currentColor" />
                    </svg>
                    <span>194K</span>
                  </div>
                  <span className={styles['ollama-stat-label']}>MEMBERS</span>
                </div>
                <div className={styles['ollama-stat']}>
                  <div className={styles['ollama-stat-value']}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.125 19.2125C4.90833 18.6875 3.84583 17.9708 2.9375 17.0625C2.02917 16.1542 1.3125 15.0917 0.7875 13.875C0.2625 12.6583 0 11.3625 0 9.9875C0 8.6125 0.2625 7.32083 0.7875 6.1125C1.3125 4.90417 2.02917 3.84583 2.9375 2.9375C3.84583 2.02917 4.90833 1.3125 6.125 0.7875C7.34167 0.2625 8.6375 0 10.0125 0C11.3875 0 12.6792 0.2625 13.8875 0.7875C15.0958 1.3125 16.1542 2.02917 17.0625 2.9375C17.9708 3.84583 18.6875 4.90417 19.2125 6.1125C19.7375 7.32083 20 8.6125 20 9.9875C20 11.3625 19.7375 12.6583 19.2125 13.875C18.6875 15.0917 17.9708 16.1542 17.0625 17.0625C16.1542 17.9708 15.0958 18.6875 13.8875 19.2125C12.6792 19.7375 11.3875 20 10.0125 20C8.6375 20 7.34167 19.7375 6.125 19.2125ZM10 17.95C10.4333 17.35 10.8083 16.725 11.125 16.075C11.4417 15.425 11.7 14.7333 11.9 14H8.1C8.3 14.7333 8.55833 15.425 8.875 16.075C9.19167 16.725 9.56667 17.35 10 17.95ZM7.4 17.55C7.1 17 6.8375 16.4292 6.6125 15.8375C6.3875 15.2458 6.2 14.6333 6.05 14H3.1C3.58333 14.8333 4.1875 15.5583 4.9125 16.175C5.6375 16.7917 6.46667 17.25 7.4 17.55ZM12.6 17.55C13.5333 17.25 14.3625 16.7917 15.0875 16.175C15.8125 15.5583 16.4167 14.8333 16.9 14H13.95C13.8 14.6333 13.6125 15.2458 13.3875 15.8375C13.1625 16.4292 12.9 17 12.6 17.55ZM2.25 12H5.65C5.6 11.6667 5.5625 11.3375 5.5375 11.0125C5.5125 10.6875 5.5 10.35 5.5 10C5.5 9.65 5.5125 9.3125 5.5375 8.9875C5.5625 8.6625 5.6 8.33333 5.65 8H2.25C2.16667 8.33333 2.10417 8.6625 2.0625 8.9875C2.02083 9.3125 2 9.65 2 10C2 10.35 2.02083 10.6875 2.0625 11.0125C2.10417 11.3375 2.16667 11.6667 2.25 12ZM7.65 12H12.35C12.4 11.6667 12.4375 11.3375 12.4625 11.0125C12.4875 10.6875 12.5 10.35 12.5 10C12.5 9.65 12.4875 9.3125 12.4625 8.9875C12.4375 8.6625 12.4 8.33333 12.35 8H7.65C7.6 8.33333 7.5625 8.6625 7.5375 8.9875C7.5125 9.3125 7.5 9.65 7.5 10C7.5 10.35 7.5125 10.6875 7.5375 11.0125C7.5625 11.3375 7.6 11.6667 7.65 12ZM14.35 12H17.75C17.8333 11.6667 17.8958 11.3375 17.9375 11.0125C17.9792 10.6875 18 10.35 18 10C18 9.65 17.9792 9.3125 17.9375 8.9875C17.8958 8.6625 17.8333 8.33333 17.75 8H14.35C14.4 8.33333 14.4375 8.6625 14.4625 8.9875C14.4875 9.3125 14.5 9.65 14.5 10C14.5 10.35 14.4875 10.6875 14.4625 11.0125C14.4375 11.3375 14.4 11.6667 14.35 12ZM13.95 6H16.9C16.4167 5.16667 15.8125 4.44167 15.0875 3.825C14.3625 3.20833 13.5333 2.75 12.6 2.45C12.9 3 13.1625 3.57083 13.3875 4.1625C13.6125 4.75417 13.8 5.36667 13.95 6ZM8.1 6H11.9C11.7 5.26667 11.4417 4.575 11.125 3.925C10.8083 3.275 10.4333 2.65 10 2.05C9.56667 2.65 9.19167 3.275 8.875 3.925C8.55833 4.575 8.3 5.26667 8.1 6ZM3.1 6H6.05C6.2 5.36667 6.3875 4.75417 6.6125 4.1625C6.8375 3.57083 7.1 3 7.4 2.45C6.46667 2.75 5.6375 3.20833 4.9125 3.825C4.1875 4.44167 3.58333 5.16667 3.1 6Z" fill="currentColor" />
                    </svg>
                    <span>5M</span>
                  </div>
                  <span className={styles['ollama-stat-label']}>MONTHLY VISITS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02 — Visual Audit */}
      <section className={styles['ollama-section-image']}>
        <div className={styles['ollama-audit-container']}>
          <img src={images.visualAudit.src} alt={images.visualAudit.alt} />
        </div>
      </section>

      {/* Section 03 — Mood Board */}
      <section className={styles['ollama-moodboard-section']}>
        <div className={styles['ollama-moodboard-content']}>
          <h2 className={styles['ollama-moodboard-title']}>Moodboard</h2>
          <div className={styles['ollama-moodboard-collage']}>
            <div className={styles['ollama-moodboard-placeholder']}>
              <svg width="71" height="71" viewBox="0 0 71 71" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5391 35.0703H52.6094M35.0742 52.6055L35.0742 17.5352" stroke="#201F1E" strokeOpacity="0.07" strokeWidth="5.84505" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <img
              className={styles['ollama-moodboard-img-1']}
              src="/images/ollama/moodboard-duolingo.webp"
              alt="Duolingo character expressions reference"
            />
            <img
              className={styles['ollama-moodboard-img-2']}
              src="/images/ollama/moodboard-noritake.webp"
              alt="Noritake illustration style reference"
            />
            <img
              className={styles['ollama-moodboard-img-3']}
              src="/images/ollama/moodboard-notionstack.webp"
              alt="Notion-style character illustrations reference"
            />
            <img
              className={styles['ollama-moodboard-img-4']}
              src="/images/ollama/moodboard-laptopwindow.webp"
              alt="Laptop window illustration reference"
            />
            <img
              className={styles['ollama-moodboard-img-5']}
              src="/images/ollama/moodboard-toast-notion.webp"
              alt="Toast notification illustration reference"
            />
            <img
              className={styles['ollama-moodboard-img-6']}
              src="/images/ollama/moodboard-notiontools.webp"
              alt="Notion tools and integrations reference"
            />
            <img
              className={styles['ollama-moodboard-img-7']}
              src="/images/ollama/moodboard-noritakestare.webp"
              alt="Noritake stare illustration reference"
            />
          </div>
          <p className={styles['ollama-moodboard-description']}>
            A minimalist visual style reminiscent of Noritake&apos;s illustration work, with a mascot as vibrant
            and opinionated as Duolingo — living in terminals and context windows, built for technical audiences.
          </p>
        </div>
      </section>

      {/* Section 04 — Character Bible */}
      <section className={styles['ollama-charbible-section']}>
        <div className={styles['ollama-charbible-content']}>
          <h2 className={styles['ollama-charbible-title']}>Character bible</h2>
          <div className={styles['ollama-expression-grid']}>
            {[
              { name: 'Sunglasses', file: 'sunglasses' },
              { name: 'Party', file: 'party' },
              { name: 'Pleading', file: 'pleading' },
              { name: 'Salute', file: 'salute' },
              { name: 'Crying', file: 'crying' },
              { name: 'Write That Down', file: 'writethatdown' },
              { name: 'Frightened', file: 'frightened' },
              { name: 'ROFL', file: 'rofl' },
              { name: 'Running', file: 'running' },
              { name: 'Drooling', file: 'drooling' },
              { name: 'Thinking', file: 'thinking' },
              { name: 'Smirk', file: 'smirk' },
            ].map((expr) => (
              <div key={expr.file} className={styles['ollama-expression-card']}>
                <img
                  src={`/images/ollama/${expr.file}.webp`}
                  alt={`Ollama ${expr.name} expression`}
                  className={styles['ollama-expression-img']}
                />
                <span className={styles['ollama-expression-label']}>{expr.name}</span>
              </div>
            ))}
          </div>
          <p className={styles['ollama-charbible-description']}>
            A character bible establishes the emotional range of the mascot — each expression becomes an
            atomic unit that gets deployed across posters, announcements, social content, and product
            communications. It&apos;s the foundation everything else is built from.
          </p>
        </div>
      </section>

      {/* Expression Showcase */}
      <section className={styles['ollama-showcase-section']}>
        <ExpressionShowcase />
      </section>

      {/* Section 05 — Product Posters */}
      {/* TODO: Implement */}

      {/* Section 06 — Model Announcements */}
      {/* TODO: Implement */}

      {/* Section 07 — Community & Values */}
      {/* TODO: Implement */}

      {/* Section 08 — Closing */}
      {/* TODO: Implement */}
    </div>
  );
};
