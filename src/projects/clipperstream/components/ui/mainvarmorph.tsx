import React from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { MorphingCloseToCopyButton, MorphingDoneProcessingStructureButton } from './recordNavMorphingButtons';
import { MorphingCopyToCheckButton } from './clipmorphingbuttons';
import { WaveClipper } from './waveClipper';
import { LiveTimer } from './liveTimer';
import { RecordButton } from './clipbuttons';

/* ============================================
   RECORD NAV BAR VAR MORPHING
   
   EXPERIMENTAL: Variant-based animation system
   Adds 'variant' prop to control animation behavior
   
   VARIANTS:
   - 'morph' (default): Full expansion animation (record → recording → processing → complete)
   - 'fade': Direct to complete - container already expanded, buttons fade in at fixed positions
   
   USE CASES:
   - 'morph': Normal recording flow via button interactions
   - 'fade': Viewing an existing transcribed clip (skip expansion, just show final state)
   
   ============================================ */

// Navigation states
export type RecordNavState = 'record' | 'recording' | 'processing' | 'complete';

// Animation variants
export type AnimationVariant = 'morph' | 'fade';

interface RecordNavBarVarMorphingProps {
  navState: RecordNavState;
  variant?: AnimationVariant;  // NEW: Controls animation behavior
  onRecordClick?: () => void;
  onCloseClick?: () => void;
  onCopyClick?: () => void;
  onDoneClick?: () => void;
  onStructureClick?: () => void;
  audioAnalyser?: AnalyserNode | null;
  className?: string;
}

export const RecordNavBarVarMorphing: React.FC<RecordNavBarVarMorphingProps> = ({
  navState,
  variant = 'morph',  // Default to existing behavior
  onRecordClick,
  onCloseClick,
  onCopyClick,
  onDoneClick,
  onStructureClick,
  audioAnalyser,
  className = ''
}) => {
  
  // ============================================
  // STATE MAPPING FUNCTIONS
  // ============================================
  
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

  const getContainerBackground = () => {
    // In 'fade' variant with complete state, always transparent
    if (variant === 'fade' && navState === 'complete') {
      return 'transparent';
    }
    
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

  const shouldShowTimer = (): boolean => {
    return navState === 'recording' || navState === 'processing';
  };

  // RecordButton now in persistent layer - center only shows wave
  const getCenterContent = (): 'wave' | null => {
    if (navState === 'recording' || navState === 'processing') {
      return 'wave';
    }
    return null;  // Hidden in 'record' and 'complete' states
  };

  return (
    <>
      <div className={`morph-container variant-${variant}`}>
        <div 
          className={`record-morphing-button state-${navState} variant-${variant} ${className} ${styles.container}`}
          style={{ background: getContainerBackground() }}
          onClick={navState === 'record' ? onRecordClick : undefined}
        >
          
          {/* ============================================
              RECORD STATE LAYER - "RECORD" text
              Hidden in 'fade' variant (we skip directly to complete)
              ============================================ */}
          <div className="record-content">
            <span className={`record-text ${styles.JetBrainsMonoRegular18}`}>
              RECORD
            </span>
          </div>

          {/* ============================================
              NAV STATE LAYER - Full navbar layout
              In 'fade' variant: visible immediately in complete state
              ============================================ */}
          <div className="nav-content">
            
            {/* LEFT SECTION: Copy Button (fades in at fixed position in 'fade' variant) */}
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
            
            {/* CENTER SECTION: WaveClipper only (RecordButton moved to persistent layer) */}
            <div className="nav-center">
              {/* WaveClipper layer - only for morph variant */}
              <div className={`center-layer ${getCenterContent() === 'wave' ? 'active' : ''}`}>
                <div className="audio-container">
                  <WaveClipper 
                    audioAnalyser={audioAnalyser}
                    isRecording={navState === 'recording'}
                    isFrozen={navState === 'processing' || navState === 'complete'}
                  />
                </div>
              </div>
            </div>
            
            {/* RIGHT SECTION: Structure Button (fades in at fixed position in 'fade' variant) */}
            <div className="nav-right">
              <div 
                className="timer-wrapper"
                style={{ 
                  opacity: shouldShowTimer() ? 1 : 0,
                  transition: 'opacity 0.1s ease',
                  pointerEvents: shouldShowTimer() ? 'auto' : 'none'
                }}
              >
                <LiveTimer 
                  isRunning={navState === 'recording'}
                  isFrozen={navState === 'processing'}
                />
              </div>
              
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
        
        {/* ============================================
            PERSISTENT RECORD BUTTON LAYER
            Positioned absolute to morph-container (366×50 fixed)
            Stays perfectly centered during all transitions
            Visible in 'complete' state
            ============================================ */}
        <div className={`persistent-record-layer ${navState === 'complete' ? 'active' : ''}`}>
          <RecordButton onClick={onRecordClick} />
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
           ============================================ */
        
        .morph-container {
          position: relative;
          width: 366px;
          height: 50px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        /* ============================================
           PERSISTENT RECORD BUTTON LAYER
           Absolute to morph-container (366×50 fixed)
           Cannot be pushed by flexbox changes
           ============================================ */
        
        .persistent-record-layer {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;  /* Above nav-content */
          
          /* Hidden by default */
          opacity: 0;
          pointer-events: none;
          
          /* Fade transition - 'morph' variant */
          transition: opacity 0.15s ease;
        }
        
        .persistent-record-layer.active {
          opacity: 1;
          pointer-events: auto;
        }
        
        /* 'fade' variant: RecordButton visible immediately (no transition delay) */
        .morph-container.variant-fade .persistent-record-layer.active {
          transition: none;
        }
        
        /* ============================================
           MORPHING BUTTON CONTAINER
           DEFAULT ('morph' variant): Expands from center
           ============================================ */
        
        .record-morphing-button {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 24px;
          border: none;
          cursor: pointer;
          
          /* RECORD STATE - Initial smaller pill */
          width: 113px;
          height: 42px;
          background: var(--RecWhite);
          border-radius: 24px;
          
          transform-origin: center center;
          margin: auto;
          
          /* SMOOTH TRANSITIONS - 'morph' variant */
          transition: 
            all 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            background 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, background, width, height, padding, border-radius;
          overflow: hidden;
        }
        
        /* RECORDING & PROCESSING STATES */
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
        
        /* COMPLETE STATE - 'morph' variant */
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
           'FADE' VARIANT OVERRIDES
           Container is IMMEDIATELY at full size
           No expansion animation
           ============================================ */
        
        .record-morphing-button.variant-fade {
          /* Skip all container transitions */
          transition: none;
        }
        
        .record-morphing-button.variant-fade.state-complete {
          /* Immediately at full size */
          width: 366px;
          height: 50px;
          padding: 4px;
          background: transparent;
          border-radius: 32px;
          justify-content: space-between;
          cursor: default;
        }
        
        /* ============================================
           RECORD CONTENT LAYER - "RECORD" Text
           ============================================ */
        
        .record-content {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) translateZ(0);
          
          display: flex;
          justify-content: center;
          align-items: center;
          width: 65px;
          height: 26px;
          
          opacity: 1;
          pointer-events: none;
          
          transition: opacity 0.15s ease;
          backface-visibility: hidden;
        }
        
        /* Hidden in nav states */
        .record-morphing-button.state-recording .record-content,
        .record-morphing-button.state-processing .record-content,
        .record-morphing-button.state-complete .record-content {
          opacity: 0;
          pointer-events: none;
        }
        
        /* 'fade' variant: RECORD text hidden immediately */
        .record-morphing-button.variant-fade.state-complete .record-content {
          opacity: 0;
          transition: none;
        }
        
        .record-text {
          width: 65px;
          height: 26px;
          text-align: center;
          color: var(--ClipBg);
        }
        
        /* ============================================
           NAV CONTENT LAYER
           ============================================ */
        
        .nav-content {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) translateZ(0);
          
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          
          width: 358px;
          height: 42px;
          gap: 0px;
          
          opacity: 0;
          pointer-events: none;
          
          transition: opacity 0.15s ease;
          backface-visibility: hidden;
        }
        
        /* Visible in nav states */
        .record-morphing-button.state-recording .nav-content,
        .record-morphing-button.state-processing .nav-content,
        .record-morphing-button.state-complete .nav-content {
          opacity: 1;
          pointer-events: auto;
        }
        
        /* 'fade' variant: nav-content visible immediately */
        .record-morphing-button.variant-fade.state-complete .nav-content {
          opacity: 1;
          pointer-events: auto;
          transition: none;
        }
        
        /* ============================================
           NAV SECTIONS - Left, Center, Right
           ============================================ */
        
        .nav-left {
          width: 38px;
          height: 38px;
          flex: none;
          order: 0;
          
          /* 'fade' variant: fade in from opacity 0 */
          opacity: 1;
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* 'fade' variant: side buttons start invisible, fade in */
        .record-morphing-button.variant-fade .nav-left {
          opacity: 0;
        }
        .record-morphing-button.variant-fade.state-complete .nav-left {
          opacity: 1;
        }
        
        .nav-center {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          
          flex: 1;
          min-width: 150px;
          
          order: 1;
        }
        
        .audio-container {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 0px;
          
          width: 100%;
          height: 32px;
          border-radius: 0px;
          overflow: clip;
        }
        
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
          transition: opacity 0.15s ease;
          pointer-events: none;
        }
        
        .center-layer.active {
          opacity: 1;
          pointer-events: auto;
        }
        
        .nav-right {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          padding: 0px;
          gap: 10px;
          
          min-width: 130px;
          width: auto;
          
          height: 42px;
          transition: width 0s 0.15s, gap 0s;
          
          flex: none;
          order: 2;
          
          /* 'fade' variant: fade in from opacity 0 */
          opacity: 1;
        }
        
        /* 'fade' variant: side buttons start invisible, fade in */
        .record-morphing-button.variant-fade .nav-right {
          opacity: 0;
          /* In fade variant complete state, immediately at final size */
          min-width: 38px;
          max-width: 38px;
          width: 38px;
          gap: 0px;
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .record-morphing-button.variant-fade.state-complete .nav-right {
          opacity: 1;
        }
        
        /* 'morph' variant: normal shrink behavior */
        .record-morphing-button.variant-morph.state-complete .nav-right {
          min-width: 38px;
          max-width: 38px;
          width: 38px;
          gap: 0px;
          transition: min-width 0s 0.2s, max-width 0s 0.2s, width 0s 0.2s, gap 0s 0.2s;
        }
        
        .timer-wrapper {
          display: flex;
          align-items: center;
          min-width: 44px;
          width: auto;
          height: 42px;
          transition: min-width 0s 0.2s;
        }
        
        /* Hide timer in fade variant */
        .record-morphing-button.variant-fade .timer-wrapper {
          display: none;
        }
        
        .record-morphing-button.state-complete .timer-wrapper {
          min-width: 0px;
        }
        
        .button-width-tracker {
          position: relative;
          width: 76px;
          height: 42px;
          flex-shrink: 0;
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        
        .record-morphing-button.state-recording .button-width-tracker,
        .record-morphing-button.state-processing .button-width-tracker {
          width: 76px;
        }
        
        .record-morphing-button.state-complete .button-width-tracker {
          width: 38px;
        }
        
        /* 'fade' variant: button tracker immediately at final size */
        .record-morphing-button.variant-fade .button-width-tracker {
          width: 38px;
          transition: none;
        }
        
        /* ============================================
           'FADE' VARIANT: DISABLE ALL INTERNAL ANIMATIONS
           The morphing buttons have their own internal transitions
           We need to override them to make the switch instant
           ============================================ */
        
        /* Disable ALL transitions inside morphing buttons for fade variant */
        .record-morphing-button.variant-fade :global(*) {
          transition: none !important;
        }
        
        /* Re-enable ONLY opacity transitions for the side buttons */
        .record-morphing-button.variant-fade .nav-left {
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .record-morphing-button.variant-fade .nav-right {
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
      `}</style>
    </>
  );
};

/* ============================================
   DEMO 1: Normal Flow (morph variant)
   record → recording → processing → complete
   ============================================ */

interface RecordNavBarVarMorphingDemoProps {
  className?: string;
}

export const RecordNavBarVarMorphingDemo: React.FC<RecordNavBarVarMorphingDemoProps> = ({ 
  className = '' 
}) => {
  const [navState, setNavState] = React.useState<RecordNavState>('record');
  
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const audioAnalyserRef = React.useRef<AnalyserNode | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const processingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRecordClick = async () => {
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
      
      setNavState('recording');
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
    setNavState('record');
  };

  const handleCloseClick = () => stopRecording();

  const handleDoneClick = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioAnalyserRef.current = null;
    
    setNavState('processing');
    
    processingTimerRef.current = setTimeout(() => {
      setNavState('complete');
      processingTimerRef.current = null;
    }, 3000);
  };

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
    <RecordNavBarVarMorphing
      navState={navState}
      variant="morph"
      onRecordClick={handleRecordClick}
      onCloseClick={handleCloseClick}
      onCopyClick={() => console.log('Copy clicked')}
      onDoneClick={handleDoneClick}
      onStructureClick={() => console.log('Structure clicked')}
      audioAnalyser={audioAnalyserRef.current}
      className={className}
    />
  );
};

/* ============================================
   DEMO 2: Direct to Complete (fade variant)
   Toggle button switches: record ↔ complete
   Simulates viewing an existing transcribed clip
   ============================================ */

interface RecordNavBarVarMorphingDirectDemoProps {
  className?: string;
}

export const RecordNavBarVarMorphingDirectDemo: React.FC<RecordNavBarVarMorphingDirectDemoProps> = ({ 
  className = '' 
}) => {
  const [navState, setNavState] = React.useState<RecordNavState>('record');

  const handleToggle = () => {
    // Toggle between record and complete to see the fade animation
    setNavState(prev => prev === 'record' ? 'complete' : 'record');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
      {/* The morphing component */}
      <RecordNavBarVarMorphing
        navState={navState}
        variant="fade"
        onRecordClick={handleToggle}
        onCopyClick={() => console.log('Copy clicked')}
        onStructureClick={() => console.log('Structure clicked')}
        className={className}
      />
      
      {/* Toggle button - separate from component */}
      <button
        onClick={handleToggle}
        style={{
          padding: '8px 16px',
          background: navState === 'record' ? 'var(--ClipGrey, #333)' : 'var(--RecWhite_10, rgba(255,255,255,0.1))',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          transition: 'background 0.2s ease'
        }}
      >
        {navState === 'record' ? 'Switch to Complete →' : '← Switch to Record'}
      </button>
      
      {/* State indicator */}
      <span style={{ 
        color: 'rgba(255, 255, 255, 0.5)', 
        fontSize: '0.75rem',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        Current: {navState}
      </span>
    </div>
  );
};

export default RecordNavBarVarMorphing;

