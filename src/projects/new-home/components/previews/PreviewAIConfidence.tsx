import React, { useState, useEffect } from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';
import { HighlightedText } from '@/projects/ai-confidence-tracker/components/ui/deepUIcomponents';

const PREVIEW_TEXT = 'The quick brown fox jumps over the lazy dog';
const PREVIEW_HIGHLIGHTS = [
  { wordId: 2, confidenceLevel: 'medium' as const, percentage: '75%' },
  { wordId: 5, confidenceLevel: 'low' as const, percentage: '95%' },
  { wordId: 6, confidenceLevel: 'low' as const, percentage: '95%' },
];
const ACTIVE_WORD_ID = 5;

type PreviewState = 'idle' | 'recording' | 'processing' | 'results';

const TIMINGS: Record<PreviewState, number> = {
  idle: 3000,
  recording: 2000,
  processing: 1500,
  results: 5000,
};

const NEXT: Record<PreviewState, PreviewState> = {
  idle: 'recording',
  recording: 'processing',
  processing: 'results',
  results: 'idle',
};

const PreviewAIConfidence: React.FC = () => {
  const [state, setState] = useState<PreviewState>('idle');
  const [displayState, setDisplayState] = useState<PreviewState>('idle');
  const [visible, setVisible] = useState(true);
  const [activeWord, setActiveWord] = useState<number | null>(null);
  const [dotCount, setDotCount] = useState(1);

  // Auto-loop: each state schedules its own transition
  useEffect(() => {
    const id = setTimeout(() => setState(s => NEXT[s]), TIMINGS[state]);
    return () => clearTimeout(id);
  }, [state]);

  // Cross-fade: fade out → swap content → fade in
  useEffect(() => {
    setVisible(false);
    const id = setTimeout(() => {
      setDisplayState(state);
      setVisible(true);
    }, 200);
    return () => clearTimeout(id);
  }, [state]);

  // Animated dots for recording/processing, matching TranscriptTextStates
  useEffect(() => {
    if (displayState === 'recording' || displayState === 'processing') {
      const id = setInterval(() => setDotCount(c => c >= 3 ? 1 : c + 1), 500);
      return () => clearInterval(id);
    }
    setDotCount(1);
    return undefined;
  }, [displayState]);

  // Delay the focus-highlight in results so underline draws first.
  // Sequence: text intro 600ms → underline sweeps 2.8s → highlight fires
  // at ~2.2s when underline is mostly visible.
  useEffect(() => {
    setActiveWord(null);
    if (displayState === 'results') {
      const id = setTimeout(() => setActiveWord(ACTIVE_WORD_ID), 2200);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [displayState]);

  return (
    <div className="preview-ai-confidence">
      <img
        src="/images/voice-interface/wt1.webp"
        alt=""
        className="bg-image"
        draggable={false}
      />

      <div className="transcript-box">
        <div className="transcript-content">
          <div className={`text-area ai-preview-text ${visible ? 'is-visible' : ''}`}>
            {displayState === 'idle' && (
              <p className={`state-text ${styles.OpenRundeMedium20}`}>
                Record something: AI flags every word it may have misheard.
              </p>
            )}
            {displayState === 'recording' && (
              <p className={`state-text ${styles.OpenRundeMedium20}`}>
                Recording in progress{'.'.repeat(dotCount)}
              </p>
            )}
            {displayState === 'processing' && (
              <p className={`state-text ${styles.OpenRundeMedium20}`}>
                Checking confidence{'.'.repeat(dotCount)}
              </p>
            )}
            {displayState === 'results' && (
              <HighlightedText
                text={PREVIEW_TEXT}
                highlights={PREVIEW_HIGHLIGHTS}
                activeWordId={activeWord}
              />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .preview-ai-confidence {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .bg-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: rotate(-90deg) scale(1.9);
          transform-origin: center center;
          pointer-events: none;
        }

        .transcript-box {
          position: absolute;
          right: -186px;
          bottom: -76px;
          width: 687px;
          height: 272px;
          border-radius: 20px;
          border: 1.3px solid #f2f2f2;
          background: #fafafa;
          box-shadow: 0 5px 15px 0 rgba(0, 0, 0, 0.06);
          padding: 26px 19px;
          display: flex;
          flex-direction: column;
          pointer-events: none;
          box-sizing: border-box;
          transform-origin: right bottom;
        }

        .transcript-content {
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
        }

        .text-area {
          position: relative;
          width: 100%;
          height: 100%;
          padding: 28px 27px 12px 27px;
          flex: 1;
          overflow: hidden;
          opacity: 0;
          transition: opacity 200ms ease;
        }

        .text-area.is-visible {
          opacity: 1;
        }

        .state-text {
          margin: 0;
          padding: 0;
          color: var(--darkGrey40);
          letter-spacing: -0.01em;
        }

        .ai-preview-text :global(.highlighted-text-container) {
          width: 100%;
          min-height: 0;
        }

        .ai-preview-text :global(.text-content) {
          min-height: 0;
        }

        .ai-preview-text :global(.highlight-line) {
          height: 1.8px;
        }

        .ai-preview-text :global(.confidence-tooltip-container) {
          z-index: 5;
        }

        @media (max-width: 620px) {
          .transcript-box {
            width: 93.68%;
            height: 92.2%;
            right: -6.87%;
            bottom: -25.89%;
            padding: 25.551px 19.163px;
            border-radius: 20.441px;
          }

          .transcript-content {
            gap: 12.775px;
          }

          .text-area {
            padding: 28px 23px 12px 23px;
          }
        }
      `}</style>
    </div>
  );
};

export default PreviewAIConfidence;
