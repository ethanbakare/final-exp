import React, { useState, useRef, useEffect } from 'react';
import { VoiceTextStates, VoiceTextState } from './ui/VoiceTextStates';
import { MorphingRecordWideStopDock } from './ui/voicenavbar';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Variation 3: TextWrapper Live Streaming
 *
 * Architecture (from A03_IMPLEMENTATION_NOTES.md):
 * - TextWrapper: 254px × 407px container with gap: 23px (NO border/shadow)
 * - TextBox: 254px × 340px box with border/shadow (text container)
 * - RecordWide button: 76px × 44px standalone button OUTSIDE the box
 *
 * Phase 1 Implementation:
 * - Mobile-optimized 254px TextWrapper container
 * - Live text streaming during recording
 * - 3-state flow (NO processing state)
 * - MorphingRecordWideStopDock component
 *
 * State Flow:
 * IDLE → RECORDING → COMPLETE
 */

type AppState = 'idle' | 'recording' | 'complete';

export const VoiceTextWrapperLive: React.FC = () => {
  // State management
  const [appState, setAppState] = useState<AppState>('idle');
  const [transcription, setTranscription] = useState<string>('');

  // Refs for text streaming
  const prevTextLengthRef = useRef(0);
  const streamingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Map app state to text state
  const getTextState = (): VoiceTextState => {
    // Map 'complete' to 'results' for VoiceTextStates component
    if (appState === 'complete') return 'results';
    return appState as VoiceTextState;
  };

  /**
   * Start Recording & Streaming
   */
  const handleStartRecording = () => {
    setAppState('recording');
    setTranscription('');
    prevTextLengthRef.current = 0;

    // Simulate live streaming transcription
    // In production, this would be a WebSocket or SSE connection
    simulateLiveStreaming();
  };

  /**
   * Stop Recording
   */
  const handleStopRecording = () => {
    // Stop streaming simulation
    if (streamingTimerRef.current) {
      clearTimeout(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }

    setAppState('complete');
  };

  /**
   * Copy Transcription
   */
  const handleCopy = () => {
    if (transcription) {
      navigator.clipboard.writeText(transcription).then(() => {
        console.log('Transcription copied to clipboard');
      });
    }
  };

  /**
   * Clear (Start New Recording)
   */
  const handleClear = () => {
    setAppState('idle');
    setTranscription('');
    prevTextLengthRef.current = 0;
  };

  /**
   * Simulate Live Streaming Transcription
   * In production, this would receive real-time chunks from a streaming API
   */
  const simulateLiveStreaming = () => {
    const mockText = "This is a simulated live transcription. Words appear incrementally as if being transcribed in real-time from streaming audio. This demonstrates how Variant 3 handles continuous text updates during recording.";
    const words = mockText.split(' ');
    let wordIndex = 0;

    const addNextWord = () => {
      if (wordIndex < words.length) {
        setTranscription(prev => {
          const newText = prev ? `${prev} ${words[wordIndex]}` : words[wordIndex];
          prevTextLengthRef.current = newText.length;
          return newText;
        });
        wordIndex++;

        // Continue streaming every 200ms
        streamingTimerRef.current = setTimeout(addNextWord, 200);
      }
    };

    // Start streaming
    addNextWord();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) {
        clearTimeout(streamingTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className={`text-wrapper ${styles.container}`}>
        {/* TextBox - The bordered box containing text */}
        <div className="text-box">
          <div className="txt-box">
            {/* Transcript Display Area */}
            <div className="txt-transcript-box">
              <div className="transcript-scroll-wrapper">
                <VoiceTextStates
                  textState={getTextState()}
                  transcriptText={transcription}
                  variation={3}
                />
              </div>

              {/* Fade overlay at bottom (only visible when text overflows) */}
              {(appState === 'recording' || appState === 'complete') && transcription && (
                <div className="fade-overlay"></div>
              )}
            </div>
          </div>
        </div>

        {/* RecordWide Button - Standalone button OUTSIDE the box */}
        <div className="record-wide-wrapper">
          <MorphingRecordWideStopDock
            state={appState}
            onRecordClick={handleStartRecording}
            onStopClick={handleStopRecording}
            onCopyClick={handleCopy}
            onClearClick={handleClear}
          />
        </div>
      </div>

      <style jsx>{`
        /* TextWrapper - Outer container (NO border/shadow) */
        .text-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px;
          gap: 23px;

          position: relative;
          width: 254px;
          height: 407px;
        }

        /* TextBox - The bordered box with shadow */
        .text-box {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 15px;
          gap: 10px;

          width: 254px;
          max-width: 600px;
          height: 340px;

          background: var(--VoiceBoxBg);
          border: 1px solid var(--VoiceBoxOutline);
          box-shadow: 0px 4px 12px var(--VoiceBoxShadow);
          border-radius: 16px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }

        /* TxtBox - Inner container */
        .txt-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 10px;

          width: 224px;
          height: 300px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 1;
        }

        /* TxtTranscriptBox - Text display area with padding */
        .txt-transcript-box {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px;
          gap: 10px;

          width: 224px;
          height: 300px;

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
          width: 6px;
        }

        .transcript-scroll-wrapper::-webkit-scrollbar-track {
          background: transparent;
        }

        .transcript-scroll-wrapper::-webkit-scrollbar-thumb {
          background: var(--VoiceDarkGrey_30);
          border-radius: 3px;
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
          height: 20px;
          background: linear-gradient(to bottom,
            rgba(247, 246, 244, 0) 0%,
            rgba(247, 246, 244, 1) 100%
          );
          pointer-events: none;
          z-index: 10;
        }

        /* RecordWide Wrapper - Button container OUTSIDE the box */
        .record-wide-wrapper {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 0px;

          width: 100%;
          height: 44px;

          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};
