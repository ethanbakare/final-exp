import React from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

// ClipperStream Sub Button Components
// Smaller versions with thinner strokes (1.17px vs 2px)

/* ============================================
   INTERFACES
   ============================================ */

interface SubButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/* ============================================
   SHARED STYLES COMPONENT
   Shared between all sub buttons to follow DRY principle
   ============================================ */

const SharedSubButtonStyles = () => (
  <style jsx global>{`
    .sub-button-base {
      /* Auto layout */
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      padding: 0px;
      gap: 10px;
      
      width: 28px;
      height: 28px;
      
      background: transparent;
      border-radius: 24px;
      border: none;
      cursor: pointer;
      
      /* Inside auto layout */
      flex: none;
      order: 0;
      flex-grow: 0;
    }
    
    .sub-button-base:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .sub-icon-base {
      width: 18px;
      height: 18px;
      
      /* Inside auto layout */
      flex: none;
      order: 0;
      flex-grow: 0;
    }
  `}</style>
);

/* ============================================
   SUB COPY ICON - Smaller copy icon button (28×28px)
   ============================================ */

export const SubCopyIcon: React.FC<SubButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <SharedSubButtonStyles />
      <button 
        className={`sub-button-base ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Copy"
      >
        <svg 
          className="sub-icon-base"
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
      </button>
    </>
  );
};

/* ============================================
   SUB DELETE ROW - Delete icon button (28×28px)
   ============================================ */

export const SubDeleteRow: React.FC<SubButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = ''
}) => {
  return (
    <>
      <SharedSubButtonStyles />
      <button 
        className={`sub-button-base ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Delete"
      >
        <svg 
          className="sub-icon-base"
          width="14" 
          height="15" 
          viewBox="0 0 14 15" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M8.08496 5.83496V11.085M5.08496 5.83496L5.08496 11.085M0.584961 2.83496H12.585M11.085 2.83496V11.685C11.085 12.525 11.0851 12.9451 10.9216 13.266C10.7778 13.5482 10.548 13.7776 10.2658 13.9214C9.94493 14.0849 9.52519 14.085 8.68511 14.085H4.48511C3.64503 14.085 3.22468 14.0849 2.90381 13.9214C2.62157 13.7776 2.39226 13.5482 2.24845 13.266C2.08496 12.9451 2.08496 12.525 2.08496 11.685V2.83496H11.085ZM9.58496 2.83496H3.58496C3.58496 2.13605 3.58496 1.78658 3.69914 1.51093C3.85138 1.14338 4.1432 0.851383 4.51074 0.699142C4.7864 0.584961 5.13605 0.584961 5.83496 0.584961H7.33496C8.03387 0.584961 8.38333 0.584961 8.65899 0.699142C9.02653 0.851383 9.31846 1.14338 9.4707 1.51093C9.58488 1.78658 9.58496 2.13605 9.58496 2.83496Z" 
            stroke="white" 
            strokeWidth="1.17" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  );
};

/* ============================================
   SUB RENAME ICON - Smaller rename/edit icon button (28×28px)
   ============================================ */

export const SubRenameIcon: React.FC<SubButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <SharedSubButtonStyles />
      <button 
        className={`sub-button-base ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Rename"
      >
        <svg 
          className="sub-icon-base"
          width="13" 
          height="13" 
          viewBox="0 0 13 13" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M0.584961 9.27432V12.2743L3.58496 12.2743L11.7364 4.12283C12.0334 3.82582 12.182 3.67728 12.2376 3.50604C12.2866 3.3554 12.2866 3.1932 12.2376 3.04257C12.182 2.87133 12.0334 2.72278 11.7364 2.42577L10.4335 1.12283L10.433 1.12233C10.1363 0.825654 9.98792 0.677279 9.81677 0.621669C9.66614 0.572725 9.50385 0.572725 9.35322 0.621669C9.18197 0.67731 9.03345 0.825816 8.73643 1.12283L0.584961 9.27432Z" 
            stroke="white" 
            strokeWidth="1.17" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  );
};

/* ============================================
   SUB TRANSCRIBE ICON - Smaller transcribe/refresh icon button (28×28px)
   ============================================ */

export const SubTranscribeIcon: React.FC<SubButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <SharedSubButtonStyles />
      <button 
        className={`sub-button-base ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Transcribe"
      >
        <svg 
          className="sub-icon-base"
          width="18" 
          height="18" 
          viewBox="0 0 18 18" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M7.50024 12H3.75024V15.75M10.5002 6H14.2502V2.25M3.4375 6.75237C3.85801 5.71156 4.56207 4.8096 5.46966 4.14899C6.37724 3.48838 7.45226 3.09564 8.57193 3.01538C9.69161 2.93512 10.8112 3.17055 11.8037 3.69496C12.7962 4.21937 13.6213 5.01171 14.1859 5.9819M14.5634 11.2476C14.1429 12.2884 13.4388 13.1904 12.5312 13.851C11.6237 14.5116 10.5491 14.9044 9.42944 14.9846C8.30977 15.0649 7.18979 14.8294 6.19727 14.305C5.20474 13.7806 4.37936 12.9883 3.8147 12.0181" 
            stroke="white" 
            strokeWidth="1.17" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </>
  );
};

/* ============================================
   SUB TRANSCRIBE ICON SPINNING - Smaller transcribe icon with continuous rotation (28×28px)
   ============================================ */

export const SubTranscribeIconSpinning: React.FC<SubButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <SharedSubButtonStyles />
      <button 
        className={`sub-button-base sub-transcribe-spinning ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Transcribing"
      >
        <div className="spinner-wrapper">
          <svg 
            className="sub-icon-base spinning-icon"
            width="18" 
            height="18" 
            viewBox="0 0 18 18" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M7.50024 12H3.75024V15.75M10.5002 6H14.2502V2.25M3.4375 6.75237C3.85801 5.71156 4.56207 4.8096 5.46966 4.14899C6.37724 3.48838 7.45226 3.09564 8.57193 3.01538C9.69161 2.93512 10.8112 3.17055 11.8037 3.69496C12.7962 4.21937 13.6213 5.01171 14.1859 5.9819M14.5634 11.2476C14.1429 12.2884 13.4388 13.1904 12.5312 13.851C11.6237 14.5116 10.5491 14.9044 9.42944 14.9846C8.30977 15.0649 7.18979 14.8294 6.19727 14.305C5.20474 13.7806 4.37936 12.9883 3.8147 12.0181" 
              stroke="white" 
              strokeWidth="1.17" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
      
      <style jsx>{`
        /* Rotation animation keyframes */
        @keyframes rotate-transcribe {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Spinner wrapper - contains and rotates the icon */
        .sub-transcribe-spinning .spinner-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 18px;
          height: 18px;
        }
        
        /* Apply rotation animation to the SVG icon */
        .sub-transcribe-spinning .spinning-icon {
          animation: rotate-transcribe 1.5s linear infinite;
          transform-origin: center center;
        }
        
        /* Pause animation when button is disabled */
        .sub-transcribe-spinning:disabled .spinning-icon {
          animation-play-state: paused;
        }
        
        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .sub-transcribe-spinning .spinning-icon {
            animation: none;
          }
        }
      `}</style>
    </>
  );
};

/* ============================================
   SUB PENDING ICON SPINNING - Pending/reload icon with continuous rotation (28×28px)
   Duplicated from cliplist.tsx PendingIcon with rotation animation
   ============================================ */

export const SubPendingIconSpinning: React.FC<SubButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <SharedSubButtonStyles />
      <button 
        className={`sub-button-base sub-pending-spinning ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Pending"
      >
        <div className="spinner-wrapper">
          <svg 
            className="pending-icon spinning-icon"
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M5.05613 7.88726H2.69677V10.2466M6.94361 4.11229H9.30297V1.75293M2.5 4.58565C2.76457 3.93081 3.20754 3.36333 3.77856 2.9477C4.34957 2.53207 5.02593 2.28497 5.73039 2.23448C6.43485 2.18398 7.13924 2.33211 7.7637 2.66204C8.38816 2.99198 8.90723 3.49049 9.2625 4.1009M9.5 7.41389C9.23543 8.06873 8.79246 8.63621 8.22144 9.05184C7.65043 9.46747 6.97436 9.71458 6.2699 9.76508C5.56545 9.81558 4.8608 9.66743 4.23634 9.33749C3.61188 9.00756 3.09258 8.50907 2.73732 7.89867" 
              stroke="white" 
              strokeOpacity="0.4" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>
      
      <style jsx>{`
        /* Rotation animation keyframes */
        @keyframes rotate-pending {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Spinner wrapper - contains and rotates the icon */
        .sub-pending-spinning .spinner-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 12px;
          height: 12px;
        }
        
        /* Apply rotation animation to the SVG icon */
        .sub-pending-spinning .spinning-icon {
          animation: rotate-pending 1.5s linear infinite;
          transform-origin: center center;
        }
        
        .pending-icon {
          width: 12px;
          height: 12px;
        }
        
        /* Pause animation when button is disabled */
        .sub-pending-spinning:disabled .spinning-icon {
          animation-play-state: paused;
        }
        
        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .sub-pending-spinning .spinning-icon {
            animation: none;
          }
        }
      `}</style>
    </>
  );
};

/* ============================================
   SUB CHECKMARK ICON - Checkmark/tick icon button (28×28px)
   ============================================ */

export const SubCheckmarkIcon: React.FC<SubButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <SharedSubButtonStyles />
      <button 
        className={`sub-button-base ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Confirm"
      >
        <svg 
          className="sub-icon-base"
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
      </button>
    </>
  );
};

/* ============================================
   SUB CLOSE ICON - X/close icon button (28×28px)
   ============================================ */

export const SubCloseIcon: React.FC<SubButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <SharedSubButtonStyles />
      <button 
        className={`sub-button-base ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Dismiss"
      >
        <svg 
          className="sub-icon-base"
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
    </>
  );
};

