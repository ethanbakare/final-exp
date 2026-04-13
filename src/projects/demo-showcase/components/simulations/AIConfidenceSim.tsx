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
const PHASE_INITIAL   = 1500;  // brief pause before "recording"
const PHASE_RECORDING = 2000;  // simulated recording
const PHASE_PROCESSING = 1000; // simulated processing
const PHASE_RESULTS   = 5000;  // hold results so badges can be seen
const TOTAL_LOOP = PHASE_INITIAL + PHASE_RECORDING + PHASE_PROCESSING + PHASE_RESULTS;

type SimState = 'initial' | 'recording' | 'processing' | 'results';

interface AIConfidenceSimProps {
  onProgress?: (progress: number) => void;
}

export const AIConfidenceSim: React.FC<AIConfidenceSimProps> = ({ onProgress }) => {
  const [simState, setSimState] = useState<SimState>('initial');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeWordId, setActiveWordId] = useState<number | null>(null);
  const [badgeStates, setBadgeStates] = useState<Map<number, boolean>>(new Map());
  const [modelCopyActiveWordId, setModelCopyActiveWordId] = useState<number | null>(null);

  const loopStartRef = useRef(Date.now());
  const rafRef = useRef<number>(0);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Auto-play loop ──────────────────────────────────────────
  const startLoop = useCallback(() => {
    // Clear any pending timers
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    loopStartRef.current = Date.now();
    setSimState('initial');
    setIsCollapsed(true);
    setActiveWordId(null);
    setBadgeStates(new Map());
    setModelCopyActiveWordId(null);

    // Schedule state transitions
    const t1 = setTimeout(() => setSimState('recording'), PHASE_INITIAL);
    const t2 = setTimeout(() => setSimState('processing'), PHASE_INITIAL + PHASE_RECORDING);
    const t3 = setTimeout(() => {
      setSimState('results');
      setTimeout(() => setIsCollapsed(false), 300);
    }, PHASE_INITIAL + PHASE_RECORDING + PHASE_PROCESSING);
    const t4 = setTimeout(() => startLoop(), TOTAL_LOOP);

    timerRefs.current = [t1, t2, t3, t4];
  }, []);

  useEffect(() => {
    startLoop();
    return () => {
      timerRefs.current.forEach(clearTimeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [startLoop]);

  // ── Progress reporting ────────────────────────────────────
  useEffect(() => {
    if (!onProgress) return;

    const tick = () => {
      const elapsed = Date.now() - loopStartRef.current;
      const progress = Math.min(1, elapsed / TOTAL_LOOP);
      onProgress(progress);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [onProgress]);

  // ── Interaction handlers (hover/touch for badges) ────────
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
  const navState: NavState = simState;
  const textState: TextState = simState;
  const transcriptText = simState === 'results' ? MOCK_TRANSCRIPT : '';
  const highlights = simState === 'results' ? MOCK_HIGHLIGHTS : [];
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
    <div className={`sim-transcript-interface ${styles.container}`}>
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
          height: auto;
          min-height: 300px;
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
