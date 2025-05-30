import React, { useState } from 'react';

interface MorphingRightButtonProps {
  state: 'record' | 'recording' | 'processing' | 'clear' | 'retry';
  onRecordClick?: () => void;
  onRecordingClick?: () => void;
  onProcessingClick?: () => void;
  onClearClick?: () => void;
  onRetryClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const MorphingRightButton: React.FC<MorphingRightButtonProps> = ({
  state,
  onRecordClick,
  onRecordingClick,
  onProcessingClick,
  onClearClick,
  onRetryClick,
  className = '',
  disabled = false
}) => {
  const handleClick = () => {
    switch (state) {
      case 'record':
        onRecordClick?.();
        break;
      case 'recording':
        onRecordingClick?.();
        break;
      case 'processing':
        onProcessingClick?.();
        break;
      case 'clear':
        onClearClick?.();
        break;
      case 'retry':
        onRetryClick?.();
        break;
    }
  };

  return (
    <>
      <div className="button-container">
        <button 
          className={`morphing-right-button state-${state} ${className}`}
          onClick={handleClick}
          disabled={disabled}
          aria-label={`${state} button`}
        >
          <div className="content-container">
            {/* Record Icon - visible in record state */}
            <svg 
              className="record-icon" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_morphing_record)">
                <path d="M12 15C13.66 15 14.99 13.66 14.99 12L15 6C15 4.34 13.66 3 12 3C10.34 3 9 4.34 9 6V12C9 13.66 10.34 15 12 15ZM17.3 12C17.3 15 14.76 17.1 12 17.1C9.24 17.1 6.7 15 6.7 12H5C5 15.42 7.72 18.23 11 18.72V22H13V18.72C16.28 18.24 19 15.42 19 12H17.3Z" fill="#FCFCFC"/>
              </g>
              <defs>
                <clipPath id="clip0_morphing_record">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>

            {/* Recording Bars - visible in recording state */}
            <div className="recording-bars">
              <div className="bar bar1"></div>
              <div className="bar bar2"></div>
              <div className="bar bar3"></div>
              <div className="bar bar4"></div>
            </div>

            {/* Processing Spinner - visible in processing state */}
            <svg 
              className="processing-icon" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 22C10.6333 22 9.34167 21.7375 8.125 21.2125C6.90833 20.6875 5.84583 19.9708 4.9375 19.0625C4.02917 18.1542 3.3125 17.0917 2.7875 15.875C2.2625 14.6583 2 13.3667 2 12C2 10.6167 2.2625 9.32083 2.7875 8.1125C3.3125 6.90417 4.02917 5.84583 4.9375 4.9375C5.84583 4.02917 6.90833 3.3125 8.125 2.7875C9.34167 2.2625 10.6333 2 12 2C12.2833 2 12.5208 2.09583 12.7125 2.2875C12.9042 2.47917 13 2.71667 13 3C13 3.28333 12.9042 3.52083 12.7125 3.7125C12.5208 3.90417 12.2833 4 12 4C9.78333 4 7.89583 4.77917 6.3375 6.3375C4.77917 7.89583 4 9.78333 4 12C4 14.2167 4.77917 16.1042 6.3375 17.6625C7.89583 19.2208 9.78333 20 12 20C14.2167 20 16.1042 19.2208 17.6625 17.6625C19.2208 16.1042 20 14.2167 20 12C20 11.7167 20.0958 11.4792 20.2875 11.2875C20.4792 11.0958 20.7167 11 21 11C21.2833 11 21.5208 11.0958 21.7125 11.2875C21.9042 11.4792 22 11.7167 22 12C22 13.3667 21.7375 14.6583 21.2125 15.875C20.6875 17.0917 19.9708 18.1542 19.0625 19.0625C18.1542 19.9708 17.0958 20.6875 15.8875 21.2125C14.6792 21.7375 13.3833 22 12 22Z" fill="#FCFCFC"/>
            </svg>

            {/* Clear Icon - visible in clear state */}
            <svg 
              className="clear-icon" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7 21C6.45 21 5.97917 20.8042 5.5875 20.4125C5.19583 20.0208 5 19.55 5 19V6C4.71667 6 4.47917 5.90417 4.2875 5.7125C4.09583 5.52083 4 5.28333 4 5C4 4.71667 4.09583 4.47917 4.2875 4.2875C4.47917 4.09583 4.71667 4 5 4H9C9 3.71667 9.09583 3.47917 9.2875 3.2875C9.47917 3.09583 9.71667 3 10 3H14C14.2833 3 14.5208 3.09583 14.7125 3.2875C14.9042 3.47917 15 3.71667 15 4H19C19.2833 4 19.5208 4.09583 19.7125 4.2875C19.9042 4.47917 20 4.71667 20 5C20 5.28333 19.9042 5.52083 19.7125 5.7125C19.5208 5.90417 19.2833 6 19 6V19C19 19.55 18.8042 20.0208 18.4125 20.4125C18.0208 20.8042 17.55 21 17 21H7ZM10 17C10.2833 17 10.5208 16.9042 10.7125 16.7125C10.9042 16.5208 11 16.2833 11 16V9C11 8.71667 10.9042 8.47917 10.7125 8.2875C10.5208 8.09583 10.2833 8 10 8C9.71667 8 9.47917 8.09583 9.2875 8.2875C9.09583 8.47917 9 8.71667 9 9V16C9 16.2833 9.09583 16.5208 9.2875 16.7125C9.47917 16.9042 9.71667 17 10 17ZM14 17C14.2833 17 14.5208 16.9042 14.7125 16.7125C14.9042 16.5208 15 16.2833 15 16V9C15 8.71667 14.9042 8.47917 14.7125 8.2875C14.5208 8.09583 14.2833 8 14 8C13.7167 8 13.4792 8.09583 13.2875 8.2875C13.0958 8.47917 13 8.71667 13 9V16C13 16.2833 13.0958 16.5208 13.2875 16.7125C13.4792 16.9042 13.7167 17 14 17Z" fill="#FCFCFC"/>
            </svg>

            {/* Retry Content - visible in retry state */}
            <div className="retry-content">
              {/* Retry Text - no icon */}
              <span className="retry-text">Retry</span>
            </div>
          </div>
        </button>
      </div>
      
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .morphing-right-button,
          .morphing-right-button *,
          .bar {
            transition: none !important;
            animation: none !important;
          }
        }
        
        @keyframes bar1-animation {
          0%, 100% { height: 9px; }
          50% { height: 13.5px; }
        }
        
        @keyframes bar2-animation {
          0%, 100% { height: 18px; }
          50% { height: 11.25px; }
        }
        
        @keyframes bar3-animation {
          0%, 100% { height: 13.5px; }
          50% { height: 18px; }
        }
        
        @keyframes bar4-animation {
          0%, 100% { height: 6.75px; }
          50% { height: 15.75px; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .button-container {
          position: relative;
          width: 80px;        /* Fixed - accommodates largest state (retry: 79.75px) */
          height: 36px;       /* Fixed - never changes */
          display: flex;
          justify-content: flex-end;  /* Right-aligned expansion */
        }
        
        .morphing-right-button {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          border: none;
          cursor: pointer;
          
          /* INITIAL STATE - small circle (record) */
          width: 36px;
          height: 36px;
          background: #1E293B;
          border-radius: 18px;
          
          /* RIGHT-ALIGNED EXPANSION */
          transform-origin: right center;
          margin-left: auto;
          
          /* SMOOTH TRANSITIONS */
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, background, width;
          overflow: hidden;
        }
        
        /* Recording State - wider pill, light red background */
        .morphing-right-button.state-recording {
          width: 61px;
          background: #FECACA;
        }
        
        /* Processing State - circle, dark background */
        .morphing-right-button.state-processing {
          width: 36px;
          background: #1E293B;
        }
        
        /* Clear State - circle, dark background */
        .morphing-right-button.state-clear {
          width: 36px;
          background: #1E293B;
        }

        /* Retry State - wider pill, red background */
        .morphing-right-button.state-retry {
          width: 79.75px;
          background: #EF4444;
        }
        
        .morphing-right-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Content Container - Fixed size for smooth crossfade */
        .content-container {
          position: relative;
          width: 27px;         /* Fixed - content area never changes */
          height: 27px;        /* Fixed - content area never changes */
          display: flex;
          justify-content: center;
          align-items: center;
          transform: translateZ(0);  /* GPU acceleration */
          margin: 0 auto;           /* Centers content in morphing button */
        }
        
        /* Record Icon - visible in record state */
        .record-icon {
          position: absolute;
          width: 27px;
          height: 27px;
          opacity: 0;
          transition: opacity 0.3s ease;
          top: 0; left: 0; right: 0; bottom: 0;
          margin: auto;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        .morphing-right-button.state-record .record-icon {
          opacity: 1;
        }
        
        /* Recording Bars - visible in recording state */
        .recording-bars {
          position: absolute;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          gap: 4.5px;
          width: 27px;
          height: 18px;
          opacity: 0;
          transition: opacity 0.3s ease;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%) translateZ(0);
          backface-visibility: hidden;
        }
        
        .morphing-right-button.state-recording .recording-bars {
          opacity: 1;
        }
        
        /* Individual Recording Bars */
        .bar {
          border-radius: 18px;
          background: #EF4444;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .morphing-right-button.state-recording .bar {
          opacity: 1;
        }
        
        .bar1 {
          width: 3.4px;
          height: 9px;
          animation: bar1-animation 1.2s ease-in-out infinite;
          animation-play-state: paused;
        }
        
        .morphing-right-button.state-recording .bar1 {
          animation-play-state: running;
        }
        
        .bar2 {
          width: 3.4px;
          height: 18px;
          animation: bar2-animation 1.2s ease-in-out infinite 0.2s;
          animation-play-state: paused;
        }
        
        .morphing-right-button.state-recording .bar2 {
          animation-play-state: running;
        }
        
        .bar3 {
          width: 3.4px;
          height: 13.5px;
          animation: bar3-animation 1.2s ease-in-out infinite 0.4s;
          animation-play-state: paused;
        }
        
        .morphing-right-button.state-recording .bar3 {
          animation-play-state: running;
        }
        
        .bar4 {
          width: 3.4px;
          height: 6.75px;
          animation: bar4-animation 1.2s ease-in-out infinite 0.6s;
          animation-play-state: paused;
        }
        
        .morphing-right-button.state-recording .bar4 {
          animation-play-state: running;
        }
        
        /* Processing Icon - visible in processing state */
        .processing-icon {
          position: absolute;
          width: 24px;
          height: 24px;
          opacity: 0;
          transition: opacity 0.3s ease;
          top: 0; left: 0; right: 0; bottom: 0;
          margin: auto;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        .morphing-right-button.state-processing .processing-icon {
          opacity: 1;
          animation: spin 1.5s linear infinite;
        }
        
        /* Clear Icon - visible in clear state */
        .clear-icon {
          position: absolute;
          width: 27px;
          height: 27px;
          opacity: 0;
          transition: opacity 0.3s ease;
          top: 0; left: 0; right: 0; bottom: 0;
          margin: auto;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        .morphing-right-button.state-clear .clear-icon {
          opacity: 1;
        }

        /* Retry Content - visible in retry state */
        .retry-content {
          position: absolute;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          gap: 4.5px;
          width: 70px;
          height: 18px;
          opacity: 0;
          transition: opacity 0.3s ease;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%) translateZ(0);
          backface-visibility: hidden;
        }
        
        .morphing-right-button.state-retry .retry-content {
          opacity: 1;
        }
        
        /* Retry Text */
        .retry-text {
          font-size: 18px;
          font-weight: 500;
          color: #FCFCFC;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
};

interface MorphingLeftButtonProps {
  state: 'hidden' | 'cancel' | 'dropdown';
  onCancelClick?: () => void;
  onDropdownClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const MorphingLeftButton: React.FC<MorphingLeftButtonProps> = ({
  state,
  onCancelClick,
  onDropdownClick,
  className = '',
  disabled = false
}) => {
  // Add internal state for dropdown rotation
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    switch (state) {
      case 'cancel':
        onCancelClick?.();
        break;
      case 'dropdown':
        // Toggle rotation state and call the callback
        setIsOpen(!isOpen);
        onDropdownClick?.();
        break;
      case 'hidden':
        // No action for hidden state
        break;
    }
  };

  // Reset rotation state when not in dropdown state
  React.useEffect(() => {
    if (state !== 'dropdown') {
      setIsOpen(false);
    }
  }, [state]);

  return (
    <>
      <div className="left-button-container">
        <button 
          className={`morphing-left-button state-${state} ${className}`}
          onClick={handleClick}
          disabled={disabled || state === 'hidden'}
          aria-label={state === 'hidden' ? undefined : `${state} button`}
          aria-expanded={state === 'dropdown' ? isOpen : undefined}
          style={{ pointerEvents: state === 'hidden' ? 'none' : 'auto' }}
        >
          <div className="left-content-container">
            {/* Cancel Icon - visible in cancel state */}
            <svg 
              className="cancel-icon" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_morphing_cancel)">
                <path d="M18.2997 5.70997C17.9097 5.31997 17.2797 5.31997 16.8897 5.70997L11.9997 10.59L7.10973 5.69997C6.71973 5.30997 6.08973 5.30997 5.69973 5.69997C5.30973 6.08997 5.30973 6.71997 5.69973 7.10997L10.5897 12L5.69973 16.89C5.30973 17.28 5.30973 17.91 5.69973 18.3C6.08973 18.69 6.71973 18.69 7.10973 18.3L11.9997 13.41L16.8897 18.3C17.2797 18.69 17.9097 18.69 18.2997 18.3C18.6897 17.91 18.6897 17.28 18.2997 16.89L13.4097 12L18.2997 7.10997C18.6797 6.72997 18.6797 6.08997 18.2997 5.70997V5.70997Z" fill="#1E293B"/>
              </g>
              <defs>
                <clipPath id="clip0_morphing_cancel">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>

            {/* Dropdown Icon - visible in dropdown state */}
            <svg 
              className={`dropdown-icon ${isOpen ? 'rotated' : ''}`}
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12.0002 8.02495C12.1335 8.02495 12.2585 8.04578 12.3752 8.08745C12.4919 8.12912 12.6002 8.19995 12.7002 8.29995L17.3002 12.9C17.4835 13.0833 17.5752 13.3166 17.5752 13.6C17.5752 13.8833 17.4835 14.1166 17.3002 14.3C17.1169 14.4833 16.8835 14.575 16.6002 14.575C16.3169 14.575 16.0835 14.4833 15.9002 14.3L12.0002 10.4L8.1002 14.3C7.91686 14.4833 7.68353 14.575 7.4002 14.575C7.11686 14.575 6.88353 14.4833 6.7002 14.3C6.51686 14.1166 6.4252 13.8833 6.4252 13.6C6.4252 13.3166 6.51686 13.0833 6.7002 12.9L11.3002 8.29995C11.4002 8.19995 11.5085 8.12912 11.6252 8.08745C11.7419 8.04578 11.8669 8.02495 12.0002 8.02495Z" fill="#1E293B"/>
            </svg>
          </div>
        </button>
      </div>
      
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .morphing-left-button,
          .morphing-left-button *,
          .dropdown-icon {
            transition: none !important;
            animation: none !important;
          }
        }
        
        .left-button-container {
          position: relative;
          width: 36px;        /* Fixed - accommodates visible states */
          height: 36px;       /* Fixed - never changes */
          display: flex;
          justify-content: flex-start;  /* Left-aligned expansion */
          overflow: hidden;   /* Hide content when width is 0 */
        }
        
        .morphing-left-button {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          border: none;
          cursor: pointer;
          
          /* HIDDEN STATE - no width */
          width: 0px;
          height: 36px;
          background: rgba(30, 41, 59, 0.1);
          border-radius: 18px;
          
          /* LEFT-ALIGNED EXPANSION */
          transform-origin: left center;
          margin-right: auto;
          
          /* SMOOTH TRANSITIONS */
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, background, width, opacity;
          overflow: hidden;
          opacity: 0;
        }
        
        /* Cancel State - visible circle */
        .morphing-left-button.state-cancel {
          width: 36px;
          opacity: 1;
          background: rgba(30, 41, 59, 0.1);
        }
        
        /* Dropdown State - visible circle */
        .morphing-left-button.state-dropdown {
          width: 36px;
          opacity: 1;
          background: rgba(30, 41, 59, 0.1);
        }
        
        .morphing-left-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Content Container - Fixed size for smooth crossfade */
        .left-content-container {
          position: relative;
          width: 27px;         /* Fixed - content area never changes */
          height: 27px;        /* Fixed - content area never changes */
          display: flex;
          justify-content: center;
          align-items: center;
          transform: translateZ(0);  /* GPU acceleration */
          margin: 0 auto;           /* Centers content in morphing button */
        }
        
        /* Cancel Icon - visible in cancel state */
        .cancel-icon {
          position: absolute;
          width: 27px;
          height: 27px;
          opacity: 0;
          transition: opacity 0.3s ease;
          top: 0; left: 0; right: 0; bottom: 0;
          margin: auto;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        .morphing-left-button.state-cancel .cancel-icon {
          opacity: 1;
        }
        
        /* Dropdown Icon - visible in dropdown state with click-based rotation */
        .dropdown-icon {
          position: absolute;
          width: 27px;
          height: 27px;
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.3s ease;
          top: 0; left: 0; right: 0; bottom: 0;
          margin: auto;
          transform: translateZ(0) rotate(180deg);  /* Start rotated (arrow pointing up) */
          backface-visibility: hidden;
          will-change: transform;
        }
        
        .morphing-left-button.state-dropdown .dropdown-icon {
          opacity: 1;
        }
        
        /* Rotation state - when clicked, arrow points down */
        .dropdown-icon.rotated {
          transform: translateZ(0) rotate(0deg);  /* Rotate to normal position (arrow pointing down) */
        }
      `}</style>
    </>
  );
};

// Create a named object for default export
const deepMorphingButtons = {
  MorphingRightButton, 
  MorphingLeftButton
};

export default deepMorphingButtons; 