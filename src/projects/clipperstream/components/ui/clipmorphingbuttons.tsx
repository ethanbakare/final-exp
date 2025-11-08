import React, { useState, useEffect } from 'react';
import { DoneButton, ProcessingButton, CopyButton, CheckTickButton, TimerText, CloseButton } from './clipbuttons';
import styles from '@/projects/clipperstream/styles/clipper.module.css';

// ClipperStream Morphing Button Components
// Simpler approach: Use existing buttons with opacity crossfade

/* ============================================
   MORPHING DONE TO PROCESSING BUTTON
   
   PATTERN: Two-button opacity crossfade
   - Two complete button components stacked absolutely
   - One fades out (opacity: 1 → 0) while other fades in (opacity: 0 → 1)
   - No physical dimension changes, just visibility swap
   
   ADJUSTABLE PARAMETERS:
   - Transition speed: line 80 (.button-layer transition)
   - Container size: lines 69-70 (wrapper width/height)
   
   ============================================ */

interface MorphingDoneToProcessingButtonProps {
  state: 'done' | 'processing';  // Parent controls which button is visible
  onDoneClick?: () => void;      // Callback when clicked in 'done' state
  onProcessingClick?: () => void; // Callback when clicked in 'processing' state
  className?: string;
  disabled?: boolean;
}

export const MorphingDoneToProcessingButton: React.FC<MorphingDoneToProcessingButtonProps> = ({
  state,
  onDoneClick,
  onProcessingClick,
  className = '',
  disabled = false
}) => {
  const handleClick = () => {
    switch (state) {
      case 'done':
        onDoneClick?.();
        break;
      case 'processing':
        onProcessingClick?.();
        break;
    }
  };

  return (
    <>
      <div className={`morphing-button-wrapper ${className}`}>
        {/* Done Button - visible in done state */}
        <div 
          className={`button-layer done-layer ${state === 'done' ? 'active' : ''}`}
          onClick={state === 'done' ? handleClick : undefined}
          style={{ pointerEvents: state === 'done' ? 'auto' : 'none' }}
        >
          <DoneButton disabled={disabled} />
        </div>
        
        {/* Processing Button - visible in processing state */}
        <div 
          className={`button-layer processing-layer ${state === 'processing' ? 'active' : ''}`}
          onClick={state === 'processing' ? handleClick : undefined}
          style={{ pointerEvents: state === 'processing' ? 'auto' : 'none' }}
        >
          <ProcessingButton disabled={disabled} />
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
        .morphing-button-wrapper {
          position: relative;
          width: 76px;   /* ADJUST: Must match largest button width (both are 76px here) */
          height: 42px;  /* ADJUST: Must match button height */
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
   MORPHING COPY TO CHECK BUTTON
   
   PATTERN: Two-button opacity crossfade with auto-revert
   - Same as above but with internal state management
   - Automatically reverts from 'check' back to 'copy' after timeout
   - Perfect for "copied to clipboard" feedback
   
   ADJUSTABLE PARAMETERS:
   - Auto-revert delay: line 125 (setTimeout duration)
   - Fade speed: line 173 (.button-layer transition)
   - Container size: lines 162-163 (wrapper dimensions)
   
   ============================================ */

interface MorphingCopyToCheckButtonProps {
  onClick?: () => void;  // Called when copy button is clicked (not on auto-revert)
  className?: string;
  disabled?: boolean;
}

export const MorphingCopyToCheckButton: React.FC<MorphingCopyToCheckButtonProps> = ({
  onClick,
  className = '',
  disabled = false
}) => {
  // Internal state - starts as 'copy', switches to 'check' on click
  const [state, setState] = useState<'copy' | 'check'>('copy');

  const handleClick = () => {
    // Prevent clicks when disabled or already in check state
    if (disabled || state === 'check') return;
    
    // Switch to check state and notify parent
    setState('check');
    onClick?.();
  };

  // Auto-revert timer: Returns to 'copy' state after delay
  useEffect(() => {
    if (state === 'check') {
      const timer = setTimeout(() => {
        setState('copy');
      }, 2000);  // ADJUST: Change 3000 (3 seconds) to modify auto-revert delay

      // Cleanup: Clear timer if component unmounts or state changes before timeout
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <>
      <div className={`morphing-copy-check-wrapper ${className}`}>
        {/* Copy Button - visible in copy state */}
        <div 
          className={`button-layer copy-layer ${state === 'copy' ? 'active' : ''}`}
          onClick={state === 'copy' ? handleClick : undefined}
          style={{ pointerEvents: state === 'copy' ? 'auto' : 'none' }}
        >
          <CopyButton disabled={disabled} />
        </div>
        
        {/* Check Tick Button - visible in check state */}
        <div 
          className={`button-layer check-layer ${state === 'check' ? 'active' : ''}`}
          style={{ pointerEvents: 'none' }}
        >
          <CheckTickButton disabled={disabled} />
        </div>
      </div>
      
      <style jsx>{`
        /* Accessibility: Disable animations for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .button-layer {
            transition: none !important;
          }
        }
        
        /* Fixed container prevents layout shift */
        .morphing-copy-check-wrapper {
          position: relative;
          width: 38px;   /* ADJUST: Both buttons are 38px square */
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
          transition: opacity 0.1s ease-out;  /* SPEED CONTROL: Fast transition (0.1s) for snappy feedback */
          pointer-events: none;  /* Prevent clicks on hidden button */
        }
        
        /* Active button is visible */
        .button-layer.active {
          opacity: 1;  /* Fully visible */
        }
        
        /* Only copy button should be clickable (check button is just visual feedback) */
        .button-layer.copy-layer.active {
          pointer-events: auto;  /* Enable clicks on copy button */
        }
      `}</style>
    </>
  );
};

/* ============================================
   MORPHING CLOSE TO COPY BUTTON
   
   PATTERN: Two-button opacity crossfade
   - CloseButton (X icon) fades to CopyButton (copy icon)
   - Same 38×38px dimensions for both buttons
   - Used in RecordNavBar to transition between recording states
   
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
   MORPHING PROCESSING TO STRUCTURE BUTTON
   
   PATTERN: Single button that physically morphs dimensions/properties
   - ONE <button> element that changes width, height, background, border-radius
   - Icons crossfade inside the morphing button (opacity 0 ↔ 1)
   - Follows deepMorphingButtons.tsx MorphingRightButton pattern
   
   MORPH BEHAVIOR:
   - Processing: 76px × 42px white pill → Structure: 38px × 38px semi-transparent circle
   - Shrinks from left to right (right-aligned, transform-origin: right center)
   - Icons stay centered throughout morph
   - Vertical centering prevents "upward jump" during height change
   
   ADJUSTABLE PARAMETERS:
   - Morph speed: 0.2s (transition durations - keep synchronized!)
   - Button dimensions: Processing (76×42px), Structure (38×38px)
   - Colors: Background colors from CSS variables (--RecWhite, --RecWhite_10)
   - Border radius: Processing (24px), Structure (32px)
   - Container size: Must fit largest state
   - Icon sizes: Processing (20px), Structure (24px)
   - Spinner rotation speed: 1.5s (animation duration)
   
   ============================================ */

interface MorphingProcessingToStructureButtonProps {
  state: 'processing' | 'structure';  // Parent controls which state button is in
  onProcessingClick?: () => void;      // Callback when clicked in 'processing' state
  onStructureClick?: () => void;       // Callback when clicked in 'structure' state
  className?: string;
  disabled?: boolean;
}

export const MorphingProcessingToStructureButton: React.FC<MorphingProcessingToStructureButtonProps> = ({
  state,
  onProcessingClick,
  onStructureClick,
  className = '',
  disabled = false
}) => {
  const handleClick = () => {
    switch (state) {
      case 'processing':
        onProcessingClick?.();
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
          className={`morphing-processing-structure-button state-${state} ${className} ${styles.container}`}
          onClick={handleClick}
          disabled={disabled}
          aria-label={`${state} button`}
        >
          <div className="content-container">
            {/* Processing Spinner SVG - visible in processing state */}
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

            {/* Structure Icon - visible in structure state */}
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
          .morphing-processing-structure-button,
          .morphing-processing-structure-button * {
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
          width: 76px;        /* ADJUST: Must be >= largest button width (processing: 76px) */
          height: 42px;       /* ADJUST: Must be >= tallest button height (processing: 42px) */
          display: flex;
          align-items: center;      /* CRITICAL: Centers button vertically to prevent "upward jump" when height shrinks */
          justify-content: flex-end;  /* CRITICAL: Right-aligns button for left-to-right shrinking */
        }
        
        /* ========================================
           THE MORPHING BUTTON - One element that changes all properties
           ======================================== */
        
        .morphing-processing-structure-button {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          border: none;
          cursor: pointer;
          
          /* INITIAL STATE - Processing (Large white pill) */
          width: 76px;                      /* ADJUST: Processing button width */
          height: 42px;                     /* ADJUST: Processing button height */
          background: var(--RecWhite);      /* ADJUST: Processing button color (white) */
          border-radius: 24px;              /* ADJUST: Processing button roundness */
          
          /* MORPHING DIRECTION - Right to left shrinking */
          transform-origin: right center;   /* CRITICAL: Makes button shrink from left edge, fixed on right */
          margin-left: auto;                /* CRITICAL: Pushes button to right side of container */
          
          /* ANIMATION TIMING - All properties morph together */
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);  /* SPEED CONTROL: Change 0.2s for faster/slower morph */
          will-change: transform, background, width, height;   /* Performance hint for browser */
          overflow: hidden;  /* Hide content overflow during morph */
        }
        
        /* MORPHED STATE - Structure (Small semi-transparent circle) */
        .morphing-processing-structure-button.state-structure {
          width: 38px;                      /* ADJUST: Structure button width (smaller) */
          height: 38px;                     /* ADJUST: Structure button height (smaller) */
          background: var(--RecWhite_10);   /* ADJUST: Structure button color (10% white opacity) */
          border-radius: 32px;              /* ADJUST: Structure button roundness (more circular) */
        }
        
        /* Disabled state styling */
        .morphing-processing-structure-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* ========================================
           ICON CROSSFADE - Two icons swap visibility during morph
           ======================================== */
        
        /* Fixed content area - icons crossfade within this space */
        .content-container {
          position: relative;
          width: 24px;          /* ADJUST: Must be >= largest icon (structure: 24px) */
          height: 24px;         /* ADJUST: Must be >= largest icon (structure: 24px) */
          display: flex;
          justify-content: center;
          align-items: center;
          transform: translateZ(0);  /* GPU acceleration for smooth animation */
          margin: 0 auto;            /* Centers icons in morphing button */
        }
        
        /* ========================================
           PROCESSING SPINNER ICON
           ======================================== */
        
        .processing-svg-icon {
          position: absolute;
          width: 20px;         /* ADJUST: Processing icon size (20px spinner) */
          height: 20px;
          opacity: 1;          /* Visible in processing state */
          transition: opacity 0.2s ease;  /* SPEED CONTROL: Must match button morph speed */
          top: 0; left: 0; right: 0; bottom: 0;
          margin: auto;        /* Centers icon absolutely */
          transform: translateZ(0);       /* GPU acceleration */
          backface-visibility: hidden;    /* Prevents flickering during animation */
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
        
        /* Hide spinner when in structure state */
        .morphing-processing-structure-button.state-structure .processing-svg-icon {
          opacity: 0;  /* Fade out during morph */
        }
        
        /* Pause spinner animation when button is disabled */
        .morphing-processing-structure-button:disabled .processing-svg-icon svg {
          animation-play-state: paused;
        }
        
        /* ========================================
           STRUCTURE ICON
           ======================================== */
        
        .structure-icon {
          position: absolute;
          width: 24px;         /* ADJUST: Structure icon size (24px lines) */
          height: 24px;
          opacity: 0;          /* Hidden in processing state */
          transition: opacity 0.2s ease;  /* SPEED CONTROL: Must match button morph speed */
          top: 0; left: 0; right: 0; bottom: 0;
          margin: auto;        /* Centers icon absolutely */
          transform: translateZ(0);       /* GPU acceleration */
          backface-visibility: hidden;    /* Prevents flickering during animation */
        }
        
        /* Show structure icon when in structure state */
        .morphing-processing-structure-button.state-structure .structure-icon {
          opacity: 1;  /* Fade in during morph */
        }
      `}</style>
    </>
  );
};

/* ============================================
   MORPHING TIMER + PROCESSING TO STRUCTURE
   
   PATTERN: Container div with fading timer + morphing button
   - Reuses MorphingProcessingToStructureButton (0.2s morph)
   - Timer fades out at 0.1s (half the button morph duration)
   - Container has fixed 130px width for timer to glide within
   - Button-width-tracker reports button size changes to parent
   
   MORPH BEHAVIOR:
   - Processing state: Timer visible (44px) + gap (10px) + Button (76px) in 130px container
   - Structure state: Timer invisible (44px still occupied) + gap (10px) + Button (38px) in 130px container
   - Timer fades out first (0.1s), then button finishes shrinking (0.2s total)
   - Timer glides right as button shrinks (justify-content: flex-end)
   
   ADJUSTABLE PARAMETERS:
   - Timer fade speed: 0.1s (.timer-text-wrapper transition) - MUST be half of button morph
   - Button morph speed: Controlled by MorphingProcessingToStructureButton (0.2s)
   - Button-width-tracker: 0.2s (reports button width to parent)
   - Container width: Fixed 130px (provides gliding space)
   - Gap between elements: 10px (gap property)
   - Time display: time prop (default '0:26')
   
   ============================================ */

interface MorphingTimerProcessingToStructureProps {
  state: 'processing' | 'structure';  // Parent controls which state
  time?: string;                       // Timer display (e.g., '0:26')
  onProcessingClick?: () => void;      // Callback when clicked in 'processing' state
  onStructureClick?: () => void;       // Callback when clicked in 'structure' state
  className?: string;
  disabled?: boolean;
}

export const MorphingTimerProcessingToStructure: React.FC<MorphingTimerProcessingToStructureProps> = ({
  state,
  time = '0:26',
  onProcessingClick,
  onStructureClick,
  className = '',
  disabled = false
}) => {
  return (
    <>
      <div className={`timer-processing-container state-${state} ${className} ${styles.container}`}>
        {/* Timer Text - Fades out in structure state */}
        <div className="timer-text-wrapper">
          <TimerText time={time} />
        </div>
        
        {/* Width-tracking wrapper for button - allows parent to see width changes */}
        <div className="button-width-tracker">
          <MorphingProcessingToStructureButton
            state={state}
            onProcessingClick={onProcessingClick}
            onStructureClick={onStructureClick}
            disabled={disabled}
          />
        </div>
      </div>
      
      <style jsx>{`
        /* ========================================
           ACCESSIBILITY
           ======================================== */
        
        @media (prefers-reduced-motion: reduce) {
          .timer-processing-container,
          .timer-processing-container * {
            transition: none !important;
          }
        }
        
        /* ========================================
           CONTAINER DIV - Naturally shrinks with content
           Mimics timer-done-container from recordnavbar.tsx
           ======================================== */
        
        .timer-processing-container {
          /* Layout - Flex row to hold timer + button */
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;  /* CRITICAL: Right-align contents so timer glides as space opens up */
          padding: 0px;
          gap: 10px;          /* ADJUST: Space between timer and button */
          
          /* Fixed width - provides space for timer to glide within */
          width: 130px;       /* FIXED: Timer (44px) + gap (10px) + Button (76px) = 130px */
          height: 42px;       /* Fixed height matches button height */
        }
        
        /* ========================================
           TIMER TEXT WRAPPER - Fades out during morph
           ======================================== */
        
        .timer-text-wrapper {
          /* Layout */
          display: flex;
          align-items: center;
          width: 44px;       /* Fixed width of TimerText component */
          height: 42px;
          
          /* Visibility - Full opacity in processing state */
          opacity: 1;
          
          /* Fade timing - Half the button morph duration */
          transition: opacity 0.1s ease;  /* SPEED CONTROL: MUST be half of button morph (0.2s / 2 = 0.1s) */
        }
        
        /* Timer hidden in structure state - fades out first */
        .timer-processing-container.state-structure .timer-text-wrapper {
          opacity: 0;             /* Completely hidden - fades out in 0.1s */
          pointer-events: none;   /* Remove from interaction */
        }
        
        /* ========================================
           BUTTON WIDTH TRACKER - Reports button width to parent flexbox
           ======================================== */
        
        .button-width-tracker {
          /* Tracks button's morphing width without interfering with internal alignment */
          width: 76px;         /* Initial width - matches processing button */
          height: 42px;        /* Match button height */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);  /* Match button morph speed */
          overflow: hidden;    /* CRITICAL: Clips the 76px internal container when wrapper shrinks */
          display: flex;
          align-items: center;
          justify-content: flex-end;  /* Keep button right-aligned within tracker */
        }
        
        /* Shrink wrapper to match button's morphed width */
        .timer-processing-container.state-structure .button-width-tracker {
          width: 38px;         /* Final width - matches structure button */
        }
      `}</style>
    </>
  );
};

// Create a named object for default export
const clipMorphingButtons = {
  MorphingDoneToProcessingButton,
  MorphingCopyToCheckButton,
  MorphingCloseToCopyButton,
  MorphingProcessingToStructureButton,
  MorphingTimerProcessingToStructure
};

export default clipMorphingButtons;

