import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';
import { TranscriptBar } from '@/projects/ai-confidence-tracker/components/ui/transcript-bar';
import { TranscriptBoxNav, NavState } from '@/projects/ai-confidence-tracker/components/ui/transcript-box-nav';
import { TranscriptTextStates, TextState } from '@/projects/ai-confidence-tracker/components/ui/transcript-text-states';
import { LowConfidenceBadge, MediumConfidenceBadge, HighConfidenceBadge } from '@/projects/ai-confidence-tracker/components/ui/deepButtons';

// ─── Mock Data ───────────────────────────────────────────────
const MOCK_TRANSCRIPT = "Warchester's warden's whisper weird wishes";

const MOCK_WORDS = [
  { word: "Warchester's", confidence: 0.30, category: 'low' as const },
  { word: "warden's",     confidence: 0.75, category: 'medium' as const },
  { word: "whisper",      confidence: 0.98, category: 'high' as const },
  { word: "weird",        confidence: 0.95, category: 'high' as const },
  { word: "wishes",       confidence: 0.97, category: 'high' as const },
];

const MOCK_HIGHLIGHTS = MOCK_WORDS
  .map((w, i) => ({ wordId: i, confidenceLevel: w.category, percentage: `${Math.round(w.confidence * 100)}%` }))
  .filter(h => h.confidenceLevel !== 'high');

// ─── Timing (ms) ────────────────────────────────────────────
// Each phase duration is measured so progress bar fills accurately.
const PHASE_INITIAL    = 1500;  // pause before "recording" starts
const PHASE_RECORDING  = 2000;  // simulated recording
const PHASE_PROCESSING = 1000;  // simulated processing
const PHASE_RESULTS    = 5000;  // hold results (badges visible, hoverable)
const PHASE_PAUSE      = 2000;  // pause after results before loop restarts
const TOTAL_LOOP = PHASE_INITIAL + PHASE_RECORDING + PHASE_PROCESSING + PHASE_RESULTS + PHASE_PAUSE;

type SimState = 'initial' | 'recording' | 'processing' | 'results' | 'pause';

// Bar fill duration = every phase where something is visually moving.
// After PHASE_PROCESSING ends, the results state triggers a chain:
//   1. Text fade-in animation: 600ms (HighlightedText textAnimating)
//   2. Buffer before underlines start: 30ms
//   3. Underline draw animation: 2800ms (CSS transform 2.8s)
// Total post-processing animation = 3430ms.
// The bar should reach 100% when the underlines finish drawing —
// that's the last visible motion. Everything after is static viewing.
const POST_PROCESSING_ANIM = 600 + 30 + 2800; // text + buffer + underline draw
export const SIM_DURATION = PHASE_INITIAL + PHASE_RECORDING + PHASE_PROCESSING + POST_PROCESSING_ANIM;

interface AIConfidenceSimProps {
  onLoopRestart?: () => void;
}

export const AIConfidenceSim: React.FC<AIConfidenceSimProps> = ({ onLoopRestart }) => {
  const [simState, setSimState] = useState<SimState>('initial');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeWordId, setActiveWordId] = useState<number | null>(null);
  const [badgeStates, setBadgeStates] = useState<Map<number, boolean>>(new Map());
  const [modelCopyActiveWordId, setModelCopyActiveWordId] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const loopStartRef = useRef(Date.now());
  const elapsedBeforePauseRef = useRef(0);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isPausedRef = useRef(false);

  // ── Clear all pending timers ────────────────────────────────
  const clearTimers = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }, []);

  // ── Schedule remaining transitions from a given elapsed offset ──
  const scheduleFrom = useCallback((elapsedSoFar: number) => {
    clearTimers();
    loopStartRef.current = Date.now() - elapsedSoFar;

    const at = (target: number, fn: () => void) => {
      const delay = target - elapsedSoFar;
      if (delay > 0) timerRefs.current.push(setTimeout(fn, delay));
      else fn(); // already past this point
    };

    const T1 = PHASE_INITIAL;
    const T2 = T1 + PHASE_RECORDING;
    const T3 = T2 + PHASE_PROCESSING;
    const T4 = T3 + PHASE_RESULTS;

    at(T1, () => setSimState('recording'));
    at(T2, () => setSimState('processing'));
    at(T3, () => {
      setSimState('results');
      setTimeout(() => setIsCollapsed(false), 300);
    });
    at(T4, () => {
      setSimState('pause');
      setIsCollapsed(true);
    });
    at(TOTAL_LOOP, () => {
      // Reset and start fresh
      setSimState('initial');
      setIsCollapsed(true);
      setActiveWordId(null);
      setBadgeStates(new Map());
      setModelCopyActiveWordId(null);
      elapsedBeforePauseRef.current = 0;
      onLoopRestart?.();
      scheduleFrom(0);
    });
  }, [clearTimers]);

  // ── Start on mount ────────────────────────────────────────
  useEffect(() => {
    scheduleFrom(0);
    return () => clearTimers();
  }, [scheduleFrom, clearTimers]);

  // ── Hover pause/resume ────────────────────────────────────
  // When user hovers over the simulation, pause all timers so they
  // can interact with badges. Resume from the same point on leave.
  useEffect(() => {
    if (isHovered && !isPausedRef.current) {
      isPausedRef.current = true;
      const elapsed = Date.now() - loopStartRef.current;
      elapsedBeforePauseRef.current = elapsed;
      clearTimers();
    } else if (!isHovered && isPausedRef.current) {
      isPausedRef.current = false;
      scheduleFrom(elapsedBeforePauseRef.current);
    }
  }, [isHovered, clearTimers, scheduleFrom]);

  // ── Interaction handlers ──────────────────────────────────
  const clearInteraction = useCallback(() => {
    setActiveWordId(null);
    setBadgeStates(new Map());
    setModelCopyActiveWordId(null);
  }, []);

  const handleBadgeInteraction = useCallback((wordId: number | null) => {
    setActiveWordId(wordId);
    const newMap = new Map<number, boolean>();
    if (wordId !== null) newMap.set(wordId, true);
    setBadgeStates(newMap);
    setModelCopyActiveWordId(wordId);
  }, []);

  // ── Derived state ────────────────────────────────────────
  const showResults = simState === 'results';
  const navState: NavState = simState === 'pause' ? 'results' : simState;
  const textState: TextState = simState === 'pause' ? 'results' : simState;
  const transcriptText = showResults ? MOCK_TRANSCRIPT : '';
  const highlights = showResults ? MOCK_HIGHLIGHTS : [];
  const isHighConfidenceState = highlights.length === 0 && transcriptText.length > 0;

  const getOrderedBadges = () => {
    const words = transcriptText.split(/\s+/);
    const ordered: Array<{wordId: number; confidenceLevel: 'low' | 'medium'; originalText: string}> = [];
    highlights.forEach(h => {
      if (h.confidenceLevel !== 'high') {
        const word = words[h.wordId];
        if (word) {
          ordered.push({
            wordId: h.wordId,
            confidenceLevel: h.confidenceLevel as 'low' | 'medium',
            originalText: word.replace(/[.,!?;:]/g, ''),
          });
        }
      }
    });
    ordered.sort((a, b) => a.wordId - b.wordId);
    return ordered;
  };
  const orderedBadges = getOrderedBadges();

  const getWordFromId = (wordId: number) => {
    const words = transcriptText.split(/\s+/);
    return words[wordId]?.replace(/[.,!?;:]/g, '') || '';
  };

  const getPercentageFromId = (wordId: number) => {
    const h = highlights.find(x => x.wordId === wordId);
    return h?.percentage || '';
  };

  const getModelCopyContent = () => {
    if (isHighConfidenceState) {
      return { text: 'Press the clear button to start new transcription', hasHighlight: false };
    }
    if (modelCopyActiveWordId === null) {
      return { text: 'Hover over a badge to view confidence score', hasHighlight: false };
    }
    const word = getWordFromId(modelCopyActiveWordId);
    const percentage = getPercentageFromId(modelCopyActiveWordId);
    return { text: '', hasHighlight: true, percentage, word };
  };
  const modelCopyContent = getModelCopyContent();

  return (
    <div
      className={`sim-transcript-interface ${styles.container}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); clearInteraction(); }}
    >
      <TranscriptBar isMobile={false} isHighConfidenceState={isHighConfidenceState} navState={navState} />

      <div className={`sim-transcript-mainframe ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sim-transcript-box">
          <TranscriptTextStates
            textState={textState}
            transcriptText={transcriptText}
            highlights={highlights}
            activeWordId={activeWordId}
            onWordInteraction={handleBadgeInteraction}
          />
          <TranscriptBoxNav
            navState={navState}
            onDropdownClick={() => {}}
            onClearClick={() => {}}
            onRecordClick={() => {}}
            onRecordingClick={() => {}}
            onCancelClick={() => {}}
            onRetryClick={() => {}}
          />
        </div>

        <div className={`sim-transcript-data ${isCollapsed ? 'hidden' : ''}`}>
          <div className="sim-mastercon-badge">
            {isHighConfidenceState ? (
              <HighConfidenceBadge />
            ) : (
              orderedBadges.map((badge, index) => (
                <div
                  key={`badge-${index}`}
                  className="confidence-badge-wrapper"
                  onMouseEnter={() => handleBadgeInteraction(badge.wordId)}
                  onMouseLeave={clearInteraction}
                  style={{ cursor: 'pointer' }}
                >
                  {badge.confidenceLevel === 'medium' ? (
                    <MediumConfidenceBadge
                      text={badge.originalText}
                      isExternallyActive={badgeStates.get(badge.wordId) === true}
                      disableInternalClick={true}
                    />
                  ) : (
                    <LowConfidenceBadge
                      text={badge.originalText}
                      isExternallyActive={badgeStates.get(badge.wordId) === true}
                      disableInternalClick={true}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          <div className={`sim-model-copy ${styles.OpenSansRegular16It}`}>
            {modelCopyContent.hasHighlight ? (
              <>
                Model was <span className={styles.OpenSansRegular16ItBold}>{modelCopyContent.percentage}</span> confident in the transcribed word <span className={styles.OpenSansRegular16ItBold}>&apos;{modelCopyContent.word}&apos;</span>
              </>
            ) : (
              modelCopyContent.text
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .sim-transcript-interface {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 10px;
          gap: 10px;
          position: relative;
          width: 100%;
          max-width: 620px;
          /* Fixed height so the drawer expanding doesn't shift
             the progress bar or CTA buttons below */
          height: 400px;
        }
        .sim-transcript-mainframe {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0 0 16px;
          gap: 16px;
          width: 100%;
          max-width: 600px;
          background: var(--MainBoxDrawerBg);
          border-radius: 16px;
          overflow: visible;
          transition: padding-bottom 0.9s cubic-bezier(0.4, 0, 0.2, 1),
                      gap 0.9s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .sim-transcript-mainframe.collapsed {
          padding-bottom: 0;
          gap: 0;
        }
        .sim-transcript-box {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4px 0 20px;
          gap: 16px;
          width: 100%;
          max-width: 600px;
          min-height: 216px;
          background: var(--MainBoxBg);
          border: 1px solid var(--MainBoxOutline);
          box-shadow: 0 4px 12px var(--darkGrey09);
          border-radius: 16px;
          position: relative;
          z-index: 2;
          overflow: visible;
        }
        .sim-transcript-data {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0 28px;
          gap: 10px;
          width: 100%;
          max-width: 600px;
          max-height: 200px;
          opacity: 1;
          transition: max-height 0.9s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1),
                      padding 0.9s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 1;
          overflow: hidden;
        }
        .sim-transcript-data.hidden {
          max-height: 0;
          opacity: 0;
          padding-top: 0;
          padding-bottom: 0;
        }
        .sim-mastercon-badge {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 6px;
          width: 100%;
          min-height: 20px;
        }
        .sim-model-copy {
          display: block;
          width: 100%;
          max-width: 546px;
          color: var(--darkGrey40);
        }
      `}</style>
    </div>
  );
};
