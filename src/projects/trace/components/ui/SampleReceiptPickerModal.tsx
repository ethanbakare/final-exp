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
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import type { SampleReceipt } from '../../data/sample-receipts';

// useLayoutEffect logs an SSR warning; on the server we transparently fall
// back to useEffect since DOM measurement is meaningless there anyway.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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

// Movement past this point promotes the gesture from "tap" to "drag".
// Below this we don't capture the pointer, so a tap on a peek button
// still propagates as a native click.
const DRAG_ARM_PX = 5;

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

  // Mobile-only close button portals to document.body so it can pin to
  // the viewport corner (mobile modal is full-width-ish, so the modal's
  // own top-right is also the viewport's). The portal is needed because
  // the showcase modal layer's transform/backdrop-filter create a
  // containing block that breaks position: fixed for descendants.
  // Guarded with a mounted flag to avoid SSR mismatch.
  const [bodyMounted, setBodyMounted] = useState(false);
  useEffect(() => setBodyMounted(true), []);

  // Carousel layout measurement.
  //
  // The track is a flex row of all receipts; we translate it in pixels to
  // keep the active slide horizontally centered. That requires knowing
  // the carousel's actual rendered width, which we read once with a sync
  // layout effect (no first-paint flash) and then keep in sync via
  // ResizeObserver for window resizes / modal-width changes.
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselWidth, setCarouselWidth] = useState(0);
  useIsomorphicLayoutEffect(() => {
    if (!carouselRef.current) return;
    // Use offsetWidth + ResizeObserver.contentRect — both report the
    // layout-box width, which is independent of any transform that may
    // be in flight on an ancestor (e.g. the showcase modal layer's
    // scale-in entrance animation). getBoundingClientRect includes
    // transforms and would lock in a too-small measurement during that
    // initial frame.
    setCarouselWidth(carouselRef.current.offsetWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === 'number') setCarouselWidth(w);
    });
    ro.observe(carouselRef.current);
    return () => ro.disconnect();
  }, []);

  // Breakpoint state. On desktop each slide takes 70% of the carousel so
  // adjacent peeks are visible at the edges; on mobile slides are 100%
  // wide so only the active is visible (peeks are offscreen via overflow).
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 769px)');
    setIsDesktop(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Live disabled state from TraceCore — see §5.3.2.
  const isDisabled = useSyncExternalStore(subscribeIsDisabled, getIsDisabled);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(receipts.length - 1, i + 1));
  }, [receipts.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  // Keyboard nav: ←/→ to step. Esc is handled by the modal layer.
  // After arrow-key navigation we blur whichever slide currently has
  // focus so its focus ring doesn't linger on a now-inactive receipt
  // (focus follows the DOM node, not the active class). Mouse clicks
  // are handled by :focus-visible in CSS, which suppresses the outline
  // for non-keyboard focus.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (e.key === 'ArrowRight') goNext();
        else goPrev();
        e.preventDefault();
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && focused.classList.contains('slide')) {
          focused.blur();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev]);

  // Pointer-based drag (works for both touch and mouse).
  //
  // pointermove fires on hover too, not just during drag. We gate every
  // movement on pointerDownRef so a bare cursor passing over the carousel
  // never moves the receipt. Only after pointerdown — and only after
  // movement passes DRAG_ARM_PX — do we capture the pointer and start
  // translating. Below that threshold the gesture stays a tap and the
  // native click reaches whichever child was hit (peek button, dot).
  const pointerDownRef = useRef(false);
  const pointerArmedRef = useRef(false);
  const justDraggedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartXRef.current = e.clientX;
    pointerDownRef.current = true;
    pointerArmedRef.current = false;
    setDragOffsetX(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDownRef.current) return;
    const offset = e.clientX - dragStartXRef.current;
    if (!pointerArmedRef.current) {
      if (Math.abs(offset) < DRAG_ARM_PX) return;
      pointerArmedRef.current = true;
      setIsDragging(true);
      // setPointerCapture can throw NotFoundError if the underlying pointer
      // was released between pointerdown and this move (browser quirk after
      // pointercancel, rapid input, or synthetic event dispatch). The drag
      // works without capture in the common case — only edge case is
      // losing tracking if the cursor leaves the carousel mid-drag, which
      // is rare with a full-width carousel. Non-fatal either way.
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    setDragOffsetX(offset);
  };

  const handlePointerUp = () => {
    pointerDownRef.current = false;
    if (!pointerArmedRef.current) {
      // Pure tap — let click propagate to peek/dot/etc.
      return;
    }
    pointerArmedRef.current = false;
    setIsDragging(false);
    // Suppress the imminent click that browsers fire on whichever element
    // the gesture started on (often a peek), so a swipe-from-peek doesn't
    // double-navigate.
    justDraggedRef.current = true;
    if (dragOffsetX < -DRAG_THRESHOLD_PX) {
      goNext();
    } else if (dragOffsetX > DRAG_THRESHOLD_PX) {
      goPrev();
    }
    setDragOffsetX(0);
  };

  const consumeJustDragged = () => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return true;
    }
    return false;
  };

  const currentReceipt = receipts[currentIndex];

  // Track translation in px. Centers the active slide:
  //   trackOffset = (carouselW - slideW) / 2 - currentIndex * slideW + dragX
  // Falls back to 0 until carouselWidth has been measured (slides are
  // gated on width > 0 below so nothing renders mis-positioned).
  //
  // Slot width determines how much of each adjacent peek shows: slot
  // takes the center, leaving (1 - slidePercent) / 2 of carousel on each
  // side for peek content. At 0.5 each peek has 25% of carousel — enough
  // to read the receipt outline rather than just a thin sliver.
  const slidePercent = isDesktop ? 0.5 : 1.0;
  const slideWidthPx = carouselWidth * slidePercent;
  const trackOffsetX =
    (carouselWidth - slideWidthPx) / 2 -
    currentIndex * slideWidthPx +
    dragOffsetX;

  const handleUploadClick = () => {
    if (isDisabled) return;
    void onUpload(currentReceipt);
  };

  // Two close buttons, one per breakpoint:
  //   - Desktop: inline inside .picker-modal so it sits at the modal's
  //     top-right corner (viewport corner is too far on wide screens).
  //   - Mobile: portaled to document.body, fixed to the viewport top-right.
  //     Required because the modal is full-width on mobile, so an inline
  //     button would crowd the caption text.
  // Each is hidden at the other breakpoint via CSS.
  const mobileCloseButton = (
    <button
      type="button"
      className="sample-picker-close-mobile"
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
  );

  return (
    <div className="picker-modal" role="dialog" aria-label="Choose a sample receipt">
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
      {bodyMounted && createPortal(mobileCloseButton, document.body)}

      {/* Caption — describes what makes this receipt a useful test case. */}
      <div className="caption" aria-live="polite">
        {currentReceipt.caption}
      </div>

      {/* Carousel: track-based slider. All receipts live on a single
          horizontal flex track; the track translates in pixels to keep
          the active slide centered. Each slide's CSS class (active vs
          peek) drives its size/blur, so when currentIndex changes the
          track translation and the slide-style transitions run together
          and the previously-active slide visibly shrinks + blurs while
          the incoming peek visibly grows + clears. */}
      <div
        className="carousel"
        ref={carouselRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className={`track ${isDragging ? 'dragging' : ''}`}
          style={{ transform: `translate3d(${trackOffsetX}px, 0, 0)` }}
        >
          {carouselWidth > 0 &&
            receipts.map((r, i) => {
              const distance = i - currentIndex;
              const isActive = distance === 0;
              // Only the immediate peek on each side is rendered visibly;
              // anything further away fades out so the carousel doesn't
              // bleed multiple receipts into the modal padding (overflow:
              // visible on the carousel lets every slide render, but only
              // the directly adjacent ones should be readable).
              const cls = isActive
                ? 'active'
                : Math.abs(distance) === 1
                  ? distance < 0 ? 'peek-left' : 'peek-right'
                  : 'far';
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`slide ${cls}`}
                  style={{ width: `${slideWidthPx}px` }}
                  onClick={() => {
                    if (consumeJustDragged()) return;
                    if (i !== currentIndex) setCurrentIndex(i);
                  }}
                  aria-label={isActive ? r.alt : `Go to ${r.alt}`}
                  aria-current={isActive ? 'true' : undefined}
                  tabIndex={isActive ? -1 : 0}
                >
                  <img
                    src={r.src}
                    alt={isActive ? r.alt : ''}
                    draggable={false}
                  />
                </button>
              );
            })}
        </div>
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

        /* Desktop close button — anchored to the picker-modal's top-right
           corner. Hidden on mobile; the portaled .sample-picker-close-mobile
           takes over there (see :global block below). */
        .close-btn {
          position: absolute;
          top: 24px;
          right: 24px;
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
          z-index: 2;
          transition:
            background 160ms cubic-bezier(0.23, 1, 0.32, 1),
            transform 100ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (hover: hover) and (pointer: fine) {
          .close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        }
        .close-btn:active {
          transform: scale(0.95);
        }

        /* Mobile close button — portaled to document.body and pinned to
           the viewport top-right. Portal escapes the showcase modal
           layer's transform/backdrop-filter (both create containing
           blocks that break position: fixed). Styles are :global because
           styled-jsx drops its scoping hash on portaled elements.
           Hidden by default; activated by the mobile media query. */
        :global(.sample-picker-close-mobile) {
          display: none;
          position: fixed;
          top: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          cursor: pointer;
          z-index: 1001;
          transition:
            background 160ms cubic-bezier(0.23, 1, 0.32, 1),
            transform 100ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        :global(.sample-picker-close-mobile):active {
          transform: scale(0.95);
        }

        /* Caption — short descriptive line about the current receipt.
           min-height reserves 2 lines of space so single-line captions
           don't cause the carousel/dots/upload pill to jump up by a line
           on swipe. align-items: flex-end keeps short text hugging the
           receipt below, so caption-to-receipt distance stays constant. */
        .caption {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          min-height: 2.8em;
          color: #ffffff;
          font-size: 16px;
          font-weight: 500;
          text-align: center;
          line-height: 1.4;
          max-width: 420px;
          padding: 0 16px;
        }

        /* Carousel — fixed-height window. Overflow is *visible* so peeks
           can extend past the carousel into the modal's padding area
           rather than being sliced at the edge (the old design did this
           too — peeks faded into the modal background, no hard clip).
           The modal itself + the showcase modal layer handle outer
           clipping. */
        .carousel {
          position: relative;
          width: 100%;
          height: 60vh;
          max-height: 600px;
          overflow: visible;
          touch-action: pan-y; /* allow vertical scroll, capture horizontal */
        }

        /* Track — flex row of all slides, translated as a unit. Strong
           ease-out matching the rest of the picker (see
           docs/skills/emil-design-eng.md §Animation Decision Framework).
           When the user is mid-drag we drop the transition so the track
           snaps to the finger; on release the class clears and the snap
           animates. */
        .track {
          display: flex;
          height: 100%;
          align-items: center;
          will-change: transform;
          transition: transform 320ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .track.dragging {
          transition: none;
        }

        /* Slides — each is a button so peeks are clickable to navigate.
           Width is set inline (px) from the measured carousel size.
           Default styling matches mobile (no peek dimming); the desktop
           media query below adds the scaled-down + blurred peek state. */
        .slide {
          flex-shrink: 0;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          transition:
            transform 320ms cubic-bezier(0.23, 1, 0.32, 1),
            opacity 320ms cubic-bezier(0.23, 1, 0.32, 1),
            filter 320ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        /* Suppress the default focus outline for mouse/touch clicks —
           it lingered on whichever slide was clicked and looked like a
           sticky bounding box around an old receipt after navigation.
           :focus-visible still applies the outline for keyboard focus
           so accessibility is preserved. */
        .slide:focus {
          outline: none;
        }
        .slide:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.6);
          outline-offset: 4px;
          border-radius: 8px;
        }
        .slide.active {
          transform: scale(1);
          opacity: 1;
          filter: none;
          cursor: default;
          /* Stack above peeks so any visual overlap shows the active
             receipt cleanly on top. */
          z-index: 2;
        }
        /* Default (mobile) peek state: adjacent slides match active so a
           drag reveals normally-sized receipts. Desktop overrides below. */
        .slide.peek-left,
        .slide.peek-right {
          transform: scale(1);
          opacity: 1;
          filter: none;
        }
        /* Slides further than one step from active fade out so they
           don't bleed past the immediate peek into the modal padding. */
        .slide.far {
          opacity: 0;
          pointer-events: none;
        }
        .slide img {
          display: block;
          height: 100%;
          width: auto;
          /* No max-width: image renders at its natural width given the
             height (active = full carousel height). max-width: 100% would
             shrink the active image to the slot width and make it look
             smaller than intended. */
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }

        @media (min-width: 769px) {
          /* Desktop peeks — small, dim, blurred. translateX shifts each
             peek toward the active slide so its visible content sits at
             the inner edge of its slot (carousel viewport boundary)
             rather than centered in a mostly-offscreen slot. The 20%
             value matches the slot's empty-margin-after-scale: with
             scale(0.6) the content fills 60% of the slot; the remaining
             40% is split 20% on each side, so 20% of nudge places the
             content flush against one side. */
          .slide.peek-left {
            transform: translateX(20%) scale(0.6);
            opacity: 0.45;
            filter: blur(5px);
          }
          .slide.peek-right {
            transform: translateX(-20%) scale(0.6);
            opacity: 0.45;
            filter: blur(5px);
          }
        }
        @media (hover: hover) and (pointer: fine) and (min-width: 769px) {
          .slide.peek-left:hover {
            transform: translateX(20%) scale(0.65);
            opacity: 0.6;
            filter: blur(3px);
          }
          .slide.peek-right:hover {
            transform: translateX(-20%) scale(0.65);
            opacity: 0.6;
            filter: blur(3px);
          }
        }

        @media (max-width: 768px) {
          .carousel {
            height: 55vh;
          }
          .picker-modal {
            padding: 56px 16px 24px;
            gap: 20px;
          }
          /* Swap the desktop button for the portaled mobile one. */
          .close-btn {
            display: none;
          }
          :global(.sample-picker-close-mobile) {
            display: flex;
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
          transition:
            width 200ms cubic-bezier(0.23, 1, 0.32, 1),
            border-radius 200ms cubic-bezier(0.23, 1, 0.32, 1),
            background 200ms cubic-bezier(0.23, 1, 0.32, 1),
            transform 100ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (hover: hover) and (pointer: fine) {
          .dot:hover {
            background: rgba(255, 255, 255, 0.55);
          }
        }
        .dot.active {
          width: 24px;
          border-radius: 4px;
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
          transition:
            opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
            transform 100ms cubic-bezier(0.23, 1, 0.32, 1),
            background 200ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (hover: hover) and (pointer: fine) {
          .upload-pill:hover:not(:disabled) {
            background: #ffffff;
          }
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
