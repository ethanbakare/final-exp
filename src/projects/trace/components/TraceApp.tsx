/**
 * TraceApp - Main Trace Application Container
 * Voice & Image Expense Tracker
 *
 * Phase 8: Main Application Integration
 * Following TRACE_COMPONENTIZATION_PLAN.md specifications
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import TRNavbar from './ui/tracenavbar';
import { FinanceBox } from './ui/tracefinance';
import { blobToBase64, fileToBase64 } from '../utils/fileUtils';
import { groupEntriesByDay } from '../utils/dataUtils';
import type { ExpenseEntry, TraceAppState, TraceAppProps } from '../types/trace.types';
import styles from '../styles/trace.module.css';

const STORAGE_KEY = 'trace-expense-entries';

export const TraceApp: React.FC<TraceAppProps> = ({
  initialEntries = [],
  apiKey,
  onError,
}) => {
  // ==================== STATE MANAGEMENT ====================
  const [appState, setAppState] = useState<TraceAppState>('idle');
  const [entries, setEntries] = useState<ExpenseEntry[]>(initialEntries);
  const [error, setError] = useState<string | null>(null);

  // MediaRecorder state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ==================== LOCALSTORAGE PERSISTENCE ====================

  // Load entries from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsedEntries = JSON.parse(stored) as ExpenseEntry[];
          setEntries(parsedEntries);
        } catch (err) {
          console.error('Failed to parse stored entries:', err);
        }
      }
    }
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && entries.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries]);

  // ==================== VOICE RECORDING HANDLERS ====================

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setAppState('recording');
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
      if (onError) {
        onError('Failed to access microphone');
      }
    }
  };

  const handleSendAudio = async () => {
    if (!mediaRecorderRef.current) return;

    // Stop recording
    const mediaRecorder = mediaRecorderRef.current;
    mediaRecorder.stop();

    // Wait for final data
    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
    });

    // Stop all tracks
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());

    // Create blob from chunks
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    // Process audio
    setAppState('processing_audio');

    try {
      console.log('[TRACE APP] Converting audio blob to base64...');
      const base64Audio = await blobToBase64(audioBlob);
      console.log('[TRACE APP] Audio converted', {
        blobSize: audioBlob.size,
        base64Length: base64Audio.length
      });

      console.log('[TRACE APP] Sending request to /api/trace/parse-voice');
      const response = await fetch('/api/trace/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Audio,
          mimeType: 'audio/webm',
        }),
      });

      console.log('[TRACE APP] Response received', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('[TRACE APP] Response not OK. Body:', responseText);

        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.error || 'Failed to process audio');
      }

      const responseText = await response.text();
      console.log('[TRACE APP] Response body:', responseText);
      // parse-voice now returns an array of ExpenseEntry — one per unique
      // (merchant, date) pair Gemini detected in the recording. A single
      // sentence like "I spent £5 at Tesco and £12 at Boots" comes back
      // as two entries; the grouping logic in dataUtils handles the rest.
      const newEntries: ExpenseEntry[] = JSON.parse(responseText);
      console.log('[TRACE APP] Successfully parsed entries:', {
        count: newEntries.length,
        ids: newEntries.map((e) => e.id),
      });

      // Spread the new entries at the front of the store in the order
      // Gemini returned them. Date-based sorting in groupEntriesByDay
      // still handles cross-day ordering (newest date at top), so this
      // only affects within-day ordering when multiple entries land on
      // the same date from one recording.
      setEntries((prev) => [...newEntries, ...prev]);
      setAppState('idle');
      setError(null);
    } catch (err) {
      console.error('[TRACE APP] Error processing audio:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process audio';
      setError(errorMessage);
      setAppState('error');
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    audioChunksRef.current = [];
    setAppState('idle');
  };

  // ==================== IMAGE UPLOAD HANDLERS ====================

  const handleUploadImage = async (file: File) => {
    setAppState('processing_image');

    try {
      console.log('[TRACE APP] Converting image file to base64...', {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      });
      const base64Image = await fileToBase64(file);
      console.log('[TRACE APP] Image converted', {
        fileSize: file.size,
        base64Length: base64Image.length
      });

      console.log('[TRACE APP] Sending request to /api/trace/parse-receipt');
      const response = await fetch('/api/trace/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image,
          mimeType: file.type,
        }),
      });

      console.log('[TRACE APP] Response received', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error('[TRACE APP] Response not OK. Body:', responseText);

        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.error || 'Failed to process image');
      }

      const responseText = await response.text();
      console.log('[TRACE APP] Response body:', responseText);
      const entry: ExpenseEntry = JSON.parse(responseText);
      console.log('[TRACE APP] Successfully parsed entry:', entry.id);

      setEntries((prev) => [entry, ...prev]);
      setAppState('idle');
      setError(null);
    } catch (err) {
      console.error('[TRACE APP] Error processing image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
      setAppState('error');
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleUploadImage(file);
      }
    };
    input.click();
  };

  // ==================== ENTRY MANAGEMENT ====================

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // ==================== RENDER ====================

  // Convert navbar state to TRNavbarState type
  const navbarState = appState === 'error' ? 'idle' : appState;

  // Group entries by day for FinanceBox
  const groupedDays = groupEntriesByDay(entries);

  return (
    <div className={`${styles.container} trace-app`}>
      {/* Header */}
      <header className="trace-header">
        <h1>Trace</h1>
        <p className="subtitle">Voice & Image Expense Tracker</p>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button
            className="error-close"
            onClick={() => {
              setError(null);
              setAppState('idle');
            }}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="trace-main">
        {entries.length === 0 ? (
          <div className="empty-state">
            <p>No expenses logged yet</p>
            <p className="empty-subtext">Use the buttons below to get started</p>
          </div>
        ) : (
          <FinanceBox days={groupedDays} />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="trace-nav">
        <TRNavbar
          state={navbarState}
          onUploadClick={handleUploadClick}
          onSpeakClick={handleStartRecording}
          onCloseClick={handleCancelRecording}
          onSendAudioClick={handleSendAudio}
        />
      </nav>

      {/* Scoped Styles */}
      <style jsx>{`
        .trace-app {
          min-height: 100vh;
          background: var(--trace-bg-dark);
          color: var(--trace-text-primary);
          padding-bottom: 120px; /* Space for fixed nav */
        }

        /* ==================== HEADER ==================== */
        .trace-header {
          text-align: center;
          padding: 60px 20px 40px 20px;
        }

        .trace-header h1 {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-heading); /* 32px */
          font-weight: var(--trace-fw-medium);
          color: var(--trace-text-primary);
          margin: 0 0 8px 0;
        }

        .subtitle {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-medium); /* 14px */
          font-weight: var(--trace-fw-normal);
          color: var(--trace-text-tertiary);
          margin: 0;
        }

        /* ==================== ERROR BANNER ==================== */
        .error-banner {
          background: var(--trace-accent-red);
          color: var(--trace-text-primary);
          padding: 16px 20px;
          text-align: center;
          position: relative;
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-medium);
          font-weight: var(--trace-fw-medium);
        }

        .error-close {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--trace-text-primary);
          font-size: 28px;
          font-weight: var(--trace-fw-normal);
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s ease;
        }

        .error-close:hover {
          opacity: 0.8;
        }

        /* ==================== MAIN CONTENT ==================== */
        .trace-main {
          max-width: 600px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* ==================== EMPTY STATE ==================== */
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: var(--trace-text-tertiary);
        }

        .empty-state p {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-button); /* 16px */
          font-weight: var(--trace-fw-medium);
          margin: 0 0 8px 0;
        }

        .empty-subtext {
          font-size: var(--trace-fs-medium); /* 14px */
          font-weight: var(--trace-fw-normal);
          opacity: 0.7;
        }

        /* ==================== FIXED NAVIGATION ==================== */
        .trace-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 32px 20px;
          background: linear-gradient(
            to top,
            var(--trace-bg-dark) 0%,
            var(--trace-bg-dark) 60%,
            transparent 100%
          );
          pointer-events: none; /* Allow clicks to pass through gradient */
        }

        .trace-nav > :global(*) {
          pointer-events: auto; /* Re-enable clicks on navbar itself */
        }

        /* ==================== RESPONSIVE DESIGN ==================== */
        @media (max-width: 640px) {
          .trace-header {
            padding: 40px 20px 32px 20px;
          }

          .trace-header h1 {
            font-size: 28px;
          }

          .subtitle {
            font-size: 13px;
          }

          .trace-main {
            padding: 0 16px;
          }

          .trace-nav {
            padding: 24px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default TraceApp;
