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

/**
 * ActiveLedger Portfolio Page
 * Displays 17 sections for the ActiveLedger project
 * Images from /images/portfolio2025/activeledger/
 */
export default function ActiveLedgerPage() {
  const activeledgerImages = {
    section01: { src: '/images/portfolio2025/activeledger/01active_background.webp', alt: 'ActiveLedger Background' },
    section02: { src: '/images/portfolio2025/activeledger/02active.png', alt: 'ActiveLedger Section 2' },
    section03: { src: '/images/portfolio2025/activeledger/03active_background.png', alt: 'ActiveLedger Section 3' },
    section04: { src: '/images/portfolio2025/activeledger/04active.webp', alt: 'ActiveLedger Section 4' },
    section05: { src: '/images/portfolio2025/activeledger/05active.webp', alt: 'ActiveLedger Section 5' },
    section06: { src: '/images/portfolio2025/activeledger/06active.webp', alt: 'ActiveLedger Section 6' },
    section07: { src: '/images/portfolio2025/activeledger/07active.webp', alt: 'ActiveLedger Section 7' },
    section08: { src: '/images/portfolio2025/activeledger/08active.webp', alt: 'ActiveLedger Section 8' },
    section09: { src: '/images/portfolio2025/activeledger/09active.webp', alt: 'ActiveLedger Section 9' },
    section10: { src: '/images/portfolio2025/activeledger/010activeicon.webp', alt: 'ActiveLedger Icons' },
    section11: { src: '/images/portfolio2025/activeledger/011active.png', alt: 'ActiveLedger Section 11' },
    section12: { src: '/images/portfolio2025/activeledger/012active.webp', alt: 'ActiveLedger Section 12' },
    section13: { src: '/images/portfolio2025/activeledger/013active.webp', alt: 'ActiveLedger Section 13' },
    section14: { src: '/images/portfolio2025/activeledger/014active.webp', alt: 'ActiveLedger Section 14' },
    section15: { src: '/images/portfolio2025/activeledger/015active.webp', alt: 'ActiveLedger Section 15' },
    section16: { src: '/images/portfolio2025/activeledger/016active.webp', alt: 'ActiveLedger Section 16' },
    section17: { src: '/images/portfolio2025/activeledger/017active.webp', alt: 'ActiveLedger Section 17' },
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
