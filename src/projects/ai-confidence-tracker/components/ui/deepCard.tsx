import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';
import { 
  LowConfidenceBadge, 
  MediumConfidenceBadge,
  HighConfidenceBadge
} from './deepButtons';
import { TranscriptBar } from './transcript-bar';
import { TranscriptBoxNav, NavState } from './transcript-box-nav';
import { TranscriptTextStates, TextState } from './transcript-text-states';

interface DeepCardProps {
  transcriptText?: string;
  highlights?: Array<{wordId: number, confidenceLevel: 'low' | 'medium' | 'high', percentage?: string}>;
  // New props for state management
  initialNavState?: NavState;
  initialTextState?: TextState;
  // Error state props
  errorType?: 'microphone_permission' | 'network_error' | 'file_too_large' | 'empty_recording' | 'browser_compatibility' | 'recording_hardware_failure';
  errorMessage?: string;
}

export const DeepCard: React.FC<DeepCardProps> = ({
  transcriptText = "A quick brown fox jumps over the lazy dog",
  highlights = [
    { wordId: 0, confidenceLevel: 'low', percentage: '42%' },     // "The" - custom percentage
    { wordId: 2, confidenceLevel: 'medium', percentage: '78%' },  // "brown" - custom percentage
    { wordId: 5, confidenceLevel: 'low', percentage: '31%' },     // "over" - custom percentage
    { wordId: 6, confidenceLevel: 'low', percentage: '20%' }      // "the" (second instance) - uses default
  ],
  initialNavState = 'initial',
  initialTextState = 'initial',
  errorType,
  errorMessage
}) => {
  // Navigation and text state management
  const [navState, setNavState] = useState<NavState>(initialNavState);
  const [textState, setTextState] = useState<TextState>(initialTextState);
  
  // Single source of truth for which word/badge is currently active
  const [activeWordId, setActiveWordId] = useState<number | null>(null);
  
  // Track badge states for visual control
  const [badgeStates, setBadgeStates] = useState<Map<number, boolean>>(new Map());

  // Track collapse state for dropdown functionality
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default

  // Timer for delayed ModelCopy reset to prevent flickering
  const modelCopyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer for processing simulation - CRITICAL for cancel functionality
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer for dropdown auto-expansion delay
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Separate state for ModelCopy display (with delayed updates)
  const [modelCopyActiveWordId, setModelCopyActiveWordId] = useState<number | null>(null);

  // Track if last interaction was touch (to skip delay)
  const lastInteractionWasTouchRef = useRef<boolean>(false);

  // Track if we're on mobile for responsive text
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile device on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Check on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Auto-manage dropdown state based on navigation state
  useEffect(() => {
    // Clear any existing dropdown timer
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
      dropdownTimerRef.current = null;
    }

    if (navState === 'results') {
      // Delay dropdown expansion to allow text to slide in first
      dropdownTimerRef.current = setTimeout(() => {
        setIsCollapsed(false);
        dropdownTimerRef.current = null;
      }, 300); // 300ms delay for text animation
    } else {
      // Immediately collapse for non-results states
      setIsCollapsed(true);
    }

    // Cleanup on state change
    return () => {
      if (dropdownTimerRef.current) {
        clearTimeout(dropdownTimerRef.current);
        dropdownTimerRef.current = null;
      }
    };
  }, [navState]);

  // Navigation event handlers
  const handleRecordClick = () => {
    // Clear any existing processing timer
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    
    setNavState('recording');
    setTextState('recording');
    clearInteraction();
  };

  const handleRecordingClick = () => {
    // Clear any existing processing timer first
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    
    setNavState('processing');
    setTextState('processing');
    clearInteraction();
    
    // Simulate processing completion after 3 seconds - store the timer reference
    processingTimerRef.current = setTimeout(() => {
      setNavState('results');
      setTextState('results');
      processingTimerRef.current = null; // Clear reference after completion
    }, 3000);
  };

  const handleCancelClick = () => {
    // CRITICAL: Clear the processing timer to prevent automatic transition to results
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    
    setNavState('initial');
    setTextState('initial');
    clearInteraction();
  };

  const handleClearClick = () => {
    // Clear any existing processing timer
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    
    setNavState('initial');
    setTextState('initial');
    clearInteraction();
  };

  // Handle dropdown button click - only works in results state
  const handleDropdownClick = () => {
    // Only allow manual dropdown control in results state
    if (navState === 'results') {
      setIsCollapsed(!isCollapsed);
      // Clear any active interactions when collapsing
      if (!isCollapsed) {
        clearInteraction();
      }
    }
  };

  // Clear all interactions
  const clearInteraction = useCallback(() => {
    setActiveWordId(null);
    setBadgeStates(new Map());
  }, []);

  // Handle retry button click - resets to initial state
  const handleRetryClick = useCallback(() => {
    // Clear any existing processing timer
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    
    setNavState('initial');
    setTextState('initial');
    clearInteraction();
  }, [clearInteraction]);

  // Unified hover/tap handler for text
  const handleTextInteraction = useCallback((wordId: number | null) => {
    if (activeWordId === wordId) {
      // Clicking the same word again - toggle off
      clearInteraction();
    } else {
      // Clicking a different word or first click - activate
      setActiveWordId(wordId);
      
      // Update badge states
      setBadgeStates(() => {
        const newMap = new Map();
        if (wordId !== null) {
          newMap.set(wordId, true);
        }
        return newMap;
      });
    }
  }, [activeWordId, clearInteraction]);

  // Unified hover/tap handler for badges  
  const handleBadgeInteraction = useCallback((wordId: number | null) => {
    if (activeWordId === wordId) {
      // Clicking the same badge again - toggle off
      clearInteraction();
    } else {
      // Clicking a different badge or first click - activate
      setActiveWordId(wordId);
      
      // Update badge states
      setBadgeStates(() => {
        const newMap = new Map();
        if (wordId !== null) {
          newMap.set(wordId, true);
        }
        return newMap;
      });
    }
  }, [activeWordId, clearInteraction]);

  // Handle touch outside to clear interaction
  useEffect(() => {
    const handleTouchOutside = (e: TouchEvent) => {
      const target = e.target;
      
      // Ensure target is an Element before calling closest
      if (!(target instanceof Element)) return;
      
      // Check if touch is on interactive elements
      const isTextTouch = target.closest('.highlight-hover-area');
      const isBadgeTouch = target.closest('.confidence-badge-wrapper') || target.closest('.confidence-badge');
      
      if (!isTextTouch && !isBadgeTouch) {
        lastInteractionWasTouchRef.current = true; // Mark as touch interaction
        clearInteraction();
      }
    };
    
    document.addEventListener('touchstart', handleTouchOutside);
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [clearInteraction]);

  // Effect to manage delayed ModelCopy updates
  useEffect(() => {
    // Clear any existing timer
    if (modelCopyResetTimerRef.current) {
      clearTimeout(modelCopyResetTimerRef.current);
      modelCopyResetTimerRef.current = null;
    }

    if (activeWordId !== null) {
      // Immediate update when a word becomes active
      setModelCopyActiveWordId(activeWordId);
    } else {
      // Check if last interaction was touch - if so, skip delay
      if (lastInteractionWasTouchRef.current) {
        setModelCopyActiveWordId(null);
        lastInteractionWasTouchRef.current = false; // Reset flag
      } else {
        // Delayed update when no word is active (to prevent flicker on hover)
        modelCopyResetTimerRef.current = setTimeout(() => {
          setModelCopyActiveWordId(null);
        }, 1000); // 1 second delay for hover
      }
    }

    // Cleanup on unmount
    return () => {
      if (modelCopyResetTimerRef.current) {
        clearTimeout(modelCopyResetTimerRef.current);
        modelCopyResetTimerRef.current = null;
      }
    };
  }, [activeWordId, clearInteraction]);

  // Cleanup processing timer on unmount
  useEffect(() => {
    return () => {
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
        processingTimerRef.current = null;
      }
      if (dropdownTimerRef.current) {
        clearTimeout(dropdownTimerRef.current);
        dropdownTimerRef.current = null;
      }
    };
  }, []);

  // Function to get badges in the order they appear in the text
  const getOrderedBadges = () => {
    const words = transcriptText.split(/\s+/);
    const orderedBadges: Array<{wordId: number, confidenceLevel: 'low' | 'medium' | 'high', originalText: string}> = [];
    
    highlights.forEach(highlight => {
      const word = words[highlight.wordId];
      if (word) {
        orderedBadges.push({
          wordId: highlight.wordId,
          confidenceLevel: highlight.confidenceLevel,
          originalText: word.replace(/[.,!?;:]/g, '') // Remove punctuation
        });
      }
    });
    
    // Sort by wordId to maintain text order
    orderedBadges.sort((a, b) => a.wordId - b.wordId);
    
    return orderedBadges;
  };

  const orderedBadges = getOrderedBadges();

  // Check if we're in high confidence state (no words highlighted)
  const isHighConfidenceState = highlights.length === 0;

  // Helper function to get word text from wordId
  const getWordFromId = (wordId: number): string => {
    const words = transcriptText.split(/\s+/);
    return words[wordId]?.replace(/[.,!?;:]/g, '') || '';
  };

  // Helper function to get percentage from wordId
  const getPercentageFromId = (wordId: number): string => {
    const highlight = highlights.find(h => h.wordId === wordId);
    if (highlight && highlight.percentage) {
      return highlight.percentage;
    }
    
    return '';
  };

  // Dynamic ModelCopy content
  const getModelCopyContent = () => {
    if (isHighConfidenceState) {
      // High confidence state - show different instruction
      return {
        text: "Press the clear button to start new transcription",
        hasHighlight: false
      };
    } else if (modelCopyActiveWordId === null || modelCopyActiveWordId === undefined) {
      // Default state - show responsive instruction
      return {
        text: isMobile ? "Tap a badge to view confidence score" : "Hover over a badge to view confidence score",
        hasHighlight: false
      };
    } else {
      // Active state - show specific confidence info
      const word = getWordFromId(modelCopyActiveWordId);
      const percentage = getPercentageFromId(modelCopyActiveWordId);
      
      return {
        text: `Model was ${percentage} confident in the transcribed word '${word}'`,
        hasHighlight: true,
        percentage,
        word
      };
    }
  };

  const modelCopyContent = getModelCopyContent();

  return (
    <div className={`transcript-interface ${styles.container}`}>
      <TranscriptBar 
        isMobile={isMobile}
        isHighConfidenceState={isHighConfidenceState}
        navState={navState}
      />
      
      <div className={`transcript-mainframe ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="transcript-box">
          <TranscriptTextStates
            textState={textState}
            transcriptText={transcriptText}
            highlights={highlights}
            activeWordId={activeWordId}
            onWordInteraction={handleTextInteraction}
            errorType={errorType}
            errorMessage={errorMessage}
          />
          <TranscriptBoxNav 
            navState={navState}
            onDropdownClick={handleDropdownClick}
            onClearClick={handleClearClick}
            onRecordClick={handleRecordClick}
            onRecordingClick={handleRecordingClick}
            onCancelClick={handleCancelClick}
            onRetryClick={handleRetryClick}
            errorType={errorType}
          />
        </div>
        
        <div className={`transcript-data ${isCollapsed ? 'hidden' : ''}`}>
          <div className="mastercon-badge">
            {isHighConfidenceState ? (
              <HighConfidenceBadge />
            ) : (
              orderedBadges.map((badge, index) => (
                <div
                  key={`badge-${index}`}
                  className="confidence-badge-wrapper"
                  onMouseEnter={() => handleBadgeInteraction(badge.wordId)}
                  onMouseLeave={clearInteraction}
                  onTouchStart={(e) => {
                    e.preventDefault(); // Prevent hover events on mobile
                    lastInteractionWasTouchRef.current = true; // Mark as touch interaction
                    handleBadgeInteraction(badge.wordId);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault(); // Prevent click events from firing
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {badge.confidenceLevel === 'medium' ? (
                    <MediumConfidenceBadge 
                      text={badge.originalText} 
                      isExternallyActive={badgeStates.get(badge.wordId) === true}
                      disableInternalClick={true}
                    />
                  ) : (
                    <LowConfidenceBadge 
                      text={badge.originalText} 
                      isExternallyActive={badgeStates.get(badge.wordId) === true}
                      disableInternalClick={true}
                    />
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className={`model-copy ${styles.OpenSansRegular16It}`}>
            {modelCopyContent.hasHighlight ? (
              <>
                Model was <span className={styles.OpenSansRegular16ItBold}>{modelCopyContent.percentage}</span> confident in the transcribed word <span className={styles.OpenSansRegular16ItBold}>&apos;{modelCopyContent.word}&apos;</span>
              </>
            ) : (
              modelCopyContent.text
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .transcript-interface {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 10px;
          gap: 10px;
          position: relative;
          width: 100%;
          max-width: 620px;
          height: auto;
          min-height: 400px;
          // border: 1px solid red;
        }
        
        .transcript-mainframe {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px 0px 16px;
          gap: 16px;
          width: 100%;
          max-width: 600px;
          height: auto;
          background: var(--MainBoxDrawerBg);
          border-radius: 16px;
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
          overflow: visible;
          transition: padding-bottom 0.9s cubic-bezier(0.4, 0, 0.2, 1), gap 0.9s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        
        .transcript-mainframe.collapsed {
          padding-bottom: 0px;
          gap: 0px;
        }
        
        .transcript-box {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4px 0px 20px 0px;
          gap: 16px;
          width: 100%;
          max-width: 600px;
          height: auto;
          min-height: 216px;
          background: var(--MainBoxBg);
          border: 1px solid var(--MainBoxOutline);
          box-shadow: 0px 4px 12px var(--darkGrey06);
          border-radius: 16px;
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
          position: relative;
          z-index: 2;
          overflow: visible;
        }
        
        .transcript-data {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px 28px;
          gap: 10px;
          width: 100%;
          max-width: 600px;
          max-height: 200px;
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
          opacity: 1;
          transition: max-height 0.9s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1), padding 0.9s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 1;
          overflow: hidden;
        }
        
        .transcript-data.hidden {
          max-height: 0;
          opacity: 0;
          padding-top: 0px;
          padding-bottom: 0px;
        }
        
        .mastercon-badge {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: flex-start;
          padding: 0px;
          gap: 6px;
          width: 100%;
          height: auto;
          min-height: 20px;
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .model-copy {
          display: block;
          width: 100%;
          max-width: 546px;
          color: var(--darkGrey40);
          flex: none;
          order: 1;
          flex-grow: 0;
          transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
          transform: translateY(0);
        }
        
        @media (max-width: 640px) {
          .transcript-interface {
            padding: 8px;
          }
          
          .transcript-data {
            padding: 0px 16px;
          }
          
          .transcript-data.hidden {
            padding: 0px 16px;
          }
          
          .model-copy {
            max-width: 100%;
            padding: 0px 4px;
          }
        }
        
        @media (max-width: 480px) {
          .transcript-box {
            padding: 4px 0px 20px 0px;
          }
          
          .model-copy {
            max-width: 100%;
            padding: 0px 2px;
            line-height: 1.5;
          }
        }
      `}</style>
    </div>
  );
};

// Create a named object for default export
const deepCard = {
  DeepCard
};

export default deepCard;