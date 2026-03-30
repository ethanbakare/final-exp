import React from 'react';
import clipStyles from '@/projects/clipperstream/styles/clipper.module.css';
import { CloseButton } from '@/projects/clipperstream/components/ui/clipbuttons';

// Bar heights from Figma vectors (in px): 7.2 = short, 10.8 = medium, 14.4 = tall
// Opacity: first 18 bars are ghost (0.10), rest are active (0.30)
// ~31 bars visible in the 223px waveform container
const BARS: Array<{ h: number; active: boolean }> = [
  // Ghost bars — all short (7.2px)
  { h: 7.2, active: false }, { h: 7.2, active: false }, { h: 7.2, active: false },
  { h: 7.2, active: false }, { h: 7.2, active: false }, { h: 7.2, active: false },
  { h: 7.2, active: false }, { h: 7.2, active: false }, { h: 7.2, active: false },
  { h: 7.2, active: false }, { h: 7.2, active: false }, { h: 7.2, active: false },
  { h: 7.2, active: false }, { h: 7.2, active: false }, { h: 7.2, active: false },
  { h: 7.2, active: false }, { h: 7.2, active: false }, { h: 7.2, active: false },
  // Active bars — varied heights
  { h: 7.2, active: true },  { h: 7.2, active: true },  { h: 7.2, active: true },
  { h: 10.8, active: true }, { h: 10.8, active: true }, { h: 14.4, active: true },
  { h: 14.4, active: true }, { h: 10.8, active: true }, { h: 7.2, active: true },
  { h: 10.8, active: true }, { h: 10.8, active: true }, { h: 10.8, active: true },
  { h: 7.2, active: true },
];

const PreviewClipstream: React.FC = () => {
  return (
    <div className="preview-clipstream">
      <div className={`recording-card ${clipStyles.container}`}>
        <div className="record-bar">
          {/* Close button — from Clipstream */}
          <CloseButton />

          {/* Waveform container — matches Figma WaveClipper */}
          <div className="waveform-container">
            <div className="waveform-bars">
              {BARS.map((bar, i) => (
                <div
                  key={i}
                  className="bar"
                  style={{
                    height: `${bar.h}px`,
                    opacity: bar.active ? 0.3 : 0.1,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Timer + Stop button */}
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
          height: 42px;
          box-sizing: border-box;
        }

        .waveform-container {
          display: flex;
          padding: 0 10.8px;
          justify-content: center;
          align-items: center;
          flex: 1;
          height: 28.8px;
          overflow: hidden;
        }

        .waveform-bars {
          display: flex;
          align-items: center;
          gap: 5.4px;
          height: 100%;
        }

        .bar {
          width: 1.8px;
          min-width: 1.8px;
          border-radius: 1px;
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
          width: 39px;
          height: 23px;
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
