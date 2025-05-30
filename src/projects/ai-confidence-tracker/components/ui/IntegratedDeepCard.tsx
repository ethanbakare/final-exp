import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';
import { TranscriptBar } from './transcript-bar';
import { TranscriptBoxNav, NavState } from './transcript-box-nav';
import { TranscriptTextStates, TextState } from './transcript-text-states';
import { LowConfidenceBadge, MediumConfidenceBadge, HighConfidenceBadge } from './deepButtons';
import { useSpeechConfidence } from '../../hooks/SpeechConfidenceHooks';
import { AppState, TranscriptionResult } from '../../types/SpeechConfidenceTypes';

interface IntegratedDeepCardProps {
  className?: string;
}

export const IntegratedDeepCard: React.FC<IntegratedDeepCardProps> = ({
  className = ''
}) => {
  // Get real speech confidence state
  const {
    appState,
    errorState,
    transcriptionResult,
    startRecording,
    stopRecording,
    resetState
  } = useSpeechConfidence();

  // Local UI state management
  const [activeWordId, setActiveWordId] = useState<number | null>(null);
  const [badgeStates, setBadgeStates] = useState<Map<number, boolean>>(new Map());
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Timer refs
  const modelCopyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionWasTouchRef = useRef<boolean>(false);
  const [modelCopyActiveWordId, setModelCopyActiveWordId] = useState<number | null>(null);

  // Convert AppState to UI states
  const getUIStates = (): { navState: NavState; textState: TextState } => {
    switch (appState) {
      case AppState.INITIAL:
        return { navState: 'initial', textState: 'initial' };
      case AppState.RECORDING:
        return { navState: 'recording', textState: 'recording' };
      case AppState.PROCESSING:
        return { navState: 'processing', textState: 'processing' };
      case AppState.RESULTS:
        return { navState: 'results', textState: 'results' };
      case AppState.ERROR:
        return { navState: 'error', textState: 'error' };
      default:
        return { navState: 'initial', textState: 'initial' };
    }
  };

  const { navState, textState } = getUIStates();

  // Convert TranscriptionResult to highlights format
  const convertToHighlights = (result: TranscriptionResult | null) => {
    if (!result || !result.words) return [];
    
    // Filter out high confidence words - we only show low and medium
    return result.words
      .filter(word => word.category !== 'high')
      .map((word) => ({
        wordId: result.words.indexOf(word), // Use original index from full array
        confidenceLevel: word.category as 'low' | 'medium' | 'high',
        percentage: `${Math.round(word.confidence * 100)}%`
      }));
  };

  const highlights = convertToHighlights(transcriptionResult);
  
  // Capitalize first letter of sentences
  const capitalizeSentences = (text: string): string => {
    if (!text) return text;
    
    // Capitalize first letter
    let result = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Capitalize after sentence endings
    result = result.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    
    return result;
  };
  
  const transcriptText = capitalizeSentences(transcriptionResult?.transcript || "");

  // Get error type from error state
  const getErrorType = () => {
    if (!errorState) return undefined;
    
    const message = errorState.message.toLowerCase();
    if (message.includes('no speech detected')) {
      return 'empty_recording';
    }
    if (message.includes('microphone') || message.includes('permission')) {
      return 'microphone_permission';
    }
    if (message.includes('network') || message.includes('timeout')) {
      return 'network_error';
    }
    if (message.includes('empty')) {
      return 'empty_recording';
    }
    if (message.includes('large') || message.includes('size')) {
      return 'file_too_large';
    }
    if (message.includes('browser') || message.includes('support')) {
      return 'browser_compatibility';
    }
    return 'recording_hardware_failure';
  };

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Auto-manage dropdown state
  useEffect(() => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
      dropdownTimerRef.current = null;
    }

    if (navState === 'results') {
      dropdownTimerRef.current = setTimeout(() => {
        setIsCollapsed(false);
        dropdownTimerRef.current = null;
      }, 300);
    } else {
      setIsCollapsed(true);
    }

    return () => {
      if (dropdownTimerRef.current) {
        clearTimeout(dropdownTimerRef.current);
        dropdownTimerRef.current = null;
      }
    };
  }, [navState]);

  // Clear all interactions
  const clearInteraction = useCallback(() => {
    setActiveWordId(null);
    setBadgeStates(new Map());
  }, []);

  // Navigation event handlers
  const handleRecordClick = () => {
    startRecording();
    clearInteraction();
  };

  const handleRecordingClick = () => {
    stopRecording();
    clearInteraction();
  };

  const handleCancelClick = () => {
    resetState();
    clearInteraction();
  };

  const handleClearClick = () => {
    resetState();
    clearInteraction();
  };

  const handleRetryClick = useCallback(() => {
    resetState();
    clearInteraction();
  }, [resetState, clearInteraction]);

  const handleDropdownClick = () => {
    if (navState === 'results') {
      setIsCollapsed(!isCollapsed);
      if (!isCollapsed) {
        clearInteraction();
      }
    }
  };

  // Unified hover/tap handler for text
  const handleTextInteraction = useCallback((wordId: number | null) => {
    if (activeWordId === wordId) {
      clearInteraction();
    } else {
      setActiveWordId(wordId);
      
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
      clearInteraction();
    } else {
      setActiveWordId(wordId);
      
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
      
      if (!(target instanceof Element)) return;
      
      const isTextTouch = target.closest('.highlight-hover-area');
      const isBadgeTouch = target.closest('.confidence-badge-wrapper') || target.closest('.confidence-badge');
      
      if (!isTextTouch && !isBadgeTouch) {
        lastInteractionWasTouchRef.current = true;
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
    if (modelCopyResetTimerRef.current) {
      clearTimeout(modelCopyResetTimerRef.current);
      modelCopyResetTimerRef.current = null;
    }

    if (activeWordId !== null) {
      setModelCopyActiveWordId(activeWordId);
    } else {
      if (lastInteractionWasTouchRef.current) {
        setModelCopyActiveWordId(null);
        lastInteractionWasTouchRef.current = false;
      } else {
        modelCopyResetTimerRef.current = setTimeout(() => {
          setModelCopyActiveWordId(null);
        }, 1000);
      }
    }

    return () => {
      if (modelCopyResetTimerRef.current) {
        clearTimeout(modelCopyResetTimerRef.current);
        modelCopyResetTimerRef.current = null;
      }
    };
  }, [activeWordId]);

  // Function to get badges in the order they appear in the text
  const getOrderedBadges = () => {
    const words = transcriptText.split(/\s+/);
    const orderedBadges: Array<{wordId: number, confidenceLevel: 'low' | 'medium' | 'high', originalText: string}> = [];
    
    highlights.forEach(highlight => {
      // Only process low and medium confidence words
      if (highlight.confidenceLevel !== 'high') {
        const word = words[highlight.wordId];
        if (word) {
          orderedBadges.push({
            wordId: highlight.wordId,
            confidenceLevel: highlight.confidenceLevel,
            originalText: word.replace(/[.,!?;:]/g, '')
          });
        }
      }
    });
    
    orderedBadges.sort((a, b) => a.wordId - b.wordId);
    return orderedBadges;
  };

  const orderedBadges = getOrderedBadges();
  const isHighConfidenceState = highlights.length === 0 && transcriptText.length > 0;

  // Helper functions
  const getWordFromId = (wordId: number): string => {
    const words = transcriptText.split(/\s+/);
    return words[wordId]?.replace(/[.,!?;:]/g, '') || '';
  };

  const getPercentageFromId = (wordId: number): string => {
    const highlight = highlights.find(h => h.wordId === wordId);
    return highlight?.percentage || '';
  };

  // Dynamic ModelCopy content
  const getModelCopyContent = () => {
    if (isHighConfidenceState) {
      return {
        text: "Press the clear button to start new transcription",
        hasHighlight: false
      };
    } else if (modelCopyActiveWordId === null || modelCopyActiveWordId === undefined) {
      return {
        text: isMobile ? "Tap a badge to view confidence score" : "Hover over a badge to view confidence score",
        hasHighlight: false
      };
    } else {
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
    <div className={`transcript-interface ${styles.container} ${className}`}>
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
            errorType={getErrorType()}
            errorMessage={errorState?.message}
          />
          <TranscriptBoxNav 
            navState={navState}
            onDropdownClick={handleDropdownClick}
            onClearClick={handleClearClick}
            onRecordClick={handleRecordClick}
            onRecordingClick={handleRecordingClick}
            onCancelClick={handleCancelClick}
            onRetryClick={handleRetryClick}
            errorType={getErrorType()}
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
                    e.preventDefault();
                    lastInteractionWasTouchRef.current = true;
                    handleBadgeInteraction(badge.wordId);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
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

export default IntegratedDeepCard; 