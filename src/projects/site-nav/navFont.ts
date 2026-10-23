/**
 * The bar's own Inter. next/font/local gives this face a hashed, unique family
 * name, so no page font stack that names "Inter" can pick it up and it
 * registers no face called "Inter". It is applied only to .gnav, through the
 * --gnav-inter variable on the bar's root element.
 * Source: the Latin variable file that next/font/google serves for Inter
 * (Inter, SIL Open Font License 1.1), self-hosted. One file carries both
 * weights the bar uses: 400 for the labels, 500 for the current page.
 */
import localFont from 'next/font/local';

export const navInter = localFont({
  src: './fonts/inter-var-latin.woff2',
  weight: '400 500',
  style: 'normal',
  variable: '--gnav-inter',
  display: 'swap',
  adjustFontFallback: false,
});
