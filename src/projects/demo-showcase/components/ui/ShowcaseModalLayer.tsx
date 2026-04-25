import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ShowcaseModalOptions } from '@/projects/demo-showcase/context/ShowcaseModalContext';

interface ShowcaseModalLayerProps {
  modal: ShowcaseModalOptions | null;
  closeModal: () => void;
}

export const ShowcaseModalLayer: React.FC<ShowcaseModalLayerProps> = ({
  modal,
  closeModal,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!modal) {
      setIsAnimatingIn(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      setIsAnimatingIn(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [modal]);

  useEffect(() => {
    if (!modal) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (modal.onRequestClose) {
          modal.onRequestClose();
          return;
        }
        closeModal();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [modal, closeModal]);

  if (!isMounted || !modal) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || modal.closeOnBackdropClick === false) return;

    if (modal.onRequestClose) {
      modal.onRequestClose();
      return;
    }

    closeModal();
  };

  return createPortal(
    <>
      <div
        className="showcase-modal-overlay"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
      >
        <div className={`showcase-modal-content ${isAnimatingIn ? 'animate-in' : ''}`}>
          {modal.content}
        </div>
      </div>

      <style jsx>{`
        .showcase-modal-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(28, 25, 23, 0.85);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          z-index: 1000;
          user-select: none;
        }

        @supports not (backdrop-filter: blur(3px)) {
          .showcase-modal-overlay {
            background: rgba(28, 25, 23, 0.95);
          }
        }

        .showcase-modal-content {
          transform: scale(0.85);
          opacity: 0;
          transition:
            transform 150ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 100ms ease-out;
        }

        .showcase-modal-content.animate-in {
          transform: scale(1);
          opacity: 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .showcase-modal-content {
            transition: none;
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>,
    document.body,
  );
};
