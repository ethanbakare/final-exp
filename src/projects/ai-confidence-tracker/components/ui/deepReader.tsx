import React, { useState, useRef, TouchEvent } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';

interface DeepReaderProps {
  initialText?: string;
  className?: string;
}

export const DeepReader: React.FC<DeepReaderProps> = ({
  // initialText is unused as we're using predefined sentences array instead
  className = '',
}) => {
  const sentences = [
    "The quick brown fox jumped over the lazy dog.",
    "She sells salty seashells by the seashore.",
    "How much wood would a woodchuck chuck?",
    "The rain in Spain stays mainly in the plain.",
    "Peter Piper picked a peck of pickled peppers."
  ];
  
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousSentenceIndex, setPreviousSentenceIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('left');
  const totalSentences = sentences.length;
  
  // Touch gesture references
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50; // Minimum distance required for a swipe
  
  const transitionToNextSentence = () => {
    setPreviousSentenceIndex(currentSentenceIndex);
    setTimeout(() => {
      setCurrentSentenceIndex((prev) => (prev + 1) % totalSentences);
    }, 50);
  };
  
  const transitionToPrevSentence = () => {
    setPreviousSentenceIndex(currentSentenceIndex);
    setTimeout(() => {
      setCurrentSentenceIndex((prev) => (prev === 0 ? totalSentences - 1 : prev - 1));
    }, 50);
  };
  
  const handleReloadClick = () => {
    if (isTransitioning) return; // Prevent multiple clicks during transition
    
    setIsRotating(true);
    setIsTransitioning(true);
    setSlideDirection('left'); // Default slide direction for button click
    
    transitionToNextSentence();
    
    // Reset rotation state after animation completes
    setTimeout(() => {
      setIsRotating(false);
    }, 500);
    
    // Reset transition state after slide completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };
  
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isTransitioning) return; // Prevent gestures during transition
    
    if (isLeftSwipe) {
      // Swiped from right to left - go to next
      setIsTransitioning(true);
      setSlideDirection('left');
      transitionToNextSentence();
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    } else if (isRightSwipe) {
      // Swiped from left to right - go to previous
      setIsTransitioning(true);
      setSlideDirection('right');
      transitionToPrevSentence();
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
    
    // Reset touch refs
    touchStartX.current = null;
    touchEndX.current = null;
  };
  
  return (
    <>
      <div className={`${styles.container} reading-interface ${className}`}>
        <div className="reading-microcopy">
          <div className={`read-text-label ${styles.InterRegular12}`}>Read text below aloud</div>
          <div className={`swipe-hint ${styles.InterRegular12}`}>Swipe to change</div>
        </div>
        
        <div className="reading-box">
          <div 
            className="reading-box-text"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="slide-container">
              {isTransitioning && (
                <>
                  <div className={`text-content-previous ${slideDirection === 'left' ? 'slide-out-left' : 'slide-out-right'}`}>
                    <span className={styles.OpenRundeRegular20}>{sentences[previousSentenceIndex]}</span>
                  </div>
                  <div className="edge-fade left-fade"></div>
                  <div className="edge-fade right-fade"></div>
                </>
              )}
              <div className={`text-content ${isTransitioning ? (slideDirection === 'left' ? 'slide-in-right' : 'slide-in-left') : ''}`}>
                <span className={styles.OpenRundeRegular20}>{sentences[currentSentenceIndex]}</span>
              </div>
            </div>
          </div>
          
          <div className="reading-box-carousel">
            <button className="reload-button" onClick={handleReloadClick}>
              <div className={`reload-icon ${isRotating ? 'rotating' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 15C7.325 15 5.90625 14.4188 4.74375 13.2563C3.58125 12.0938 3 10.675 3 9C3 7.325 3.58125 5.90625 4.74375 4.74375C5.90625 3.58125 7.325 3 9 3C9.8625 3 10.6875 3.17813 11.475 3.53438C12.2625 3.89063 12.9375 4.4 13.5 5.0625V3.75C13.5 3.5375 13.5719 3.35938 13.7156 3.21563C13.8594 3.07188 14.0375 3 14.25 3C14.4625 3 14.6406 3.07188 14.7844 3.21563C14.9281 3.35938 15 3.5375 15 3.75V7.5C15 7.7125 14.9281 7.89063 14.7844 8.03438C14.6406 8.17813 14.4625 8.25 14.25 8.25H10.5C10.2875 8.25 10.1094 8.17813 9.96563 8.03438C9.82188 7.89063 9.75 7.7125 9.75 7.5C9.75 7.2875 9.82188 7.10938 9.96563 6.96563C10.1094 6.82188 10.2875 6.75 10.5 6.75H12.9C12.5 6.05 11.9531 5.5 11.2594 5.1C10.5656 4.7 9.8125 4.5 9 4.5C7.75 4.5 6.6875 4.9375 5.8125 5.8125C4.9375 6.6875 4.5 7.75 4.5 9C4.5 10.25 4.9375 11.3125 5.8125 12.1875C6.6875 13.0625 7.75 13.5 9 13.5C9.85 13.5 10.6281 13.2844 11.3344 12.8531C12.0406 12.4219 12.5875 11.8438 12.975 11.1188C13.075 10.9438 13.2156 10.8219 13.3969 10.7531C13.5781 10.6844 13.7625 10.6813 13.95 10.7438C14.15 10.8063 14.2938 10.9375 14.3813 11.1375C14.4688 11.3375 14.4625 11.525 14.3625 11.7C13.85 12.7 13.1188 13.5 12.1688 14.1C11.2188 14.7 10.1625 15 9 15Z" fill="#5E5E5E" fillOpacity="0.45"/>
                </svg>
              </div>
              <div className={`reload-text ${styles.OpenRundeRegular16}`}>Try another sentence</div>
            </button>
            
            <div className="carousel-dots">
              {Array.from({ length: totalSentences }).map((_, index) => (
                <div 
                  key={index} 
                  className={`dot ${index === currentSentenceIndex ? 'active' : ''}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* ReadingInterface */
        .reading-interface {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 10px 0px;
          gap: 10px;
          
          width: 100%;
          max-width: 600px;
          height: auto;
          min-height: 155px;
          
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* Reading Microcopy container */
        .reading-microcopy {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 5px;
        }
        
        /* Read text below aloud */
        .read-text-label {
          width: auto;
          height: auto;
          text-align: center;
          letter-spacing: -0.01em;
          color: var(--darkGrey30);
        }
        
        /* Swipe hint */
        .swipe-hint {
          display: none; /* Hidden by default on desktop */
          text-align: right;
          letter-spacing: -0.01em;
          color: var(--darkGrey30);
        }
        
        /* ReadingBox */
        .reading-box {
          box-sizing: border-box;
          
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 15px;
          gap: 4px;
          
          width: 100%;
          max-width: 600px;
          height: auto;
          min-height: 108px;
          
          background: var(--BaseWhite);
          border-width: 2px 0px;
          border-style: solid;
          border-color: var(--darkGrey05);
          
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* ReadingBoxText */
        .reading-box-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px 12px 0px;
          gap: 10px;
          
          width: 100%;
          height: auto;
          min-height: 41px;
          
          border-radius: 6px;
          
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
          overflow: hidden;
          touch-action: pan-x;
          cursor: grab;
        }
        
        /* Slide container */
        .slide-container {
          position: relative;
          width: 100%;
          min-height: 29px;
          overflow: hidden;
        }
        
        /* Edge fade effects */
        .edge-fade {
          position: absolute;
          top: 0;
          height: 100%;
          width: 30px;
          z-index: 5;
          pointer-events: none;
        }
        
        .left-fade {
          left: 0;
          background: linear-gradient(to right, var(--BaseWhite_90), rgba(255, 255, 255, 0));
          animation: fadeInOut 0.5s ease;
        }
        
        .right-fade {
          right: 0;
          background: linear-gradient(to left, var(--BaseWhite_90), rgba(255, 255, 255, 0));
          animation: fadeInOut 0.5s ease;
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; }
          15% { opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        /* Text content */
        .text-content, .text-content-previous {
          width: 100%;
          height: auto;
          min-height: 29px;
          
          color: var(--darkGrey80);
          
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
          z-index: 1;
        }
        
        .text-content-previous {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 2;
        }
        
        /* Slide animation */
        @keyframes slideOutLeft {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0; }
        }
        
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .slide-out-left {
          animation: slideOutLeft 0.5s ease forwards;
        }
        
        .slide-out-right {
          animation: slideOutRight 0.5s ease forwards;
        }
        
        .slide-in-right {
          animation: slideInRight 0.5s ease forwards;
          z-index: 3;
        }
        
        .slide-in-left {
          animation: slideInLeft 0.5s ease forwards;
          z-index: 3;
        }
        
        /* ReadingBoxCarousel */
        .reading-box-carousel {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 0px 12px;
          gap: 10px;
          
          width: 100%;
          height: 40px;
          
          border-radius: 6px;
          
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* ReloadButton */
        .reload-button {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 10px 0px;
          gap: 4px;
          
          width: auto;
          min-width: 140px;
          height: 40px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* Hover effect - darken text */
        @media (hover: hover) {
          .reload-button:hover .reload-text {
            color: var(--darkGrey80);
          }
          
          .reload-button:hover svg path {
            fill-opacity: 0.65;
          }
        }
        
        /* ReloadIcon */
        .reload-icon {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 8.75px;
          
          width: 18px;
          height: 18px;
          
          border-radius: 14px;
          
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* Rotation animation */
        @keyframes rotate360 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .rotating {
          animation: rotate360 0.5s ease-in-out;
        }
        
        /* Try another sentence */
        .reload-text {
          width: auto;
          height: auto;
          min-height: 20px;
          
          color: var(--darkGrey60);
          transition: color 0.2s ease;
          
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        /* CarouselDots */
        .carousel-dots {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-end;
          padding: 0px;
          gap: 4px;
          
          width: 38px;
          height: 3px;
          
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        /* Dots */
        .dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          
          background: var(--darkGrey30);
          
          flex: none;
          flex-grow: 0;
        }
        
        .dot.active {
          background: var(--darkGrey60);
        }
        
        /* Media Queries for Responsiveness */
        @media (max-width: 1024px) {
          /* Show swipe hint on tablets and mobile */
          .swipe-hint {
            display: block;
            color: var(--darkGrey30);
          }
        }
        
        @media (max-width: 480px) {
          .reload-text {
            white-space: nowrap;
          }
          
          .reading-box {
            padding: 20px 5px;
          }
 
          .reading-box-text {
            padding: 12px 12px 0px;
          }
           
          .reading-interface {
            gap: 4px;
          }

          .reload-button {
            min-width: 120px;
          }
        }
      `}</style>
    </>
  );
};

// Create a named object for default export
const deepReader = {
  DeepReader
};

export default deepReader; 