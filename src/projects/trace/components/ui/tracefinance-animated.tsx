/**
 * Trace UI - Animated Finance Display Components
 * Framer Motion wrappers for finance components with entry/exit animations
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  TextBox,
  FinanceBox,
  DayBlock,
  MerchantBlock,
  EmptyFinanceState,
  Date,
  TotalFrame,
  DayExpenses,
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
    ? { initial: false, animate: false, exit: false }
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

export const AnimatedDayBlock: React.FC<DayBlockProps & { index?: number; containerRef?: React.RefObject<HTMLElement> }> = ({
  index = 0,
  date,
  dateOriginal,
  total,
  merchants,
  width = '277px',
  className = '',
  containerRef,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const dayTotalRef = useRef<HTMLDivElement>(null);

  // Set up scroll-linked opacity for DayTotal
  const { scrollYProgress } = useScroll({
    target: dayTotalRef,
    container: containerRef,
    offset: ["start start", "start -8px"] // From 0px (opacity 1) to -8px (opacity 0)
  });

  // Map scroll progress to opacity: 0 → 1, 1 → 0
  const dayTotalOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // Entry/exit animation props for the entire block
  const animationProps = shouldReduceMotion
    ? { initial: false, animate: false, exit: false }
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

  // Calculate price frame width (same logic as in DayBlock)
  const priceFrameWidth = merchants.reduce((maxWidth, merchant) => {
    const items = merchant.items || [];
    const maxItemPrice = items.reduce((max, item) => {
      const price = parseFloat(item.netPrice);
      return price > max ? price : max;
    }, 0);

    const merchantTotal = parseFloat(merchant.merchantTotal);
    const largestPrice = Math.max(maxItemPrice, merchantTotal);

    // Calculate width based on digits (similar to DayBlock logic)
    const digits = largestPrice.toString().replace('.', '').length;
    const calculatedWidth = Math.max(60, digits * 10 + 20);

    return Math.max(maxWidth, calculatedWidth);
  }, 60);

  return (
    <motion.div {...animationProps} style={{ width: '100%' }} className={`day-block ${className} ${styles.container}`}>
      {/* DayTotal with scroll-linked opacity - rendered directly as motion.div */}
      <motion.div
        ref={dayTotalRef}
        style={{
          opacity: shouldReduceMotion ? 1 : dayTotalOpacity,
          width: '100%'
        }}
        className={`day-total ${styles.container}`}
      >
        <Date date={date} />
        <TotalFrame total={total} />

        <style jsx>{`
          .day-total {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 4px;
            padding: var(--trace-daytotal-padding); /* 24px 12px 4px 12px */
            border-radius: 0px;
            width: 100%;
            background: var(--trace-bg-dark); /* #1c1917 - same as TextBox */

            /* Sticky positioning */
            position: sticky;
            top: calc(0px - var(--trace-financebox-padding-top));
            z-index: 10;
          }
        `}</style>
      </motion.div>

      {/* DayExpenses (no fade) */}
      <DayExpenses merchants={merchants} width="100%" priceFrameWidth={priceFrameWidth} />
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
            height: 100%;
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
            containerRef={containerRef}
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
          height: 100%;

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
}

export const AnimatedTextBox: React.FC<AnimatedTextBoxProps> = ({
  days,
  onScrollToLatest,
  className = '',
}) => {
  return (
    <div className={`text-box ${className} ${styles.container}`}>
      <AnimatedFinanceBox days={days} onScrollToLatest={onScrollToLatest} />

      <style jsx>{`
        .text-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: var(--trace-textbox-width); /* 301px */
          height: var(--trace-textbox-height); /* 421px */
          background: var(--trace-bg-dark); /* #1c1917 */
          border: var(--trace-textbox-border) solid var(--trace-border-primary); /* 1px solid #44403c */
          border-radius: var(--trace-textbox-radius); /* 16px */
          box-shadow: var(--trace-shadow-textbox); /* 0px 4px 10.5px rgba(0, 0, 0, 0.06) */
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
