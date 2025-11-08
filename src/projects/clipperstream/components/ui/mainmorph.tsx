import React from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { MorphingCloseToCopyButton, MorphingDoneProcessingStructureButton } from './recordNavMorphingButtons';
import { MorphingCopyToCheckButton } from './clipmorphingbuttons';
import { WaveClipper } from './waveClipper';
import { LiveTimer } from './liveTimer';
import { RecordButton } from './clipbuttons';

/* ============================================
   RECORD NAV BAR MORPHING
   
   Main orchestrator component (like TranscriptBoxNav.tsx pattern)
   Manages morphing between 4 states with modular button components
   
   STATES:
   1. record      - Small white pill with "RECORD" text (113×42px)
   2. recording   - Full navbar with Close + WaveClipper + Timer + Done (366×50px)
   3. processing  - Full navbar with Close + WaveClipper (frozen) + Timer (frozen) + Processing spinner (366×50px)
   4. complete    - Full navbar with Copy + RecordButton + Structure (366×50px, transparent bg)
   
   ARCHITECTURE:
   - ORCHESTRATOR PATTERN: Like IntegratedDeepCard.tsx
   - ROUTER/LAYOUT: Like TranscriptBoxNav.tsx
   - PURE COMPONENTS: From recordNavMorphingButtons.tsx, waveClipper.tsx, liveTimer.tsx
   
   ============================================ */

// Navigation states
export type RecordNavState = 'record' | 'recording' | 'processing' | 'complete';

interface RecordNavBarMorphingProps {
  navState: RecordNavState;
  onRecordClick?: () => void;
  onCloseClick?: () => void;
  onCopyClick?: () => void;
  onDoneClick?: () => void;
  onStructureClick?: () => void;
  audioAnalyser?: AnalyserNode | null;
  className?: string;
}

export const RecordNavBarMorphing: React.FC<RecordNavBarMorphingProps> = ({
  navState,
  onRecordClick,
  onCloseClick,
  onCopyClick,
  onDoneClick,
  onStructureClick,
  audioAnalyser,
  className = ''
}) => {
  
  // ============================================
  // STATE MAPPING FUNCTIONS (Like TranscriptBoxNav.tsx)
  // ============================================
  
  // Map high-level navState to left button state
  const getLeftButtonState = (): 'close' | 'copy' => {
    switch (navState) {
      case 'recording':
      case 'processing':
        return 'close';
      case 'complete':
        return 'copy';
      default:
        return 'close';
    }
  };

  // Map high-level navState to right button state
  const getRightButtonState = (): 'done' | 'processing' | 'structure' => {
    switch (navState) {
      case 'recording':
        return 'done';
      case 'processing':
        return 'processing';
      case 'complete':
        return 'structure';
      default:
        return 'done';
    }
  };

  // Determine container background color
  const getContainerBackground = () => {
    switch (navState) {
      case 'record':
        return 'var(--RecWhite)';
      case 'recording':
      case 'processing':
        return 'var(--ClipRecNavBarBg)';
      case 'complete':
        return 'transparent';
    }
  };

  // Determine if timer should be visible
  const shouldShowTimer = (): boolean => {
    return navState === 'recording' || navState === 'processing';
  };

  // Determine if center should show wave or record button
  const getCenterContent = (): 'wave' | 'record' | null => {
    if (navState === 'recording' || navState === 'processing') {
      return 'wave';
    } else if (navState === 'complete') {
      return 'record';
    }
    return null;  // Hidden in initial 'record' state
  };

  return (
    <>
      {/* VISUAL WRAPPER - Morphing container (extracted from RecordMorphing.tsx) */}
      <div className="morph-container">
        <div 
          className={`record-morphing-button state-${navState} ${className} ${styles.container}`}
          style={{ background: getContainerBackground() }}
          onClick={navState === 'record' ? onRecordClick : undefined}
        >
          
          {/* ============================================
              RECORD STATE LAYER - Initial small button
              Visible only in 'record' state
              ============================================ */}
          <div className="record-content">
            <span className={`record-text ${styles.JetBrainsMonoRegular18}`}>
              RECORD
            </span>
          </div>

          {/* ============================================
              NAV STATE LAYER - Full navbar layout
              Visible in 'recording', 'processing', 'complete' states
              ============================================ */}
          <div className="nav-content">
            
            {/* LEFT SECTION: Close ↔ Copy ↔ Check Button */}
            <div className="nav-left">
              {navState === 'complete' ? (
                <MorphingCopyToCheckButton onClick={onCopyClick} />
              ) : (
                <MorphingCloseToCopyButton
                  state={getLeftButtonState()}
                  onCloseClick={onCloseClick}
                  onCopyClick={onCopyClick}
                />
              )}
            </div>
            
            {/* CENTER SECTION: WaveClipper ↔ RecordButton */}
            <div className="nav-center">
              {/* WaveClipper layer - visible in recording/processing */}
              <div className={`center-layer ${getCenterContent() === 'wave' ? 'active' : ''}`}>
                <div className="audio-container">
                  <WaveClipper 
                    audioAnalyser={audioAnalyser}
                    isRecording={navState === 'recording'}
                    isFrozen={navState === 'processing' || navState === 'complete'}
                  />
                </div>
              </div>
              
              {/* RecordButton layer - visible in complete state */}
              <div className={`center-layer ${getCenterContent() === 'record' ? 'active' : ''}`}>
                <RecordButton onClick={onRecordClick} />
              </div>
            </div>
            
            {/* RIGHT SECTION: Timer + Action Button (Done → Processing → Structure) */}
            <div className="nav-right">
              {/* Timer wrapper - fades out and collapses in complete state */}
              <div 
                className="timer-wrapper"
                style={{ 
                  opacity: shouldShowTimer() ? 1 : 0,
                  transition: 'opacity 0.1s ease',  /* Fades at half the button morph speed for better choreography */
                  pointerEvents: shouldShowTimer() ? 'auto' : 'none'
                }}
              >
                <LiveTimer 
                  isRunning={navState === 'recording'}
                  isFrozen={navState === 'processing'}
                />
              </div>
              
              {/* Action button morphing: Done → Processing → Structure */}
              <div className="button-width-tracker">
                <MorphingDoneProcessingStructureButton
                  state={getRightButtonState()}
                  onDoneClick={onDoneClick}
                  onStructureClick={onStructureClick}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* ============================================
           ACCESSIBILITY
           ============================================ */
        
        @media (prefers-reduced-motion: reduce) {
          .record-morphing-button,
          .record-morphing-button *,
          .center-layer {
            transition: none !important;
            animation: none !important;
          }
        }
        
        /* ============================================
           OUTER CONTAINER
           Reserves space for largest state (366×50px)
           Prevents layout shift during morph
           ============================================ */
        
        .morph-container {
          position: relative;
          width: 366px;        /* RecordNavBar width */
          height: 50px;        /* RecordNavBar height */
          display: flex;
          justify-content: center;  /* Center alignment for bidirectional expansion */
          align-items: center;
        }
        
        /* ============================================
           MORPHING BUTTON CONTAINER
           Main element that changes dimensions
           Expands from CENTER (bidirectional growth)
           ============================================ */
        
        .record-morphing-button {
          /* Layout */
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 24px;
          border: none;
          cursor: pointer;
          
          /* RECORD STATE - Initial smaller pill (113×42px) */
          width: 113px;
          height: 42px;
          background: var(--RecWhite);
          border-radius: 24px;
          
          /* CENTER-ORIGIN EXPANSION 
             Key for bidirectional growth - both sides expand equally */
          transform-origin: center center;
          margin: auto;
          
          /* SMOOTH TRANSITIONS */
          transition: 
            all 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            background 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, background, width, height, padding, border-radius;
          overflow: hidden;
        }
        
        /* RECORDING & PROCESSING STATES - Expanded nav bar (366×50px) */
        .record-morphing-button.state-recording,
        .record-morphing-button.state-processing {
          width: 366px;
          height: 50px;
          padding: 4px;
          background: var(--ClipRecNavBarBg);
          border-radius: 32px;
          justify-content: space-between;
          cursor: default;
        }
        
        /* COMPLETE STATE - Same size as navbar but transparent background */
        .record-morphing-button.state-complete {
          width: 366px;
          height: 50px;
          padding: 4px;
          background: transparent;
          border-radius: 32px;
          justify-content: space-between;
          cursor: default;
        }
        
        /* ============================================
           RECORD CONTENT LAYER
           "RECORD" Text - visible only in record state
           ============================================ */
        
        .record-content {
          /* Absolutely centered - prevents sliding during morph */
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) translateZ(0);
          
          /* Layout */
          display: flex;
          justify-content: center;
          align-items: center;
          width: 65px;
          height: 26px;
          
          /* Visibility */
          opacity: 1;
          pointer-events: none;
          
          /* Fade timing - fades out at 50% of main duration (gone by halfway point) */
          transition: opacity 0.15s ease;
          backface-visibility: hidden;
        }
        
        /* Hidden in all nav states */
        .record-morphing-button.state-recording .record-content,
        .record-morphing-button.state-processing .record-content,
        .record-morphing-button.state-complete .record-content {
          opacity: 0;
          pointer-events: none;
        }
        
        .record-text {
          width: 65px;
          height: 26px;
          text-align: center;
          color: var(--ClipBg);
        }
        
        /* ============================================
           NAV CONTENT LAYER
           Full navbar layout - visible in recording/processing/complete
           ============================================ */
        
        .nav-content {
          /* Absolutely centered - prevents jitter during morph */
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) translateZ(0);
          
          /* Layout - Full nav bar width */
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          
          /* FIXED WIDTH: Center section flexes internally to accommodate timer */
          width: 358px;            /* Fixed: 38 (left) + flexible (center) + growing (right) = 358px */
          height: 42px;
          gap: 0px;
          
          /* Visibility */
          opacity: 0;
          pointer-events: none;
          
          /* Fade timing - fades in at 50% of main duration (visible by halfway point) */
          transition: opacity 0.15s ease;
          backface-visibility: hidden;
          /* border: 1px solid magenta;  /* DEBUG */
        }
        
        /* Visible in all nav states */
        .record-morphing-button.state-recording .nav-content,
        .record-morphing-button.state-processing .nav-content,
        .record-morphing-button.state-complete .nav-content {
          opacity: 1;
          pointer-events: auto;
        }
        
        /* ============================================
           NAV SECTIONS - Left, Center, Right
           ============================================ */
        
        /* LEFT: Close/Copy button (38×38px) */
        .nav-left {
          width: 38px;
          height: 38px;
          flex: none;
          order: 0;
          /* border: 1px solid red;  /* DEBUG */
        }
        
        /* CENTER: Generic container for WaveClipper ↔ RecordButton */
        .nav-center {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          
          /* FLEXIBLE WIDTH: Grows/shrinks to fill available space */
          flex: 1;              /* Shorthand: flex-grow: 1, flex-shrink: 1, flex-basis: 0 */
          min-width: 150px;     /* Minimum width to keep waveform visible */
          /* No fixed height - adapts to content (32px for wave, 42px for record) */
          
          order: 1;
          /* border: 1px solid blue;  /* DEBUG */
        }
        
        /* Audio container - specialized wrapper for WaveClipper with masks */
        .audio-container {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 0px;
          
          /* FLEXIBLE WIDTH: Fills parent container (nav-center) */
          width: 100%;          /* Takes full width of flexible parent */
          height: 32px;
          border-radius: 8px;
          overflow: clip;
          /* border: 1px solid green;  /* DEBUG */
        }
        
        /* Left edge fade overlay - creates smooth fade on left side of waveform */
        .audio-container::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 20px;
          height: 100%;
          background: linear-gradient(to right, var(--ClipRecNavBarBg) 0%, var(--ClipRecNavBarBg) 50%, transparent 100%);
          pointer-events: none;
          z-index: 10;
        }
        
        /* Right edge fade overlay - creates smooth fade on right side of waveform */
        .audio-container::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          width: 30px;
          height: 100%;
          background: linear-gradient(to left, var(--ClipRecNavBarBg) 0%, var(--ClipRecNavBarBg) 50%, transparent 100%);
          pointer-events: none;
          z-index: 10;
        }
        
        /* Opacity crossfade layers for center content */
        .center-layer {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.15s ease;  /* Default: quick fade (for exiting complete state) */
          pointer-events: none;
          /* border: 1px solid yellow;  /* DEBUG */
        }
        
        .center-layer.active {
          opacity: 1;
          pointer-events: auto;
        }
        
        /* RecordButton layer in complete state: Delayed fade-in AFTER container shrinks */
        .record-morphing-button.state-complete .center-layer.active {
          transition: opacity 0.15s 0.2s ease;  /* Wait 0.2s (for container shrink), then fade in */
        }
        
        /* RIGHT: Timer + Action Button */
        .nav-right {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;  /* RIGHT-ALIGN content - keeps button at right edge */
          padding: 0px;
          gap: 10px;
          
          /* ADAPTIVE WIDTH: Expands when timer grows (10+ minutes) */
          min-width: 130px;          /* Minimum for 4-char timer (44px) + gap (10px) + button (76px) */
          width: auto;               /* Grows with timer (max 5 chars, capped at 15 minutes) */
          
          height: 42px;
          transition: width 0s 0.15s, gap 0s;  /* Gap appears instantly, width delayed 0.15s (for RecordButton fade-out) */
          
          flex: none;
          order: 2;
          /* border: 1px solid orange;  DEBUG - CONTAINER */
        }
        
        /* Complete state: Shrink container to match button size */
        .record-morphing-button.state-complete .nav-right {
          min-width: 38px;   /* Force minimum to button width */
          max-width: 38px;   /* Force maximum to button width */
          width: 38px;       /* Shrinks to Structure button width (matches left container) */
          gap: 0px;          /* Remove gap when timer is gone */
          transition: min-width 0s 0.2s, max-width 0s 0.2s, width 0s 0.2s, gap 0s 0.2s;
        }
        
        .timer-wrapper {
          display: flex;
          /* border: 1px solid red;    DEBUG - TIMER WRAPPER */
          align-items: center;
          min-width: 44px;          /* Minimum width for 4 chars (0:26, 9:59) */
          width: auto;              /* Grows automatically for 5 chars (10:00 - 99:59) */
          height: 42px;
          transition: min-width 0s 0.2s;  /* Delayed collapse via min-width */
          /* overflow: hidden removed - was clipping timer text at 10+ minutes */
        }
        
        /* Complete state: Collapse timer after fade completes */
        .record-morphing-button.state-complete .timer-wrapper {
          min-width: 0px;   /* Collapses to nothing at 0.2s mark (after opacity fade) */
        }
        
        /* ========================================
           BUTTON WIDTH TRACKER - Reports button width to parent flexbox
           ======================================== */
        
        .button-width-tracker {
          /* Tracks button's morphing width without interfering with internal alignment */
          position: relative;  /* Establish positioning context */
          width: 76px;         /* Initial width - matches done/processing button */
          height: 42px;        /* Match button height */
          flex-shrink: 0;      /* Prevent parent from squeezing this wrapper */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);  /* Match button morph speed */
          overflow: hidden;    /* CRITICAL: Clips the 76px internal container when wrapper shrinks */
          display: flex;
          align-items: center;
          justify-content: flex-end;  /* Keep button right-aligned within tracker */
          /* border: 1px solid cyan;  DEBUG - BUTTON TRACKER */
        }
        
        /* Keep at 76px during recording and processing states */
        .record-morphing-button.state-recording .button-width-tracker,
        .record-morphing-button.state-processing .button-width-tracker {
          width: 76px;         /* Matches done/processing button */
        }
        
        /* Shrink wrapper to match button's morphed width in complete state (when button shows structure) */
        .record-morphing-button.state-complete .button-width-tracker {
          width: 38px;         /* Final width - matches structure button */
        }
      `}</style>
    </>
  );
};

/* ============================================
   DEMO WRAPPER COMPONENT WITH AUTO-TRANSITIONS
   
   Self-contained demo version with internal state
   Shows complete state flow: record → recording → processing → complete
   
   Usage in showcase/testing:
   <RecordNavBarMorphingDemo />
   
   For production, use RecordNavBarMorphing with external state:
   <RecordNavBarMorphing 
     navState={currentState}
     onRecordClick={() => setState('recording')}
     onDoneClick={() => setState('processing')}
     ...
   />
   ============================================ */

interface RecordNavBarMorphingDemoProps {
  className?: string;
}

export const RecordNavBarMorphingDemo: React.FC<RecordNavBarMorphingDemoProps> = ({ 
  className = '' 
}) => {
  // State
  const [navState, setNavState] = React.useState<RecordNavState>('record');
  
  // Audio refs
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const audioAnalyserRef = React.useRef<AnalyserNode | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const processingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  // Start recording with mic access
  const handleRecordClick = async () => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.error('Not in browser environment (SSR)');
      return;
    }

    // Check if MediaDevices API is available
    if (!navigator?.mediaDevices?.getUserMedia) {
      alert('Your browser does not support audio recording.\n\nPlease use a modern browser (Chrome, Firefox, Safari, Edge).');
      return;
    }

    // Check if we're in a secure context (required for getUserMedia)
    if (!window.isSecureContext) {
      alert('Microphone access requires a secure connection.\n\n' +
            'Please access via:\n' +
            '• https:// (secure connection)\n' +
            '• http://localhost (development)\n\n' +
            'Current: ' + window.location.origin);
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create audio context
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const context = new AudioContextClass();
      await context.resume();
      audioContextRef.current = context;

      // Create analyser node
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;
      
      // Set recording state
      setNavState('recording');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      
      // Provide helpful error messages
      if ((err as Error).name === 'NotAllowedError') {
        alert('Microphone access was denied.\n\nPlease grant permission in your browser settings.');
      } else if ((err as Error).name === 'NotFoundError') {
        alert('No microphone found.\n\nPlease connect a microphone and try again.');
      } else {
        alert('Could not access microphone.\n\nError: ' + (err as Error).message);
      }
    }
  };

  // Stop recording and cleanup
  const stopRecording = () => {
    // Stop microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    audioAnalyserRef.current = null;
    
    // Clear processing timer if active
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    
    setNavState('record');
  };

  const handleCloseClick = () => {
    stopRecording();
  };

  const handleDoneClick = () => {
    // Stop microphone but keep waveform frozen
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    audioAnalyserRef.current = null;
    
    // Show processing button - waveform stays frozen
    setNavState('processing');
    
    // Auto-transition to complete state after 3 seconds
    processingTimerRef.current = setTimeout(() => {
      setNavState('complete');
      processingTimerRef.current = null;
    }, 3000);
  };

  const handleCopyClick = () => {
    console.log('Copy clicked - would copy transcription to clipboard');
    // In production: copy transcription to clipboard
  };

  const handleStructureClick = () => {
    console.log('Structure clicked - would open structure/formatting panel');
    // In production: open structure panel
  };

  // Cleanup on unmount
  React.useEffect(() => {
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

  return (
    <RecordNavBarMorphing
      navState={navState}
      onRecordClick={handleRecordClick}
      onCloseClick={handleCloseClick}
      onCopyClick={handleCopyClick}
      onDoneClick={handleDoneClick}
      onStructureClick={handleStructureClick}
      audioAnalyser={audioAnalyserRef.current}
      className={className}
    />
  );
};

export default RecordNavBarMorphing;

