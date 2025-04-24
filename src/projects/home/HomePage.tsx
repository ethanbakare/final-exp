import React, { useEffect } from 'react';
import { Inter, Frank_Ruhl_Libre } from 'next/font/google';
import styles from './styles/HomePage.module.css';
import HeroBanner from './components/HeroBanner';
import ProjectBody from './components/ProjectBody';
import CompletedBuildBody from './components/CompletedBuildBody';
import HowItWorks_Body from './components/HowItWorks_Body';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Goal_Body from './components/Goal_Body';
import LoadingScreen from './components/LoadingScreen';
import MainNavBar from './components/MainNavBar';
import dynamic from 'next/dynamic';
import { useLoading } from '@/contexts/LoadingContext';

// Dynamically import the ProjectDetailModal for preloading after initial load
const ProjectDetailModal = dynamic(
  () => import('./components/ProjectDetailModal'),
  { ssr: false, loading: () => null }
);

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
  const { isLoading } = useLoading();

  // Preload ProjectDetailModal after initial page load completes
  useEffect(() => {
    if (!isLoading) {
      // Start preloading the modal when page is fully loaded
      const preloadModal = async () => {
        try {
          // This preloads the component without rendering it
          await import('./components/ProjectDetailModal');
          console.log('ProjectDetailModal preloaded successfully');
        } catch (error) {
          console.error('Error preloading ProjectDetailModal:', error);
        }
      };
      
      // Delay preloading slightly to prioritize rendering the main content first
      const timer = setTimeout(() => {
        preloadModal();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className={`${inter.variable} ${frankRuhlLibre.variable} full-page ${styles.darkBackground} ${styles.container}`}>
      {/* Main Navigation Bar */}
      <MainNavBar />
      
      {/* Loading Screen that overlays the page while content loads */}
      <LoadingScreen />
      
      {/* Hero Banner Component */}
      <HeroBanner />
      
      {/* Project Body Component */}
      <ProjectBody />
      
      {/* Completed Build Component */}
      <CompletedBuildBody />
      
      {/* How It Works Component */}
      <HowItWorks_Body />
      
      {/* Goal Component - temporarily hidden */}
      {/* <Goal_Body /> */}
      
      {/* Hidden modal for preloading */}
      {!isLoading && <div style={{ display: 'none' }}><ProjectDetailModal onClose={() => {}} /></div>}

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