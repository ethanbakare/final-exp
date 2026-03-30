import React from 'react';
import styles from '../styles/new-home.module.css';

const HeroBanner: React.FC = () => {
  return (
    <section className="hero-banner">
      <div className="hero-component">
        <div className="hero-text-group">
          <div className="hero-headlines">
            <h1 className={styles.FrankRuhlLibre30}>
              Software can now think{'\n'}what should using it feel like?
            </h1>
            <p className={`${styles.InterRegular16} hero-subtitle`}>
              I build prototypes that make interacting with thinking software (AI) feel intuitive
            </p>
          </div>
          <span className={`${styles.InterRegular14} hero-credential`}>
            M.Sc in AI (2020) &middot; 4 prototypes and counting
          </span>
        </div>

        <div className="hero-cta-group">
          <button className="btn-outline">
            <span className={styles.HedvigLettersSans16}>View all Projects</span>
          </button>
          <button className="btn-solid">
            <span className={styles.HedvigLettersSans16}>View Demos</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .hero-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 163px 0 15px;
          width: 100%;
        }

        .hero-component {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 1160px;
          padding: 0 116px;
          gap: 103px;
          width: 100%;
          box-sizing: border-box;
        }

        .hero-text-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 17px;
          width: 100%;
        }

        .hero-headlines {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 23px;
          width: 100%;
        }

        h1 {
          color: var(--white-90);
          text-align: center;
          margin: 0;
          white-space: pre-line;
        }

        .hero-subtitle {
          color: var(--white-60);
          text-align: center;
          margin: 0;
        }

        .hero-credential {
          color: var(--white-20);
          text-align: center;
        }

        .hero-cta-group {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: 16px;
        }

        .btn-outline,
        .btn-solid {
          display: flex;
          padding: 12px 16px;
          justify-content: center;
          align-items: center;
          gap: 10px;
          border-radius: 18px;
          cursor: pointer;
          border: none;
        }

        .btn-outline {
          background: transparent;
          border: 2px solid rgba(94, 94, 94, 0.40);
        }

        .btn-outline span {
          color: #5E5E5E;
        }

        .btn-solid {
          background: var(--accent-orange);
        }

        .btn-solid span {
          color: #FFFFFF;
        }

        @media (max-width: 768px) {
          .hero-component {
            padding: 0 24px;
            gap: 56px;
          }

          .hero-banner {
            padding: 120px 0 15px;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroBanner;
