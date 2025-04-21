import React, { useEffect, useState, useRef } from 'react';
import styles from '../styles/HomePage.module.css';
import { useLoading } from '@/contexts/LoadingContext';
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';

const LoadingScreen: React.FC = () => {
  const { isLoading, progress } = useLoading();
  const [animationComplete, setAnimationComplete] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  
  // State for the animated progress value (what we display)
  const [displayProgress, setDisplayProgress] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAnimating, setIsAnimating] = useState(false);
  const prevProgressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // For minimum display time
  const MIN_DISPLAY_TIME = 5000; // 5 seconds minimum display time
  const startTimeRef = useRef<number | null>(null);
  const [forceShow, setForceShow] = useState(true);
  
  // Animation timing configuration
  const ANIMATION_DURATION = 800; // ms - how long to animate between values
  const MIN_ANIMATION_STEP = 1; // minimum step size per frame
  
  // Robust cross-platform scroll locking
  useEffect(() => {
    const targetElement = screenRef.current;
    
    if (isLoading && targetElement) {
      // Configure body-scroll-lock with precise options for cross-platform compatibility
      disableBodyScroll(targetElement, {
        reserveScrollBarGap: true,
        allowTouchMove: (el) => {
          // Only block touches on the loading screen itself, allow elsewhere
          return targetElement !== el && !targetElement.contains(el);
        }
      });
    } else if (!isLoading) {
      // Clear locks immediately when loading state changes
      clearAllBodyScrollLocks();
      
      // Ensure body styles are explicitly reset for desktop browsers
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
    }
    
    return () => {
      // Guarantee cleanup on unmount
      clearAllBodyScrollLocks();
      document.body.style.overflow = '';
      document.body.style.position = '';
    };
  }, [isLoading]);
  
  // Add another effect to ensure scroll is restored after animation
  useEffect(() => {
    if (animationComplete) {
      // Double-check scroll is enabled after animation completes
      clearAllBodyScrollLocks();
      document.body.style.overflow = '';
    }
  }, [animationComplete]);
  
  // Handle viewport height adjustments for mobile browsers
  useEffect(() => {
    if (!isLoading) return;
    
    // Function to set CSS variable with viewport height
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Set initial viewport height
    setViewportHeight();
    
    // Update viewport height on resize
    window.addEventListener('resize', setViewportHeight);
    
    // Update on orientation change (specific to mobile)
    window.addEventListener('orientationchange', setViewportHeight);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, [isLoading]);
  
  // Handle slide-up animation when loading completes
  useEffect(() => {
    if (!isLoading && !animationComplete) {
      // Add pause at 100% before sliding up
      const PAUSE_AT_100_PERCENT = 800; // 0.8 seconds pause at 100%
      
      // First ensure we're at 100% visually
      setDisplayProgress(100);
      
      // Then set a timeout for the pause
      const pauseTimer = setTimeout(() => {
        // When loading completes, start the slide-up animation
        if (screenRef.current) {
          screenRef.current.style.transform = 'translateY(-100%)';
        }
        
        // Remove component after animation completes
        const slideTimer = setTimeout(() => {
          setAnimationComplete(true);
          
          // Extra check to ensure scrolling is fully restored
          clearAllBodyScrollLocks();
          document.body.style.overflow = '';
        }, 800); // Match this with CSS transition duration
        
        return () => clearTimeout(slideTimer);
      }, PAUSE_AT_100_PERCENT);
      
      return () => clearTimeout(pauseTimer);
    }
  }, [isLoading, animationComplete]);
  
  // Handle minimum display time logic
  useEffect(() => {
    // Record the start time when the component mounts
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
    
    // Set up the minimum display time logic
    const checkMinimumDisplayTime = () => {
      if (!isLoading && startTimeRef.current) {
        const elapsedTime = Date.now() - startTimeRef.current;
        
        if (elapsedTime < MIN_DISPLAY_TIME) {
          // If minimum time hasn't elapsed, force show and set a timeout
          setForceShow(true);
          const remainingTime = MIN_DISPLAY_TIME - elapsedTime;
          
          setTimeout(() => {
            setForceShow(false);
          }, remainingTime);
        } else {
          // Minimum time has elapsed, allow hiding
          setForceShow(false);
        }
      }
    };
    
    // Check minimum time when loading state changes
    if (!isLoading) {
      checkMinimumDisplayTime();
    }
    
    // Regular mobile viewport height adjustment logic
    const handleResize = () => {
      if (screenRef.current) {
        screenRef.current.style.height = `${window.innerHeight}px`;
      }
    };
    
    // Run on mount
    handleResize();
    
    // Set up event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoading]);
  
  // Smooth counter animation effect
  useEffect(() => {
    // Clear any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (progress === displayProgress) return;
    
    // Don't animate backward
    if (progress < displayProgress) {
      setDisplayProgress(progress);
      return;
    }
    
    // Start timestamp for animation
    let startTime: number | null = null;
    const startValue = displayProgress;
    const endValue = progress;
    const valueToAnimate = endValue - startValue;
    
    setIsAnimating(true);
    
    // Animation function
    const animateProgress = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Calculate progress with easing (ease-out cubic)
      const t = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedT = 1 - Math.pow(1 - t, 3); // Cubic ease-out function
      
      // Calculate the new display value with a minimum step
      let newValue = startValue + valueToAnimate * easedT;
      
      // Ensure we always move at least MIN_ANIMATION_STEP per frame when animating
      if (newValue > displayProgress) {
        newValue = Math.max(newValue, displayProgress + MIN_ANIMATION_STEP);
      }
      
      // Round for display
      const roundedValue = Math.min(Math.floor(newValue), endValue);
      setDisplayProgress(roundedValue);
      
      // Continue animation if not complete
      if (roundedValue < endValue) {
        animationFrameRef.current = requestAnimationFrame(animateProgress);
      } else {
        setIsAnimating(false);
        prevProgressRef.current = endValue;
      }
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animateProgress);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [progress, displayProgress]);
  
  // If animation is complete, don't render anything
  if (animationComplete) return null;
  
  // Don't render if loading is complete and minimum time has elapsed
  if (!isLoading && !forceShow) return null;
  
  return (
    <div 
      className="loading-screen" 
      ref={screenRef}
      aria-busy={isLoading}
      aria-live="polite"
      aria-valuemin={0}
      aria-valuenow={progress}
      aria-valuemax={100}
    >
      <div className="loading-main">
        <div className="animated-text-container">
          <p className={`${styles.InterRegular20} animated-text`}>
            Not waiting for permission.
          </p>
        </div>
        
        <div className="hero-component">
          <div className="progress-container">
            <div className="progress-bar">
              <div className="white-bar" style={{ width: `${displayProgress}%` }} />
            </div>
          </div>
          
          <p className={`${styles.InterRegular16} percentage`}>
            Loading website {displayProgress}%
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh; /* Fallback for browsers that don't support custom properties */
          height: calc(var(--vh, 1vh) * 100); /* Use custom viewport height */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0;
          background: var(--DarkPrimary);
          backdrop-filter: blur(45px);
          z-index: 9999;
          transform: translateY(0);
          transition: transform 0.8s cubic-bezier(0.65, 0, 0.35, 1);
          overflow: hidden; /* Prevent internal scrolling */
        }
        
        .loading-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0px 0px 50px;
          gap: 30px;
          width: 100%;
          max-width: 1020px;
        }
        
        .animated-text-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        
        .animated-text {
          width: 383px;
          max-width: 632px;
          height: 40px;
          text-align: center;
          letter-spacing: -0.01em;
          color: rgba(255, 255, 255, 0.8);
          animation: pulse 2s infinite ease-in-out;
        }
        
        @keyframes pulse {
          0% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.8;
          }
        }
        
        .hero-component {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 5px 0px;
          width: 472px;
          max-width: 1160px;
          height: 54px;
        }
        
        .progress-container {
          width: 100%;
          max-width: 600px;
        }
        
        .progress-bar {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
          border-radius: 2px;
        }
        
        .white-bar {
          height: 12px;
          background: #FFFFFF;
          transition: width 0.3s linear;
        }
        
        .percentage {
          width: 250px;
          height: 32px;
          text-align: center;
          letter-spacing: -0.01em;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 10px;
          animation: fadeIn 0.8s ease-in-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @media (max-width: 600px) {
          .loading-screen {
            padding: 0;
          }
          
          .hero-component {
            width: 90%;
            max-width: 350px;
          }
          
          .progress-bar {
            width: 100%;
          }
          
          .percentage {
            width: 90%;
            max-width: 300px;
            font-size: 16px;
          }
          
          .animated-text {
            width: 90%;
            max-width: 350px;
            font-size: 18px;
          }
        }
        
        /* Fallback for browsers that don't support backdrop-filter */
        @supports not (backdrop-filter: blur(45px)) {
          .loading-screen {
            background: rgba(26, 26, 26, 0.98);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen; 