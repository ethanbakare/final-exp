import React, { useState } from 'react';
import { VoiceTextStates, VoiceTextState } from './ui/VoiceTextStates';
import { MorphingRecordDarkToPillWaveProcessing } from './ui/voicenavbar';
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
 * IDLE → RECORDING → PROCESSING → COMPLETE
 */

type AppState = 'idle' | 'recording' | 'processing' | 'complete';

export const VoiceTextBoxStandard: React.FC = () => {
  // Simple state management (Phase 0)
  const [appState, setAppState] = useState<AppState>('idle');
  const [transcription, setTranscription] = useState<string>('');
  const [previousTranscription, setPreviousTranscription] = useState<string>('');

  // Ref to track and cancel ongoing API requests
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Map app state to text state
  const getTextState = (): VoiceTextState => {
    // Map 'complete' to 'results' for VoiceTextStates component
    if (appState === 'complete') return 'results';
    return appState as VoiceTextState;
  };

  /**
   * Start Recording
   */
  const handleStartRecording = () => {
    // If starting from complete state (appending mode), accumulate all text into previous
    if (appState === 'complete' && transcription) {
      // Combine any existing previous text with current transcription
      const allPreviousText = previousTranscription 
        ? `${previousTranscription}\n\n${transcription}`
        : transcription;
      setPreviousTranscription(allPreviousText);
      setTranscription('');  // Clear current for new recording
    }

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

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const newText = data.text || 'Mock transcription result';

      // Keep previous text separate - only animate the new portion
      // Previous text stays in previousTranscription (shown at idle opacity)
      // New text goes in transcription (animates in)
      setTranscription(newText);
      // Don't clear previousTranscription - keep it for display

      setAppState('complete');
    } catch (error) {
      // Don't show error if request was aborted (user clicked Close)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      console.error('Transcription error:', error);
      const fallbackText = 'This is a mock transcription result for testing.';

      // Keep previous text separate - only animate the new portion
      setTranscription(fallbackText);
      // Don't clear previousTranscription - keep it for display

      setAppState('complete');
    }
  };

  /**
   * Close - cancel current recording but preserve text
   */
  const handleClose = () => {
    // Cancel ongoing API request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Restore to previous state if we were appending
    if (previousTranscription) {
      // Split the accumulated previous text back into previous and current
      // This maintains the separation for proper display
      const parts = previousTranscription.split('\n\n');
      if (parts.length > 1) {
        // Multiple recordings - keep all but last in previous, last in current
        const lastText = parts.pop() || '';
        setPreviousTranscription(parts.join('\n\n'));
        setTranscription(lastText);
      } else {
        // Only one previous recording
        setPreviousTranscription('');
        setTranscription(previousTranscription);
      }
      setAppState('complete');  // Return to complete state with previous text
    } else {
      setAppState('idle');  // Return to idle if no previous text
      setTranscription('');
    }
  };

  /**
   * Clear - return to idle and clear all text
   */
  const handleClear = () => {
    // Cancel ongoing API request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setAppState('idle');
    setTranscription('');
    setPreviousTranscription('');  // Clear all text
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
                previousText={previousTranscription}
                variation={1}
              />
            </div>

            {/* Fade overlay at bottom (only visible when text overflows) */}
            {appState === 'complete' && transcription && (
              <div className="fade-overlay"></div>
            )}
          </div>

          {/* Navigation Bar - Morphing Button System */}
          <div className="txt-nav-bar">
            <MorphingRecordDarkToPillWaveProcessing
              state={appState}
              onRecordClick={handleStartRecording}
              onStopRecordingClick={handleStopRecording}
              onProcessingComplete={() => setAppState('complete')}
              onCloseClick={handleClose}
              onClearClick={handleClear}
            />
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
          justify-content: center;
          align-items: center;
          padding: 0px 12px;
          gap: 0px;

          width: 100%;
          height: 38px;

          border-radius: 6px;

          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};
