import React from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';
import {
  RecordButton,
  RecordingWaveButton,
  ProcessingButtonDark,
  ClearButton
} from './voicebuttons';
import { VoiceLiveTimerSeconds } from './VoiceLiveTimerSeconds';

/* ============================================
   MORPHING RECORD TO PILL WAVE

   PATTERN: Container naturally expands as contents morph (ClipStream pattern)
   - RecordButton (38×38px) fades out
   - Timer + RecordingWaveButton (114×34px pill) fade in
   - Button expands from left to right (right-aligned)

   Animation sequence:
   - RecordButton fades out (0.1s)
   - Container expands to fit pill (0.2s)
   - Timer + RecordingWaveButton fade in (0.15s, delayed 0.05s)

   Based on: MorphingTimerProcessingToStructure from clipmorphingbuttons.tsx
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
  return (
    <>
      <div className={`record-pill-container state-${state} ${className} ${styles.container}`}>
        {/* Record Button Layer - Fades out in recording state */}
        <div className="record-button-wrapper">
          <div onClick={state === 'idle' ? onRecordClick : undefined}>
            <RecordButton disabled={disabled} />
          </div>
        </div>

        {/* Pill Wave Layer - Fades in in recording state */}
        <div className="pill-wave-wrapper">
          {/* Timer Text - Fades in with pill */}
          <div className="timer-wrapper">
            <VoiceLiveTimerSeconds isRunning={state === 'recording'} />
          </div>

          {/* Recording Wave Button */}
          <div className="wave-button-wrapper" onClick={state === 'recording' ? onStopRecordingClick : undefined}>
            <RecordingWaveButton
              isRecording={state === 'recording'}
              disabled={disabled}
            />
          </div>
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
           CONTAINER - Naturally expands with content
           ======================================== */

        .record-pill-container {
          /* Layout - Flex row */
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;  /* CRITICAL: Right-align so button stays on right */
          padding: 0px;
          gap: 10px;

          /* IDLE STATE: Small (38px for RecordButton) */
          width: 38px;
          height: 38px;

          /* Smooth expansion */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        /* RECORDING STATE: Expands to fit pill (114×34px) */
        .record-pill-container.state-recording {
          width: 114px;
          height: 34px;
        }

        /* ========================================
           RECORD BUTTON WRAPPER - Fades out
           ======================================== */

        .record-button-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);

          /* Visible in idle state */
          opacity: 1;
          pointer-events: auto;

          /* Fast fade out when recording starts */
          transition: opacity 0.1s ease;
        }

        /* Hidden in recording state */
        .record-pill-container.state-recording .record-button-wrapper {
          opacity: 0;
          pointer-events: none;
        }

        /* ========================================
           PILL WAVE WRAPPER - Fades in
           ======================================== */

        .pill-wave-wrapper {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;

          /* Hidden in idle state */
          opacity: 0;
          pointer-events: none;

          /* Fade in with slight delay */
          transition: opacity 0.15s ease 0.05s;
        }

        /* Visible in recording state */
        .record-pill-container.state-recording .pill-wave-wrapper {
          opacity: 1;
          pointer-events: auto;
        }

        .timer-wrapper {
          flex: none;
          order: 0;
        }

        .wave-button-wrapper {
          flex: none;
          order: 1;
          cursor: pointer;
        }
      `}</style>
    </>
  );
};
