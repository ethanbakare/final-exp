import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';

/**
 * Props interface for text animation components
 */
interface DeepTextAnimationProps {
  text?: string;
  className?: string;
}

/**
 * Standard text animation component with vertical movement
 * Animates words with a fade-in + upward movement effect
 * Words appear sequentially with staggered timing
 */
export const DeepTextAnimation: React.FC<DeepTextAnimationProps> = ({
  text = "Pigs can fly if they believe",
  className = ''
}) => {
  // Key state to trigger animation reset
  const [key, setKey] = useState(0);
  
  // Reset animation by incrementing the key
  const resetAnimation = useCallback(() => {
    setKey(prevKey => prevKey + 1);
  }, []);
  
  return (
    <div className={styles.container} style={{ position: 'relative' }}>
      {/* AnimatedText receives a new key when reset to force re-mount */}
      <AnimatedText 
        key={key} 
        text={text} 
        className={className} 
      />
      
      {/* Reset button */}
      <button
        onClick={resetAnimation}
        style={{
          position: 'absolute',
          right: '-40px',
          top: '0',
          background: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        ↻
      </button>
      
      {/* Animation styles for standard animation */}
      <style jsx global>{`
        /* Keyframes for standard animation with vertical movement */
        @keyframes fadeInWord {
          from {
            opacity: 0;
            transform: translateY(10px);
            filter: blur(3px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        
        /* Styles for each animated word */
        .animated-word {
          display: inline-block;
          opacity: 0;
          animation: fadeInWord 0.5s forwards; /* Animation duration - adjust for speed */
          margin-right: 0.25em;
        }
        
        .animated-word:last-child {
          margin-right: 0;
        }
        
        @media (max-width: 480px) {
          .text-container {
            max-width: 200px;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Horizontal-only text animation component
 * Animates words with fade-in effect but no vertical movement
 * Handles text wrapping responsively based on container width
 */
export const DeepTextAnimationHorizontal: React.FC<DeepTextAnimationProps> = ({
  text = "a man jumped on the moon and he couldn't dive because it was definitely not an ocean",
  className = ''
}) => {
  // Key state to trigger animation reset
  const [key, setKey] = useState(0);
  
  // Reset animation by incrementing the key
  const resetAnimation = useCallback(() => {
    setKey(prevKey => prevKey + 1);
  }, []);
  
  return (
    <div className={styles.container} style={{ position: 'relative' }}>
      {/* HorizontalAnimatedText receives a new key when reset to force re-mount */}
      <HorizontalAnimatedText 
        key={key} 
        text={text} 
        className={className} 
      />
      
      {/* Responsive Reset button */}
      <button
        onClick={resetAnimation}
        className="responsive-reset-button"
        aria-label="Reset animation"
      >
        ↻
      </button>
      
      {/* Animation styles for horizontal-only animation */}
      <style jsx global>{`
        /* Keyframes for horizontal animation without vertical movement */
        @keyframes fadeInWordHorizontal {
          from {
            opacity: 0;
            filter: blur(3px);
          }
          to {
            opacity: 1;
            filter: blur(0);
          }
        }
        


/*___________________________________________________________
___________________________________________________________
___________________________________________________________
___________________________________________________________
CHANGE THE WORD SPEED HERE
___________________________________________________________
___________________________________________________________
___________________________________________________________

*/

        /* Styles for each animated word */
        .animated-word-horizontal {
          display: inline-block;
          opacity: 0;
          animation: fadeInWordHorizontal 0.5s forwards; /* Animation duration - adjust for speed */
          margin-right: 0.25em;
        }
        
        .animated-word-horizontal:last-child {
          margin-right: 0;
        }
        
        /* Responsive reset button styles */
        .responsive-reset-button {
          position: absolute;
          top: 0;
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s ease;
          right: 10px; /* Default position for larger screens */
        }
        
        /* Move button to top-right of content on smaller screens */
        @media (max-width: 768px) {
          .responsive-reset-button {
            right: 0;
            top: -25px;
          }
        }
        
        /* For very small screens */
        @media (max-width: 480px) {
          .responsive-reset-button {
            top: -25px;
            right: 0;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Props interface for the internal animated text components
 */
interface AnimatedTextProps {
  text: string;
  className?: string;
}

/**
 * Internal component that handles the standard text animation
 * Calculates line breaks based on container width for responsive layout
 */
const AnimatedText: React.FC<AnimatedTextProps> = ({ text, className }) => {
  // Reference to the container for width calculations
  const containerRef = useRef<HTMLDivElement>(null);
  // State to store calculated line breaks
  const [wordGroups, setWordGroups] = useState<string[][]>([]);
  
  // Split text into words
  const words = text.split(/\s+/);
  
  // Calculate line breaks based on container width
  useEffect(() => {
    if (!containerRef.current) return;
    
    const calculateLineBreaks = () => {
      const container = containerRef.current;
      if (!container) return;
      
      // Create a temporary span to measure text width
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.whiteSpace = 'nowrap';
      tempSpan.style.fontFamily = 'Open Runde';
      tempSpan.style.fontSize = '20px';
      tempSpan.style.fontWeight = '500';
      
      container.appendChild(tempSpan);
      
      // Calculate which words fit on each line based on container width
      const maxWidth = container.clientWidth;
      const lines: string[][] = [[]];
      let currentLine = 0;
      let currentWidth = 0;
      
      words.forEach(word => {
        tempSpan.textContent = word;
        const wordWidth = tempSpan.getBoundingClientRect().width;
        
        // Add space width for all but first word in line
        const spaceWidth = lines[currentLine].length > 0 ? 8 : 0;
        
        if (currentWidth + wordWidth + spaceWidth <= maxWidth || lines[currentLine].length === 0) {
          // Word fits on current line
          lines[currentLine].push(word);
          currentWidth += wordWidth + spaceWidth;
        } else {
          // Word doesn't fit, start a new line
          lines.push([word]);
          currentLine++;
          currentWidth = wordWidth;
        }
      });
      
      container.removeChild(tempSpan);
      setWordGroups(lines);
    };
    
    calculateLineBreaks();
    
    // Recalculate on resize for responsive behavior
    const resizeObserver = new ResizeObserver(calculateLineBreaks);
    const currentRef = containerRef.current; // Save ref value for cleanup
    
    if (currentRef) {
      resizeObserver.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        resizeObserver.unobserve(currentRef);
      }
    };
  }, [words]);
  
  return (
    <div 
      ref={containerRef}
      className={`text-container ${styles.OpenRundeMedium20} ${className}`}
      style={{
        width: '244px',
        minHeight: '29px',
        color: '#5E5E5E',
        display: 'block',
        position: 'relative',
        textAlign: 'left'
      }}
    >
      {wordGroups.length > 0 ? (
        // Render each line of words with appropriate animations
        wordGroups.map((line, lineIndex) => (
          <div key={`line-${lineIndex}`} style={{ display: 'block' }}>
            {line.map((word, wordIndex) => (
              <span
                key={`word-${lineIndex}-${wordIndex}`}
                className="animated-word"
                style={{
                  // Staggered animation delay based on word position
                  animationDelay: `${(lineIndex * line.length + wordIndex) * 0.15}s`
                }}
              >
                {word}
              </span>
            ))}
          </div>
        ))
      ) : (
        // Fallback while calculating line breaks
        words.map((word, index) => (
          <span
            key={`word-${index}`}
            className="animated-word"
            style={{
              animationDelay: `${index * 0.15}s`
            }}
          >
            {word}
          </span>
        ))
      )}
    </div>
  );
};

/**
 * Internal component that handles the horizontal-only text animation
 * Uses the same responsive line break calculation as AnimatedText
 * But with horizontal-only animations (no vertical movement)
 */
const HorizontalAnimatedText: React.FC<AnimatedTextProps> = ({ text, className }) => {
  // Split text into words
  const words = text.split(/\s+/);
  
  return (
    <div 
      className={`text-container-horizontal ${styles.OpenRundeMedium20} ${className}`}
      style={{
        width: '100%', // Controls how the text wraps - change this value to adjust wrapping
        maxWidth: '800px',
        minHeight: '29px',
        color: '#5E5E5E',
        display: 'block',
        position: 'relative',
        textAlign: 'left'
      }}
    >
      {/* Simple approach - just iterate through words */}
      {words.map((word, index) => (
        <span
          key={`word-${index}`}
          className="animated-word-horizontal"
          style={{
            animationDelay: `${index * 0.07}s` // Delay for sequential animation - adjust for speed
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
};

// Named components are already exported individually
// Also provide a named variable for default export to satisfy linting
const deepTextAnimationComponents = {
  DeepTextAnimation,
  DeepTextAnimationHorizontal
};

export default deepTextAnimationComponents;