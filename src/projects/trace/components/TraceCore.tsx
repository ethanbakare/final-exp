/**
 * TraceCore — the working body of the Trace product.
 *
 * Extracted from src/pages/trace/index.tsx so the same UI + state machine
 * can be rendered both at the standalone /trace route AND inside the
 * demo-showcase carousel (via TraceDemo). Page-level chrome (Head, the
 * outer .trace-page wrapper) stays in /trace/index.tsx; the interactive
 * surface lives here.
 *
 * Standalone usage (omit cancelSignal/runIdRef):
 *
 *     import { TraceCore } from '@/projects/trace/components/TraceCore';
 *     <TraceCore />
 *
 * The kill-switch props are STRICTLY ADDITIVE — when undefined, every
 * guard in this file becomes a no-op and the component behaves exactly as
 * the standalone /trace page always has.
 *
 * ─────────────────────────────────────────────────────────────────────
 * [DEMO-SHOWCASE] PORTING NOTE
 * ─────────────────────────────────────────────────────────────────────
 * If you are extracting the Trace project to ship as a standalone app,
 * every block in this file marked `// [DEMO-SHOWCASE]` is dead weight
 * for that purpose — it exists only so the demo-showcase carousel can
 * cancel in-flight work cleanly when the user swipes away. Safe to
 * remove ALL of them in one pass:
 *
 *     grep -n '\[DEMO-SHOWCASE\]' src/projects/trace/components/TraceCore.tsx
 *
 * Removal checklist:
 *   1. Drop `cancelSignal` and `runIdRef` from the props interface
 *   2. Drop the `myRun = …` lines and the `if (!isStillCurrentRun…) return;` guards
 *   3. Drop the `signal: cancelSignal` from both fetch options
 *   4. Drop the AbortError swallow lines from both catch blocks
 *   5. Drop the cancelRecordingRef + the abort-listener useEffect
 *
 * Architecture rationale: docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md §2.2
 * ─────────────────────────────────────────────────────────────────────
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatedTextBox } from './ui/tracefinance-animated';
import { TRNavbarV2 } from './ui/tracenavbar-v2';
import { ClearButton } from './ui/tracebuttons';
import { TraceClearExpensesModal } from './ui/TraceModal';
import { TraceModalOverlay } from './ui/TraceModalOverlay';
import { MicPermissionBanner } from '@/projects/new-home/components/MicPermissionBanner';
import { TraceToastNotification } from './ui/TraceToast';
import type { ProcessingState } from './ui/traceIcons';
import { groupEntriesByDay } from '../utils/dataUtils';
import { blobToBase64, fileToBase64 } from '../utils/fileUtils';
import type { ExpenseEntry } from '../types/trace.types';

// Minimum audio blob size (~1 second of webm audio)
const MIN_AUDIO_BLOB_SIZE = 1000;

const STORAGE_KEY = 'trace-expense-entries';

export interface TraceCoreProps {
  // [DEMO-SHOWCASE] Optional kill-switch props injected by the demo-showcase
  // carousel. Standalone /trace render passes nothing; both fields become
  // undefined and every guard below is a no-op. See porting note at the
  // top of this file.
  cancelSignal?: AbortSignal;
  runIdRef?: React.MutableRefObject<number>;
}

export const TraceCore: React.FC<TraceCoreProps> = ({ cancelSignal, runIdRef }) => {
  // State management
  const [navbarState, setNavbarState] = useState<'idle' | 'recording' | 'processing_audio' | 'processing_image'>('idle');
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showError = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // [DEMO-SHOWCASE] Helper for run-id staleness checks. When runIdRef is
  // undefined (standalone use), this always returns true — the guards
  // become inert.
  const isStillCurrentRun = (myRun: number) => !runIdRef || myRun === runIdRef.current;

  // Load entries from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setEntries(JSON.parse(stored));
        } catch (err) {
          console.error('Failed to parse stored entries:', err);
        }
      }
    }
  }, []);

  // Save entries to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && entries.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries]);

  // Voice recording handlers
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setNavbarState('recording');
    } catch {
      showError('Enable mic access to record');
    }
  };

  const handleSendAudio = async () => {
    if (!mediaRecorderRef.current) return;

    // [DEMO-SHOWCASE] Capture runId at the start of this async operation.
    // Guards below short-circuit if a new run started during any await.
    const myRun = runIdRef?.current ?? 0;

    const mediaRecorder = mediaRecorderRef.current;
    mediaRecorder.stop();

    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
    });
    if (!isStillCurrentRun(myRun)) return; // [DEMO-SHOWCASE]

    mediaRecorder.stream.getTracks().forEach((track) => track.stop());

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    // Pre-send validation: reject tiny/empty recordings
    if (audioChunksRef.current.length === 0 || audioBlob.size < MIN_AUDIO_BLOB_SIZE) {
      showError('No audio recorded');
      setNavbarState('idle');
      return;
    }

    setNavbarState('processing_audio');

    try {
      const base64Audio = await blobToBase64(audioBlob);
      if (!isStillCurrentRun(myRun)) return; // [DEMO-SHOWCASE]

      const response = await fetch('/api/trace/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Audio, mimeType: 'audio/webm' }),
        signal: cancelSignal, // [DEMO-SHOWCASE]
      });
      if (!isStillCurrentRun(myRun)) return; // [DEMO-SHOWCASE]

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.error === 'no_expense') {
          showError("Didn't hear anything, try again");
        } else {
          showError("Didn't hear anything, try again");
        }
        setNavbarState('idle');
        return;
      }

      // parse-voice returns ExpenseEntry[] — one entry per (merchant, date)
      // pair Gemini identified in the recording. A single sentence like
      // "I got bread at Tesco and then a chair at B&Q" comes back as two
      // entries; we spread them into state so groupEntriesByDay can bucket
      // them downstream.
      const newEntries: ExpenseEntry[] = await response.json();
      if (!isStillCurrentRun(myRun)) return; // [DEMO-SHOWCASE]

      setEntries((prev) => [...newEntries, ...prev]);
      setNavbarState('idle');
    } catch (err) {
      // [DEMO-SHOWCASE] Deliberate cancellation must not surface as a user-
      // facing error. AbortError fires when the showcase swipes away and the
      // signal aborts the in-flight fetch.
      if (err instanceof Error && err.name === 'AbortError') return;
      if (cancelSignal?.aborted) return;
      if (!isStillCurrentRun(myRun)) return;

      showError("Didn't hear anything, try again");
      setNavbarState('idle');
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    audioChunksRef.current = [];
    setNavbarState('idle');
  };

  // Image upload handler
  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // [DEMO-SHOWCASE] Capture runId for the receipt-parse async chain.
      const myRun = runIdRef?.current ?? 0;

      setNavbarState('processing_image');

      try {
        const base64Image = await fileToBase64(file);
        if (!isStillCurrentRun(myRun)) return; // [DEMO-SHOWCASE]

        const response = await fetch('/api/trace/parse-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image, mimeType: file.type }),
          signal: cancelSignal, // [DEMO-SHOWCASE]
        });
        if (!isStillCurrentRun(myRun)) return; // [DEMO-SHOWCASE]

        if (!response.ok) {
          showError("That doesn't look like a receipt");
          setNavbarState('idle');
          return;
        }

        const entry: ExpenseEntry = await response.json();
        if (!isStillCurrentRun(myRun)) return; // [DEMO-SHOWCASE]

        setEntries((prev) => [entry, ...prev]);
        setNavbarState('idle');
      } catch (err) {
        // [DEMO-SHOWCASE] Swallow deliberate cancellation; everything else
        // is a real user-facing error.
        if (err instanceof Error && err.name === 'AbortError') return;
        if (cancelSignal?.aborted) return;
        if (!isStillCurrentRun(myRun)) return;

        showError("That doesn't look like a receipt");
        setNavbarState('idle');
      }
    };
    input.click();
  };

  // Clear all entries handler
  const handleClearAll = () => {
    setShowClearModal(true);
  };

  const handleConfirmClear = () => {
    setEntries([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setShowClearModal(false);
  };

  const handleCancelClear = () => {
    setShowClearModal(false);
  };

  // [DEMO-SHOWCASE] Kill-switch abort listener.
  // When the showcase deactivates this slot (swipe / demo↔sim toggle), the
  // external cancelSignal aborts. We invoke the product's existing X-button
  // cancel path (handleCancelRecording) — stops the recorder, releases mic
  // tracks, returns to idle. The cancelSignal is also threaded into both
  // fetches above, which cancels them at the network layer.
  // localStorage `trace-expense-entries` is durable product state — this
  // listener does NOT touch it. Past entries survive showcase swipes.
  // Ref pattern avoids re-binding the listener on every render
  // (handleCancelRecording would otherwise be a fresh closure each render).
  // Block scope: ENTIRE if-block below can be deleted on port.
  const cancelRecordingRef = useRef(handleCancelRecording);
  useEffect(() => { cancelRecordingRef.current = handleCancelRecording; });
  useEffect(() => {
    if (!cancelSignal) return;
    const handleAbort = () => {
      cancelRecordingRef.current();
      setShowToast(false);
    };
    if (cancelSignal.aborted) {
      handleAbort();
      return;
    }
    cancelSignal.addEventListener('abort', handleAbort, { once: true });
    return () => cancelSignal.removeEventListener('abort', handleAbort);
  }, [cancelSignal]);

  // Group entries by day for TextBox
  const groupedDays = groupEntriesByDay(entries);

  // Compute grand total across all entries
  const grandTotal = entries.reduce((sum, entry) => sum + entry.total, 0).toFixed(2);

  // Derive empty-state processing copy/icon from navbar state
  const processingState: ProcessingState =
    navbarState === 'processing_audio'
      ? 'audio'
      : navbarState === 'processing_image'
        ? 'image'
        : 'idle';

  return (
    <>
      <MicPermissionBanner />

      <div className="trace-container">
        <TraceToastNotification
          isVisible={showToast}
          onDismiss={() => setShowToast(false)}
          text={toastMessage}
        />

        <AnimatedTextBox
          days={groupedDays}
          grandTotal={grandTotal}
          processingState={processingState}
          navbar={
            <TRNavbarV2
              state={navbarState}
              onUploadClick={handleUploadClick}
              onSpeakClick={handleStartRecording}
              onCloseClick={handleCancelRecording}
              onSendAudioClick={handleSendAudio}
            />
          }
        />
      </div>

      <div className="clear-button-below">
        <ClearButton onClick={handleClearAll} />
      </div>

      <TraceModalOverlay
        isVisible={showClearModal}
        onClose={handleCancelClear}
        closeOnBackdropClick={true}
      >
        <TraceClearExpensesModal
          onCancel={handleCancelClear}
          onDelete={handleConfirmClear}
        />
      </TraceModalOverlay>

      <style jsx>{`
        .clear-button-below {
          display: flex;
          justify-content: center;
          z-index: 10;
        }

        .trace-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          overflow: hidden;
          border-radius: 16px;
        }
      `}</style>
    </>
  );
};
