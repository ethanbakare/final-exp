import React, { useState, useEffect } from 'react';
import { VoiceTextBoxStandard } from './VoiceTextBoxStandard';
import { VoiceTextBoxCheckClose } from './VoiceTextBoxCheckClose';
import { VoiceTextWrapperLive } from './VoiceTextWrapperLive';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Voice Interface Carousel
 * 
 * Showcases all three voice interface variations with smooth transitions.
 * Navigation: Click left/right edges or use arrow keys
 */

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  component: React.ComponentType;
  gradient: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Variant 1',
    subtitle: 'Standard Mode',
    component: VoiceTextBoxStandard,
    gradient: 'linear-gradient(135deg, #FFE5E5 0%, #FFF0F0 50%, #FFE8E0 100%)', // Soft pink/coral
  },
  {
    id: 2,
    title: 'Variant 2',
    subtitle: 'Check & Close Mode',
    component: VoiceTextBoxCheckClose,
    gradient: 'linear-gradient(135deg, #E0F2FE 0%, #F0F9FF 50%, #E0E7FF 100%)', // Light blue/purple
  },
  {
    id: 3,
    title: 'Variant 3',
    subtitle: 'Live Streaming',
    component: VoiceTextWrapperLive,
    gradient: 'linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 50%, #EDE9FE 100%)', // Blue/purple gradient
  },
];

export const VoiceInterfaceCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const totalSlides = slides.length;

  /**
   * Navigate to specific slide
   */
  const goToSlide = (index: number) => {
    if (isTransitioning) return; // Prevent navigation during transition
    
    setIsTransitioning(true);
    setCurrentSlide(index);
    
    // Reset transition lock after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400); // Match CSS transition duration
  };

  /**
   * Navigate to next slide
   */
  const nextSlide = () => {
    const next = (currentSlide + 1) % totalSlides;
    goToSlide(next);
  };

  /**
   * Navigate to previous slide
   */
  const prevSlide = () => {
    const prev = (currentSlide - 1 + totalSlides) % totalSlides;
    goToSlide(prev);
  };

  /**
   * Keyboard navigation (arrow keys)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, isTransitioning]);

  const CurrentComponent = slides[currentSlide].component;

  return (
    <>
      <div className={`carousel-container ${styles.container}`}>
        {/* Background Layer - Transitions between gradients */}
        <div 
          className="carousel-background"
          style={{ background: slides[currentSlide].gradient }}
        />

        {/* Navigation Zones - Full height clickable areas */}
        <div className="nav-zone nav-zone-left" onClick={prevSlide} />
        <div className="nav-zone nav-zone-right" onClick={nextSlide} />

        {/* Content Container - Centers the component */}
        <div className="carousel-content">
          {/* Optional: Slide title/subtitle */}
          <div className="slide-header">
            <h2 className={`slide-title ${styles.OpenRundeMedium20}`}>
              {slides[currentSlide].title}
            </h2>
            <p className={`slide-subtitle ${styles.OpenRundeRegular14}`}>
              {slides[currentSlide].subtitle}
            </p>
          </div>

          {/* Voice Interface Component */}
          <div className="component-wrapper">
            <CurrentComponent />
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="carousel-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Optional: Arrow hints (show on hover) */}
        <div className="arrow-hint arrow-hint-left">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="arrow-hint arrow-hint-right">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <style jsx>{`
        /* Carousel Container - Full viewport */
        .carousel-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          margin: 0;
          padding: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Background Layer - Smooth gradient transitions */
        .carousel-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          transition: background 600ms ease-out;
        }

        /* Navigation Zones - Invisible clickable areas */
        .nav-zone {
          position: absolute;
          top: 0;
          height: 100%;
          width: 25%;
          z-index: 10;
          cursor: pointer;
          transition: background 200ms ease;
        }

        .nav-zone-left {
          left: 0;
        }

        .nav-zone-right {
          right: 0;
        }

        /* Subtle hover feedback */
        .nav-zone:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        /* Content Container - Centers component */
        .carousel-content {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          pointer-events: none; /* Allow nav zones to be clickable */
        }

        /* Re-enable pointer events for component */
        .component-wrapper {
          pointer-events: auto;
        }

        /* Slide Header - Optional title/subtitle */
        .slide-header {
          text-align: center;
          margin-bottom: 8px;
        }

        .slide-title {
          color: var(--VoiceDarkGrey_90);
          margin: 0 0 4px 0;
        }

        .slide-subtitle {
          color: var(--VoiceDarkGrey_30);
          margin: 0;
        }

        /* Dot Indicators - Bottom center */
        .carousel-dots {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 20;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: var(--VoiceDarkGrey_15);
          cursor: pointer;
          padding: 0;
          transition: all 200ms ease;
        }

        .dot:hover {
          background: var(--VoiceDarkGrey_20);
          transform: scale(1.2);
        }

        .dot.active {
          width: 24px;
          border-radius: 4px;
          background: var(--VoiceDarkGrey_90);
        }

        /* Arrow Hints - Show on hover */
        .arrow-hint {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 15;
          color: var(--VoiceDarkGrey_30);
          opacity: 0;
          transition: opacity 200ms ease;
          pointer-events: none;
        }

        .arrow-hint-left {
          left: 32px;
        }

        .arrow-hint-right {
          right: 32px;
        }

        /* Show arrows on nav zone hover */
        .nav-zone-left:hover ~ .carousel-content ~ .arrow-hint-left,
        .nav-zone-right:hover ~ .carousel-content ~ .arrow-hint-right {
          opacity: 1;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .nav-zone {
            width: 30%;
          }

          .slide-header {
            margin-bottom: 16px;
          }

          .carousel-dots {
            bottom: 24px;
          }

          .arrow-hint {
            display: none; /* Hide arrows on mobile */
          }
        }

        /* Accessibility: Reduce motion */
        @media (prefers-reduced-motion: reduce) {
          .carousel-background,
          .nav-zone,
          .dot {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
};
