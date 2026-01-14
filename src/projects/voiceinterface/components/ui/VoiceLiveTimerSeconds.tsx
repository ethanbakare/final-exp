import React, { useState, useEffect } from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

interface VoiceLiveTimerSecondsProps {
  isRunning?: boolean;
}

export const VoiceLiveTimerSeconds: React.FC<VoiceLiveTimerSecondsProps> = ({ isRunning = true }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev >= 3599) return 0; // Reset after 59:59
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

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
