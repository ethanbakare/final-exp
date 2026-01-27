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
import { ClearButton } from '@/projects/trace/components/ui/tracebuttons';
import { TraceClearExpensesModal } from '@/projects/trace/components/ui/TraceModal';
import { TraceModalOverlay } from '@/projects/trace/components/ui/TraceModalOverlay';
import { groupEntriesByDay } from '@/projects/trace/utils/dataUtils';
import { blobToBase64, fileToBase64 } from '@/projects/trace/utils/fileUtils';
import Head from 'next/head';
import type { ExpenseEntry } from '@/projects/trace/types/trace.types';

const STORAGE_KEY = 'trace-expense-entries';

export default function TracePage() {
  // State management
  const [navbarState, setNavbarState] = useState<'idle' | 'recording' | 'processing_audio' | 'processing_image'>('idle');
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);

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
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Failed to access microphone');
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
    setNavbarState('processing_audio');

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const response = await fetch('/api/trace/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Audio, mimeType: 'audio/webm' }),
      });

      if (!response.ok) throw new Error('Failed to process audio');

      const entry: ExpenseEntry = await response.json();
      setEntries((prev) => [entry, ...prev]);
      setNavbarState('idle');
    } catch (err) {
      console.error('Error processing audio:', err);
      alert('Failed to process audio');
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

        if (!response.ok) throw new Error('Failed to process image');

        const entry: ExpenseEntry = await response.json();
        setEntries((prev) => [entry, ...prev]);
        setNavbarState('idle');
      } catch (err) {
        console.error('Error processing image:', err);
        alert('Failed to process image');
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

  return (
    <>
      <Head>
        <title>Trace - Voice & Image Expense Tracker</title>
        <meta name="description" content="Track expenses using voice or camera" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="trace-page">
        {/* Clear All Button - Fixed position top-right */}
        <div className="clear-button-container">
          <ClearButton onClick={handleClearAll} />
        </div>

        {/* Wrapper container for TextBox + Navbar */}
        <div className="trace-container">
          <AnimatedTextBox days={groupedDays} />
          <TRNavbar
            state={navbarState}
            onUploadClick={handleUploadClick}
            onSpeakClick={handleStartRecording}
            onCloseClick={handleCancelRecording}
            onSendAudioClick={handleSendAudio}
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
          display: flex;
          flex-direction: column;
          gap: 10px; /* 10px gap between TextBox and Navbar */
        }
      `}</style>
    </>
  );
}
