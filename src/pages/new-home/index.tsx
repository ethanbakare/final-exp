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
        {/* Hero banner section — wraps hero text + AI demos carousel */}
        <section className="hero-banner-section">
          <HeroBanner />
          <CarouselDemos />
        </section>

        {/* Brand work section — separate from hero */}
        <section className="brand-section">
          <CarouselBrand />
        </section>
      </div>

      <style jsx global>{`
        body, html {
          margin: 0;
          padding: 0;
          background-color: #0A0A09;
        }
      `}</style>

      <style jsx>{`
        .hero-banner-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 74px 0 200px;
          gap: 94px;
          width: 100%;
        }

        .brand-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 74px 0 116px;
          width: 100%;
        }
      `}</style>
    </>
  );
}
