/**
 * Trace UI - Animated Finance Display Components
 * Framer Motion wrappers for finance components with entry/exit animations
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
} from './tracefinance';
import { ANIMATION_CONFIG, SCROLL_CONFIG } from '@/projects/trace/config/animations';
import styles from '@/projects/trace/styles/trace.module.css';

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
}

export const AnimatedFinanceBox: React.FC<AnimatedFinanceBoxProps> = ({
  days,
  onScrollToLatest,
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
        <EmptyFinanceState />

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
          padding: var(--trace-financebox-padding-top) var(--trace-financebox-padding-horizontal)
            var(--trace-financebox-padding-bottom) var(--trace-financebox-padding-horizontal);
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

        /* Scroll spacer - allows last DayBlock to scroll to top */
        .finance-box > :global(*):last-child {
          margin-bottom: calc(var(--trace-textbox-height) - 150px);
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
}

export const AnimatedTextBox: React.FC<AnimatedTextBoxProps> = ({
  days,
  grandTotal = '0.00',
  onScrollToLatest,
  className = '',
}) => {
  return (
    <div className={`text-box ${className} ${styles.container}`}>
      <MasterBlockHolder total={grandTotal} fullWidth />
      <AnimatedFinanceBox days={days} onScrollToLatest={onScrollToLatest} />

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

        /* Bottom gradient - fades content scrolling upward */
        .text-box::after {
          content: '';
          position: absolute;
          bottom: 0;  /* Very bottom of textbox */
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
