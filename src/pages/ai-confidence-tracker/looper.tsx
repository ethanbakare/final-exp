import React, { useState, useEffect, useRef } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';
import { TranscriptBoxNav, NavState } from '@/projects/ai-confidence-tracker/components/ui/transcript-box-nav';
import { TranscriptTextStates, TextState } from '@/projects/ai-confidence-tracker/components/ui/transcript-text-states';
import { LowConfidenceBadge, MediumConfidenceBadge, HighConfidenceBadge } from '@/projects/ai-confidence-tracker/components/ui/deepButtons';
import PreviewAIConfidence from '@/projects/new-home/components/previews/PreviewAIConfidence';

/**
 * AI Confidence Tracker — auto-loop lab page.
 *
 * Mirrors simulation.tsx (same SimulatedCard structure) but replaces
 * all manual button handlers with a single auto-driver useEffect that
 * sequences initial -> recording -> processing -> results -> initial.
 *
 * Purpose: iterate on the looped animation in isolation before wiring
 * it into PreviewAIConfidence. The full card renders uncropped here so
 * every phase is visible while tuning durations.
 */

// ─── Mock Data ───────────────────────────────────────────────
const PROMPT_SENTENCE = 'Worcestershire wardens whisper weird wishes.';
const MOCK_TRANSCRIPT = "Warchester's warden's whisper weird wishes";

const MOCK_WORDS = [
  { word: "Warchester's", confidence: 0.30, category: 'low' as const },
  { word: "warden's",     confidence: 0.75, category: 'medium' as const },
  { word: 'whisper',      confidence: 0.98, category: 'high' as const },
  { word: 'weird',        confidence: 0.95, category: 'high' as const },
  { word: 'wishes',       confidence: 0.97, category: 'high' as const },
];

const MOCK_HIGHLIGHTS = MOCK_WORDS
  .map((w, i) => ({ wordId: i, confidenceLevel: w.category, percentage: `${Math.round(w.confidence * 100)}%` }))
  .filter(h => h.confidenceLevel !== 'high');

// ─── Loop timings (tune here) ────────────────────────────────
// Absolute durations for each phase. Total cycle ≈ sum of these.
const TIMINGS = {
  initial: 1200,    // placeholder / reset breath before recording
  recording: 2000,  // waveform + rec UI
  processing: 1000, // spinner / "analysing"
  results: 4500,    // highlights animate in, linger, then loop
} as const;

// ─── Types ───────────────────────────────────────────────────
type SimState = 'initial' | 'recording' | 'processing' | 'results';

// ─── Simulated Card ──────────────────────────────────────────
interface SimCardProps {
  simState: SimState;
  isMobile: boolean;
  activeWordId: number | null;
  badgeStates: Map<number, boolean>;
  isCollapsed: boolean;
  modelCopyActiveWordId: number | null;
  lastInteractionWasTouchRef: React.MutableRefObject<boolean>;
}

const SimulatedCard: React.FC<SimCardProps> = ({
  simState, isMobile, activeWordId, badgeStates, isCollapsed,
  modelCopyActiveWordId,
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

  // Auto-loop mode: onClick handlers are undefined so clicks are no-ops.
  // The parent's auto-driver is the sole state source.
  const noop = undefined;

  return (
    <div className={`transcript-interface ${styles.container}`}>
      <div className={`transcript-mainframe ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="transcript-box">
          <TranscriptTextStates
            textState={textState}
            transcriptText={transcriptText}
            highlights={highlights}
            activeWordId={activeWordId}
            onWordInteraction={noop}
          />
          <TranscriptBoxNav
            navState={navState}
            onDropdownClick={noop}
            onClearClick={noop}
            onRecordClick={noop}
            onRecordingClick={noop}
            onCancelClick={noop}
            onRetryClick={noop}
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
                  style={{ cursor: 'default' }}
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

// ─── Homepage preview wrapper ────────────────────────────────
// Renders the exact PreviewAIConfidence from the homepage inside a
// 393×160 card that matches the homepage's card-ai-confidence footprint.
// The crop (right:-186px / bottom:-76px on the transcript-box) is
// preserved, so what you see here is byte-for-byte what the homepage
// shows. A key prop lets us remount the component to retrigger its
// mount-only animation, and an optional auto-loop interval fires it
// on a cadence for hands-off observation.
const HomepagePreviewCard: React.FC<{ replayKey: number }> = ({ replayKey }) => (
  <div className="homepage-card">
    <PreviewAIConfidence key={replayKey} />
    <style jsx>{`
      .homepage-card {
        position: relative;
        width: 574px;
        height: 321px;
        border-radius: 10px;
        overflow: hidden;
        background: #fff;
        border: 1px solid rgba(0, 0, 0, 0.08);
      }
    `}</style>
  </div>
);

// ─── Auto-loop driver ────────────────────────────────────────
const AIConfidenceLooper: React.FC = () => {
  const [simState, setSimState] = useState<SimState>('initial');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Replay key for the homepage PreviewAIConfidence. Bumping it
  // unmounts + remounts the component, which is the simplest way to
  // retrigger a mount-only CSS animation without touching its source.
  const [replayKey, setReplayKey] = useState(0);
  const [autoReplay, setAutoReplay] = useState(false);
  const replayPeriodMs = 5000;

  const lastInteractionWasTouchRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Collapse mirrors simulation.tsx: expand 300ms after hitting results,
  // collapse immediately on every other state.
  useEffect(() => {
    if (simState === 'results') {
      const id = setTimeout(() => setIsCollapsed(false), 300);
      return () => clearTimeout(id);
    }
    setIsCollapsed(true);
    return undefined;
  }, [simState]);

  // Single-source auto-driver. Every state schedules its own timeout to
  // advance to the next. Cleanup guards strict-mode double-mount + state
  // changes while a timer is still in flight.
  useEffect(() => {
    const next: Record<SimState, SimState> = {
      initial: 'recording',
      recording: 'processing',
      processing: 'results',
      results: 'initial',
    };
    const id = setTimeout(() => setSimState(next[simState]), TIMINGS[simState]);
    return () => clearTimeout(id);
  }, [simState]);

  // Optional auto-replay on a fixed interval.
  useEffect(() => {
    if (!autoReplay) return undefined;
    const id = setInterval(() => setReplayKey(k => k + 1), replayPeriodMs);
    return () => clearInterval(id);
  }, [autoReplay]);

  return (
    <div className="ai-tracker-container">
      <div className="content-wrapper">
        <section className="block">
          <div className="block-header">
            <div className="block-title">Homepage animation (PreviewAIConfidence)</div>
            <div className="block-controls">
              <button className="ctl" onClick={() => setReplayKey(k => k + 1)}>
                Replay
              </button>
              <label className="ctl-label">
                <input
                  type="checkbox"
                  checked={autoReplay}
                  onChange={e => setAutoReplay(e.target.checked)}
                />
                auto every {replayPeriodMs / 1000}s
              </label>
            </div>
          </div>
          <HomepagePreviewCard replayKey={replayKey} />
        </section>

        <section className="block">
          <div className="block-header">
            <div className="block-title">Full looper (auto)</div>
            <div className="phase-readout">
              phase: <strong>{simState}</strong>
              {' · '}
              {TIMINGS[simState]}ms
            </div>
          </div>
          <SimulatedCard
            simState={simState}
            isMobile={isMobile}
            activeWordId={null}
            badgeStates={new Map()}
            isCollapsed={isCollapsed}
            modelCopyActiveWordId={null}
            lastInteractionWasTouchRef={lastInteractionWasTouchRef}
          />
        </section>
      </div>
      <style jsx>{`
        .ai-tracker-container {
          background: #ffffff;
          min-height: 100vh;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
        }
        .content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 48px;
          width: 100%;
          max-width: 640px;
        }
        .block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .block-header {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 12px;
        }
        .block-title {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: rgba(0, 0, 0, 0.6);
          text-transform: uppercase;
        }
        .block-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ctl {
          font: inherit;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid rgba(0, 0, 0, 0.15);
          background: #fff;
          color: rgba(0, 0, 0, 0.75);
          cursor: pointer;
        }
        .ctl:hover { background: rgba(0, 0, 0, 0.04); }
        .ctl-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(0, 0, 0, 0.6);
          cursor: pointer;
        }
        .phase-readout {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 11px;
          letter-spacing: 0.02em;
          color: rgba(0, 0, 0, 0.45);
          text-transform: uppercase;
        }
        @media (max-width: 768px) {
          .ai-tracker-container { padding: 20px 12px; gap: 20px; }
          .content-wrapper { gap: 32px; }
        }
      `}</style>
    </div>
  );
};

export default AIConfidenceLooper;
