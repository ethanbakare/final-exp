/**
 * Trace Application Page
 * Main entry point for the Trace expense tracker
 *
 * Route: /trace
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatedTextBox } from '@/projects/trace/components/ui/tracefinance-animated';
import TRNavbar from '@/projects/trace/components/ui/tracenavbar';
import { TRNavbarV2 } from '@/projects/trace/components/ui/tracenavbar-v2';
import { ClearButton } from '@/projects/trace/components/ui/tracebuttons';
import { TraceClearExpensesModal } from '@/projects/trace/components/ui/TraceModal';
import { TraceModalOverlay } from '@/projects/trace/components/ui/TraceModalOverlay';
import { MicPermissionBanner } from '@/projects/new-home/components/MicPermissionBanner';
import { TraceToastNotification } from '@/projects/trace/components/ui/TraceToast';
import type { ProcessingState } from '@/projects/trace/components/ui/traceIcons';
import { groupEntriesByDay } from '@/projects/trace/utils/dataUtils';
import { blobToBase64, fileToBase64 } from '@/projects/trace/utils/fileUtils';
import Head from 'next/head';
import type { ExpenseEntry } from '@/projects/trace/types/trace.types';

// Minimum audio blob size (~1 second of webm audio)
const MIN_AUDIO_BLOB_SIZE = 1000;

const STORAGE_KEY = 'trace-expense-entries';

export default function TracePage() {
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

    const mediaRecorder = mediaRecorderRef.current;
    mediaRecorder.stop();

    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
    });

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
      const response = await fetch('/api/trace/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Audio, mimeType: 'audio/webm' }),
      });

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
      // them downstream. Storing the raw array at index 0 (the old code's
      // bug) was what caused dataUtils to crash on `entry.items.map`.
      const newEntries: ExpenseEntry[] = await response.json();
      setEntries((prev) => [...newEntries, ...prev]);
      setNavbarState('idle');
    } catch {
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

      setNavbarState('processing_image');

      try {
        const base64Image = await fileToBase64(file);
        const response = await fetch('/api/trace/parse-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Image, mimeType: file.type }),
        });

        if (!response.ok) {
          showError("That doesn't look like a receipt");
          setNavbarState('idle');
          return;
        }

        const entry: ExpenseEntry = await response.json();
        setEntries((prev) => [entry, ...prev]);
        setNavbarState('idle');
      } catch {
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

  // Handle modal confirm delete
  const handleConfirmClear = () => {
    setEntries([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setShowClearModal(false);
  };

  // Handle modal cancel
  const handleCancelClear = () => {
    setShowClearModal(false);
  };

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
      <Head>
        <title>Trace - Voice & Image Expense Tracker</title>
        <meta name="description" content="Track expenses using voice or camera" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="trace-page">
        {/* Mic Permission Banner — reusable across any audio demo */}
        <MicPermissionBanner />

        {/* Clear All Button - Fixed position top-right */}
        <div className="clear-button-container">
          <ClearButton onClick={handleClearAll} />
        </div>

        {/* Wrapper container for TextBox with Navbar inside */}
        <div className="trace-container">
          {/* Error Toast — floats above TextBox */}
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

        {/* Clear Expenses Modal */}
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
      </div>

      <style jsx>{`
        .trace-page {
          position: relative;
          min-height: 100vh;
          background: var(--trace-bg-dark);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .clear-button-container {
          position: absolute;
          bottom: 20px;
          right: 20px;
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
}
