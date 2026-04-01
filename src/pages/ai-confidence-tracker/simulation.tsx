import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';
import { TranscriptBar } from '@/projects/ai-confidence-tracker/components/ui/transcript-bar';
import { TranscriptBoxNav, NavState } from '@/projects/ai-confidence-tracker/components/ui/transcript-box-nav';
import { TranscriptTextStates, TextState } from '@/projects/ai-confidence-tracker/components/ui/transcript-text-states';
import { LowConfidenceBadge, MediumConfidenceBadge, HighConfidenceBadge } from '@/projects/ai-confidence-tracker/components/ui/deepButtons';

// ─── Mock Data ───────────────────────────────────────────────
const PROMPT_SENTENCE = "Worcestershire wardens whisper weird wishes.";
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

const RECORDING_DURATION = 2000;
const PROCESSING_DURATION = 1000;

// ─── Types ───────────────────────────────────────────────────
type SimState = 'initial' | 'recording' | 'processing' | 'results';

// ─── Static DeepReader ───────────────────────────────────────
const StaticDeepReader: React.FC = () => (
  <div className={`${styles.container} reading-interface`}>
    <div className="reading-microcopy">
      <div className={`read-text-label ${styles.InterRegular12}`}>Read text below aloud</div>
    </div>
    <div className="reading-box">
      <div className="reading-box-text">
        <div className="text-content">
          <span className={styles.OpenRundeRegular20}>{PROMPT_SENTENCE}</span>
        </div>
      </div>
    </div>
    <style jsx>{`
      .reading-interface {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 10px 0px;
        gap: 10px;
        width: 100%;
        max-width: 600px;
        height: auto;
        min-height: 100px;
        flex: none;
        order: 0;
        align-self: stretch;
        flex-grow: 0;
      }
      .reading-microcopy {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        margin-bottom: 5px;
      }
      .read-text-label {
        width: auto;
        height: auto;
        text-align: center;
        letter-spacing: -0.01em;
        color: var(--darkGrey30);
      }
      .reading-box {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 15px;
        gap: 4px;
        width: 100%;
        max-width: 600px;
        height: auto;
        min-height: 80px;
        background: var(--BaseWhite);
        border-width: 2px 0px;
        border-style: solid;
        border-color: var(--darkGrey05);
        flex: none;
        order: 1;
        align-self: stretch;
        flex-grow: 0;
      }
      .reading-box-text {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 12px 12px 0px;
        gap: 10px;
        width: 100%;
        height: auto;
        min-height: 41px;
        border-radius: 6px;
        flex: none;
        order: 0;
        align-self: stretch;
        flex-grow: 0;
      }
      .text-content {
        width: 100%;
        height: auto;
        min-height: 29px;
        color: var(--darkGrey80);
        flex: none;
        order: 0;
        align-self: stretch;
        flex-grow: 0;
      }
    `}</style>
  </div>
);

// ─── Simulated Card ──────────────────────────────────────────
interface SimCardProps {
  simState: SimState;
  isMobile: boolean;
  activeWordId: number | null;
  badgeStates: Map<number, boolean>;
  isCollapsed: boolean;
  modelCopyActiveWordId: number | null;
  lastInteractionWasTouchRef: React.MutableRefObject<boolean>;
  onTextInteraction: (wordId: number | null) => void;
  onBadgeInteraction: (wordId: number | null) => void;
  onClearInteraction: () => void;
  onDropdownClick: () => void;
  onClearClick: () => void;
  onRecordClick: () => void;
  onRecordingClick: () => void;
  onCancelClick: () => void;
  onRetryClick: () => void;
}

const SimulatedCard: React.FC<SimCardProps> = ({
  simState, isMobile, activeWordId, badgeStates, isCollapsed,
  modelCopyActiveWordId, lastInteractionWasTouchRef,
  onTextInteraction, onBadgeInteraction, onClearInteraction,
  onDropdownClick, onClearClick, onRecordClick, onRecordingClick,
  onCancelClick, onRetryClick,
}) => {
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
    if (modelCopyActiveWordId === null || modelCopyActiveWordId === undefined) {
      return {
        text: isMobile ? 'Tap a badge to view confidence score' : 'Hover over a badge to view confidence score',
        hasHighlight: false,
      };
    }
    const word = getWordFromId(modelCopyActiveWordId);
    const percentage = getPercentageFromId(modelCopyActiveWordId);
    return { text: '', hasHighlight: true, percentage, word };
  };
  const modelCopyContent = getModelCopyContent();

  return (
    <div className={`transcript-interface ${styles.container}`}>
      <TranscriptBar isMobile={isMobile} isHighConfidenceState={isHighConfidenceState} navState={navState} />

      <div className={`transcript-mainframe ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="transcript-box">
          <TranscriptTextStates
            textState={textState}
            transcriptText={transcriptText}
            highlights={highlights}
            activeWordId={activeWordId}
            onWordInteraction={onTextInteraction}
          />
          <TranscriptBoxNav
            navState={navState}
            onDropdownClick={onDropdownClick}
            onClearClick={onClearClick}
            onRecordClick={onRecordClick}
            onRecordingClick={onRecordingClick}
            onCancelClick={onCancelClick}
            onRetryClick={onRetryClick}
          />
        </div>

        <div className={`transcript-data ${isCollapsed ? 'hidden' : ''}`}>
          <div className="mastercon-badge">
            {isHighConfidenceState ? (
              <HighConfidenceBadge />
            ) : (
              orderedBadges.map((badge, index) => (
                <div
                  key={`badge-${index}`}
                  className="confidence-badge-wrapper"
                  onMouseEnter={() => onBadgeInteraction(badge.wordId)}
                  onMouseLeave={onClearInteraction}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    lastInteractionWasTouchRef.current = true;
                    onBadgeInteraction(badge.wordId);
                  }}
                  onTouchEnd={(e) => e.preventDefault()}
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

          <div className={`model-copy ${styles.OpenSansRegular16It}`}>
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
        .transcript-interface {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 10px;
          gap: 10px;
          position: relative;
          width: 100%;
          max-width: 620px;
          height: auto;
          min-height: 400px;
        }
        .transcript-mainframe {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px 0px 16px;
          gap: 16px;
          width: 100%;
          max-width: 600px;
          height: auto;
          background: var(--MainBoxDrawerBg);
          border-radius: 16px;
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
          overflow: visible;
          transition: padding-bottom 0.9s cubic-bezier(0.4, 0, 0.2, 1), gap 0.9s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .transcript-mainframe.collapsed {
          padding-bottom: 0px;
          gap: 0px;
        }
        .transcript-box {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4px 0px 20px 0px;
          gap: 16px;
          width: 100%;
          max-width: 600px;
          height: auto;
          min-height: 216px;
          background: var(--MainBoxBg);
          border: 1px solid var(--MainBoxOutline);
          box-shadow: 0px 4px 12px var(--darkGrey09);
          border-radius: 16px;
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
          position: relative;
          z-index: 2;
          overflow: visible;
        }
        .transcript-data {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px 28px;
          gap: 10px;
          width: 100%;
          max-width: 600px;
          max-height: 200px;
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
          opacity: 1;
          transition: max-height 0.9s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1), padding 0.9s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 1;
          overflow: hidden;
        }
        .transcript-data.hidden {
          max-height: 0;
          opacity: 0;
          padding-top: 0px;
          padding-bottom: 0px;
        }
        .mastercon-badge {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          align-items: flex-start;
          padding: 0px;
          gap: 6px;
          width: 100%;
          height: auto;
          min-height: 20px;
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        .model-copy {
          display: block;
          width: 100%;
          max-width: 546px;
          color: var(--darkGrey40);
          flex: none;
          order: 1;
          flex-grow: 0;
          transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
          transform: translateY(0);
        }
        @media (max-width: 640px) {
          .transcript-interface { padding: 8px; }
          .transcript-data { padding: 0px 16px; }
          .transcript-data.hidden { padding: 0px 16px; }
          .model-copy { max-width: 100%; padding: 0px 4px; }
        }
        @media (max-width: 480px) {
          .transcript-box { padding: 4px 0px 20px 0px; }
          .model-copy { max-width: 100%; padding: 0px 2px; line-height: 1.5; }
        }
      `}</style>
    </div>
  );
};

// ─── Main Simulation Page ────────────────────────────────────
const AIConfidenceSimulation: React.FC = () => {
  const [simState, setSimState] = useState<SimState>('initial');
  const [activeWordId, setActiveWordId] = useState<number | null>(null);
  const [badgeStates, setBadgeStates] = useState<Map<number, boolean>>(new Map());
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [modelCopyActiveWordId, setModelCopyActiveWordId] = useState<number | null>(null);

  const modelCopyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionWasTouchRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (dropdownTimerRef.current) {
      clearTimeout(dropdownTimerRef.current);
      dropdownTimerRef.current = null;
    }
    if (simState === 'results') {
      dropdownTimerRef.current = setTimeout(() => {
        setIsCollapsed(false);
        dropdownTimerRef.current = null;
      }, 300);
    } else {
      setIsCollapsed(true);
    }
    return () => {
      if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    };
  }, [simState]);

  const clearInteraction = useCallback(() => {
    setActiveWordId(null);
    setBadgeStates(new Map());
  }, []);

  const handleTextInteraction = useCallback((wordId: number | null) => {
    if (activeWordId === wordId) {
      clearInteraction();
    } else {
      setActiveWordId(wordId);
      const newMap = new Map<number, boolean>();
      if (wordId !== null) newMap.set(wordId, true);
      setBadgeStates(newMap);
    }
  }, [activeWordId, clearInteraction]);

  const handleBadgeInteraction = useCallback((wordId: number | null) => {
    if (activeWordId === wordId) {
      clearInteraction();
    } else {
      setActiveWordId(wordId);
      const newMap = new Map<number, boolean>();
      if (wordId !== null) newMap.set(wordId, true);
      setBadgeStates(newMap);
    }
  }, [activeWordId, clearInteraction]);

  useEffect(() => {
    const handler = (e: TouchEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (!target.closest('.highlight-hover-area') && !target.closest('.confidence-badge-wrapper') && !target.closest('.confidence-badge')) {
        lastInteractionWasTouchRef.current = true;
        clearInteraction();
      }
    };
    document.addEventListener('touchstart', handler);
    return () => document.removeEventListener('touchstart', handler);
  }, [clearInteraction]);

  useEffect(() => {
    if (modelCopyResetTimerRef.current) {
      clearTimeout(modelCopyResetTimerRef.current);
      modelCopyResetTimerRef.current = null;
    }
    if (activeWordId !== null) {
      setModelCopyActiveWordId(activeWordId);
    } else if (lastInteractionWasTouchRef.current) {
      setModelCopyActiveWordId(null);
      lastInteractionWasTouchRef.current = false;
    } else {
      modelCopyResetTimerRef.current = setTimeout(() => setModelCopyActiveWordId(null), 1000);
    }
    return () => {
      if (modelCopyResetTimerRef.current) clearTimeout(modelCopyResetTimerRef.current);
    };
  }, [activeWordId]);

  const handleRecordClick = () => {
    setSimState('recording');
    clearInteraction();
    setTimeout(() => {
      setSimState('processing');
      setTimeout(() => setSimState('results'), PROCESSING_DURATION);
    }, RECORDING_DURATION);
  };

  const handleRecordingClick = () => {
    setSimState('processing');
    clearInteraction();
    setTimeout(() => setSimState('results'), PROCESSING_DURATION);
  };

  const handleCancelClick = () => { setSimState('initial'); clearInteraction(); };
  const handleClearClick = () => { setSimState('initial'); clearInteraction(); };
  const handleRetryClick = () => { setSimState('initial'); clearInteraction(); };

  const handleDropdownClick = () => {
    if (simState === 'results') {
      setIsCollapsed(!isCollapsed);
      if (!isCollapsed) clearInteraction();
    }
  };

  return (
    <div className="ai-tracker-container">
      <div className="content-wrapper">
        <StaticDeepReader />
        <SimulatedCard
          simState={simState}
          isMobile={isMobile}
          activeWordId={activeWordId}
          badgeStates={badgeStates}
          isCollapsed={isCollapsed}
          modelCopyActiveWordId={modelCopyActiveWordId}
          lastInteractionWasTouchRef={lastInteractionWasTouchRef}
          onTextInteraction={handleTextInteraction}
          onBadgeInteraction={handleBadgeInteraction}
          onClearInteraction={clearInteraction}
          onDropdownClick={handleDropdownClick}
          onClearClick={handleClearClick}
          onRecordClick={handleRecordClick}
          onRecordingClick={handleRecordingClick}
          onCancelClick={handleCancelClick}
          onRetryClick={handleRetryClick}
        />
      </div>
      <style jsx>{`
        .ai-tracker-container {
          background: #ffffff;
          min-height: 100vh;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 30px;
        }
        .content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
          max-width: 620px;
        }
        @media (max-width: 768px) {
          .ai-tracker-container { padding: 15px; gap: 20px; }
        }
      `}</style>
    </div>
  );
};

export default AIConfidenceSimulation;
