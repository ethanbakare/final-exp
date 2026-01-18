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
  previousText?: string;  // Previous transcription shown at idle opacity
  placeholderText?: string;
  variation?: 1 | 2 | 3;
}

export const VoiceTextStates: React.FC<VoiceTextStatesProps> = ({
  textState,
  transcriptText = '',
  previousText = '',
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

        {/* RECORDING STATE - Show previous text at idle opacity (for appending) */}
        {textState === 'recording' && (
          <>
            {previousText ? (
              <div className={`previous-text ${styles.OpenRundeMedium16}`}>
                {previousText}
              </div>
            ) : (
              <div className={`placeholder-text ${styles.OpenRundeMedium16}`}>
                {/* Empty - no text during first recording */}
              </div>
            )}
          </>
        )}

        {/* PROCESSING STATE - Show previous text at idle opacity (for appending) */}
        {textState === 'processing' && (
          <>
            {previousText ? (
              <div className={`previous-text ${styles.OpenRundeMedium16}`}>
                {previousText}
              </div>
            ) : (
              <div className={`placeholder-text ${styles.OpenRundeMedium16}`}>
                {/* Empty - button shows spinner during processing */}
              </div>
            )}
          </>
        )}

        {/* RESULTS STATE - With word-by-word animation */}
        {textState === 'results' && transcriptText && (
          <>
            {/* Show previous text at idle opacity (appended mode) */}
            {previousText && (
              <div className={`previous-text ${styles.OpenRundeMedium16}`}>
                {previousText}
              </div>
            )}
            {/* Show current transcription at result opacity with animation */}
            <div className="result-text">
              <VoiceTextAnimation
                text={transcriptText}
                animationDelay={0.07}      // 70ms between words
                animationDuration={0.5}    // 500ms per word
              />
            </div>
          </>
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

        .previous-text {
          color: var(--VoiceDarkGrey_30);
          word-wrap: break-word;
          line-height: 143.75%;
          margin-bottom: 8px;  /* Space before new text */
        }

        .result-text {
          color: var(--VoiceDarkGrey_90);
          word-wrap: break-word;
          line-height: 143.75%;
        }

        .error-text {
          color: var(--VoiceRed);
        }
      `}</style>
    </>
  );
};
