import React from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';
import { VoiceLiveTimerSeconds } from './VoiceLiveTimerSeconds';
import { VoiceLiveWaveform } from './VoiceLiveWaveform';

/* ============================================
   MORPHING RECORD TO PILL WAVE

   Pattern: Fixed container with timer + morphing button
   - RecordButton (38×38px) morphs to RecordingWaveButton (64×34px)
   - Timer (42px) fades in/out
   - Container fixed at 114px with justify-content: flex-end
   - Timer is pushed into view by flexbox as button expands

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
      <div className={`record-pill-container state-${state} ${className} ${styles.container}`}>
        {/* Timer Text - Fades in during recording state */}
        <div className="timer-text-wrapper">
          <VoiceLiveTimerSeconds isRunning={state === 'recording'} />
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
          gap: 10px;

          /* Fixed width - Timer (42px) + gap (10px) + Button (64px) = 116px */
          width: 114px;
          height: 38px;
        }

        /* ========================================
           TIMER TEXT WRAPPER - Fades in during recording
           ======================================== */

        .timer-text-wrapper {
          /* Layout */
          display: flex;
          align-items: center;
          width: 42px;       /* Fixed width for timer */
          height: 34px;

          /* Hidden in idle state */
          opacity: 0;
          pointer-events: none;

          /* Fade timing - Half the button morph duration */
          transition: opacity 0.1s ease;
        }

        /* Timer visible in recording state */
        .record-pill-container.state-recording .timer-text-wrapper {
          opacity: 1;
          pointer-events: auto;
        }

        /* ========================================
           BUTTON WIDTH TRACKER - Reports button width to parent flexbox
           ======================================== */

        .button-width-tracker {
          /* Tracks button's morphing width */
          width: 38px;         /* Idle width - matches RecordButton */
          height: 38px;
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;    /* CRITICAL: Clips content during morph */
          display: flex;
          align-items: center;
          justify-content: flex-end;  /* Keep button right-aligned */
        }

        /* Expand tracker to match recording button size */
        .record-pill-container.state-recording .button-width-tracker {
          width: 64px;         /* Recording width - matches RecordingWaveButton */
          height: 34px;
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
          border: none;
          cursor: pointer;

          /* IDLE STATE - RecordButton (circle) */
          width: 38px;
          height: 38px;
          background: var(--RecWhite);
          border-radius: 19px;

          /* Morphing animation */
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width, height, background, border-radius;
          overflow: hidden;
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
