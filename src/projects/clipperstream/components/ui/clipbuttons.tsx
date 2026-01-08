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

/* ============================================
   RETRY BUTTON - Red retry button with icon and text (96×38px)
   Used for retry actions after failures
   ============================================ */

export const RetryButton: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`retry-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Retry"
      >
        <svg 
          className="retry-icon"
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M14 8H19V3" 
            stroke="#EF4444" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M19.4203 14.9954C18.2347 17.9297 15.3591 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C14.9642 4 17.5518 5.61212 18.934 8.00741" 
            stroke="#EF4444" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </svg>
        <span className={`retry-text ${styles.InterMedium16}`}>
          Retry
        </span>
      </button>
      
      <style jsx>{`
        .retry-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 12px 0px 10px;
          gap: 8px;
          
          width: 96px;
          height: 38px;
          
          background: var(--ClipRetryRed);
          border-radius: 32px;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .retry-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .retry-icon {
          width: 24px;
          height: 24px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .retry-text {
          width: 42px;
          height: 23px;
          
          text-align: center;
          color: var(--RecRed);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   VPN ISSUE BUTTON - Red warning button with icon and text (130×38px)
   Used to indicate VPN/network issues
   ============================================ */

export const VpnIssueButton: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`vpn-issue-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="VPN Issue"
      >
        <svg 
          className="vpn-issue-icon"
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Warning circle */}
          <circle 
            cx="12" 
            cy="12" 
            r="9" 
            stroke="#EF4444" 
            strokeWidth="1.8" 
            fill="none"
          />
          {/* Exclamation mark line */}
          <path 
            d="M12 7V13" 
            stroke="#EF4444" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          {/* Exclamation mark dot */}
          <circle 
            cx="12" 
            cy="16" 
            r="1" 
            fill="#EF4444"
          />
        </svg>
        <span className={`vpn-issue-text ${styles.InterMedium16}`}>
          VPN issue
        </span>
      </button>
      
      <style jsx>{`
        .vpn-issue-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 12px 0px 10px;
          gap: 8px;
          
          width: 130px;
          height: 38px;
          
          background: var(--ClipRetryRed);
          border-radius: 32px;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .vpn-issue-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .vpn-issue-icon {
          width: 24px;
          height: 24px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .vpn-issue-text {
          width: 76px;
          height: 23px;
          
          text-align: center;
          color: var(--RecRed);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   SCROLL BUTTON - Scroll down arrow button (38×38px)
   Used for scroll-to-bottom or scroll navigation features
   ============================================ */

export const ScrollButton: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`scroll-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Scroll"
      >
        <svg 
          className="scroll-icon"
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 5V19M12 19L18 13M12 19L6 13" 
            stroke="white" 
            strokeOpacity="0.8" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      <style jsx>{`
        .scroll-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          width: 38px;
          height: 38px;
          
          background: var(--ClipScrollBg);
          border-radius: 32px;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .scroll-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .scroll-icon {
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
   TRANSCRIBE BIG - Transcribe/refresh icon (24×24px)
   Shows transcription state - can be static or spinning
   spinning={true} = actively transcribing (rotating)
   spinning={false} = waiting to transcribe (static)
   ============================================ */

interface TranscribeBigProps extends ButtonProps {
  spinning?: boolean;  // Controls animation - default true for backward compatibility
}

export const TranscribeBig: React.FC<TranscribeBigProps> = ({ 
  onClick, 
  disabled = false,
  className = '',
  spinning = true  // Default true to maintain backward compatibility
}) => {
  return (
    <>
      <button 
        className={`transcribe-big ${spinning ? 'spinning' : 'static'} ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label={spinning ? "Transcribing" : "Waiting to transcribe"}
      >
        <div className="spinner-wrapper">
          <svg 
            className="transcribe-icon"
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M10.1123 15.775H5.39353V20.4937M13.8872 8.22506H18.6059V3.50635M5 9.17179C5.52914 7.86212 6.41508 6.72715 7.55711 5.89589C8.69915 5.06463 10.0519 4.57044 11.4608 4.46945C12.8697 4.36845 14.2785 4.6647 15.5274 5.32458C16.7763 5.98445 17.8145 6.98147 18.525 8.20229M19 14.8283C18.4709 16.1379 17.5849 17.2729 16.4429 18.1042C15.3009 18.9354 13.9487 19.4297 12.5398 19.5306C11.1309 19.6316 9.7216 19.3354 8.47268 18.6755C7.22376 18.0156 6.18517 17.0186 5.47464 15.7978" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
      
      <style jsx>{`
        .transcribe-big {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 3px;
          
          width: 24px;
          height: 24px;
          
          background: transparent;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .transcribe-big:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Rotation animation keyframes */
        @keyframes rotate-transcribe-big {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Spinner wrapper - contains the icon */
        .transcribe-big .spinner-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 24px;
          height: 24px;
        }
        
        /* Base icon styles */
        .transcribe-big .transcribe-icon {
          width: 24px;
          height: 24px;
          transform-origin: center center;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* Spinning state - apply rotation animation */
        .transcribe-big.spinning .transcribe-icon {
          animation: rotate-transcribe-big 1.5s linear infinite;
        }
        
        /* Static state - no animation */
        .transcribe-big.static .transcribe-icon {
          animation: none;
        }
        
        /* Pause animation when button is disabled (only relevant for spinning) */
        .transcribe-big.spinning:disabled .transcribe-icon {
          animation-play-state: paused;
        }
        
        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .transcribe-big .transcribe-icon {
            animation: none;
          }
        }
      `}</style>
    </>
  );
};

/* ============================================
   DELETE ICON - Trash bin icon (24×24px)
   Used to indicate permanent deletion action
   ============================================ */

export const DeleteIcon: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`delete-icon-button ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Delete"
      >
        <svg 
          className="delete-svg"
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M14 10V17M10 10L10 17M4 6H20M18 6V17.8C18 18.9201 18.0002 19.4802 17.7822 19.908C17.5905 20.2844 17.2841 20.5902 16.9078 20.782C16.48 21 15.9203 21 14.8002 21H9.2002C8.08009 21 7.51962 21 7.0918 20.782C6.71547 20.5902 6.40973 20.2844 6.21799 19.908C6 19.4802 6 18.9201 6 17.8V6H18ZM16 6H8C8 5.06812 8 4.60216 8.15224 4.23462C8.35523 3.74456 8.74432 3.35523 9.23438 3.15224C9.60192 3 10.0681 3 11 3H13C13.9319 3 14.3978 3 14.7654 3.15224C15.2554 3.35523 15.6447 3.74456 15.8477 4.23462C15.9999 4.60216 16 5.06812 16 6Z" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      <style jsx>{`
        .delete-icon-button {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 3px;
          
          width: 24px;
          height: 24px;
          
          background: transparent;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .delete-icon-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .delete-svg {
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
   WARNING ICON - Warning triangle icon (24×24px)
   Used to indicate errors, warnings, or VPN issues
   ============================================ */

export const WarningIcon: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`warning-icon ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Warning"
      >
        <svg 
          className="warning-svg"
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M4.37891 15.2001L5.24493 15.7001L4.37891 15.2001ZM9.22865 6.80011L8.36262 6.30011L8.36262 6.30011L9.22865 6.80011ZM14.7715 6.80011L15.6375 6.30011L15.6375 6.30011L14.7715 6.80011ZM19.6212 15.2001L20.4873 14.7001L20.4873 14.7001L19.6212 15.2001ZM11.1863 4.17291L11.5931 5.08645L11.5931 5.08645L11.1863 4.17291ZM12.8135 4.17291L12.4067 5.08645L12.4067 5.08645L12.8135 4.17291ZM3.89649 19.6181L3.3087 20.4271L3.3087 20.4271L3.89649 19.6181ZM3.08281 18.2091L4.07734 18.1045L3.08281 18.2091ZM20.1036 19.6181L20.6914 20.4271L20.6914 20.4271L20.1036 19.6181ZM20.9173 18.2091L21.9118 18.3136L21.9118 18.3136L20.9173 18.2091ZM12.0498 16.0001H13.0498C13.0498 15.4478 12.6021 15.0001 12.0498 15.0001V16.0001ZM12.0498 16.1001L12.0496 17.1001C12.3148 17.1001 12.5692 16.9948 12.7568 16.8073C12.9444 16.6197 13.0498 16.3653 13.0498 16.1001H12.0498ZM11.9502 16.1H10.9502C10.9502 16.6522 11.3978 17.0999 11.9499 17.1L11.9502 16.1ZM11.9502 16.0001V15.0001C11.3979 15.0001 10.9502 15.4478 10.9502 16.0001H11.9502ZM13 9.00006C13 8.44777 12.5523 8.00006 12 8.00006C11.4477 8.00006 11 8.44777 11 9.00006H12H13ZM11 13.0001C11 13.5523 11.4477 14.0001 12 14.0001C12.5523 14.0001 13 13.5523 13 13.0001H12H11ZM16.8499 20.0001V19.0001H7.15039V20.0001V21.0001H16.8499V20.0001ZM4.37891 15.2001L5.24493 15.7001L10.0947 7.30011L9.22865 6.80011L8.36262 6.30011L3.51288 14.7001L4.37891 15.2001ZM14.7715 6.80011L13.9055 7.30011L18.7552 15.7001L19.6212 15.2001L20.4873 14.7001L15.6375 6.30011L14.7715 6.80011ZM9.22865 6.80011L10.0947 7.30011C10.5593 6.4954 10.8739 5.95241 11.1427 5.57189C11.4145 5.1871 11.548 5.10653 11.5931 5.08645L11.1863 4.17291L10.7796 3.25936C10.231 3.5036 9.84039 3.94903 9.50913 4.41797C9.17486 4.89117 8.80746 5.52963 8.36262 6.30011L9.22865 6.80011ZM14.7715 6.80011L15.6375 6.30011C15.1926 5.52955 14.8252 4.89111 14.4908 4.41786C14.1594 3.9489 13.7687 3.50356 13.2202 3.25936L12.8135 4.17291L12.4067 5.08645C12.4519 5.10657 12.5855 5.18724 12.8574 5.572C13.1262 5.95248 13.4409 6.49548 13.9055 7.30011L14.7715 6.80011ZM11.1863 4.17291L11.5931 5.08645C11.852 4.97118 12.1478 4.97118 12.4067 5.08645L12.8135 4.17291L13.2202 3.25936C12.4435 2.91355 11.5563 2.91355 10.7796 3.25936L11.1863 4.17291ZM7.15039 20.0001V19.0001C6.22124 19.0001 5.59374 18.9991 5.12987 18.9565C4.66083 18.9135 4.52428 18.8381 4.48427 18.8091L3.89649 19.6181L3.3087 20.4271C3.79443 20.78 4.37539 20.8957 4.94715 20.9481C5.52409 21.0011 6.26068 21.0001 7.15039 21.0001V20.0001ZM4.37891 15.2001L3.51288 14.7001C3.06801 15.4706 2.69887 16.108 2.45625 16.6342C2.21581 17.1556 2.02554 17.7165 2.08829 18.3136L3.08281 18.2091L4.07734 18.1045C4.07216 18.0553 4.07522 17.8994 4.27245 17.4717C4.4675 17.0487 4.78037 16.5048 5.24493 15.7001L4.37891 15.2001ZM3.89649 19.6181L4.48427 18.8091C4.25484 18.6424 4.10694 18.3862 4.07734 18.1045L3.08281 18.2091L2.08829 18.3136C2.17718 19.1594 2.62101 19.9275 3.3087 20.4271L3.89649 19.6181ZM16.8499 20.0001V21.0001C17.7396 21.0001 18.4761 21.0011 19.0531 20.9481C19.6248 20.8957 20.2057 20.78 20.6914 20.4271L20.1036 19.6181L19.5159 18.8091C19.4758 18.8382 19.3393 18.9135 18.8703 18.9565C18.4065 18.9991 17.779 19.0001 16.8499 19.0001V20.0001ZM19.6212 15.2001L18.7552 15.7001C19.2198 16.5048 19.5326 17.0487 19.7277 17.4717C19.9249 17.8994 19.928 18.0553 19.9228 18.1045L20.9173 18.2091L21.9118 18.3136C21.9746 17.7165 21.7843 17.1556 21.5439 16.6342C21.3013 16.108 20.9321 15.4706 20.4873 14.7001L19.6212 15.2001ZM20.1036 19.6181L20.6914 20.4271C21.3791 19.9275 21.8229 19.1594 21.9118 18.3136L20.9173 18.2091L19.9228 18.1045C19.8932 18.3862 19.7453 18.6424 19.5159 18.8091L20.1036 19.6181ZM12.0498 16.0001H11.0498V16.1001H12.0498H13.0498V16.0001H12.0498ZM12.0498 16.1001L12.0501 15.1001L11.9504 15.1L11.9502 16.1L11.9499 17.1L12.0496 17.1001L12.0498 16.1001ZM11.9502 16.1H12.9502V16.0001H11.9502H10.9502V16.1H11.9502ZM11.9502 16.0001V17.0001H12.0498V16.0001V15.0001H11.9502V16.0001ZM12 9.00006H11V13.0001H12H13V9.00006H12Z" 
            fill="white"
          />
        </svg>
      </button>
      
      <style jsx>{`
        .warning-icon {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 3px;
          
          width: 24px;
          height: 24px;
          
          background: transparent;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .warning-icon:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .warning-svg {
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

