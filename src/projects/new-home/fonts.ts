/**
 * Fonts for the home page (/), moved out of the page file so the headline's
 * serif fallback (Merriweather) sits next to Frank Ruhl Libre. Only the home
 * page imports this module, so no other page's typography changes.
 * Note: links to "/" are full document loads (SiteNavGlass NavAnchor,
 * BackToHomeLink) because in `next dev` a client-side transition to "/" does
 * not apply this CSS (dev's route loader skips extracted CSS: "Styles are
 * handled by style-loader in development"; next/font's @font-face and variable
 * classes are not style-loaded), so the headline falls back to sans. A
 * production build applies it correctly on client navigation (verified from
 * /projects, /trace, /clipperstream, /receipt-scanner: h1 pixel-identical to a
 * cold load), with or without importing this module in src/pages/index.tsx.
 */
import { Inter, Frank_Ruhl_Libre, Hedvig_Letters_Sans } from 'next/font/google';
import localFont from 'next/font/local';

export const homeInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/** Serif fallback for the headline (operator's choice): if Frank Ruhl Libre
 *  is not loaded, the headline shows Merriweather, never a sans.
 *  Merriweather runs larger than Frank Ruhl (x-height 0.556 vs 0.468 em; the
 *  headline lines are 12% / 9% wider), so this face carries size-adjust 89.4%
 *  (the mean of the two measured line-width ratios, 0.880 and 0.908) to keep
 *  the same line breaks. size-adjust needs a local face, so the Latin 400 file
 *  that next/font/google served is self-hosted here (Merriweather, SIL Open
 *  Font License 1.1). Frank Ruhl itself is untouched. */
export const homeMerriweather = localFont({
  src: './fonts/merriweather-400-latin.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-merriweather',
  display: 'swap',
  adjustFontFallback: false,
  declarations: [{ prop: 'size-adjust', value: '89.4%' }],
});

export const homeFrankRuhlLibre = Frank_Ruhl_Libre({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-frank-ruhl-libre',
  display: 'swap',
  // serif-to-serif swap: no fallback list of its own, so the headline stack
  // (new-home.module.css: var(--font-frank-ruhl-libre), var(--font-merriweather),
  // serif) falls to the size-adjusted Merriweather, not to Times.
  adjustFontFallback: false,
  fallback: [],
});

export const homeHedvigLettersSans = Hedvig_Letters_Sans({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-hedvig',
  display: 'swap',
});

/** The font variable classes, for the home page wrapper. */
export const homeFontVariables = `${homeInter.variable} ${homeFrankRuhlLibre.variable} ${homeMerriweather.variable} ${homeHedvigLettersSans.variable}`;
