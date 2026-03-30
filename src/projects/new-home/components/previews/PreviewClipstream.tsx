import React from 'react';

const PreviewClipstream: React.FC = () => {
  // Static waveform bar heights matching the Figma pattern
  // First ~18 bars are short (ghost/inactive), then bars get taller in the middle, then taper off
  const bars = [
    0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
    0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
    0.5, 0.5, 0.5, 0.7, 0.7, 0.7, 1.0, 1.0, 0.7,
    1.0, 0.5, 0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.5,
    0.7, 1.0, 1.0, 0.5, 0.7,
  ];

  return (
    <div className="preview-clipstream">
      <div className="recording-card">
        <div className="record-bar">
          {/* Close button */}
          <div className="btn-close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M9 3L3 9M3 3L9 9" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Waveform */}
          <div className="waveform">
            {bars.map((h, i) => (
              <div
                key={i}
                className="bar"
                style={{
                  height: `${h * 14}px`,
                  opacity: i < 18 ? 0.15 : 0.35,
                }}
              />
            ))}
          </div>

          {/* Timer + Stop */}
          <div className="timer-stop">
            <span className="timer">0:26</span>
            <div className="btn-stop">
              <div className="stop-dot" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .preview-clipstream {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .recording-card {
          width: 393px;
          height: 160px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          border-radius: 28px;
          background: #2C2929;
          box-sizing: border-box;
        }

        .record-bar {
          display: flex;
          padding: 4px;
          justify-content: space-between;
          align-items: center;
          align-self: stretch;
          border-radius: 28.8px;
          background: rgba(255, 255, 255, 0.10);
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
        }

        .btn-close {
          width: 34px;
          height: 34px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .waveform {
          display: flex;
          align-items: center;
          gap: 3.6px;
          flex: 1;
          padding: 0 8px;
          height: 28px;
          overflow: hidden;
        }

        .bar {
          width: 1.8px;
          min-width: 1.8px;
          border-radius: 2px;
          background: white;
          flex-shrink: 0;
        }

        .timer-stop {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-shrink: 0;
        }

        .timer {
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          font-weight: 500;
          color: white;
          line-height: 143.75%;
        }

        .btn-stop {
          width: 34px;
          height: 34px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          background: white;
          flex-shrink: 0;
        }

        .stop-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #EF4444;
        }
      `}</style>
    </div>
  );
};

export default PreviewClipstream;
