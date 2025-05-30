import React, { useEffect, useState } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';
import { HighlightedText } from './deepUIcomponents';

export type TextState = 'initial' | 'recording' | 'processing' | 'results' | 'error';

interface TranscriptTextStatesProps {
  textState: TextState;
  transcriptText?: string;
  highlights?: Array<{wordId: number, confidenceLevel: 'low' | 'medium' | 'high', percentage?: string}>;
  activeWordId?: number | null;
  onWordInteraction?: (wordId: number | null) => void;
  errorType?: 'microphone_permission' | 'network_error' | 'file_too_large' | 'empty_recording' | 'browser_compatibility' | 'recording_hardware_failure';
  errorMessage?: string;
}

export const TranscriptTextStates: React.FC<TranscriptTextStatesProps> = ({
  textState,
  transcriptText = "",
  highlights = [],
  activeWordId,
  onWordInteraction,
  errorType,
  errorMessage
}) => {
  // State for animated dots
  const [dotCount, setDotCount] = useState(1);
  
  // Track if we're on mobile for responsive text
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // State for fade animation
  const [fadeOut, setFadeOut] = useState(false);
  const [currentTextState, setCurrentTextState] = useState(textState);

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

  // Animate dots for recording and processing states
  useEffect(() => {
    if (textState === 'recording' || textState === 'processing') {
      const interval = setInterval(() => {
        setDotCount(prev => prev >= 3 ? 1 : prev + 1);
      }, 500); // Change dots every 500ms

      return () => clearInterval(interval);
    }
  }, [textState]);

  // Handle text state transitions with fade animation
  useEffect(() => {
    if (textState !== currentTextState) {
      // Start fade out if transitioning from results to initial
      if (currentTextState === 'results' && textState === 'initial') {
        setFadeOut(true);
        setTimeout(() => {
          setCurrentTextState(textState);
          setFadeOut(false);
        }, 300); // 300ms fade duration
      } else {
        // Immediate transition for other state changes
        setCurrentTextState(textState);
      }
    }
  }, [textState, currentTextState]);

  // Generate animated dots
  const renderDots = () => {
    return '.'.repeat(dotCount);
  };

  // Generate error message based on error type
  const getErrorMessage = () => {
    if (errorMessage) return errorMessage;
    
    switch (errorType) {
      case 'microphone_permission':
        return 'Microphone access denied. Please allow microphone access and try again.';
      case 'network_error':
        return 'Network error. Please try again.';
      case 'file_too_large':
        return 'File too large. Please record shorter audio.';
      case 'empty_recording':
        return 'No audio was recorded. Check your microphone and try again.';
      case 'browser_compatibility':
        return 'Your browser doesn\'t support audio recording. Please use a modern browser.';
      case 'recording_hardware_failure':
        return 'Recording failed. Check your microphone and try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  return (
    <>
      <div className="transcript-container">
        <div className={`transcript-text-wrapper ${styles.container}`}>
          <div className={`transcript-text-container ${fadeOut ? 'fade-out' : ''}`}>
            {/* DIRECT JSX - not in function to ensure styled-jsx scoping works */}
            {currentTextState === 'initial' && (
              <div 
                className={`initial-text ${styles.OpenRundeMedium20}`}
                style={{ 
                  color: 'var(--darkGrey40)',
                }}
              >
                {isMobile ? "Tap record, see your words transcribed with confidence highlights" : "Click record, see your words transcribed with confidence highlights"}
              </div>
            )}
            
            {currentTextState === 'recording' && (
              <div 
                className={`status-text ${styles.OpenRundeMedium20}`}
                style={{ 
                  color: 'var(--darkGrey40)',
                }}
              >
                Recording in progress{renderDots()}
              </div>
            )}
            
            {currentTextState === 'processing' && (
              <div 
                className={`status-text ${styles.OpenRundeMedium20}`}
                style={{ 
                  color: 'var(--darkGrey40)',
                }}
              >
                Transcribing audio{renderDots()}
              </div>
            )}
            
            {currentTextState === 'error' && (
              <div 
                className={`error-text ${styles.OpenRundeMedium20}`}
                style={{ 
                  color: 'var(--darkGrey40)',
                }}
              >
                {getErrorMessage()}
              </div>
            )}
            
            {currentTextState === 'results' && (
              <HighlightedText 
                text={transcriptText}
                highlights={highlights}
                activeWordId={activeWordId}
                onWordInteraction={onWordInteraction}
              />
            )}
          </div>
        </div>
        
        {/* Fade overlay div - positioned absolutely relative to container, outside scrollable area */}
        <div className="fade-overlay"></div>
      </div>
      
      <style jsx>{`
        .transcript-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          max-width: 600px;
          height: auto;
          min-height: 132px;
          max-height: 168px;
          position: relative;
          // border: 1px solid blue;
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
        }
        
        .transcript-text-wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 28px 27px 12px 27px;
          gap: 10px;
          width: 100%;
          height: 100%;
          min-height: 132px;
          // border: 1px solid red;
          border-radius: 6px;
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .transcript-text-container {
          width: 100%;
          /* Custom scrollbar styling - using solid colors */
          scrollbar-width: thin;
          scrollbar-color: rgba(94, 94, 94, 0.6);
          transition: opacity 0.3s ease-in-out;
        }
        
        .transcript-text-container.fade-out {
          opacity: 0;
        }
        
        /* Webkit scrollbar styling - using solid colors */
        .transcript-text-wrapper::-webkit-scrollbar {
          width: 8px;
        }
        
        .transcript-text-wrapper::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
        
        .transcript-text-wrapper::-webkit-scrollbar-thumb {
          background: rgba(94, 94, 94, 0.7);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .transcript-text-wrapper::-webkit-scrollbar-thumb:hover {
          background: rgba(94, 94, 94, 0.9);
        }
        
        /* Fade overlay div - positioned absolutely relative to container, outside scrollable area */
        .fade-overlay {
          position: absolute;
          bottom: 0px; /* Position at bottom of wrapper content area */
          left: 8px;   /* Account for wrapper padding + border */
          right: 8px;  /* Account for wrapper padding + border */
          height: 24px;
          background: linear-gradient(to bottom, 
            rgba(250, 250, 250, 0) 0%, 
            rgba(250, 250, 250, 0.4) 25%,
            rgba(250, 250, 250, 0.8) 60%,
            rgba(250, 250, 250, 1) 100%
          );
          pointer-events: none;
          border-radius: 0 0 0px 0px;
          z-index: 10;
        }
        
        .initial-text {
          width: 100%;
          height: auto;
          min-height: 29px;
          position: relative;
          z-index: 1;
        }
        
        .status-text {
          width: 100%;
          height: auto;
          min-height: 29px;
          position: relative;
          z-index: 1;
        }
        
        .error-text {
          width: 100%;
          height: auto;
          min-height: 29px;
          position: relative;
          z-index: 1;
        }
        
        @media (max-width: 768px) {
          .transcript-text-wrapper {
            padding: 28px 23px 12px 23px;
          }
        }
      `}</style>
    </>
  );
};

export default TranscriptTextStates; 