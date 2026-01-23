import React from 'react';
import styles from '@/projects/trace/styles/trace.module.css';
import {
  UploadButton,
  SpeakButton,
  CloseButton,
  SendAudioButton,
  ProcessingAudioButton,
  ProcessingImageButton
} from './tracebuttons';
import type { TRNavbarProps, TRNavbarState } from '@/projects/trace/types/trace.types';

/**
 * TRNavbar - Trace Navigation Bar
 *
 * State-driven navigation bar that displays different button configurations
 * based on the current application state.
 *
 * States:
 * - idle: Shows UploadButton + SpeakButton
 * - recording: Shows CloseButton + SendAudioButton (recording animation active)
 * - processing_audio: Shows ProcessingAudioButton (full width, spinning)
 * - processing_image: Shows ProcessingImageButton (full width, spinning)
 *
 * Dimensions: 301px width, 44px height, 12px gap between buttons
 */
export const TRNavbar: React.FC<TRNavbarProps> = ({
  state,
  onUploadClick,
  onSpeakClick,
  onCloseClick,
  onSendAudioClick,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`trnavbar-container state-${state} ${className} ${styles.container}`}>
      {/* IDLE STATE: Upload + Speak */}
      {state === 'idle' && (
        <>
          <UploadButton onClick={onUploadClick} disabled={disabled} />
          <SpeakButton onClick={onSpeakClick} disabled={disabled} />
        </>
      )}

      {/* RECORDING STATE: Close + SendAudio (with recording animation) */}
      {state === 'recording' && (
        <>
          <CloseButton onClick={onCloseClick} disabled={disabled} />
          <SendAudioButton
            onClick={onSendAudioClick}
            isRecording={true}
            disabled={disabled}
          />
        </>
      )}

      {/* PROCESSING AUDIO STATE: Full-width processing button */}
      {state === 'processing_audio' && (
        <ProcessingAudioButton text="Analysing Audio" />
      )}

      {/* PROCESSING IMAGE STATE: Full-width processing button */}
      {state === 'processing_image' && (
        <ProcessingImageButton text="Processing Image" />
      )}

      <style jsx>{`
        .trnavbar-container {
          /* Layout */
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--trace-button-gap); /* 12px */

          /* Dimensions */
          width: var(--trace-navbar-width); /* 301px */
          height: var(--trace-button-height); /* 44px */

          /* Behavior */
          flex-shrink: 0;
        }

        /* State-specific container styles (if needed for transitions) */
        .state-idle,
        .state-recording {
          /* Multiple buttons - maintain gap */
        }

        .state-processing_audio,
        .state-processing_image {
          /* Single full-width button - no gap needed */
          gap: 0;
        }
      `}</style>
    </div>
  );
};

export default TRNavbar;

// Re-export types for convenience
export type { TRNavbarProps, TRNavbarState };
