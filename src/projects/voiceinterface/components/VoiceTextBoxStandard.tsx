import React, { useState } from 'react';
import { VoiceTextStates, VoiceTextState } from './ui/VoiceTextStates';
import {
  RecordButton,
  VoicePillWave,
  ProcessingButtonDark,
  CloseButton,
  ClearButton
} from './ui/voicebuttons';
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

    // Call mock API
    try {
      const response = await fetch('/api/voice-interface/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mock: true })
      });

      const data = await response.json();
      setTranscription(data.text || 'Mock transcription result');
      setAppState('results');
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscription('This is a mock transcription result for testing.');
      setAppState('results');
    }
  };

  /**
   * Clear/Close - return to idle
   */
  const handleClear = () => {
    setAppState('idle');
    setTranscription('');
  };

  return (
    <>
      <div className={`text-box ${styles.container}`}>
        <div className="txt-box">
          {/* Transcript Display Area */}
          <div className="txt-transcript-box">
            <VoiceTextStates
              textState={getTextState()}
              transcriptText={transcription}
              variation={1}
            />
          </div>

          {/* Navigation Bar */}
          <div className="txt-nav-bar">
            {/* Left Slot: Close button (only during recording) */}
            <div className="nav-left">
              {appState === 'recording' && (
                <CloseButton onClick={handleClear} />
              )}
            </div>

            {/* Right Slot: Main button (mic → recordWave → processing) */}
            <div className="nav-right">
              {/* IDLE: Record Button */}
              {appState === 'idle' && (
                <RecordButton onClick={handleStartRecording} />
              )}

              {/* RECORDING: VoicePillWave (combo button) */}
              {appState === 'recording' && (
                <VoicePillWave onClick={handleStopRecording} />
              )}

              {/* PROCESSING: Processing Button */}
              {appState === 'processing' && (
                <ProcessingButtonDark />
              )}

              {/* RESULTS: Clear button */}
              {appState === 'results' && (
                <ClearButton onClick={handleClear} />
              )}
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
          width: 100%;
          max-width: 398px;
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
