import React, { useState, useEffect, useRef } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

/* ============================================
   ┌─────────────────────────────────────────┐
   │  LIVE TIMER - DYNAMIC TIME DISPLAY      │
   │  Real-time Recording Timer               │
   └─────────────────────────────────────────┘
   
   FEATURES:
   - Counts up from 0:00 when recording starts
   - Freezes at current time when done/processing
   - Resets when stopped
   - Formats time as M:SS (0:01, 0:26, 1:05, etc.)
   
   USAGE:
   <LiveTimer 
     isRunning={state === 'recording'}
     isFrozen={doneButtonState === 'processing'}
   />
   
   ============================================ */

interface LiveTimerProps {
  /** Controls if timer is actively counting */
  isRunning: boolean;
  /** Freezes display at current time (stops counting but preserves display) */
  isFrozen?: boolean;
  /** Optional callback when time updates (receives total seconds) */
  onTimeUpdate?: (seconds: number) => void;
  /** Additional CSS classes */
  className?: string;
}

export const LiveTimer: React.FC<LiveTimerProps> = ({ 
  isRunning,
  isFrozen = false,
  onTimeUpdate,
  className = '' 
}) => {
  // State
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasRunningRef = useRef(false);
  
  // Format seconds to M:SS display
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    // - Done button: isFrozen=true, timer freezes
    // - Cancel button: isRunning=false, timer freezes (no visual reset)
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
      <div className={`live-timer ${className} ${styles.container}`}>
        <span className={`timer-text ${styles.JetBrainsMonoMedium18}`}>
          {formatTime(seconds)}
        </span>
      </div>
      
      <style jsx>{`
        .live-timer {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 0px;
          gap: 11.25px;
          /* border: 1px solid blue; */
          
          /* ADAPTIVE WIDTH: Expands for 10+ minutes (5 chars, max ~99:59) */
          min-width: 44px;           /* Minimum for 4 chars (0:26, 9:59) */
          width: auto;               /* Grows with content (capped at 15 min by audio recorder) */
          
          height: 42px;
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .timer-text {
          min-width: 44px;
          width: auto;
          height: 26px;
          /* border: 1px solid green; */
          
          text-align: center;
          color: var(--ClipWhite);
          white-space: nowrap;       /* Prevent text wrapping */
          
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
export default LiveTimer;

