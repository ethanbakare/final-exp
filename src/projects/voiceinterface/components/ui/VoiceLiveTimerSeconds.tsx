import React, { useState, useEffect } from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

interface VoiceLiveTimerSecondsProps {
  isRunning?: boolean;
  onWidthChange?: (width: number) => void; // Optional callback to report width changes
  shouldReset?: boolean; // If false, timer freezes when stopped instead of resetting to 0. Default: true.
}

export const VoiceLiveTimerSeconds: React.FC<VoiceLiveTimerSecondsProps> = ({
  isRunning = true,
  onWidthChange,
  shouldReset = true
}) => {
  const [seconds, setSeconds] = useState(0);

  // Handle reset when shouldReset becomes true (e.g. state changes to 'idle')
  useEffect(() => {
    if (shouldReset && !isRunning) {
      setSeconds(0);
    }
  }, [shouldReset, isRunning]);

  useEffect(() => {
    if (!isRunning) {
      if (shouldReset) {
        setSeconds(0);
      }
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev >= 3599) return 0; // Reset after 59:59
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, shouldReset]);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate container width based on minute value (sticky breakpoints)
  const getContainerWidth = (totalSeconds: number): number => {
    const mins = Math.floor(totalSeconds / 60);
    if (mins < 10) return 40;   // Single-digit minutes: 0:00 → 9:59
    if (mins < 20) return 48;   // Double-digit start: 10:00 → 19:59
    return 52;                   // Wider double-digits: 20:00 → 59:59
  };

  const containerWidth = getContainerWidth(seconds);

  // Report width changes to parent (if callback provided)
  useEffect(() => {
    onWidthChange?.(containerWidth);
  }, [containerWidth, onWidthChange]);

  return (
    <>
      <div
        className={`timer-text ${styles.OpenRundeMedium18}`}
        style={{ width: `${containerWidth}px` }}
      >
        {formatTime(seconds)}
      </div>

      <style jsx>{`
        .timer-text {
          /* Width set via inline style (sticky breakpoints: 40px, 48px, 52px) */
          height: 26px;
          text-align: left;
          color: var(--VoiceDarkGrey_90);

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};
