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
 * - idle/recording → processing: Crossfade from morphing buttons to processing button
 * - Upload click → processing_image (crossfade)
 * - SendAudio click → processing_audio (crossfade)
 *
 * Dimensions: 247px width, 44px height, 12px gap between morphing buttons
 *
 * Based on voicemorphingbuttons.tsx pattern - dual independent button morphs + crossfade states
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
      {/* MORPHING BUTTONS GROUP: Visible in idle/recording, fades out in processing */}
      <div className="morphing-group">
        {/* LEFT BUTTON TRACKER: Upload → Close */}
        <div className="left-button-tracker">
          <button
            className={`left-morph-button state-${state}`}
            onClick={state === 'idle' ? onUploadClick : onCloseClick}
            disabled={disabled}
            type="button"
            aria-label={state === 'idle' ? 'Upload' : 'Close'}
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
            </div>
          </button>
        </div>

        {/* RIGHT BUTTON TRACKER: Speak → SendAudio */}
        <div className="right-button-tracker">
          <button
            className={`right-morph-button state-${state}`}
            onClick={state === 'idle' ? onSpeakClick : onSendAudioClick}
            disabled={disabled}
            type="button"
            aria-label={state === 'idle' ? 'Speak' : 'Send Audio'}
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
          transition: opacity 0.2s ease;
        }

        /* Fade out morphing buttons in processing states */
        .state-processing_audio .morphing-group,
        .state-processing_image .morphing-group {
          opacity: 0;
          pointer-events: none;
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

        /* Fade in processing audio button */
        .state-processing_audio .processing-audio-wrapper {
          opacity: 1;
          pointer-events: auto;
        }

        /* Fade in processing image button */
        .state-processing_image .processing-image-wrapper {
          opacity: 1;
          pointer-events: auto;
        }

        /* ========================================
           LEFT BUTTON TRACKER: Upload → Close
           ======================================== */
        .left-button-tracker {
          /* IDLE: Upload width */
          width: var(--trace-btn-upload-width);
          height: var(--trace-button-height);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden; /* Clips content during morph */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* RECORDING: Close width */
        .state-recording .left-button-tracker {
          width: var(--trace-btn-close-width);
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
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      background 0.2s ease;
        }

        .left-morph-button.state-recording {
          width: var(--trace-btn-close-width); /* Close size */
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
        .close-content {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--trace-spacing-sm);
          transition: opacity 0.2s ease;
        }

        /* Upload visible in idle */
        .upload-content {
          opacity: 1;
        }
        .left-morph-button.state-recording .upload-content {
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

        /* ========================================
           RIGHT BUTTON TRACKER: Speak → SendAudio
           ======================================== */
        .right-button-tracker {
          /* IDLE: Speak width */
          width: var(--trace-btn-speak-width);
          height: var(--trace-button-height);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden; /* Clips content during morph */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* RECORDING: SendAudio width */
        .state-recording .right-button-tracker {
          width: var(--trace-btn-sendaudio-width);
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
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      background 0.2s ease,
                      color 0.2s ease;
        }

        /* RECORDING: SendAudio button (orange background) */
        .right-morph-button.state-recording {
          width: var(--trace-btn-sendaudio-width);
          background: var(--trace-btn-orange);
          color: var(--trace-text-primary);
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
        .sendaudio-content {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--trace-spacing-sm);
          transition: opacity 0.2s ease;
        }

        /* Speak visible in idle */
        .speak-content {
          opacity: 1;
        }
        .right-morph-button.state-recording .speak-content {
          opacity: 0;
          pointer-events: none;
        }

        /* SendAudio visible in recording */
        .sendaudio-content {
          opacity: 0;
          pointer-events: none;
        }
        .right-morph-button.state-recording .sendaudio-content {
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
      `}</style>
    </div>
  );
};

export default TRNavbar;

// Re-export types for convenience
export type { TRNavbarProps, TRNavbarState };
