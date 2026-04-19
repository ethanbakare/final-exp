import React, { useState, useEffect } from 'react';
import { VoiceTextBatch, VoiceTextBatchState } from './ui/VoiceTextBatch';
import {
  ClipLeftSlotMorph,
  ClipRecordMorph,
  ClipTimerFade,
  ClipLeftMorphState,
  ClipRecordMorphState,
} from './ui/voicemorphing-clip';
import { ClipLinearWaveform } from './ui/ClipLinearWaveform';
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

interface VoiceTextBoxClipProps {
  // Demo / simulation mode: bypasses the mic + MediaRecorder, drives
  // the state machine on a fixed loop (idle 1s -> rec 3s -> proc 1.2s
  // -> complete 2s -> idle, repeat). Buttons stay rendered for visual
  // continuity but their click handlers go undefined so the loop is
  // the sole driver. The waveform is fed by a synthetic LFO-modulated
  // oscillator MediaStream so bars sway organically without a mic.
  simulate?: boolean;
}

export const VoiceTextBoxClip: React.FC<VoiceTextBoxClipProps> = ({
  simulate = false,
}) => {
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

  // Phase 5 — parallel state copy of the live MediaStream so the
  // ClipLinearWaveform child re-renders when a recording starts.
  // Refs alone don't trigger renders, so we mirror the ref into state
  // at the moment the stream is created and clear it once we leave
  // rec/proc (see effect below).
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Simulation-only AudioContext + cached decoded buffer for the
  // sample audio stream. The buffer is decoded once and reused across
  // every loop cycle; the AudioContext is per-cycle so it can be
  // closed cleanly when we return to idle.
  const fakeCtxRef = React.useRef<AudioContext | null>(null);
  const fakeBufferRef = React.useRef<AudioBuffer | null>(null);

  /**
   * Build a MediaStream that feeds the AnalyserNode inside
   * ClipLinearWaveform with a real audio waveform. We replay a 3s
   * segment of the sample track starting at the 8s mark so the bars
   * move with the dynamics of actual music instead of a synthesised
   * tone. Output is connected ONLY to the MediaStreamDestination —
   * not to ctx.destination — so nothing plays through the speakers.
   * Used only when simulate=true.
   */
  const createFakeStream = async (): Promise<MediaStream> => {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();

    // Decode once across all cycles. AudioBuffer is portable across
    // contexts so we can keep it after the per-cycle ctx closes.
    if (!fakeBufferRef.current) {
      const resp = await fetch(
        '/audio/Naruto__Animal_I_have_become_-_YouTube.mp3'
      );
      const arrBuf = await resp.arrayBuffer();
      fakeBufferRef.current = await ctx.decodeAudioData(arrBuf);
    }

    const dest = ctx.createMediaStreamDestination();
    const source = ctx.createBufferSource();
    source.buffer = fakeBufferRef.current;
    source.connect(dest); // only to MediaStream, never to speakers
    source.start(0, 8);   // start playback at 8s offset

    fakeCtxRef.current = ctx;
    return dest.stream;
  };

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

  // Phase 5 — release the MediaStream reference held for the waveform
  // once we're no longer in an active recording context. This unmounts
  // the analyser graph inside ClipLinearWaveform. Also closes the
  // synthetic AudioContext used in simulate mode so the demo loop
  // doesn't leak audio contexts across cycles.
  useEffect(() => {
    if (appState !== 'recording' && appState !== 'processing') {
      setMediaStream(null);
      if (fakeCtxRef.current) {
        fakeCtxRef.current.close().catch(() => {});
        fakeCtxRef.current = null;
      }
    }
  }, [appState]);

  // Whether the transcript currently overflows its scroll wrapper.
  // The bottom fade-overlay only makes visual sense when text is
  // actually being clipped — short transcripts (1-2 lines) sit well
  // above the bottom 24px fade band, and the always-on overlay was
  // dimming the bottom of line 2. Re-checked when transcript text
  // changes and on container resize.
  const scrollWrapperRef = React.useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  useEffect(() => {
    const el = scrollWrapperRef.current;
    if (!el) return;
    const check = () => setHasOverflow(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    // Re-check after VoiceTextBatch's per-word reveal animation grows
    // the rendered text — the final word lands ~500ms after the last
    // animationDelay so polling for ~1s covers all reveal lengths.
    const interval = window.setInterval(check, 100);
    const stop = window.setTimeout(() => window.clearInterval(interval), 1500);
    return () => {
      ro.disconnect();
      window.clearInterval(interval);
      window.clearTimeout(stop);
    };
  }, [transcription, appState]);

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

      // simulate mode: synthesise the stream, skip MediaRecorder
      // entirely (it errors on Oscillator-driven streams in some
      // browsers, and we don't need a recording — transcribeAudio
      // ignores the blob and pulls from SAMPLE_LINES).
      if (simulate) {
        const stream = await createFakeStream();
        mediaStreamRef.current = stream;
        setMediaStream(stream);
        setAppState('recording');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      setMediaStream(stream);

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
    // simulate mode: no MediaRecorder to stop. Just advance the state
    // machine and let the dummy transcribeAudio resolve to 'complete'.
    if (simulate) {
      setAppState('processing');
      await transcribeAudio(new Blob());
      return;
    }

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      return;
    }

    setAppState('processing');

    const audioBlob = await stopRecorderAndGetBlob();

    await transcribeAudio(audioBlob);
  };

  // Dummy sample lines — cycled through on each transcription so the
  // VoiceTextBatch animation has fresh content to reveal each time.
  // Real Deepgram call is shelved while the API is broken (400s).
  const SAMPLE_LINES = [
    'Quick brown fox jumps over the lazy dog.',
    'Voice interface prototype is now wired end-to-end.',
    'Linear waveform freezes the moment recording stops.',
    'Try saying something — it does not matter what.',
    'Phase five committed and verified in browser preview.',
  ];
  const sampleIndexRef = React.useRef(0);

  /**
   * Transcribe audio blob — DUMMY STUB.
   * The real /api/voice-interface/transcribe endpoint is currently
   * returning 400s; until that's fixed we simulate the latency and
   * pull from SAMPLE_LINES so the rest of the state machine
   * (processing -> complete + VoiceTextBatch reveal) stays exercised.
   * Audio blob is unused but kept in the signature so the call site
   * doesn't have to change when the real endpoint comes back.
   */
  const transcribeAudio = async (_audioBlob: Blob) => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Simulate ~1.2s of network/transcription latency, abortable.
      await new Promise<void>((resolve, reject) => {
        const id = setTimeout(resolve, 1200);
        signal.addEventListener('abort', () => {
          clearTimeout(id);
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });

      const newText = SAMPLE_LINES[sampleIndexRef.current % SAMPLE_LINES.length];
      sampleIndexRef.current += 1;

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

  // Demo auto-loop. Each appState transition schedules the next call:
  //   idle      -> wait 1s, then handleStartRecording
  //   recording -> wait 3s, then handleStopRecording (proc auto-resolves
  //                via the SAMPLE_LINES timeout inside transcribeAudio)
  //   complete  -> wait 2s, then handleClear -> back to idle
  // Closures over the handlers are fine here: the effect re-runs on
  // every appState change, so the handler refs are always fresh.
  useEffect(() => {
    if (!simulate) return;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (appState === 'idle') {
      timeoutId = setTimeout(() => { handleStartRecording(); }, 1000);
    } else if (appState === 'recording') {
      timeoutId = setTimeout(() => { handleStopRecording(); }, 3000);
    } else if (appState === 'complete') {
      timeoutId = setTimeout(() => { handleClear(); }, 4000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [simulate, appState]);

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
          {/* Transcript Display Area
              Phase 4 — text visibility is tied to appState:
                idle     → visible (shows 'Tap to speak' placeholder)
                rec/proc → hidden (opacity+blur fade out, matches Figma
                           which has no text-container in those states)
                complete → visible (transcript animates in via
                           VoiceTextBatch's own internal animation)
              The DOM stays mounted throughout to preserve layout and
              let VoiceTextBatch's transcription animation run cleanly. */}
          <div className="txt-transcript-box">
            <div
              ref={scrollWrapperRef}
              className={`transcript-scroll-wrapper ${isClearing ? 'clearing' : ''} ${
                appState === 'recording' || appState === 'processing' ? 'is-hidden' : ''
              }`}
            >
              <VoiceTextBatch
                textState={getTextState()}
                transcriptText={transcription}
                oldTextLength={oldTextLengthRef.current}
              />
            </div>

            {/* Fade overlay — only shown when the transcript actually
                overflows its scroll wrapper. Short 1-2 line transcripts
                fit entirely above the bottom 24px and don't need (or
                want) the dim band. */}
            <div className={`fade-overlay ${hasOverflow ? 'is-active' : ''}`}></div>
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
                simulate
                  ? undefined
                  : appState === 'recording' || appState === 'processing'
                  ? handleClose
                  : appState === 'complete'
                  ? handleClear
                  : undefined
              }
            />

            {/* MIDDLE SLOT — Lure-profile linear waveform.
                Flex-fills the space between left and right clusters.
                Live during 'recording', frozen during 'processing'
                (scrolling mode + no fresh data = bars hold position),
                opacity-faded out in idle/complete. */}
            <div className="waveform-slot">
              <ClipLinearWaveform
                mediaStream={mediaStream}
                isActive={appState === 'recording'}
                visible={appState === 'recording' || appState === 'processing'}
              />
            </div>

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
                  simulate
                    ? undefined
                    : appState === 'recording'
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

        /* Text colour overrides — VoiceTextBatch ships with dark-grey
           colors (var(--VoiceDarkGrey_30/90)) hardcoded on its inner
           classes (.placeholder-text, .dimmed-text, .result-text,
           .old-text, .static-text). Those direct child rules beat any
           inherited color from the parent, so on this dark card every
           one of them needs an explicit white override or the text
           renders invisible (dark-on-dark). Variation 1 works because
           its card background is cream — these grey rules read fine
           there. Uses :global() to reach into VoiceTextBatch internals. */
        .text-box :global(.voice-text-content) {
          color: #FFFFFF;                     /* parent inherit fallback */
        }
        .text-box :global(.voice-text-content .placeholder-text) {
          color: rgba(255, 255, 255, 0.30);   /* Figma: text-placeholder */
        }
        .text-box :global(.voice-text-content .dimmed-text) {
          color: rgba(255, 255, 255, 0.30);   /* old text during rec/proc */
        }
        .text-box :global(.voice-text-content .result-text),
        .text-box :global(.voice-text-content .old-text),
        .text-box :global(.voice-text-content .static-text) {
          color: #FFFFFF;                     /* Figma: text-transcript */
        }
        /* VoiceTextAnimation wraps each word in a .animated-word span
           that sets its own color (var(--VoiceDarkGrey_90)). That child
           rule beats the .result-text parent — same pattern as above,
           one level deeper. Override or the per-word reveal renders
           dark grey on the dark card. */
        .text-box :global(.voice-text-content .animated-word) {
          color: #FFFFFF;
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

          /* Same Emil crossfade as the button morphs: opacity + blur over
             200ms with a strong cubic-bezier. Reused here so text
             visibility (shown in idle/complete, hidden in rec/proc) feels
             consistent with every other state transition in the card. */
          transition:
            opacity 200ms cubic-bezier(0.77, 0, 0.175, 1),
            filter 200ms cubic-bezier(0.77, 0, 0.175, 1);
        }

        .transcript-scroll-wrapper.clearing {
          opacity: 0;
          pointer-events: none;
        }

        /* Hide the text area during rec/proc — Figma has no text-container
           in those states. We keep the DOM mounted so VoiceTextBatch's own
           internal transcription animation still runs when we return to
           'complete' and fade it back in. */
        .transcript-scroll-wrapper.is-hidden {
          opacity: 0;
          filter: blur(2px);
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
          /* Hidden by default — only fades in when content overflows
             the scroll wrapper (see hasOverflow effect). Otherwise
             1-2 line transcripts had their bottoms dimmed by a
             gradient that wasn't masking anything. */
          opacity: 0;
          transition: opacity 200ms cubic-bezier(0.77, 0, 0.175, 1);
        }
        .fade-overlay.is-active {
          opacity: 1;
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

        /* Right cluster — timer + record morph, 10px between them.
           4px padding-left visually balances the gap on either side
           of the waveform. Without it the left side reads wider: the
           close icon sits centred inside its 34×34 hit-target so its
           visible right edge stops well before the waveform's first
           bar (the bar zone also fades 20px in via fadeWidth). On the
           right the timer's first digit starts close to the waveform
           edge, making the right gap look tight by comparison. The
           4px nudge equalises the perceived spacing without touching
           either button's hit-target. */
        .right-cluster {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-left: 4px;
        }
      `}</style>
    </>
  );
};

export default VoiceTextBoxClip;
