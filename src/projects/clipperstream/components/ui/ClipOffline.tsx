import React from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { TranscribeBig, RetryButton } from './clipbuttons';

// ClipOffline Component (PendingClip)
// Offline clip item with persistent background
// Three states: waiting (static icon), transcribing (spinning icon), failed (caution + retry button)
// Uses Search.tsx slide-in pattern for RetryButton animation

/* ============================================
   INTERFACES
   ============================================ */

type ClipOfflineStatus = 'waiting' | 'transcribing' | 'failed';

interface ClipOfflineProps {
  title?: string;            // Default: "Clip 001" (format: "Clip 00X")
  time?: string;             // Default: "0:26"
  status?: ClipOfflineStatus; // Default: 'waiting'
  onRetryClick?: () => void; // Called when retry button is clicked
  onTap?: () => void;        // Called when row is tapped (tap-to-skip)
  isTappable?: boolean;      // true = waiting (tappable), false = active attempt
  isActiveRequest?: boolean; // Controls icon spinning (true=spinning, false=static, undefined=spinning)
  fullWidth?: boolean;       // Default: false (361px), true = 100% width
  className?: string;
}

/* ============================================
   CAUTION ICON - Warning triangle (18×18px)
   Shown in failed state
   ============================================ */

const CautionIcon: React.FC = () => {
  return (
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 18 18" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Warning"
    >
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M8.99951 6.75004V9.75004Z" 
        fill="white"
      />
      <path 
        d="M3.28369 11.4001L3.79032 11.6926L3.28369 11.4001ZM6.921 5.10008L6.41437 4.80758L6.41437 4.80758L6.921 5.10008ZM11.0781 5.10008L11.5848 4.80758L11.5848 4.80758L11.0781 5.10008ZM14.7154 11.4001L15.2221 11.1076L15.2221 11.1076L14.7154 11.4001ZM8.38926 3.12968L8.6272 3.66411L8.6272 3.66411L8.38926 3.12968ZM9.60962 3.12968L9.37168 3.66411L9.37168 3.66411L9.60962 3.12968ZM2.92188 14.7136L2.57802 15.1868L2.57802 15.1868L2.92188 14.7136ZM2.31162 13.6568L2.89342 13.5956L2.31162 13.6568ZM15.0772 14.7136L15.4211 15.1868L15.4211 15.1868L15.0772 14.7136ZM15.6875 13.6568L16.2693 13.7179L16.2693 13.7179L15.6875 13.6568ZM9.03687 12H9.62187C9.62187 11.677 9.35995 11.415 9.03687 11.415V12ZM9.03687 12.075L9.03672 12.66C9.1919 12.6601 9.34073 12.5985 9.45047 12.4888C9.56021 12.379 9.62187 12.2302 9.62187 12.075H9.03687ZM8.96216 12.075H8.37716C8.37716 12.3981 8.63898 12.6599 8.96201 12.66L8.96216 12.075ZM8.96216 12V11.415C8.63907 11.415 8.37716 11.677 8.37716 12H8.96216ZM9.58451 6.75004C9.58451 6.42696 9.3226 6.16504 8.99951 6.16504C8.67643 6.16504 8.41451 6.42696 8.41451 6.75004H8.99951H9.58451ZM8.41451 9.75004C8.41451 10.0731 8.67643 10.335 8.99951 10.335C9.3226 10.335 9.58451 10.0731 9.58451 9.75004H8.99951H8.41451ZM12.6369 15V14.415H5.36231V15V15.585H12.6369V15ZM3.28369 11.4001L3.79032 11.6926L7.42762 5.39258L6.921 5.10008L6.41437 4.80758L2.77707 11.1076L3.28369 11.4001ZM11.0781 5.10008L10.5715 5.39258L14.2088 11.6926L14.7154 11.4001L15.2221 11.1076L11.5848 4.80758L11.0781 5.10008ZM6.921 5.10008L7.42762 5.39258C7.77444 4.79187 8.01475 4.37676 8.22175 4.08372C8.43051 3.78819 8.55184 3.69766 8.6272 3.66411L8.38926 3.12968L8.15132 2.59526C7.78143 2.75994 7.50966 3.06392 7.26613 3.40868C7.02083 3.75593 6.74963 4.2269 6.41437 4.80758L6.921 5.10008ZM11.0781 5.10008L11.5848 4.80758C11.2495 4.22685 10.9782 3.75589 10.7328 3.40861C10.4892 3.06384 10.2174 2.75992 9.84756 2.59526L9.60962 3.12968L9.37168 3.66411C9.44709 3.69768 9.56848 3.78826 9.77729 4.08378C9.98433 4.3768 10.2247 4.79192 10.5715 5.39258L11.0781 5.10008ZM8.38926 3.12968L8.6272 3.66411C8.8641 3.55863 9.13478 3.55863 9.37168 3.66411L9.60962 3.12968L9.84756 2.59526C9.30774 2.35491 8.69114 2.35491 8.15132 2.59526L8.38926 3.12968ZM5.36231 15V14.415C4.6687 14.415 4.18907 14.4145 3.83184 14.3817C3.47159 14.3486 3.33251 14.2888 3.26573 14.2403L2.92188 14.7136L2.57802 15.1868C2.90555 15.4248 3.3046 15.5082 3.72495 15.5468C4.14833 15.5856 4.69177 15.585 5.36231 15.585V15ZM3.28369 11.4001L2.77707 11.1076C2.44179 11.6883 2.16958 12.1586 1.99154 12.5447C1.81477 12.928 1.68751 13.3153 1.72983 13.7179L2.31162 13.6568L2.89342 13.5956C2.88479 13.5135 2.90253 13.3632 3.05401 13.0347C3.20423 12.7089 3.44352 12.2933 3.79032 11.6926L3.28369 11.4001ZM2.92188 14.7136L3.26573 14.2403C3.05585 14.0878 2.92051 13.8534 2.89342 13.5956L2.31162 13.6568L1.72983 13.7179C1.7916 14.3057 2.10006 14.8396 2.57802 15.1868L2.92188 14.7136ZM12.6369 15V15.585C13.3075 15.585 13.8509 15.5856 14.2742 15.5468C14.6946 15.5082 15.0936 15.4248 15.4211 15.1868L15.0772 14.7136L14.7334 14.2403C14.6666 14.2888 14.5275 14.3486 14.1673 14.3817C13.8101 14.4145 13.3305 14.415 12.6369 14.415V15ZM14.7154 11.4001L14.2088 11.6926C14.5556 12.2933 14.7949 12.7089 14.9451 13.0347C15.0966 13.3632 15.1143 13.5135 15.1057 13.5956L15.6875 13.6568L16.2693 13.7179C16.3116 13.3153 16.1844 12.928 16.0076 12.5447C15.8295 12.1586 15.5573 11.6883 15.2221 11.1076L14.7154 11.4001ZM15.0772 14.7136L15.4211 15.1868C15.8991 14.8396 16.2075 14.3057 16.2693 13.7179L15.6875 13.6568L15.1057 13.5956C15.0786 13.8534 14.9433 14.0878 14.7334 14.2403L15.0772 14.7136ZM9.03687 12H8.45187V12.075H9.03687H9.62187V12H9.03687ZM9.03687 12.075L9.03701 11.49L8.96231 11.49L8.96216 12.075L8.96201 12.66L9.03672 12.66L9.03687 12.075ZM8.96216 12.075H9.54716V12H8.96216H8.37716V12.075H8.96216ZM8.96216 12V12.585H9.03687V12V11.415H8.96216V12ZM8.99951 6.75004H8.41451V9.75004H8.99951H9.58451V6.75004H8.99951Z" 
        fill="white"
      />
    </svg>
  );
};

/* ============================================
   CLIP OFFLINE COMPONENT
   ============================================ */

export const ClipOffline: React.FC<ClipOfflineProps> = ({
  title = 'Clip 001',
  time = '0:26',
  status = 'waiting',
  onRetryClick,
  onTap,
  isTappable = false,
  isActiveRequest,
  fullWidth = false,
  className = ''
}) => {
  // PATTERN: Opacity crossfade (like MorphingCloseToCopyButton)
  // Both TranscribeBig and CautionIcon are always rendered, stacked absolutely
  // When status changes: one fades out (opacity 1→0) while other fades in (opacity 0→1)
  
  return (
    <>
      {/* Master Container - 361px or 100% width based on fullWidth prop */}
      <div 
        className={`pending-master-clip status-${status} ${fullWidth ? 'full-width' : ''} ${className} ${styles.container}`}
        onClick={isTappable ? onTap : undefined}
        style={{ cursor: isTappable ? 'pointer' : 'default' }}
      >
        
        {/* PendingClip - Flexible width, shrinks when RetryButton appears */}
        <div className="pending-clip">
          {/* Title */}
          <div className="pending-clip-title">
            <span className={styles.InterMedium16}>
              {title}
            </span>
          </div>
          
          {/* Time with Icon - Contains stacked icons for crossfade */}
          <div className="time-with-icon">
            {/* Time - Fades out in failed state */}
            <span className={`time-text ${styles.JetBrainsMonoMedium16}`}>
              {time}
            </span>
            
            {/* Icon Crossfade Container - Both icons stacked, swap via opacity */}
            <div className="icon-crossfade-wrapper">
              {/* TranscribeBig Layer - Visible in waiting/transcribing, hidden in failed */}
              <div className={`icon-layer transcribe-layer ${status !== 'failed' ? 'active' : ''} ${status === 'waiting' || (status === 'transcribing' && isActiveRequest === false) ? 'waiting-opacity' : ''}`}>
                <TranscribeBig spinning={status === 'transcribing' && isActiveRequest !== false} />
              </div>
              
              {/* CautionIcon Layer - Hidden in waiting/transcribing, visible in failed */}
              <div className={`icon-layer caution-layer ${status === 'failed' ? 'active' : ''}`}>
                <CautionIcon />
              </div>
            </div>
          </div>
        </div>
        
        {/* Retry Wrapper - Expands to create space for RetryButton (like cancel-wrapper) */}
        <div className="retry-wrapper">
          <div className="retry-button-container">
            <RetryButton onClick={onRetryClick} />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* ============================================
           ACCESSIBILITY
           ============================================ */
        
        @media (prefers-reduced-motion: reduce) {
          .pending-master-clip,
          .pending-master-clip * {
            transition: none !important;
          }
        }
        
        /* ============================================
           PENDING MASTER CLIP - Consistent outer wrapper
           Default: 361px × 40px, fullWidth: 100% × 40px
           ============================================ */
        
        .pending-master-clip {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: flex-start;
          align-items: center;
          padding: 0px;
          gap: 0px;  /* No gap - spacing handled by retry-wrapper margin */
          
          width: 361px;  /* Default fixed width */
          height: 40px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
          z-index: 0;
        }
        
        /* Full width mode - fills container */
        .pending-master-clip.full-width {
          width: 100%;
        }
        
        /* ============================================
           PENDING CLIP - Main content container
           Flexible width - shrinks when RetryButton appears
           ============================================ */
        
        .pending-clip {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          gap: 12px;
          
          /* Flexible width - fills available space */
          width: 100%;
          height: 40px;
          min-height: 40px;
          
          /* Persistent background */
          background: var(--ClipGrey); /* #252525 */
          border-radius: 8px;
          
          /* Smooth shrink animation (like search-bar-tracker) */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Inside auto layout */
          flex: 1;
          order: 0;
          flex-grow: 1;
        }
        
        /* ============================================
           PENDING CLIP TITLE
           Flexible width - fills space, truncates if needed
           ============================================ */
        
        .pending-clip-title {
          /* Flexible - fills available space */
          flex: 1;
          min-width: 0;  /* Allows flex item to shrink for ellipsis */
          height: 23px;
          
          /* Inside auto layout */
          order: 0;
        }
        
        .pending-clip-title span {
          /* Fill parent width */
          display: block;
          width: 100%;
          height: 23px;
          
          /* Always left-aligned - title doesn't change based on state */
          text-align: left;
          color: var(--ClipWhite); /* #FFFFFF */
          
          /* Truncate if needed */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* ============================================
           TIME WITH ICON
           Flexible width - expands based on content
           ============================================ */
        
        .time-with-icon {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          /* Flexible width - grows with content */
          width: auto;
          height: 24px;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        /* ============================================
           TIME TEXT - Fades out in failed state
           Flexible width - expands to fit content
           ============================================ */
        
        .time-text {
          /* Auto width - expands based on content */
          width: auto;
          height: 23px;
          
          text-align: center;
          color: var(--ClipWhite); /* #FFFFFF */
          
          /* Prevent line breaks */
          white-space: nowrap;
          
          /* Opacity transition for fade-out in failed state */
          opacity: 1;
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* Hide time text in failed state - fade out */
        .pending-master-clip.status-failed .time-text {
          opacity: 0;
          pointer-events: none;
        }
        
        /* ============================================
           ICON CROSSFADE WRAPPER
           Contains both icons stacked for opacity swap
           (Pattern from MorphingCloseToCopyButton)
           ============================================ */
        
        .icon-crossfade-wrapper {
          /* Fixed size container - prevents layout shift during swap */
          position: relative;
          width: 24px;   /* TranscribeBig is 24×24 */
          height: 24px;
          
          /* Not clickable - status indicator only */
          pointer-events: none;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        /* ============================================
           ICON LAYERS - Both icons stacked absolutely
           One fades out while other fades in
           ============================================ */
        
        .icon-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          
          /* Hidden by default */
          opacity: 0;
          
          /* Smooth opacity transition - same timing as retry button slide */
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Active icon layer is visible */
        .icon-layer.active {
          opacity: 1;
        }
        
        /* Waiting state - muted at 40% opacity */
        .icon-layer.waiting-opacity {
          opacity: 0.4;
        }
        
        /* Caution icon is smaller (18×18), center it in 24×24 container */
        .caution-layer {
          /* Icon centers itself via flexbox */
        }
        
        /* ============================================
           RETRY WRAPPER - Creates space for RetryButton
           Follows Search.tsx cancel-wrapper pattern
           Expands to make room; clips button during slide
           ============================================ */
        
        .retry-wrapper {
          /* Layout - button positioned at left edge */
          display: flex;
          flex-direction: row;
          justify-content: flex-start;
          align-items: center;
          
          /* SIZE: Collapsed by default */
          width: 0px;              /* Hidden when not failed */
          height: 40px;
          
          /* CRITICAL: Clips button when it's translated off-screen */
          overflow: hidden;
          
          /* Smooth width transition - creates space for button */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        /* Failed state: Wrapper expands to create space */
        .pending-master-clip.status-failed .retry-wrapper {
          width: 106px;  /* 10px gap + 96px button (RetryButton is 96px wide) */
        }
        
        /* ============================================
           RETRY BUTTON CONTAINER - TRUE SLIDE-IN using translateX
           Button ACTUALLY MOVES from right to left (like cancel-search)
           ============================================ */
        
        .retry-button-container {
          /* Layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          
          /* 10px left margin creates the gap */
          margin-left: 10px;
          
          /* Default: Button pushed off-screen to the RIGHT */
          transform: translateX(106px);  /* Pushed 106px = matches wrapper expansion distance */
          opacity: 0;
          
          /* TRUE SLIDE: translateX animates the button's position */
          transition: 
            transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Not clickable when hidden */
          pointer-events: none;
        }
        
        /* Failed state: Button SLIDES IN from right to left */
        .pending-master-clip.status-failed .retry-button-container {
          transform: translateX(0);  /* Slides to natural position */
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>
    </>
  );
};

// Create a named object for default export
const clipOffline = {
  ClipOffline
};

export default clipOffline;
