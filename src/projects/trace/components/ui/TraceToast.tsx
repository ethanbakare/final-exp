import React, { useEffect, useState, useCallback } from 'react';
import styles from '@/projects/trace/styles/trace.module.css';

// TraceToast Components
// Toast notifications for Trace error/info feedback
// Based on ClipStream's ClipToast pattern with Trace styling:
//   - Background: #26221F (warmer than ClipStream's #252525)
//   - Border: 1px solid rgba(255, 255, 255, 0.1)
//   - Shadow: 0px 5px 10px rgba(0, 0, 0, 0.15)
//   - Border-radius: 28px (pill, vs ClipStream's 8px)
//   - Padding: 16px 20px
//   - Font: Open Runde 14px 400 (vs Inter 16px)
//   - fullWidth prop fills parent container (like ClipStream's search.tsx pattern)

/* ============================================
   INTERFACES
   ============================================ */

interface TraceToastContentProps {
  text: string;
  onClose?: () => void;
  className?: string;
  fullWidth?: boolean;
}

interface TraceToastNotificationProps {
  isVisible: boolean;
  onDismiss: () => void;
  text: string;
  duration?: number;     // Auto-dismiss in ms (default: 4000)
  className?: string;
}

/* ============================================
   TRACE TOAST — Static content component
   X close icon (left) + message text (right)
   ============================================ */

export const TraceToast: React.FC<TraceToastContentProps> = ({
  text,
  onClose,
  className = '',
  fullWidth = false,
}) => {
  return (
    <>
      <div className={`trace-toast ${fullWidth ? 'full-width' : ''} ${className} ${styles.container}`}>
        {/* Close button — 18×18 X icon */}
        <button
          className="trace-toast-close"
          onClick={onClose}
          aria-label="Dismiss"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.5 13.5L4.5 4.5M13.5 4.5L4.5 13.5"
              stroke="white"
              strokeWidth="1.17"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Message text */}
        <span className="trace-toast-text">{text}</span>
      </div>

      <style jsx>{`
        .trace-toast {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 16px 20px;
          gap: 12px;

          /* Default dimensions */
          width: 277px;
          min-width: 177px;
          height: 50px;

          /* Trace palette */
          background: #26221F;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.15);
          border-radius: 28px;

          /* Box model */
          box-sizing: border-box;
        }

        /* Full-width mode — fills parent container */
        .trace-toast.full-width {
          width: 100%;
          max-width: none;
        }

        /* Close button */
        .trace-toast-close {
          /* Reset button styles */
          background: transparent;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;

          /* Layout */
          display: flex;
          align-items: center;
          justify-content: center;

          /* Fixed size */
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .trace-toast-close:hover {
          opacity: 0.8;
        }

        /* Message text */
        .trace-toast-text {
          /* Typography — Open Runde 14px 400 */
          font-family: 'Open Runde', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-style: normal;
          font-weight: 400;
          font-size: 14px;
          line-height: 17px;

          color: #FFFFFF;

          /* Truncate if too long */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          /* Fill available space */
          flex: 1;
          min-width: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   TRACE TOAST NOTIFICATION — Animated wrapper
   Handles: slide-in, auto-dismiss, slide-out
   Based on ClipStream's ToastNotification pattern:
   - Element ALWAYS has CSS transition
   - Default state: translated up, opacity 0
   - .visible state: translated to position, opacity 1
   ============================================ */

export const TraceToastNotification: React.FC<TraceToastNotificationProps> = ({
  isVisible,
  onDismiss,
  text,
  duration = 4000,
  className = '',
}) => {
  // Render state
  const [isInDOM, setIsInDOM] = useState(false);
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);

  // Track if currently showing (prevents effect re-runs from breaking timers)
  const isShowingRef = React.useRef(false);
  const timersRef = React.useRef<{
    show?: ReturnType<typeof setTimeout>;
    hide?: ReturnType<typeof setTimeout>;
    remove?: ReturnType<typeof setTimeout>;
  }>({});

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (timersRef.current.show) clearTimeout(timersRef.current.show);
    if (timersRef.current.hide) clearTimeout(timersRef.current.hide);
    if (timersRef.current.remove) clearTimeout(timersRef.current.remove);
    timersRef.current = {};
  }, []);

  // Handle isVisible changes
  useEffect(() => {
    if (isVisible && !isShowingRef.current) {
      // Starting to show
      isShowingRef.current = true;
      clearAllTimers();

      // Step 1: Add to DOM
      setIsInDOM(true);

      // Step 2: Trigger slide-in after paint
      timersRef.current.show = setTimeout(() => {
        setIsAnimatedIn(true);
      }, 50);

      // Step 3: Auto-dismiss after duration
      timersRef.current.hide = setTimeout(() => {
        setIsAnimatedIn(false);

        // Step 4: Remove from DOM after animation
        timersRef.current.remove = setTimeout(() => {
          setIsInDOM(false);
          isShowingRef.current = false;
          onDismiss();
        }, 300);
      }, duration);
    }

    if (!isVisible && isShowingRef.current) {
      // External dismiss
      clearAllTimers();
      setIsAnimatedIn(false);

      timersRef.current.remove = setTimeout(() => {
        setIsInDOM(false);
        isShowingRef.current = false;
      }, 300);
    }

    return () => {
      // Only clear on unmount, not on every re-render
    };
  }, [isVisible, duration, onDismiss, clearAllTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Handle manual close (X button clicked)
  const handleClose = useCallback(() => {
    clearAllTimers();
    setIsAnimatedIn(false);

    timersRef.current.remove = setTimeout(() => {
      setIsInDOM(false);
      isShowingRef.current = false;
      onDismiss();
    }, 300);
  }, [onDismiss, clearAllTimers]);

  // Don't render if not in DOM
  if (!isInDOM) {
    return null;
  }

  return (
    <>
      <div className={`trace-toast-notification ${isAnimatedIn ? 'visible' : ''} ${className}`}>
        <TraceToast text={text} onClose={handleClose} fullWidth />
      </div>

      <style jsx>{`
        .trace-toast-notification {
          /* Positioned at top of parent container */
          position: absolute;
          top: 20px;
          left: 10px;
          right: 10px;

          /* High z-index */
          z-index: 9999;

          /* DEFAULT STATE: Hidden above (translated up) */
          transform: translateY(calc(-100% - 40px));
          opacity: 0;
          pointer-events: none;

          /* ALWAYS have transition — handles enter and exit */
          transition:
            transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* VISIBLE STATE: Slid down to position */
        .trace-toast-notification.visible {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .trace-toast-notification {
            transition: opacity 0.15s ease !important;
            transform: translateY(0) !important;
          }
        }
      `}</style>
    </>
  );
};
