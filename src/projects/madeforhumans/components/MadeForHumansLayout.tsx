import React, { useState, useCallback } from 'react';
import styles from '../styles/madeforhumans.module.css';
import { ILLUSTRATIONS } from '../data/illustrations';

const MadeForHumansLayout: React.FC = () => {
  const [modalImage, setModalImage] = useState<{ src: string; alt: string } | null>(null);

  const openModal = useCallback((src: string, alt: string) => {
    setModalImage({ src, alt });
  }, []);

  const closeModal = useCallback(() => {
    setModalImage(null);
  }, []);

  return (
    <div className={`${styles.container} ${styles.pageContainer}`}>
      {/* Header: Logo + Tagline */}
      <div className={styles.headerSection}>
        <div className={styles.logoWrapper}>
          <img
            src="/images/madeforhumans/logo.webp"
            alt="Made for Humans"
            className={styles.logo}
          />
        </div>
        <div className={styles.taglineBadge}>
          <span className={styles.taglineText}>Making AI relatable, one comic at a time</span>
        </div>
      </div>

      {/* Intro Text */}
      <div className={styles.introSection}>
        <p className={styles.introText}>
          Ever had those dinner table debates or water cooler chats about AI taking over?
          Well that&apos;s where we come in, shining a lens on everyday AI moments that make
          you laugh, think and maybe even debate a little.
        </p>
      </div>

      {/* Image Grid */}
      <section className={styles.gridSection}>
        <div className={styles.gridContainer}>
          <div className={styles.grid}>
            {ILLUSTRATIONS.map((illust) => (
              <div key={illust.id} className={styles.gridItem}>
                <button
                  className={styles.imageButton}
                  onClick={() => openModal(illust.main, illust.title)}
                  aria-label={`View ${illust.title}`}
                >
                  <img
                    src={illust.main}
                    alt={illust.title}
                    className={styles.gridImage}
                    loading="lazy"
                    draggable={false}
                  />
                </button>
                <div className={styles.imageTitle}>{illust.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {modalImage && (
        <div
          className={styles.modalOverlay}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={closeModal}
              aria-label="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14.5 12l9-9a1.77 1.77 0 00-2.5-2.5l-9 9-9-9A1.77 1.77 0 00.5 3l9 9-9 9a1.77 1.77 0 002.5 2.5l9-9 9 9a1.77 1.77 0 002.5-2.5l-9-9z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <img
              src={modalImage.src}
              alt={modalImage.alt}
              className={styles.modalImage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MadeForHumansLayout;
