import React, { useState, useCallback, useEffect } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';

/**
 * DeepSentence - Text component with simple intro animations
 * 
 * Features:
 * - Two animation variants: horizontal slide and vertical slide
 * - Basic fade-in, blur-to-clear transitions
 * - Reset button to replay animation
 * - Self-contained with no external dependencies
 */

// Animation variant types
type AnimationVariant = 'horizontal' | 'vertical';

interface DeepSentenceProps {
  variant?: AnimationVariant;
}

const DeepSentence: React.FC<DeepSentenceProps> = ({ 
  variant = 'horizontal' 
}) => {
  // State for reset button and animation control
  const [key, setKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentVariant, setCurrentVariant] = useState<AnimationVariant>(variant);
  
  // Toggle animation variant
  const toggleVariant = useCallback(() => {
    setCurrentVariant(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  }, []);
  
  // Reset function to replay animation
  const resetComponent = useCallback(() => {
    setKey(prevKey => prevKey + 1);
    setIsAnimating(true);
  }, []);
  
  // Set initial animation state
  useEffect(() => {
    setIsAnimating(true);
    
    // Optional: automatically set isAnimating to false after animation completes
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 1000); // Match this to animation duration
    
    return () => clearTimeout(timer);
  }, [key]);
  
  // Get animation class based on variant
  const getAnimationClass = () => {
    if (!isAnimating) return '';
    return currentVariant === 'horizontal' ? 'animate-intro-horizontal' : 'animate-intro-vertical';
  };
  
  return (
    <div className="deep-sentence-container">
      {/* Main sentence with intro animation */}
      <div 
        key={key} 
        className={`sentence-block ${styles.OpenRundeMedium20} ${getAnimationClass()}`}
      >
        How can I help you today?
      </div>
      
      {/* Controls */}
      <div className="controls">
        {/* Toggle button */}
        <button 
          onClick={toggleVariant}
          className="toggle-button"
          aria-label="Toggle animation variant"
          title="Toggle animation variant"
        >
          {currentVariant === 'horizontal' ? 'Using: Slide Left → Right' : 'Using: Slide Bottom → Top'}
        </button>
        
        {/* Reset button */}
        <button
          onClick={resetComponent}
          className="reset-button"
          aria-label="Reset animation"
          title="Reset animation"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1C4.1 1 1 4.1 1 8C1 11.9 4.1 15 8 15C11.9 15 15 11.9 15 8M15 8V3M15 3H10" 
              stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {/* Component styles with both animations */}
      <style jsx>{`
        .deep-sentence-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 800px;
          min-height: 60px;
          padding: 20px;
        }
        
        .sentence-block {
          position: relative;
          width: 100%;
          text-align: center;
          color: #5E5E5E;
          opacity: 1;
          margin-bottom: 20px;
        }
        
        .controls {
          display: flex;
          align-items: center;
          margin-top: 10px;
        }
        
        /* Horizontal animation (original) */
        .animate-intro-horizontal {
          animation: introAnimationHorizontal 1s ease-out forwards;
        }
        
        @keyframes introAnimationHorizontal {
          0% {
            opacity: 0;
            filter: blur(3px);
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateX(0);
          }
        }
        
        /* Vertical animation (new) */
        .animate-intro-vertical {
          animation: introAnimationVertical 1s ease-out forwards;
        }
        
        @keyframes introAnimationVertical {
          0% {
            opacity: 0;
            filter: blur(3px);
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateY(0);
          }
        }
        
        /* Button styles */
        .toggle-button {
          padding: 6px 12px;
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 12px;
          color: #555;
          cursor: pointer;
          margin-right: 10px;
          transition: background-color 0.2s ease;
        }
        
        .toggle-button:hover {
          background-color: #e9e9e9;
        }
        
        .reset-button {
          position: relative;
          background: transparent;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .reset-button:hover {
          background-color: #f0f0f0;
        }
        
        .reset-button:focus {
          outline: 1px solid #aaa;
        }
      `}</style>
    </div>
  );
};

export default DeepSentence; 