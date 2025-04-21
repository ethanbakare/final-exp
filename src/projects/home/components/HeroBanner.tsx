import React, { useEffect, useState } from 'react';
import styles from '../styles/HomePage.module.css';
import { useSectionLoading } from '@/hooks/useSectionLoading';

const HeroBanner: React.FC = () => {
  // Track when assets are loaded
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  
  // Mark component as loaded when rendered and assets are loaded
  // This ensures the loading screen accounts for this component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isLoaded } = useSectionLoading('HeroBanner', [assetsLoaded]);
  
  // Simulate asset loading (fonts, images, etc.)
  useEffect(() => {
    // Track when component is mounted and visible
    const timer = setTimeout(() => {
      setAssetsLoaded(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Custom smooth scroll function with easeInOutCubic easing
  const scrollToElement = (elementId: string) => {
    const targetElement = document.getElementById(elementId);
    if (!targetElement) return;
    
    const startPosition = window.pageYOffset;
    const targetPosition = targetElement.getBoundingClientRect().top + startPosition;
    const distance = targetPosition - startPosition;
    const duration = 1000; // Duration in ms (1 second)
    let startTime: number | null = null;
    
    // Easing function for smooth acceleration and deceleration
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    const animateScroll = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);
      
      window.scrollTo(0, startPosition + distance * easeProgress);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animateScroll);
      }
    };
    
    requestAnimationFrame(animateScroll);
  };

  // Function to handle scrolling to the "What's next?" section
  const scrollToWhatsNext = () => {
    scrollToElement('whats-next');
  };

  // Function to handle scrolling to the "How it works" section
  const scrollToHowItWorks = () => {
    scrollToElement('how-it-works');
  };

  return (
    <div className="hero_banner">
      <div className="main_holder">
        {/* Badge component - "Day X / 90" indicator */}
        <div className="badge_component">
          <div className="badge_frame">
            <span className={`${styles.InterRegular14} badge_text`}>Day 9 / 90</span>
          </div>
        </div>
        
        {/* Hero text content - Title and subtitle */}
        <div className="hero_component">
          <h1 className={`${styles.FrankRuhlLibre64} hero_title`}>90 days; Zero to AI designer</h1>
          <p className={`${styles.InterRegular24_H1} hero_subtitle`}>
            Building functional design prototypes to explore AI-human interaction
          </p>
        </div>
      </div>
      
      {/* Hero action buttons */}
      <div className="buttons">
        <button className="button_left" onClick={scrollToHowItWorks}>
          <span className={`${styles.InterRegular18} btn_left_text`}>How it works</span>
        </button>
        <button className="button_right" onClick={scrollToWhatsNext}>
          <span className={`${styles.InterRegular18} btn_right_text`}>Vote on next build </span>
        </button>
      </div>

      {/* ----------------------------------------
          COMPONENT STYLES - Hero section styles
          ---------------------------------------- */}
      <style jsx>{`
        /* Hero banner container */
        .hero_banner {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0px 0px 0px;
          gap: 88px;
          width: 100%;
          height: 100vh;
          min-height: 809px;
          margin: 0 auto;
        }

        /* Main content holder */
        .main_holder {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px;
          gap: 64px;
          width: 100%;
          max-width: 1020px;
          height: auto;
        }

        /* Badge component - "Day X / 90" */
        .badge_component {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 8px;
        }

        .badge_frame {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px 12px;
          gap: 10px;
          background: var(--AccentGreenOpacity25);
          border-radius: 32px;
        }

        /* Hero content - Title and subtitle */
        .hero_component {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px 16px 5px;
          gap: 28px;
          width: 100%;
          max-width: 1020px;
          height: auto;
        }

        h1 {
          text-align: center;
          color: var(--WhiteOpacity);
          width: 100%;
          max-width: 1020px;
          height: auto;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        p {
          text-align: center;
          color: var(--WhiteOpacity70);
          width: 100%;
          max-width: 632px;
          height: auto;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        /* Hero buttons */
        .buttons {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          gap: 32px;
          max-width: 442px;
          height: auto;
        }

        .button_left, 
        .button_right {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 8px 16px;
          gap: 10px;
          width: 100%;
          max-width: 233px;
          border-radius: 32px;
          height: auto;
          border: 2px solid var(--WhiteOpacity10);
          cursor: pointer;
          white-space: nowrap;
          box-sizing: border-box;
        }

        .button_left {
          background: transparent;
        }

        .button_right {
          background: var(--WhiteOpacity);
        }

        /* Text style classes */
        .badge_text {
          color: var(--AccentGreen);
        }
        
        .hero_title {
          color: var(--WhiteOpacity);
        }
        
        .hero_subtitle {
          color: var(--WhiteOpacity70);
        }
        
        .btn_left_text {
          color: var(--WhiteOpacity70);
        }
        
        .btn_right_text {
          color: var(--DarkPrimary);
        }

        /* Media queries for responsive design */
        @media (max-width: 768px) {
          .buttons {
            flex-direction: column;
            align-items: center;
          }
        }

        @media (max-width: 600px) {
          .hero_banner {
            min-height: auto;
            height: auto;
            padding: 56px 0px 96px;
            gap: 56px;
          }
          
          .hero_component {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0px 16px 5px;
            gap: 24px;
          }

          .main_holder {
            gap: 30px;
          }

          .buttons {
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroBanner; 