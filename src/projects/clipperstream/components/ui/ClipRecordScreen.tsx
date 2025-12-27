import React, { useEffect, useMemo } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { ClipRecordHeader } from './cliprecordheader';
import { ClipOffline } from './ClipOffline';
import { PortalContainerProvider } from './PortalContainerContext';
import { useScrollToBottom } from '../../hooks/useScrollToBottom';
import { ScrollButton } from './clipbuttons';
import { Clip } from './ClipHomeScreen';

// ClipRecordScreen Component
// Screen for recording and viewing transcriptions
// Contains: ClipRecordHeader (static) + TranscriptionContent (scrollable)
// RecordBar is NOT included - it lives in the parent ClipMasterScreen
//
// STATES:
// D1 (Recording): Empty content, waiting for transcription
// D3 (Transcribed): Shows transcription text, scrollable
// D4 (Offline): Shows pending ClipOffline items

/* ============================================
   INTERFACES
   ============================================ */

export interface PendingClip {
  id: string;
  title: string;  // Default format: "Clip 001", "Clip 002", etc.
  time: string;
  status?: 'waiting' | 'transcribing' | 'failed';
  isActiveRequest?: boolean;  // Controls icon spinning during retry attempts
}

type RecordScreenState = 'recording' | 'transcribed' | 'offline';

export interface ContentBlock {
  id: string;
  text: string;
  animate: boolean;
}

interface ClipRecordScreenProps {
  state?: RecordScreenState;              // Current screen state
  contentBlocks?: ContentBlock[];          // Content blocks to render (industry standard list pattern)
  selectedClip?: Clip;                    // Full clip for formatted/raw view toggle
  pendingClips?: PendingClip[];           // Offline clips (D4 state)
  onBackClick?: () => void;               // Navigate back to home
  onNewClipClick?: () => void;            // Create new clip
  onNetworkChange?: (status: 'online' | 'offline') => void;
  onTranscribeClick?: (id: string) => void;   // Transcribe pending clip
  onDeletePendingClick?: (id: string) => void; // Delete pending clip
  className?: string;
}

/* ============================================
   CLIP RECORD SCREEN COMPONENT
   ============================================ */

export const ClipRecordScreen: React.FC<ClipRecordScreenProps> = ({
  state = 'recording',
  contentBlocks = [],
  selectedClip,
  pendingClips = [],
  onBackClick,
  onNewClipClick,
  onNetworkChange,
  onTranscribeClick,
  // onDeletePendingClick, // Removed - not used yet
  className = ''
}) => {
  // Portal container for dropdowns (ClipOffline uses portals)
  const portalContainerRef = React.useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

  // Scroll-to-bottom hook for transcription content
  const {
    scrollRef,
    isAtBottom,
    scrollToBottom,
    scrollToPosition,
    checkIfAtBottom,
    resetScrollTracking
  } = useScrollToBottom();

  // Set portal container after mount
  React.useEffect(() => {
    if (portalContainerRef.current) {
      setPortalContainer(portalContainerRef.current);
    }
  }, []);

  // Determine which text to display based on clip's currentView preference
  const displayText = useMemo(() => {
    if (!selectedClip) {
      // No clip selected, show contentBlocks (raw transcription during recording)
      return contentBlocks;
    }

    // Clip selected - check currentView preference
    if (selectedClip.currentView === 'raw') {
      // Show raw text
      return [{
        id: 'raw-view',
        text: selectedClip.rawText || selectedClip.content || '',
        animate: false
      }];
    } else {
      // Show formatted text (default)
      return [{
        id: 'formatted-view',
        text: selectedClip.formattedText || selectedClip.content || '',
        animate: false
      }];
    }
  }, [selectedClip, contentBlocks]);

  // Track previous text length to detect when NEW content is added
  // We now use a single block with full combined text, so track text length instead of block count
  const prevTextLengthRef = React.useRef(0);

  // Auto-scroll logic based on contentBlocks changes
  useEffect(() => {
    if (contentBlocks.length === 0) {
      prevTextLengthRef.current = 0;
      return;
    }

    // Get current text length from displayText (which may be formatted or raw based on view)
    const currentTextLength = displayText.reduce((sum, block) => sum + block.text.length, 0);
    const prevTextLength = prevTextLengthRef.current;
    const isAppendingNewContent = prevTextLength > 0 && currentTextLength > prevTextLength;

    // Update ref for next comparison
    prevTextLengthRef.current = currentTextLength;

    if (!isAppendingNewContent) {
      // First transcription or viewing existing clip - scroll to top
      scrollToPosition(0, { behavior: 'instant' });
      return;
    }

    // NEW content was APPENDED (text got longer) - scroll to bottom to show it
    // Small delay to ensure DOM has updated
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [contentBlocks, displayText, scrollToPosition, scrollToBottom]);

  // Re-check scroll button visibility when content or state changes
  // This ensures button state is correct when navigating between clips
  useEffect(() => {
    // Small delay to ensure DOM has fully updated with new content
    const timer = setTimeout(() => {
      checkIfAtBottom();
    }, 100);

    return () => clearTimeout(timer);
  }, [contentBlocks, pendingClips, state, checkIfAtBottom]);

  // Reset scroll tracking when switching clips
  // This hides the scroll button initially when opening a new clip
  useEffect(() => {
    resetScrollTracking();
  }, [contentBlocks, resetScrollTracking]);

  return (
    <>
      <div className={`record-screen ${className} ${styles.container}`}>
        {/* Portal Container - Dropdowns render here */}
        <div ref={portalContainerRef} className="portal-container" />

        <PortalContainerProvider value={portalContainer}>
          {/* Header - Not scrollable, sits at top */}
          <ClipRecordHeader
            onBackClick={onBackClick}
            onNewClipClick={onNewClipClick}
            onNetworkChange={onNetworkChange}
          />

          {/* Content Area - Scrollable */}
          <div ref={scrollRef} className="transcription-content">
            {/* D1: Recording state - Empty content area */}
            {/* Content area is empty while recording - transcription appears after processing */}

            {/* D3: Transcribed state - Render content blocks (industry standard list pattern) */}
            {state === 'transcribed' && displayText.length > 0 && (
              <>
                {displayText.map((block) => (
                  <div
                    key={block.id}
                    className={block.animate ? 'content-block animate-text-intro-horizontal' : 'content-block'}
                  >
                    <p className={styles.InterRegular16}>
                      {block.text}
                    </p>
                  </div>
                ))}
              </>
            )}

            {/* D4: Offline state - Show existing text (if any) AND pending clips */}
            {state === 'offline' && (
              <>
                {/* Show existing content blocks first (for append mode) */}
                {displayText.length > 0 && displayText.map((block) => (
                  <div
                    key={block.id}
                    className={block.animate ? 'content-block animate-text-intro-horizontal' : 'content-block'}
                  >
                    <p className={styles.InterRegular16}>
                      {block.text}
                    </p>
                  </div>
                ))}

                {/* Then show pending clips below */}
                {pendingClips.length > 0 && (
                  <div className="pending-clips">
                    {pendingClips.map((clip) => (
                      <ClipOffline
                        key={clip.id}
                        title={clip.title}
                        time={clip.time}
                        status={clip.status}
                        isActiveRequest={clip.isActiveRequest}
                        fullWidth={true}
                        onRetryClick={() => onTranscribeClick?.(clip.id)}
                        onTap={() => onTranscribeClick?.(clip.id)}
                        isTappable={clip.status === 'transcribing' && !clip.isActiveRequest}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </PortalContainerProvider>

        {/* Scroll Button - Appears when content exceeds viewport and user not at bottom */}
        {!isAtBottom && (
          <div className="scroll-button-container">
            <ScrollButton onClick={scrollToBottom} />
          </div>
        )}
      </div>

      <style jsx>{`
        /* ============================================
           RECORD SCREEN - Main container
           Desktop: Fixed 393px (simulating phone)
           Mobile: Full width
           Note: RecordBar is NOT here - it's in ClipMasterScreen
           ============================================ */
        
        .record-screen {
          /* Layout */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          
          /* Dimensions */
          position: relative;
          width: 393px;
          height: 692px;  /* Full height minus RecordBar (852 - 160) */
          
          background: var(--ClipBg);  /* #1C1C1C */
          border-radius: 8px 8px 0 0;  /* Top corners only */
          
          /* Prevent expansion */
          overflow: hidden;
        }
        
        /* Mobile: Full width */
        @media (max-width: 768px) {
          .record-screen {
            width: 100%;
            height: calc(100vh - 160px);  /* Full height minus RecordBar */
            border-radius: 0;
          }
        }
        
        /* ============================================
           PORTAL CONTAINER
           ============================================ */
        
        .portal-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1000;
        }
        
        .portal-container :global(*) {
          pointer-events: auto;
        }
        
        /* ============================================
           TRANSCRIPTION CONTENT - Scrollable area
           Only this section scrolls - header stays fixed
           ============================================ */
        
        .transcription-content {
          /* Layout */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 16px 16px;  /* 16px all around */
          gap: 16px;
          
          /* Fill remaining space */
          flex: 1;
          width: 100%;
          box-sizing: border-box;
          
          /* SCROLLABLE */
          overflow-y: auto;
          overflow-x: hidden;
          
          /* Smooth scroll on iOS */
          -webkit-overflow-scrolling: touch;
        }
        
        /* Custom scrollbar styling */
        .transcription-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .transcription-content::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .transcription-content::-webkit-scrollbar-thumb {
          background: var(--RecWhite_20, rgba(255, 255, 255, 0.2));
          border-radius: 9999px;
        }
        
        .transcription-content::-webkit-scrollbar-thumb:hover {
          background: var(--RecWhite_40, rgba(255, 255, 255, 0.4));
        }
        
        /* Firefox scrollbar */
        .transcription-content {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        
        /* ============================================
           D3: CONTENT BLOCKS (Industry Standard List Pattern)
           Following AI Confidence Tracker pattern (Animation Style 3)
           ============================================ */
        
        /* Content block - Base styles */
        .content-block {
          width: 100%;
          margin-bottom: 0px; /* Spacing between blocks */
        }
        
        .content-block:last-child {
          margin-bottom: 0; /* No spacing after last block */
        }
        
        .content-block p {
          color: var(--ClipWhite);
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;  /* Preserve line breaks */
        }
        
        /* Text fade-in animation - Only applied to blocks with animate=true */
        .content-block.animate-text-intro-horizontal {
          animation: textIntroAnimationHorizontal 0.6s ease-out forwards;
          opacity: 0;
          filter: blur(3px);
          transform: translateX(-10px);
        }
        
        @keyframes textIntroAnimationHorizontal {
          0% {
            opacity: 0;
            filter: blur(3px);
            transform: translateX(-10px);
          }
          100% {
            opacity: 1;
            filter: blur(0);
            transform: translateX(0);
          }
        }
        
        /* ============================================
           D4: PENDING CLIPS LIST
           ============================================ */
        
        .pending-clips {
          /* Layout */
          display: flex;
          flex-direction: column;
          gap: 8px;
          
          width: 100%;
        }
        
        /* ============================================
           SCROLL BUTTON CONTAINER
           Positioned above record bar, centered horizontally
           ============================================ */
        
        .scroll-button-container {
          /* Positioning */
          position: absolute;
          bottom: 24px; /* 24px above record bar */
          left: 50%;
          transform: translateX(-50%);
          
          /* Layering */
          z-index: 200; /* Above content, below modals */
          
          /* Fade animation */
          opacity: 1;
          transition: opacity 0.2s ease-out;
          pointer-events: auto;
        }
      `}</style>
    </>
  );
};

// Default export
export default ClipRecordScreen;

