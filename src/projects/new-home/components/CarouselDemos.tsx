import React from 'react';
import styles from '../styles/new-home.module.css';
import DemoCard from './DemoCard';

const CarouselDemos: React.FC = () => {
  return (
    <section className="carousel-demos">
      <div className="carousel-header">
        <span className={`${styles.InterMedium16Spaced} header-label`}>AI DEMOS</span>
      </div>

      <div className="container">
        {/* card-4: AI Confidence — col 1-2, row 1 (wide) */}
        <DemoCard
          label="AI Confidence tracker"
          href="/ai-confidence-tracker"
          labelBg="rgba(128, 34, 63, 0.40)"
          className="card card-ai-confidence"
        >
          <div className="placeholder" />
        </DemoCard>

        {/* card-1: Ollama — col 3, row 1 */}
        <DemoCard
          label="Ollama"
          className="card card-ollama"
        >
          <div className="placeholder" />
        </DemoCard>

        {/* card-3: Trace AI — col 4, row 1-2 (tall) */}
        <DemoCard
          label="Trace AI"
          href="/trace"
          labelBg="rgba(255, 255, 255, 0.30)"
          labelTextColor="rgba(49, 49, 49, 0.70)"
          innerBg="#965935"
          className="card card-trace"
        >
          <div className="placeholder" />
        </DemoCard>

        {/* card-2: Voice UI — col 1, row 2 */}
        <DemoCard
          label="Voice UI Library"
          href="/voiceinterface/variations"
          labelBg="rgba(113, 113, 113, 0.50)"
          labelTextColor="rgba(255, 255, 255, 0.80)"
          className="card card-voice"
        >
          <div className="placeholder" />
        </DemoCard>

        {/* card-5: Clipstream — col 2-3, row 2 (wide) */}
        <DemoCard
          label="Clipstream"
          href="/clipperstream"
          labelBg="rgba(113, 113, 113, 0.50)"
          labelTextColor="rgba(255, 255, 255, 0.80)"
          className="card card-clipstream"
        >
          <div className="placeholder" />
        </DemoCard>
      </div>

      <style jsx>{`
        .carousel-demos {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 10px;
          max-width: 1160px;
          width: 100%;
          padding: 0 20px;
          box-sizing: border-box;
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
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: 321px 321px;
          gap: 10px;
          width: 100%;
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
          background: var(--card-inner-bg);
        }

        @media (max-width: 768px) {
          .container {
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

          .container :global(.card) {
            min-height: 280px;
          }
        }
      `}</style>
    </section>
  );
};

export default CarouselDemos;
