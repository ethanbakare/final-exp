import React, { useState } from 'react';
import { VoiceTextBatch, VoiceTextBatchState } from './ui/VoiceTextBatch';
import { MorphingRecordDarkToPillWaveProcessing } from './ui/voicenavbar';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

/**
 * VoiceTextBoxClip
 *
 * VERBATIM CLONE of VoiceTextBoxStandard (variation 1). No style or
 * structural changes. Used as the starting baseline for the dark
 * "RecordBar" card port — we'll compare this side-by-side with the
 * Figma record-bar-* frames and iterate the styling step by step.
 *
 * State Flow:
 * IDLE → RECORDING → PROCESSING → COMPLETE
 */

type AppState = 'idle' | 'recording' | 'processing' | 'complete';

export const VoiceTextBoxClip: React.FC = () => {
  // Simple state management (Phase 0)
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
    if (appState === 'complete') return 'results';
    return appState as VoiceTextBatchState;
  };

  /**
   * Start Recording
   */
  const handleStartRecording = async () => {
    try {
      if (appState === 'complete' && transcription) {
        oldTextLengthRef.current = transcription.length;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setAppState('recording');
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required to record audio.');
    }
  };

  /**
   * Stop MediaRecorder and return audio blob (Promise-based)
   */
  const stopRecorderAndGetBlob = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        resolve(new Blob());
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }

        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  };

  /**
   * Stop Recording (explicitly transcribe)
   */
  const handleStopRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      return;
    }

    setAppState('processing');

    const audioBlob = await stopRecorderAndGetBlob();

    await transcribeAudio(audioBlob);
  };

  /**
   * Transcribe audio blob - send to Deepgram API
   */
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

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

      setTranscription(prev => {
        const combined = prev ? prev + ' ' + newText : newText;
        if (prev) {
          oldTextLengthRef.current = prev.length;
        }
        return combined;
      });

      setAppState('complete');
      abortControllerRef.current = null;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Transcription cancelled');
        return;
      }
      console.error('Transcription error:', error);
      alert('Transcription failed. Please try again.');
      setAppState('complete');
    }
  };

  /**
   * Close - cancel current recording but preserve text
   */
  const handleClose = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      await stopRecorderAndGetBlob();
    }

    if (transcription) {
      oldTextLengthRef.current = transcription.length;
    }

    if (transcription) {
      setAppState('complete');
    } else {
      setAppState('idle');
    }
  };

  /**
   * Clear - return to idle and clear all text (with fade animation)
   */
  const handleClear = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsClearing(true);

    setTimeout(() => {
      setAppState('idle');
      setTranscription('');
      oldTextLengthRef.current = 0;
      setIsClearing(false);
    }, 200);
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
        /* TextBox - Outermost Container
           Adapter pass 1: outer container restyled to match Figma
           record-bar-* (width, height, radius, border, bg, shadow).
           Inner layout (padding, gap, text colour) handled in later passes. */
        .text-box {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 15px;
          gap: 10px;

          position: relative;
          width: 393px;          /* Figma: 393 (was 398) */
          max-width: 100%;
          height: 160px;         /* Figma: 160 (was 213) */

          background: #2C2929;   /* Figma: #2C2929 (was --VoiceBoxBg cream) */
          border: 1.5px solid #4D4747;  /* Figma: 1.5px #4D4747 (was 1px --VoiceBoxOutline) */
          border-radius: 28px;   /* Figma: 28 (was 16) */
          /* Figma dual drop shadow (spread -4 / -8) */
          box-shadow:
            0 4px  4px -4px rgba(12, 12, 13, 0.08),
            0 16px 16px -8px rgba(12, 12, 13, 0.12);
        }

        /* Text colour overrides — placeholder + transcript both white-ish on dark.
           Uses :global() to reach into VoiceTextBatch internals.
           Order matters: parent first, then more-specific placeholder override. */
        .text-box :global(.voice-text-content) {
          color: #FFFFFF;                     /* Figma: text-transcript */
        }
        .text-box :global(.voice-text-content .placeholder-text) {
          color: rgba(255, 255, 255, 0.30);   /* Figma: text-placeholder */
        }

        /* TxtBox - Inner Container
           Adapter pass 1 (cont): removed the hardcoded 173px height
           and 'flex: none' so this box now shrinks/grows to fill the
           outer container instead of overflowing it. */
        .txt-box {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 10px;

          width: 100%;
          min-height: 0;     /* allow flex children to shrink below content size */

          flex: 1 1 auto;    /* grow + shrink to fit parent (was: flex none + height 173) */
          order: 0;
          align-self: stretch;
        }

        /* TxtTranscriptBox - Text Display Area
           Same deal — drop fixed height + flex: none so it flexes. */
        .txt-transcript-box {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px;
          gap: 10px;

          width: 100%;
          min-height: 0;

          border-radius: 6px;

          flex: 1 1 auto;
          order: 0;
          align-self: stretch;
          overflow: hidden;
        }

        /* Scrollable wrapper for text content */
        .transcript-scroll-wrapper {
          width: 100%;
          max-height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;

          transition: opacity 200ms ease-out;
        }

        .transcript-scroll-wrapper.clearing {
          opacity: 0;
          pointer-events: none;
        }

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

export default VoiceTextBoxClip;
