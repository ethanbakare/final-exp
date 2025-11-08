import React, { useState, useRef, useEffect } from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { CloseButton, DoneButton, ProcessingButton } from './clipbuttons';
import { WaveClipper } from './waveClipper';
import { LiveTimer } from './liveTimer';

/* ============================================
   ┌─────────────────────────────────────────┐
   │  RECORD MORPHING BUTTON                 │
   │  Clipperstream Recording Interface      │
   └─────────────────────────────────────────┘
   
   FILE OVERVIEW:
   - RecordMorphingButton: Main morphing component (record ↔ recording)
   - WaveClipper: Audio waveform visualization (42 bars)
   - RecordMorphingToggle: Demo wrapper with internal state
   
   MORPHING BEHAVIOR:
   - Expands from CENTER (bidirectional growth)
   - 113×42px (RecordButton) → 366×50px (RecordNavBar)
   - Background color changes at 50% mark
   - Text/content fades at 50% mark
   - Shape continues to full duration
   
   SPEED CONTROL:
   - All timing controlled via CSS variables (lines 85-88)
   - See 🎛️ SPEED CONTROL CENTER for easy adjustments
   - Debug: 6s/3s → Production: 0.3s/0.15s
   
   ============================================ */

interface RecordMorphingButtonProps {
  state: 'record' | 'recording';
  doneButtonState?: 'done' | 'processing';
  onRecordClick?: () => void;
  onCloseClick?: () => void;
  onDoneClick?: () => void;
  audioAnalyser?: AnalyserNode | null;
  className?: string;
  disabled?: boolean;
}

export const RecordMorphingButton: React.FC<RecordMorphingButtonProps> = ({
  state,
  doneButtonState = 'done',
  onRecordClick,
  onCloseClick,
  onDoneClick,
  audioAnalyser,
  className = '',
  disabled = false
}) => {
  const handleRecordClick = () => {
    if (state === 'record') {
      onRecordClick?.();
    }
  };

  return (
    <>
      <div className="morph-container">
        <div 
          className={`record-morphing-button state-${state} ${className} ${styles.container}`}
          onClick={handleRecordClick}
          role={state === 'record' ? 'button' : 'group'}
          aria-label={state === 'record' ? 'Start recording' : 'Recording controls'}
        >
          {/* RECORD STATE CONTENT - Just the "RECORD" text */}
          <div className="record-content">
            <span className={`record-text ${styles.JetBrainsMonoRegular18}`}>
              RECORD
            </span>
          </div>

          {/* RECORDING STATE CONTENT - Full nav bar layout */}
          <div className="recording-content">
            <div className="nav-close">
              <CloseButton onClick={onCloseClick} />
            </div>
            
            <div className="nav-wave">
              <WaveClipper 
                audioAnalyser={audioAnalyser}
                isRecording={state === 'recording'}
                isFrozen={doneButtonState === 'processing'}
              />
            </div>
            
            <div className="nav-timer-done">
              <LiveTimer 
                isRunning={state === 'recording'}
                isFrozen={doneButtonState === 'processing'}
              />
              
              {/* MORPHING DONE/PROCESSING BUTTON - Uses opacity crossfade */}
              <div className="morphing-action-button">
                {/* Done Button Layer */}
                <div 
                  className={`action-button-layer done-layer ${doneButtonState === 'done' ? 'active' : ''}`}
                  onClick={onDoneClick}
                  style={{ pointerEvents: doneButtonState === 'done' ? 'auto' : 'none' }}
                >
                  <DoneButton disabled={disabled} />
                </div>
                
                {/* Processing Button Layer */}
                <div 
                  className={`action-button-layer processing-layer ${doneButtonState === 'processing' ? 'active' : ''}`}
                  style={{ pointerEvents: doneButtonState === 'processing' ? 'auto' : 'none' }}
                >
                  <ProcessingButton disabled={disabled} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* ============================================
           🎛️ SPEED CONTROL CENTER
           ============================================
           Change timing values here for entire animation
           
           IMPORTANT: CSS cannot calculate percentages of time values,
           so you must manually maintain the 50% relationship:
           
           --morph-half MUST = 50% of --morph-main
           
           Examples:
           - Debug:      6s main → 3s half
           - Production: 0.3s main → 0.15s half
           ============================================ */
        .record-morphing-button {
          --morph-main: .3s;        /* Main morph duration (shape changes) */
          --morph-half: .15s;        /* Half duration (color/opacity fades) - MUST be 50% of main */
          --morph-easing: cubic-bezier(0.4, 0, 0.2, 1);  /* Material Design curve */
        }
        
        /* ============================================
           ACCESSIBILITY: Respect user motion preferences
           ============================================ */
        @media (prefers-reduced-motion: reduce) {
          .record-morphing-button,
          .record-morphing-button *,
          .wave-bar {
            transition: none !important;
            animation: none !important;
          }
        }
        
        /* ============================================
           OUTER CONTAINER
           Reserves space for largest state (RecordNavBar)
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
           MORPHING BUTTON - Main Container
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
          
          /* SMOOTH TRANSITIONS - Uses CSS variables from SPEED CONTROL CENTER above
             All properties (width/height/padding/radius) use --morph-main
             Background color uses --morph-half (finishes at halfway point) */
          transition: 
            all var(--morph-main) var(--morph-easing),
            background var(--morph-half) var(--morph-easing);
          will-change: transform, background, width, height, padding, border-radius;
          overflow: hidden;
        }
        
        /* RECORDING STATE - Expanded nav bar (366×50px) */
        .record-morphing-button.state-recording {
          width: 366px;
          height: 50px;
          padding: 4px;
          background: var(--ClipRecNavBarBg);
          border-radius: 32px;
          justify-content: space-between;
          cursor: default;
        }
        
        /* Disabled state */
        .record-morphing-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* ============================================
           RECORD CONTENT - "RECORD" Text Layer
           Visible in record state, fades out during morph
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
          
          /* Fade timing - Uses --morph-half from SPEED CONTROL CENTER
             Fades out at 50% of main duration (gone by halfway point) */
          transition: opacity var(--morph-half) ease;
          backface-visibility: hidden;
        }
        
        /* Hidden in recording state */
        .record-morphing-button.state-recording .record-content {
          opacity: 0;
          pointer-events: none;
        }
        
        /* The "RECORD" text itself */
        .record-text {
          width: 65px;
          height: 26px;
          text-align: center;
          color: var(--ClipBg);
        }
        
        /* ============================================
           RECORDING CONTENT - Nav Bar Layer
           Hidden initially, fades in during morph
           Contains: CloseButton + WaveClipper + Timer + DoneButton
           ============================================ */
        .recording-content {
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
          width: 358px;        /* Inner width accounting for 4px padding */
          height: 42px;
          gap: 0px;
          
          /* Visibility */
          opacity: 0;
          pointer-events: none;
          
          /* Fade timing - Uses --morph-half from SPEED CONTROL CENTER
             Fades in at 50% of main duration (visible by halfway point) */
          transition: opacity var(--morph-half) ease;
          backface-visibility: hidden;
        }
        
        /* Visible in recording state */
        .record-morphing-button.state-recording .recording-content {
          opacity: 1;
          pointer-events: auto;
        }
        
        /* ============================================
           NAV BAR SECTIONS - Individual control areas
           ============================================ */
        
        /* Left: Close button (38×38px) */
        .nav-close {
          width: 38px;
          height: 38px;
          flex: none;
          order: 0;
        }
        
        /* Center: Waveform visualization (FLEXIBLE - shrinks for timer) */
        .nav-wave {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 0px;

          /* FLEXIBLE WIDTH: Shrinks when timer grows beyond 4 chars */
          flex: 1;              /* Grows/shrinks to fill available space */
          min-width: 150px;     /* Minimum to keep waveform visible */
          
          height: 32px;
          border-radius: 8px;
          overflow: clip;
          // border: 2px solid blue;
          position: relative;
          order: 1;
        }
        
        /* Left edge fade overlay - creates smooth fade on left side */
        .nav-wave::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 30px;          /* Increased from 20px for better visual balance */
          height: 100%;
          background: linear-gradient(to right, var(--ClipRecNavBarBg) 0%, var(--ClipRecNavBarBg) 50%, transparent 100%);
          pointer-events: none;
          z-index: 10;
        }
        
        /* Right edge fade overlay - creates smooth fade on right side */
        .nav-wave::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          width: 30px;          /* Increased from 20px for better visual balance */
          height: 100%;
          background: linear-gradient(to left, var(--ClipRecNavBarBg) 0%, var(--ClipRecNavBarBg) 50%, transparent 100%);
          pointer-events: none;
          z-index: 10;
        }
        
        /* Right: Timer + Done/Processing button (ADAPTIVE WIDTH) */
        .nav-timer-done {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 10px;
          
          /* ADAPTIVE WIDTH: Expands when timer grows (10+ minutes) */
          min-width: 130px;          /* Minimum for 4-char timer (44px) + gap (10px) + button (76px) */
          width: auto;               /* Grows with timer (max 5 chars, capped at 15 minutes) */
          
          height: 42px;
          flex: none;
          order: 2;
        }

        /* ============================================
           MORPHING ACTION BUTTON - Done ↔ Processing
           Uses opacity crossfade technique from clipmorphingbuttons.tsx
           ============================================ */
        
        .morphing-action-button {
          position: relative;
          width: 76px;
          height: 42px;
        }
        
        .action-button-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }
        
        .action-button-layer.active {
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>
    </>
  );
};

/* ============================================
   TOGGLE WRAPPER COMPONENT
   ============================================
   Self-contained demo version with internal state
   
   Usage in showcase/testing:
   <RecordMorphingToggle />
   
   For production, use RecordMorphingButton with external state:
   <RecordMorphingButton 
     state={recordState}
     doneButtonState={doneButtonState}
     onRecordClick={() => setRecordState('recording')}
     onCloseClick={() => setRecordState('record')}
     onDoneClick={() => setDoneButtonState('processing')}
   />
   ============================================ */

interface RecordMorphingToggleProps {
  className?: string;
}

export const RecordMorphingToggle: React.FC<RecordMorphingToggleProps> = ({ 
  className = '' 
}) => {
  // State
  const [state, setState] = useState<'record' | 'recording'>('record');
  const [doneButtonState, setDoneButtonState] = useState<'done' | 'processing'>('done');
  
  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
      
      // Set recording state and reset done button
      setState('recording');
      setDoneButtonState('done');
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
    setState('record');
    setDoneButtonState('done');
  };

  const handleCloseClick = () => {
    stopRecording();
  };

  const handleDoneClick = () => {
    // Stop microphone but keep waveform frozen at current state
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
    
    // Show processing button - waveform stays frozen
    setDoneButtonState('processing');
    
    // Demo: After 20 seconds, go back to record button
    setTimeout(() => {
      stopRecording();
    }, 2000);
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
    };
  }, []);

  return (
    <RecordMorphingButton
      state={state}
      doneButtonState={doneButtonState}
      onRecordClick={handleRecordClick}
      onCloseClick={handleCloseClick}
      onDoneClick={handleDoneClick}
      audioAnalyser={audioAnalyserRef.current}
      className={className}
    />
  );
};

/* ============================================
   DEFAULT EXPORT
   ============================================
   Note: Named exports (RecordMorphingButton, RecordMorphingToggle)
   are already exported at their declarations above.
   ============================================ */

const recordMorphing = {
  RecordMorphingButton,
  RecordMorphingToggle
};

export default recordMorphing;

