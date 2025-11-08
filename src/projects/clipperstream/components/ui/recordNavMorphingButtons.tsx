import React from 'react';
import { CopyButton, CloseButton } from './clipbuttons';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

// RecordNavBar Morphing Button Components
// Extended version of clipmorphingbuttons.tsx with 3-state action button

/* ============================================
   MORPHING CLOSE TO COPY BUTTON
   
   PATTERN: Two-button opacity crossfade
   - CloseButton (X icon) fades to CopyButton (copy icon)
   - Same 38×38px dimensions for both buttons
   - Used in RecordNavBar to transition between recording/processing → complete states
   
   ADJUSTABLE PARAMETERS:
   - Transition speed: 0.2s (.button-layer transition)
   - Container size: 38×38px (both buttons same size)
   
   ============================================ */

interface MorphingCloseToCopyButtonProps {
  state: 'close' | 'copy';     // Parent controls which button is visible
  onCloseClick?: () => void;   // Callback when clicked in 'close' state
  onCopyClick?: () => void;    // Callback when clicked in 'copy' state
  className?: string;
  disabled?: boolean;
}

export const MorphingCloseToCopyButton: React.FC<MorphingCloseToCopyButtonProps> = ({
  state,
  onCloseClick,
  onCopyClick,
  className = '',
  disabled = false
}) => {
  const handleClick = () => {
    switch (state) {
      case 'close':
        onCloseClick?.();
        break;
      case 'copy':
        onCopyClick?.();
        break;
    }
  };

  return (
    <>
      <div className={`morphing-close-copy-wrapper ${className}`}>
        {/* Close Button - visible in close state */}
        <div 
          className={`button-layer close-layer ${state === 'close' ? 'active' : ''}`}
          onClick={state === 'close' ? handleClick : undefined}
          style={{ pointerEvents: state === 'close' ? 'auto' : 'none' }}
        >
          <CloseButton disabled={disabled} />
        </div>
        
        {/* Copy Button - visible in copy state */}
        <div 
          className={`button-layer copy-layer ${state === 'copy' ? 'active' : ''}`}
          onClick={state === 'copy' ? handleClick : undefined}
          style={{ pointerEvents: state === 'copy' ? 'auto' : 'none' }}
        >
          <CopyButton disabled={disabled} />
        </div>
      </div>
      
      <style jsx>{`
        /* Accessibility: Disable animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .button-layer {
            transition: none !important;
          }
        }
        
        /* Fixed container prevents layout shift during button swap */
        .morphing-close-copy-wrapper {
          position: relative;
          width: 38px;   /* ADJUST: Both buttons are 38×38px */
          height: 38px;
        }
        
        /* Both buttons are absolutely positioned and stacked */
        .button-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;    /* Hidden by default */
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);  /* SPEED CONTROL: Change 0.2s to adjust fade speed */
          pointer-events: none;  /* Prevent clicks on hidden button */
        }
        
        /* Active button is visible and clickable */
        .button-layer.active {
          opacity: 1;              /* Fully visible */
          pointer-events: auto;    /* Enable clicks */
        }
      `}</style>
    </>
  );
};

/* ============================================
   MORPHING DONE → PROCESSING → STRUCTURE BUTTON
   
   PATTERN: Single button that physically morphs dimensions + opacity crossfade icons
   - ONE <button> element that changes width, height, background, border-radius
   - THREE content layers crossfade inside (done text, processing spinner, structure icon)
   - Follows deepMorphingButtons.tsx MorphingRightButton pattern (5-state button)
   
   MORPH BEHAVIOR:
   - Done: 76px × 42px red pill with "DONE" text
   - Processing: 76px × 42px white pill with rotating spinner
   - Structure: 38px × 38px semi-transparent circle with structure icon
   - Shrinks from left to right (right-aligned, transform-origin: right center)
   - Icons stay centered throughout morph
   
   ADJUSTABLE PARAMETERS:
   - Morph speed: 0.2s (transition durations - keep synchronized!)
   - Button dimensions: Done/Processing (76×42px), Structure (38×38px)
   - Colors: Done (--RecRed), Processing (--RecWhite), Structure (--RecWhite_10)
   - Border radius: Done/Processing (24px), Structure (32px)
   - Container size: Must fit largest state (76×42px)
   - Icon sizes: Done text (44px width), Processing (20px), Structure (24px)
   - Spinner rotation speed: 1.5s (animation duration)
   
   ============================================ */

interface MorphingDoneProcessingStructureButtonProps {
  state: 'done' | 'processing' | 'structure';  // Parent controls which state button is in
  onDoneClick?: () => void;                     // Callback when clicked in 'done' state
  onProcessingClick?: () => void;               // Callback when clicked in 'processing' state (optional)
  onStructureClick?: () => void;                // Callback when clicked in 'structure' state
  className?: string;
  disabled?: boolean;
}

export const MorphingDoneProcessingStructureButton: React.FC<MorphingDoneProcessingStructureButtonProps> = ({
  state,
  onDoneClick,
  onProcessingClick,
  onStructureClick,
  className = '',
  disabled = false
}) => {
  const handleClick = () => {
    switch (state) {
      case 'done':
        onDoneClick?.();
        break;
      case 'processing':
        onProcessingClick?.();  // Usually no-op, but available if needed
        break;
      case 'structure':
        onStructureClick?.();
        break;
    }
  };

  return (
    <>
      <div className="button-container">
        <button 
          className={`morphing-action-button state-${state} ${className} ${styles.container}`}
          onClick={handleClick}
          disabled={disabled}
          aria-label={`${state} button`}
        >
          <div className="content-container">
            
            {/* LAYER 1: Done Button Content - visible in 'done' state */}
            <div className="done-content">
              <span className={`done-text ${styles.JetBrainsMonoRegular18}`}>DONE</span>
            </div>

            {/* LAYER 2: Processing Spinner - visible in 'processing' state */}
            <div className="processing-svg-icon">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Vertical bottom spoke */}
                <path d="M10 15.5V18.5" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
                {/* Horizontal left spoke */}
                <path d="M4.5 10L1.5 10" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
                {/* Vertical top spoke */}
                <path d="M10 1.5V4.5" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
                {/* Horizontal right spoke */}
                <path d="M18.5 10L15.5 10" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
                {/* Diagonal bottom-left spoke */}
                <path d="M6.11 13.89L3.99 16.01" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
                {/* Diagonal top-left spoke */}
                <path d="M6.11 6.11L3.99 3.99" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
                {/* Diagonal top-right spoke */}
                <path d="M16.01 3.99L13.89 6.11" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
                {/* Diagonal bottom-right spoke */}
                <path d="M16.01 16.01L13.89 13.89" stroke="#262424" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </div>

            {/* LAYER 3: Structure Icon - visible in 'structure' state */}
            <svg 
              className="structure-icon"
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M4.5 18H14.5M4.5 14H20.5M4.5 10H14.5M4.5 6H20.5" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            
          </div>
        </button>
      </div>
      
      <style jsx>{`
        /* ========================================
           ACCESSIBILITY & ANIMATIONS
           ======================================== */
        
        /* Disable ALL animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .morphing-action-button,
          .morphing-action-button * {
            transition: none !important;
            animation: none !important;
          }
        }
        
        /* Spinner rotation animation - continuous 360° spin */
        @keyframes rotate-spinner {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* ========================================
           CONTAINER - Fixed wrapper prevents layout shift
           ======================================== */
        
        .button-container {
          position: relative;
          width: 76px;        /* ADJUST: Must be >= largest button width (done/processing: 76px) */
          height: 42px;       /* ADJUST: Must be >= tallest button height (done/processing: 42px) */
          display: flex;
          align-items: center;      /* CRITICAL: Centers button vertically to prevent "upward jump" when height shrinks */
          justify-content: flex-end;  /* CRITICAL: Right-aligns button for left-to-right shrinking */
        }
        
        /* ========================================
           THE MORPHING BUTTON - One element that changes all properties
           ======================================== */
        
        .morphing-action-button {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          border: none;
          cursor: pointer;
          
          /* INITIAL STATE - Done (Red pill) */
          width: 76px;                      /* ADJUST: Done button width */
          height: 42px;                     /* ADJUST: Done button height */
          background: var(--RecRed);        /* ADJUST: Done button color (red) */
          border-radius: 24px;              /* ADJUST: Done button roundness */
          
          /* MORPHING DIRECTION - Right to left shrinking */
          transform-origin: right center;   /* CRITICAL: Makes button shrink from left edge, fixed on right */
          margin-left: auto;                /* CRITICAL: Pushes button to right side of container */
          
          /* ANIMATION TIMING - All properties morph together */
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);  /* SPEED CONTROL: Change 0.2s for faster/slower morph */
          will-change: transform, background, width, height;   /* Performance hint for browser */
          overflow: hidden;  /* Hide content overflow during morph */
        }
        
        /* PROCESSING STATE - White pill, same dimensions as done */
        .morphing-action-button.state-processing {
          width: 76px;                      /* Same as done */
          height: 42px;                     /* Same as done */
          background: var(--RecWhite);      /* ADJUST: Processing button color (white) */
          border-radius: 24px;              /* Same as done */
        }
        
        /* STRUCTURE STATE - Shrinks to small semi-transparent circle */
        .morphing-action-button.state-structure {
          width: 38px;                      /* ADJUST: Structure button width (smaller) */
          height: 38px;                     /* ADJUST: Structure button height (smaller) */
          background: var(--RecWhite_10);   /* ADJUST: Structure button color (10% white opacity) */
          border-radius: 32px;              /* ADJUST: Structure button roundness (more circular) */
        }
        
        /* Disabled state styling */
        .morphing-action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* ========================================
           CONTENT CONTAINER - Fixed canvas for icon crossfading
           ======================================== */
        
        /* Fixed content area - icons crossfade within this space */
        .content-container {
          position: relative;
          width: 44px;          /* ADJUST: Must be >= largest content (done text: 44px) */
          height: 26px;         /* ADJUST: Must be >= largest content (done text: 26px) */
          display: flex;
          justify-content: center;
          align-items: center;
          transform: translateZ(0);  /* GPU acceleration for smooth animation */
          margin: 0 auto;            /* Centers content in morphing button */
        }
        
        /* ========================================
           LAYER 1: DONE CONTENT
           ======================================== */
        
        .done-content {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 44px;         /* ADJUST: Done text width */
          height: 26px;        /* ADJUST: Done text height */
          opacity: 0;          /* Hidden by default */
          transition: opacity 0.2s ease;  /* SPEED CONTROL: Must match button morph speed */
          top: 0; left: 0; right: 0; bottom: 0;
          margin: auto;        /* Centers content absolutely */
          transform: translateZ(0);       /* GPU acceleration */
          backface-visibility: hidden;    /* Prevents flickering during animation */
        }
        
        .morphing-action-button.state-done .done-content {
          opacity: 1;  /* Visible in done state */
        }
        
        .done-text {
          color: var(--RecWhite);
          text-align: center;
          white-space: nowrap;
        }
        
        /* ========================================
           LAYER 2: PROCESSING SPINNER
           ======================================== */
        
        .processing-svg-icon {
          position: absolute;
          width: 20px;         /* ADJUST: Processing icon size (20px spinner) */
          height: 20px;
          opacity: 0;          /* Hidden by default */
          transition: opacity 0.2s ease;  /* SPEED CONTROL: Must match button morph speed */
          top: 0; left: 0; right: 0; bottom: 0;
          margin: auto;        /* Centers icon absolutely */
          transform: translateZ(0);       /* GPU acceleration */
          backface-visibility: hidden;    /* Prevents flickering during animation */
        }
        
        /* Show spinner when in processing state */
        .morphing-action-button.state-processing .processing-svg-icon {
          opacity: 1;  /* Fade in during morph */
        }
        
        /* Spinner SVG rotation */
        .processing-svg-icon svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          animation: rotate-spinner 1.5s linear infinite;  /* SPEED CONTROL: Change 1.5s for faster/slower spin */
          transform-origin: center center;  /* Spin around center point */
        }
        
        /* Pause spinner animation when button is disabled */
        .morphing-action-button:disabled .processing-svg-icon svg {
          animation-play-state: paused;
        }
        
        /* ========================================
           LAYER 3: STRUCTURE ICON
           ======================================== */
        
        .structure-icon {
          position: absolute;
          width: 24px;         /* ADJUST: Structure icon size (24px lines) */
          height: 24px;
          opacity: 0;          /* Hidden by default */
          transition: opacity 0.2s ease;  /* SPEED CONTROL: Must match button morph speed */
          top: 0; left: 0; right: 0; bottom: 0;
          margin: auto;        /* Centers icon absolutely */
          transform: translateZ(0);       /* GPU acceleration */
          backface-visibility: hidden;    /* Prevents flickering during animation */
        }
        
        /* Show structure icon when in structure state */
        .morphing-action-button.state-structure .structure-icon {
          opacity: 1;  /* Fade in during morph */
        }
      `}</style>
    </>
  );
};

// Create a named object for default export
const recordNavMorphingButtons = {
  MorphingCloseToCopyButton,
  MorphingDoneProcessingStructureButton
};

export default recordNavMorphingButtons;

