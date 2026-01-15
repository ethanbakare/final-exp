import React, { useState } from 'react';
import { VoiceTextStates, VoiceTextState } from './ui/VoiceTextStates';
import {
  CloseButton
} from './ui/voicebuttons';
import { VoiceMorphingMainButton, VoiceMainButtonState } from './ui/VoiceMorphingMainButton';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Variation 1: TextBox Standard
 *
 * Phase 0 Implementation (Walking Skeleton):
 * - Full nested container structure
 * - Simple useState for state management
 * - Instant button swaps (no morphing)
 * - Mock transcription flow
 *
 * State Flow:
 * IDLE → RECORDING → PROCESSING → RESULTS
 */

type AppState = 'idle' | 'recording' | 'processing' | 'results';

export const VoiceTextBoxStandard: React.FC = () => {
  // Simple state management (Phase 0)
  const [appState, setAppState] = useState<AppState>('idle');
  const [transcription, setTranscription] = useState<string>('');

  // Ref to track and cancel ongoing API requests
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Map app state to text state
  const getTextState = (): VoiceTextState => {
    return appState as VoiceTextState;
  };

  /**
   * Start Recording
   */
  const handleStartRecording = () => {
    setAppState('recording');
    // User clicks to stop - no auto-stop
  };

  /**
   * Stop Recording
   */
  const handleStopRecording = async () => {
    setAppState('processing');

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    // Call mock API
    try {
      const response = await fetch('/api/voice-interface/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mock: true }),
        signal: abortControllerRef.current.signal
      });

      const data = await response.json();
      setTranscription(data.text || 'Mock transcription result');
      setAppState('results');
    } catch (error) {
      // Don't show error if request was aborted (user clicked Close)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('Transcription error:', error);
      setTranscription('This is a mock transcription result for testing.');
      setAppState('results');
    }
  };

  /**
   * Clear/Close - return to idle and cancel any ongoing requests
   */
  const handleClear = () => {
    // Cancel ongoing API request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setAppState('idle');
    setTranscription('');
  };

  return (
    <>
      <div className={`text-box ${styles.container}`}>
        <div className="txt-box">
          {/* Transcript Display Area */}
          <div className="txt-transcript-box">
            <div className="transcript-scroll-wrapper">
              <VoiceTextStates
                textState={getTextState()}
                transcriptText={transcription}
                variation={1}
              />
            </div>

            {/* Fade overlay at bottom (only visible when text overflows) */}
            {appState === 'results' && transcription && (
              <div className="fade-overlay"></div>
            )}
          </div>

          {/* Navigation Bar */}
          <div className="txt-nav-bar">
            {/* Left Slot: Close button (during recording and processing) */}
            <div className="nav-left">
              {(appState === 'recording' || appState === 'processing') && (
                <CloseButton onClick={handleClear} />
              )}
            </div>

            {/* Right Slot: Morphing main button */}
            <div className="nav-right">
              <VoiceMorphingMainButton
                state={appState as VoiceMainButtonState}
                onRecordClick={handleStartRecording}
                onStopRecordingClick={handleStopRecording}
                onClearClick={handleClear}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* TextBox - Outermost Container */
        .text-box {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 15px;
          gap: 10px;

          position: relative;
          width: 398px;
          max-width: 100%;
          height: 213px;

          background: var(--VoiceBoxBg);
          border: 1px solid var(--VoiceBoxOutline);
          box-shadow: 0px 4px 12px var(--VoiceBoxShadow);
          border-radius: 16px;
        }

        /* TxtBox - Inner Container */
        .txt-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 10px;

          width: 100%;
          height: 173px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
        }

        /* TxtTranscriptBox - Text Display Area */
        .txt-transcript-box {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px;
          gap: 10px;

          width: 100%;
          height: 125px;

          border-radius: 6px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
          overflow: hidden;  /* Clip fade overlay */
        }

        /* Scrollable wrapper for text content */
        .transcript-scroll-wrapper {
          width: 100%;
          max-height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;  /* Space for scrollbar */
        }

        /* Custom scrollbar styling */
        .transcript-scroll-wrapper::-webkit-scrollbar {
          width: 8px;
        }

        .transcript-scroll-wrapper::-webkit-scrollbar-track {
          background: transparent;
        }

        .transcript-scroll-wrapper::-webkit-scrollbar-thumb {
          background: var(--VoiceDarkGrey_30);
          border-radius: 4px;
        }

        .transcript-scroll-wrapper::-webkit-scrollbar-thumb:hover {
          background: var(--VoiceDarkGrey_80);
        }

        /* Fade overlay at bottom */
        .fade-overlay {
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          height: 24px;
          background: linear-gradient(to bottom,
            rgba(247, 246, 244, 0) 0%,
            rgba(247, 246, 244, 1) 100%
          );
          pointer-events: none;
          z-index: 10;
        }

        /* TxtNavBar - Navigation Controls */
        .txt-nav-bar {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 0px 12px;
          gap: 10px;

          width: 100%;
          height: 38px;

          border-radius: 6px;

          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }

        .nav-left {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          min-width: 38px;
          opacity: 1;
          transition: opacity 0.2s ease;
        }

        .nav-left:empty {
          opacity: 0;
        }

        .nav-right {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-left: auto;
        }
      `}</style>
    </>
  );
};
