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
  SendAudioButtonProps,
  ProcessingButtonProps,
} from '../../types/trace.types';

/* ==================== UPLOAD BUTTON ==================== */
// 97×44px, stone-50 background, scan icon

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
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <g transform="translate(2.353, 2.479)">
            {/* Top-right corner */}
            <g transform="translate(13.590, 6.469) rotate(180)">
              <path
                d="M13.99814 0l0.00192 7.76329-10.04398 0m-3.95464-3.82184l-0.00144-3.94145m3.95608 7.76329l-3.95464-3.82184"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
            {/* Bottom-left corner */}
            <g transform="translate(1.923, 12.844)">
              <path
                d="M0.00174 2.19719l-0.00174-2.19719m11.66492 0l0.00174 2.19719-11.66492 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
            {/* Vertical line */}
            <g transform="translate(0, 9.366) rotate(90)">
              <path
                d="M0 0l0 12.77451"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>
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
// 106×44px, stone-50 background, mic icon

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
      {/* Mic Icon */}
      <div className="icon-container">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3.27734 3.52766c0-1.94827 1.57939-3.52766 3.52766-3.52766 1.94827 0 3.52766 1.57939 3.52766 3.52766l0 4.55468c0 1.94827-1.57939 3.52766-3.52766 3.52766-1.94827 0-3.52766-1.57939-3.52766-3.52766l0-4.55468z"
            transform="translate(4.671, 2.5)"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.538"
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
      {/* Close (X) Icon */}
      <div className="icon-container">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M11.99997 11.99997l-11.99997-11.99997m12.00003 0l-12.00003 12.00003"
            transform="translate(6, 6)"
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
      {/* Waveform Icon - 4 animated vertical bars */}
      <div className="waveform-container">
        <div className="bar bar-1"></div>
        <div className="bar bar-2"></div>
        <div className="bar bar-3"></div>
        <div className="bar bar-4"></div>
      </div>

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

        .waveform-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 24px;
          height: 24px;
          padding: 0 2px;
          gap: 4px;
        }

        .bar {
          width: 2.8px;
          background: var(--trace-text-primary);
          border-radius: 2px;
          transition: height 0.15s ease;
        }

        .bar-1 {
          height: 6px;
        }

        .bar-2 {
          height: 14px;
        }

        .bar-3 {
          height: 9px;
        }

        .bar-4 {
          height: 3px;
        }

        /* Animate bars when recording */
        .send-audio-button.recording .bar {
          animation: wave 1s ease-in-out infinite;
        }

        .send-audio-button.recording .bar-1 {
          animation-delay: 0s;
        }

        .send-audio-button.recording .bar-2 {
          animation-delay: 0.15s;
        }

        .send-audio-button.recording .bar-3 {
          animation-delay: 0.3s;
        }

        .send-audio-button.recording .bar-4 {
          animation-delay: 0.45s;
        }

        @keyframes wave {
          0%, 100% {
            height: 6px;
          }
          50% {
            height: 14px;
          }
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
    <div className={`processing-button ${className} ${styles.container}`}>
      {/* Spinner Icon */}
      <div className="spinner-container">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M400 800c-54.66666 0-106.33334-10.5-155-31.5-48.66667-21-91.16667-49.66669-127.5-86-36.33333-36.33331-65-78.83331-86-127.5-21-48.66666-31.5-100.33334-31.5-155 0-55.33334 10.5-107.16666 31.5-155.5 21-48.33333 49.66667-90.66667 86-127 36.33333-36.33333 78.83333-65 127.5-86 48.66666-21 100.33334-31.5 155-31.5 11.33334 0 20.83334 3.83333 28.5 11.5 7.66666 7.66667 11.5 17.16667 11.5 28.5 0 11.33333-3.83334 20.83333-11.5 28.5-7.66666 7.66666-17.16666 11.5-28.5 11.5-88.66666 0-164.16667 31.16667-226.5 93.5-62.33333 62.33333-93.5 137.83334-93.5 226.5 0 88.66666 31.16667 164.16669 93.5 226.5 62.33333 62.33331 137.83334 93.5 226.5 93.5 88.66666 0 164.16669-31.16669 226.5-93.5 62.33331-62.33331 93.5-137.83334 93.5-226.5 0-11.33334 3.83331-20.83334 11.5-28.5 7.66669-7.66666 17.16669-11.5 28.5-11.5 11.33331 0 20.83331 3.83334 28.5 11.5 7.66669 7.66666 11.5 17.16666 11.5 28.5 0 54.66666-10.5 106.33334-31.5 155-21 48.66669-49.66669 91.16669-86 127.5-36.33331 36.33331-78.66669 65-127 86-48.33334 21-100.16666 31.5-155.5 31.5z"
            transform="translate(2, 2) scale(0.025)"
            fill="currentColor"
          />
        </svg>
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
          pointer-events: none;
          user-select: none;
        }

        .spinner-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: var(--trace-text-primary);
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

        .button-text {
          white-space: nowrap;
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
    <div className={`processing-button ${className} ${styles.container}`}>
      {/* Spinner Icon */}
      <div className="spinner-container">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M400 800c-54.66666 0-106.33334-10.5-155-31.5-48.66667-21-91.16667-49.66669-127.5-86-36.33333-36.33331-65-78.83331-86-127.5-21-48.66666-31.5-100.33334-31.5-155 0-55.33334 10.5-107.16666 31.5-155.5 21-48.33333 49.66667-90.66667 86-127 36.33333-36.33333 78.83333-65 127.5-86 48.66666-21 100.33334-31.5 155-31.5 11.33334 0 20.83334 3.83333 28.5 11.5 7.66666 7.66667 11.5 17.16667 11.5 28.5 0 11.33333-3.83334 20.83333-11.5 28.5-7.66666 7.66666-17.16666 11.5-28.5 11.5-88.66666 0-164.16667 31.16667-226.5 93.5-62.33333 62.33333-93.5 137.83334-93.5 226.5 0 88.66666 31.16667 164.16669 93.5 226.5 62.33333 62.33331 137.83334 93.5 226.5 93.5 88.66666 0 164.16669-31.16669 226.5-93.5 62.33331-62.33331 93.5-137.83334 93.5-226.5 0-11.33334 3.83331-20.83334 11.5-28.5 7.66669-7.66666 17.16669-11.5 28.5-11.5 11.33331 0 20.83331 3.83334 28.5 11.5 7.66669 7.66666 11.5 17.16666 11.5 28.5 0 54.66666-10.5 106.33334-31.5 155-21 48.66669-49.66669 91.16669-86 127.5-36.33331 36.33331-78.66669 65-127 86-48.33334 21-100.16666 31.5-155.5 31.5z"
            transform="translate(2, 2) scale(0.025)"
            fill="currentColor"
          />
        </svg>
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
          pointer-events: none;
          user-select: none;
        }

        .spinner-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: var(--trace-text-primary);
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

        .button-text {
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};
