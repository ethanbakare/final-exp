import React from 'react';
import styles from '@/projects/ollama/styles/ollama.module.css';
import { Terminal } from './Terminal';
import { OllamaMascot } from './OllamaMascot';

interface OllamaImage {
  src: string;
  alt: string;
}

interface OllamaLayoutProps {
  images: {
    // Section 01 - Hero
    // (mascot is a component, no image prop needed)
    // Section 02 - Visual Audit
    visualAudit: OllamaImage;
    // Section 03 - Mood Board
    moodboard: OllamaImage;
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
 * Displays the Ollama brand case study page.
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
            <div className={styles['ollama-terminal-group']}>
              <OllamaMascot />
              <Terminal />
            </div>
          </div>
          <div className={styles['ollama-hero-body']}>
            <div className={styles['ollama-description-wrapper']}>
              <p className={styles['ollama-hero-description']}>
                Ollama helps people run LLM&apos;s locally on their laptops. Whilst spotting a mascot
                central to its brand identity and communication giving the technical product a more
                approachable presence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02 — Visual Audit */}
      {/* TODO: Implement */}

      {/* Section 03 — Mood Board */}
      {/* TODO: Implement */}

      {/* Section 04 — Character Bible */}
      {/* TODO: Implement */}

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
