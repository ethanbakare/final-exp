import React from 'react';
import { Inter } from 'next/font/google';
import { ActiveLedgerLayout } from '@/projects/portfolio2025/components/ui/ActiveLedgerLayout';
import styles from '@/projects/portfolio2025/styles/portfolio.module.css';

// Load Inter font
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const IMG = '/images/portfolio2025/activeledger';

/**
 * ActiveLedger Portfolio Page
 * Displays 17 sections for the ActiveLedger project
 * Images mapped by filename prefix (01-017), alphabetical within each section
 */
export default function ActiveLedgerPage() {
  const activeledgerImages = {
    section01: [
      { src: `${IMG}/01active_background.webp`, alt: 'ActiveLedger Background' },
    ],
    section02: [
      { src: `${IMG}/02active.png`, alt: 'ActiveLedger Section 2' },
    ],
    section03: [
      { src: `${IMG}/03active_background.png`, alt: 'ActiveLedger Section 3' },
    ],
    section04: [
      { src: `${IMG}/04active.webp`, alt: 'ActiveLedger Section 4' },
    ],
    section05: [
      { src: `${IMG}/05active.webp`, alt: 'ActiveLedger Section 5' },
      { src: `${IMG}/05activemobilequote.webp`, alt: 'ActiveLedger Mobile Quote' },
      { src: `${IMG}/05activemobiletimeline.webp`, alt: 'ActiveLedger Mobile Timeline' },
    ],
    section06: [
      { src: `${IMG}/06active.webp`, alt: 'ActiveLedger Section 6' },
      { src: `${IMG}/06activebackground.webp`, alt: 'ActiveLedger Section 6 Background' },
    ],
    section07: [
      { src: `${IMG}/07active.webp`, alt: 'ActiveLedger Section 7' },
    ],
    section08: [
      { src: `${IMG}/08active.webp`, alt: 'ActiveLedger Section 8' },
      { src: `${IMG}/08activelogo.jpeg`, alt: 'ActiveLedger Logo' },
      { src: `${IMG}/08activelogobreakdown.webp`, alt: 'ActiveLedger Logo Breakdown' },
    ],
    section09: [
      { src: `${IMG}/09active.webp`, alt: 'ActiveLedger Section 9' },
    ],
    section10: [
      { src: `${IMG}/010activeicon.webp`, alt: 'ActiveLedger Icon' },
      { src: `${IMG}/010activeiconbreakdown.webp`, alt: 'ActiveLedger Icon Breakdown' },
      { src: `${IMG}/010activepattern.webp`, alt: 'ActiveLedger Pattern' },
    ],
    section11: [
      { src: `${IMG}/011active.png`, alt: 'ActiveLedger Section 11' },
      { src: `${IMG}/011activeIPAD.webp`, alt: 'ActiveLedger iPad' },
    ],
    section12: [
      { src: `${IMG}/012active.webp`, alt: 'ActiveLedger Section 12' },
      { src: `${IMG}/012activeleposter.webp`, alt: 'ActiveLedger Poster' },
    ],
    section13: [
      { src: `${IMG}/013active.webp`, alt: 'ActiveLedger Section 13' },
    ],
    section14: [
      { src: `${IMG}/014active.webp`, alt: 'ActiveLedger Section 14' },
      { src: `${IMG}/014activedata.webp`, alt: 'ActiveLedger Data' },
    ],
    section15: [
      { src: `${IMG}/015active.webp`, alt: 'ActiveLedger Section 15' },
    ],
    section16: [
      { src: `${IMG}/016active.webp`, alt: 'ActiveLedger Section 16' },
      { src: `${IMG}/016activecorporate.webp`, alt: 'ActiveLedger Corporate' },
    ],
    section17: [
      { src: `${IMG}/017active.webp`, alt: 'ActiveLedger Section 17' },
    ],
  };

  return (
    <>
      <div className={`${inter.variable} ${styles['activeledger-page-wrapper']}`}>
        <ActiveLedgerLayout images={activeledgerImages} />
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
      `}</style>
    </>
  );
}
