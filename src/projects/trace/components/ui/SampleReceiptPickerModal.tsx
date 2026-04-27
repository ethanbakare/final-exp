/**
 * SampleReceiptPickerModal — carousel + caption + Upload pill.
 *
 * Pure presentation. Doesn't open or close itself; the caller mounts
 * this inside whatever modal layer they're using (in phase 1 that's
 * the showcase ShowcaseModalLayer; in phase 2 the standalone TraceCore
 * will mount it inside TraceModalOverlay).
 *
 * Layout (per docs/trace/RECEIPT-PICKER-MODAL.md §7):
 *   - Mobile:  centered receipt only, drag-swipe to navigate.
 *   - Desktop: centered receipt + peeks of adjacent receipts at
 *              opacity 0.45 / height 60% / blur 10px. Click peek to
 *              navigate; keyboard arrows also work.
 *
 * Live disabled state (§5.3.2):
 *   - Modal subscribes to TraceCore's isSamplePickerDisabled flag via
 *     React.useSyncExternalStore so the Upload button can dim live
 *     when navbarState flips mid-modal (e.g. a kill-switch abort).
 *   - Carousel navigation stays interactive even when disabled — user
 *     can still browse, just can't commit (§5.2).
 */
'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { SampleReceipt } from '../../data/sample-receipts';

interface SampleReceiptPickerModalProps {
  receipts: SampleReceipt[];
  initialIndex: number;
  onUpload: (receipt: SampleReceipt) => void | Promise<void>;
  onClose: () => void;
  /** External-store pair for live disabled state — see §5.3.2. */
  subscribeIsDisabled: (callback: () => void) => () => void;
  getIsDisabled: () => boolean;
}

// Distance the user needs to drag horizontally before a swipe commits.
// Tuned to feel deliberate — small enough to feel responsive, large
// enough that an accidental tap doesn't register as a swipe.
const DRAG_THRESHOLD_PX = 50;

export const SampleReceiptPickerModal: React.FC<SampleReceiptPickerModalProps> = ({
  receipts,
  initialIndex,
  onUpload,
  onClose,
  subscribeIsDisabled,
  getIsDisabled,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);

  // Live disabled state from TraceCore — see §5.3.2.
  const isDisabled = useSyncExternalStore(subscribeIsDisabled, getIsDisabled);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(receipts.length - 1, i + 1));
  }, [receipts.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  // Keyboard nav: ←/→ to step. Esc is handled by the modal layer.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goNext();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev]);

  // Pointer-based drag (works for both touch and mouse).
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartXRef.current = e.clientX;
    setIsDragging(true);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragOffsetX(e.clientX - dragStartXRef.current);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffsetX < -DRAG_THRESHOLD_PX) {
      goNext();
    } else if (dragOffsetX > DRAG_THRESHOLD_PX) {
      goPrev();
    }
    setDragOffsetX(0);
  };

  const currentReceipt = receipts[currentIndex];
  const prevReceipt = currentIndex > 0 ? receipts[currentIndex - 1] : null;
  const nextReceipt =
    currentIndex < receipts.length - 1 ? receipts[currentIndex + 1] : null;

  const handleUploadClick = () => {
    if (isDisabled) return;
    void onUpload(currentReceipt);
  };

  return (
    <div className="picker-modal" role="dialog" aria-label="Choose a sample receipt">
      {/* Close button — top-right corner. The backdrop also dismisses
          (handled by the surrounding modal layer). */}
      <button
        type="button"
        className="close-btn"
        onClick={onClose}
        aria-label="Close picker"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Caption — describes what makes this receipt a useful test case. */}
      <div className="caption" aria-live="polite">
        {currentReceipt.caption}
      </div>

      {/* Carousel: peeks (desktop only) flank the center receipt. */}
      <div
        className="carousel"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {prevReceipt && (
          <button
            type="button"
            className="peek peek-left"
            onClick={goPrev}
            aria-label={`Previous: ${prevReceipt.alt}`}
          >
            <img src={prevReceipt.src} alt="" draggable={false} />
          </button>
        )}

        <div
          className={`center ${isDragging ? 'dragging' : ''}`}
          style={{ transform: `translateX(${dragOffsetX}px)` }}
        >
          <img
            src={currentReceipt.src}
            alt={currentReceipt.alt}
            draggable={false}
          />
        </div>

        {nextReceipt && (
          <button
            type="button"
            className="peek peek-right"
            onClick={goNext}
            aria-label={`Next: ${nextReceipt.alt}`}
          >
            <img src={nextReceipt.src} alt="" draggable={false} />
          </button>
        )}
      </div>

      {/* Page indicator dots. */}
      <div className="dots" role="tablist" aria-label="Receipt position">
        {receipts.map((r, i) => (
          <button
            key={r.id}
            type="button"
            className={`dot ${i === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to receipt ${i + 1} of ${receipts.length}`}
            aria-selected={i === currentIndex}
            role="tab"
          />
        ))}
      </div>

      {/* Upload pill — disabled live via §5.3.2 when navbar is non-idle. */}
      <button
        type="button"
        className="upload-pill"
        onClick={handleUploadClick}
        disabled={isDisabled}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M15.94 8.95L15.94 6.51C15.94 5.97 15.72 5.45 15.33 5.07L13.23 3.04C12.85 2.68 12.35 2.48 11.84 2.48L6.28 2.48C5.17 2.48 4.27 3.38 4.27 4.48L4.28 8.95M4.27 15.32L4.27 15.52C4.27 16.63 5.17 17.52 6.27 17.52L13.94 17.52C15.04 17.52 15.94 16.62 15.94 15.52L15.94 15.32M2.35 11.85L17.65 11.85"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>Upload</span>
      </button>

      <style jsx>{`
        .picker-modal {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding: 56px 24px 32px;
          width: min(680px, 92vw);
          max-height: 90vh;
        }

        /* Close button — top-right corner of the modal box. */
        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          cursor: pointer;
          transition: background 150ms ease, transform 100ms ease;
        }
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .close-btn:active {
          transform: scale(0.95);
        }

        /* Caption — short descriptive line about the current receipt. */
        .caption {
          color: #ffffff;
          font-size: 16px;
          font-weight: 500;
          text-align: center;
          line-height: 1.4;
          max-width: 420px;
          padding: 0 16px;
        }

        /* Carousel: row of [peek-left | center | peek-right] on desktop;
           just the center on mobile. The center stretches; peeks are
           absolutely positioned on the outside edges. */
        .carousel {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          touch-action: pan-y; /* allow vertical scroll, capture horizontal */
        }

        .center {
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .center.dragging {
          transition: none;
        }
        .center img {
          display: block;
          height: 60vh;
          max-height: 600px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }

        /* Peeks — desktop only. Hidden on mobile via media query below. */
        .peek {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          opacity: 0.45;
          filter: blur(10px);
          z-index: 1;
          transition: opacity 200ms ease;
        }
        .peek:hover {
          opacity: 0.6;
        }
        .peek img {
          display: block;
          height: 36vh; /* 60% of center's 60vh */
          max-height: 360px;
          width: auto;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }
        .peek-left {
          left: -20px;
          transform: translate(-50%, -50%);
        }
        .peek-right {
          right: -20px;
          transform: translate(50%, -50%);
        }
        .peek-left:hover {
          transform: translate(-48%, -50%);
        }
        .peek-right:hover {
          transform: translate(48%, -50%);
        }

        @media (max-width: 768px) {
          .peek {
            display: none;
          }
          .picker-modal {
            padding: 56px 16px 24px;
            gap: 20px;
          }
          .center img {
            height: 55vh;
          }
        }

        /* Page dots */
        .dots {
          display: flex;
          gap: 8px;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          padding: 0;
          background: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: background 150ms ease, transform 100ms ease;
        }
        .dot:hover {
          background: rgba(255, 255, 255, 0.55);
        }
        .dot.active {
          background: #ffffff;
        }
        .dot:active {
          transform: scale(0.85);
        }

        /* Upload pill — primary action. */
        .upload-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 44px;
          padding: 0 24px;
          border: none;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.92);
          color: #1c1917;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 150ms ease, transform 100ms ease, background 150ms ease;
        }
        .upload-pill:hover:not(:disabled) {
          background: #ffffff;
        }
        .upload-pill:active:not(:disabled) {
          transform: scale(0.97);
        }
        .upload-pill:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
