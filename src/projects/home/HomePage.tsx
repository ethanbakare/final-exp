import React from 'react';
import { Inter, Frank_Ruhl_Libre } from 'next/font/google';
import styles from './styles/HomePage.module.css';
import HeroBanner from './components/HeroBanner';
import ProjectBody from './components/ProjectBody';
import HowItWorks_Body from './components/HowItWorks_Body';

// ----------------------------------------
// FONT CONFIGURATIONS
// ----------------------------------------
// Load Inter font
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Load Frank Ruhl Libre from Google Fonts
const frankRuhlLibre = Frank_Ruhl_Libre({ 
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-frank-ruhl-libre',
  display: 'swap',
});

const HomePage: React.FC = () => {
  return (
    <div className={`${inter.variable} ${frankRuhlLibre.variable} full-page ${styles.darkBackground} ${styles.container}`}>
      {/* Hero Banner Component */}
      <HeroBanner />
      
      {/* Project Body Component */}
      <ProjectBody />
      
      {/* How It Works Component */}
      <HowItWorks_Body />

      {/* ----------------------------------------
          GLOBAL STYLES - Applied to the entire page
          ---------------------------------------- */}
      <style jsx global>{`
        body, html {
          margin: 0;
          padding: 0;
          background-color: var(--DarkPrimary);
        }
      `}</style>
    </div>
  );
};

export default HomePage; 