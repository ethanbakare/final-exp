import React, { useState, useEffect } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { ReturnToHome, NewClipFrame } from './midClipButtons';
import { MorphingOnlineOfflineStatus } from './clipmorphingbuttons';

// ClipRecordHeader Component
// Header section for clip recording/viewing page with navigation and network status
// Automatically detects network status changes

/* ============================================
   INTERFACES
   ============================================ */

interface ClipRecordHeaderProps {
  onBackClick?: () => void;              // Return to clips list
  onNewClipClick?: () => void;           // Create new clip
  onNetworkChange?: (state: 'online' | 'offline') => void;  // Network status callback
  className?: string;
}

/* ============================================
   CLIP RECORD HEADER COMPONENT
   ============================================ */

export const ClipRecordHeader: React.FC<ClipRecordHeaderProps> = ({
  onBackClick,
  onNewClipClick,
  onNetworkChange,
  className = ''
}) => {
  // Auto-detect network status using browser API
  // Default to 'online' for SSR, will sync with actual value in useEffect
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    // Sync with actual browser state after mount (handles SSR hydration)
    if (typeof navigator !== 'undefined') {
      const actualStatus = navigator.onLine ? 'online' : 'offline';
      setNetworkStatus(actualStatus);
      // Also notify parent of initial state
      if (onNetworkChange) {
        onNetworkChange(actualStatus);
      }
    }

    // Handle online event
    const handleOnline = () => {
      setNetworkStatus('online');
      if (onNetworkChange) {
        onNetworkChange('online');
      }
    };

    // Handle offline event
    const handleOffline = () => {
      setNetworkStatus('offline');
      if (onNetworkChange) {
        onNetworkChange('offline');
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onNetworkChange]);

  return (
    <>
      <div className={`trans-header ${className} ${styles.container}`}>
        {/* ClipBar - Navigation row with 3 items */}
        <div className="clip-bar">
          {/* Return to Home - Left side (z-index: 0) */}
          <div className="return-wrapper">
            <ReturnToHome onClick={onBackClick} />
          </div>
          
          {/* Network Status - Center, absolutely positioned (z-index: 1) */}
          <div className="status-wrapper">
            <MorphingOnlineOfflineStatus 
              state={networkStatus}
              onChange={onNetworkChange}
            />
          </div>
          
          {/* New Clip Frame - Right side (z-index: 2) */}
          <div className="new-clip-wrapper">
            <NewClipFrame onClick={onNewClipClick} />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* ============================================
           TRANS HEADER - Main container
           Same responsive pattern as cliphomeheader.tsx
           ============================================ */
        
        .trans-header {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 38px 16px 0px 16px;  /* 38px top, 16px horizontal */
          gap: 0px;
          
          /* Positioning context for gradient pseudo-element */
          position: relative;
          
          width: 100%;  /* Full width - handles its own padding */
          max-width: 393px;  /* Desktop: Cap for showcase display */
          box-sizing: border-box;  /* Padding included in width */
          min-height: 70px;
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* Gradient overlay - follows header bottom edge automatically */
        .trans-header::after {
          content: '';
          position: absolute;
          bottom: -24px;  /* Positioned just below header - moves with it */
          left: 0;
          right: 10px;  /* Don't cover scrollbar area */
          height: 24px;
          
          /* Fade from solid background to transparent */
          background: linear-gradient(
            to bottom,
            var(--ClipBg) 0%,
            transparent 100%
          );
          
          pointer-events: none;  /* Don't block clicks */
          z-index: 1;  /* Low z-index - just above content, below scrollbar */
        }
        
        /* Mobile: Full width, no cap - adapts to actual phone screen */
        @media (max-width: 768px) {
          .trans-header {
            max-width: none;
          }
        }
        
        /* ============================================
           CLIP BAR - Navigation row (3 items)
           Modern CSS Grid layout for perfect centering
           ============================================ */
        
        .clip-bar {
          /* CSS Grid - Industry best practice for 3-column layouts */
          display: grid;
          grid-template-columns: 1fr auto 1fr;  /* Left flexible | Center fixed | Right flexible */
          align-items: center;
          padding: 0px;
          gap: 10px;
          isolation: isolate;  /* Creates stacking context for z-index */
          
          width: 100%;  /* Fill parent container for responsive design */
          height: 32px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;  /* Stretch to parent width */
          flex-grow: 0;
        }
        
        /* ============================================
           RETURN WRAPPER - Left navigation (z-index: 0)
           ============================================ */
        
        .return-wrapper {
          /* Grid positioning */
          justify-self: start;  /* Align to left edge of first column */
          
          /* Layout */
          display: flex;
          align-items: center;
          
          /* Z-index for stacking */
          z-index: 0;
        }
        
        /* ============================================
           STATUS WRAPPER - Center status indicator (z-index: 1)
           Automatically centered in middle grid column
           ============================================ */
        
        .status-wrapper {
          /* Grid positioning */
          grid-column: 2;           /* Explicitly place in middle column */
          justify-self: center;     /* Center within column */
          
          /* Layout */
          display: flex;
          align-items: center;
          justify-content: center;
          
          /* Z-index for stacking */
          z-index: 1;
        }
        
        /* ============================================
           NEW CLIP WRAPPER - Right button (z-index: 2)
           ============================================ */
        
        .new-clip-wrapper {
          /* Grid positioning */
          justify-self: end;        /* Align to right edge of third column */
          
          /* Layout */
          display: flex;
          align-items: center;
          
          /* Z-index for stacking */
          z-index: 2;
        }
      `}</style>
    </>
  );
};

// Default export
export default ClipRecordHeader;

