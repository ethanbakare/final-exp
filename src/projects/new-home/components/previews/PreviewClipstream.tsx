import React from 'react';
import clipStyles from '@/projects/clipperstream/styles/clipper.module.css';
import { CloseButton } from '@/projects/clipperstream/components/ui/clipbuttons';

// Static waveform bar heights matching Figma pattern
// Ghost bars (inactive, low opacity) followed by active bars (brighter, varied heights)
const BARS: Array<{ h: number; active: boolean }> = [
  // Ghost bars (inactive region)
  ...Array(18).fill(null).map(() => ({ h: 0.5, active: false })),
  // Active bars (recording region with varied heights)
  { h: 0.5, active: true }, { h: 0.5, active: true }, { h: 0.5, active: true },
  { h: 0.7, active: true }, { h: 0.7, active: true }, { h: 0.7, active: true },
  { h: 1.0, active: true }, { h: 1.0, active: true }, { h: 0.7, active: true },
  { h: 1.0, active: true }, { h: 0.5, active: true }, { h: 0.75, active: true },
  { h: 0.75, active: true }, { h: 0.75, active: true }, { h: 1.0, active: true },
  { h: 1.0, active: true }, { h: 0.5, active: true }, { h: 0.75, active: true },
  { h: 1.0, active: true }, { h: 1.0, active: true }, { h: 0.5, active: true },
  { h: 0.75, active: true }, { h: 0.75, active: true },
];

const PreviewClipstream: React.FC = () => {
  return (
    <div className="preview-clipstream">
      <div className={`recording-card ${clipStyles.container}`}>
        <div className="record-bar">
          {/* Close button — from Clipstream */}
          <CloseButton />

          {/* Waveform container */}
          <div className="waveform-container">
            <div className="waveform-bars">
              {BARS.map((bar, i) => (
                <div
                  key={i}
                  className="bar"
                  style={{
                    height: `${bar.h * 14.4}px`,
                    opacity: bar.active ? 0.3 : 0.1,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Timer + Stop */}
          <div className="timer-stop-group">
            <div className="timer">
              <span className={clipStyles.JetBrainsMonoMedium16}>0:26</span>
            </div>
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
          gap: 24px;
          border-radius: 28px;
          background: #2C2929;
          box-sizing: border-box;
          pointer-events: none;
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

        .waveform-container {
          display: flex;
          padding: 0 10.8px;
          justify-content: center;
          align-items: center;
          gap: 7.2px;
          flex: 1;
          border-radius: 7.2px;
          overflow: hidden;
        }

        .waveform-bars {
          display: flex;
          padding: 7.2px 10.8px;
          justify-content: center;
          align-items: center;
          gap: 5.4px;
          flex: 1;
          height: 28.8px;
        }

        .bar {
          width: 1.8px;
          min-width: 1.8px;
          border-radius: 2px;
          background: white;
          flex-shrink: 0;
        }

        .timer-stop-group {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-shrink: 0;
        }

        .timer {
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
        }

        .btn-stop {
          width: 34px;
          height: 34px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 21.474px;
          background: white;
          flex-shrink: 0;
        }

        .stop-dot {
          width: 8.947px;
          height: 8.947px;
          border-radius: 50%;
          background: #EF4444;
        }
      `}</style>
    </div>
  );
};

export default PreviewClipstream;
