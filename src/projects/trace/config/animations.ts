/**
 * Animation Configuration for Trace
 * Centralized animation settings following Material Design principles
 */

export const ANIMATION_CONFIG = {
  // Durations (in seconds for Framer Motion)
  duration: {
    fast: 0.15,      // 150ms - Small UI changes
    normal: 0.3,     // 300ms - Standard transitions
    slow: 0.4,       // 400ms - Large layout shifts
  },

  // Easing curves
  easing: {
    // Material Design emphasized (entering elements)
    emphasized: [0.2, 0, 0, 1] as const,
    // Material Design standard (exiting elements)
    standard: [0.4, 0, 0.2, 1] as const,
    // Spring animation (natural motion)
    spring: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },

  // Stagger timing
  stagger: {
    items: 0.05,  // 50ms between items
  },

  // Animation variants for different scenarios
  variants: {
    // Scenario 0: Empty State → First Entry
    emptyState: {
      initial: { opacity: 1 },
      exit: { opacity: 0 },
    },
    firstEntry: {
      initial: { opacity: 0, y: -4 },
      animate: { opacity: 1, y: 0 },
    },

    // Scenario 1: New MerchantBlock on existing day
    merchantBlock: {
      initial: { opacity: 0, maxHeight: 0, y: -12 },
      animate: { opacity: 1, maxHeight: 500, y: 0 },
      exit: { opacity: 0, maxHeight: 0 },
    },

    // Scenario 2: New DayBlock for different date
    dayBlock: {
      initial: { opacity: 0, maxHeight: 0, y: -16 },
      animate: { opacity: 1, maxHeight: 1000, y: 0 },
      exit: { opacity: 0, maxHeight: 0 },
    },

    // Individual expense item (within MerchantBlock)
    expenseItem: {
      initial: { opacity: 0, y: -8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95 },
    },
  },
};

// Auto-scroll configuration
export const SCROLL_CONFIG = {
  behavior: 'smooth' as const,
  block: 'nearest' as const,
  inline: 'nearest' as const,
  delay: 50, // ms delay before scroll starts
  fadeDistance: 8, // pixels - distance over which DayTotal text fades when scrolling out
};
