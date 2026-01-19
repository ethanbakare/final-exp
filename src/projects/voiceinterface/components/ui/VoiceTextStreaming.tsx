import React from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Voice Text Streaming Component
 *
 * Handles streaming transcription display for Variant 3.
 * States: idle → recording → complete
 * 
 * Key Behaviors (DIFFERENT from batch):
 * - Idle: Shows placeholder
 * - Recording: Text appears LIVE at 90% opacity (no animation)
 *   - When appending: old text at 30%, new text at 90%
 * - Complete: Text stays at 90% opacity (NO animation, text already visible)
 * 
 * Fundamental Difference from Batch:
 * - Batch: Text arrives AFTER recording (needs animation)
 * - Streaming: Text arrives DURING recording (already visible, no animation)
 */

export type VoiceTextStreamingState = 'idle' | 'recording' | 'complete' | 'error';

interface VoiceTextStreamingProps {
  textState: VoiceTextStreamingState;
  transcriptText?: string;
  oldTextLength?: number;  // Split point for old vs new text (opacity change)
  placeholderText?: string;
  showCursor?: boolean;  // Show blinking cursor (during recording)
}

export const VoiceTextStreaming: React.FC<VoiceTextStreamingProps> = ({
  textState,
  transcriptText = '',
  oldTextLength = 0,
  placeholderText = "Ready when you are",
  showCursor = false
}) => {
  return (
    <>
      <div className="voice-text-content">
        {/* IDLE STATE */}
        {textState === 'idle' && (
          <div className={`placeholder-text ${styles.OpenRundeMedium16}`}>
            {placeholderText}
          </div>
        )}

        {/* RECORDING STATE - Text appears live during recording */}
        {textState === 'recording' && (
          <>
            {transcriptText ? (
              <div className={`streaming-text ${showCursor ? 'with-cursor' : ''} ${styles.OpenRundeMedium16}`}>
                {oldTextLength > 0 && oldTextLength < transcriptText.length ? (
                  <>
                    {/* Old text (dimmed to 30% during new recording) */}
                    <span className="old-text-dimmed">
                      {transcriptText.substring(0, oldTextLength)}
                    </span>
                    {/* Space separator */}
                    <span> </span>
                    {/* New streaming text (90% opacity, no animation) */}
                    <span className="new-text-streaming">
                      {transcriptText.substring(oldTextLength).trim()}
                    </span>
                  </>
                ) : (
                  /* First recording - all text at 90% */
                  <span className="new-text-streaming">{transcriptText}</span>
                )}
              </div>
            ) : (
              <div className={`placeholder-text ${showCursor ? 'with-cursor' : ''} ${styles.OpenRundeMedium16}`}>
                {/* Empty - waiting for first transcription */}
              </div>
            )}
          </>
        )}

        {/* COMPLETE STATE - Text stays at 90% (no animation, already visible) */}
        {textState === 'complete' && transcriptText && (
          <div className={`complete-text ${styles.OpenRundeMedium16}`}>
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

        .streaming-text {
          word-wrap: break-word;
          line-height: 143.75%;
        }
        
        /* Blinking cursor - inline with text (terminal/IDE style) */
        .streaming-text.with-cursor::after,
        .placeholder-text.with-cursor::after {
          content: '|';
          color: var(--VoiceDarkGrey_30);  /* 30% opacity for subtle cursor */
          margin-left: 2px;
          animation: blink 1s step-end infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }    /* Visible for 500ms */
          51%, 100% { opacity: 0; }  /* Hidden for 500ms */
        }

        /* Old text during new recording - dimmed to 30% */
        .old-text-dimmed {
          color: var(--VoiceDarkGrey_30);
        }

        /* New streaming text - 90% opacity, appears live */
        .new-text-streaming {
          color: var(--VoiceDarkGrey_90);
        }

        /* Complete state - all text at 90% */
        .complete-text {
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
