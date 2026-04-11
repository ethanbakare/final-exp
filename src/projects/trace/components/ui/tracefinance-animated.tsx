/**
 * Trace UI - Animated Finance Display Components
 * Framer Motion wrappers for finance components with entry/exit animations
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import {
  TextBox,
  FinanceBox,
  DayBlock,
  MerchantBlock,
  MasterBlockHolder,
  EmptyFinanceState,
  type TextBoxProps,
  type FinanceBoxProps,
  type DayBlockProps,
  type MerchantBlockProps,
  type MasterTotalPriceProps,
} from './tracefinance';
import type { ProcessingState } from './traceIcons';
import { ANIMATION_CONFIG, SCROLL_CONFIG } from '@/projects/trace/config/animations';
import styles from '@/projects/trace/styles/trace.module.css';

/* ==================== ANIMATED MASTER TOTAL PRICE ==================== */

/**
 * Parse a display string like "1,556.41" or "0.00" into a number.
 * Returns 0 for empty/invalid input.
 */
const parseTotalString = (s: string): number => {
  const n = parseFloat(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export interface AnimatedMasterTotalPriceProps extends MasterTotalPriceProps {}

/**
 * Per-digit count-up animation for the master total, powered by NumberFlow.
 *
 * Behaviour:
 * - Each digit slot animates independently (odometer style); only digits that
 *   actually change move. The decimal point is a static slot — it never shifts.
 * - The £ symbol is rendered as a separate prefix span at its own font size
 *   (18px) so it can sit naturally to the left of the animated digits at 28px.
 * - Right edge stays anchored via the parent layout (MasterBlockHolder's
 *   .master-total-frame uses justify-content: space-between, so this component
 *   sits flush against the right edge of the frame).
 * - NumberFlow respects prefers-reduced-motion by default.
 * - Tabular figures + per-digit transitions mean digit count changes
 *   (e.g. 9.99 → 10.00) cleanly slide a new digit in on the left without
 *   jittering existing digits.
 *
 * The component keeps the same prop API as MasterTotalPrice so it can be
 * dropped in anywhere the static version is used.
 */
export const AnimatedMasterTotalPrice: React.FC<AnimatedMasterTotalPriceProps> = ({
  total,
  className = '',
}) => {
  const numericValue = parseTotalString(total);

  // NumberFlow renders a custom element (<number-flow-react>) which is only
  // defined client-side. To avoid any SSR/hydration issues with the Pages
  // Router, defer mounting until after the first client paint and render a
  // matching static fallback in the meantime so the layout doesn't shift.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-format the static fallback to match NumberFlow's output exactly.
  const staticFormatted = numericValue.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });

  return (
    <div className={`master-total-price-anim ${className}`}>
      <span className="master-currency-anim">£</span>
      {mounted ? (
        <NumberFlow
          value={numericValue}
          locales="en-GB"
          format={{
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true,
          }}
          className="master-amount-anim"
        />
      ) : (
        <span className="master-amount-anim">{staticFormatted}</span>
      )}

      <style jsx>{`
        .master-total-price-anim {
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          align-items: baseline;
        }

        .master-currency-anim {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-master-currency); /* 18px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: 1;
          color: var(--trace-text-primary); /* #FFFFFF */
          flex: none;
        }

        .master-total-price-anim :global(.master-amount-anim) {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-master-amount); /* 28px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: 1;
          color: var(--trace-text-primary); /* #FFFFFF */
          flex: none;
          /* Tabular figures keep digit slots a uniform width — combined with
             NumberFlow's per-digit transitions, this guarantees the decimal
             point never shifts horizontally as digits change. */
          font-variant-numeric: tabular-nums;

          /* NumberFlow's spinning digits travel into a small padded area above
             and below the baseline before being masked away. The default mask
             height (0.25em) lets the digit peek noticeably above the frame on
             upward swaps; halving it (0.125em) gives a tighter, less airborne
             motion while still leaving enough room for the fade. */
          --number-flow-mask-height: 0.125em;
        }
      `}</style>
    </div>
  );
};

/* ==================== ANIMATED MERCHANT BLOCK ==================== */

export const AnimatedMerchantBlock: React.FC<MerchantBlockProps & { index?: number }> = ({
  index = 0,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const animationProps = shouldReduceMotion
    ? { initial: false, animate: false }
    : {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
        transition: {
          duration: ANIMATION_CONFIG.duration.normal, // 300ms
          ease: ANIMATION_CONFIG.easing.standard,
          delay: index * ANIMATION_CONFIG.stagger.items, // Stagger by 50ms
        },
      };

  return (
    <motion.div {...animationProps} style={{ width: '100%' }}>
      <MerchantBlock {...props} />
    </motion.div>
  );
};

/* ==================== ANIMATED DAY BLOCK ==================== */

interface AnimatedDayBlockWithFadeProps extends DayBlockProps {
  index?: number;
  containerRef?: React.RefObject<HTMLDivElement | null>; // FinanceBox scroll container
}

export const AnimatedDayBlock: React.FC<AnimatedDayBlockWithFadeProps> = ({
  index = 0,
  containerRef,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const dayBlockRef = useRef<HTMLDivElement>(null);
  const dayTotalRef = useRef<HTMLDivElement>(null);

  // Entry/exit animations (existing behavior - UNCHANGED)
  const animationProps = shouldReduceMotion
    ? { initial: false, animate: false }
    : {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0 },
        transition: {
          duration: ANIMATION_CONFIG.duration.normal, // 300ms - faster, cleaner
          ease: ANIMATION_CONFIG.easing.standard,
          delay: index * ANIMATION_CONFIG.stagger.items, // Stagger by 50ms
        },
      };

  // Scroll-linked fade effect (NEW)
  useEffect(() => {
    if (shouldReduceMotion) return; // Respect accessibility preference

    const container = containerRef?.current;
    const dayBlock = dayBlockRef.current;
    const dayTotal = dayTotalRef.current;

    console.log('[AnimatedDayBlock] Setup:', {
      container: !!container,
      dayBlock: !!dayBlock,
      dayTotal: !!dayTotal,
      containerEl: container,
    });

    if (!container || !dayBlock || !dayTotal) {
      console.log('[AnimatedDayBlock] Missing refs, aborting');
      return;
    }

    let ticking = false;

    const updateOpacity = () => {
      const dayBlockRect = dayBlock.getBoundingClientRect();
      const dayTotalRect = dayTotal.getBoundingClientRect();

      const dayBlockBottom = dayBlockRect.bottom;
      const dayTotalBottom = dayTotalRect.bottom;

      // Calculate distance between DayBlock bottom and DayTotal bottom
      // When scrolling up, dayBlockBottom approaches dayTotalBottom from above
      const distanceUntilExit = dayBlockBottom - dayTotalBottom;

      console.log('[AnimatedDayBlock] Update:', {
        dayBlockBottom,
        dayTotalBottom,
        distanceUntilExit,
        inFadeZone: distanceUntilExit <= SCROLL_CONFIG.fadeDistance && distanceUntilExit >= 0,
      });

      // Fade when DayBlock bottom is within fadeDistance of DayTotal bottom (approaching from above)
      if (distanceUntilExit <= SCROLL_CONFIG.fadeDistance && distanceUntilExit >= 0) {
        // Opacity goes from 1.0 (at fadeDistance away) to 0.0 (at 0px away)
        const opacity = Math.max(0, distanceUntilExit / SCROLL_CONFIG.fadeDistance);
        console.log('[AnimatedDayBlock] Setting opacity:', opacity);
        dayTotal.style.setProperty('--day-total-opacity', String(opacity));
      } else {
        dayTotal.style.setProperty('--day-total-opacity', '1');
      }
    };

    const handleScroll = () => {
      console.log('[AnimatedDayBlock] Scroll event fired');
      if (!ticking) {
        requestAnimationFrame(() => {
          updateOpacity();
          ticking = false;
        });
        ticking = true;
      }
    };

    console.log('[AnimatedDayBlock] Adding scroll listener to:', container);
    updateOpacity();
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      console.log('[AnimatedDayBlock] Removing scroll listener');
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, shouldReduceMotion]);

  return (
    <motion.div {...animationProps} style={{ width: '100%' }}>
      <DayBlock
        {...props}
        isFirst={index === 0}
        ref={dayBlockRef}
        dayTotalRef={dayTotalRef}
      />
    </motion.div>
  );
};

/* ==================== ANIMATED FINANCE BOX ==================== */

export interface AnimatedFinanceBoxProps extends FinanceBoxProps {
  onScrollToLatest?: () => void; // Callback when new entry should be scrolled to
  processingState?: ProcessingState; // Drives empty-state icon/copy swap
}

export const AnimatedFinanceBox: React.FC<AnimatedFinanceBoxProps> = ({
  days,
  onScrollToLatest,
  processingState = 'idle',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const previousDaysLengthRef = useRef(days?.length || 0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track when new entries are added and trigger scroll if needed
  useEffect(() => {
    const currentLength = days?.length || 0;
    const previousLength = previousDaysLengthRef.current;

    if (currentLength > previousLength && onScrollToLatest) {
      // New entry added, trigger auto-scroll after delay
      setTimeout(() => {
        onScrollToLatest();
      }, SCROLL_CONFIG.delay);
    }

    previousDaysLengthRef.current = currentLength;
  }, [days?.length, onScrollToLatest]);

  // Show empty state if no days exist
  if (!days || days.length === 0) {
    return (
      <div className={`finance-box finance-box--empty ${className} ${styles.container}`} ref={containerRef}>
        <EmptyFinanceState processingState={processingState} />

        <style jsx>{`
          .finance-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 32px 12px 42px 12px;
            gap: 10px;
            border-radius: var(--trace-financebox-radius);
            width: 100%;
            flex: 1;
            min-height: 0;
          }
        `}</style>
      </div>
    );
  }

  // Render animated day blocks when entries exist
  return (
    <div className={`finance-box ${className} ${styles.container}`} ref={containerRef}>
      <AnimatePresence>
        {days.map((day, index) => (
          <AnimatedDayBlock
            key={day.dateOriginal || day.date} // Use original ISO date as stable key
            date={day.date}
            dateOriginal={day.dateOriginal}
            total={day.total}
            merchants={day.merchants}
            width="100%"
            index={index}
            containerRef={containerRef} // Pass container ref for scroll tracking
          />
        ))}
      </AnimatePresence>

      <style jsx>{`
        .finance-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 0;
          /* Scroll spacer lives on the container's padding-bottom (200px),
             NOT as a margin on :last-child. padding-bottom contributes to
             scrollHeight natively, so:
               - when content fits: no overflow, scroll disabled (no void)
               - when content overflows: 200px of trailing scroll room lets
                 the oldest day block be scrolled up near the top of the
                 viewport for reading.
             This replaces the old :last-child { margin-bottom: calc(500 - 150) }
             rule, which was calibrated against the wrong viewport value (the
             outer TextBox height instead of the FinanceBox's real ~420px
             visible area) and produced a dead-scroll void on short lists. */
          padding: var(--trace-financebox-padding-top) var(--trace-financebox-padding-horizontal)
            200px var(--trace-financebox-padding-horizontal);
          border-radius: var(--trace-financebox-radius);
          width: 100%;
          flex: 1;
          min-height: 0;

          /* Scrollable container */
          overflow-y: auto;
          overflow-x: hidden;

          /* Smooth scroll on iOS */
          -webkit-overflow-scrolling: touch;
        }

        /* Custom scrollbar styling - Modern iOS-style pill scrollbar */
        .finance-box::-webkit-scrollbar {
          width: 2px;
        }

        .finance-box::-webkit-scrollbar-track {
          background: transparent;
        }

        .finance-box::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 9999px;
        }

        .finance-box::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }

        @supports not selector(::-webkit-scrollbar) {
          .finance-box {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
          }
        }
      `}</style>
    </div>
  );
};

/* ==================== ANIMATED TEXT BOX ==================== */

export interface AnimatedTextBoxProps extends TextBoxProps {
  onScrollToLatest?: () => void;
  navbar?: React.ReactNode;
  processingState?: ProcessingState;
}

export const AnimatedTextBox: React.FC<AnimatedTextBoxProps> = ({
  days,
  grandTotal = '0.00',
  onScrollToLatest,
  navbar,
  processingState = 'idle',
  className = '',
}) => {
  return (
    <div className={`text-box ${navbar ? 'text-box--with-navbar' : ''} ${className} ${styles.container}`}>
      <MasterBlockHolder
        total={grandTotal}
        fullWidth
        priceSlot={<AnimatedMasterTotalPrice total={grandTotal} />}
      />
      <AnimatedFinanceBox days={days} onScrollToLatest={onScrollToLatest} processingState={processingState} />
      {navbar}

      <style jsx>{`
        .text-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: var(--trace-textbox-width); /* 360px */
          height: var(--trace-textbox-height); /* 500px */
          background: var(--trace-bg-dark); /* #1c1917 */
          border: var(--trace-textbox-border) solid var(--trace-border-primary); /* 1px solid #44403c */
          border-radius: var(--trace-textbox-radius); /* 16px */
          box-shadow: var(--trace-shadow-textbox); /* 0px 4px 10.5px rgba(0, 0, 0, 0.06) */

          /* Positioning context for gradient pseudo-element */
          position: relative;
        }

        /* Taller when navbar is inside */
        .text-box--with-navbar {
          height: calc(var(--trace-textbox-height) + var(--trace-button-height) + 20px); /* 500 + 44 + 20 padding = 564px */
        }

        /* Bottom gradient - fades content scrolling upward */
        .text-box::after {
          content: '';
          position: absolute;
          left: 0;    /* Full width from left */
          right: 5px; /* 5px offset from right for scrollbar */
          height: 24px;

          /* Match parent's border-radius to stay within rounded corners */
          border-bottom-left-radius: var(--trace-textbox-radius);
          border-bottom-right-radius: var(--trace-textbox-radius);

          /* Fade FROM solid (bottom) TO transparent (top) */
          background: linear-gradient(
            to top,
            var(--trace-bg-dark) 0%,      /* Solid at bottom */
            transparent 100%               /* Transparent at top */
          );

          pointer-events: none;  /* Don't block interactions */
          z-index: 10;  /* Above content */
        }

        /* Position gradient above navbar when navbar is inside */
        .text-box--with-navbar::after {
          bottom: calc(var(--trace-button-height) + 20px); /* Above navbar + padding */
        }

        .text-box:not(.text-box--with-navbar)::after {
          bottom: 0;
        }
      `}</style>
    </div>
  );
};

/* ==================== AUTO-SCROLL HOOK ==================== */

export const useScrollToNewEntry = (
  entries: any[],
  containerRef: React.RefObject<HTMLElement>
) => {
  const previousCountRef = useRef(entries.length);

  useEffect(() => {
    const currentCount = entries.length;

    // Check if new entry was added
    if (currentCount > previousCountRef.current) {
      const container = containerRef.current;

      if (container) {
        // Wait for animation to start (50ms), then scroll
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: SCROLL_CONFIG.behavior,
          });
        }, SCROLL_CONFIG.delay);
      }
    }

    previousCountRef.current = currentCount;
  }, [entries.length]);
};
