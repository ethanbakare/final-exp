import React from 'react';
import styles from '@/projects/ai-confidence-tracker/styles/ai-tracker.module.css';

interface TranscriptBarProps {
  isMobile: boolean;
  isHighConfidenceState: boolean;
  navState?: 'initial' | 'recording' | 'processing' | 'results' | 'error';
}

export const TranscriptBar: React.FC<TranscriptBarProps> = ({
  isMobile,
  isHighConfidenceState,
  navState = 'results'
}) => {
  // Legend should only be visible in results state and when there are highlights
  const shouldShowLegend = navState === 'results' && !isHighConfidenceState;

  return (
    <>
      <div className="transcript-bar">
        <div className="transcript-microcopy">
          <span className={styles.OpenRundeRegular12}>
            {isMobile ? "Text transcribed by AI" : "Text transcribed by AI model"}
          </span>
        </div>
        <div className="legend">
          <div className="legend-key">
            <span className={styles.OpenRundeMedium12}>Confidence level</span>
          </div>
          <div className="legend-holder">
            <div className="mid">
              <div className="MidDot"></div>
              <span className={styles.OpenRundeMedium12}>Medium</span>
            </div>
            <div className="low">
              <div className="LowDot"></div>
              <span className={styles.OpenRundeMedium12}>Low</span>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .transcript-bar {
          display: flex;
          flex-direction: row;
          gap: 8px;
          height: auto;
          align-items: flex-end;
          justify-content: space-between;
          width: 100%;
          max-width: 600px;
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .transcript-microcopy {
          align-self: flex-end;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          width: auto;
          height: 16px;
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .transcript-microcopy span {
          width: auto;
          max-width: 147px;
          height: 16px;
          text-align: center;
          color: rgba(94, 94, 94, 0.4);
          opacity: 0.82;
          flex: none;
          order: 0;
          flex-grow: 0;
          white-space: nowrap;
        }
        
        .legend {
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          align-items: flex-start;
          padding: 0px;
          gap: 16px;
          width: auto;
          height: 17px;
          opacity: ${shouldShowLegend ? '0.8' : '0'};
          flex: none;
          order: 1;
          flex-grow: 0;
          margin-left: auto;
          transition: opacity 0.4s ease-in-out;
          pointer-events: ${shouldShowLegend ? 'auto' : 'none'};
        }
        
        .legend-key {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          gap: 10px;
          width: auto;
          height: 17px;
          background: var(--darkGrey05);
          border-radius: 16px;
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .legend-key span {
          width: auto;
          height: 17px;
          text-align: center;
          letter-spacing: -0.01em;
          color: var(--darkGrey60);
          opacity: 0.82;
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .legend-holder {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 0px;
          width: auto;
          height: 17px;
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .mid, .low {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          gap: 4px;
          width: auto;
          height: 17px;
          flex: none;
          flex-grow: 0;
        }
        
        .mid {
          order: 0;
        }
        
        .low {
          order: 1;
        }
        
        .MidDot, .LowDot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .MidDot {
          background: var(--MediumCon);
        }
        
        .LowDot {
          background: var(--LowCon);
        }
        
        .mid span, .low span {
          width: auto;
          height: 16px;
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .mid span {
          max-width: 100px;
          color: var(--MediumLegendText);
        }
        
        .low span {
          max-width: 83px;
          color: var(--LowLegendText);
        }
        
        @media (max-width: 640px) {
          .transcript-bar {
            flex-direction: row;
            gap: 8px;
            height: auto;
            align-items: flex-start;
          }
          
          .legend {
            flex-direction: column;
            align-items: flex-end;
            width: auto;
            height: auto;
            gap: 8px;
            margin-left: auto;
          }
          
          .legend-key {
            width: auto;
            justify-content: flex-start;
          }
          
          .legend-holder {
            width: auto;
            justify-content: flex-start;
          }
        }
        
        @media (max-width: 480px) {
          .legend {
            height: auto;
            gap: 4px;
          }
        }
      `}</style>
    </>
  );
};

export default TranscriptBar; 