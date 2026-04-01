/**
 * Trace Design Tokens - TypeScript Constants
 *
 * These values mirror the CSS custom properties in trace.module.css
 * Use these constants when you need actual color values (e.g., canvas drawing, JS calculations)
 * For CSS styles, prefer using the CSS custom properties (var(--trace-*))
 */

export const TraceColors = {
  // Primary Backgrounds
  bgDark: '#1c1917',          // stone-950
  bgMerchant: '#29252466',    // stone-900 @ 40%
  bgShowcase: '#0a0a0a',      // Super dark
  bgDemo: '#18181b',          // zinc-950

  // Button Colors
  btnLight: '#f5f5f4',        // stone-50
  btnOrange: '#f97316',       // orange-500
  btnProcessing: '#a8a29e',   // stone-400

  // Text Colors
  textPrimary: '#ffffff',     // White
  textSecondary: '#e7e5e4',   // stone-200
  textTertiary: '#78716c',    // stone-500
  textQty: '#ffffff4d',       // White @ 30%

  // Border Colors
  borderPrimary: '#44403c',   // stone-700
  borderLight: '#27272a',     // zinc-800

  // Accent Colors
  accentRed: '#ef4444',       // red-500
  discountOrange: '#fb923c80', // orange-400 @ 50%

  // Showcase UI Elements (for demo/showcase pages)
  showcaseBorder: 'rgba(255, 255, 255, 0.1)',     // Light borders on dark background
  showcaseToggleBg: 'rgba(255, 255, 255, 0.2)',   // Toggle switch background
  showcaseToggleActive: 'rgba(255, 255, 255, 0.4)', // Active toggle state
  showcaseButtonBg: 'rgba(255, 255, 255, 0.05)',  // Button background
  showcaseButtonBorder: 'rgba(255, 255, 255, 0.3)', // Button border
  showcaseButtonActive: 'rgba(255, 255, 255, 0.2)', // Active button state
  showcaseShadow: 'rgba(0, 0, 0, 0.2)',           // Box shadow for toggle elements
} as const;

export const TraceFonts = {
  family: "'Open Runde', -apple-system, BlinkMacSystemFont, sans-serif",

  sizes: {
    discountCurrency: 8,
    currency: 9,
    small: 10,
    body: 12,
    medium: 14,
    button: 16,
    processing: 16,
    title: 24,
    heading: 32,
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;
