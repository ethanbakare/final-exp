import React from 'react';
import { HighlightedText } from '@/projects/ai-confidence-tracker/components/ui/deepUIcomponents';

const PREVIEW_TEXT = 'The quick brown fox jumps over the lazy dog';
const PREVIEW_HIGHLIGHTS = [
  { wordId: 2, confidenceLevel: 'medium' as const, percentage: '75%' },
  { wordId: 5, confidenceLevel: 'low' as const, percentage: '95%' },
  { wordId: 6, confidenceLevel: 'low' as const, percentage: '95%' },
];
const ACTIVE_WORD_ID = 5;

const PreviewAIConfidence: React.FC = () => {
  return (
    <div className="preview-ai-confidence">
      {/* Background watercolor image */}
      <img
        src="/images/voice-interface/wt1.webp"
        alt=""
        className="bg-image"
        draggable={false}
      />

      {/* Transcript UI overlay — cropped at right edge */}
      <div className="transcript-box">
        <div className="transcript-content">
          <div className="text-area ai-preview-text">
            <HighlightedText
              text={PREVIEW_TEXT}
              highlights={PREVIEW_HIGHLIGHTS}
              activeWordId={ACTIVE_WORD_ID}
            />
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
          border: 1.3px solid #F2F2F2;
          background: #FAFAFA;
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
