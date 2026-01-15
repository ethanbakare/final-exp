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
   VOICE MORPHING MAIN BUTTON

   PATTERN: Fixed container + opacity crossfades (ClipStream style)

   States:
   - 'idle': RecordButton (38×38px circle)
   - 'recording': VoicePillWave = Timer + RecordingWaveButton (114×34px pill)
   - 'processing': Timer (static) + ProcessingButtonDark (114×34px pill)
   - 'results': ClearButton (38×38px circle)

   Animation Flow:
   1. idle → recording: Button morphs, timer fades in from left
   2. recording → processing: Timer becomes static, button icon changes
   3. processing → results: Timer fades out, button shrinks and changes icon
   4. Close button (during recording/processing): separate component, not morphed

   ClipStream Timing:
   - Primary transitions: 0.3s (container morphing)
   - Secondary: 0.2s (button content)
   - Tertiary: 0.15s (opacity fades)

   ============================================ */

export type VoiceMainButtonState = 'idle' | 'recording' | 'processing' | 'results';

interface VoiceMorphingMainButtonProps {
  state: VoiceMainButtonState;
  onRecordClick?: () => void;
  onStopRecordingClick?: () => void;
  onClearClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const VoiceMorphingMainButton: React.FC<VoiceMorphingMainButtonProps> = ({
  state,
  onRecordClick,
  onStopRecordingClick,
  onClearClick,
  className = '',
  disabled = false
}) => {

  // ============================================
  // STATE HELPERS
  // ============================================

  const shouldShowTimer = (): boolean => {
    return state === 'recording' || state === 'processing';
  };

  const isTimerRunning = (): boolean => {
    return state === 'recording';
  };

  const handleClick = () => {
    if (disabled) return;

    switch (state) {
      case 'idle':
        onRecordClick?.();
        break;
      case 'recording':
        onStopRecordingClick?.();
        break;
      case 'results':
        onClearClick?.();
        break;
      case 'processing':
        // No-op during processing
        break;
    }
  };

  return (
    <>
      <div className={`morph-container ${className}`}>
        <div className={`morphing-button state-${state}`}>

          {/* ============================================
              IDLE STATE LAYER - RecordButton
              ============================================ */}
          <div
            className="idle-layer button-layer"
            onClick={state === 'idle' ? handleClick : undefined}
            style={{ pointerEvents: state === 'idle' ? 'auto' : 'none' }}
          >
            <RecordButton disabled={disabled} />
          </div>

          {/* ============================================
              RECORDING/PROCESSING STATE LAYER - Pill with Timer
              ============================================ */}
          <div className="pill-layer button-layer">
            {/* Timer on the left */}
            <div
              className="timer-wrapper"
              style={{
                opacity: shouldShowTimer() ? 1 : 0,
                transition: 'opacity 0.15s ease',
                pointerEvents: shouldShowTimer() ? 'auto' : 'none'
              }}
            >
              <VoiceLiveTimerSeconds isRunning={isTimerRunning()} />
            </div>

            {/* Recording Wave Button */}
            <div
              className="recording-button-wrapper"
              onClick={state === 'recording' ? handleClick : undefined}
              style={{ pointerEvents: state === 'recording' ? 'auto' : 'none' }}
            >
              <RecordingWaveButton
                isRecording={state === 'recording'}
                disabled={disabled}
              />
            </div>

            {/* Processing Button (overlays RecordingWaveButton) */}
            <div
              className="processing-button-wrapper"
              style={{ pointerEvents: state === 'processing' ? 'auto' : 'none' }}
            >
              <ProcessingButtonDark />
            </div>
          </div>

          {/* ============================================
              RESULTS STATE LAYER - ClearButton
              ============================================ */}
          <div
            className="results-layer button-layer"
            onClick={state === 'results' ? handleClick : undefined}
            style={{ pointerEvents: state === 'results' ? 'auto' : 'none' }}
          >
            <ClearButton onClick={state === 'results' ? handleClick : undefined} disabled={disabled} />
          </div>

        </div>
      </div>

      <style jsx>{`
        /* ============================================
           ACCESSIBILITY
           ============================================ */

        @media (prefers-reduced-motion: reduce) {
          .morphing-button,
          .morphing-button *,
          .button-layer {
            transition: none !important;
            animation: none !important;
          }
        }

        /* ============================================
           OUTER CONTAINER - Fixed to prevent layout shift
           ============================================ */

        .morph-container {
          position: relative;
          width: 114px;   /* Largest state: VoicePillWave */
          height: 38px;   /* Largest state: RecordButton/ClearButton height */
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* ============================================
           MORPHING BUTTON CONTAINER
           ============================================ */

        .morphing-button {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;

          /* IDLE STATE - RecordButton dimensions (38×38px) */
          width: 38px;
          height: 38px;

          transform-origin: center center;

          /* SMOOTH TRANSITIONS - ClipStream timing */
          transition:
            width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width, height;
          overflow: visible;  /* Allow buttons to render fully */
        }

        /* RECORDING STATE - Expands to pill (114×34px) */
        .morphing-button.state-recording {
          width: 114px;
          height: 34px;
          justify-content: space-between;
          gap: 10px;
        }

        /* PROCESSING STATE - Same dimensions as recording */
        .morphing-button.state-processing {
          width: 114px;
          height: 34px;
          justify-content: space-between;
          gap: 10px;
        }

        /* RESULTS STATE - Shrinks back to button (38×38px) */
        .morphing-button.state-results {
          width: 38px;
          height: 38px;
        }

        /* ============================================
           BUTTON LAYERS - Opacity crossfades
           ============================================ */

        .button-layer {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          backface-visibility: hidden;
        }

        /* ============================================
           IDLE LAYER - RecordButton (38×38px)
           ============================================ */

        .idle-layer {
          width: 38px;
          height: 38px;
        }

        .morphing-button.state-idle .idle-layer {
          opacity: 1;
          pointer-events: auto;
        }

        /* ============================================
           PILL LAYER - Timer + RecordingWaveButton/ProcessingButton
           ============================================ */

        .pill-layer {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          width: 114px;
          height: 34px;
          opacity: 0;
          transform: translate(-50%, -50%);
        }

        .morphing-button.state-recording .pill-layer,
        .morphing-button.state-processing .pill-layer {
          opacity: 1;
          pointer-events: auto;
        }

        .timer-wrapper {
          flex: none;
          order: 0;
        }

        .recording-button-wrapper {
          position: absolute;
          right: 0;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .morphing-button.state-recording .recording-button-wrapper {
          opacity: 1;
        }

        .processing-button-wrapper {
          position: absolute;
          right: 0;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .morphing-button.state-processing .processing-button-wrapper {
          opacity: 1;
        }

        /* ============================================
           RESULTS LAYER - ClearButton (38×38px)
           ============================================ */

        .results-layer {
          width: 38px;
          height: 38px;
        }

        .morphing-button.state-results .results-layer {
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>
    </>
  );
};
