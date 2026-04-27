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
 *   1. Drop `cancelSignal`, `runIdRef`, and `hideMicBanner` from the props interface
 *   2. Drop the `myRun = …` lines and the `if (!isStillCurrentRun…) return;` guards
 *   3. Drop the `signal: cancelSignal` from both fetch options
 *   4. Drop the AbortError swallow lines from both catch blocks
 *   5. Drop the cancelRecordingRef + the abort-listener useEffect
 *   6. Drop the `{!hideMicBanner && …}` wrapper around <MicPermissionBanner />
 *      so it renders unconditionally
 *
 * Architecture rationale: docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md §2.2
 * ─────────────────────────────────────────────────────────────────────
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { SAMPLE_RECEIPTS, type SampleReceipt } from '../data/sample-receipts';

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
  // [DEMO-SHOWCASE] Suppress the in-card MicPermissionBanner. The banner
  // is `position: fixed; top: 24px` of the viewport, which collides with
  // the showcase's own top chrome (the project pill / arrows / X close).
  // The showcase renders its own navbar-slot mic-permission UI instead
  // (see ShowcaseNavbarMicBanner — Stage 2). Standalone /trace omits this
  // prop, so the floating banner renders normally.
  hideMicBanner?: boolean;
  // [DEMO-SHOWCASE] Optional hook for showcase-owned modal systems.
  // When present, TraceCore delegates the "clear expenses" confirmation
  // to the caller instead of rendering its own TraceModalOverlay.
  onRequestClearAll?: (controls: {
    confirmClear: () => void;
    cancelClear: () => void;
  }) => void;
  // [DEMO-SHOWCASE] Optional clear-button render slot. Lets the showcase
  // place the destructive action outside TraceCore's default layout
  // without changing standalone /trace behavior.
  //
  // The second arg `isDisabled` mirrors the disabled state TraceCore
  // computes for its own standalone render path (entries empty OR
  // active recording / processing flow). Consumers should thread it
  // through to <ClearButton disabled={isDisabled}> so all render paths
  // share the same source of truth. See
  // docs/trace/CLEAR-BUTTON-DORMANT-STATE.md.
  renderClearButton?: (requestClearAll: () => void, isDisabled: boolean) => React.ReactNode;
  // [DEMO-SHOWCASE] Optional callback for the sample-receipt picker
  // modal. When present, TraceCore delegates the picker UI to the
  // caller (showcase mounts it through ShowcaseModalContext); when
  // absent, the strip click is a no-op (phase 2 will wire a
  // TraceModalOverlay-based fallback for standalone /trace).
  //
  // Controls bag — see docs/trace/RECEIPT-PICKER-MODAL.md §5.3 + §9
  // for the rationale on the external-store contract:
  //   - receipts:           the SAMPLE_RECEIPTS array
  //   - initialIndex:       which thumbnail was clicked (modal opens centered there)
  //   - selectReceipt:      called on Upload tap; runs the sample File through processImageFile
  //   - cancel:             showcase handles modal close; this is here for parity with onRequestClearAll
  //   - subscribeIsDisabled / getIsDisabled:
  //       useSyncExternalStore-compatible pair so the modal can dim
  //       its Upload button live when navbarState flips mid-modal.
  //       A plain getter or boolean wouldn't trigger a re-render of
  //       the captured ReactNode — the subscription does.
  onRequestSamplePicker?: (controls: {
    receipts: SampleReceipt[];
    initialIndex: number;
    selectReceipt: (file: File) => Promise<void>;
    cancel: () => void;
    subscribeIsDisabled: (callback: () => void) => () => void;
    getIsDisabled: () => boolean;
  }) => void;
  // [DEMO-SHOWCASE] Optional render slot for the sample-receipt strip
  // (the four-thumbnail row beneath the demo card). Same shape as
  // renderClearButton — third arg is the live disabled flag derived
  // from the §5 gate (navbarState !== 'idle'). Consumers should
  // render <button disabled={isDisabled}> on each thumbnail and
  // wire onThumbnailClick to call back with the clicked index.
  renderSampleStrip?: (
    receipts: SampleReceipt[],
    onThumbnailClick: (index: number) => void,
    isDisabled: boolean,
  ) => React.ReactNode;
}

export const TraceCore: React.FC<TraceCoreProps> = ({
  cancelSignal,
  runIdRef,
  // [DEMO-SHOWCASE] Drop on port — also drop the conditional render of
  // <MicPermissionBanner /> below.
  hideMicBanner = false,
  onRequestClearAll,
  renderClearButton,
  onRequestSamplePicker,
  renderSampleStrip,
}) => {
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

  // Process a single image File through the receipt-parse pipeline.
  // Extracted from handleUploadClick so the same flow can be invoked
  // by sources other than the file picker — specifically the sample-
  // receipt picker modal in the showcase, which fetches a preset PNG,
  // wraps it in a File, and calls this directly. The behavior here
  // (state transitions, error handling, abort semantics) is identical
  // regardless of where the File came from.
  const processImageFile = useCallback(async (file: File) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelSignal, runIdRef]);

  // Image upload handler — opens the native file picker and feeds the
  // chosen file through processImageFile.
  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await processImageFile(file);
    };
    input.click();
  };

  // Clear all entries handler.
  // Defense-in-depth early-return mirrors the visual disabled state
  // computed below. The primary contract is the <button disabled>
  // attribute on ClearButton, which prevents the click reaching here
  // in the first place; this guard catches any path that bypasses the
  // button (programmatic call, future render path that forgets to
  // wire the disabled prop, etc.).
  const requestClearAll = () => {
    if (entries.length === 0 || navbarState !== 'idle') return;

    if (onRequestClearAll) {
      onRequestClearAll({
        confirmClear: handleConfirmClear,
        cancelClear: handleCancelClear,
      });
      return;
    }

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

  // ClearButton dormant state — single source of truth.
  // Disabled when there's nothing to clear OR when an active flow is in
  // progress (recording / processing audio / processing image). Both
  // standalone and showcase render paths consume this same value so they
  // can never disagree on whether clearing is currently appropriate.
  const isClearDisabled = entries.length === 0 || navbarState !== 'idle';

  // Sample-receipt picker dormant state — see
  // docs/trace/RECEIPT-PICKER-MODAL.md §5.
  // Strictly the navbar gate (no entries-count clause) because the
  // picker is most useful in the empty-entries state. Prevents the
  // second upload entrance from racing the navbar state machine.
  const isSamplePickerDisabled = navbarState !== 'idle';

  // External-store plumbing for the §5.3.2 live-update contract.
  // The ref holds the latest disabled value; the Set holds modal-side
  // subscribers; the effect mirrors React state into the ref AND
  // notifies all subscribers on each change. The picker modal — whose
  // captured ReactNode is otherwise frozen by ShowcaseModalContext —
  // consumes this pair via React.useSyncExternalStore so its Upload
  // button can dim live when the gate flips mid-modal (e.g. a
  // kill-switch abort firing while the user is still on the carousel).
  const isSamplePickerDisabledRef = useRef(isSamplePickerDisabled);
  const samplePickerSubscribersRef = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    isSamplePickerDisabledRef.current = isSamplePickerDisabled;
    samplePickerSubscribersRef.current.forEach((cb) => cb());
  }, [isSamplePickerDisabled]);

  const subscribeIsSamplePickerDisabled = useCallback((cb: () => void) => {
    samplePickerSubscribersRef.current.add(cb);
    return () => {
      samplePickerSubscribersRef.current.delete(cb);
    };
  }, []);

  // Strip thumbnail click handler. Defense-in-depth early-return
  // mirrors the visual disabled state on the thumbnails — catches
  // any path that bypasses the <button disabled> attribute (e.g.
  // programmatic click). Then forwards to onRequestSamplePicker
  // when present; standalone /trace currently no-ops (phase 2).
  const handleSampleStripClick = useCallback((index: number) => {
    if (isSamplePickerDisabled) return;
    if (!onRequestSamplePicker) return;
    onRequestSamplePicker({
      receipts: SAMPLE_RECEIPTS,
      initialIndex: index,
      selectReceipt: async (file: File) => {
        if (isSamplePickerDisabledRef.current) return;
        await processImageFile(file);
      },
      cancel: () => {},
      subscribeIsDisabled: subscribeIsSamplePickerDisabled,
      getIsDisabled: () => isSamplePickerDisabledRef.current,
    });
  }, [
    isSamplePickerDisabled,
    onRequestSamplePicker,
    processImageFile,
    subscribeIsSamplePickerDisabled,
  ]);

  // Derive empty-state processing copy/icon from navbar state
  const processingState: ProcessingState =
    navbarState === 'processing_audio'
      ? 'audio'
      : navbarState === 'processing_image'
        ? 'image'
        : 'idle';

  return (
    <>
      {/* [DEMO-SHOWCASE] Conditional render. Standalone /trace passes no
          hideMicBanner prop → false → banner renders as before. The
          showcase wrapper (TraceDemo) passes hideMicBanner={true} so the
          fixed-position banner doesn't collide with the showcase top
          chrome; the showcase shows its own navbar-slot variant instead.
          To delete on port: drop the `{!hideMicBanner && ...}` wrapper
          and render <MicPermissionBanner /> unconditionally. */}
      {!hideMicBanner && <MicPermissionBanner />}

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

      {renderClearButton ? (
        renderClearButton(requestClearAll, isClearDisabled)
      ) : (
        <div className="clear-button-below">
          <ClearButton onClick={requestClearAll} disabled={isClearDisabled} />
        </div>
      )}

      {/* Sample-receipt strip — only renders when the consumer provides
          the render slot. Standalone /trace doesn't pass this prop in
          phase 1, so this evaluates to null and the page is unchanged.
          Showcase TraceDemo will provide it in commit 4. */}
      {renderSampleStrip
        ? renderSampleStrip(SAMPLE_RECEIPTS, handleSampleStripClick, isSamplePickerDisabled)
        : null}

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
