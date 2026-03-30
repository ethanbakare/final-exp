import React from 'react';
import { Inter, Frank_Ruhl_Libre, Hedvig_Letters_Sans } from 'next/font/google';
import styles from '@/projects/new-home/styles/new-home.module.css';
import HeroBanner from '@/projects/new-home/components/HeroBanner';
import CarouselDemos from '@/projects/new-home/components/CarouselDemos';
import CarouselBrand from '@/projects/new-home/components/CarouselBrand';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const frankRuhlLibre = Frank_Ruhl_Libre({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-frank-ruhl-libre',
  display: 'swap',
});

const hedvigLettersSans = Hedvig_Letters_Sans({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-hedvig',
  display: 'swap',
});

export default function NewHomePage() {
  return (
    <>
      <div className={`${inter.variable} ${frankRuhlLibre.variable} ${hedvigLettersSans.variable} ${styles.pageContainer}`}>
        <HeroBanner />
        <CarouselDemos />
        <CarouselBrand />
      </div>

      <style jsx global>{`
        body, html {
          margin: 0;
          padding: 0;
          background-color: #0A0A09;
        }
      `}</style>
    </>
  );
}
