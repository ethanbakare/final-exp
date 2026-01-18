import React, { useState } from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';
import { VoiceLiveTimerSeconds } from './VoiceLiveTimerSeconds';
import { VoiceLiveWaveform } from './VoiceLiveWaveform';
import { VoiceLiveTimer } from './VoiceLiveTimer';
import {
  StopRecordButton,
  CopyButton,
  ClearButton,
  ClearButtonFaded,
  TimeCountButton
} from './voicebuttons';

/* ============================================
   MORPHING RECORD TO PILL WAVE

   Pattern: Controlled component with dynamic timer
   - RecordButton (38×38px) morphs to RecordingWaveButton (64×34px)
   - Timer (40px/48px/52px) manages its own width and reports changes
   - Container dynamically adjusts: 40px → 114px/122px/126px
   - Timer is pushed into view by flexbox as button expands

   Architecture: VoiceLiveTimerSeconds owns timer logic, reports width via callback
   Based on: MorphingTimerProcessingToStructure from clipmorphingbuttons.tsx
   ============================================ */

export type RecordPillState = 'idle' | 'recording';

interface MorphingRecordToPillWaveProps {
  state: RecordPillState;
  onRecordClick?: () => void;
  onStopRecordingClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const MorphingRecordToPillWave: React.FC<MorphingRecordToPillWaveProps> = ({
  state,
  onRecordClick,
  onStopRecordingClick,
  className = '',
  disabled = false
}) => {
  // Timer width is controlled by VoiceLiveTimerSeconds via callback
  const [timerWidth, setTimerWidth] = useState(38); // Default to smallest width

  const containerWidth = state === 'recording' ? timerWidth + 10 + 64 : 38; // timer + gap + button : idle

  const handleClick = () => {
    if (disabled) return;
    if (state === 'idle') {
      onRecordClick?.();
    } else {
      onStopRecordingClick?.();
    }
  };

  return (
    <>
      <div
        className={`record-pill-container state-${state} ${className} ${styles.container}`}
        style={{ width: `${containerWidth}px` }}
      >
        {/* Timer Text - Fades in during recording state */}
        <div
          className="timer-text-wrapper"
          style={{ width: state === 'recording' ? `${timerWidth}px` : '0px' }}
        >
          <VoiceLiveTimerSeconds
            isRunning={state === 'recording'}
            onWidthChange={setTimerWidth}
          />
        </div>

        {/* Button-width-tracker - Reports button width to parent flexbox */}
        <div className="button-width-tracker">
          <button
            className={`morphing-record-button state-${state}`}
            onClick={handleClick}
            disabled={disabled}
            aria-label={state === 'idle' ? 'Record' : 'Stop Recording'}
          >
            {/* Content container for icon crossfade */}
            <div className="content-container">
              {/* Mic Icon - visible in idle state */}
              <div className="mic-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.3971 12.2769C17.8972 15.3597 15.223 17.7133 11.9991 17.7133C8.77602 17.7133 6.10239 15.3609 5.60156 12.2793M11.9986 20.9999V17.8829M13.9334 20.9999H10.1002M12.0021 13.9198C10.1696 13.9198 8.68411 12.4343 8.68411 10.6018V6.31787C8.68411 4.48539 10.1696 2.99988 12.0021 2.99988C13.8346 2.99988 15.3201 4.48539 15.3201 6.31786V10.6018C15.3201 12.4343 13.8346 13.9198 12.0021 13.9198Z"
                    stroke="#262424"
                    strokeOpacity="0.9"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Wave Visual - visible in recording state */}
              <div className="wave-icon">
                <VoiceLiveWaveform active={state === 'recording'} />
              </div>
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        /* ========================================
           ACCESSIBILITY
           ======================================== */

        @media (prefers-reduced-motion: reduce) {
          .record-pill-container,
          .record-pill-container * {
            transition: none !important;
          }
        }

        /* ========================================
           CONTAINER - Fixed width for timer to glide within
           ======================================== */

        .record-pill-container {
          /* Layout - Flex row to hold timer + button */
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;  /* CRITICAL: Right-align so timer gets pushed into view */
          padding: 0px;
          box-sizing: border-box;  /* Include border in width */

          /* IDLE STATE: Button size + border room */
          gap: 0px;
          /* Width set dynamically via inline style: 40px (idle) → 114px/122px/126px (recording) */
          height: 38px;  /* 38px button + ~2px for borders */



          /* Smooth transitions */
          transition: gap 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* RECORDING STATE: Full size with gap */
        .record-pill-container.state-recording {
          gap: 10px;
          /* Width set dynamically via inline style based on timer duration */
          height: 40px;
        }

        /* ========================================
           TIMER TEXT WRAPPER - Fades in during recording
           ======================================== */

        .timer-text-wrapper {
          /* Layout */
          display: flex;
          align-items: center;
          height: 26px;
          box-sizing: border-box;  /* Include border in width */

          /* IDLE STATE: Hidden with no width */
          /* Width set dynamically via inline style: 0px (idle) → 40px/48px/52px (recording) */
          opacity: 0;
          pointer-events: none;
          overflow: hidden;

          /* Transitions */
          transition: opacity 0.1s ease,
                      width 0.2s cubic-bezier(0.4, 0, 0.2, 1);

          /* Debug border */
          /* border: 0.5px solid blue; REMOVED DEBUG */
        }

        /* RECORDING STATE: Visible with dynamic width */
        .record-pill-container.state-recording .timer-text-wrapper {
          /* Width set dynamically via inline style (40px → 48px → 52px) */
          opacity: 1;
          pointer-events: auto;
        }

        /* ========================================
           BUTTON WIDTH TRACKER - Reports button width to parent flexbox
           ======================================== */

        .button-width-tracker {
          /* Tracks button's morphing width */
          width: 38px;         /* Idle width - button + border room */
          height: 38px;
          box-sizing: border-box;  /* Include border in width */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;    /* CRITICAL: Clips content during morph */
          display: flex;
          align-items: center;
          justify-content: flex-end;  /* Keep button right-aligned */

          /* Debug border */

        }

        /* Expand tracker to match recording button size */
        .record-pill-container.state-recording .button-width-tracker {
          width: 66px;         /* Recording width - button + border room */
          height: 36px;
        }

        /* ========================================
           MORPHING BUTTON - Physical morph between states
           ======================================== */

        .morphing-record-button {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px;
          cursor: pointer;
          box-sizing: border-box;  /* Include border in width */

          /* IDLE STATE - RecordButtonFilled (light grey circle) */
          width: 38px;
          height: 38px;
          background: var(--VoiceDarkGrey_5);
          border-radius: 19px;

          /* Morphing animation */
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width, height, background, border-radius;
          overflow: hidden;

          border: none;


        }

        /* RECORDING STATE - RecordingWaveButton (pill) */
        .morphing-record-button.state-recording {
          width: 64px;
          height: 34px;
          padding: 10px 16px;
          background: var(--VoiceDarkGrey_90);
          border-radius: 24px;
        }

        /* Disabled state */
        .morphing-record-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ========================================
           CONTENT CONTAINER - Icons crossfade
           ======================================== */

        .content-container {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* ========================================
           MIC ICON - Visible in idle state
           ======================================== */

        .mic-icon {
          position: absolute;
          width: 24px;
          height: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 1;
          transition: opacity 0.2s ease;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        /* Hide mic in recording state */
        .morphing-record-button.state-recording .mic-icon {
          opacity: 0;
        }

        /* ========================================
           WAVE ICON - Visible in recording state
           ======================================== */

        .wave-icon {
          position: absolute;
          width: 32px;
          height: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        /* Show wave in recording state */
        .morphing-record-button.state-recording .wave-icon {
          opacity: 1;
        }
      `}</style>
    </>
  );
};

/* ============================================
   MORPHING RECORD TO PILL CONFIRM V1
   
   Approach: Container Morph + Content Crossfade
   - Button border morphs from circle (38×38) to pill (72×34)
   - Mic icon fades out
   - Full CheckAndCloseButton internal structure fades in
   ============================================ */

interface MorphingRecordToPillConfirmProps {
  state: RecordPillState;
  onRecordClick?: () => void;
  onConfirmClick?: () => void;
  onCancelClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const MorphingRecordToPillConfirmV1: React.FC<MorphingRecordToPillConfirmProps> = ({
  state,
  onRecordClick,
  onConfirmClick,
  onCancelClick,
  className = '',
  disabled = false
}) => {
  // Timer width is controlled by TimeCountButton via callback (which gets it from VoiceLiveTimerSeconds)
  const [timeCountWidth, setTimeCountWidth] = useState(58); // Default: 18px red dot + 40px timer

  const buttonWidth = state === 'recording' ? 74 : 38;
  const gap = 10;
  const containerWidth = state === 'recording' ? timeCountWidth + gap + buttonWidth : 38;

  return (
    <>
      <div
        className={`v1-container state-${state} ${className} ${styles.container}`}
        style={{ width: `${containerWidth}px` }}
      >
        {/* Timer slides in - uses TimeCountButton with dynamic width callback */}
        <div
          className="v1-timer-wrapper"
          style={{ width: state === 'recording' ? `${timeCountWidth}px` : '0px' }}
        >
          <TimeCountButton
            isTimerRunning={state === 'recording'}
            onWidthChange={setTimeCountWidth}
          />
        </div>



        {/* Button tracker */}
        <div className="v1-button-tracker">
          {/* Morphing button - uses button element for accessibility */}
          <button
            className={`v1-morph-border state-${state}`}
            onClick={() => state === 'idle' && !disabled && onRecordClick?.()}
            disabled={disabled}
            aria-label={state === 'idle' ? 'Start recording' : 'Confirm or cancel recording'}
          >
            {/* Mic icon - fades out */}
            <div className="v1-mic-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.3971 12.2769C17.8972 15.3597 15.223 17.7133 11.9991 17.7133C8.77602 17.7133 6.10239 15.3609 5.60156 12.2793M11.9986 20.9999V17.8829M13.9334 20.9999H10.1002M12.0021 13.9198C10.1696 13.9198 8.68411 12.4343 8.68411 10.6018V6.31787C8.68411 4.48539 10.1696 2.99988 12.0021 2.99988C13.8346 2.99988 15.3201 4.48539 15.3201 6.31786V10.6018C15.3201 12.4343 13.8346 13.9198 12.0021 13.9198Z" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* CheckAndCloseButton internal structure - fades in */}
            <div className="v1-checkclose-content">
              {/* Check Division */}
              <div
                className="v1-check-div"
                role="button"
                tabIndex={state === 'recording' ? 0 : -1}
                aria-label="Confirm"
                onClick={(e) => { e.stopPropagation(); onConfirmClick?.(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onConfirmClick?.(); } }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8.99997L6.71231 12.7123L14.6676 4.75732" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Divider */}
              <div className="v1-divider">
                <svg width="1" height="18" viewBox="0 0 1 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="0.5" y1="0" x2="0.5" y2="18" stroke="#262424" strokeOpacity="0.2" strokeWidth="1" strokeLinecap="round" />
                </svg>
              </div>
              {/* Close Division */}
              <div
                className="v1-close-div"
                role="button"
                tabIndex={state === 'recording' ? 0 : -1}
                aria-label="Cancel"
                onClick={(e) => { e.stopPropagation(); onCancelClick?.(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onCancelClick?.(); } }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.5 13.5L4.5 4.5M13.5 4.5L4.5 13.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>


      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .v1-container, .v1-container * { transition: none !important; }
        }

        .v1-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          gap: 0px;
          height: 38px;
          box-sizing: border-box;

          transition: gap 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v1-container.state-recording { gap: 10px; }

        .v1-timer-wrapper {
          display: flex;
          align-items: center;
          height: 26px;
          opacity: 0;
          overflow: hidden;
          /* border: 0.5px solid blue; REMOVED DEBUG */
          transition: opacity 0.15s ease, width 0.14s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v1-container.state-recording .v1-timer-wrapper { opacity: 1; }

        .v1-button-tracker {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;

          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v1-container.state-recording .v1-button-tracker { width: 74px; }

        /* The morphing border */
        .v1-morph-border {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          cursor: pointer;
          
          /* Idle: circle */
          width: 38px;
          height: 38px;
          border: 1.13px solid var(--VoiceDarkGrey_20);
          border-radius: 19px;
          background: transparent;
          

          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        /* Recording: pill matching CheckAndCloseButton (64×26 + 4px padding) */
        .v1-morph-border.state-recording {
          width: 72px;
          height: 34px;
          border-radius: 24px;
          padding: 4px;
        }

        /* Mic icon - allows click through in idle */
        .v1-mic-icon {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 1;
          pointer-events: none;  /* FIX: Let clicks pass through to parent */
          transition: opacity 0.15s ease;
        }
        .v1-morph-border.state-recording .v1-mic-icon { opacity: 0; }

        /* CheckAndCloseButton structure - matches exact internal layout */
        .v1-checkclose-content {
          position: absolute;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          width: 64px;
          height: 26px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.11s ease;  /* Fade-out: 20% faster, no delay */
        }
        .v1-morph-border.state-recording .v1-checkclose-content { 
          opacity: 1; 
          pointer-events: auto;
          transition: opacity 0.15s ease 0.05s;  /* Fade-in: original timing with delay */
        }

        .v1-check-div {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px 6px 0px 8px;
          width: 32px;
          height: 26px;
          background: transparent;
          border-radius: 40px 0px 0px 40px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-radius 0.2s ease;
        }
        .v1-check-div:hover { 
          background: var(--VoiceDarkGrey_5); 
          border-radius: 40px 2px 2px 40px;  /* FIX: Rounded inner edge on hover */
        }

        .v1-divider {
          width: 1px;
          height: 18px;
          display: flex;
          align-items: center;
          transition: opacity 0.2s ease;
        }
        /* FIX: Divider hides when hovering check or close */
        .v1-check-div:hover ~ .v1-divider,
        .v1-close-div:hover ~ .v1-divider,
        .v1-divider:has(~ .v1-check-div:hover),
        .v1-divider:has(~ .v1-close-div:hover),
        .v1-checkclose-content:hover .v1-divider {
          opacity: 0;
        }

        .v1-close-div {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px 8px 0px 6px;
          width: 32px;
          height: 26px;
          background: transparent;
          border-radius: 0px 40px 40px 0px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-radius 0.2s ease;
        }
        .v1-close-div:hover { 
          background: var(--VoiceDarkGrey_5); 
          border-radius: 2px 40px 40px 2px;  /* FIX: Rounded inner edge on hover */
        }
      `}</style>

    </>
  );
};

// Export with standard name
export const MorphingRecordToPillConfirm = MorphingRecordToPillConfirmV1;

/* ============================================
   MORPHING RECORD TO PILL CONFIRM PROCESSING

   Pattern: 3-state morphing with processing state
   - Idle: RecordButton outlined (38px circle)
   - Recording: Pill (72×34px) with check/divider/X + timer (running)
   - Processing: Same pill, check/divider/X replaced by spinner + timer (frozen)
   
   Flow:
   - Idle → Recording: Click record
   - Recording → Processing: Click check → spinner replaces check/div/X, timer freezes
   - Recording → Idle: Click X
   - Processing → Idle: Auto-revert after 5 seconds
   ============================================ */

export type RecordPillProcessingState = 'idle' | 'recording' | 'processing';

interface MorphingRecordToPillConfirmProcessingProps {
  state: RecordPillProcessingState;
  onRecordClick?: () => void;
  onConfirmClick?: () => void;
  onCancelClick?: () => void;
  onProcessingComplete?: () => void;
  className?: string;
  disabled?: boolean;
}

export const MorphingRecordToPillConfirmProcessing: React.FC<MorphingRecordToPillConfirmProcessingProps> = ({
  state,
  onRecordClick,
  onConfirmClick,
  onCancelClick,
  onProcessingComplete,
  className = '',
  disabled = false
}) => {
  // Timer width is controlled by TimeCountButton via callback
  const [timeCountWidth, setTimeCountWidth] = useState(58);

  // Auto-revert timer for processing state
  React.useEffect(() => {
    if (state === 'processing') {
      const timer = setTimeout(() => {
        onProcessingComplete?.();
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [state, onProcessingComplete]);

  // Button expands when recording or processing
  const isExpanded = state === 'recording' || state === 'processing';
  const buttonWidth = isExpanded ? 74 : 40;
  const gap = 10;
  const containerWidth = isExpanded ? timeCountWidth + gap + buttonWidth : 40;

  return (
    <>
      <div
        className={`v1p-container state-${state} ${className} ${styles.container}`}
        style={{ width: `${containerWidth}px` }}
      >
        {/* Timer slides in - freezes in processing state */}
        <div
          className="v1p-timer-wrapper"
          style={{ width: isExpanded ? `${timeCountWidth}px` : '0px' }}
        >
          <TimeCountButton
            isTimerRunning={state === 'recording'}
            onWidthChange={setTimeCountWidth}
            shouldReset={state === 'idle'}
          />
        </div>

        {/* Button tracker */}
        <div className="v1p-button-tracker">
          {/* Morphing button */}
          <button
            className={`v1p-morph-border state-${state}`}
            onClick={() => state === 'idle' && !disabled && onRecordClick?.()}
            disabled={disabled}
            aria-label={
              state === 'idle' ? 'Start recording' :
                state === 'recording' ? 'Confirm or cancel recording' :
                  'Processing...'
            }
          >
            {/* Mic icon - fades out when expanded */}
            <div className="v1p-mic-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.3971 12.2769C17.8972 15.3597 15.223 17.7133 11.9991 17.7133C8.77602 17.7133 6.10239 15.3609 5.60156 12.2793M11.9986 20.9999V17.8829M13.9334 20.9999H10.1002M12.0021 13.9198C10.1696 13.9198 8.68411 12.4343 8.68411 10.6018V6.31787C8.68411 4.48539 10.1696 2.99988 12.0021 2.99988C13.8346 2.99988 15.3201 4.48539 15.3201 6.31786V10.6018C15.3201 12.4343 13.8346 13.9198 12.0021 13.9198Z" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* CheckAndCloseButton structure - visible in recording only */}
            <div className="v1p-checkclose-content">
              {/* Check Division */}
              <div
                className="v1p-check-div"
                role="button"
                tabIndex={state === 'recording' ? 0 : -1}
                aria-label="Confirm"
                onClick={(e) => { e.stopPropagation(); onConfirmClick?.(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onConfirmClick?.(); } }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8.99997L6.71231 12.7123L14.6676 4.75732" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Divider */}
              <div className="v1p-divider">
                <svg width="1" height="18" viewBox="0 0 1 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="0.5" y1="0" x2="0.5" y2="18" stroke="#262424" strokeOpacity="0.2" strokeWidth="1" strokeLinecap="round" />
                </svg>
              </div>
              {/* Close Division */}
              <div
                className="v1p-close-div"
                role="button"
                tabIndex={state === 'recording' ? 0 : -1}
                aria-label="Cancel"
                onClick={(e) => { e.stopPropagation(); onCancelClick?.(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onCancelClick?.(); } }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.5 13.5L4.5 4.5M13.5 4.5L4.5 13.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Processing spinner - visible in processing only */}
            <div className="v1p-spinner-content">
              <div className="v1p-spinner-container">
                <svg
                  className="v1p-spinner"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 15.5V18.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M4.5 10L1.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M10 1.5V4.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M18.5 10L15.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M6.11 13.89L3.99 16.01" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M6.11 6.11L3.99 3.99" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M16.01 3.99L13.89 6.11" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M16.01 16.01L13.89 13.89" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .v1p-container, .v1p-container * { transition: none !important; animation: none !important; }
        }

        @keyframes spin-v1p {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .v1p-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          gap: 0px;
          height: 40px;
          box-sizing: border-box;
          /* border: 0.5px solid red; REMOVED DEBUG */
          transition: gap 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v1p-container.state-recording,
        .v1p-container.state-processing { gap: 10px; }

        .v1p-timer-wrapper {
          display: flex;
          align-items: center;
          height: 26px;
          opacity: 0;
          overflow: hidden;
          /* border: 0.5px solid blue; REMOVED DEBUG */
          transition: opacity 0.15s ease, width 0.14s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v1p-container.state-recording .v1p-timer-wrapper,
        .v1p-container.state-processing .v1p-timer-wrapper { opacity: 1; }

        .v1p-button-tracker {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;

          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v1p-container.state-recording .v1p-button-tracker,
        .v1p-container.state-processing .v1p-button-tracker { width: 74px; }

        .v1p-morph-border {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          cursor: pointer;
          width: 38px;
          height: 38px;
          border: 1.13px solid var(--VoiceDarkGrey_20);
          border-radius: 19px;
          background: transparent;
          /* outline: 0.5px solid orange; REMOVED DEBUG */
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v1p-morph-border.state-recording,
        .v1p-morph-border.state-processing {
          width: 72px;
          height: 34px;
          border-radius: 24px;
          padding: 4px;
        }

        .v1p-mic-icon {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 1;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .v1p-morph-border.state-recording .v1p-mic-icon,
        .v1p-morph-border.state-processing .v1p-mic-icon { opacity: 0; }

        /* Check/Close content - visible in recording only */
        .v1p-checkclose-content {
          position: absolute;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          width: 64px;
          height: 26px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .v1p-morph-border.state-recording .v1p-checkclose-content { 
          opacity: 1; 
          pointer-events: auto;
        }

        .v1p-check-div {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px 6px 0px 8px;
          width: 32px;
          height: 26px;
          background: transparent;
          border-radius: 40px 0px 0px 40px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-radius 0.2s ease;
        }
        .v1p-check-div:hover { 
          background: var(--VoiceDarkGrey_5); 
          border-radius: 40px 2px 2px 40px;
        }

        .v1p-divider {
          width: 1px;
          height: 18px;
          display: flex;
          align-items: center;
          transition: opacity 0.2s ease;
        }
        .v1p-check-div:hover ~ .v1p-divider,
        .v1p-close-div:hover ~ .v1p-divider,
        .v1p-checkclose-content:hover .v1p-divider { opacity: 0; }

        .v1p-close-div {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px 8px 0px 6px;
          width: 32px;
          height: 26px;
          background: transparent;
          border-radius: 0px 40px 40px 0px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-radius 0.2s ease;
        }
        .v1p-close-div:hover { 
          background: var(--VoiceDarkGrey_5); 
          border-radius: 2px 40px 40px 2px;
        }

        /* Spinner content - visible in processing only */
        .v1p-spinner-content {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 64px;
          height: 26px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .v1p-morph-border.state-processing .v1p-spinner-content { 
          opacity: 1; 
        }

        .v1p-spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 20px;
          height: 20px;
        }

        .v1p-spinner {
          width: 20px;
          height: 20px;
          transform-origin: center center;
        }

        .v1p-morph-border.state-processing .v1p-spinner {
          animation: spin-v1p 1.5s linear infinite;
        }
      `}</style>
    </>
  );
};
/* ============================================
   MORPHING PROCESSING TO COMBO

   Pattern: 4-state morphing (extending ConfirmProcessing)
   - Idle, Recording, Processing: Same as ConfirmProcessing
   - Combo: Transition target from Processing.
     Instead of auto-reverting to Idle, timer wrapper morphs into ClearButton (left),
     and processing button morphs back to RecordButton (right), creating the combo layout.
   
   States: 'idle' | 'recording' | 'processing' | 'combo'
   ============================================ */

export type RecordProcessingComboState = 'idle' | 'recording' | 'processing' | 'combo';

interface MorphingProcessingToComboProps {
  state: RecordProcessingComboState;
  onRecordClick?: () => void;
  onConfirmClick?: () => void;
  onCancelClick?: () => void; // Used for X in recording
  onClearClick?: () => void; // Used for ClearButton in combo (defaults to onCancelClick if not provided)
  onProcessingComplete?: () => void;
  className?: string;
  disabled?: boolean;
}

export const MorphingProcessingToCombo: React.FC<MorphingProcessingToComboProps> = ({
  state,
  onRecordClick,
  onConfirmClick,
  onCancelClick,
  onClearClick,
  onProcessingComplete,
  className = '',
  disabled = false
}) => {
  // Timer width is controlled by TimeCountButton via callback
  const [timeCountWidth, setTimeCountWidth] = useState(58);

  // Auto-revert timer for processing state -> combo state
  React.useEffect(() => {
    if (state === 'processing') {
      const timer = setTimeout(() => {
        onProcessingComplete?.();
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [state, onProcessingComplete]);

  // Button expands when recording or processing
  const isExpanded = state === 'recording' || state === 'processing';

  // Dimensions
  // In 'combo' state:
  // - Timer wrapper becomes ClearButton (width 38px)
  // - Gap becomes 10px
  // - Button becomes RecordButton idle size (40px wrapper, 38px button)
  const isCombo = state === 'combo';

  const buttonWidth = isExpanded ? 74 : 40; // Combo uses 40 (idle size)
  const gap = isCombo || isExpanded ? 10 : 10; // Gap is 10 in combo too. Idle is 0 but we can keep 10 if width is 0. 
  // Actually, idle has gap 0.

  // Container calculation
  // Idle: 40px
  // Recording/Processing: timeCountWidth + 10 + 74
  // Combo: 38 (Clear) + 10 + 40 (Record) = 88px

  let containerWidth = 40;
  if (isExpanded) {
    containerWidth = timeCountWidth + 10 + buttonWidth;
  } else if (isCombo) {
    containerWidth = 38 + 10 + 40;
  }

  // Timer wrapper width
  // Idle: 0
  // Rec/Proc: timeCountWidth
  // Combo: 38 (ClearButton size)
  let timerWrapperWidth = isExpanded ? timeCountWidth : 0;
  if (isCombo) timerWrapperWidth = 38;

  return (
    <>
      <div
        className={`v2c-container state-${state} ${className} ${styles.container}`}
        style={{ width: `${containerWidth}px` }}
      >
        {/* Timer Wrapper: Morphs between Timer and ClearButton */}
        <div
          className="v2c-timer-wrapper"
          style={{ width: `${timerWrapperWidth}px` }}
        >
          {/* Timer Component - Visible in Rec/Proc */}
          <div className={`v2c-content-timer ${isExpanded ? 'visible' : ''}`}>
            <TimeCountButton
              isTimerRunning={state === 'recording'}
              onWidthChange={setTimeCountWidth}
              shouldReset={state === 'idle' || state === 'combo'}
            />
          </div>

          {/* Clear Button - Visible in Combo */}
          <div className={`v2c-content-clear ${isCombo ? 'visible' : ''}`} style={{ pointerEvents: isCombo ? 'auto' : 'none' }}>
            <ClearButtonFaded onClick={() => isCombo && (onClearClick?.() ?? onCancelClick?.())} />
          </div>
        </div>

        {/* Button tracker (Right side) */}
        <div className="v2c-button-tracker">
          {/* Morphing button */}
          <button
            className={`v2c-morph-border state-${state}`}
            onClick={() => (state === 'idle' || state === 'combo') && !disabled && onRecordClick?.()}
            disabled={disabled}
            aria-label={
              state === 'idle' || state === 'combo' ? 'Start recording' :
                state === 'recording' ? 'Confirm or cancel recording' :
                  'Processing...'
            }
          >
            {/* Mic icon - Visible in Idle & Combo */}
            <div className={`v2c-mic-icon ${state === 'idle' || state === 'combo' ? 'visible' : ''}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.3971 12.2769C17.8972 15.3597 15.223 17.7133 11.9991 17.7133C8.77602 17.7133 6.10239 15.3609 5.60156 12.2793M11.9986 20.9999V17.8829M13.9334 20.9999H10.1002M12.0021 13.9198C10.1696 13.9198 8.68411 12.4343 8.68411 10.6018V6.31787C8.68411 4.48539 10.1696 2.99988 12.0021 2.99988C13.8346 2.99988 15.3201 4.48539 15.3201 6.31786V10.6018C15.3201 12.4343 13.8346 13.9198 12.0021 13.9198Z" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* CheckAndCloseButton structure - visible in recording only */}
            <div className={`v2c-checkclose-content ${state === 'recording' ? 'visible' : ''}`}>
              {/* Check Division */}
              <div
                className="v2c-check-div"
                role="button"
                tabIndex={state === 'recording' ? 0 : -1}
                aria-label="Confirm"
                onClick={(e) => { e.stopPropagation(); onConfirmClick?.(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onConfirmClick?.(); } }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8.99997L6.71231 12.7123L14.6676 4.75732" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Divider */}
              <div className="v2c-divider">
                <svg width="1" height="18" viewBox="0 0 1 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="0.5" y1="0" x2="0.5" y2="18" stroke="#262424" strokeOpacity="0.2" strokeWidth="1" strokeLinecap="round" />
                </svg>
              </div>
              {/* Close Division */}
              <div
                className="v2c-close-div"
                role="button"
                tabIndex={state === 'recording' ? 0 : -1}
                aria-label="Cancel"
                onClick={(e) => { e.stopPropagation(); onCancelClick?.(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onCancelClick?.(); } }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.5 13.5L4.5 4.5M13.5 4.5L4.5 13.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Processing spinner - visible in processing only */}
            <div className={`v2c-spinner-content ${state === 'processing' ? 'visible' : ''}`}>
              <div className="v2c-spinner-container">
                <svg
                  className="v2c-spinner"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 15.5V18.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M4.5 10L1.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M10 1.5V4.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M18.5 10L15.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M6.11 13.89L3.99 16.01" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M6.11 6.11L3.99 3.99" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M16.01 3.99L13.89 6.11" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                  <path d="M16.01 16.01L13.89 13.89" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .v2c-container, .v2c-container * { transition: none !important; animation: none !important; }
        }

        @keyframes spin-v2c {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .v2c-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          gap: 0px;
          height: 40px;
          box-sizing: border-box;
          /* border: 0.5px solid red; REMOVED DEBUG */
          transition: gap 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v2c-container.state-recording,
        .v2c-container.state-processing,
        .v2c-container.state-combo { gap: 10px; }

        .v2c-timer-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center; /* Center content for clear button */
          height: 40px; /* Match container height - was 38px */
          opacity: 1; 
          overflow: hidden;
          /* border: 0.5px solid blue; REMOVED DEBUG */
          /* Transition for width changes */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        /* Hide by default in idle */
        .v2c-container.state-idle .v2c-timer-wrapper {
          opacity: 0;
          width: 0;
        }

        /* Content inside timer wrapper: Crossfade logic */
        .v2c-content-timer,
        .v2c-content-clear {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s ease;
          opacity: 0;
          pointer-events: none;
        }
        
        .v2c-content-timer.visible { opacity: 1; pointer-events: auto; }
        .v2c-content-clear.visible { opacity: 1; pointer-events: auto; }
        
        /* Clear button specific to ensure it centers nicely */
        .v2c-content-clear {
          width: 38px;
          height: 38px;
        }

        .v2c-button-tracker {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          /* border: 0.5px solid green; REMOVED DEBUG */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v2c-container.state-recording .v2c-button-tracker,
        .v2c-container.state-processing .v2c-button-tracker { width: 74px; }
        /* In Combo, it shrinks back to 40px (Idle size) */

        .v2c-morph-border {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          cursor: pointer;
          width: 38px;
          height: 38px;
          border: 1.13px solid var(--VoiceDarkGrey_20);
          border-radius: 19px;
          background: transparent;
          /* outline: 0.5px solid orange; REMOVED DEBUG */
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v2c-morph-border.state-recording,
        .v2c-morph-border.state-processing {
          width: 72px;
          height: 34px;
          border-radius: 24px;
          padding: 4px;
        }
        /* In Combo, it reverts to 38px circle (default styles) */

        /* Mic Icon */
        .v2c-mic-icon {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .v2c-mic-icon.visible { opacity: 1; }

        /* Check/Close content */
        .v2c-checkclose-content {
          position: absolute;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          width: 64px;
          height: 26px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .v2c-checkclose-content.visible { 
          opacity: 1; 
          pointer-events: auto;
        }

        .v2c-check-div {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px 6px 0px 8px;
          width: 32px;
          height: 26px;
          background: transparent;
          border-radius: 40px 0px 0px 40px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-radius 0.2s ease;
        }
        .v2c-check-div:hover { 
          background: var(--VoiceDarkGrey_5); 
          border-radius: 40px 2px 2px 40px;
        }

        .v2c-divider {
          width: 1px;
          height: 18px;
          display: flex;
          align-items: center;
          transition: opacity 0.2s ease;
        }
        .v2c-check-div:hover ~ .v2c-divider,
        .v2c-close-div:hover ~ .v2c-divider,
        .v2c-checkclose-content:hover .v2c-divider { opacity: 0; }

        .v2c-close-div {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px 8px 0px 6px;
          width: 32px;
          height: 26px;
          background: transparent;
          border-radius: 0px 40px 40px 0px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-radius 0.2s ease;
        }
        .v2c-close-div:hover { 
          background: var(--VoiceDarkGrey_5); 
          border-radius: 2px 40px 40px 2px;
        }

        /* Spinner content */
        .v2c-spinner-content {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 64px;
          height: 26px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .v2c-spinner-content.visible { 
          opacity: 1; 
        }

        .v2c-spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 20px;
          height: 20px;
        }

        .v2c-spinner {
          width: 20px;
          height: 20px;
          transform-origin: center center;
        }

        .v2c-morph-border.state-processing .v2c-spinner {
          animation: spin-v2c 1.5s linear infinite;
        }
      `}</style>
    </>
  );
};


/* ============================================
   MORPHING RECORD WIDE TO STOP

   Pattern: Center expansion with content crossfade
   - RecordWideButton (76×44px) morphs to StopRecordButton (112×46px)
   - Width expands FROM CENTER (36px increase = 18px each side)
   - Height increases 2px (1px each side)
   - Content crossfades: large mic icon → (stop icon + live timer MM:SS)

   Architecture: Simple wrapper + single button (no trackers needed)
   ============================================ */

export type RecordWideStopState = 'idle' | 'recording';

interface MorphingRecordWideToStopProps {
  state: RecordWideStopState;
  onRecordClick?: () => void;
  onStopClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const MorphingRecordWideToStop: React.FC<MorphingRecordWideToStopProps> = ({
  state,
  onRecordClick,
  onStopClick,
  className = '',
  disabled = false
}) => {
  const handleClick = () => {
    if (disabled) return;
    if (state === 'idle') {
      onRecordClick?.();
    } else {
      onStopClick?.();
    }
  };

  return (
    <>
      {/* Wrapper - centers the button */}
      <div className={`rws-wrapper state-${state} ${className} ${styles.container}`}>
        <button
          className={`rws-button state-${state}`}
          onClick={handleClick}
          disabled={disabled}
          aria-label={state === 'idle' ? 'Start Recording' : 'Stop Recording'}
        >
          {/* Content container for crossfade */}
          <div className="rws-content">
            {/* IDLE: Large Mic Icon (26×26) */}
            <div className="rws-mic-icon">
              <svg
                width="26"
                height="26"
                viewBox="0 0 26 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.40583 6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452Z"
                  fill="white"
                />
                <path
                  d="M19.9282 13.3002C19.3867 16.6398 16.4897 19.1896 12.9971 19.1896C9.50541 19.1896 6.60896 16.6411 6.06641 13.3027M12.9965 22.75V19.3733M15.0926 22.75H10.9399M13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* RECORDING: Stop Icon + Timer */}
            <div className="rws-stop-content">
              {/* Stop Square Icon */}
              <div className="rws-stop-square">
                <div className="rws-stop-icon"></div>
              </div>

              {/* Live Timer (MM:SS) */}
              <VoiceLiveTimer isRunning={state === 'recording'} />
            </div>
          </div>
        </button>
      </div>

      <style jsx>{`
        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .rws-wrapper, .rws-wrapper * { transition: none !important; }
        }

        /* Wrapper - centers the button */
        .rws-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          
          /* Matches largest state */
          width: 112px;
          height: 46px;
          
          /* Debug */
          /* border: 0.5px solid red; REMOVED DEBUG */
        }

        /* The morphing button */
        .rws-button {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          cursor: pointer;
          
          /* IDLE: RecordWideButton style */
          width: 76px;
          height: 44px;
          padding: 0px 25px;
          background: var(--VoiceDarkGrey_95);
          border-radius: 23.16px;
          
          /* Morph transitions */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      padding 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      border-radius 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Debug */
          /* outline: 0.5px solid orange; REMOVED DEBUG */
        }

        /* RECORDING: StopRecordButton style */
        .rws-button.state-recording {
          width: 112px;
          height: 46px;
          padding: 10px 16px;
          border-radius: 24px;
        }

        .rws-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Content container - absolute positioned for center-locking (immune to padding changes) */
        .rws-content {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          justify-content: center;
          align-items: center;
          width: 80px;  /* Fits stop + timer */
          height: 26px;
        }

        /* Mic Icon - visible in idle */
        .rws-mic-icon {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 26px;
          height: 26px;
          opacity: 1;
          transition: opacity 0.2s ease;
        }
        .rws-button.state-recording .rws-mic-icon {
          opacity: 0;
          pointer-events: none;
        }

        /* Stop + Timer - visible in recording */
        .rws-stop-content {
          position: absolute;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 9px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .rws-button.state-recording .rws-stop-content {
          opacity: 1;
          pointer-events: auto;
        }

        /* Stop square icon */
        .rws-stop-square {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 18px;
          height: 18px;
        }

        .rws-stop-icon {
          width: 8.73px;
          height: 8.73px;
          background: var(--VoiceRed);
          border-radius: 2px;
        }
      `}</style>
    </>
  );
};

/* ============================================
   MORPHING RECORD WIDE STOP DOCK

   Pattern: 3-state morphing with center expansion and side fade
   - Idle: RecordWideButton (76×44px) centered
   - Recording: StopRecordButton (112×46px) centered with timer
   - Complete: VoiceDockCenter = CopyButton + RecordWideButton + ClearButton

   Animation:
   - Recording → Complete: Side buttons FADE IN at fixed positions, StopRecord shrinks to RecordWide
   - Complete → Recording: Side buttons FADE OUT + get pushed outward as center grows
   - Complete → Idle (click Clear): Everything fades, leaves just RecordWide

   Architecture: Fixed-width container, absolutely positioned side buttons, center button morphs
   ============================================ */

export type RecordWideStopDockState = 'idle' | 'recording' | 'complete';

interface MorphingRecordWideStopDockProps {
  state: RecordWideStopDockState;
  onRecordClick?: () => void;
  onStopClick?: () => void;
  onCopyClick?: () => void;
  onClearClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const MorphingRecordWideStopDock: React.FC<MorphingRecordWideStopDockProps> = ({
  state,
  onRecordClick,
  onStopClick,
  onCopyClick,
  onClearClick,
  className = '',
  disabled = false
}) => {
  // Dimensions
  // VoiceDockCenter: 38 (copy) + 6 (gap) + 76 (record) + 6 (gap) + 38 (clear) = 164px × 46px
  const containerWidth = 164;
  const containerHeight = 46;

  const handleCenterClick = () => {
    if (disabled) return;
    if (state === 'idle' || state === 'complete') {
      onRecordClick?.();
    } else {
      onStopClick?.();
    }
  };

  return (
    <>
      <div className={`rwsd-container state-${state} ${className} ${styles.container}`}>
        {/* Left side button - CopyButton */}
        <div className="rwsd-left-button">
          <CopyButton onClick={onCopyClick} disabled={disabled} />
        </div>

        {/* Center morphing button */}
        <div className="rwsd-center-wrapper">
          <button
            className={`rwsd-center-button state-${state}`}
            onClick={handleCenterClick}
            disabled={disabled}
            aria-label={
              state === 'idle' ? 'Start Recording' :
                state === 'recording' ? 'Stop Recording' : 'Start New Recording'
            }
          >
            {/* Content container - absolutely centered */}
            <div className="rwsd-content">
              {/* Mic Icon - visible in idle and complete */}
              <div className="rwsd-mic-icon">
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.40583 6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452Z" fill="white" />
                  <path d="M19.9282 13.3002C19.3867 16.6398 16.4897 19.1896 12.9971 19.1896C9.50541 19.1896 6.60896 16.6411 6.06641 13.3027M12.9965 22.75V19.3733M15.0926 22.75H10.9399M13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08Z" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Stop Icon + Timer - visible in recording */}
              <div className="rwsd-stop-content">
                <div className="rwsd-stop-square">
                  <div className="rwsd-stop-icon"></div>
                </div>
                <VoiceLiveTimer isRunning={state === 'recording'} />
              </div>
            </div>
          </button>
        </div>

        {/* Right side button - ClearButton */}
        <div className="rwsd-right-button">
          <ClearButton onClick={onClearClick} disabled={disabled} />
        </div>
      </div>

      <style jsx>{`
        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .rwsd-container, .rwsd-container * { transition: none !important; }
        }

        /* Main container - fixed width to accommodate all states */
        .rwsd-container {
          position: relative;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: ${containerWidth}px;
          height: ${containerHeight}px;
          
          /* Debug */
          /* border: 0.5px solid red; REMOVED DEBUG */
        }

        /* Side buttons - fade in/out based on state */
        .rwsd-left-button,
        .rwsd-right-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }

        /* Side buttons visible in complete state */
        .rwsd-container.state-complete .rwsd-left-button,
        .rwsd-container.state-complete .rwsd-right-button {
          opacity: 1;
          pointer-events: auto;
        }

        /* Center wrapper - flexes to take remaining space */
        .rwsd-center-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          height: ${containerHeight}px;
          
          /* Debug */

        }

        /* Center morphing button */
        .rwsd-center-button {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          cursor: pointer;
          background: var(--VoiceDarkGrey_95);
          
          /* IDLE/COMPLETE: RecordWideButton style */
          width: 76px;
          height: 44px;
          border-radius: 23.16px;
          
          /* Morph transitions */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      border-radius 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Debug */
          /* outline: 0.5px solid orange; REMOVED DEBUG */
        }

        /* RECORDING: StopRecordButton style */
        .rwsd-center-button.state-recording {
          width: 112px;
          height: 46px;
          border-radius: 24px;
        }

        .rwsd-center-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Content - absolutely centered (immune to layout changes) */
        .rwsd-content {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          justify-content: center;
          align-items: center;
          width: 80px;
          height: 26px;
        }

        /* Mic Icon - visible in idle and complete */
        .rwsd-mic-icon {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 26px;
          height: 26px;
          opacity: 1;
          transition: opacity 0.2s ease;
        }
        .rwsd-center-button.state-recording .rwsd-mic-icon {
          opacity: 0;
          pointer-events: none;
        }

        /* Stop + Timer - visible in recording */
        .rwsd-stop-content {
          position: absolute;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 9px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .rwsd-center-button.state-recording .rwsd-stop-content {
          opacity: 1;
          pointer-events: auto;
        }

        /* Stop square icon */
        .rwsd-stop-square {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 18px;
          height: 18px;
        }

        .rwsd-stop-icon {
          width: 8.73px;
          height: 8.73px;
          background: var(--VoiceRed);
          border-radius: 2px;
        }
      `}</style>
    </>
  );
};

/* ============================================
   MORPHING RECORD DARK TO PILL WAVE
   
   Duplicate of MorphingRecordToPillWave but using RecordButtonDark style (Dark bg + White icon)
   for the Idle state.
   ============================================ */

export const MorphingRecordDarkToPillWave: React.FC<MorphingRecordToPillWaveProps> = ({
  state,
  onRecordClick,
  onStopRecordingClick,
  className = '',
  disabled = false
}) => {
  // Timer width is controlled by VoiceLiveTimerSeconds via callback
  const [timerWidth, setTimerWidth] = useState(38); // Default to smallest width

  const containerWidth = state === 'recording' ? timerWidth + 10 + 64 : 38; // timer + gap + button : idle

  const handleClick = () => {
    if (disabled) return;
    if (state === 'idle') {
      onRecordClick?.();
    } else {
      onStopRecordingClick?.();
    }
  };

  return (
    <>
      <div
        className={`v1d-container state-${state} ${className} ${styles.container}`}
        style={{ width: `${containerWidth}px` }}
      >
        {/* Timer Text - Fades in during recording state */}
        <div
          className="v1d-timer-wrapper"
          style={{ width: state === 'recording' ? `${timerWidth}px` : '0px' }}
        >
          <VoiceLiveTimerSeconds
            isRunning={state === 'recording'}
            onWidthChange={setTimerWidth}
          />
        </div>

        {/* Button-width-tracker - Reports button width to parent flexbox */}
        <div className="v1d-width-tracker">
          <button
            className={`v1d-morph-button state-${state}`}
            onClick={handleClick}
            disabled={disabled}
            aria-label={state === 'idle' ? 'Record' : 'Stop Recording'}
          >
            {/* Content container for icon crossfade */}
            <div className="v1d-content">
              {/* Mic Icon - visible in idle state - WHITE ICON */}
              <div className="v1d-mic">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.3971 12.2769C17.8972 15.3597 15.223 17.7133 11.9991 17.7133C8.77602 17.7133 6.10239 15.3609 5.60156 12.2793M11.9986 20.9999V17.8829M13.9334 20.9999H10.1002M12.0021 13.9198C10.1696 13.9198 8.68411 12.4343 8.68411 10.6018V6.31787C8.68411 4.48539 10.1696 2.99988 12.0021 2.99988C13.8346 2.99988 15.3201 4.48539 15.3201 6.31786V10.6018C15.3201 12.4343 13.8346 13.9198 12.0021 13.9198Z"
                    stroke="#FFFFFF"
                    strokeOpacity="1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Wave Visual - visible in recording state */}
              <div className="v1d-wave">
                <VoiceLiveWaveform active={state === 'recording'} />
              </div>
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        /* ========================================
           ACCESSIBILITY
           ======================================== */

        @media (prefers-reduced-motion: reduce) {
          .v1d-container,
          .v1d-container * {
            transition: none !important;
          }
        }

        /* ========================================
           CONTAINER
           ======================================== */

        .v1d-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          padding: 0px;
          box-sizing: border-box;
          gap: 0px;
          height: 38px; 
          
          /* No debug border */

          transition: gap 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .v1d-container.state-recording {
          gap: 10px;
          height: 38px;
        }

        /* ========================================
           TIMER TEXT WRAPPER
           ======================================== */

        .v1d-timer-wrapper {
          display: flex;
          align-items: center;
          height: 26px;
          box-sizing: border-box;
          opacity: 0;
          pointer-events: none;
          overflow: hidden;
          transition: opacity 0.1s ease,
                      width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .v1d-container.state-recording .v1d-timer-wrapper {
          opacity: 1;
          pointer-events: auto;
        }

        /* ========================================
           BUTTON WIDTH TRACKER
           ======================================== */

        .v1d-width-tracker {
          width: 38px;         /* Idle width */
          height: 38px;
          box-sizing: border-box;
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .v1d-container.state-recording .v1d-width-tracker {
          width: 66px;         /* Recording width */
          height: 36px;
        }

        /* ========================================
           MORPHING BUTTON
           ======================================== */

        .v1d-morph-button {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px;
          cursor: pointer;
          box-sizing: border-box;

          /* IDLE STATE - RecordButtonDark (Dark bg, White icon) */
          width: 38px;
          height: 38px;
          background: var(--VoiceDarkGrey_90); /* DARK BG */
          border-radius: 19px;
          border: none; /* No border for dark button */

          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width, height, background, border-radius;
          overflow: hidden;
        }

        .v1d-morph-button.state-recording {
          width: 64px;
          height: 34px;
          padding: 10px 16px;
          /* Explicitly keep dark background */
          background: var(--VoiceDarkGrey_90);
          border-radius: 20px;
        }
        
        /* ========================================
           CONTENT
           ======================================== */
           
        .v1d-content {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center; /* Vertical Center */
          justify-content: center; /* Horizontal Center */
        }
        
        .v1d-mic {
           position: absolute;
           top: 0;
           left: 0;
           width: 100%;
           height: 100%;
           display: flex;
           align-items: center;
           justify-content: center;
           opacity: 1;
           transition: opacity 0.15s ease;
        }
        .v1d-morph-button.state-recording .v1d-mic {
           opacity: 0;
           pointer-events: none;
        }
        
        .v1d-wave {
           position: absolute;
           width: 100%;
           height: 100%;
           opacity: 0;
           transition: opacity 0.15s ease;
           display: flex;
           align-items: center;
           justify-content: center;
        }
        .v1d-morph-button.state-recording .v1d-wave {
           opacity: 1;
        }

      `}</style>
    </>
  );
};

/* ============================================
   MORPHING RECORD DARK TO PILL WAVE PROCESSING
   ============================================ */

export type RecordPillWaveProcessingState = 'idle' | 'recording' | 'processing';

interface MorphingRecordDarkToPillWaveProcessingProps {
  state: RecordPillWaveProcessingState;
  onRecordClick?: () => void;
  onStopRecordingClick?: () => void; // Used to trigger processing usually
  onProcessingComplete?: () => void;
  className?: string;
  disabled?: boolean;
}

export const MorphingRecordDarkToPillWaveProcessing: React.FC<MorphingRecordDarkToPillWaveProcessingProps> = ({
  state,
  onRecordClick,
  onStopRecordingClick,
  onProcessingComplete,
  className = '',
  disabled = false
}) => {
  // Timer width is controlled by VoiceLiveTimerSeconds via callback
  const [timerWidth, setTimerWidth] = useState(38);
  const [shouldResetTimer, setShouldResetTimer] = useState(true);
  const [timerSessionKey, setTimerSessionKey] = useState(0);

  // Auto-revert timer for processing state
  React.useEffect(() => {
    if (state === 'processing') {
      const timer = setTimeout(() => {
        onProcessingComplete?.();
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [state, onProcessingComplete]);

  // Handle delayed timer reset to prevent visual glitching during transition
  React.useEffect(() => {
    if (state === 'idle') {
      const timer = setTimeout(() => {
        setShouldResetTimer(true);
      }, 500); // Wait for transition to finish before resetting
      return () => clearTimeout(timer);
    } else {
      setShouldResetTimer(false);
    }
  }, [state]);

  // Container width
  // Idle: 40
  // Recording or Processing: timer + 10 + 64 (Timer stays visible during processing?)
  // User said "similar to confirm to processing". In ConfirmProcessing, timer stays.
  const isExpanded = state === 'recording' || state === 'processing';
  const containerWidth = isExpanded ? timerWidth + 10 + 64 : 38;

  const handleClick = () => {
    if (disabled) return;
    if (state === 'idle') {
      setTimerSessionKey(prev => prev + 1); // Force fresh timer instance
      onRecordClick?.();
    } else if (state === 'recording') {
      onStopRecordingClick?.();
    }
  };

  return (
    <>
      <div
        className={`vdp-container state-${state} ${className} ${styles.container}`}
        style={{ width: `${containerWidth}px` }}
      >
        {/* Timer Text - Fades in during recording/processing state */}
        <div
          className="vdp-timer-wrapper"
          style={{ width: isExpanded ? `${timerWidth}px` : '0px' }}
        >
          <VoiceLiveTimerSeconds
            key={timerSessionKey}
            isRunning={state === 'recording'}
            onWidthChange={setTimerWidth}
            shouldReset={shouldResetTimer}
          />
        </div>

        {/* Button-width-tracker */}
        <div className="vdp-width-tracker">
          <button
            className={`vdp-morph-button state-${state}`}
            onClick={handleClick}
            disabled={disabled}
            aria-label={state === 'idle' ? 'Record' : state === 'recording' ? 'Stop Recording' : 'Processing'}
          >
            {/* Content container for icon crossfade */}
            <div className="vdp-content">
              {/* Mic Icon - visible in idle state - WHITE ICON */}
              <div className="vdp-mic">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.3971 12.2769C17.8972 15.3597 15.223 17.7133 11.9991 17.7133C8.77602 17.7133 6.10239 15.3609 5.60156 12.2793M11.9986 20.9999V17.8829M13.9334 20.9999H10.1002M12.0021 13.9198C10.1696 13.9198 8.68411 12.4343 8.68411 10.6018V6.31787C8.68411 4.48539 10.1696 2.99988 12.0021 2.99988C13.8346 2.99988 15.3201 4.48539 15.3201 6.31786V10.6018C15.3201 12.4343 13.8346 13.9198 12.0021 13.9198Z"
                    stroke="#FFFFFF"
                    strokeOpacity="1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Waveform - visible only in recording */}
              <div className="vdp-wave">
                <VoiceLiveWaveform active={state === 'recording'} />
              </div>

              {/* Processing Spinner - visible only in processing */}
              <div className="vdp-spinner-wrapper">
                <div className="vdp-spinner-container">
                  <svg
                    className="vdp-spinner"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10 15.5V18.5" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M4.5 10L1.5 10" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M10 1.5V4.5" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M18.5 10L15.5 10" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M6.11 13.89L3.99 16.01" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M6.11 6.11L3.99 3.99" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M16.01 3.99L13.89 6.11" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                    <path d="M16.01 16.01L13.89 13.89" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        /* Reuse similar styles to v1d but with processing additions */
        
        .vdp-container {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0px;
          height: 38px; /* From v1d */
          /* No debug border */
          transition: gap 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .vdp-container.state-recording,
        .vdp-container.state-processing {
          gap: 10px;
          height: 38px;
        }

        .vdp-timer-wrapper {
          display: flex;
          align-items: center;
          height: 26px;
          box-sizing: border-box;
          opacity: 0;
          pointer-events: none;
          overflow: hidden;
          transition: opacity 0.1s ease,
                      width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .vdp-container.state-recording .vdp-timer-wrapper,
        .vdp-container.state-processing .vdp-timer-wrapper {
          opacity: 1;
          pointer-events: auto;
        }

        .vdp-width-tracker {
          width: 38px;
          height: 38px;
          box-sizing: border-box;
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .vdp-container.state-recording .vdp-width-tracker,
        .vdp-container.state-processing .vdp-width-tracker {
          width: 66px;         /* Recording/Process width */
          height: 36px;
        }

        .vdp-morph-button {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px;
          cursor: pointer;
          box-sizing: border-box;
          
          width: 38px;
          height: 38px;
          background: var(--VoiceDarkGrey_90);
          border-radius: 19px;
          border: none;

          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width, height, background, border-radius;
          overflow: hidden;
        }

        .vdp-morph-button.state-recording,
        .vdp-morph-button.state-processing {
          width: 64px;
          height: 34px;
          padding: 10px 16px;
          background: var(--VoiceDarkGrey_90);
          border-radius: 20px;
        }

        .vdp-content {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vdp-mic {
           position: absolute;
           top: 0;
           left: 0;
           width: 100%;
           height: 100%;
           display: flex;
           align-items: center;
           justify-content: center;
           opacity: 1;
           transition: opacity 0.15s ease;
        }
        .vdp-morph-button.state-recording .vdp-mic,
        .vdp-morph-button.state-processing .vdp-mic {
           opacity: 0;
        }

        .vdp-wave {
           position: absolute;
           top: 0;
           left: 0;
           width: 100%;
           height: 100%;
           display: flex;
           align-items: center;
           justify-content: center;
           opacity: 0;
           transition: opacity 0.15s ease;
        }
        .vdp-morph-button.state-recording .vdp-wave {
           opacity: 1;
        }
        .vdp-morph-button.state-processing .vdp-wave {
           opacity: 0;
        }

        .vdp-spinner-wrapper {
           position: absolute;
           top: 0;
           left: 0;
           width: 100%;
           height: 100%;
           display: flex;
           align-items: center;
           justify-content: center;
           opacity: 0;
           transition: opacity 0.15s ease;
        }
        .vdp-morph-button.state-processing .vdp-spinner-wrapper {
           opacity: 1;
        }

        .vdp-spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 20px;
          height: 20px;
        }
        .vdp-spinner {
          width: 20px;
          height: 20px;
          transform-origin: center center;
          animation: rotate-vdp 1.5s linear infinite;
        }
        
        @keyframes rotate-vdp {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};
