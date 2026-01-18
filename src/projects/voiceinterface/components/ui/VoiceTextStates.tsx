import React from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';
import { VoiceTextAnimation } from './VoiceTextAnimation';

/**
 * Voice Text States Component
 *
 * Displays different text based on the current application state.
 * Phase 1: Added word-by-word text animation for results state.
 */

export type VoiceTextState = 'idle' | 'recording' | 'processing' | 'results' | 'error';

interface VoiceTextStatesProps {
  textState: VoiceTextState;
  transcriptText?: string;
  oldTextLength?: number;  // Split point for old vs new text (for animation)
  placeholderText?: string;
  variation?: 1 | 2 | 3;
}

export const VoiceTextStates: React.FC<VoiceTextStatesProps> = ({
  textState,
  transcriptText = '',
  oldTextLength = 0,
  placeholderText,
  variation = 1
}) => {
  // Default placeholder text based on variation
  const getPlaceholder = () => {
    if (placeholderText) return placeholderText;
    switch (variation) {
      case 1:
      case 2:
        return "Tap to speak";
      case 3:
        return "Ready when you are";
      default:
        return "Tap to speak";
    }
  };

  return (
    <>
      <div className="voice-text-content">
        {/* IDLE STATE */}
        {textState === 'idle' && (
          <div className={`placeholder-text ${styles.OpenRundeMedium16}`}>
            {getPlaceholder()}
          </div>
        )}

        {/* RECORDING STATE - Show existing text at 30% opacity */}
        {textState === 'recording' && (
          <>
            {transcriptText ? (
              <div className={`dimmed-text ${styles.OpenRundeMedium16}`}>
                {transcriptText}
              </div>
            ) : (
              <div className={`placeholder-text ${styles.OpenRundeMedium16}`}>
                {/* Empty - no text during first recording */}
              </div>
            )}
          </>
        )}

        {/* PROCESSING STATE - Show existing text at 30% opacity */}
        {textState === 'processing' && (
          <>
            {transcriptText ? (
              <div className={`dimmed-text ${styles.OpenRundeMedium16}`}>
                {transcriptText}
              </div>
            ) : (
              <div className={`placeholder-text ${styles.OpenRundeMedium16}`}>
                {/* Empty - button shows spinner during processing */}
              </div>
            )}
          </>
        )}

        {/* RESULTS STATE - With word-by-word animation for new text only */}
        {textState === 'results' && transcriptText && (
          <div className={`result-text ${styles.OpenRundeMedium16}`}>
            {oldTextLength > 0 && oldTextLength < transcriptText.length ? (
              <>
                {/* Old text (static, no animation) - includes trailing space */}
                <span className="old-text">
                  {transcriptText.substring(0, oldTextLength)}
                </span>
                {/* Explicit space separator */}
                <span> </span>
                {/* New text (animated) - trim to remove leading space */}
                <VoiceTextAnimation
                  text={transcriptText.substring(oldTextLength).trim()}
                  animationDelay={0.07}      // 70ms between words
                  animationDuration={0.5}    // 500ms per word
                />
              </>
            ) : oldTextLength >= transcriptText.length ? (
              /* Cancelled recording - show all text without animation */
              <span className="static-text">{transcriptText}</span>
            ) : (
              /* First recording - animate all text */
              <VoiceTextAnimation
                text={transcriptText}
                animationDelay={0.07}      // 70ms between words
                animationDuration={0.5}    // 500ms per word
              />
            )}
          </div>
        )}

        {/* ERROR STATE */}
        {textState === 'error' && (
          <div className={`error-text ${styles.OpenRundeMedium16}`}>
            Something went wrong. Please try again.
          </div>
        )}
      </div>

      <style jsx>{`
        .voice-text-content {
          width: 100%;
        }

        .placeholder-text {
          color: var(--VoiceDarkGrey_30);
        }

        .dimmed-text {
          color: var(--VoiceDarkGrey_30);
          word-wrap: break-word;
          line-height: 143.75%;
        }

        .result-text {
          color: var(--VoiceDarkGrey_90);
          word-wrap: break-word;
          line-height: 143.75%;
        }

        .old-text {
          color: var(--VoiceDarkGrey_90);
        }

        .static-text {
          color: var(--VoiceDarkGrey_90);
        }

        .error-text {
          color: var(--VoiceRed);
        }
      `}</style>
    </>
  );
};
