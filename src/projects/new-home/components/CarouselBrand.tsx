import React from 'react';
import styles from '../styles/new-home.module.css';
import DemoCard from './DemoCard';

const brandCards = [
  { label: 'Eldugo - Branding', image: '/images/new-home/brand/eldugo.webp', href: '/portfolio2025/eldugo' },
  { label: 'Logofolio', image: '/images/new-home/brand/logofolio.webp', href: '/portfolio2025/logo' },
  { label: 'ActiveLedger - Branding', image: '/images/new-home/brand/activeledger.webp', href: '/portfolio2025/activeledger' },
  { label: 'Magma - Pitch Deck', image: '/images/new-home/brand/magma.webp', href: '/portfolio2025/magmadeck' },
  { label: 'ACT - Pitch Deck', image: '/images/new-home/brand/act.webp', href: '/portfolio2025/actdeck' },
  { label: 'Made for Humans - Illustration', image: '/images/new-home/brand/made-for-humans.webp', href: '/madeforhumans' },
];

const CarouselBrand: React.FC = () => {
  return (
    <section className="carousel-brand">
      <div className="carousel-header">
        <span className={`${styles.InterMedium16Spaced} header-label`}>BRAND DESIGN WORK</span>
        <span className={`${styles.InterRegular16} header-subtitle`}>
          Crafting visual narratives for startups since 2018
        </span>
      </div>

      <div className="container">
        {brandCards.map((card, i) => (
          <DemoCard
            key={i}
            label={card.label}
            href={card.href}
            labelBg="rgba(34, 34, 34, 0.70)"
            className="card"
          >
            <img
              src={card.image}
              alt={card.label}
              className="card-image"
              draggable={false}
            />
          </DemoCard>
        ))}
      </div>

      <style jsx>{`
        .carousel-brand {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 40px;
          max-width: 1160px;
          width: 100%;
          padding: 154px 20px 116px;
          box-sizing: border-box;
        }

        .carousel-header {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 10px;
          padding-bottom: 20px;
          width: 100%;
        }

        .header-label {
          color: var(--white-25);
          text-align: center;
        }

        .header-subtitle {
          color: var(--white-60);
          text-align: center;
        }

        .container {
          display: grid;
          grid-template-columns: repeat(3, 381px);
          grid-auto-rows: 298px;
          gap: 15px;
          justify-content: center;
        }

        .container :global(.card-image) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Rearrange to 2 columns, keep card size */
        @media (max-width: 1200px) {
          .container {
            grid-template-columns: repeat(2, 381px);
          }
        }

        /* Single column, full width, keep aspect ratio */
        @media (max-width: 800px) {
          .container {
            grid-template-columns: 1fr;
            grid-auto-rows: auto;
          }

          .container :global(.card) {
            aspect-ratio: 381 / 298;
          }

          .carousel-brand {
            padding: 80px 20px 60px;
          }
        }
      `}</style>
    </section>
  );
};

export default CarouselBrand;
