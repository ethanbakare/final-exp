import React from 'react';
import { Inter, Open_Sans } from 'next/font/google';
import MadeForHumansLayout from '@/projects/madeforhumans/components/MadeForHumansLayout';

// Hero tagline face (Figma: Inter 18px italic)
// Body face for the intro and comic titles (named in the CSS but never loaded before)
const openSans = Open_Sans({ subsets: ['latin'], weight: ['400'], variable: '--font-open-sans', display: 'swap' });
const inter = Inter({ subsets: ['latin'], weight: ['400'], style: ['italic'], variable: '--font-inter', display: 'swap' });

export default function MadeForHumansPage() {
  return (
    <>
      <div className={`${inter.variable} ${openSans.variable}`}>
        <MadeForHumansLayout />
      </div>
      <style jsx global>{`
        body, html {
          margin: 0;
          padding: 0;
          background-color: #F5F5F3;
        }
      `}</style>
    </>
  );
}
