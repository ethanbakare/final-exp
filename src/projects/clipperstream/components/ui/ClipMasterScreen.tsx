import React, { useState, useCallback, useRef, useEffect } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { ClipHomeScreen, Clip } from './ClipHomeScreen';
import { ClipRecordScreen, PendingClip } from './ClipRecordScreen';
import { RecordNavBarVarMorphing, RecordNavState } from './mainvarmorph';
import { ToastNotification } from './ClipToast';

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
  clips: Clip[];
  pendingClips?: PendingClip[];
  initialScreen?: ActiveScreen;
  className?: string;
}

/* ============================================
   CLIP MASTER SCREEN COMPONENT
   ============================================ */

export const ClipMasterScreen: React.FC<ClipMasterScreenProps> = ({
  clips,
  pendingClips = [],
  initialScreen = 'home',
  className = ''
}) => {
  // ============================================
  // STATE
  // ============================================
  
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
  
  // Toast notification state (for copy from RecordBar)
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  // Audio refs for recording
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [clips]);
  
  // Navigate back from record to home screen (via "Clips" button only)
  const handleBackClick = useCallback(() => {
    // Reset states
    setSelectedClip(null);
    setSelectedPendingClip(null);
    stopRecording();
    setActiveScreen('home');
  }, []);
  
  // Start fresh recording (via pencil/NewClip button in ClipRecordHeader)
  // Stays on ClipRecordScreen, just resets to record state
  const handleNewClipClick = useCallback(() => {
    setSelectedClip(null);
    setSelectedPendingClip(null);
    stopRecording();
    setAnimationVariant('fade');  // Use fade for direct transition back to record
    setRecordNavState('record');
    // Already on record screen, just reset state
  }, []);
  
  // ============================================
  // RECORDING HANDLERS (from mainmorph.tsx demo)
  // ============================================
  
  const handleRecordClick = async () => {
    // If already in complete state, this starts a new recording
    if (recordNavState === 'complete' || recordNavState === 'record') {
      // Navigate to record screen first
      setActiveScreen('record');
      setSelectedClip(null);
      setAnimationVariant('morph');  // Use morph for normal recording flow
      
      // Small delay to allow screen transition, then start recording
      setTimeout(async () => {
        await startRecording();
      }, 200);
    }
  };
  
  const startRecording = async () => {
    if (typeof window === 'undefined') return;
    
    if (!navigator?.mediaDevices?.getUserMedia) {
      alert('Your browser does not support audio recording.');
      return;
    }
    
    if (!window.isSecureContext) {
      alert('Microphone access requires a secure connection.');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextClass();
      await context.resume();
      audioContextRef.current = context;
      
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;
      
      setRecordNavState('recording');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone.');
    }
  };
  
  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    audioAnalyserRef.current = null;
    
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    
    setRecordNavState('record');
  };
  
  const handleCloseClick = () => {
    // Close just cancels recording - does NOT navigate back
    // Only way back to home is via "Clips" button in ClipRecordHeader
    stopRecording();
    // Stay on record screen, just reset to idle state
  };
  
  const handleDoneClick = () => {
    // Stop microphone but keep waveform frozen
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    audioAnalyserRef.current = null;
    
    setRecordNavState('processing');
    
    // Auto-transition to complete state after 3 seconds
    processingTimerRef.current = setTimeout(() => {
      setRecordNavState('complete');
      processingTimerRef.current = null;
    }, 3000);
  };
  
  const handleCopyClick = () => {
    // Copy content to clipboard if available
    if (selectedClip?.content) {
      navigator.clipboard.writeText(selectedClip.content);
    }
    console.log('Copy clicked - showing toast');
    // Always show copy toast for UI feedback
    setShowCopyToast(true);
  };
  
  // Dismiss toast
  const handleDismissToast = useCallback(() => {
    setShowCopyToast(false);
  }, []);
  
  const handleStructureClick = () => {
    console.log('Structure clicked');
    // TODO: Open structure panel
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
      }
    };
  }, []);

  // ============================================
  // DERIVED STATE
  // ============================================
  
  // Determine ClipRecordScreen state
  const getRecordScreenState = (): 'recording' | 'transcribed' | 'offline' => {
    // Viewing a specific pending clip (waiting/transcribing)
    if (selectedPendingClip) return 'offline';
    // Viewing a transcribed clip
    if (selectedClip?.content) return 'transcribed';
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
        {/* Toast Notification - Copy confirmation from RecordBar */}
        <ToastNotification
          isVisible={showCopyToast}
          onDismiss={handleDismissToast}
          type="copy"
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
            />
          </div>
          
          {/* Record Screen - Slides in from right */}
          <div className={`screen-slide record-screen ${activeScreen === 'record' ? 'active' : ''}`}>
            <ClipRecordScreen
              state={getRecordScreenState()}
              transcriptionText={selectedClip?.content}
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
            audioAnalyser={audioAnalyserRef.current}
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

