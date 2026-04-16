/**
 * Animated Trace preview for the home page card.
 * Same structure as the static PreviewTrace (three sibling components
 * inside a manually-sized div) but with animated versions + a simulation
 * loop: idle → recording → processing → results → pause → restart.
 *
 * Uses the existing £720.97 dummy data, NOT TraceSim's £18.47.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import traceStyles from '@/projects/trace/styles/trace.module.css';
import { MasterBlockHolder } from '@/projects/trace/components/ui/tracefinance';
import {
  AnimatedFinanceBox,
  AnimatedMasterTotalPrice,
} from '@/projects/trace/components/ui/tracefinance-animated';
import { TRNavbarV2 } from '@/projects/trace/components/ui/tracenavbar-v2';
import type { ProcessingState } from '@/projects/trace/components/ui/traceIcons';

// ─── Same data as the original static PreviewTrace ─────────
const DUMMY_DAYS = [
  {
    date: '14th Jul',
    dateOriginal: '2026-07-14',
    total: '720.97',
    merchants: [
      {
        merchantName: 'TESCOS',
        merchantTotal: '720.97',
        items: [
          { quantity: '2x', itemName: 'Headphones', netPrice: '104.99', discount: '3.99' },
          { quantity: '1x', itemName: 'Playstation 5', netPrice: '499.99' },
          { quantity: '1x', itemName: 'Chino Trousers', netPrice: '14.99' },
        ],
      },
    ],
  },
];

// ─── Timing (ms) — matches TraceSim ────────────────────────
const PHASE_IDLE       = 1500;
const PHASE_RECORDING  = 3000;
const PHASE_PROCESSING = 2500;
const PHASE_RESULTS    = 5000;
const PHASE_PAUSE      = 2000;
const TOTAL_LOOP = PHASE_IDLE + PHASE_RECORDING + PHASE_PROCESSING + PHASE_RESULTS + PHASE_PAUSE;

type SimState = 'idle' | 'recording' | 'processing_audio' | 'results' | 'pause';

const PreviewTraceAnimated: React.FC = () => {
  const [simState, setSimState] = useState<SimState>('idle');
  const [days, setDays] = useState<typeof DUMMY_DAYS>([]);
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
      setDays(DUMMY_DAYS);
      setGrandTotal('720.97');
    });
    at(PHASE_IDLE + PHASE_RECORDING + PHASE_PROCESSING + PHASE_RESULTS, () => {
      setSimState('pause');
      setDays([]);
      setGrandTotal('0.00');
    });
    at(TOTAL_LOOP, () => {
      startLoop();
    });
  }, [clearTimers]);

  useEffect(() => {
    startLoop();
    return () => clearTimers();
  }, [startLoop, clearTimers]);

  // Derive navbar + processing states
  const navbarState: 'idle' | 'recording' | 'processing_audio' | 'processing_image' =
    simState === 'results' || simState === 'pause' ? 'idle' : simState;

  const processingState: ProcessingState =
    simState === 'processing_audio' ? 'audio' : 'idle';

  return (
    <div className="preview-trace">
      <div className={`trace-frame ${traceStyles.container}`}>
        <MasterBlockHolder
          total={grandTotal}
          priceSlot={<AnimatedMasterTotalPrice total={grandTotal} />}
        />
        <AnimatedFinanceBox days={days} processingState={processingState} />
        <TRNavbarV2
          state={navbarState}
          simulateAudio
          onUploadClick={() => {}}
          onSpeakClick={() => {}}
          onCloseClick={() => {}}
          onSendAudioClick={() => {}}
        />
      </div>

      <style jsx>{`
        .preview-trace {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .trace-frame {
          position: absolute;
          left: -72px;
          bottom: 27px;
          width: 301px;
          height: 530px;
          border-radius: 16px;
          border: 1px solid #44403C;
          background: #1C1917;
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          pointer-events: none;
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default PreviewTraceAnimated;
