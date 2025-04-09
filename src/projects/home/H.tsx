import React from 'react';
import Image from "next/image";
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import styles from './styles/HomePage.module.css';

// Load Inter font
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Load Frank Ruhl Libre as a local font or via Google Fonts
// Option 1: Using Google Fonts (uncomment if using Google Fonts)
// import { Frank_Ruhl_Libre } from 'next/font/google';
// const frankRuhlLibre = Frank_Ruhl_Libre({ 
//   subsets: ['latin'],
//   weight: ['400'],
//   variable: '--font-frank-ruhl-libre',
//   display: 'swap',
// });

// Option 2: Using local font (uncomment if using local font files)
// const frankRuhlLibre = localFont({
//   src: [
//     {
//       path: '../../../public/fonts/FrankRuhlLibre-Regular.woff2',
//       weight: '400',
//       style: 'normal',
//     },
//   ],
//   variable: '--font-frank-ruhl-libre',
// });

const HomePage: React.FC = () => {
  return (
    <div className={`${inter.variable} ${styles.container}`}>
      <main className="flex flex-col gap-8 items-center sm:items-start">
        <h1 className="home-title HeaderH1_Semibold">FinalEXP Monorepo</h1>
        <p className="home-subtitle BodyH1">A collection of projects built with Next.js and TypeScript</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl">
          <a href="/receipt-scanner" className="project-card">
            <h2 className="project-title HeaderH1_Semibold">Receipt Scanner</h2>
            <p className="project-description BodyReceiptH1">
              Upload and process receipt images with OCR and AI to extract structured data including store information, items, prices, and totals.
            </p>
          </a>
          
          <a href="/reading-practice" className="project-card">
            <h2 className="project-title HeaderH1_Semibold">Reading Practice</h2>
            <p className="project-description BodyReceiptH1">
              An app for practicing reading with customizable text passages and interactive features.
            </p>
          </a>
          
          <a href="/dictate" className="project-card">
            <h2 className="project-title HeaderH1_Semibold">Dictate</h2>
            <p className="project-description BodyReceiptH1">
              Speech-to-text tool for easy transcription and note-taking.
            </p>
          </a>
        </div>
        
        <div className="flex gap-4 items-center mt-8">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-OrangeElectric text-BaseWhite gap-2 hover:bg-[#e85a1e] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 ButtonH1_Regular"
            href="https://github.com/username/final-exp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/>
            </svg>
            View on GitHub
          </a>
          <a
            className="rounded-full border border-solid border-SecondaryH4_20 transition-colors flex items-center justify-center hover:bg-SecondaryH4_05 hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 ButtonH1_Regular"
            href="/docs"
          >
            Documentation
          </a>
        </div>
      </main>
      
      <footer className="mt-16 pt-8 border-t border-DarkGrey10 flex gap-6 flex-wrap items-center justify-center">
        <p className="BodyReceiptH2 text-DarkGrey60">© 2023 FinalEXP</p>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 BodyReceiptH2 text-DarkGrey60"
          href="/about"
        >
          About
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 BodyReceiptH2 text-DarkGrey60"
          href="/contact"
        >
          Contact
        </a>
      </footer>
    </div>
  );
};

export default HomePage; 