import React, { useState, useEffect, useRef } from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/* ============================================
   VOICE LIVE TIMER
   Real-time Recording Timer for Voice Interface

   FEATURES:
   - Counts up from 00:00 when recording starts
   - Freezes at current time when done/processing
   - Resets when stopped
   - Formats time as MM:SS (00:01, 00:26, 01:05, etc.)
   - Fixed-width container to prevent layout shift

   USAGE:
   <VoiceLiveTimer
     isRunning={isRecording}
     isFrozen={isProcessing}
   />

   ============================================ */

interface VoiceLiveTimerProps {
  /** Controls if timer is actively counting */
  isRunning: boolean;
  /** Freezes display at current time (stops counting but preserves display) */
  isFrozen?: boolean;
  /** Optional callback when time updates (receives total seconds) */
  onTimeUpdate?: (seconds: number) => void;
  /** Additional CSS classes */
  className?: string;
}

export const VoiceLiveTimer: React.FC<VoiceLiveTimerProps> = ({
  isRunning,
  isFrozen = false,
  onTimeUpdate,
  className = ''
}) => {
  // State
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasRunningRef = useRef(false);

  // Format seconds to MM:SS display
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const minsStr = mins.toString().padStart(2, '0');
    const secsStr = secs.toString().padStart(2, '0');
    return `${minsStr}:${secsStr}`;
  };

  /* ============================================
     TIMER LOGIC
     ============================================ */
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // DETECT NEW RECORDING START - Reset to 0 when starting fresh
    if (isRunning && !wasRunningRef.current) {
      setSeconds(0);
    }

    // Track running state for next render
    wasRunningRef.current = isRunning;

    // START TIMER - When recording and not frozen
    if (isRunning && !isFrozen) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1;
          // Call optional callback
          if (onTimeUpdate) {
            onTimeUpdate(newSeconds);
          }
          return newSeconds;
        });
      }, 1000); // Update every second
    }

    // FROZEN or STOPPED - Keep current time displayed
    // Timer only resets when isRunning transitions from false→true (new recording)

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isFrozen, onTimeUpdate]);

  /* ============================================
     RENDER
     ============================================ */
  return (
    <>
      <div className={`timer-wrapper ${className} ${styles.container}`}>
        <span className={`timer-text ${styles.OpenRundeMedium18}`}>
          {formatTime(seconds)}
        </span>
      </div>

      <style jsx>{`
        .timer-wrapper {
          /* Auto layout - follows ClipperStream pattern */
          display: flex;
          align-items: center;
          padding: 0px;

          /* Auto width with min-width to prevent collapse */
          min-width: 51px;
          width: auto;
          height: 26px;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;

        }

        .timer-text {
          min-width: 51px;
          width: auto;
          height: 26px;

          /* LEFT-ALIGNED to prevent shifting */
          text-align: left;
          color: var(--VoiceWhite);
          white-space: nowrap;

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   DEFAULT EXPORT
   ============================================ */
export default VoiceLiveTimer;
