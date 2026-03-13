import React from 'react';
import styles from '@/projects/trace/styles/trace.module.css';
import { TraceLiveWaveform } from './TraceLiveWaveform';
import { TraceColors } from '../../constants/designTokens';
import {
  ProcessingAudioButton,
  ProcessingImageButton
} from './tracebuttons';
import type { TRNavbarProps, TRNavbarState } from '@/projects/trace/types/trace.types';

/**
 * TRNavbar - Trace Navigation Bar with Morphing Animations & Crossfades
 *
 * State-driven navigation bar with smooth transitions:
 * - idle → recording: Upload (117px) morphs to Close (56px), Speak (118px) morphs to SendAudio (150px)
 * - Icons crossfade during morph
 * - idle → processing_image: Upload button expands to full width (247px), Speak button shrinks to 0 and fades out
 * - Content inside Upload crossfades from Upload icon to Processing Image (spinner + text)
 * - recording → processing_audio: SendAudio button expands to full width (247px), Close button shrinks to 0 and fades out
 * - Content inside SendAudio crossfades from waveform to Analysing Audio (spinner + text)
 *
 * Dimensions: 247px width, 44px height, 12px gap between morphing buttons (removed in processing states)
 *
 * Based on voicemorphingbuttons.tsx pattern - dual independent button morphs + hybrid morph/crossfade states
 */
export const TRNavbar: React.FC<TRNavbarProps> = ({
  state,
  onUploadClick,
  onSpeakClick,
  onCloseClick,
  onSendAudioClick,
  disabled = false,
  fullWidth = false,
  className = '',
}) => {
  return (
    <div className={`trnavbar-container state-${state} ${fullWidth ? 'full-width' : ''} ${className} ${styles.container}`}>
      {/* MORPHING BUTTONS GROUP: Visible in idle/recording, fades out in processing */}
      <div className="morphing-group">
        {/* LEFT BUTTON TRACKER: Upload → Close */}
        <div className="left-button-tracker">
          <button
            className={`left-morph-button state-${state}`}
            onClick={() => {
              if (state === 'idle' && !disabled) onUploadClick?.();
              else if (state === 'recording' && !disabled) onCloseClick?.();
              // Do nothing in processing_image state
            }}
            disabled={disabled}
            type="button"
            aria-label={state === 'idle' ? 'Upload' : state === 'recording' ? 'Close' : 'Processing'}
          >
            {/* Content container for crossfade */}
            <div className="left-content">
              {/* Upload Icon + Text - visible in idle */}
              <div className="upload-content">
                <div className="icon-container">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.9414 8.94891L15.9405 6.51244C15.9403 5.97042 15.7201 5.45169 15.3304 5.07502L13.226 3.04135C12.8531 2.68095 12.3548 2.4795 11.8362 2.4795L6.27519 2.4795C5.17042 2.4795 4.27491 3.37523 4.27519 4.48L4.27629 8.94891" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M4.27344 15.3234L4.27359 15.5221C4.27447 16.6261 5.16964 17.5206 6.27359 17.5206L13.9385 17.5206C15.0437 17.5206 15.9394 16.6242 15.9385 15.519L15.9384 15.3234" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M2.35156 11.8452L17.6453 11.8452" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="button-text">Upload</span>
              </div>

              {/* Close Icon - visible in recording */}
              <div className="close-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17.99997 17.99997L6 6M18.00003 6L5.99997 18.00003"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Processing Image Spinner + Text - visible in processing_image */}
              <div className="processing-image-content">
                <div className="spinner-container">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M400 800c-54.66666 0-106.33334-10.5-155-31.5-48.66667-21-91.16667-49.66669-127.5-86-36.33333-36.33331-65-78.83331-86-127.5-21-48.66666-31.5-100.33334-31.5-155 0-55.33334 10.5-107.16666 31.5-155.5 21-48.33333 49.66667-90.66667 86-127 36.33333-36.33333 78.83333-65 127.5-86 48.66666-21 100.33334-31.5 155-31.5 11.33334 0 20.83334 3.83333 28.5 11.5 7.66666 7.66667 11.5 17.16667 11.5 28.5 0 11.33333-3.83334 20.83333-11.5 28.5-7.66666 7.66666-17.16666 11.5-28.5 11.5-88.66666 0-164.16667 31.16667-226.5 93.5-62.33333 62.33333-93.5 137.83334-93.5 226.5 0 88.66666 31.16667 164.16669 93.5 226.5 62.33333 62.33331 137.83334 93.5 226.5 93.5 88.66666 0 164.16669-31.16669 226.5-93.5 62.33331-62.33331 93.5-137.83334 93.5-226.5 0-11.33334 3.83331-20.83334 11.5-28.5 7.66669-7.66666 17.16669-11.5 28.5-11.5 11.33331 0 20.83331 3.83334 28.5 11.5 7.66669 7.66666 11.5 17.16666 11.5 28.5 0 54.66666-10.5 106.33334-31.5 155-21 48.66669-49.66669 91.16669-86 127.5-36.33331 36.33331-78.66669 65-127 86-48.33334 21-100.16666 31.5-155.5 31.5z"
                      transform="translate(2, 2) scale(0.025)"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <span className="button-text">Processing Image</span>
              </div>
            </div>
          </button>
        </div>

        {/* RIGHT BUTTON TRACKER: Speak → SendAudio */}
        <div className="right-button-tracker">
          <button
            className={`right-morph-button state-${state}`}
            onClick={() => {
              if (state === 'idle' && !disabled) onSpeakClick?.();
              else if (state === 'recording' && !disabled) onSendAudioClick?.();
              // Do nothing in processing_audio state
            }}
            disabled={disabled}
            type="button"
            aria-label={state === 'idle' ? 'Speak' : state === 'recording' ? 'Send Audio' : 'Processing'}
          >
            {/* Content container for crossfade */}
            <div className="right-content">
              {/* Speak Icon + Text - visible in idle */}
              <div className="speak-content">
                <div className="icon-container">
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9.40583 6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452Z"
                      fill="currentColor"
                    />
                    <path
                      d="M19.9282 13.3002C19.3867 16.6398 16.4897 19.1896 12.9971 19.1896C9.50541 19.1896 6.60896 16.6411 6.06641 13.3027M12.9965 22.75V19.3733M15.0926 22.75H10.9399M13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="button-text">Speak</span>
              </div>

              {/* SendAudio Waveform + Text - visible in recording */}
              <div className="sendaudio-content">
                <TraceLiveWaveform
                  active={state === 'recording'}
                  barWidth={2.8}
                  barGap={4}
                  barRadius={2}
                  barColor={TraceColors.textPrimary}
                  barHeight={5}
                  mode="static"
                  ambientWave={state === 'recording'}
                  waveSpeed={6}
                  waveAmplitude={0.55}
                  waveHeight={1.4}
                  height={24}
                  style={{ width: '24px' }}
                />
                <span className="button-text">Send Audio</span>
              </div>

              {/* AnalysingAudio Spinner + Text - visible in processing_audio */}
              <div className="analysing-audio-content">
                <div className="spinner-container">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M400 800c-54.66666 0-106.33334-10.5-155-31.5-48.66667-21-91.16667-49.66669-127.5-86-36.33333-36.33331-65-78.83331-86-127.5-21-48.66666-31.5-100.33334-31.5-155 0-55.33334 10.5-107.16666 31.5-155.5 21-48.33333 49.66667-90.66667 86-127 36.33333-36.33333 78.83333-65 127.5-86 48.66666-21 100.33334-31.5 155-31.5 11.33334 0 20.83334 3.83333 28.5 11.5 7.66666 7.66667 11.5 17.16667 11.5 28.5 0 11.33333-3.83334 20.83333-11.5 28.5-7.66666 7.66666-17.16666 11.5-28.5 11.5-88.66666 0-164.16667 31.16667-226.5 93.5-62.33333 62.33333-93.5 137.83334-93.5 226.5 0 88.66666 31.16667 164.16669 93.5 226.5 62.33333 62.33331 137.83334 93.5 226.5 93.5 88.66666 0 164.16669-31.16669 226.5-93.5 62.33331-62.33331 93.5-137.83334 93.5-226.5 0-11.33334 3.83331-20.83334 11.5-28.5 7.66669-7.66666 17.16669-11.5 28.5-11.5 11.33331 0 20.83331 3.83334 28.5 11.5 7.66669 7.66666 11.5 17.16666 11.5 28.5 0 54.66666-10.5 106.33334-31.5 155-21 48.66669-49.66669 91.16669-86 127.5-36.33331 36.33331-78.66669 65-127 86-48.33334 21-100.16666 31.5-155.5 31.5z"
                      transform="translate(2, 2) scale(0.025)"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <span className="button-text">Analysing Audio</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* PROCESSING BUTTONS GROUP: Fades in during processing states */}
      <div className="processing-group">
        {/* Processing Audio Button */}
        <div className="processing-audio-wrapper">
          <ProcessingAudioButton text="Analysing Audio" />
        </div>

        {/* Processing Image Button */}
        <div className="processing-image-wrapper">
          <ProcessingImageButton text="Processing Image" />
        </div>
      </div>

      <style jsx>{`
        /* ========================================
           ACCESSIBILITY
           ======================================== */
        @media (prefers-reduced-motion: reduce) {
          .trnavbar-container,
          .trnavbar-container * {
            transition: none !important;
          }
        }

        /* ========================================
           CONTAINER
           ======================================== */
        .trnavbar-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: var(--trace-navbar-width); /* 247px */
          height: var(--trace-button-height); /* 44px */
          flex-shrink: 0;
        }

        /* ========================================
           MORPHING BUTTONS GROUP
           ======================================== */
        .morphing-group {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--trace-button-gap); /* 12px */
          width: 100%;
          height: 100%;
          opacity: 1;
          pointer-events: auto;
          transition: opacity 0.2s ease, gap 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Remove gap in processing states (one button expands to full width) */
        .state-processing_image .morphing-group,
        .state-processing_audio .morphing-group {
          gap: 0;
        }

        /* ========================================
           PROCESSING BUTTONS GROUP
           ======================================== */
        .processing-group {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          pointer-events: none; /* Critical: don't block morphing buttons when processing is hidden */
        }

        .processing-audio-wrapper,
        .processing-image-wrapper {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }

        /* Processing buttons now handled by morphing buttons - keep these hidden */
        .state-processing_audio .processing-audio-wrapper,
        .state-processing_image .processing-image-wrapper {
          opacity: 0;
          pointer-events: none;
        }

        /* ========================================
           LEFT BUTTON TRACKER: Upload → Close → ProcessingImage
           ======================================== */
        .left-button-tracker {
          /* IDLE: Upload width */
          width: var(--trace-btn-upload-width);
          height: var(--trace-button-height);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden; /* Clips content during morph */
          opacity: 1;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.21s ease; /* Fade out by 70% of animation time */
        }

        /* RECORDING: Close width */
        .state-recording .left-button-tracker {
          width: var(--trace-btn-close-width);
        }

        /* PROCESSING_IMAGE: Expand to full navbar width */
        .state-processing_image .left-button-tracker {
          width: var(--trace-navbar-width); /* 247px - full width */
        }

        /* PROCESSING_AUDIO: Shrink to 0 and fade out faster */
        .state-processing_audio .left-button-tracker {
          width: 0;
          opacity: 0;
          pointer-events: none;
        }

        /* ========================================
           LEFT MORPHING BUTTON
           ======================================== */
        .left-morph-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: var(--trace-button-height);
          padding: 0 var(--trace-spacing-xl);
          background: var(--trace-btn-light);
          border: var(--trace-button-stroke) solid transparent;
          border-radius: var(--trace-button-radius);
          color: var(--trace-border-primary);
          cursor: pointer;
          user-select: none;

          /* Morph dimensions */
          width: var(--trace-btn-upload-width); /* Upload size */
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      background 0.3s ease,
                      color 0.3s ease;
        }

        .left-morph-button.state-recording {
          width: var(--trace-btn-close-width); /* Close size */
        }

        .left-morph-button.state-processing_image {
          width: var(--trace-navbar-width); /* Full width for processing */
          background: var(--trace-btn-processing); /* Gray background */
          color: var(--trace-text-primary); /* Dark text */
          pointer-events: none; /* Non-interactive during processing */
          cursor: default; /* Show default cursor, not pointer */
        }

        .left-morph-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ========================================
           LEFT CONTENT CROSSFADE
           ======================================== */
        .left-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .upload-content,
        .close-content,
        .processing-image-content {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--trace-spacing-sm);
          transition: opacity 0.3s ease;
        }

        /* Upload visible in idle - FIXED DARK COLOR */
        .upload-content {
          opacity: 1;
          color: var(--trace-border-primary); /* Fixed dark - no transition */
        }
        .left-morph-button.state-recording .upload-content,
        .left-morph-button.state-processing_image .upload-content {
          opacity: 0;
          pointer-events: none;
        }

        /* Close visible in recording */
        .close-content {
          opacity: 0;
          pointer-events: none;
        }
        .left-morph-button.state-recording .close-content {
          opacity: 1;
          pointer-events: auto;
        }

        /* Processing Image visible in processing_image - FIXED WHITE COLOR */
        .processing-image-content {
          opacity: 0;
          pointer-events: none;
          gap: var(--trace-spacing-lg); /* Larger gap for processing state */
          color: var(--trace-text-primary); /* Fixed white - no transition */
        }
        .left-morph-button.state-processing_image .processing-image-content {
          opacity: 1;
          pointer-events: auto;
        }

        /* ========================================
           RIGHT BUTTON TRACKER: Speak → SendAudio → AnalysingAudio
           ======================================== */
        .right-button-tracker {
          /* IDLE: Speak width */
          width: var(--trace-btn-speak-width);
          height: var(--trace-button-height);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden; /* Clips content during morph */
          opacity: 1;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.21s ease; /* Fade out by 70% of animation time */
        }

        /* RECORDING: SendAudio width */
        .state-recording .right-button-tracker {
          width: var(--trace-btn-sendaudio-width);
        }

        /* PROCESSING_IMAGE: Shrink to 0 and fade out faster */
        .state-processing_image .right-button-tracker {
          width: 0;
          opacity: 0;
          pointer-events: none;
        }

        /* PROCESSING_AUDIO: Expand to full navbar width */
        .state-processing_audio .right-button-tracker {
          width: var(--trace-navbar-width); /* 247px - full width */
          opacity: 1;
        }

        /* ========================================
           RIGHT MORPHING BUTTON
           ======================================== */
        .right-morph-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: var(--trace-button-height);
          padding: 0 var(--trace-spacing-xl);
          border: var(--trace-button-stroke) solid transparent;
          border-radius: var(--trace-button-radius);
          cursor: pointer;
          user-select: none;

          /* IDLE: Speak button (light background) */
          width: var(--trace-btn-speak-width);
          background: var(--trace-btn-light);
          color: var(--trace-border-primary);

          /* Morph transitions */
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      background 0.3s ease,
                      color 0.3s ease;
        }

        /* RECORDING: SendAudio button (orange background) */
        .right-morph-button.state-recording {
          width: var(--trace-btn-sendaudio-width);
          background: var(--trace-btn-orange);
          color: var(--trace-text-primary);
        }

        /* PROCESSING_AUDIO: Full width processing state */
        .right-morph-button.state-processing_audio {
          width: var(--trace-navbar-width); /* Full width for processing */
          background: var(--trace-btn-processing); /* Gray background */
          color: var(--trace-text-primary); /* White text */
          pointer-events: none; /* Non-interactive during processing */
          cursor: default; /* Show default cursor, not pointer */
        }

        .right-morph-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ========================================
           RIGHT CONTENT CROSSFADE
           ======================================== */
        .right-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .speak-content,
        .sendaudio-content,
        .analysing-audio-content {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--trace-spacing-sm);
          transition: opacity 0.3s ease;
        }

        /* Speak visible in idle */
        .speak-content {
          opacity: 1;
        }
        .right-morph-button.state-recording .speak-content,
        .right-morph-button.state-processing_audio .speak-content {
          opacity: 0;
          pointer-events: none;
        }

        /* SendAudio visible in recording - FIXED WHITE COLOR */
        .sendaudio-content {
          opacity: 0;
          pointer-events: none;
          color: var(--trace-text-primary); /* Fixed white - no transition */
        }
        .right-morph-button.state-recording .sendaudio-content {
          opacity: 1;
          pointer-events: auto;
        }
        .right-morph-button.state-processing_audio .sendaudio-content {
          opacity: 0;
          pointer-events: none;
        }

        /* AnalysingAudio visible in processing_audio - FIXED WHITE COLOR */
        .analysing-audio-content {
          opacity: 0;
          pointer-events: none;
          gap: var(--trace-spacing-lg); /* Larger gap for processing state */
          color: var(--trace-text-primary); /* Fixed white - no transition */
        }
        .right-morph-button.state-processing_audio .analysing-audio-content {
          opacity: 1;
          pointer-events: auto;
        }

        /* ========================================
           BUTTON TEXT
           ======================================== */
        .button-text {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-button);
          font-weight: var(--trace-fw-medium);
          line-height: var(--trace-lh-button);
          white-space: nowrap;
        }

        /* ========================================
           ICON CONTAINER
           ======================================== */
        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }

        /* ========================================
           SPINNER (Processing Image)
           ======================================== */
        .spinner-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* ========================================
           FULL WIDTH MODE (for use inside TextBox)
           ======================================== */
        .full-width {
          width: 100%;
        }

        /* Idle: both buttons share available space equally */
        .full-width .left-button-tracker {
          flex: 1;
          width: auto;
        }

        .full-width .left-morph-button {
          width: 100%;
        }

        .full-width .right-button-tracker {
          flex: 1;
          width: auto;
        }

        .full-width .right-morph-button {
          width: 100%;
        }

        /* Processing states expand to full container width */
        .full-width.state-processing_image .left-button-tracker {
          flex: none;
          width: 100%;
        }

        .full-width.state-processing_audio .left-button-tracker {
          flex: none;
          width: 0;
        }

        .full-width.state-processing_audio .right-button-tracker {
          flex: none;
          width: 100%;
        }

        .full-width.state-processing_image .right-button-tracker {
          flex: none;
          width: 0;
        }
      `}</style>
    </div>
  );
};

export default TRNavbar;

// Re-export types for convenience
export type { TRNavbarProps, TRNavbarState };
