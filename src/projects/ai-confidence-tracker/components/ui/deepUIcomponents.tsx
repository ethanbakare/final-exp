import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';
import { LowConfidenceTooltip, MediumConfidenceTooltip } from './deepButtons';

interface StyledTextProps {
  text: string;
  className?: string;
}

export const StyledText: React.FC<StyledTextProps> = ({
  text = "The quick brown fox jumps over the lazy dog",
  className = ''
}) => {
  // New state for animation control
  const [key, setKey] = useState(0);
  const [textAnimating, setTextAnimating] = useState(true);
  
  // Reset function to replay animation
  const resetAnimation = useCallback(() => {
    setKey(prevKey => prevKey + 1);
    setTextAnimating(true);
  }, []);
  
  // Handle text animation completion
  const handleTextAnimationEnd = useCallback(() => {
    setTextAnimating(false);
  }, []);
  
  // Set animation state on mount and reset
  useEffect(() => {
    setTextAnimating(true);
    
    // Animation duration - keep in sync with CSS
    const animationDuration = 600; // 0.6 second - faster animation
    
    // Set timer to mark text animation as complete
    const timer = setTimeout(() => {
      handleTextAnimationEnd();
    }, animationDuration);
    
    return () => clearTimeout(timer);
  }, [key, handleTextAnimationEnd]);
  
  return (
    <>
      <div className={styles.container}>
        <div className="styled-text-container">
          {/* Text with horizontal animation */}
          <div
            key={key}
            className={`styled-text ${className} ${styles.OpenRundeMedium20} ${textAnimating ? 'animate-text-intro-horizontal' : ''}`}
            onAnimationEnd={handleTextAnimationEnd}
          >
            {text}
          </div>
          
          {/* Reset button */}
          <button
            onClick={resetAnimation}
            className="reset-button"
            aria-label="Replay animation"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 15C7.325 15 5.90625 14.4188 4.74375 13.2563C3.58125 12.0938 3 10.675 3 9C3 7.325 3.58125 5.90625 4.74375 4.74375C5.90625 3.58125 7.325 3 9 3C9.8625 3 10.6875 3.17813 11.475 3.53438C12.2625 3.89063 12.9375 4.4 13.5 5.0625V3.75C13.5 3.5375 13.5719 3.35938 13.7156 3.21563C13.8594 3.07188 14.0375 3 14.25 3C14.4625 3 14.6406 3.07188 14.7844 3.21563C14.9281 3.35938 15 3.5375 15 3.75V7.5C15 7.7125 14.9281 7.89063 14.7844 8.03438C14.6406 8.17813 14.4625 8.25 14.25 8.25H10.5C10.2875 8.25 10.1094 8.17813 9.96563 8.03438C9.82188 7.89063 9.75 7.7125 9.75 7.5C9.75 7.2875 9.82188 7.10938 9.96563 6.96563C10.1094 6.82188 10.2875 6.75 10.5 6.75H12.9C12.5 6.05 11.9531 5.5 11.2594 5.1C10.5656 4.7 9.8125 4.5 9 4.5C7.75 4.5 6.6875 4.9375 5.8125 5.8125C4.9375 6.6875 4.5 7.75 4.5 9C4.5 10.25 4.9375 11.3125 5.8125 12.1875C6.6875 13.0625 7.75 13.5 9 13.5C9.85 13.5 10.6281 13.2844 11.3344 12.8531C12.0406 12.4219 12.5875 11.8438 12.975 11.1188C13.075 10.9438 13.2156 10.8219 13.3969 10.7531C13.5781 10.6844 13.7625 10.6813 13.95 10.7438C14.15 10.8063 14.2938 10.9375 14.3813 11.1375C14.4688 11.3375 14.4625 11.525 14.3625 11.7C13.85 12.7 13.1188 13.5 12.1688 14.1C11.2188 14.7 10.1625 15 9 15Z" fill="#5E5E5E" fillOpacity="0.45"/>
            </svg>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .styled-text-container {
          position: relative;
          width: 546px;
          height: auto;
          min-height: 29px;
          margin: 0;
          padding: 0;
        }
        
        .styled-text {
          width: 100%;
          height: 29px;
          letter-spacing: -0.01em;
          color: var(--darkGrey);
          position: relative;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
          z-index: 0;
        }
        
        /* Horizontal text intro animation */
        .animate-text-intro-horizontal {
          animation: textIntroAnimationHorizontal 0.6s ease-out forwards;
          opacity: 0;
          filter: blur(3px);
          transform: translateX(-10px);
        }
        
        @keyframes textIntroAnimationHorizontal {
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
        
        .reset-button {
          position: absolute;
          right: -30px;
          bottom: -15px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f0f0f0;
          border: 1px solid #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          padding: 0;
          transition: background-color 0.2s ease;
        }
        
        .reset-button:hover {
          background-color: #e0e0e0;
        }
        
        .reset-button svg {
          width: 18px;
          height: 18px;
          transition: transform 0.2s ease;
        }
        
        .reset-button:hover svg {
          transform: rotate(30deg);
        }
        
        @media (max-width: 768px) {
          .styled-text-container {
            width: 100%;
            max-width: 546px;
          }
          
          .styled-text {
            height: auto;
            min-height: 29px;
          }
        }
      `}</style>
    </>
  );
};

// Define confidence levels and their corresponding colors
export type ConfidenceLevel = 'low' | 'medium' | 'high';

// Map confidence levels to actual CSS colors
const CONFIDENCE_COLORS = {
  low: '#EF4444',    // Low confidence - red
  medium: '#F59E0B', // Medium confidence - orange/yellow
  high: '#22C55E'    // High confidence - green
};

// Map confidence levels to focus highlight background colors
const FOCUS_HIGHLIGHT_COLORS = {
  low: '#FEE2E2',    // Light red for low confidence
  medium: '#FEF3C7', // Light yellow for medium confidence
  high: '#DCFCE7'    // Light green for high confidence
};

interface HighlightItem {
  wordId: number;
  confidenceLevel: ConfidenceLevel;
  percentage?: string;
}

interface HighlightedTextProps {
  text: string;
  highlightWords?: string[];
  defaultConfidenceLevel?: ConfidenceLevel;
  highlights?: HighlightItem[];
  className?: string;
  // Controlled component props for symbiotic behavior
  activeWordId?: number | null;
  onWordInteraction?: (wordId: number | null) => void;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text = "The quick brown fox jumps over the lazy dog",
  highlightWords = [],
  defaultConfidenceLevel = 'low',
  highlights = [],
  className = '',
  activeWordId,
  onWordInteraction
}) => {
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [highlightPositions, setHighlightPositions] = useState<Array<{left: number, width: number, top: number, confidenceLevel: ConfidenceLevel}>>([]);
  const [wordPositions, setWordPositions] = useState<Array<{left: number, width: number, top: number, height: number, confidenceLevel: ConfidenceLevel, groupIndex: number, wordId: number}>>([]);
  const [animateHighlights, setAnimateHighlights] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  // Text height is managed in the DOM without needing state tracking
  const focusHighlightExtraPadding = 1; // Extra padding for focus highlight
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // State for text block animation
  const [key, setKey] = useState(0); // For animation reset
  const [textAnimating, setTextAnimating] = useState(true); // Track text animation state
  
  // Track if we're in a touch interaction to prevent double-firing
  const touchActiveRef = useRef(false);
  
  // Derive active word index from activeWordId prop
  const activeWordIndex = useMemo(() => {
    if (activeWordId === null || activeWordId === undefined) return null;
    
    // Find the index in wordPositions array that has the matching wordId
    const positionIndex = wordPositions.findIndex(wp => wp.wordId === activeWordId);
    return positionIndex !== -1 ? positionIndex : null;
  }, [activeWordId, wordPositions]);
  
  // Derive tooltip visibility from activeWordId
  const shouldShowTooltip = activeWordId !== null && activeWordId !== undefined && showTooltip;
  
  // Reset all animations function
  const resetAnimation = useCallback(() => {
    // Reset animation states
    setAnimateHighlights(false);
    setShowTooltip(false);
    setKey(prevKey => prevKey + 1); // Force re-render of text
    setTextAnimating(true); // Start text animation
    
    // Clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  // Handle text animation completion and start highlight animation
  const handleTextAnimationEnd = useCallback(() => {
    setTextAnimating(false); // Text animation is complete
    
    // Start highlight animations after text animation completes
    setTimeout(() => {
      setAnimateHighlights(true);
    }, 30); // Reduced buffer after text animation completes
  }, []);
  
  // Text animation effect
  useEffect(() => {
    if (textAnimating) {
      // Animation duration - keep in sync with CSS
      const animationDuration = 600; // 0.6 second - faster animation
      
      // Set timer to mark text animation as complete
      const timer = setTimeout(() => {
        handleTextAnimationEnd();
      }, animationDuration);
      
      return () => clearTimeout(timer);
    }
  }, [textAnimating, handleTextAnimationEnd]);
  
  // Handle tap outside highlighted word to clear selection
  useEffect(() => {
    const handleTouchOutside = (e: TouchEvent) => {
      const target = e.target;
      const container = textContainerRef.current;
      
      // Ensure target is an Element before calling closest
      if (!(target instanceof Element)) return;
      
      // Check if touch is on a confidence badge (to avoid clearing when touching badges)
      const isBadgeTouch = target.closest('.confidence-badge') || 
                          target.closest('.mastercon-badge');
      
      if (container && !container.contains(target) && !isBadgeTouch) {
        // Touch was outside the container and not on a badge, clear the highlight
        if (onWordInteraction) {
          onWordInteraction(null);
        }
      }
    };
    
    document.addEventListener('touchstart', handleTouchOutside);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [onWordInteraction]);
  
  // Show tooltip after focus highlight appears - REPLACED IMPLEMENTATION
  useEffect(() => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (activeWordId !== null && activeWordId !== undefined) {
      // Set new timer for showing tooltip
      timerRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 400);
    } else {
      // No word is hovered, hide tooltip
      setShowTooltip(false);
    }
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeWordId]);
  
  // Get color for confidence level
  const getConfidenceColor = (level: ConfidenceLevel): string => {
    return CONFIDENCE_COLORS[level] || CONFIDENCE_COLORS.low;
  };
  
  // Get focus highlight background color
  const getFocusHighlightColor = (level: ConfidenceLevel): string => {
    return FOCUS_HIGHLIGHT_COLORS[level] || FOCUS_HIGHLIGHT_COLORS.low;
  };
  
  // Handle word interaction (mouse or touch)
  const handleWordClick = useCallback((wordId: number) => {
    if (onWordInteraction) {
      onWordInteraction(wordId);
    }
  }, [onWordInteraction]);
  
  // Get confidence percentage for tooltips - now supports custom percentages
  const getConfidencePercentage = (level: ConfidenceLevel, wordId?: number): string => {
    // First, check if we have a custom percentage for this specific wordId
    if (wordId !== undefined) {
      const highlight = highlights.find(h => h.wordId === wordId);
      if (highlight && highlight.percentage) {
        return highlight.percentage;
      }
    }
    
    // Fallback to default percentages based on confidence level
    switch (level) {
      case 'low':
        return '55%';
      case 'medium':
        return '75%';
      case 'high':
        return '95%';
      default:
        return '55%';
    }
  };
  
  useEffect(() => {
    if (!textContainerRef.current) return;
    
    const measureWordsWithSpans = () => {
      const container = textContainerRef.current;
      if (!container) return [];
      
      // Clear container first
      const existingContent = container.textContent || '';
      container.innerHTML = '';
      
      // Split text into words and spaces (KEEP SPACES for proper positioning)
      const words = text.split(/(\s+)/);
      
      // Create unique ID-based mapping for highlights (map to actual word positions, not array indices)
      const idHighlights = new Map<number, ConfidenceLevel>();
      
      highlights.forEach(item => {
        idHighlights.set(item.wordId, item.confidenceLevel);
      });
      
      // Also handle highlightWords array for backward compatibility
      highlightWords.forEach((word) => {
        // Find word position for backward compatibility
        let wordCount = 0;
        for (let i = 0; i < words.length; i++) {
          if (words[i].trim() === '') continue; // Skip spaces for counting
          const cleanWord = words[i].replace(/[.,!?;:]/g, '').toLowerCase();
          if (cleanWord === word.toLowerCase() && !idHighlights.has(wordCount)) {
            idHighlights.set(wordCount, defaultConfidenceLevel);
            break;
          }
          wordCount++;
        }
      });
      
      // Create spans for each word and space
      let wordPosition = 0; // Track actual word position (excluding spaces)
      words.forEach((word, _index) => {
        const span = document.createElement('span');
        span.textContent = word;
        
        // Check if this is a space or a word
        if (word.trim() === '') {
          // This is a space - mark it but don't increment word position
          span.dataset.space = 'true';
          span.dataset.index = _index.toString();
        } else {
          // This is a word - check if this word position should be highlighted
          if (idHighlights.has(wordPosition)) {
            span.dataset.highlight = 'true';
            span.dataset.confidenceLevel = idHighlights.get(wordPosition) || defaultConfidenceLevel;
            span.dataset.index = _index.toString();
          }
          wordPosition++; // Only increment for actual words
        }
        
        container.appendChild(span);
      });
      
      // Find all the highlighted spans
      const highlightedSpans = Array.from(container.querySelectorAll('span[data-highlight="true"]')) as HTMLSpanElement[];
      
      // Measure each highlighted span
      const wordHighlights: Array<{
        left: number, 
        width: number, 
        top: number,
        height: number,
        confidenceLevel: ConfidenceLevel,
        index: number,
        wordId: number  // Add wordId to track which word this position represents
      }> = [];
      
      highlightedSpans.forEach(span => {
        const rect = span.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const index = parseInt(span.dataset.index || '0', 10);
        
        // Find the wordId for this span by looking at which word position it represents
        let wordId = -1;
        let wordCounter = 0;
        words.forEach((word, wordIndex) => {
          if (word.trim() !== '') { // Only count actual words
            if (wordIndex === index) {
              wordId = wordCounter;
            }
            wordCounter++;
          }
        });
        
        wordHighlights.push({
          left: rect.left - containerRect.left,
          width: rect.width,
          top: rect.bottom - containerRect.top,
          height: rect.height,
          confidenceLevel: (span.dataset.confidenceLevel as ConfidenceLevel) || defaultConfidenceLevel,
          index: index,
          wordId: wordId
        });
      });
      
      // Sort by index to maintain order
      wordHighlights.sort((a, b) => a.index - b.index);
      
      // Store individual word positions for hover tracking
      setWordPositions(wordHighlights.map(word => ({
        ...word,
        groupIndex: -1, // Will be set below
        wordId: word.wordId
      })));
      
      // Create the final position data, merging adjacent highlights where appropriate
      const positions: Array<{left: number, width: number, top: number, confidenceLevel: ConfidenceLevel}> = [];
      
      // Process the highlights to connect adjacent ones on the same line
      let i = 0;
      while (i < wordHighlights.length) {
        const current = wordHighlights[i];
        let endPosition = i;
        
        // Check for adjacent highlights with same confidence level on same line
        while (endPosition + 1 < wordHighlights.length) {
          const next = wordHighlights[endPosition + 1];
          
          // Check if they're on the same line (top position within small tolerance)
          const onSameLine = Math.abs(current.top - next.top) < 3;
          
          // Check if they have the same confidence level
          const sameConfidence = current.confidenceLevel === next.confidenceLevel;
          
          // Check if they're sequential (might have a space between)
          const sequential = next.index - wordHighlights[endPosition].index <= 2;
          
          if (onSameLine && sameConfidence && sequential) {
            endPosition++;
          } else {
            break;
          }
        }
        
        if (endPosition > i) {
          // We have adjacent highlights to merge
          const start = current;
          const end = wordHighlights[endPosition];
          
          // Add the combined highlight
          const groupIndex = positions.length;
          positions.push({
            left: start.left,
            width: (end.left + end.width) - start.left,
            top: start.top,
            confidenceLevel: start.confidenceLevel
          });
          
          // Update group index for individual words
          for (let j = i; j <= endPosition; j++) {
            setWordPositions(prev => prev.map((wp, index) => {
              if (index === j) {
                return { ...wp, groupIndex };
              }
              return wp;
            }));
          }
          
          i = endPosition + 1;
        } else {
          // Just add the single highlight
          const groupIndex = positions.length;
          positions.push({
            left: current.left,
            width: current.width,
            top: current.top,
            confidenceLevel: current.confidenceLevel
          });
          
          // Update group index for individual word
          setWordPositions(prev => prev.map((wp, index) => {
            if (index === i) {
              return { ...wp, groupIndex };
            }
            return wp;
          }));
          
          i++;
        }
      }
      
      // Restore original content
      container.innerHTML = '';
      container.textContent = existingContent;
      
      return positions;
    };
    
    // Call measurements after rendering
    setTimeout(() => {
      const positions = measureWordsWithSpans();
      setHighlightPositions(positions);
    }, 0);
    
  }, [text, highlightWords, highlights, defaultConfidenceLevel]);
  
  return (
    <div className={styles.container}>
      <div className="highlighted-text-container">
        {/* Text container with refs for measurement and animation */}
        <div 
          key={key} 
          ref={textContainerRef} 
          className={`text-content ${styles.OpenRundeMedium20} ${className} ${textAnimating ? 'animate-text-intro-horizontal' : ''}`}
          onAnimationEnd={handleTextAnimationEnd}
        >
          {text}
        </div>
        
        {/* Underline highlight lines - only animate after text animation completes */}
        {highlightPositions.map((pos, index) => (
          <div
            key={`underline-${index}`}
            className={`highlight-line ${animateHighlights ? 'animate-width' : ''}`}
            style={{
              left: `${pos.left - 2}px`,
              width: `${pos.width + 4}px`,
              top: `${pos.top - 2}px`,
              backgroundColor: getConfidenceColor(pos.confidenceLevel)
            }}
            data-original-width={`${pos.width + 4}px`}
          />
        ))}
        
        {/* Individual word hover areas, focus highlights, and tooltips */}
        {wordPositions.map((word, index) => (
          <React.Fragment key={`word-${index}`}>
            {/* Hover/touch area for individual word */}
            <div 
              className="highlight-hover-area"
              style={{
                left: `${word.left - 2}px`,
                width: `${word.width + 4}px`,
                top: `${word.top - word.height}px`, // Position based on word height
                height: `${word.height + 2}px` // Height based on word height plus a little extra
              }}
              onMouseEnter={() => {
                // Only handle mouse hover if not in a touch interaction
                if (!touchActiveRef.current) {
                  const wordId = wordPositions[index]?.wordId;
                  if (wordId !== undefined && onWordInteraction) {
                    onWordInteraction(wordId);
                  }
                }
              }}
              onMouseLeave={() => {
                // Only handle mouse leave if not in a touch interaction
                if (!touchActiveRef.current && onWordInteraction) {
                  onWordInteraction(null);
                }
              }}
              onTouchStart={(e) => {
                e.preventDefault(); // Prevent scrolling/zooming
                e.stopPropagation(); // Stop event from bubbling up
                
                // Set touch active flag to prevent mouse events
                touchActiveRef.current = true;
                
                // Get wordId from the wordPositions array for this specific word
                const wordId = wordPositions[index]?.wordId;
                if (wordId !== undefined) {
                  handleWordClick(wordId);
                }
                
                // Reset touch flag after a short delay
                setTimeout(() => {
                  touchActiveRef.current = false;
                }, 300);
              }}
            />
            
            {/* Focus highlight for individual word */}
            <div
              className="focus-highlight-grow"
              style={{
                position: 'absolute',
                left: `${word.left - 2}px`,
                width: `${word.width + 4}px`,
                top: `${word.top - 1 - (activeWordIndex === index ? word.height + focusHighlightExtraPadding : 0)}px`,
                height: activeWordIndex === index ? `${word.height + focusHighlightExtraPadding}px` : '0px',
                backgroundColor: getFocusHighlightColor(word.confidenceLevel),
                borderRadius: '4.5px 4.5px 0px 0px',
                transformOrigin: 'bottom',
                transform: 'translateZ(0)', // Hardware acceleration
                mixBlendMode: 'multiply',
                willChange: 'height, top',
                pointerEvents: 'none',
                zIndex: 0
              }}
            />
            
            {/* Confidence tooltip */}
            {activeWordIndex === index && shouldShowTooltip && (
              <div 
                className="confidence-tooltip-container tooltip-animate-in"
                style={{
                  position: 'absolute',
                  left: `${word.left + (word.width / 2)}px`,
                  top: `${word.top - 1 - word.height - focusHighlightExtraPadding - 24}px`, // 12px above focus highlight (increased from 4px)
                  transform: 'translateX(-50%)', // Center horizontally
                  opacity: 1,
                  zIndex: 999,
                  pointerEvents: 'none'
                }}
              >
                {word.confidenceLevel === 'low' ? (
                  <LowConfidenceTooltip percentage={getConfidencePercentage(word.confidenceLevel, word.wordId)} />
                ) : word.confidenceLevel === 'medium' ? (
                  <MediumConfidenceTooltip percentage={getConfidencePercentage(word.confidenceLevel, word.wordId)} />
                ) : null}
              </div>
            )}
          </React.Fragment>
        ))}
        
        {/* Reset animation button */}
        {highlightPositions.length > 0 && (
          <button
            onClick={resetAnimation}
            className="reset-button"
            aria-label="Replay animation"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 15C7.325 15 5.90625 14.4188 4.74375 13.2563C3.58125 12.0938 3 10.675 3 9C3 7.325 3.58125 5.90625 4.74375 4.74375C5.90625 3.58125 7.325 3 9 3C9.8625 3 10.6875 3.17813 11.475 3.53438C12.2625 3.89063 12.9375 4.4 13.5 5.0625V3.75C13.5 3.5375 13.5719 3.35938 13.7156 3.21563C13.8594 3.07188 14.0375 3 14.25 3C14.4625 3 14.6406 3.07188 14.7844 3.21563C14.9281 3.35938 15 3.5375 15 3.75V7.5C15 7.7125 14.9281 7.89063 14.7844 8.03438C14.6406 8.17813 14.4625 8.25 14.25 8.25H10.5C10.2875 8.25 10.1094 8.17813 9.96563 8.03438C9.82188 7.89063 9.75 7.7125 9.75 7.5C9.75 7.2875 9.82188 7.10938 9.96563 6.96563C10.1094 6.82188 10.2875 6.75 10.5 6.75H12.9C12.5 6.05 11.9531 5.5 11.2594 5.1C10.5656 4.7 9.8125 4.5 9 4.5C7.75 4.5 6.6875 4.9375 5.8125 5.8125C4.9375 6.6875 4.5 7.75 4.5 9C4.5 10.25 4.9375 11.3125 5.8125 12.1875C6.6875 13.0625 7.75 13.5 9 13.5C9.85 13.5 10.6281 13.2844 11.3344 12.8531C12.0406 12.4219 12.5875 11.8438 12.975 11.1188C13.075 10.9438 13.2156 10.8219 13.3969 10.7531C13.5781 10.6844 13.7625 10.6813 13.95 10.7438C14.15 10.8063 14.2938 10.9375 14.3813 11.1375C14.4688 11.3375 14.4625 11.525 14.3625 11.7C13.85 12.7 13.1188 13.5 12.1688 14.1C11.2188 14.7 10.1625 15 9 15Z" fill="#5E5E5E" fillOpacity="0.45"/>
            </svg>
          </button>
        )}
      </div>
      
      <style jsx>{`
        .highlighted-text-container {
          position: relative;
          width: 546px;
          height: auto;
          min-height: 29px;
          margin: 0;
          padding: 0;
        }
        
        .text-content {
          position: relative;
          width: 100%;
          height: auto;
          min-height: 29px;
          letter-spacing: -0.01em;
          color: var(--darkGrey);
          z-index: 2;
        }
        
        /* Horizontal text intro animation */
        .animate-text-intro-horizontal {
          animation: textIntroAnimationHorizontal 0.6s ease-out forwards;
          opacity: 0;
          filter: blur(3px);
          transform: translateX(-10px);
        }
        
        @keyframes textIntroAnimationHorizontal {
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
        
        .highlight-hover-area {
          position: absolute;
          z-index: 3;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent; /* Remove default mobile tap highlight */
        }
        
        .highlight-line {
          position: absolute;
          height: 2px;
          border-radius: 3px;
          z-index: 1;
          transform-origin: left center;
          transform: scaleX(0);
          transition: none;
        }
        
        .highlight-line.animate-width {
          transform: scaleX(1);
          transition: transform 2.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .focus-highlight-grow {
          position: absolute;
          border-radius: 4.5px 4.5px 0px 0px;
          mix-blend-mode: multiply;
          z-index: 0;
          transition: height 0.25s cubic-bezier(0.4, 0, 0.2, 1), top 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .confidence-tooltip-container {
          position: absolute;
          transform: translateZ(0);
          will-change: opacity, transform;
          pointer-events: none;
          z-index: 999;
        }
        
        .tooltip-animate-in {
          animation: tooltipFadeIn 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
        }
        
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .reset-button {
          position: absolute;
          right: -30px;
          bottom: -15px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #f0f0f0;
          border: 1px solid #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          padding: 0;
          transition: background-color 0.2s ease;
        }
        
        .reset-button:hover {
          background-color: #e0e0e0;
        }
        
        .reset-button svg {
          width: 18px;
          height: 18px;
          transition: transform 0.2s ease;
        }
        
        .reset-button:hover svg {
          transform: rotate(30deg);
        }
        
        @media (max-width: 768px) {
          .highlighted-text-container {
            width: 100%;
            max-width: 546px;
          }
        }
      `}</style>
    </div>
  );
};

// Named components are already exported individually
// Also provide a named variable for default export to satisfy linting
const deepUIComponents = {
  StyledText,
  HighlightedText
};

export default deepUIComponents;