import React, { useState, useEffect } from 'react';

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

  return (
    <>
      <div className="timer-text">{formatTime(seconds)}</div>

      <style jsx>{`
        .timer-text {
          width: auto;
          min-width: 55px;
          height: 26px;

          font-family: 'Open Runde', sans-serif;
          font-style: normal;
          font-weight: 500;
          font-size: 18px;
          line-height: 143.75%;
          text-align: left;

          color: rgba(38, 36, 36, 0.9);

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};
