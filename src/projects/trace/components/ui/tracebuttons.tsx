/**
 * Trace UI - Atomic Button Components
 * Following atomic design pattern from voice interface
 */

import React from 'react';
import styles from '@/projects/trace/styles/trace.module.css';
import {
  UploadButtonProps,
  SpeakButtonProps,
  CloseButtonProps,
  ClearButtonProps,
  SendAudioButtonProps,
  ProcessingButtonProps,
} from '../../types/trace.types';
import { TraceLiveWaveform } from './TraceLiveWaveform';
import { TraceColors } from '../../constants/designTokens';

/* ==================== UPLOAD BUTTON ==================== */
// 117×44px, stone-50 background, scan icon

export const UploadButton: React.FC<UploadButtonProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <button
      className={`upload-button ${className} ${styles.container}`}
      onClick={onClick}
      type="button"
    >
      {/* Scan Icon */}
      <div className="icon-container">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.9414 8.94891L15.9405 6.51244C15.9403 5.97042 15.7201 5.45169 15.3304 5.07502L13.226 3.04135C12.8531 2.68095 12.3548 2.4795 11.8362 2.4795L6.27519 2.4795C5.17042 2.4795 4.27491 3.37523 4.27519 4.48L4.27629 8.94891" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M4.27344 15.3234L4.27359 15.5221C4.27447 16.6261 5.16964 17.5206 6.27359 17.5206L13.9385 17.5206C15.0437 17.5206 15.9394 16.6242 15.9385 15.519L15.9384 15.3234" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M2.35156 11.8452L17.6453 11.8452" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Text */}
      <span className="button-text">Upload</span>

      <style jsx>{`
        .upload-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--trace-spacing-sm);
          width: var(--trace-btn-upload-width);
          height: var(--trace-button-height);
          padding: 0 var(--trace-spacing-xl);
          background: var(--trace-btn-light);
          border: var(--trace-button-stroke) solid transparent;
          border-radius: var(--trace-button-radius);
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-button);
          font-weight: var(--trace-fw-medium);
          line-height: var(--trace-lh-button);
          color: var(--trace-border-primary);
          cursor: pointer;
          transition: var(--trace-transition-fast);
          user-select: none;
        }

        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          color: var(--trace-border-primary);
        }

        .button-text {
          white-space: nowrap;
        }
      `}</style>
    </button>
  );
};


/* ==================== SPEAK BUTTON ==================== */
// 118×44px, stone-50 background, mic icon

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <button
      className={`speak-button ${className} ${styles.container}`}
      onClick={onClick}
      type="button"
    >
      {/* Mic Icon - From RecordWideButton in voicebuttons.tsx */}
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

      {/* Text */}
      <span className="button-text">Speak</span>

      <style jsx>{`
        .speak-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--trace-spacing-sm);
          width: var(--trace-btn-speak-width);
          height: var(--trace-button-height);
          padding: 0 var(--trace-spacing-xl);
          background: var(--trace-btn-light);
          border: var(--trace-button-stroke) solid transparent;
          border-radius: var(--trace-button-radius);
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-button);
          font-weight: var(--trace-fw-medium);
          line-height: var(--trace-lh-button);
          color: var(--trace-border-primary);
          cursor: pointer;
          transition: var(--trace-transition-fast);
          user-select: none;
        }

        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          color: var(--trace-border-primary);
        }

        .button-text {
          white-space: nowrap;
        }
      `}</style>
    </button>
  );
};


/* ==================== CLOSE BUTTON ==================== */
// 56×44px, stone-50 background, X icon

export const CloseButton: React.FC<CloseButtonProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <button
      className={`close-button ${className} ${styles.container}`}
      onClick={onClick}
      type="button"
    >
      {/* Close (X) Icon - From Pen MCP */}
      <div className="icon-container">
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

      <style jsx>{`
        .close-button {
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
          transition: var(--trace-transition-fast);
          user-select: none;
        }

        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: var(--trace-border-primary);
        }
      `}</style>
    </button>
  );
};


/* ==================== CLEAR BUTTON ==================== */
// 56×44px, stone-50 background, trash/delete icon

export const ClearButton: React.FC<ClearButtonProps> = ({
  onClick,
  className = '',
}) => {
  return (
    <button
      className={`clear-button ${className} ${styles.container}`}
      onClick={onClick}
      type="button"
    >
      {/* Clear/Delete Icon - From voicebuttons.tsx */}
      <div className="icon-container">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M14 10V17M10 10L10 17M4 6H20M18 6V17.8C18 18.9201 18.0002 19.4802 17.7822 19.908C17.5905 20.2844 17.2841 20.5902 16.9078 20.782C16.48 21 15.9203 21 14.8002 21H9.20019C8.08009 21 7.51962 21 7.0918 20.782C6.71547 20.5902 6.40973 20.2844 6.21799 19.908C6 19.4802 6 18.9201 6 17.8V6H18ZM16 6H8C8 5.06812 8 4.60216 8.15224 4.23462C8.35523 3.74456 8.74432 3.35523 9.23437 3.15224C9.60192 3 10.0681 3 11 3H13C13.9319 3 14.3978 3 14.7654 3.15224C15.2554 3.35523 15.6447 3.74456 15.8477 4.23462C15.9999 4.60216 16 5.06812 16 6Z"
            stroke="currentColor"
            strokeOpacity="0.9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <style jsx>{`
        .clear-button {
          display: flex;
          align-items: center;
          justify-content: center;
          height: var(--trace-button-height);
          padding: 0 var(--trace-spacing-xl);
          background: var(--trace-bg-dark); /* TextBox background color */
          border: var(--trace-button-stroke) solid transparent;
          border-radius: var(--trace-button-radius);
          color: var(--trace-btn-light); /* Icon color - previous button background */
          cursor: pointer;
          transition: var(--trace-transition-fast);
          user-select: none;
        }

        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: var(--trace-btn-light); /* Icon color - previous button background */
        }
      `}</style>
    </button>
  );
};


/* ==================== SEND AUDIO BUTTON ==================== */
// 150×44px, orange-500 background, waveform + text

export const SendAudioButton: React.FC<SendAudioButtonProps> = ({
  onClick,
  isRecording = false,
  className = '',
}) => {
  return (
    <button
      className={`send-audio-button ${isRecording ? 'recording' : ''} ${className} ${styles.container}`}
      onClick={onClick}
      type="button"
    >
      {/* Live Waveform */}
      <TraceLiveWaveform
        active={isRecording}
        barWidth={2.8}
        barGap={4}
        barRadius={2}
        barColor={TraceColors.textPrimary}
        barHeight={5}
        mode="static"
        ambientWave={isRecording}
        waveSpeed={6}
        waveAmplitude={0.55}
        waveHeight={1.4}
        height={24}
        style={{ width: '24px' }}
      />

      {/* Text */}
      <span className="button-text">Send Audio</span>

      <style jsx>{`
        .send-audio-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--trace-spacing-sm);
          height: var(--trace-button-height);
          padding: 0 var(--trace-spacing-xl);
          background: var(--trace-btn-orange);
          border: var(--trace-button-stroke) solid transparent;
          border-radius: var(--trace-button-radius);
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-button);
          font-weight: var(--trace-fw-medium);
          line-height: var(--trace-lh-button);
          color: var(--trace-text-primary);
          cursor: pointer;
          transition: var(--trace-transition-fast);
          user-select: none;
        }

        .button-text {
          white-space: nowrap;
        }
      `}</style>
    </button>
  );
};


/* ==================== PROCESSING AUDIO BUTTON ==================== */
// 301×44px, stone-400 background, loader + text (non-interactive)

export const ProcessingAudioButton: React.FC<ProcessingButtonProps> = ({
  text = 'Analysing Audio',
  className = '',
}) => {
  return (
    <button
      className={`processing-button ${className} ${styles.container}`}
      disabled
      type="button"
    >
      {/* Spinner — pure-CSS C-shape ring (Safari-safe, no rotating SVG) */}
      <div className="spinner-container">
        <div className="css-spinner" />
      </div>

      {/* Text */}
      <span className="button-text">{text}</span>

      <style jsx>{`
        .processing-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--trace-spacing-lg);
          height: var(--trace-button-height);
          width: var(--trace-btn-processing-width);
          padding: 0 26px;
          background: var(--trace-btn-processing);
          border: var(--trace-button-stroke) solid transparent;
          border-radius: var(--trace-button-radius);
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-processing);
          font-weight: var(--trace-fw-medium);
          line-height: var(--trace-lh-processing);
          color: var(--trace-text-primary);
          user-select: none;
        }

        .spinner-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: var(--trace-text-primary);
        }

        /*
         * Pure-CSS spinner — avoids Safari's rotating-SVG wobble bug.
         * Arc painted via conic-gradient, carved to a ring via radial mask,
         * and pseudo-element dots provide rounded caps at the arc endpoints.
         */
        .css-spinner {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 22px;
          height: 22px;
          margin: auto;
          border-radius: 50%;
          background: conic-gradient(from 0deg, currentColor 0deg 270deg, transparent 270deg 360deg);
          -webkit-mask: radial-gradient(circle at center, transparent 0 9px, #000 9px 100%);
                  mask: radial-gradient(circle at center, transparent 0 9px, #000 9px 100%);
          animation: spin 1s linear infinite;
        }

        .css-spinner::before,
        .css-spinner::after {
          content: '';
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: currentColor;
        }
        .css-spinner::before { top: 0; left: 50%; margin-left: -1px; }
        .css-spinner::after { top: 50%; left: 0; margin-top: -1px; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .button-text {
          white-space: nowrap;
        }
      `}</style>
    </button>
  );
};


/* ==================== OLD SPINNER REFERENCE ==================== */
// Preserved snapshot of the pre-fix spinner implementation — rotates an <svg>
// element directly, which wobbles in Safari due to a WebKit compositor bug.
// Kept in the showcase as a standalone spinner for side-by-side comparison
// with the CSS-spinner fix. Not a button — just the raw spinner.

export const OldSpinnerReference: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`old-spinner-reference ${className}`} aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M400 800c-54.66666 0-106.33334-10.5-155-31.5-48.66667-21-91.16667-49.66669-127.5-86-36.33333-36.33331-65-78.83331-86-127.5-21-48.66666-31.5-100.33334-31.5-155 0-55.33334 10.5-107.16666 31.5-155.5 21-48.33333 49.66667-90.66667 86-127 36.33333-36.33333 78.83333-65 127.5-86 48.66666-21 100.33334-31.5 155-31.5 11.33334 0 20.83334 3.83333 28.5 11.5 7.66666 7.66667 11.5 17.16667 11.5 28.5 0 11.33333-3.83334 20.83333-11.5 28.5-7.66666 7.66666-17.16666 11.5-28.5 11.5-88.66666 0-164.16667 31.16667-226.5 93.5-62.33333 62.33333-93.5 137.83334-93.5 226.5 0 88.66666 31.16667 164.16669 93.5 226.5 62.33333 62.33331 137.83334 93.5 226.5 93.5 88.66666 0 164.16669-31.16669 226.5-93.5 62.33331-62.33331 93.5-137.83334 93.5-226.5 0-11.33334 3.83331-20.83334 11.5-28.5 7.66669-7.66666 17.16669-11.5 28.5-11.5 11.33331 0 20.83331 3.83334 28.5 11.5 7.66669 7.66666 11.5 17.16666 11.5 28.5 0 54.66666-10.5 106.33334-31.5 155-21 48.66669-49.66669 91.16669-86 127.5-36.33331 36.33331-78.66669 65-127 86-48.33334 21-100.16666 31.5-155.5 31.5z"
          transform="translate(2, 2) scale(0.025)"
          fill="currentColor"
        />
      </svg>

      <style jsx>{`
        .old-spinner-reference {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: var(--trace-text-primary);
        }

        .old-spinner-reference svg {
          width: 24px;
          height: 24px;
          backface-visibility: hidden;
          animation: spin-old 1s linear infinite;
        }

        @keyframes spin-old {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};


/* ==================== PROCESSING IMAGE BUTTON ==================== */
// 301×44px, stone-400 background, loader + "Processing Image" text (non-interactive)

export const ProcessingImageButton: React.FC<ProcessingButtonProps> = ({
  text = 'Processing Image',
  className = '',
}) => {
  return (
    <button
      className={`processing-button ${className} ${styles.container}`}
      disabled
      type="button"
    >
      {/* Spinner — pure-CSS C-shape ring (Safari-safe, no rotating SVG) */}
      <div className="spinner-container">
        <div className="css-spinner" />
      </div>

      {/* Text */}
      <span className="button-text">{text}</span>

      <style jsx>{`
        .processing-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--trace-spacing-lg);
          height: var(--trace-button-height);
          width: var(--trace-btn-processing-width);
          padding: 0 26px;
          background: var(--trace-btn-processing);
          border: var(--trace-button-stroke) solid transparent;
          border-radius: var(--trace-button-radius);
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-processing);
          font-weight: var(--trace-fw-medium);
          line-height: var(--trace-lh-processing);
          color: var(--trace-text-primary);
          user-select: none;
        }

        .spinner-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: var(--trace-text-primary);
        }

        /*
         * Pure-CSS spinner — avoids Safari's rotating-SVG wobble bug.
         * Arc painted via conic-gradient, carved to a ring via radial mask,
         * and pseudo-element dots provide rounded caps at the arc endpoints.
         */
        .css-spinner {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 22px;
          height: 22px;
          margin: auto;
          border-radius: 50%;
          background: conic-gradient(from 0deg, currentColor 0deg 270deg, transparent 270deg 360deg);
          -webkit-mask: radial-gradient(circle at center, transparent 0 9px, #000 9px 100%);
                  mask: radial-gradient(circle at center, transparent 0 9px, #000 9px 100%);
          animation: spin 1s linear infinite;
        }

        .css-spinner::before,
        .css-spinner::after {
          content: '';
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: currentColor;
        }
        .css-spinner::before { top: 0; left: 50%; margin-left: -1px; }
        .css-spinner::after { top: 50%; left: 0; margin-top: -1px; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .button-text {
          white-space: nowrap;
        }
      `}</style>
    </button>
  );
};
