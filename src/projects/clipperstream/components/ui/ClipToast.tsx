import React, { useEffect, useState, useCallback } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

// ClipToast Components
// Toast notifications for clipboard copy confirmation and audio save confirmation
// Following patterns from search.tsx (responsive width) and subclipbuttons.tsx (icons)
//
// COMPONENTS:
// - CopyToast, AudioToast: Static toast content
// - ToastNotification: Animated wrapper with slide-down, auto-dismiss, slide-up

/* ============================================
   INTERFACES
   ============================================ */

interface ToastProps {
  onClose?: () => void;
  className?: string;
  fullWidth?: boolean;  // Enables responsive mode - fills parent up to 341px max
}

interface CopyToastProps extends ToastProps {
  text?: string;  // Default: "Copied to clipboard"
}

interface AudioToastProps extends ToastProps {
  text?: string;  // Default: "Audio saved for later"
}

/* ============================================
   SHARED TOAST STYLES
   DRY principle - shared between all toast components
   ============================================ */

const SharedToastStyles = () => (
  <style jsx global>{`
    .toast-base {
      /* Auto layout */
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 16px 10px;
      gap: 12px;
      
      /* Default dimensions from spec */
      width: 341px;
      min-width: 177px;
      height: 51px;
      
      /* Styling */
      background: var(--ClipGrey);  /* #252525 */
      border: 1px solid var(--RecWhite_10);  /* rgba(255, 255, 255, 0.1) */
      box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      
      /* Box sizing */
      box-sizing: border-box;
    }
    
    /* Responsive mode - fills container width (like Search component) */
    /* Used inside ToastNotification which positions with left: 10px; right: 10px */
    .toast-base.full-width {
      width: 100%;
      max-width: none;  /* Remove max-width to fill available space */
    }
    
    /* Card Frame - contains icon and text */
    .toast-card-frame {
      /* Auto layout */
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 0px;
      gap: 12px;
      
      /* Flexible width */
      flex: 1;
      min-width: 0;  /* Allow shrinking */
      height: 19px;
    }
    
    /* Toast text styling */
    .toast-text {
      /* Typography */
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-style: normal;
      font-weight: 400;
      font-size: 16px;
      line-height: 19px;
      
      color: var(--ClipWhite);
      
      /* Truncate if too long */
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      /* Flexible width */
      flex: 1;
      min-width: 0;
    }
    
    /* Close button wrapper - removes button styling */
    .toast-close-btn {
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
    
    .toast-close-btn:hover {
      opacity: 0.8;
    }
    
    /* Icon wrapper - fixed size */
    .toast-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      
      /* Center icon */
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `}</style>
);

/* ============================================
   COPY TOAST - Shows copy confirmation
   Icon: SubCopyIcon | Text: "Copied to clipboard" | Close: SubCloseIcon
   ============================================ */

export const CopyToast: React.FC<CopyToastProps> = ({
  text = 'Copied to clipboard',
  onClose,
  className = '',
  fullWidth = false
}) => {
  return (
    <>
      <SharedToastStyles />
      <div className={`toast-base ${fullWidth ? 'full-width' : ''} ${className} ${styles.container}`}>
        {/* Card Frame - Icon + Text */}
        <div className="toast-card-frame">
          {/* SubCopyIcon - inline SVG following subclipbuttons.tsx pattern */}
          <div className="toast-icon">
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 18 18" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M11.25 11.25H13.35C14.1901 11.25 14.61 11.25 14.9308 11.0865C15.2131 10.9427 15.4429 10.7133 15.5867 10.431C15.7502 10.1102 15.7502 9.69012 15.7502 8.85004V4.65002C15.7502 3.80994 15.7502 3.3899 15.5867 3.06903C15.4429 2.78679 15.2131 2.5573 14.9308 2.41349C14.61 2.25 14.1902 2.25 13.3501 2.25H9.15015C8.31007 2.25 7.88972 2.25 7.56885 2.41349C7.2866 2.5573 7.0573 2.78679 6.91349 3.06903C6.75 3.3899 6.75 3.80998 6.75 4.65005V6.75005M2.25 13.3501V9.15005C2.25 8.30998 2.25 7.8899 2.41349 7.56903C2.5573 7.28679 2.7866 7.0573 3.06885 6.91349C3.38972 6.75 3.81007 6.75 4.65015 6.75H8.85015C9.69023 6.75 10.11 6.75 10.4308 6.91349C10.7131 7.0573 10.9429 7.28679 11.0867 7.56903C11.2502 7.8899 11.2502 8.30994 11.2502 9.15002V13.35C11.2502 14.1901 11.2502 14.6102 11.0867 14.931C10.9429 15.2133 10.7131 15.4427 10.4308 15.5865C10.11 15.75 9.69023 15.75 8.85015 15.75H4.65015C3.81007 15.75 3.38972 15.75 3.06885 15.5865C2.7866 15.4427 2.5573 15.2133 2.41349 14.931C2.25 14.6102 2.25 14.1901 2.25 13.3501Z" 
                stroke="white" 
                strokeWidth="1.17" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          {/* Toast Text */}
          <span className="toast-text">{text}</span>
        </div>
        
        {/* Close Button - SubCloseIcon */}
        <button 
          className="toast-close-btn"
          onClick={onClose}
          type="button"
          aria-label="Dismiss notification"
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
              strokeOpacity="0.6"
              strokeWidth="1.17" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </>
  );
};

/* ============================================
   AUDIO TOAST - Shows audio saved confirmation
   Icon: SubCheckmarkIcon | Text: "Audio saved for later" | Close: SubCloseIcon
   ============================================ */

export const AudioToast: React.FC<AudioToastProps> = ({
  text = 'Audio saved for later',
  onClose,
  className = '',
  fullWidth = false
}) => {
  return (
    <>
      <SharedToastStyles />
      <div className={`toast-base ${fullWidth ? 'full-width' : ''} ${className} ${styles.container}`}>
        {/* Card Frame - Icon + Text */}
        <div className="toast-card-frame">
          {/* SubCheckmarkIcon - inline SVG following subclipbuttons.tsx pattern */}
          <div className="toast-icon">
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 18 18" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M3 8.99997L6.71231 12.7123L14.6676 4.75732" 
                stroke="white" 
                strokeWidth="1.17" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          {/* Toast Text */}
          <span className="toast-text">{text}</span>
        </div>
        
        {/* Close Button - SubCloseIcon */}
        <button 
          className="toast-close-btn"
          onClick={onClose}
          type="button"
          aria-label="Dismiss notification"
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
              strokeOpacity="0.6"
              strokeWidth="1.17" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </>
  );
};

/* ============================================
   TOAST NOTIFICATION - Animated wrapper with slide-down/up
   
   Features:
   - Positioned at top with 10px padding (left, right, top)
   - Slides down from top with opacity fade-in
   - Auto-dismisses after 3 seconds
   - Slides up with opacity fade-out on dismiss
   - High z-index to appear above all content
   ============================================ */

interface ToastNotificationProps {
  isVisible: boolean;
  onDismiss: () => void;
  type?: 'copy' | 'audio';
  text?: string;
  duration?: number;  // Auto-dismiss duration in ms (default: 3000)
  className?: string;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  isVisible,
  onDismiss,
  type = 'copy',
  text,
  duration = 3000,
  className = ''
}) => {
  // Render state
  const [isInDOM, setIsInDOM] = useState(false);
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);
  
  // Use ref to track if we're currently showing (prevents effect re-runs from breaking timers)
  const isShowingRef = React.useRef(false);
  const timersRef = React.useRef<{
    show?: ReturnType<typeof setTimeout>;
    hide?: ReturnType<typeof setTimeout>;
    remove?: ReturnType<typeof setTimeout>;
  }>({});
  
  // Clear all timers helper
  const clearAllTimers = useCallback(() => {
    if (timersRef.current.show) clearTimeout(timersRef.current.show);
    if (timersRef.current.hide) clearTimeout(timersRef.current.hide);
    if (timersRef.current.remove) clearTimeout(timersRef.current.remove);
    timersRef.current = {};
  }, []);
  
  // Handle isVisible changes - ONLY depends on isVisible
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
      {/* isAnimatedIn controls the .visible class - just like search.tsx pattern */}
      <div className={`toast-notification ${isAnimatedIn ? 'visible' : ''} ${className}`}>
        {type === 'copy' ? (
          <CopyToast text={text} onClose={handleClose} fullWidth />
        ) : (
          <AudioToast text={text} onClose={handleClose} fullWidth />
        )}
      </div>
      
      <style jsx>{`
        /* ============================================
           TOAST NOTIFICATION
           Following search.tsx pattern:
           - Element ALWAYS has transition
           - Default state: translated up, opacity 0
           - .visible state: translated to position, opacity 1
           - CSS handles the animation automatically
           ============================================ */
        
        .toast-notification {
          /* Fixed positioning at top of screen */
          /* 20px top, 10px left/right - fills available width */
          position: absolute;
          top: 20px;
          left: 10px;
          right: 10px;
          
          /* High z-index */
          z-index: 9999;
          
          /* DEFAULT STATE: Hidden above screen (like cancel button in search.tsx) */
          transform: translateY(calc(-100% - 40px));
          opacity: 0;
          pointer-events: none;
          
          /* ALWAYS have transition - handles both enter and exit */
          transition: 
            transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* VISIBLE STATE: Slid down to position (like .state-focused in search.tsx) */
        .toast-notification.visible {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }
        
        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .toast-notification {
            transition: opacity 0.15s ease !important;
            transform: translateY(0) !important;
          }
        }
      `}</style>
    </>
  );
};

/* ============================================
   DEFAULT EXPORTS
   ============================================ */

const ToastComponents = { CopyToast, AudioToast, ToastNotification };
export default ToastComponents;

