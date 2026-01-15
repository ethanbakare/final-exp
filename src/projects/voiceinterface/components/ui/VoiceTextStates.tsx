import React from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Voice Text States Component
 *
 * Displays different text based on the current application state.
 * No animations in Phase 0 - just plain text display.
 */

export type VoiceTextState = 'idle' | 'recording' | 'processing' | 'results' | 'error';

interface VoiceTextStatesProps {
  textState: VoiceTextState;
  transcriptText?: string;
  placeholderText?: string;
  variation?: 1 | 2 | 3;
}

export const VoiceTextStates: React.FC<VoiceTextStatesProps> = ({
  textState,
  transcriptText = '',
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

        {/* RECORDING STATE - Show nothing (button morph indicates recording) */}
        {textState === 'recording' && (
          <div className={`placeholder-text ${styles.OpenRundeMedium16}`}>
            {/* Empty - no text during recording */}
          </div>
        )}

        {/* PROCESSING STATE */}
        {textState === 'processing' && (
          <div className={`placeholder-text ${styles.OpenRundeMedium16}`}>
            Processing...
          </div>
        )}

        {/* RESULTS STATE */}
        {textState === 'results' && transcriptText && (
          <div className={`result-text ${styles.OpenRundeMedium16}`}>
            {transcriptText}
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
