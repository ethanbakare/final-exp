import React from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { ClipRecordHeader } from './cliprecordheader';
import { ClipOffline } from './ClipOffline';
import { PortalContainerProvider } from './PortalContainerContext';

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
}

type RecordScreenState = 'recording' | 'transcribed' | 'offline';

interface ClipRecordScreenProps {
  state?: RecordScreenState;              // Current screen state
  transcriptionText?: string;             // Transcribed text (D3 state)
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
  transcriptionText = '',
  pendingClips = [],
  onBackClick,
  onNewClipClick,
  onNetworkChange,
  onTranscribeClick,
  onDeletePendingClick,
  className = ''
}) => {
  // Portal container for dropdowns (ClipOffline uses portals)
  const portalContainerRef = React.useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);

  // Set portal container after mount
  React.useEffect(() => {
    if (portalContainerRef.current) {
      setPortalContainer(portalContainerRef.current);
    }
  }, []);

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
          <div className="transcription-content">
            {/* D1: Recording state - Empty content area */}
            {/* Content area is empty while recording - transcription appears after processing */}
            
            {/* D3: Transcribed state - Show transcription text */}
            {state === 'transcribed' && transcriptionText && (
              <div className="transcription-text">
                <p className={styles.InterRegular16}>
                  {transcriptionText}
                </p>
              </div>
            )}
            
            {/* D4: Offline state - Show pending clips */}
            {state === 'offline' && pendingClips.length > 0 && (
              <div className="pending-clips">
                {pendingClips.map((clip) => (
                  <ClipOffline
                    key={clip.id}
                    title={clip.title}
                    time={clip.time}
                    status={clip.status}
                    fullWidth={true}
                    onRetryClick={() => onTranscribeClick?.(clip.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </PortalContainerProvider>
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
           D3: TRANSCRIPTION TEXT
           ============================================ */
        
        .transcription-text {
          width: 100%;
        }
        
        .transcription-text p {
          color: var(--ClipWhite);
          line-height: 1.6;
          margin: 0;
          white-space: pre-wrap;  /* Preserve line breaks */
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
      `}</style>
    </>
  );
};

// Default export
export default ClipRecordScreen;

