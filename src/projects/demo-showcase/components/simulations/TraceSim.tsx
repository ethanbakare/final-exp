/**
 * Embeddable Trace simulation for the demo showcase.
 * Auto-loops: idle → recording → processing → results → clear → restart.
 * Uses the real AnimatedTextBox + TRNavbarV2 with simulateAudio prop.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatedTextBox } from '@/projects/trace/components/ui/tracefinance-animated';
import { TRNavbarV2 } from '@/projects/trace/components/ui/tracenavbar-v2';
import type { ProcessingState } from '@/projects/trace/components/ui/traceIcons';

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
const PHASE_IDLE       = 1500;
const PHASE_RECORDING  = 3000;
const PHASE_PROCESSING = 2500;
const PHASE_RESULTS    = 5000;
const PHASE_PAUSE      = 2000;
const TOTAL_LOOP = PHASE_IDLE + PHASE_RECORDING + PHASE_PROCESSING + PHASE_RESULTS + PHASE_PAUSE;

// Progress bar fills over active phases only
export const TRACE_SIM_DURATION = PHASE_IDLE + PHASE_RECORDING + PHASE_PROCESSING;

type SimState = 'idle' | 'recording' | 'processing_audio' | 'results' | 'pause';

interface TraceSimProps {
  onLoopRestart?: () => void;
}

export const TraceSim: React.FC<TraceSimProps> = ({ onLoopRestart }) => {
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
    setSimState('idle');
    setDays([]);
    setGrandTotal('0.00');

    const at = (delay: number, fn: () => void) => {
      timerRefs.current.push(setTimeout(fn, delay));
    };

    at(PHASE_IDLE, () => setSimState('recording'));
    at(PHASE_IDLE + PHASE_RECORDING, () => setSimState('processing_audio'));
    at(PHASE_IDLE + PHASE_RECORDING + PHASE_PROCESSING, () => {
      setSimState('results');
      setDays(MOCK_ENTRIES);
      setGrandTotal('18.47');
    });
    at(PHASE_IDLE + PHASE_RECORDING + PHASE_PROCESSING + PHASE_RESULTS, () => {
      setSimState('pause');
      setDays([]);
      setGrandTotal('0.00');
    });
    at(TOTAL_LOOP, () => {
      onLoopRestart?.();
      startLoop();
    });
  }, [clearTimers, onLoopRestart]);

  useEffect(() => {
    startLoop();
    return () => clearTimers();
  }, [startLoop, clearTimers]);

  const navbarState: 'idle' | 'recording' | 'processing_audio' | 'processing_image' =
    simState === 'results' || simState === 'pause' ? 'idle' : simState;

  const processingState: ProcessingState =
    simState === 'processing_audio' ? 'audio' : 'idle';

  return (
    <div className="trace-sim-embed">
      <AnimatedTextBox
        days={days}
        grandTotal={grandTotal}
        processingState={processingState}
        navbar={
          <TRNavbarV2
            state={navbarState}
            simulateAudio
            onUploadClick={() => {}}
            onSpeakClick={() => {}}
            onCloseClick={() => {}}
            onSendAudioClick={() => {}}
          />
        }
      />

      <style jsx>{`
        .trace-sim-embed {
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }
        /* Reduce the TextBox height so it fits in the showcase slot
           without clipping. The native height is 500px + navbar;
           shrinking by ~40px keeps everything visible. */
        .trace-sim-embed :global(.text-box) {
          height: calc(var(--trace-textbox-height) - 80px) !important;
        }
        .trace-sim-embed :global(.text-box--with-navbar) {
          height: calc(var(--trace-textbox-height) - 80px + var(--trace-button-height) + 20px) !important;
        }
      `}</style>
    </div>
  );
};
