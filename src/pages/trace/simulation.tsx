/**
 * Trace Simulation Page
 * Auto-playing demo that cycles: idle → recording → processing → results → clear → loop
 * Uses the same AnimatedTextBox component as the real Trace app but with
 * mock data and scripted state transitions instead of real audio/API calls.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatedTextBox } from '@/projects/trace/components/ui/tracefinance-animated';
import { TRNavbarV2 } from '@/projects/trace/components/ui/tracenavbar-v2';
import { ClearButton } from '@/projects/trace/components/ui/tracebuttons';
import type { ProcessingState } from '@/projects/trace/components/ui/traceIcons';
import Head from 'next/head';

// ─── Mock Data ──────────────────────────────────────────────
const MOCK_ENTRIES = [
  {
    date: '13th Apr',
    dateOriginal: '2026-04-13',
    total: '18.47',
    merchants: [
      {
        merchantName: 'Tesco',
        merchantTotal: '8.47',
        items: [
          { quantity: '1x', itemName: 'Sourdough loaf', netPrice: '2.50' },
          { quantity: '2x', itemName: 'Oat milk', netPrice: '3.98' },
          { quantity: '1x', itemName: 'Greek yoghurt', netPrice: '1.99' },
        ],
      },
      {
        merchantName: 'Costa',
        merchantTotal: '9.00',
        items: [
          { quantity: '1x', itemName: 'Flat white', netPrice: '3.50' },
          { quantity: '1x', itemName: 'Croissant', netPrice: '2.50' },
          { quantity: '1x', itemName: 'Orange juice', netPrice: '3.00' },
        ],
      },
    ],
  },
];

// ─── Timing (ms) ─────────────────────────────────────────────
const PHASE_IDLE       = 1500;  // empty state, record button visible
const PHASE_RECORDING  = 3000;  // waveform animating
const PHASE_PROCESSING = 1500;  // "processing_audio" spinner
const PHASE_RESULTS    = 5000;  // entries visible with animations
const PHASE_PAUSE      = 2000;  // hold before loop restarts

const TOTAL_LOOP = PHASE_IDLE + PHASE_RECORDING + PHASE_PROCESSING + PHASE_RESULTS + PHASE_PAUSE;

// Duration the progress bar fills over (active phases only)
export const SIM_DURATION = PHASE_IDLE + PHASE_RECORDING + PHASE_PROCESSING;

type SimState = 'idle' | 'recording' | 'processing_audio' | 'results' | 'pause';

// ─── Simulation Page ─────────────────────────────────────────
export default function TraceSimulation() {
  const [simState, setSimState] = useState<SimState>('idle');
  const [days, setDays] = useState<typeof MOCK_ENTRIES>([]);
  const [grandTotal, setGrandTotal] = useState('0.00');

  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  const startLoop = useCallback(() => {
    clearTimers();

    // Reset to empty
    setSimState('idle');
    setDays([]);
    setGrandTotal('0.00');

    const at = (delay: number, fn: () => void) => {
      timerRefs.current.push(setTimeout(fn, delay));
    };

    const T1 = PHASE_IDLE;
    const T2 = T1 + PHASE_RECORDING;
    const T3 = T2 + PHASE_PROCESSING;
    const T4 = T3 + PHASE_RESULTS;

    at(T1, () => setSimState('recording'));
    at(T2, () => setSimState('processing_audio'));
    at(T3, () => {
      // Show results
      setSimState('results');
      setDays(MOCK_ENTRIES);
      setGrandTotal('18.47');
    });
    at(T4, () => {
      // Pause phase — clear entries, hold
      setSimState('pause');
      setDays([]);
      setGrandTotal('0.00');
    });
    at(TOTAL_LOOP, () => startLoop());

    timerRefs.current = timerRefs.current;
  }, [clearTimers]);

  useEffect(() => {
    startLoop();
    return () => clearTimers();
  }, [startLoop, clearTimers]);

  // ── Derive navbar/processing state ────────────────────────
  const navbarState: 'idle' | 'recording' | 'processing_audio' | 'processing_image' =
    simState === 'results' || simState === 'pause' ? 'idle' : simState;

  const processingState: ProcessingState =
    simState === 'processing_audio' ? 'audio' : 'idle';

  return (
    <>
      <Head>
        <title>Trace Simulation</title>
      </Head>

      <div className="trace-sim-page">
        <div className="trace-sim-container">
          <AnimatedTextBox
            days={days}
            grandTotal={grandTotal}
            processingState={processingState}
            navbar={
              <TRNavbarV2
                state={navbarState}
                onUploadClick={() => {}}
                onSpeakClick={() => {}}
                onCloseClick={() => {}}
                onSendAudioClick={() => {}}
              />
            }
          />
        </div>

        {/* Clear button positioned below the card */}
        <div className="clear-button-below">
          <ClearButton onClick={() => {}} />
        </div>
      </div>

      <style jsx>{`
        .trace-sim-page {
          position: relative;
          min-height: 100vh;
          background: var(--trace-bg-dark);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          gap: 16px;
        }
        .trace-sim-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          overflow: hidden;
          border-radius: 16px;
        }
        .clear-button-below {
          display: flex;
          justify-content: center;
          z-index: 10;
        }
      `}</style>
    </>
  );
}
