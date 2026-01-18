import React, { useState } from 'react';
import { VoiceTextBatch, VoiceTextBatchState } from './ui/VoiceTextBatch';
import { MorphingProcessingToCombo } from './ui/voicenavbar';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * Variation 2: TextBox Check & Close
 *
 * Phase 1 Implementation:
 * - Full nested container structure
 * - Morphing button with check/close controls
 * - Same 398px TextBox as Variation 1
 * - Mock transcription flow
 *
 * State Flow:
 * IDLE → RECORDING → PROCESSING → COMBO
 */

type AppState = 'idle' | 'recording' | 'processing' | 'combo';

export const VoiceTextBoxCheckClose: React.FC = () => {
  // State management
  const [appState, setAppState] = useState<AppState>('idle');
  const [transcription, setTranscription] = useState<string>('');
  const [isClearing, setIsClearing] = useState<boolean>(false);
  
  // Track where old text ends (for splitting old/new during animation)
  const oldTextLengthRef = React.useRef<number>(0);

  // Ref to track and cancel ongoing API requests
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Refs for MediaRecorder
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);

  // Map app state to text state
  const getTextState = (): VoiceTextBatchState => {
    // Map 'combo' to 'results' for VoiceTextBatch component
    if (appState === 'combo') return 'results';
    return appState as VoiceTextBatchState;
  };

  /**
   * Start Recording
   */
  const handleStartRecording = async () => {
    try {
      // If starting from combo state (appending mode), save current text length
      if (appState === 'combo' && transcription) {
        oldTextLengthRef.current = transcription.length;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        await handleRecordingStopped();
      };

      // Start recording
      mediaRecorder.start();
      setAppState('recording');
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required to record audio.');
    }
  };

  /**
   * Confirm Recording (Check button clicked)
   */
  const handleConfirmRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setAppState('processing');
    }
  };

  /**
   * Handle recording stopped - send audio to Deepgram
   */
  const handleRecordingStopped = async () => {
    // Create blob from chunks
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    // Release microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Send to transcription API
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/voice-interface/transcribe', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      const newText = data.text || '';

      // Append new text with space separator (fresh state pattern)
      setTranscription(prev => {
        const combined = prev ? prev + ' ' + newText : newText;
        // Update oldTextLength to point to where new text starts
        if (prev) {
          oldTextLengthRef.current = prev.length;
        }
        return combined;
      });

      setAppState('combo');
      abortControllerRef.current = null;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Transcription cancelled');
        return;
      }
      console.error('Transcription error:', error);
      alert('Transcription failed. Please try again.');
      setAppState('combo');
    }
  };

  /**
   * Cancel Recording (Close button clicked during recording)
   */
  const handleCancelRecording = () => {
    // Cancel ongoing API request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Set oldTextLength to full text length to prevent re-animation
    // This makes the condition oldTextLength >= transcriptText.length true
    // which shows text statically without animation
    if (transcription) {
      oldTextLengthRef.current = transcription.length;
    }

    // Preserve text on screen - just return to appropriate state
    if (transcription) {
      setAppState('combo');  // Return to combo state with existing text
    } else {
      setAppState('idle');  // Return to idle if no text
    }
  };

  /**
   * Clear (ClearButton clicked in combo state with fade animation)
   */
  const handleClear = () => {
    // Start fade-out animation
    setIsClearing(true);
    
    // Wait for animation to complete (200ms), then clear state
    setTimeout(() => {
      setAppState('idle');
      setTranscription('');
      oldTextLengthRef.current = 0;  // Reset split point
      setIsClearing(false);
    }, 200); // Match CSS transition duration
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <>
      <div className={`text-box ${styles.container}`}>
        <div className="txt-box">
          {/* Transcript Display Area */}
          <div className="txt-transcript-box">
            <div className={`transcript-scroll-wrapper ${isClearing ? 'clearing' : ''}`}>
              <VoiceTextBatch
                textState={getTextState()}
                transcriptText={transcription}
                oldTextLength={oldTextLengthRef.current}
              />
            </div>

            {/* Fade overlay at bottom (only visible when text overflows) */}
            {appState === 'combo' && transcription && (
              <div className="fade-overlay"></div>
            )}
          </div>

          {/* Navigation Bar - Morphing Button System */}
          <div className="txt-nav-bar">
            <MorphingProcessingToCombo
              state={appState}
              onRecordClick={handleStartRecording}
              onConfirmClick={handleConfirmRecording}
              onCancelClick={handleCancelRecording}
              onClearClick={handleClear}
              onProcessingComplete={() => setAppState('combo')}
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
          
          /* Smooth transition for fade animation */
          transition: opacity 200ms ease-out;
        }
        
        /* Clearing animation - Simple fade out (Google Docs style) */
        .transcript-scroll-wrapper.clearing {
          opacity: 0;
          pointer-events: none;  /* Prevent interaction during fade */
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
          justify-content: flex-end;
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
