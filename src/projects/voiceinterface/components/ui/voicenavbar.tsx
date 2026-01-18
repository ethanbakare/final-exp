import React, { useState } from 'react';
import styles from '@/projects/voiceinterface/styles/voice.module.css';
import { VoiceLiveTimerSeconds } from './VoiceLiveTimerSeconds';
import { VoiceLiveWaveform } from './VoiceLiveWaveform';
import { VoiceLiveTimer } from './VoiceLiveTimer';
import { CloseButton, ClearButton, ClearButtonFaded, CopyButton, TimeCountButton } from './voicebuttons';

/* ============================================
   VOICE NAV BAR
   (Based on MorphingRecordDarkToPillWaveProcessing)
   ============================================ */

export type MorphingRecordDarkToPillWaveProcessingState = 'idle' | 'recording' | 'processing' | 'complete';

interface MorphingRecordDarkToPillWaveProcessingProps {
    state: MorphingRecordDarkToPillWaveProcessingState;
    onRecordClick?: () => void;
    onStopRecordingClick?: () => void;
    onProcessingComplete?: () => void;
    onCloseClick?: () => void;
    onClearClick?: () => void;
    className?: string;
    disabled?: boolean;
}

export const MorphingRecordDarkToPillWaveProcessing: React.FC<MorphingRecordDarkToPillWaveProcessingProps> = ({
    state,
    onRecordClick,
    onStopRecordingClick,
    onProcessingComplete,
    onCloseClick,
    onClearClick,
    className = '',
    disabled = false
}) => {
    // Timer width is controlled by VoiceLiveTimerSeconds via callback
    const [timerWidth, setTimerWidth] = useState(38);
    const [shouldResetTimer, setShouldResetTimer] = useState(true);
    const [timerSessionKey, setTimerSessionKey] = useState(0);

    // Auto-revert timer for processing state
    React.useEffect(() => {
        if (state === 'processing') {
            const timer = setTimeout(() => {
                onProcessingComplete?.();
            }, 3000); // 3 seconds

            return () => clearTimeout(timer);
        }
    }, [state, onProcessingComplete]);

    // Handle delayed timer reset to prevent visual glitching during transition
    React.useEffect(() => {
        if (state === 'idle') {
            const timer = setTimeout(() => {
                setShouldResetTimer(true);
            }, 500); // Wait for transition to finish before resetting
            return () => clearTimeout(timer);
        } else {
            setShouldResetTimer(false);
        }
    }, [state]);

    // Container width (Right Button)
    // Idle: 38
    // Recording or Processing: timer + 10 + 64 (Timer stays visible during processing)
    const isExpanded = state === 'recording' || state === 'processing';
    const containerWidth = isExpanded ? timerWidth + 10 + 64 : 38;

    const handleClick = () => {
        if (disabled) return;
        if (state === 'idle') {
            setTimerSessionKey(prev => prev + 1); // Force fresh timer instance
            onRecordClick?.();
        } else if (state === 'recording') {
            onStopRecordingClick?.();
        } else if (state === 'complete') {
            // New recording from complete state
            onRecordClick?.();
        }
    };

    return (
        <>
            <div className={`navbar-container state-${state} ${className}`}>
                {/* Left Side: Close Button */}
                <div className="nav-left">
                    <div className="left-btn-stack">
                        <div className="close-wrapper">
                            <CloseButton onClick={onCloseClick} disabled={disabled} />
                        </div>
                        <div className="clear-wrapper">
                            <ClearButton onClick={onClearClick} disabled={disabled} />
                        </div>
                    </div>
                </div>

                {/* Right Side: Morphing Button */}
                <div className="nav-right">
                    <div
                        className={`vdp-container state-${state} ${styles.container}`}
                        style={{ width: `${containerWidth}px` }}
                    >
                        {/* Timer Text - Fades in during recording/processing state */}
                        <div
                            className="vdp-timer-wrapper"
                            style={{ width: isExpanded ? `${timerWidth}px` : '0px' }}
                        >
                            <VoiceLiveTimerSeconds
                                key={timerSessionKey}
                                isRunning={state === 'recording'}
                                onWidthChange={setTimerWidth}
                                shouldReset={shouldResetTimer}
                            />
                        </div>

                        {/* Button-width-tracker */}
                        <div className="vdp-width-tracker">
                            <button
                                className={`vdp-morph-button state-${state}`}
                                onClick={handleClick}
                                disabled={disabled}
                                aria-label={state === 'idle' || state === 'complete' ? 'Record' : state === 'recording' ? 'Stop Recording' : 'Processing'}
                            >
                                {/* Content container for icon crossfade */}
                                <div className="vdp-content">
                                    {/* Mic Icon - visible in idle state - WHITE ICON */}
                                    <div className="vdp-mic">
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M18.3971 12.2769C17.8972 15.3597 15.223 17.7133 11.9991 17.7133C8.77602 17.7133 6.10239 15.3609 5.60156 12.2793M11.9986 20.9999V17.8829M13.9334 20.9999H10.1002M12.0021 13.9198C10.1696 13.9198 8.68411 12.4343 8.68411 10.6018V6.31787C8.68411 4.48539 10.1696 2.99988 12.0021 2.99988C13.8346 2.99988 15.3201 4.48539 15.3201 6.31786V10.6018C15.3201 12.4343 13.8346 13.9198 12.0021 13.9198Z"
                                                stroke="#FFFFFF"
                                                strokeOpacity="1"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </div>

                                    {/* Waveform - visible only in recording */}
                                    <div className="vdp-wave">
                                        <VoiceLiveWaveform active={state === 'recording'} />
                                    </div>

                                    {/* Processing Spinner - visible only in processing */}
                                    <div className="vdp-spinner-wrapper">
                                        <div className="vdp-spinner-container">
                                            <svg
                                                className="vdp-spinner"
                                                width="20"
                                                height="20"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path d="M10 15.5V18.5" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                                                <path d="M4.5 10L1.5 10" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                                                <path d="M10 1.5V4.5" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                                                <path d="M18.5 10L15.5 10" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                                                <path d="M6.11 13.89L3.99 16.01" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                                                <path d="M6.11 6.11L3.99 3.99" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                                                <path d="M16.01 3.99L13.89 6.11" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                                                <path d="M16.01 16.01L13.89 13.89" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        /* Navbar Layout */
        .navbar-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            max-width: 368px;
            height: 100%;
            padding: 0;
            box-sizing: border-box;
        }

        .nav-left {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            min-width: 38px; /* Reserve space? Or let it collapse? User said fade in... */
        }

        .nav-right {
            display: flex;
            align-items: center;
            justify-content: flex-end;
        }

        .close-wrapper {
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }

        .navbar-container.state-recording .close-wrapper,
        .navbar-container.state-processing .close-wrapper {
            opacity: 1;
            pointer-events: auto;
        }

        .clear-wrapper {
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            position: absolute;
            top: 0;
            left: 0;
        }

        .navbar-container.state-complete .clear-wrapper {
            opacity: 1;
            pointer-events: auto;
        }

        .left-btn-stack {
            position: relative;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
        }

        /* Reuse similar styles to v1d but with processing additions */
        
        .vdp-container {
          display: flex;
          align-items: center;
          gap: 0px;
          height: 38px; /* Was 40px */
          transition: gap 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .vdp-container.state-recording,
        .vdp-container.state-processing {
          gap: 10px;
          height: 38px;
        }

        .vdp-timer-wrapper {
          display: flex;
          align-items: center;
          height: 26px;
          box-sizing: border-box;
          opacity: 0;
          pointer-events: none;
          overflow: hidden;
          transition: opacity 0.1s ease,
                      width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .vdp-container.state-recording .vdp-timer-wrapper,
        .vdp-container.state-processing .vdp-timer-wrapper {
          opacity: 1;
          pointer-events: auto;
        }

        .vdp-width-tracker {
          width: 38px;
          height: 38px;
          box-sizing: border-box;
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .vdp-container.state-recording .vdp-width-tracker,
        .vdp-container.state-processing .vdp-width-tracker {
          width: 66px;         /* Recording/Process width */
          height: 36px; /* Still fits in 38 (38-2=36?) */
        }

        .vdp-morph-button {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px;
          cursor: pointer;
          box-sizing: border-box;
          
          width: 38px;
          height: 38px;
          background: var(--VoiceDarkGrey_90);
          border-radius: 19px;
          border: none;

          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width, height, background, border-radius;
          overflow: hidden;
        }

        .vdp-morph-button.state-recording,
        .vdp-morph-button.state-processing {
          width: 64px;
          height: 34px;
          padding: 10px 16px;
          background: var(--VoiceDarkGrey_90);
          border-radius: 20px;
        }

        .vdp-content {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vdp-mic {
           position: absolute;
           top: 0;
           left: 0;
           width: 100%;
           height: 100%;
           display: flex;
           align-items: center;
           justify-content: center;
           opacity: 1;
           transition: opacity 0.15s ease;
        }
        .vdp-morph-button.state-recording .vdp-mic,
        .vdp-morph-button.state-processing .vdp-mic {
           opacity: 0;
        }

        .vdp-wave {
           position: absolute;
           top: 0;
           left: 0;
           width: 100%;
           height: 100%;
           display: flex;
           align-items: center;
           justify-content: center;
           opacity: 0;
           transition: opacity 0.15s ease;
        }
        .vdp-morph-button.state-recording .vdp-wave {
           opacity: 1;
        }
        .vdp-morph-button.state-processing .vdp-wave {
           opacity: 0;
        }

        .vdp-spinner-wrapper {
           position: absolute;
           top: 0;
           left: 0;
           width: 100%;
           height: 100%;
           display: flex;
           align-items: center;
           justify-content: center;
           opacity: 0;
           transition: opacity 0.15s ease;
        }
        .vdp-morph-button.state-processing .vdp-spinner-wrapper {
           opacity: 1;
        }

        .vdp-spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 20px;
          height: 20px;
        }
        .vdp-spinner {
          width: 20px;
          height: 20px;
          transform-origin: center center;
          animation: rotate-vdp 1.5s linear infinite;
        }
        
        @keyframes rotate-vdp {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </>
    );
};

/* ============================================
   MORPHING PROCESSING TO COMBO (Split Morph)
   
   Pattern: 4-state navbar with processing animation
   - Idle: Record button only (38px circle)
   - Recording: Timer + Check/Close button (expanded)
   - Processing: Timer + Spinner (processing animation)
   - Combo: ClearButton + Record button (side by side)
   ============================================ */

export type RecordProcessingComboState = 'idle' | 'recording' | 'processing' | 'combo';

interface MorphingProcessingToComboProps {
    state: RecordProcessingComboState;
    onRecordClick?: () => void;
    onConfirmClick?: () => void;
    onCancelClick?: () => void; // Used for X in recording
    onClearClick?: () => void; // Used for ClearButton in combo (defaults to onCancelClick if not provided)
    onProcessingComplete?: () => void;
    className?: string;
    disabled?: boolean;
}

export const MorphingProcessingToCombo: React.FC<MorphingProcessingToComboProps> = ({
    state,
    onRecordClick,
    onConfirmClick,
    onCancelClick,
    onClearClick,
    onProcessingComplete,
    className = '',
    disabled = false
}) => {
    // Timer width is controlled by TimeCountButton via callback
    const [timeCountWidth, setTimeCountWidth] = useState(58);

    // Auto-revert timer for processing state -> combo state
    React.useEffect(() => {
        if (state === 'processing') {
            const timer = setTimeout(() => {
                onProcessingComplete?.();
            }, 3000); // 3 seconds

            return () => clearTimeout(timer);
        }
    }, [state, onProcessingComplete]);

    // Button expands when recording or processing
    const isExpanded = state === 'recording' || state === 'processing';

    // Dimensions
    // In 'combo' state:
    // - Timer wrapper becomes ClearButton (width 38px)
    // - Gap becomes 10px
    // - Button becomes RecordButton idle size (40px wrapper, 38px button)
    const isCombo = state === 'combo';

    const buttonWidth = isExpanded ? 74 : 40; // Combo uses 40 (idle size)
    const gap = isCombo || isExpanded ? 10 : 10; // Gap is 10 in combo too. Idle is 0 but we can keep 10 if width is 0. 
    // Actually, idle has gap 0.

    // Container calculation
    // Idle: 40px
    // Recording/Processing: timeCountWidth + 10 + 74
    // Combo: 38 (Clear) + 10 + 40 (Record) = 88px

    let containerWidth = 40;
    if (isExpanded) {
        containerWidth = timeCountWidth + 10 + buttonWidth;
    } else if (isCombo) {
        containerWidth = 38 + 10 + 40;
    }

    // Timer wrapper width
    // Idle: 0
    // Rec/Proc: timeCountWidth
    // Combo: 38 (ClearButton size)
    let timerWrapperWidth = isExpanded ? timeCountWidth : 0;
    if (isCombo) timerWrapperWidth = 38;

    return (
        <>
            <div
                className={`v2c-container state-${state} ${className} ${styles.container}`}
            >
                {/* Timer Wrapper: Morphs between Timer and ClearButton */}
                <div
                    className="v2c-timer-wrapper"
                    style={{ width: `${timerWrapperWidth}px` }}
                >
                    {/* Timer Component - Visible in Rec/Proc */}
                    <div className={`v2c-content-timer ${isExpanded ? 'visible' : ''}`}>
                        <TimeCountButton
                            isTimerRunning={state === 'recording'}
                            onWidthChange={setTimeCountWidth}
                            shouldReset={state === 'idle' || state === 'combo'}
                        />
                    </div>

                    {/* Clear Button - Visible in Combo */}
                    <div className={`v2c-content-clear ${isCombo ? 'visible' : ''}`} style={{ pointerEvents: isCombo ? 'auto' : 'none' }}>
                        <ClearButtonFaded onClick={() => isCombo && (onClearClick?.() ?? onCancelClick?.())} />
                    </div>
                </div>

                {/* Button tracker (Right side) */}
                <div className="v2c-button-tracker">
                    {/* Morphing button */}
                    <button
                        className={`v2c-morph-border state-${state}`}
                        onClick={() => (state === 'idle' || state === 'combo') && !disabled && onRecordClick?.()}
                        disabled={disabled}
                        aria-label={
                            state === 'idle' || state === 'combo' ? 'Start recording' :
                                state === 'recording' ? 'Confirm or cancel recording' :
                                    'Processing...'
                        }
                    >
                        {/* Mic icon - Visible in Idle & Combo */}
                        <div className={`v2c-mic-icon ${state === 'idle' || state === 'combo' ? 'visible' : ''}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18.3971 12.2769C17.8972 15.3597 15.223 17.7133 11.9991 17.7133C8.77602 17.7133 6.10239 15.3609 5.60156 12.2793M11.9986 20.9999V17.8829M13.9334 20.9999H10.1002M12.0021 13.9198C10.1696 13.9198 8.68411 12.4343 8.68411 10.6018V6.31787C8.68411 4.48539 10.1696 2.99988 12.0021 2.99988C13.8346 2.99988 15.3201 4.48539 15.3201 6.31786V10.6018C15.3201 12.4343 13.8346 13.9198 12.0021 13.9198Z" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>

                        {/* CheckAndCloseButton structure - visible in recording only */}
                        <div className={`v2c-checkclose-content ${state === 'recording' ? 'visible' : ''}`}>
                            {/* Check Division */}
                            <div
                                className="v2c-check-div"
                                role="button"
                                tabIndex={state === 'recording' ? 0 : -1}
                                aria-label="Confirm"
                                onClick={(e) => { e.stopPropagation(); onConfirmClick?.(); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onConfirmClick?.(); } }}
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 8.99997L6.71231 12.7123L14.6676 4.75732" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            {/* Divider */}
                            <div className="v2c-divider">
                                <svg width="1" height="18" viewBox="0 0 1 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="0.5" y1="0" x2="0.5" y2="18" stroke="#262424" strokeOpacity="0.2" strokeWidth="1" strokeLinecap="round" />
                                </svg>
                            </div>
                            {/* Close Division */}
                            <div
                                className="v2c-close-div"
                                role="button"
                                tabIndex={state === 'recording' ? 0 : -1}
                                aria-label="Cancel"
                                onClick={(e) => { e.stopPropagation(); onCancelClick?.(); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onCancelClick?.(); } }}
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13.5 13.5L4.5 4.5M13.5 4.5L4.5 13.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Processing spinner - visible in processing only */}
                        <div className={`v2c-spinner-content ${state === 'processing' ? 'visible' : ''}`}>
                            <div className="v2c-spinner-container">
                                <svg
                                    className="v2c-spinner"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M10 15.5V18.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                                    <path d="M4.5 10L1.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                                    <path d="M10 1.5V4.5" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                                    <path d="M18.5 10L15.5 10" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                                    <path d="M6.11 13.89L3.99 16.01" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                                    <path d="M6.11 6.11L3.99 3.99" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                                    <path d="M16.01 3.99L13.89 6.11" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                                    <path d="M16.01 16.01L13.89 13.89" stroke="#262424" strokeOpacity="0.9" strokeWidth="1.75" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .v2c-container, .v2c-container * { transition: none !important; animation: none !important; }
        }

        @keyframes spin-v2c {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .v2c-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          gap: 0px;
          width: 100%;
          max-width: 344px;
          height: 40px;
          box-sizing: border-box;
          transition: gap 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v2c-container.state-recording,
        .v2c-container.state-processing,
        .v2c-container.state-combo { gap: 10px; }

        .v2c-timer-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center; /* Center content for clear button */
          height: 40px; /* Match container height - was 38px */
          opacity: 1; 
          overflow: hidden;
          /* border: 0.5px solid blue; REMOVED DEBUG */
          /* Transition for width changes */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        /* Hide by default in idle */
        .v2c-container.state-idle .v2c-timer-wrapper {
          opacity: 0;
          width: 0;
        }

        /* Content inside timer wrapper: Crossfade logic */
        .v2c-content-timer,
        .v2c-content-clear {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s ease;
          opacity: 0;
          pointer-events: none;
        }
        
        .v2c-content-timer.visible { opacity: 1; pointer-events: auto; }
        .v2c-content-clear.visible { opacity: 1; pointer-events: auto; }
        
        /* Clear button specific to ensure it centers nicely */
        .v2c-content-clear {
          width: 38px;
          height: 38px;
        }

        .v2c-button-tracker {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          /* border: 0.5px solid green; REMOVED DEBUG */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v2c-container.state-recording .v2c-button-tracker,
        .v2c-container.state-processing .v2c-button-tracker { width: 74px; }
        /* In Combo, it shrinks back to 40px (Idle size) */

        .v2c-morph-border {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          box-sizing: border-box;
          cursor: pointer;
          width: 38px;
          height: 38px;
          border: 1.13px solid var(--VoiceDarkGrey_20);
          border-radius: 19px;
          background: transparent;
          /* outline: 0.5px solid orange; REMOVED DEBUG */
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .v2c-morph-border.state-recording,
        .v2c-morph-border.state-processing {
          width: 72px;
          height: 34px;
          border-radius: 24px;
          padding: 4px;
        }
        /* In Combo, it reverts to 38px circle (default styles) */

        /* Mic Icon */
        .v2c-mic-icon {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .v2c-mic-icon.visible { opacity: 1; }

        /* Check/Close content */
        .v2c-checkclose-content {
          position: absolute;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          width: 64px;
          height: 26px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .v2c-checkclose-content.visible { 
          opacity: 1; 
          pointer-events: auto;
        }

        .v2c-check-div {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px 6px 0px 8px;
          width: 32px;
          height: 26px;
          background: transparent;
          border-radius: 40px 0px 0px 40px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-radius 0.2s ease;
        }
        .v2c-check-div:hover { 
          background: var(--VoiceDarkGrey_5); 
          border-radius: 40px 2px 2px 40px;
        }

        .v2c-divider {
          width: 1px;
          height: 18px;
          display: flex;
          align-items: center;
          transition: opacity 0.2s ease;
        }
        .v2c-check-div:hover ~ .v2c-divider,
        .v2c-close-div:hover ~ .v2c-divider,
        .v2c-checkclose-content:hover .v2c-divider { opacity: 0; }

        .v2c-close-div {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0px 8px 0px 6px;
          width: 32px;
          height: 26px;
          background: transparent;
          border-radius: 0px 40px 40px 0px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-radius 0.2s ease;
        }
        .v2c-close-div:hover { 
          background: var(--VoiceDarkGrey_5); 
          border-radius: 2px 40px 40px 2px;
        }

        /* Spinner content */
        .v2c-spinner-content {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 64px;
          height: 26px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .v2c-spinner-content.visible { 
          opacity: 1; 
        }

        .v2c-spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 20px;
          height: 20px;
        }

        .v2c-spinner {
          width: 20px;
          height: 20px;
          transform-origin: center center;
        }

        .v2c-morph-border.state-processing .v2c-spinner {
          animation: spin-v2c 1.5s linear infinite;
        }
      `}</style>
        </>
    );
};

/* ============================================
   MORPHING RECORD WIDE STOP DOCK
   
   Pattern: 3-state dock navbar
   - Idle: RecordWideButton only (centered)
   - Recording: StopRecordButton with timer (expanded)
   - Complete: CopyButton + RecordWideButton + ClearButton (dock layout)
   ============================================ */

export type RecordWideStopDockState = 'idle' | 'recording' | 'complete';

interface MorphingRecordWideStopDockProps {
    state: RecordWideStopDockState;
    onRecordClick?: () => void;
    onStopClick?: () => void;
    onCopyClick?: () => void;
    onClearClick?: () => void;
    className?: string;
    disabled?: boolean;
}

export const MorphingRecordWideStopDock: React.FC<MorphingRecordWideStopDockProps> = ({
    state,
    onRecordClick,
    onStopClick,
    onCopyClick,
    onClearClick,
    className = '',
    disabled = false
}) => {
    // Dimensions
    // VoiceDockCenter: 38 (copy) + 6 (gap) + 76 (record) + 6 (gap) + 38 (clear) = 164px × 46px
    const containerWidth = 164;
    const containerHeight = 46;

    const handleCenterClick = () => {
        if (disabled) return;
        if (state === 'idle' || state === 'complete') {
            onRecordClick?.();
        } else {
            onStopClick?.();
        }
    };

    return (
        <>
            <div className={`rwsd-container state-${state} ${className} ${styles.container}`}>
                {/* Left side button - CopyButton */}
                <div className="rwsd-left-button">
                    <CopyButton onClick={onCopyClick} disabled={disabled} />
                </div>

                {/* Center morphing button */}
                <div className="rwsd-center-wrapper">
                    <button
                        className={`rwsd-center-button state-${state}`}
                        onClick={handleCenterClick}
                        disabled={disabled}
                        aria-label={
                            state === 'idle' ? 'Start Recording' :
                                state === 'recording' ? 'Stop Recording' : 'Start New Recording'
                        }
                    >
                        {/* Content container - absolutely centered */}
                        <div className="rwsd-content">
                            {/* Mic Icon - visible in idle and complete */}
                            <div className="rwsd-mic-icon">
                                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.40583 6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452Z" fill="white" />
                                    <path d="M19.9282 13.3002C19.3867 16.6398 16.4897 19.1896 12.9971 19.1896C9.50541 19.1896 6.60896 16.6411 6.06641 13.3027M12.9965 22.75V19.3733M15.0926 22.75H10.9399M13.0003 15.08C11.0151 15.08 9.40583 13.4707 9.40583 11.4855V6.84452C9.40583 4.85934 11.0151 3.25003 13.0003 3.25003C14.9855 3.25003 16.5948 4.85934 16.5948 6.84451V11.4855C16.5948 13.4707 14.9855 15.08 13.0003 15.08Z" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>

                            {/* Stop Icon + Timer - visible in recording */}
                            <div className="rwsd-stop-content">
                                <div className="rwsd-stop-square">
                                    <div className="rwsd-stop-icon"></div>
                                </div>
                                <VoiceLiveTimer isRunning={state === 'recording'} />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Right side button - ClearButton */}
                <div className="rwsd-right-button">
                    <ClearButton onClick={onClearClick} disabled={disabled} />
                </div>
            </div>

            <style jsx>{`
        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .rwsd-container, .rwsd-container * { transition: none !important; }
        }

        /* Main container - fixed width to accommodate all states */
        .rwsd-container {
          position: relative;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: ${containerWidth}px;
          height: ${containerHeight}px;
          
          /* Debug */
          /* border: 0.5px solid red; REMOVED DEBUG */
        }

        /* Side buttons - fade in/out based on state */
        .rwsd-left-button,
        .rwsd-right-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }

        /* Side buttons visible in complete state */
        .rwsd-container.state-complete .rwsd-left-button,
        .rwsd-container.state-complete .rwsd-right-button {
          opacity: 1;
          pointer-events: auto;
        }

        /* Center wrapper - flexes to take remaining space */
        .rwsd-center-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          height: ${containerHeight}px;
          
          /* Debug */

        }

        /* Center morphing button */
        .rwsd-center-button {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          cursor: pointer;
          background: var(--VoiceDarkGrey_95);
          
          /* IDLE/COMPLETE: RecordWideButton style */
          width: 76px;
          height: 44px;
          border-radius: 23.16px;
          
          /* Morph transitions */
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      height 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      border-radius 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          
          /* Debug */
          /* outline: 0.5px solid orange; REMOVED DEBUG */
        }

        /* RECORDING: StopRecordButton style */
        .rwsd-center-button.state-recording {
          width: 112px;
          height: 46px;
          border-radius: 24px;
        }

        .rwsd-center-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Content - absolutely centered (immune to layout changes) */
        .rwsd-content {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          justify-content: center;
          align-items: center;
          width: 80px;
          height: 26px;
        }

        /* Mic Icon - visible in idle and complete */
        .rwsd-mic-icon {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 26px;
          height: 26px;
          opacity: 1;
          transition: opacity 0.2s ease;
        }
        .rwsd-center-button.state-recording .rwsd-mic-icon {
          opacity: 0;
          pointer-events: none;
        }

        /* Stop + Timer - visible in recording */
        .rwsd-stop-content {
          position: absolute;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 9px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }
        .rwsd-center-button.state-recording .rwsd-stop-content {
          opacity: 1;
          pointer-events: auto;
        }

        /* Stop square icon */
        .rwsd-stop-square {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 18px;
          height: 18px;
        }

        .rwsd-stop-icon {
          width: 8.73px;
          height: 8.73px;
          background: var(--VoiceRed);
          border-radius: 2px;
        }
      `}</style>
        </>
    );
};
