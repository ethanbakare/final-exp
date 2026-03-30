import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../styles/new-home.module.css';
import DemoCard from './DemoCard';

const PreviewOllama = dynamic(() => import('./previews/PreviewOllama'), { ssr: false });
const PreviewTrace = dynamic(() => import('./previews/PreviewTrace'), { ssr: false });

const CarouselDemos: React.FC = () => {
  return (
    <section className="carousel-demos">
      <div className="carousel-header">
        <span className={`${styles.InterMedium16Spaced} header-label`}>AI DEMOS</span>
      </div>

      <div className="container">
        {/* card-4: AI Confidence — col 1-2, row 1 (wide), label top-right */}
        <DemoCard
          label="AI Confidence tracker"
          href="/ai-confidence-tracker"
          labelBg="rgba(128, 34, 63, 0.40)"
          labelPosition="top-right"
          className="card card-ai-confidence"
        >
          <div className="placeholder" />
        </DemoCard>

        {/* card-1: Ollama — col 3, row 1, label bottom-center */}
        <DemoCard
          label="Ollama"
          labelBg="rgba(255, 255, 255, 0.30)"
          labelPosition="bottom-center"
          className="card card-ollama"
        >
          <PreviewOllama />
        </DemoCard>

        {/* card-3: Trace AI — col 4, row 1-2 (tall), label top-left */}
        <DemoCard
          label="Trace AI"
          href="/trace"
          labelBg="rgba(255, 255, 255, 0.30)"
          labelTextColor="rgba(49, 49, 49, 0.70)"
          labelPosition="top-left"
          innerBg="#965935"
          className="card card-trace"
        >
          <PreviewTrace />
        </DemoCard>

        {/* card-2: Voice UI — col 1, row 2, label bottom-center */}
        <DemoCard
          label="Voice UI Library"
          href="/voiceinterface/variations"
          labelBg="rgba(113, 113, 113, 0.50)"
          labelTextColor="rgba(255, 255, 255, 0.80)"
          labelPosition="bottom-center"
          className="card card-voice"
        >
          <div className="placeholder placeholder-light" />
        </DemoCard>

        {/* card-5: Clipstream — col 2-3, row 2 (wide), label bottom-center */}
        <DemoCard
          label="Clipstream"
          href="/clipperstream"
          labelBg="rgba(113, 113, 113, 0.50)"
          labelTextColor="rgba(255, 255, 255, 0.80)"
          labelPosition="bottom-center"
          className="card card-clipstream"
        >
          <div className="placeholder placeholder-light" />
        </DemoCard>
      </div>

      <style jsx>{`
        .carousel-demos {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 10px;
          width: 100%;
          overflow: visible;
        }

        @media (max-width: 620px) {
          .carousel-demos {
            padding: 0 20px;
            box-sizing: border-box;
          }
        }

        .carousel-header {
          display: flex;
          padding-bottom: 20px;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .header-label {
          color: var(--white-25);
          text-align: center;
        }

        .container {
          display: grid;
          grid-template-columns: repeat(4, 282px);
          grid-template-rows: 321px 321px;
          gap: 10px;
          justify-content: center;
        }

        .container :global(.card-ai-confidence) {
          grid-column: 1 / span 2;
          grid-row: 1;
        }

        .container :global(.card-ollama) {
          grid-column: 3;
          grid-row: 1;
        }

        .container :global(.card-trace) {
          grid-column: 4;
          grid-row: 1 / span 2;
        }

        .container :global(.card-voice) {
          grid-column: 1;
          grid-row: 2;
        }

        .container :global(.card-clipstream) {
          grid-column: 2 / span 2;
          grid-row: 2;
        }

        .placeholder {
          width: 100%;
          height: 100%;
        }

        .placeholder-dark {
          background: #1A1A19;
        }

        .placeholder-light {
          background: #F7F6F4;
        }

        /* Tablet: rearrange to 2 columns when 4-col no longer fits */
        @media (max-width: 1200px) {
          .container {
            grid-template-columns: repeat(2, 282px);
            grid-template-rows: 321px 321px 321px 321px;
            justify-content: center;
          }

          .container :global(.card-ai-confidence) {
            grid-column: 1 / span 2;
            grid-row: 1;
          }

          .container :global(.card-ollama) {
            grid-column: 1;
            grid-row: 2;
          }

          .container :global(.card-trace) {
            grid-column: 2;
            grid-row: 2 / span 2;
          }

          .container :global(.card-voice) {
            grid-column: 1;
            grid-row: 3;
          }

          .container :global(.card-clipstream) {
            grid-column: 1 / span 2;
            grid-row: 4;
          }
        }

        /* Mobile: single column, full width, preserve aspect ratios */
        @media (max-width: 620px) {
          .container {
            width: 100%;
            grid-template-columns: 1fr;
            grid-template-rows: auto;
          }

          .container :global(.card-ai-confidence),
          .container :global(.card-ollama),
          .container :global(.card-trace),
          .container :global(.card-voice),
          .container :global(.card-clipstream) {
            grid-column: 1;
            grid-row: auto;
          }

          /* Wide cards: 575 x 321 → ~1.79:1 */
          .container :global(.card-ai-confidence),
          .container :global(.card-clipstream) {
            aspect-ratio: 575 / 321;
          }

          /* Standard cards: 282.5 x 321 → ~0.88:1 */
          .container :global(.card-ollama),
          .container :global(.card-voice) {
            aspect-ratio: 282.5 / 321;
          }

          /* Tall card: 282.5 x 652 → ~0.43:1 */
          .container :global(.card-trace) {
            aspect-ratio: 282.5 / 652;
          }
        }
      `}</style>
    </section>
  );
};

export default CarouselDemos;
