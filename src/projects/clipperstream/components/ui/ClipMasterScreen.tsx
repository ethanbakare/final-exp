import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { ClipHomeScreen, Clip } from './ClipHomeScreen';
import { ClipRecordScreen, PendingClip } from './ClipRecordScreen';
import { RecordNavBarVarMorphing, RecordNavState } from './mainvarmorph';
import { ToastNotification } from './ClipToast';
import { useClipRecording } from '../../hooks/useClipRecording';
import { getClips, createClip, updateClip, initializeClips, getNextClipNumber } from '../../services/clipStorage';
import { logger } from '../../utils/logger';

const log = logger.scope('ClipMasterScreen');

// ClipMasterScreen Component
// Parent orchestrator that manages screen transitions and shared RecordBar
// Handles: Screen switching (home ↔ record), RecordBar state, navigation
//
// ARCHITECTURE:
// ┌─────────────────────────────────────┐
// │ Screen Container (slide animation)  │
// │  ┌─────────────┐  ┌─────────────┐  │
// │  │ClipHome     │↔ │ClipRecord   │  │
// │  │Screen       │  │Screen       │  │
// │  └─────────────┘  └─────────────┘  │
// ├─────────────────────────────────────┤
// │ RecordBar (RecordNavBarMorphing)    │  ← FIXED, never moves
// └─────────────────────────────────────┘

/* ============================================
   INTERFACES
   ============================================ */

type ActiveScreen = 'home' | 'record';

interface SelectedClip {
  id: string;
  title: string;
  content?: string;
}

interface ClipMasterScreenProps {
  pendingClips?: PendingClip[];
  initialScreen?: ActiveScreen;
  className?: string;
}

/* ============================================
   CLIP MASTER SCREEN COMPONENT
   ============================================ */

export const ClipMasterScreen: React.FC<ClipMasterScreenProps> = ({
  pendingClips = [],
  initialScreen = 'home',
  className = ''
}) => {
  // ============================================
  // STATE
  // ============================================
  
  // Clips management (loaded from storage)
  const [clips, setClips] = useState<Clip[]>([]);
  
  // Current active screen
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(initialScreen);
  
  // RecordBar state (managed here since it persists across screens)
  const [recordNavState, setRecordNavState] = useState<RecordNavState>('record');
  
  // Selected clip (when viewing a transcribed clip)
  const [selectedClip, setSelectedClip] = useState<SelectedClip | null>(null);
  
  // Selected pending clip (when viewing a clip waiting to be transcribed)
  const [selectedPendingClip, setSelectedPendingClip] = useState<PendingClip | null>(null);
  
  // Track if search is active (to hide RecordBar)
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Track animation variant for RecordNavBar
  // 'fade': Direct transitions (viewing existing clip, or resetting to record)
  // 'morph': Normal recording flow (record → recording → processing → complete)
  const [animationVariant, setAnimationVariant] = useState<'morph' | 'fade'>('morph');
  
  // Network status for ClipRecordScreen
  const [, setIsOnline] = useState(true); // Using blank identifier for unused state variable
  
  // Toast notification state
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const hasShownTranscriptionToast = useRef(false);
  
  // Recording mode tracking
  const [currentClipId, setCurrentClipId] = useState<string | null>(null);
  const [isAppendMode, setIsAppendMode] = useState(false);
  const [appendBaseContent, setAppendBaseContent] = useState<string>('');
  
  // Content blocks for rendering (industry standard list pattern)
  const [contentBlocks, setContentBlocks] = useState<Array<{
    id: string;
    text: string;
    animate: boolean;
  }>>([]);
  
  // Recording hook - handles audio recording and transcription
  const {
    isRecording,
    audioBlob,
    audioAnalyser,
    isTranscribing,
    transcription,
    transcriptionError,
    startRecording: startRecordingHook,
    stopRecording: stopRecordingHook,
    transcribeRecording,
    reset: resetRecording,
  } = useClipRecording();
  
  // Processing timer (for UI transition delay)
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ============================================
  // DERIVED STATE - Content for clipboard
  // ============================================
  
  /**
   * Content to copy - joins all content blocks
   * This is what the Copy button should use
   */
  const copyableContent = useMemo(() => {
    return contentBlocks.map(block => block.text).join('\n\n');
  }, [contentBlocks]);

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  
  // Navigate from home to record screen (when clicking a clip)
  const handleClipClick = useCallback((clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      if (clip.content) {
        // Transcribed clip - show in complete state
        setSelectedClip({
          id: clip.id,
          title: clip.title,
          content: clip.content
        });
        setSelectedPendingClip(null);
        // Reset append mode flags - viewing existing clip shows full combined text
        setIsAppendMode(false);
        setCurrentClipId(null);
        setAppendBaseContent('');
        resetRecording(); // Clear any lingering transcription from hook
        // Set content blocks - single block, no animation
        setContentBlocks([{
          id: clip.id,
          text: clip.content,
          animate: false
        }]);
        setAnimationVariant('fade');  // Use fade for direct to complete
        setRecordNavState('complete');  // Show Copy + Record + Structure
        setActiveScreen('record');
      } else {
        // Pending clip (no content yet) - show in waiting/transcribing state
        setSelectedClip(null);
        // Determine status based on clip.status
        const pendingStatus = clip.status === 'transcribing' ? 'transcribing' : 'waiting';
        // Find index for "Clip 00X" naming (1-indexed)
        const clipIndex = clips.filter(c => !c.content).findIndex(c => c.id === clip.id) + 1;
        const clipNumber = String(clipIndex).padStart(3, '0');
        setSelectedPendingClip({
          id: clip.id,
          title: `Clip ${clipNumber}`,
          time: '0:26',  // Duration would come from audio file in production
          status: pendingStatus
        });
        setAnimationVariant('fade');
        setRecordNavState('record');  // Show record button (not complete)
        setActiveScreen('record');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips]); // Only run when clips change (intentionally omit resetRecording)
  
  // Navigate back from record to home screen (via "Clips" button only)
  const handleBackClick = useCallback(() => {
    // Navigate back from record to home screen (via "Clips" button only)
    // Reset all recording state and return to home
    setIsAppendMode(false);
    setCurrentClipId(null);
    setAppendBaseContent('');
    setSelectedClip(null);
    setSelectedPendingClip(null);
    setContentBlocks([]); // Clear content blocks
    resetRecording(); // This clears transcription from the hook
    setRecordNavState('record'); // Reset to default record state for next time
    setActiveScreen('home');
  }, [resetRecording]);
  
  // Start fresh recording (via pencil/NewClip button in ClipRecordHeader)
  // Stays on ClipRecordScreen, just resets to record state
  const handleNewClipClick = useCallback(() => {
    setIsAppendMode(false);
    setCurrentClipId(null);
    setAppendBaseContent('');
    setSelectedClip(null);
    setSelectedPendingClip(null);
    setContentBlocks([]); // Clear content blocks for new recording
    resetRecording();
    setAnimationVariant('fade');  // Use fade for direct transition back to record
    setRecordNavState('record');
    // Already on record screen, just reset state
  }, [resetRecording]);
  
  // ============================================
  // RECORDING HANDLERS (from mainmorph.tsx demo)
  // ============================================
  
  const handleRecordClick = async () => {
    // CRITICAL: Clear previous transcription FIRST to prevent flash/duplication
    resetRecording();
    
    // Case 1: Recording from Home screen → NEW clip
    if (activeScreen === 'home') {
      setIsAppendMode(false);
      setCurrentClipId(null);
      setAppendBaseContent('');
      setContentBlocks([]); // Clear blocks for new recording
      setActiveScreen('record');
      setAnimationVariant('morph');
      
      // Small delay to allow screen transition, then start recording
      setTimeout(() => startRecordingHook(), 200);
    }
    
    // Case 2: Recording from existing clip with content → APPEND mode
    else if (activeScreen === 'record' && selectedClip?.content) {
      // CRITICAL: Update appendBaseContent to CURRENT full content
      // If we just finished a recording, selectedClip.content has the combined text
      // If we're viewing an old clip, selectedClip.content has the old text
      setIsAppendMode(true);
      setCurrentClipId(selectedClip.id);
      setAppendBaseContent(selectedClip.content); // This is the NEW base for next append
      // ✓ DON'T collapse contentBlocks - keep existing block structure
      // This prevents visual shift when clicking Record again
      // New block will be added when transcription arrives
      setAnimationVariant('morph'); // CRITICAL: Reset to morph for recording animation
      
      setTimeout(() => startRecordingHook(), 200);
    }
    
    // Case 3: Recording from record screen (no existing content) → NEW clip
    else {
      setIsAppendMode(false);
      setCurrentClipId(null);
      setAppendBaseContent('');
      setContentBlocks([]); // Clear blocks for new recording
      setAnimationVariant('morph'); // CRITICAL: Ensure morph variant for recording
      
      setTimeout(() => startRecordingHook(), 200);
    }
  };
  
  const handleCloseClick = () => {
    // Close just cancels recording - does NOT navigate back
    // Only way back to home is via "Clips" button in ClipRecordHeader
    stopRecordingHook();
    
    // DECISION: Where should we return?
    // If we have existing content (viewing a transcribed clip) → return to 'complete' state
    // If no content (fresh recording cancelled) → return to 'record' state
    
    if (selectedClip?.content || transcription) {
      // Return to complete state with existing buttons visible
      // [Copy] [Record] [Structure] - allows user to access existing content
      setRecordNavState('complete');
      setAnimationVariant('morph'); // Animate the transition (X→Copy, Done→Structure)
    } else {
      // Return to empty record state
      // [Record] only - no content to display
      setRecordNavState('record');
    }
  };
  
  const handleDoneClick = () => {
    // Stop recording (hook handles cleanup)
    stopRecordingHook();
    
    // Show processing state immediately
    setRecordNavState('processing');
    
    // Note: Transcription will be triggered by useEffect when audioBlob is ready
    // The processing→complete transition will happen after transcription completes
  };
  
  const handleCopyClick = () => {
    // Copy displayedcontent to clipboard - uses derived copyableContent
    if (copyableContent) {
      navigator.clipboard.writeText(copyableContent);
      // Always show copy toast for manual copy
      setShowCopyToast(true);
    }
  };
  
  // Dismiss toast
  const handleDismissToast = useCallback(() => {
    setShowCopyToast(false);
  }, []);
  
  const handleStructureClick = () => {
    // TODO: Open structure panel
  };
  
  // ============================================
  // STORAGE & CALLBACKS
  // ============================================
  
  // Load clips from storage on mount
  useEffect(() => {
    const storedClips = getClips();
    if (storedClips.length === 0) {
      // First visit - initialize with 2-3 demo clips
      const demoClips = initializeClips();
      setClips(demoClips);
    } else {
      setClips(storedClips);
    }
  }, []);
  
  // Refresh clips from storage
  const refreshClips = useCallback(() => {
    setClips(getClips());
  }, []);
  
  // ============================================
  // EFFECTS - Auto-transcription and state management
  // ============================================
  
  // Update recordNavState based on hook's isRecording
  useEffect(() => {
    if (isRecording) {
      setRecordNavState('recording');
    }
  }, [isRecording]);
  
  // Auto-trigger transcription when audioBlob is ready
  useEffect(() => {
    if (audioBlob && !isTranscribing && !transcription && recordNavState === 'processing') {
      transcribeRecording();
    }
  }, [audioBlob, isTranscribing, transcription, recordNavState, transcribeRecording]);
  
  // Background title generation with opacity fade
  const generateTitleInBackground = useCallback(async (clipId: string, transcriptionText: string) => {
    log.debug('Starting background title generation', { 
      clipId, 
      textLength: transcriptionText.length 
    });
    
    try {
      const response = await fetch('/api/clipperstream/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcriptionText })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        log.warn(`Title generation failed (${response.status})`, errorData);
        // Keep the fallback "Clip 001" title - app continues working
        return;
      }
      
      const { title } = await response.json();
      log.info('AI title generated, updating clip', { clipId, title });
      
      // Update clip with AI-generated title
      // ClipListItem's opacity transition handles the fade automatically
      const updatedClip = updateClip(clipId, { title });
      if (updatedClip) {
        refreshClips();
        // If still viewing this clip, update selectedClip
        if (currentClipId === clipId) {
          setSelectedClip(updatedClip);
        }
      }
    } catch (error) {
      log.warn('Title generation failed', error);
      // Keep the "Clip 001" fallback title - app continues working
    }
  }, [currentClipId, refreshClips]);
  
  // Handle transcription completion - Combine + Save
  useEffect(() => {
    if (transcription && recordNavState === 'processing') {
      log.debug('Processing transcription', {
        mode: isAppendMode ? 'append' : 'new',
        transcriptionLength: transcription.length
      });
      
      // COMBINE LOGIC HERE (ClipMasterScreen owns this business logic)
      let finalContent: string;
      
      if (isAppendMode && appendBaseContent) {
        // Append new text to existing with paragraph break
        finalContent = appendBaseContent + '\n\n' + transcription;
        log.debug('Appending to existing clip', { 
          existingLength: appendBaseContent.length,
          newLength: transcription.length 
        });
        
        // Update content blocks - add new block with animation
        setContentBlocks(prevBlocks => [
          ...prevBlocks, // Keep existing block(s)
          {
            id: `new-${Date.now()}`, // Unique ID for new block
            text: transcription,
            animate: true // Animate the new block only
          }
        ]);
      } else {
        // New clip - use transcription as-is
        finalContent = transcription;
        log.debug('Creating new clip with transcription');
        
        // Set content blocks - single block with animation
        setContentBlocks([{
          id: `clip-${Date.now()}`,
          text: transcription,
          animate: true
        }]);
      }
      
      // Auto-copy final content (silent fail is fine per user's request)
      navigator.clipboard.writeText(finalContent).catch(() => {});
      
      // Show toast once per session
      if (!hasShownTranscriptionToast.current) {
        setShowCopyToast(true);
        hasShownTranscriptionToast.current = true;
      }
      
      // APPEND MODE: Update existing clip
      if (isAppendMode && currentClipId) {
        log.info('Updating existing clip', { clipId: currentClipId });
        const updatedClip = updateClip(currentClipId, {
          content: finalContent,
          date: new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })
        });
        
        if (updatedClip) {
          refreshClips();
          setSelectedClip(updatedClip);
          // Don't update contentBlocks here - let the animation finish
          // Blocks will persist as-is, showing the split view
        }
      }
      
      // NEW MODE: Create new clip with sequential number
      else {
        const nextNumber = getNextClipNumber(getClips());
        log.info('Creating new clip', { title: nextNumber });
        const newClip = createClip(finalContent, nextNumber);
        refreshClips();
        setCurrentClipId(newClip.id);
        setSelectedClip(newClip); // Show user their new clip
        
        // Don't update contentBlocks here - let the animation finish
        // Block will persist as-is with the animation
        
        // Generate AI title in background (replaces "Clip 001")
        generateTitleInBackground(newClip.id, finalContent);
      }
      
      // Transition to complete state (shows Copy + Record + Structure buttons)
      setRecordNavState('complete');
    }
  }, [transcription, recordNavState, isAppendMode, currentClipId, appendBaseContent, refreshClips, generateTitleInBackground]);
  
  // Handle transcription errors
  useEffect(() => {
    if (transcriptionError) {
      log.error('Transcription error', transcriptionError);
      setShowErrorToast(true);
      setRecordNavState('record'); // Reset to record state on error
    }
  }, [transcriptionError]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Capture ref value in cleanup scope (React best practice)
      const timer = processingTimerRef.current;
      if (timer) {
        clearTimeout(timer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally access ref in cleanup - standard cleanup pattern

  // ============================================
  // DERIVED STATE
  // ============================================
  
  // Determine ClipRecordScreen state
  const getRecordScreenState = (): 'recording' | 'transcribed' | 'offline' => {
    // Viewing a specific pending clip (waiting/transcribing)
    if (selectedPendingClip) return 'offline';
    // Viewing a transcribed clip (from selected clip or new transcription)
    if (transcription || selectedClip?.content) return 'transcribed';
    // Default: recording state (empty screen, ready to record)
    return 'recording';
  };
  
  // NOTE: isOnline will be useful in future for:
  // - Auto-triggering transcription when going from offline→online
  // - Updating clip status: 'waiting' → 'transcribing'
  // But it should NOT control which content is displayed
  
  // Get pending clips to display (either selected one or all pending)
  const getDisplayPendingClips = (): PendingClip[] => {
    if (selectedPendingClip) {
      // Viewing a single pending clip
      return [selectedPendingClip];
    }
    // Show all pending clips
    return pendingClips;
  };
  
  // Should RecordBar be hidden?
  const shouldHideRecordBar = isSearchActive;

  return (
    <>
      <div className={`master-screen ${className} ${styles.container}`}>
        {/* Toast Notifications */}
        <ToastNotification
          isVisible={showCopyToast}
          onDismiss={handleDismissToast}
          type="copy"
        />
        
        <ToastNotification
          isVisible={showErrorToast}
          onDismiss={() => setShowErrorToast(false)}
          type="error"
          text={transcriptionError || 'No audio recorded'}
        />
        
        {/* Screen Container - Slides between screens */}
        <div className="screen-container">
          {/* Home Screen - Slides out left when record is active */}
          <div className={`screen-slide home-screen ${activeScreen === 'home' ? 'active' : ''}`}>
            <ClipHomeScreen
              clips={clips}
              onClipClick={handleClipClick}
              onRecordClick={handleRecordClick}
              onSearchActiveChange={setIsSearchActive}
              onClipsChange={refreshClips}
            />
          </div>
          
          {/* Record Screen - Slides in from right */}
          <div className={`screen-slide record-screen ${activeScreen === 'record' ? 'active' : ''}`}>
            <ClipRecordScreen
              state={getRecordScreenState()}
              contentBlocks={contentBlocks}
              pendingClips={getDisplayPendingClips()}
              onBackClick={handleBackClick}
              onNewClipClick={handleNewClipClick}
              onNetworkChange={(status) => setIsOnline(status === 'online')}
            />
          </div>
        </div>
        
        {/* Record Bar - Fixed at bottom, persists across screen transitions */}
        <div className={`record-bar ${shouldHideRecordBar ? 'hidden' : ''}`}>
          <RecordNavBarVarMorphing
            navState={recordNavState}
            variant={animationVariant}
            onRecordClick={handleRecordClick}
            onCloseClick={handleCloseClick}
            onCopyClick={handleCopyClick}
            onDoneClick={handleDoneClick}
            onStructureClick={handleStructureClick}
            audioAnalyser={audioAnalyser}
          />
        </div>
      </div>
      
      <style jsx>{`
        /* ============================================
           MASTER SCREEN - Full simulated phone container
           Desktop: Fixed 393×852px
           Mobile: Full viewport
           ============================================ */
        
        .master-screen {
          /* Layout */
          display: flex;
          flex-direction: column;
          position: relative;
          
          /* Desktop: Fixed phone dimensions */
          width: 393px;
          height: 852px;
          min-height: 852px;
          max-height: 852px;
          
          background: var(--ClipBg);
          border-radius: 8px;
          
          /* Prevent content overflow */
          overflow: hidden;
        }
        
        /* Mobile: Full viewport */
        @media (max-width: 768px) {
          .master-screen {
            width: 100%;
            height: 100vh;
            min-height: 100vh;
            max-height: 100vh;
            border-radius: 0;
          }
        }
        
        /* ============================================
           SCREEN CONTAINER - Holds both screens for sliding
           ============================================ */
        
        .screen-container {
          /* Fill space above RecordBar */
          flex: 1;
          min-height: 0;
          position: relative;
          overflow: hidden;
        }
        
        /* ============================================
           SCREEN SLIDES - Individual screen wrappers
           ============================================ */
        
        .screen-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          
          /* Slide animation */
          transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        
        /* Home screen: Default position, slides left when inactive */
        .screen-slide.home-screen {
          transform: translateX(0);
        }
        
        .screen-slide.home-screen:not(.active) {
          transform: translateX(-100%);
        }
        
        /* Record screen: Starts right, slides in when active */
        .screen-slide.record-screen {
          transform: translateX(100%);
        }
        
        .screen-slide.record-screen.active {
          transform: translateX(0);
        }
        
        /* ============================================
           RECORD BAR - Fixed at bottom
           ============================================ */
        
        .record-bar {
          /* Layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-start;
          padding: 24px 12px 0px;
          gap: 10px;
          
          /* Dimensions */
          width: 100%;
          height: 160px;
          
          /* Styling */
          background: var(--ClipRecTrayBg);
          border-radius: 16px 16px 0px 0px;
          
          /* Fixed at bottom */
          flex: none;
          
          /* Clip content when collapsing */
          overflow: hidden;
          
          /* Animation - height collapse + opacity fade */
          opacity: 1;
          transition: 
            height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            padding 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Hidden state - collapses height and fades out */
        .record-bar.hidden {
          height: 0;
          padding: 0;
          opacity: 0;
          pointer-events: none;
        }
        
        /* ============================================
           ACCESSIBILITY
           ============================================ */
        
        @media (prefers-reduced-motion: reduce) {
          .screen-slide,
          .record-bar {
            transition: none !important;
          }
        }
      `}</style>
    </>
  );
};

// Default export
export default ClipMasterScreen;

