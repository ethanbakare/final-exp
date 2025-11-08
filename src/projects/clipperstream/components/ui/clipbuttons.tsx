import React from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

// ClipperStream Button Components
// Following deepButtons.tsx pattern with styled-jsx

/* ============================================
   INTERFACES
   ============================================ */

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

/* ============================================
   RECORD BUTTON - White button with "RECORD" text
   ============================================ */

export const RecordButton: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`record-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span className={`record-text ${styles.JetBrainsMonoRegular18}`}>
          RECORD
        </span>
      </button>
      
      <style jsx>{`
        .record-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 24px;
          gap: 11.25px;
          
          position: relative;
          width: 113px;
          height: 42px;
          
          background: var(--RecWhite);
          border-radius: 24px;
          border: none;
          cursor: pointer;
        }
        
        .record-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .record-text {
          /* Absolutely centered - prevents sliding during morphing */
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          
          width: 65px;
          height: 26px;
          
          text-align: center;
          color: var(--ClipBg);
          
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
   DONE BUTTON - Red button with "DONE" text
   ============================================ */

export const DoneButton: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`done-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span className={`done-text ${styles.JetBrainsMonoRegular18}`}>
          DONE
        </span>
      </button>
      
      <style jsx>{`
        .done-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 16px;
          gap: 11.25px;
          
          width: 76px;
          height: 42px;
          
          background: var(--RecRed);
          border-radius: 24px;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .done-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .done-text {
          width: 44px;
          height: 26px;
          
          text-align: center;
          color: var(--RecWhite);
          
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
   PROCESSING BUTTON - White button with rotating loader
   ============================================ */

export const ProcessingButton: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`processing-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="rotator">
          {/* Bottom spoke - Vector 73 */}
          <div className="spoke spoke-bottom"></div>
          {/* Left spoke - Vector 74 */}
          <div className="spoke spoke-left"></div>
          {/* Top spoke - Vector 75 */}
          <div className="spoke spoke-top"></div>
          {/* Right spoke - Vector 76 */}
          <div className="spoke spoke-right"></div>
          {/* Bottom-left diagonal - Vector 77 */}
          <div className="spoke spoke-bottom-left"></div>
          {/* Top-left diagonal - Vector 78 */}
          <div className="spoke spoke-top-left"></div>
          {/* Top-right diagonal - Vector 79 */}
          <div className="spoke spoke-top-right"></div>
          {/* Bottom-right diagonal - Vector 80 */}
          <div className="spoke spoke-bottom-right"></div>
        </div>
      </button>
      
      <style jsx>{`
        .processing-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 16px;
          gap: 11.25px;
          
          width: 76px;
          height: 42px;
          
          background: var(--RecWhite);
          border-radius: 24px;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .processing-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .rotator {
          /* Container for all spokes */
          position: relative;
          width: 17px;
          height: 17px;
          
          /* Rotation animation - same pattern as deepButtons.tsx */
          animation: rotate-spokes 1.5s linear infinite;
          transform-origin: center center;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* Rotation animation keyframes */
        @keyframes rotate-spokes {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Pause animation when button is disabled */
        .processing-button:disabled .rotator {
          animation-play-state: paused;
        }
        
        /* Base spoke style - small line/dash */
        .spoke {
          position: absolute;
          width: 1.75px;
          height: 4.75px;
          background: var(--ClipRecTrayBg);
          border-radius: 1px;
          left: 50%;
          top: 50%;
        }
        
        /* Top spoke - vertical line above center */
        .spoke-top {
          transform: translate(-50%, -50%) translateY(-7px) rotate(0deg);
        }
        
        /* Bottom spoke - vertical line below center */
        .spoke-bottom {
          transform: translate(-50%, -50%) translateY(7px) rotate(0deg);
        }
        
        /* Left spoke - horizontal line to the left */
        .spoke-left {
          transform: translate(-50%, -50%) translateX(-7px) rotate(90deg);
        }
        
        /* Right spoke - horizontal line to the right */
        .spoke-right {
          transform: translate(-50%, -50%) translateX(7px) rotate(90deg);
        }
        
        /* Top-right diagonal - 45° line */
        .spoke-top-right {
          transform: translate(-50%, -50%) translateX(4.95px) translateY(-4.95px) rotate(45deg);
        }
        
        /* Top-left diagonal - 135° line */
        .spoke-top-left {
          transform: translate(-50%, -50%) translateX(-4.95px) translateY(-4.95px) rotate(-45deg);
        }
        
        /* Bottom-right diagonal - 135° line */
        .spoke-bottom-right {
          transform: translate(-50%, -50%) translateX(4.95px) translateY(4.95px) rotate(-45deg);
        }
        
        /* Bottom-left diagonal - 45° line */
        .spoke-bottom-left {
          transform: translate(-50%, -50%) translateX(-4.95px) translateY(4.95px) rotate(45deg);
        }
      `}</style>
    </>
  );
};

/* ============================================
   PROCESSING BUTTON SVG - White button with SVG rotating loader (for comparison)
   ============================================ */

export const ProcessingButtonSVG: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`processing-button-svg ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="rotator-svg">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Vertical bottom spoke */}
            <path d="M10 15.5V18.5" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Horizontal left spoke */}
            <path d="M4.5 10L1.5 10" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Vertical top spoke */}
            <path d="M10 1.5V4.5" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Horizontal right spoke */}
            <path d="M18.5 10L15.5 10" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal bottom-left spoke */}
            <path d="M6.11 13.89L3.99 16.01" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal top-left spoke */}
            <path d="M6.11 6.11L3.99 3.99" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal top-right spoke */}
            <path d="M16.01 3.99L13.89 6.11" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
            {/* Diagonal bottom-right spoke */}
            <path d="M16.01 16.01L13.89 13.89" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
        </div>
      </button>
      
      <style jsx>{`
        .processing-button-svg {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 16px;
          gap: 11.25px;
          
          width: 76px;
          height: 42px;
          
          background: var(--RecWhite);
          border-radius: 24px;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .processing-button-svg:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .rotator-svg {
          /* Container for SVG - following deepButtons.tsx pattern */
          position: relative;
          width: 20px;
          height: 20px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .rotator-svg svg {
          /* Absolute positioning for stable rotation - same as deepButtons.tsx */
          position: absolute;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          
          /* Animation - ENABLED with EVEN dimensions (20×20 = center at 10px, 10px) */
          animation: rotate-spinner-svg 1.5s linear infinite;
          transform-origin: center center;
        }
        
        /* Rotation animation */
        @keyframes rotate-spinner-svg {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Pause animation when button is disabled */
        .processing-button-svg:disabled .rotator-svg {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
};

/* ============================================
   TIMER TEXT - Displays recording duration (e.g., "0:26")
   ============================================ */

export const TimerText: React.FC<{ time?: string; className?: string }> = ({ 
  time = '0:26',
  className = '' 
}) => {
  return (
    <>
      <div className={`timer ${className} ${styles.container}`}>
        <span className={`timer-text ${styles.JetBrainsMonoMedium18}`}>
          {time}
        </span>
      </div>
      
      <style jsx>{`
        .timer {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 0px;
          gap: 11.25px;
          
          width: 44px;
          height: 42px;
          
          border-radius: 24px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .timer-text {
          width: 44px;
          height: 26px;
          
          text-align: center;
          color: var(--ClipWhite);
          
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
   COPY BUTTON - Copy icon button (38×38px)
   ============================================ */

export const CopyButton: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`copy-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Copy"
      >
        <svg 
          className="copy-icon"
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M15.5 15H18.3C19.4201 15 19.98 15 20.4078 14.782C20.7841 14.5902 21.0905 14.2844 21.2822 13.908C21.5002 13.4802 21.5002 12.9202 21.5002 11.8V6.20002C21.5002 5.07992 21.5002 4.51986 21.2822 4.09204C21.0905 3.71572 20.7841 3.40973 20.4078 3.21799C19.98 3 19.4203 3 18.3002 3H12.7002C11.5801 3 11.0196 3 10.5918 3.21799C10.2155 3.40973 9.90973 3.71572 9.71799 4.09204C9.5 4.51986 9.5 5.07997 9.5 6.20007V9.00007M3.5 17.8001V12.2001C3.5 11.08 3.5 10.5199 3.71799 10.092C3.90973 9.71572 4.21547 9.40973 4.5918 9.21799C5.01962 9 5.58009 9 6.7002 9H12.3002C13.4203 9 13.98 9 14.4078 9.21799C14.7841 9.40973 15.0905 9.71572 15.2822 10.092C15.5002 10.5199 15.5002 11.0799 15.5002 12.2V17.8C15.5002 18.9202 15.5002 19.4802 15.2822 19.908C15.0905 20.2844 14.7841 20.5902 14.4078 20.782C13.98 21 13.4203 21 12.3002 21H6.7002C5.58009 21 5.01962 21 4.5918 20.782C4.21547 20.5902 3.90973 20.2844 3.71799 19.908C3.5 19.4802 3.5 18.9202 3.5 17.8001Z" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      <style jsx>{`
        .copy-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          width: 38px;
          height: 38px;
          
          background: var(--RecWhite_10);
          border-radius: 32px;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
          z-index: 0;
        }
        
        .copy-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .copy-icon {
          width: 24px;
          height: 24px;
          
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
   STRUCTURE BUTTON - Text alignment/structure icon button
   ============================================ */

export const StructureButton: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`structure-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Structure text"
      >
        <svg 
          className="structure-icon"
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M4.5 18H14.5M4.5 14H20.5M4.5 10H14.5M4.5 6H20.5" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      <style jsx>{`
        .structure-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          width: 38px;
          height: 38px;
          
          background: var(--RecWhite_10);
          border-radius: 32px;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
          z-index: 1;
        }
        
        .structure-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .structure-icon {
          width: 24px;
          height: 24px;
          
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
   CLOSE BUTTON - X icon close button
   ============================================ */

export const CloseButton: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`close-button ${className}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Close"
      >
        <svg 
          className="close-icon"
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M6 6L18 18M18 6L6 18" 
            stroke="#FFFFFF" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </svg>
      </button>
      
      <style jsx>{`
        .close-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          width: 38px;
          height: 38px;
          
          border-radius: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .close-icon {
          width: 24px;
          height: 24px;
          
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
   CHECK TICK BUTTON - Checkmark icon button (38×38px)
   ============================================ */

export const CheckTickButton: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`check-tick-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Check"
      >
        <svg 
          className="check-tick-icon"
          width="18" 
          height="13" 
          viewBox="0 0 18 13" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M1 6.65686L5.94975 11.6066L16.5568 1" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      <style jsx>{`
        .check-tick-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          width: 38px;
          height: 38px;
          
          background: var(--RecWhite_10);
          border-radius: 32px;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .check-tick-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .check-tick-icon {
          width: 18px;
          height: 13px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};
