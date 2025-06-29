import React, { useState } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';

// Re-export morphing buttons from the new file for backward compatibility
export { MorphingRightButton, MorphingLeftButton } from './deepMorphingButtons';

// DeepButtons component will be implemented later

// Badge coordination - only one badge active at a time
let currentActiveBadge: (() => void) | null = null;

const setGlobalActiveBadge = (deactivateCallback: (() => void) | null) => {
  if (currentActiveBadge && currentActiveBadge !== deactivateCallback) {
    currentActiveBadge();
  }
  currentActiveBadge = deactivateCallback;
};

interface ClearButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const ClearButton: React.FC<ClearButtonProps> = ({ 
  onClick, 
  className = '',
  disabled = false 
}) => {
  return (
    <>
      <button 
        className={`clear-button ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 21C6.45 21 5.97917 20.8042 5.5875 20.4125C5.19583 20.0208 5 19.55 5 19V6C4.71667 6 4.47917 5.90417 4.2875 5.7125C4.09583 5.52083 4 5.28333 4 5C4 4.71667 4.09583 4.47917 4.2875 4.2875C4.47917 4.09583 4.71667 4 5 4H9C9 3.71667 9.09583 3.47917 9.2875 3.2875C9.47917 3.09583 9.71667 3 10 3H14C14.2833 3 14.5208 3.09583 14.7125 3.2875C14.9042 3.47917 15 3.71667 15 4H19C19.2833 4 19.5208 4.09583 19.7125 4.2875C19.9042 4.47917 20 4.71667 20 5C20 5.28333 19.9042 5.52083 19.7125 5.7125C19.5208 5.90417 19.2833 6 19 6V19C19 19.55 18.8042 20.0208 18.4125 20.4125C18.0208 20.8042 17.55 21 17 21H7ZM10 17C10.2833 17 10.5208 16.9042 10.7125 16.7125C10.9042 16.5208 11 16.2833 11 16V9C11 8.71667 10.9042 8.47917 10.7125 8.2875C10.5208 8.09583 10.2833 8 10 8C9.71667 8 9.47917 8.09583 9.2875 8.2875C9.09583 8.47917 9 8.71667 9 9V16C9 16.2833 9.09583 16.5208 9.2875 16.7125C9.47917 16.9042 9.71667 17 10 17ZM14 17C14.2833 17 14.5208 16.9042 14.7125 16.7125C14.9042 16.5208 15 16.2833 15 16V9C15 8.71667 14.9042 8.47917 14.7125 8.2875C14.5208 8.09583 14.2833 8 14 8C13.7167 8 13.4792 8.09583 13.2875 8.2875C13.0958 8.47917 13 8.71667 13 9V16C13 16.2833 13.0958 16.5208 13.2875 16.7125C13.4792 16.9042 13.7167 17 14 17Z" fill="#FCFCFC"/>
        </svg>
      </button>
      
      <style jsx>{`
        .clear-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 11px;
          
          position: relative;
          width: 36px;
          height: 36px;
          
          background: #1E293B;
          border-radius: 18px;
          border: none;
          cursor: pointer;
        }
        
        .clear-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .clear-button svg {
          width: 27px;
          height: 27px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .clear-button svg path {
          background: #FCFCFC;
        }
      `}</style>
    </>
  );
};

interface ProcessingButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const ProcessingButton: React.FC<ProcessingButtonProps> = ({
  onClick,
  className = '',
  disabled = false
}) => {
  return (
    <>
      <button 
        className={`processing-button ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="icon-container">
          <svg className="spinning-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C10.6333 22 9.34167 21.7375 8.125 21.2125C6.90833 20.6875 5.84583 19.9708 4.9375 19.0625C4.02917 18.1542 3.3125 17.0917 2.7875 15.875C2.2625 14.6583 2 13.3667 2 12C2 10.6167 2.2625 9.32083 2.7875 8.1125C3.3125 6.90417 4.02917 5.84583 4.9375 4.9375C5.84583 4.02917 6.90833 3.3125 8.125 2.7875C9.34167 2.2625 10.6333 2 12 2C12.2833 2 12.5208 2.09583 12.7125 2.2875C12.9042 2.47917 13 2.71667 13 3C13 3.28333 12.9042 3.52083 12.7125 3.7125C12.5208 3.90417 12.2833 4 12 4C9.78333 4 7.89583 4.77917 6.3375 6.3375C4.77917 7.89583 4 9.78333 4 12C4 14.2167 4.77917 16.1042 6.3375 17.6625C7.89583 19.2208 9.78333 20 12 20C14.2167 20 16.1042 19.2208 17.6625 17.6625C19.2208 16.1042 20 14.2167 20 12C20 11.7167 20.0958 11.4792 20.2875 11.2875C20.4792 11.0958 20.7167 11 21 11C21.2833 11 21.5208 11.0958 21.7125 11.2875C21.9042 11.4792 22 11.7167 22 12C22 13.3667 21.7375 14.6583 21.2125 15.875C20.6875 17.0917 19.9708 18.1542 19.0625 19.0625C18.1542 19.9708 17.0958 20.6875 15.8875 21.2125C14.6792 21.7375 13.3833 22 12 22Z" fill="#FCFCFC"/>
          </svg>
        </div>
      </button>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .processing-button {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0;
          
          position: relative;
          width: 36px;
          height: 36px;
          
          background: #1E293B;
          border-radius: 18px;
          border: none;
          cursor: pointer;
        }
        
        .processing-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .icon-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 24px;
          height: 24px;
          position: relative;
        }
        
        .spinning-icon {
          position: absolute;
          top: 0;
          left: 0;
          width: 24px;
          height: 24px;
          animation: spin 1.5s linear infinite;
          transform-origin: center center;
        }
        
        .processing-button svg path {
          background: #FCFCFC;
        }
      `}</style>
    </>
  );
};

interface DropdownButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  onClick,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleClick = () => {
    setIsOpen(!isOpen);
    if (onClick) onClick();
  };
  
  return (
    <>
      <button 
        className={`dropdown-button ${className}`}
        onClick={handleClick}
        disabled={disabled}
        aria-expanded={isOpen}
      >
        <svg 
          className={`arrow-icon ${isOpen ? 'rotated' : ''}`} 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.0002 8.02495C12.1335 8.02495 12.2585 8.04578 12.3752 8.08745C12.4919 8.12912 12.6002 8.19995 12.7002 8.29995L17.3002 12.9C17.4835 13.0833 17.5752 13.3166 17.5752 13.6C17.5752 13.8833 17.4835 14.1166 17.3002 14.3C17.1169 14.4833 16.8835 14.575 16.6002 14.575C16.3169 14.575 16.0835 14.4833 15.9002 14.3L12.0002 10.4L8.1002 14.3C7.91686 14.4833 7.68353 14.575 7.4002 14.575C7.11686 14.575 6.88353 14.4833 6.7002 14.3C6.51686 14.1166 6.4252 13.8833 6.4252 13.6C6.4252 13.3166 6.51686 13.0833 6.7002 12.9L11.3002 8.29995C11.4002 8.19995 11.5085 8.12912 11.6252 8.08745C11.7419 8.04578 11.8669 8.02495 12.0002 8.02495Z" fill="#1E293B"/>
        </svg>
      </button>
      
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .arrow-icon {
            transition: none;
          }
        }
        
        .dropdown-button {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 11px;
          
          position: relative;
          width: 36px;
          height: 36px;
          
          background: rgba(30, 41, 59, 0.1);
          border-radius: 18px;
          border: none;
          cursor: pointer;
        }
        
        .dropdown-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .arrow-icon {
          width: 27px;
          height: 27px;
          transform: rotate(180deg) translateZ(0);
          transition: transform 0.3s ease;
          will-change: transform;
        }
        
        .arrow-icon.rotated {
          transform: rotate(0deg) translateZ(0);
        }
      `}</style>
    </>
  );
};

interface CancelButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const CancelButton: React.FC<CancelButtonProps> = ({
  onClick,
  className = '',
  disabled = false
}) => {
  return (
    <>
      <button 
        className={`cancel-button ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_2434_707)">
            <path d="M18.2997 5.70997C17.9097 5.31997 17.2797 5.31997 16.8897 5.70997L11.9997 10.59L7.10973 5.69997C6.71973 5.30997 6.08973 5.30997 5.69973 5.69997C5.30973 6.08997 5.30973 6.71997 5.69973 7.10997L10.5897 12L5.69973 16.89C5.30973 17.28 5.30973 17.91 5.69973 18.3C6.08973 18.69 6.71973 18.69 7.10973 18.3L11.9997 13.41L16.8897 18.3C17.2797 18.69 17.9097 18.69 18.2997 18.3C18.6897 17.91 18.6897 17.28 18.2997 16.89L13.4097 12L18.2997 7.10997C18.6797 6.72997 18.6797 6.08997 18.2997 5.70997V5.70997Z" fill="#1E293B"/>
          </g>
          <defs>
            <clipPath id="clip0_2434_707">
              <rect width="24" height="24" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </button>
      
      <style jsx>{`
        .cancel-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 11px;
          
          position: relative;
          width: 36px;
          height: 36px;
          
          background: rgba(30, 41, 59, 0.1);
          border-radius: 18px;
          border: none;
          cursor: pointer;
        }
        
        .cancel-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .cancel-button svg {
          width: 27px;
          height: 27px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .cancel-button svg path {
          fill: #1E293B;
        }
      `}</style>
    </>
  );
};

interface RecordButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  onClick,
  className = '',
  disabled = false
}) => {
  return (
    <>
      <button 
        className={`record-button ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_2055_647)">
            <path d="M12 15C13.66 15 14.99 13.66 14.99 12L15 6C15 4.34 13.66 3 12 3C10.34 3 9 4.34 9 6V12C9 13.66 10.34 15 12 15ZM17.3 12C17.3 15 14.76 17.1 12 17.1C9.24 17.1 6.7 15 6.7 12H5C5 15.42 7.72 18.23 11 18.72V22H13V18.72C16.28 18.24 19 15.42 19 12H17.3Z" fill="#FCFCFC"/>
          </g>
          <defs>
            <clipPath id="clip0_2055_647">
              <rect width="24" height="24" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </button>
      
      <style jsx>{`
        .record-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 9px 17px;
          gap: 11px;
          
          position: relative;
          width: 36px;
          height: 36px;
          
          background: #1E293B;
          border-radius: 18px;
          border: none;
          cursor: pointer;
        }
        
        .record-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .record-button svg {
          width: 27px;
          height: 27px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .record-button svg path {
          fill: #FCFCFC;
        }
      `}</style>
    </>
  );
};

interface DisabledRecordButtonProps {
  className?: string;
}

export const DisabledRecordButton: React.FC<DisabledRecordButtonProps> = ({
  className = ''
}) => {
  return (
    <>
      <button 
        className={`disabled-record-button ${className}`}
        disabled={true}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_disabled_record)">
            <path d="M12 15C13.66 15 14.99 13.66 14.99 12L15 6C15 4.34 13.66 3 12 3C10.34 3 9 4.34 9 6V12C9 13.66 10.34 15 12 15ZM17.3 12C17.3 15 14.76 17.1 12 17.1C9.24 17.1 6.7 15 6.7 12H5C5 15.42 7.72 18.23 11 18.72V22H13V18.72C16.28 18.24 19 15.42 19 12H17.3Z" fill="#FCFCFC"/>
          </g>
          <defs>
            <clipPath id="clip0_disabled_record">
              <rect width="24" height="24" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      </button>
      
      <style jsx>{`
        .disabled-record-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 9px 17px;
          gap: 11px;
          
          position: relative;
          width: 36px;
          height: 36px;
          
          background: #1E293B;
          border-radius: 18px;
          border: none;
          cursor: not-allowed;
          
          /* 50% opacity for disabled state */
          opacity: 0.5;
        }
        
        .disabled-record-button svg {
          width: 27px;
          height: 27px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .disabled-record-button svg path {
          fill: #FCFCFC;
        }
      `}</style>
    </>
  );
};

interface RecordingButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  onClick,
  className = '',
  disabled = false
}) => {
  return (
    <>
      <button 
        className={`recording-button ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="bars">
          <div className="bar bar1"></div>
          <div className="bar bar2"></div>
          <div className="bar bar3"></div>
          <div className="bar bar4"></div>
        </div>
      </button>
      
      <style jsx>{`
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
        
        .recording-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 9px 17px;
          gap: 11px;
          
          position: relative;
          width: 61px;
          height: 36px;
          
          background: #FECACA;
          border-radius: 18px;
          border: none;
          cursor: pointer;
        }
        
        .recording-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .bars {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 4.5px;
          
          width: 27px;
          height: 18px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .bar {
          border-radius: 18px;
          background: #EF4444;
        }
        
        .bar1 {
          width: 3.4px;
          height: 9px;
          animation: bar1-animation 1.2s ease-in-out infinite;
        }
        
        .bar2 {
          width: 3.4px;
          height: 18px;
          animation: bar2-animation 1.2s ease-in-out infinite 0.2s;
        }
        
        .bar3 {
          width: 3.4px;
          height: 13.5px;
          animation: bar3-animation 1.2s ease-in-out infinite 0.4s;
        }
        
        .bar4 {
          width: 3.4px;
          height: 6.75px;
          animation: bar4-animation 1.2s ease-in-out infinite 0.6s;
        }
      `}</style>
    </>
  );
};

interface RecordToggleButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const RecordToggleButton: React.FC<RecordToggleButtonProps> = ({
  onClick,
  className = '',
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  
  const handleClick = () => {
    setIsRecording(!isRecording);
    if (onClick) onClick();
  };
  
  return (
    <>
      <div className="button-container">
        <button 
          className={`record-toggle-button ${isRecording ? 'is-recording' : ''} ${className}`}
          onClick={handleClick}
          disabled={disabled}
          aria-pressed={isRecording}
        >
          <div className="content-container">
            {/* Microphone icon */}
            <svg 
              className="mic-icon" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_toggle_mic)">
                <path d="M12 15C13.66 15 14.99 13.66 14.99 12L15 6C15 4.34 13.66 3 12 3C10.34 3 9 4.34 9 6V12C9 13.66 10.34 15 12 15ZM17.3 12C17.3 15 14.76 17.1 12 17.1C9.24 17.1 6.7 15 6.7 12H5C5 15.42 7.72 18.23 11 18.72V22H13V18.72C16.28 18.24 19 15.42 19 12H17.3Z" fill="#FCFCFC"/>
              </g>
              <defs>
                <clipPath id="clip0_toggle_mic">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>

            {/* Audio bars */}
            <div className="bars">
              <div className="bar bar1"></div>
              <div className="bar bar2"></div>
              <div className="bar bar3"></div>
              <div className="bar bar4"></div>
            </div>
          </div>
        </button>
      </div>
      
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .record-toggle-button {
            transition: none !important;
          }
          .record-toggle-button * {
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
        
        .button-container {
          position: relative;
          width: 61px;
          height: 36px;
          display: flex;
          justify-content: flex-end;
        }
        
        .record-toggle-button {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 11px;
          
          width: 36px;
          height: 36px;
          
          background: #1E293B;
          border-radius: 18px;
          border: none;
          cursor: pointer;
          
          /* Position to right side for right-to-left expansion */
          transform-origin: right center;
          margin-left: auto;
          
          /* Transitions for smooth shape and color changes */
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, background, width;
          overflow: hidden;
        }
        
        .record-toggle-button.is-recording {
          width: 61px;
          background: #FECACA;
        }
        
        .record-toggle-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .content-container {
          position: relative;
          width: 27px;
          height: 27px;
          display: flex;
          justify-content: center;
          align-items: center;
          transform: translateZ(0);
          margin: 0 auto;
        }
        
        .mic-icon {
          position: absolute;
          width: 27px;
          height: 27px;
          opacity: 1;
          transition: opacity 0.3s ease;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          margin: auto;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        
        .is-recording .mic-icon {
          opacity: 0;
        }
        
        .bars {
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
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) translateZ(0);
          backface-visibility: hidden;
        }
        
        .is-recording .bars {
          opacity: 1;
        }
        
        .bar {
          border-radius: 18px;
          background: #EF4444;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .is-recording .bar {
          opacity: 1;
        }
        
        .bar1 {
          width: 3.4px;
          height: 9px;
          animation: bar1-animation 1.2s ease-in-out infinite;
          animation-play-state: paused;
        }
        
        .is-recording .bar1 {
          animation-play-state: running;
        }
        
        .bar2 {
          width: 3.4px;
          height: 18px;
          animation: bar2-animation 1.2s ease-in-out infinite 0.2s;
          animation-play-state: paused;
        }
        
        .is-recording .bar2 {
          animation-play-state: running;
        }
        
        .bar3 {
          width: 3.4px;
          height: 13.5px;
          animation: bar3-animation 1.2s ease-in-out infinite 0.4s;
          animation-play-state: paused;
        }
        
        .is-recording .bar3 {
          animation-play-state: running;
        }
        
        .bar4 {
          width: 3.4px;
          height: 6.75px;
          animation: bar4-animation 1.2s ease-in-out infinite 0.6s;
          animation-play-state: paused;
        }
        
        .is-recording .bar4 {
          animation-play-state: running;
        }
      `}</style>
    </>
  );
};

interface RetryButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  onClick,
  className = '',
  disabled = false
}) => {
  return (
    <>
      <button 
        className={`retry-button ${className}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Retry recording"
      >
        <div className="retry-content">
          <span className={`retry-text ${styles.OpenRundeMedium18}`}>
            Retry
          </span>
        </div>
      </button>
      
      <style jsx>{`
        .retry-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 11.25px;
          
          margin: 0 auto;
          width: 79.75px;
          height: 36px;
          
          background: #EF4444;
          border-radius: 18px;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
          
          /* No hover effects - removed all hover/active states */
        }
        
        .retry-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .retry-content {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 9px 16px;
          gap: 11px;
          
          width: 79.75px;
          height: 36px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .retry-text {
          width: auto;
          height: auto;
          
          color: #FCFCFC;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

interface ConfidenceBadgeProps {
  text: string;
  className?: string;
  variant: 'low' | 'medium' | 'high';
  width?: string;
  // External control for symbiotic behavior - when provided, overrides internal state
  isExternallyActive?: boolean;
  // Disable internal click behavior when externally controlled
  disableInternalClick?: boolean;
}

// Special props for HighConfidenceBadge where text is optional
interface HighConfidenceBadgeProps extends Omit<ConfidenceBadgeProps, 'variant' | 'text'> {
  text?: string;
}

const BaseConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  text,
  className = '',
  variant,
  width,
  isExternallyActive,
  disableInternalClick
}) => {
  const [isActive, setIsActive] = useState(false);
  
  // Use external state when provided, otherwise use internal state
  const effectiveActiveState = isExternallyActive !== undefined ? isExternallyActive : isActive;

  const variantStyles = {
    low: {
      background: 'var(--LowConBg)',
      color: 'var(--LowCon)',
      dotColor: 'var(--LowConDot)',
      borderColor: 'var(--LowCon)'
    },
    medium: {
      background: 'var(--MediumConBg)',
      color: 'var(--MediumCon)',
      dotColor: 'var(--MediumConDot)',
      borderColor: 'var(--MediumCon)'
    },
    high: {
      background: 'var(--HighConBg)',
      color: 'var(--HighCon)',
      dotColor: 'var(--HighConDot)',
      borderColor: 'var(--HighCon)'
    }
  };

  const deactivate = () => setIsActive(false);

  const handleClick = () => {
    // Only handle internal clicks if not externally controlled
    if (disableInternalClick) return;
    
    if (isActive) {
      // Clicking same badge - toggle off
      setIsActive(false);
      setGlobalActiveBadge(null);
    } else {
      // Clicking different badge - activate this one
      setIsActive(true);
      setGlobalActiveBadge(deactivate);
    }
  };

  // Handle clicking outside to reset - only if not externally controlled
  React.useEffect(() => {
    if (disableInternalClick) return;
    
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.confidence-badge')) {
        setIsActive(false);
        setGlobalActiveBadge(null);
      }
    };

    if (isActive) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [isActive, disableInternalClick]);

  return (
    <>
      <div 
        className={`${styles.container} confidence-badge confidence-badge-${variant} ${effectiveActiveState ? 'active' : ''} ${className}`}
        style={{
          '--badge-bg': variantStyles[variant].background,
          '--badge-border': variantStyles[variant].borderColor,
          '--badge-dot': variantStyles[variant].dotColor,
          width: width
        } as React.CSSProperties}
        onClick={handleClick}
      >
        <div className="confidence-dot"></div>
        <div 
          className={`confidence-text ${styles.OpenRundeMedium16}`}
          style={{
            color: variantStyles[variant].color
          }}
        >
          {text}
        </div>
      </div>
      
      <style jsx>{`
        .confidence-badge {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px 0px 6px;
          gap: 4px;
          
          width: fit-content;
          min-width: 40px;
          height: auto;
          
          background: var(--badge-bg);
          border: 1.5px solid transparent;
          border-radius: 16px;
          
          flex: none;
          order: 0;
          flex-grow: 0;
          transition: background-color 0.3s ease, border-color 0.3s ease;
          cursor: pointer;
        }
        
        /* Desktop hover behavior */
        @media (hover: hover) {
          .confidence-badge:hover {
            background-color: transparent;
            border-color: var(--badge-border);
          }
          
          .confidence-badge:hover .confidence-dot {
            background-color: var(--badge-dot);
          }
        }
        
        /* Active state for both mobile and desktop */
        .confidence-badge.active {
          background-color: transparent;
          border-color: var(--badge-border);
        }
        
        .confidence-badge.active .confidence-dot {
          background-color: var(--badge-dot);
        }
        
        .confidence-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          
          background: ${effectiveActiveState ? 'var(--badge-dot)' : '#FFFFFF'};
          opacity: 0.7;
          
          flex: none;
          order: 0;
          flex-grow: 0;
          transition: background-color 0.3s ease;
        }
        
        .confidence-text {
          width: auto;
          height: auto;
          min-height: 20px;
          white-space: nowrap;
          
          flex: none;
          order: 1;
          flex-grow: 1;
        }
      `}</style>
    </>
  );
};

export const LowConfidenceBadge: React.FC<Omit<ConfidenceBadgeProps, 'variant'>> = (props) => (
  <BaseConfidenceBadge {...props} variant="low" />
);

export const MediumConfidenceBadge: React.FC<Omit<ConfidenceBadgeProps, 'variant'>> = (props) => (
  <BaseConfidenceBadge {...props} variant="medium" />
);

export const HighConfidenceBadge: React.FC<HighConfidenceBadgeProps> = (props) => (
  <BaseConfidenceBadge {...{...props, text: "All words are 100% confident"}} variant="high" />
);

interface ConfidenceTooltipProps {
  percentage?: string;
  className?: string;
  variant: 'low' | 'medium';
}

const BaseConfidenceTooltip: React.FC<ConfidenceTooltipProps> = ({
  percentage,
  className = '',
  variant
}) => {
  const variantStyles = {
    low: {
      background: '#EF4444',
      width: '55.6px'
    },
    medium: {
      background: '#F59E0B',
      width: '54.6px'
    }
  };

  return (
    <>
      <div 
        className={`confidence-tooltip confidence-tooltip-${variant} ${className}`}
        style={{
          background: variantStyles[variant].background,
          width: variantStyles[variant].width
        }}
      >
        <div className="tooltip-dot"></div>
        <div className={`tooltip-text ${styles.OpenRundeMedium14}`}>
          {percentage}
        </div>
      </div>
      
      <style jsx>{`
        .confidence-tooltip {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 0px 0px 0px;
          gap: 4px;
          
          position: relative;
          height: 20px;
          width: auto;
          border-radius: 16px;
          
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .tooltip-dot {
          width: 4.2px;
          height: 4.2px;
          
          background: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .tooltip-text {
          height: auto;
          min-height: 20px;
          
          color: #FCFCFC;
          
          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

export const LowConfidenceTooltip: React.FC<Omit<ConfidenceTooltipProps, 'variant'>> = (props) => (
  <BaseConfidenceTooltip {...props} variant="low" percentage={props.percentage || "55%"} />
);

export const MediumConfidenceTooltip: React.FC<Omit<ConfidenceTooltipProps, 'variant'>> = (props) => (
  <BaseConfidenceTooltip {...props} variant="medium" percentage={props.percentage || "75%"} />
);

// Create a named object for default export
const deepButtons = {
  ClearButton, 
  ProcessingButton, 
  DropdownButton,
  CancelButton, 
  RecordButton, 
  RecordingButton, 
  RecordToggleButton,
  RetryButton,
  DisabledRecordButton,
  LowConfidenceBadge, 
  MediumConfidenceBadge,
  HighConfidenceBadge, 
  LowConfidenceTooltip, 
  MediumConfidenceTooltip
};

export default deepButtons; 