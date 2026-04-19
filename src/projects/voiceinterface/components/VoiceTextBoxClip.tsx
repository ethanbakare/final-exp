import React, { useState, useEffect } from 'react';
import { VoiceTextBatch, VoiceTextBatchState } from './ui/VoiceTextBatch';
import {
  ClipLeftSlotMorph,
  ClipRecordMorph,
  ClipTimerFade,
  ClipLeftMorphState,
  ClipRecordMorphState,
} from './ui/voicemorphing-clip';
import styles from '@/projects/voiceinterface/styles/voice.module.css';

// Formats elapsed seconds as m:ss (e.g. 5 -> "0:05", 73 -> "1:13").
const formatMMSS = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
};

// appState is the variation-1 state machine; the morph primitives use
// their own state enums. These helpers narrow appState into each morph's
// vocabulary without altering variation 1's semantics.
type AppStateNarrow = 'idle' | 'recording' | 'processing' | 'complete';

const leftMorphState = (s: AppStateNarrow): ClipLeftMorphState => {
  if (s === 'complete') return 'complete';
  if (s === 'recording') return 'rec';
  if (s === 'processing') return 'proc';
  return 'idle';
};

const rightMorphState = (s: AppStateNarrow): ClipRecordMorphState => {
  if (s === 'recording') return 'rec';
  if (s === 'processing') return 'proc';
  // idle AND complete both show the red mic (press to start new recording
  // — complete appends; idle starts fresh; handleStartRecording handles both)
  return 'idle';
};

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

  // Timer counter — runs during 'recording', freezes during 'processing',
  // resets to 0 when returning to 'idle'. Kept in sync with appState via
  // the useEffect below.
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (appState === 'idle') {
      setSeconds(0);
      return;
    }
    if (appState !== 'recording') return; // 'processing' freezes
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [appState]);

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

            {/* Fade overlay at bottom — always rendered (defensive, in case
                content ever overflows). In practice, animations should keep
                text within bounds so this rarely actually applies. */}
            <div className="fade-overlay"></div>
          </div>

          {/*
            Navigation Bar — Phase 2 full wiring.
            Left slot  : close (rec/proc) | clear (complete) | nothing (idle)
            Middle slot: LinearWaveform placeholder (Phase 5 will slot in)
            Right slot : timer + record morph (red mic | red dot | spinner)

            State mapping mirrors variation 1 semantics exactly — the
            underlying handlers (handleStartRecording, handleStopRecording,
            handleClose, handleClear) are the same variation 1 functions,
            just re-pointed to the new clip-style morphs.
          */}
          <div
            className={`txt-nav-bar ${
              appState === 'recording' || appState === 'processing' ? 'is-active' : ''
            }`}
          >
            {/* LEFT SLOT
                idle     → nothing (invisible placeholder, reserves 34x34)
                rec/proc → close X (click cancels; handleClose also aborts
                           the transcription fetch mid-processing)
                complete → clear (trash, click resets) */}
            <ClipLeftSlotMorph
              state={leftMorphState(appState)}
              onClick={
                appState === 'recording' || appState === 'processing'
                  ? handleClose
                  : appState === 'complete'
                  ? handleClear
                  : undefined
              }
            />

            {/* MIDDLE SLOT — placeholder for ported LinearWaveform.
                Flex-fills the space between left and right clusters. */}
            <div className="waveform-slot" />

            {/* RIGHT CLUSTER — timer + record morph.
                Timer always rendered (layout-stable), visibility faded.
                Record morph cycles idle/complete (red mic) ↔ rec (red dot)
                ↔ proc (spinner). Proc is non-interactive (auto-advances
                when transcribeAudio resolves). */}
            <div className="right-cluster">
              <ClipTimerFade
                visible={appState === 'recording' || appState === 'processing'}
                value={formatMMSS(seconds)}
              />
              <ClipRecordMorph
                state={rightMorphState(appState)}
                onClick={
                  appState === 'recording'
                    ? handleStopRecording
                    : appState === 'processing'
                    ? undefined
                    : handleStartRecording
                }
              />
            </div>
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
          justify-content: flex-end;  /* was center — content sticks to bottom */
          align-items: center;
          padding: 12px;         /* Figma: 12 (was 20px 15px) */
          gap: 12px;             /* was 10 — bumped to 12 for breathing room */

          position: relative;
          /* Responsive: fills available width up to the Figma 393px cap.
             Below the cap (e.g. mobile) the card shrinks with the viewport
             instead of overflowing horizontally. */
          width: 100%;
          max-width: 393px;
          height: 160px;         /* Figma: 160 (was 213) */

          background: #2C2929;   /* Figma: #2C2929 (was --VoiceBoxBg cream) */
          border: 1.5px solid #4D4747;  /* Figma: 1.5px #4D4747 (was 1px --VoiceBoxOutline) */
          border-radius: 28px;   /* Figma exact. 20px caused a visual mismatch
                                    once the nav-pill became visible: the pill's
                                    effective right-end arc is 21px (half its
                                    42px height), so at radius 20 the inner
                                    pill was MORE rounded than the outer card,
                                    which reads as wrong. 28 keeps outer >
                                    inner for concentric harmony. */
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
          padding: 12px 9px;     /* Figma: text-container 12 vertical / 9 horizontal */
          overflow-wrap: anywhere; /* let no-space strings wrap mid-char
                                      instead of clipping into hidden overflow */
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
          /* removed 'padding-right: 4px' scrollbar gutter — text can now
             reach the full inner width without a reserved scrollbar lane */

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

        /* Fade overlay at bottom — recoloured to the dark card bg #2C2929.
           Insets match the new .txt-transcript-box padding (12 V / 9 H)
           so the fade sits flush with the visible text content area. */
        .fade-overlay {
          position: absolute;
          bottom: 12px;
          left: 9px;
          right: 9px;
          height: 24px;
          background: linear-gradient(to bottom,
            rgba(44, 41, 41, 0) 0%,
            rgba(44, 41, 41, 1) 100%
          );
          pointer-events: none;
          z-index: 10;
        }

        /* TxtNavBar - Navigation Controls
           Height kept at 38px (NOT touched). Only justify-content
           changed: center -> flex-end so the right-aligned mic
           matches Figma idle state (no left button).

           Phase 1 — container styling:
           - border-radius 6 -> 28 (Figma's nav-pill "knife peel" shape)
           - background fades in on rec/proc (active recording context),
             transparent in idle/complete
           - 200ms transition with the same Emil cubic-bezier used by
             the button morphs so the bg change feels consistent with
             everything else in the card */
        .txt-nav-bar {
          display: flex;
          flex-direction: row;
          justify-content: space-between;  /* Figma: 3 slots (left / middle / right) */
          align-items: center;
          padding: 4px;          /* Figma: 4 (was 0 12px) */
          gap: 0px;

          width: 100%;
          height: 42px;          /* Figma: 42 (was 38). At 38, padding 4
                                    + button 34 left only 2px top/bottom,
                                    making vertical/horizontal look uneven.
                                    42 gives true symmetric 4px all sides. */

          border-radius: 28px;   /* Figma: knife-peel ~28.8 — 28 per design call */
          background: transparent;
          transition: background-color 200ms cubic-bezier(0.77, 0, 0.175, 1);

          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }
        .txt-nav-bar.is-active {
          background: rgba(255, 255, 255, 0.10);
        }

        /* Middle slot — fills the gap between left slot and right cluster.
           LinearWaveform will slot in here in Phase 5. */
        .waveform-slot {
          flex: 1 1 auto;
          align-self: stretch;
        }

        /* Right cluster — timer + record morph, 10px between them. */
        .right-cluster {
          display: flex;
          align-items: center;
          gap: 10px;
        }
      `}</style>
    </>
  );
};

export default VoiceTextBoxClip;
