import React from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';
import { VoiceLiveTimerSeconds } from './VoiceLiveTimerSeconds';

/* ============================================
   MORPHING RECORD TO PILL WAVE

   PATTERN: One button morphs from circle → pill (ClipStream pattern)
   - Record button (38×38px circle) MORPHS into pill (114×34px)
   - Record icon fades out as timer + wave button fade in
   - Button morphs all properties: width, height, background, border-radius
   - Expands from right to left using justify-content: flex-end

   Based on: MorphingProcessingToStructureButton from clipmorphingbuttons.tsx
   ============================================ */

interface MorphingRecordToPillWaveProps {
  state: 'idle' | 'recording';
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
      <div className={`button-container ${className} ${styles.container}`}>
        <button
          className={`morphing-record-pill-button state-${state}`}
          onClick={handleClick}
          disabled={disabled}
        >
          {/* Content container for icon crossfade */}
          <div className="content-container">
            {/* Record Icon - visible in idle state */}
            <div className="record-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="6" fill="#FF0000"/>
              </svg>
            </div>

            {/* Pill Wave Content - visible in recording state */}
            <div className="pill-wave-content">
              <div className="timer-text">
                <VoiceLiveTimerSeconds isRunning={state === 'recording'} />
              </div>
              <div className="wave-visual">
                {/* Recording wave animation */}
                <svg width="64" height="34" viewBox="0 0 64 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="12" width="3" height="10" rx="1.5" fill="white" className="wave-bar bar-1"/>
                  <rect x="12" y="8" width="3" height="18" rx="1.5" fill="white" className="wave-bar bar-2"/>
                  <rect x="18" y="10" width="3" height="14" rx="1.5" fill="white" className="wave-bar bar-3"/>
                  <rect x="24" y="6" width="3" height="22" rx="1.5" fill="white" className="wave-bar bar-4"/>
                  <rect x="30" y="11" width="3" height="12" rx="1.5" fill="white" className="wave-bar bar-5"/>
                  <rect x="36" y="9" width="3" height="16" rx="1.5" fill="white" className="wave-bar bar-6"/>
                  <rect x="42" y="7" width="3" height="20" rx="1.5" fill="white" className="wave-bar bar-7"/>
                  <rect x="48" y="13" width="3" height="8" rx="1.5" fill="white" className="wave-bar bar-8"/>
                </svg>
              </div>
            </div>
          </div>
        </button>
      </div>

      <style jsx>{`
        /* ========================================
           ACCESSIBILITY
           ======================================== */

        @media (prefers-reduced-motion: reduce) {
          .button-container,
          .button-container * {
            transition: none !important;
            animation: none !important;
          }
        }

        /* ========================================
           FIXED CONTAINER - Prevents layout shift
           ======================================== */

        .button-container {
          position: relative;
          width: 114px;       /* FIXED: Largest state (recording pill) */
          height: 38px;       /* FIXED: Largest height (idle circle) */
          display: flex;
          align-items: center;
          justify-content: flex-end;  /* CRITICAL: Right-align for left-to-right expansion */
        }

        /* ========================================
           THE MORPHING BUTTON - One element morphs all properties
           ======================================== */

        .morphing-record-pill-button {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          border: none;
          cursor: pointer;

          /* IDLE STATE - Record button (circle) */
          width: 38px;
          height: 38px;
          background: var(--RecWhite);
          border-radius: 19px;  /* Perfect circle */

          /* Morphing animation - all properties transition together */
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width, height, background, border-radius;
          overflow: hidden;  /* CRITICAL: Hide content overflow during morph */
        }

        /* RECORDING STATE - Pill wave (rounded rectangle) */
        .morphing-record-pill-button.state-recording {
          width: 114px;
          height: 34px;
          background: var(--RecDarkGrey);
          border-radius: 17px;  /* Pill shape */
        }

        /* Disabled state */
        .morphing-record-pill-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ========================================
           CONTENT CONTAINER - Icons crossfade within button
           ======================================== */

        .content-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* ========================================
           RECORD ICON - Visible in idle state
           ======================================== */

        .record-icon {
          position: absolute;
          width: 20px;
          height: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 1;
          transition: opacity 0.2s ease;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        /* Hide record icon in recording state */
        .morphing-record-pill-button.state-recording .record-icon {
          opacity: 0;
        }

        /* ========================================
           PILL WAVE CONTENT - Visible in recording state
           ======================================== */

        .pill-wave-content {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 12px;
          opacity: 0;
          transition: opacity 0.2s ease;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        /* Show pill wave content in recording state */
        .morphing-record-pill-button.state-recording .pill-wave-content {
          opacity: 1;
        }

        .timer-text {
          flex: none;
          order: 0;
          white-space: nowrap;
        }

        .wave-visual {
          flex: none;
          order: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ========================================
           WAVE ANIMATION - Bars animate when recording
           ======================================== */

        .wave-bar {
          transform-origin: center bottom;
        }

        .morphing-record-pill-button.state-recording .wave-bar {
          animation: wave-pulse 1.2s ease-in-out infinite;
        }

        .morphing-record-pill-button.state-recording .bar-1 {
          animation-delay: 0s;
        }

        .morphing-record-pill-button.state-recording .bar-2 {
          animation-delay: 0.1s;
        }

        .morphing-record-pill-button.state-recording .bar-3 {
          animation-delay: 0.2s;
        }

        .morphing-record-pill-button.state-recording .bar-4 {
          animation-delay: 0.3s;
        }

        .morphing-record-pill-button.state-recording .bar-5 {
          animation-delay: 0.4s;
        }

        .morphing-record-pill-button.state-recording .bar-6 {
          animation-delay: 0.5s;
        }

        .morphing-record-pill-button.state-recording .bar-7 {
          animation-delay: 0.6s;
        }

        .morphing-record-pill-button.state-recording .bar-8 {
          animation-delay: 0.7s;
        }

        @keyframes wave-pulse {
          0%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.6);
          }
        }
      `}</style>
    </>
  );
};
