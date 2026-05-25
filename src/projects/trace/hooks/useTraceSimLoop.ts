/**
 * useTraceSimLoop — the shared Trace preview animation driver.
 *
 * Runs the simulation loop that powers the animated Trace previews:
 *   idle → recording → processing_audio → results → pause → (repeat)
 *
 * Returns the live values to feed the three coordinated animations:
 *   - grandTotal      → top-right total (AnimatedMasterTotalPrice count-up)
 *   - days            → middle finance area (empty → populated)
 *   - processingState → middle empty-state icon → "processing" copy swap
 *   - navbarState     → bottom bar (idle/recording/analysing)
 *
 * The caller supplies the dataset that animates in at the results phase
 * (so each surface — home card, projects widget — keeps its own data).
 * Results data is read through a ref, so passing a fresh array/string
 * reference each render does NOT restart the loop.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type { TRNavbarState } from '@/projects/trace/types/trace.types';
import type { ProcessingState } from '@/projects/trace/components/ui/traceIcons';

// ─── Timing (ms) — matches TraceSim ────────────────────────
const PHASE_IDLE = 1000;
const PHASE_RECORDING = 3000;
const PHASE_PROCESSING = 3000;
const PHASE_RESULTS = 4000;
const PHASE_PAUSE = 2000;
const TOTAL_LOOP =
  PHASE_IDLE + PHASE_RECORDING + PHASE_PROCESSING + PHASE_RESULTS + PHASE_PAUSE;

type SimState = 'idle' | 'recording' | 'processing_audio' | 'results' | 'pause';

export interface TraceSimLoopValue<TDay> {
  days: TDay[];
  grandTotal: string;
  navbarState: TRNavbarState;
  processingState: ProcessingState;
}

export function useTraceSimLoop<TDay>(
  resultsDays: TDay[],
  resultsGrandTotal: string,
  enabled = true,
): TraceSimLoopValue<TDay> {
  const [simState, setSimState] = useState<SimState>('idle');
  const [days, setDays] = useState<TDay[]>([]);
  const [grandTotal, setGrandTotal] = useState('0.00');

  // Latest results data, read at the results phase — kept in a ref so an
  // unstable caller reference (inline array) doesn't restart the loop.
  const resultsRef = useRef({ days: resultsDays, grandTotal: resultsGrandTotal });
  resultsRef.current = { days: resultsDays, grandTotal: resultsGrandTotal };

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
      setDays(resultsRef.current.days);
      setGrandTotal(resultsRef.current.grandTotal);
    });
    at(PHASE_IDLE + PHASE_RECORDING + PHASE_PROCESSING + PHASE_RESULTS, () => {
      setSimState('pause');
      setDays([]);
      setGrandTotal('0.00');
    });
    at(TOTAL_LOOP, () => startLoop());
  }, [clearTimers]);

  useEffect(() => {
    if (!enabled) return;
    startLoop();
    return () => clearTimers();
  }, [startLoop, clearTimers, enabled]);

  // Disabled → no loop, no timers: just the static populated result (the
  // pre-animation behaviour), so non-animated callers are unaffected.
  if (!enabled) {
    return {
      days: resultsDays,
      grandTotal: resultsGrandTotal,
      navbarState: 'idle',
      processingState: 'idle',
    };
  }

  const navbarState: TRNavbarState =
    simState === 'results' || simState === 'pause' ? 'idle' : simState;
  const processingState: ProcessingState =
    simState === 'processing_audio' ? 'audio' : 'idle';

  return { days, grandTotal, navbarState, processingState };
}
