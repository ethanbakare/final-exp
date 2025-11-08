import React from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

// ClipperStream Mid-Level Button Components
// Contains: Generic buttons, header navigation, and state icons

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
   NO CLIPS FRAME ICON - Microphone icon in grey square (48×48px)
   ============================================ */

export const NoClipsFrameIcon: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <>
      <div className={`no-clips-frame ${className} ${styles.container}`}>
        <svg 
          className="no-clips-icon"
          width="25" 
          height="25" 
          viewBox="0 0 25 25" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12.5001 14.5C11.6667 14.5 10.9584 14.2083 10.3751 13.625C9.79174 13.0417 9.50008 12.3333 9.50008 11.5V5.5C9.50008 4.66667 9.79174 3.95833 10.3751 3.375C10.9584 2.79167 11.6667 2.5 12.5001 2.5C13.3334 2.5 14.0417 2.79167 14.6251 3.375C15.2084 3.95833 15.5001 4.66667 15.5001 5.5V11.5C15.5001 12.3333 15.2084 13.0417 14.6251 13.625C14.0417 14.2083 13.3334 14.5 12.5001 14.5ZM11.5001 20.5V18.425C9.96674 18.2083 8.65424 17.5583 7.56258 16.475C6.47091 15.3917 5.80841 14.075 5.57508 12.525C5.54174 12.2417 5.61674 12 5.80008 11.8C5.98341 11.6 6.21674 11.5 6.50008 11.5C6.78341 11.5 7.02091 11.5958 7.21258 11.7875C7.40424 11.9792 7.53341 12.2167 7.60008 12.5C7.83341 13.6667 8.41258 14.625 9.33758 15.375C10.2626 16.125 11.3167 16.5 12.5001 16.5C13.7001 16.5 14.7584 16.1208 15.6751 15.3625C16.5917 14.6042 17.1667 13.65 17.4001 12.5C17.4667 12.2167 17.5959 11.9792 17.7876 11.7875C17.9792 11.5958 18.2167 11.5 18.5001 11.5C18.7834 11.5 19.0167 11.6 19.2001 11.8C19.3834 12 19.4584 12.2417 19.4251 12.525C19.1917 14.0417 18.5334 15.35 17.4501 16.45C16.3667 17.55 15.0501 18.2083 13.5001 18.425V20.5C13.5001 20.7833 13.4042 21.0208 13.2126 21.2125C13.0209 21.4042 12.7834 21.5 12.5001 21.5C12.2167 21.5 11.9792 21.4042 11.7876 21.2125C11.5959 21.0208 11.5001 20.7833 11.5001 20.5Z" 
            fill="white" 
            fillOpacity="0.6"
          />
        </svg>
      </div>
      
      <style jsx>{`
        .no-clips-frame {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4px;
          
          width: 48px;
          height: 48px;
          
          background: var(--ClipGrey);
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .no-clips-icon {
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
   EMPTY CLIP FRAME ICON - Clipboard icon in grey square (48×48px)
   ============================================ */

export const EmptyClipFrameIcon: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <>
      <div className={`empty-clip-frame ${className} ${styles.container}`}>
        <svg 
          className="empty-clip-icon"
          width="25" 
          height="25" 
          viewBox="0 0 25 25" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M17.5 10.5C16.95 10.5 16.4792 10.3083 16.0875 9.925C15.6958 9.54167 15.5 9.06667 15.5 8.5V4.5C15.5 3.93333 15.6958 3.45833 16.0875 3.075C16.4792 2.69167 16.95 2.5 17.5 2.5C18.0667 2.5 18.5417 2.69167 18.925 3.075C19.3083 3.45833 19.5 3.93333 19.5 4.5V8.5C19.5 9.06667 19.3083 9.54167 18.925 9.925C18.5417 10.3083 18.0667 10.5 17.5 10.5ZM5.5 22.5C4.95 22.5 4.47917 22.3042 4.0875 21.9125C3.69583 21.5208 3.5 21.05 3.5 20.5V4.5C3.5 3.95 3.69583 3.47917 4.0875 3.0875C4.47917 2.69583 4.95 2.5 5.5 2.5H13.5V4.5H5.5V20.5H16.5V18.5H18.5V20.5C18.5 21.05 18.3042 21.5208 17.9125 21.9125C17.5208 22.3042 17.05 22.5 16.5 22.5H5.5ZM7.5 18.5V16.5H14.5V18.5H7.5ZM7.5 15.5V13.5H12.5V15.5H7.5ZM18.5 16.5H16.5V13.9C15.2167 13.6667 14.1458 13.0458 13.2875 12.0375C12.4292 11.0292 12 9.85 12 8.5H14C14 9.46667 14.3417 10.2917 15.025 10.975C15.7083 11.6583 16.5333 12 17.5 12C18.4833 12 19.3125 11.6583 19.9875 10.975C20.6625 10.2917 21 9.46667 21 8.5H23C23 9.85 22.575 11.0292 21.725 12.0375C20.875 13.0458 19.8 13.6667 18.5 13.9V16.5Z" 
            fill="white" 
            fillOpacity="0.6"
          />
        </svg>
      </div>
      
      <style jsx>{`
        .empty-clip-frame {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4px;
          
          width: 48px;
          height: 48px;
          
          background: var(--ClipGrey);
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .empty-clip-icon {
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
   RETURN TO HOME - Back arrow with "Clips" text (90×32px)
   ============================================ */

export const ReturnToHome: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`return-to-home ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="Return to clips"
      >
        <div className="clip-back-arrow">
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M15 19L8 12L15 5" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className={`clips-text ${styles.InterMedium18}`}>
          Clips
        </span>
      </button>
      
      <style jsx>{`
        .return-to-home {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px 15px 0px 0px;
          
          width: 90px;
          height: 32px;
          
          background: transparent;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
          z-index: 0;
        }
        
        .return-to-home:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .clip-back-arrow {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          width: 32px;
          height: 32px;
          
          border-radius: 4px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .clips-text {
          width: 43px;
          height: 22px;
          
          color: var(--ClipWhite);
          
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
   NEW CLIP FRAME - Pencil/edit icon button (32×32px)
   ============================================ */

export const NewClipFrame: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '' 
}) => {
  return (
    <>
      <button 
        className={`new-clip-frame ${className}`}
        onClick={onClick}
        disabled={disabled}
        aria-label="New clip"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M4 19.9999H20M4 19.9999L8 19.9998L18.8686 9.13122C19.2646 8.7352 19.4627 8.53716 19.5369 8.30883C19.6021 8.10799 19.6021 7.89172 19.5369 7.69088C19.4627 7.46255 19.2646 7.26449 18.8686 6.86848L17.1313 5.13122C16.7353 4.73521 16.5374 4.53719 16.3091 4.46301C16.1082 4.39775 15.8919 4.39775 15.691 4.46301C15.4627 4.53719 15.2646 4.7352 14.8686 5.13122L4 15.9999V18V19.9999Z" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      <style jsx>{`
        .new-clip-frame {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          width: 32px;
          height: 32px;
          
          border-radius: 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
          z-index: 1;
        }
        
        .new-clip-frame:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .new-clip-frame svg {
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
   ONLINE STATUS - "Online" text (dimmed white)
   ============================================ */

export const OnlineStatus: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <>
      <div className={`online-status ${className} ${styles.container}`}>
        <span className={styles.InterMedium18}>
          Online
        </span>
      </div>
      
      <style jsx>{`
        .online-status {
          position: relative;
          width: 55px;
          height: 22px;
          
          /* Inside auto layout */
          flex: none;
          order: 2;
          flex-grow: 0;
          z-index: 2;
        }
        
        .online-status span {
          color: var(--RecWhite_30);
        }
      `}</style>
    </>
  );
};

/* ============================================
   OFFLINE STATUS - "Offline" text (orange color)
   ============================================ */

export const OfflineStatus: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <>
      <div className={`offline-status ${className} ${styles.container}`}>
        <span className={styles.InterMedium18}>
          Offline
        </span>
      </div>
      
      <style jsx>{`
        .offline-status {
          position: relative;
          width: 58px;
          height: 22px;
          
          /* Inside auto layout */
          flex: none;
          order: 2;
          flex-grow: 0;
          z-index: 2;
        }
        
        .offline-status span {
          color: var(--ClipOfflineOrange);
        }
      `}</style>
    </>
  );
};

/* ============================================
   BUTTON OUTLINE - Outlined button with "Secondary" text
   ============================================ */

export const ButtonOutline: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '',
  fullWidth = false,
  children
}) => {
  return (
    <>
      <button 
        className={`button-outline ${fullWidth ? 'full-width' : ''} ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span className={`secondary-text ${styles.InterRegular16}`}>
          {children || 'Secondary'}
        </span>
      </button>
      
      <style jsx>{`
        .button-outline {
          /* Box model */
          box-sizing: border-box;
          
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 10px;
          gap: 6px;
          
          width: 111px;
          min-width: 111px;
          height: 35px;
          
          border: 1px solid var(--RecWhite_30);
          border-radius: 24px;
          background: transparent;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* Full width variant - uses flex-grow to fill available space */
        .button-outline.full-width {
          flex: 1;
          min-width: unset;
        }
        
        .button-outline:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .secondary-text {
          text-align: center;
          color: var(--RecWhite);
        }
      `}</style>
    </>
  );
};

/* ============================================
   BUTTON FULL - White filled button with "Primary" text
   ============================================ */

export const ButtonFull: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false,
  className = '',
  fullWidth = false,
  children
}) => {
  return (
    <>
      <button 
        className={`button-full ${fullWidth ? 'full-width' : ''} ${className} ${styles.container}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span className={`primary-text ${styles.InterRegular16}`}>
          {children || 'Primary'}
        </span>
      </button>
      
      <style jsx>{`
        .button-full {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 10px;
          gap: 6px;
          
          width: 111px;
          min-width: 111px;
          height: 35px;
          
          background: var(--RecWhite);
          border-radius: 24px;
          border: none;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        /* Full width variant - uses flex-grow to fill available space */
        .button-full.full-width {
          flex: 1;
          min-width: unset;
        }
        
        .button-full:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .primary-text {
          text-align: center;
          color: var(--ClipBg);
        }
      `}</style>
    </>
  );
};

