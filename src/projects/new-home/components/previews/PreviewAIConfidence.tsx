import React from 'react';

const PreviewAIConfidence: React.FC = () => {
  return (
    <div className="preview-ai-confidence">
      {/* Background watercolor image */}
      <img
        src="/images/voice-interface/wt1.jpg"
        alt=""
        className="bg-image"
        draggable={false}
      />

      {/* Transcript UI overlay — cropped at right edge */}
      <div className="transcript-box">
        <div className="transcript-content">
          <div className="text-area">
            {/* Confidence badge */}
            <div className="badge">
              <span className="badge-dot" />
              <span className="badge-text">95%</span>
            </div>
            <span className="word">The </span>
            <span className="word">quick </span>
            <span className="word word-medium">brown<span className="underline underline-medium" /></span>{' '}
            <span className="word">fox </span>
            <span className="word">jumps </span>
            <span className="word word-low">over<span className="underline underline-low" /></span>{' '}
            <span className="word word-low highlight">the<span className="underline underline-low" /><span className="focus-bg" /></span>{' '}
            <span className="word">lazy </span>
            <span className="word">dog</span>
          </div>
          <div className="nav-bar">
            <div className="nav-btn nav-btn-left">
              <svg width="14" height="8" viewBox="0 0 14 8" fill="none"><path d="M1 1L7 7L13 1" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="nav-btn nav-btn-right">
              <svg width="20" height="23" viewBox="0 0 20 23" fill="none"><circle cx="10" cy="11.5" r="9" stroke="#FB7232" strokeWidth="2"/><rect x="8" y="6" width="4" height="8" rx="2" fill="#FB7232"/></svg>
            </div>
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
          inset: -20px;
          width: calc(100% + 40px);
          height: calc(100% + 40px);
          object-fit: cover;
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
        }

        .transcript-content {
          display: flex;
          flex-direction: column;
          gap: 13px;
          flex: 1;
        }

        .text-area {
          position: relative;
          font-family: 'Open Runde', 'Inter', sans-serif;
          font-size: 18px;
          font-weight: 500;
          line-height: 143.75%;
          letter-spacing: -0.18px;
          color: #5E5E5E;
          padding: 15px;
          flex: 1;
        }

        .word {
          position: relative;
          display: inline;
        }

        .word-medium,
        .word-low {
          position: relative;
        }

        .underline {
          position: absolute;
          bottom: 2px;
          left: 0;
          right: 0;
          height: 1.3px;
          border-radius: 4px;
        }

        .underline-medium {
          background: #F59E0B;
        }

        .underline-low {
          background: #EF4444;
        }

        .highlight {
          position: relative;
        }

        .focus-bg {
          position: absolute;
          left: -2px;
          right: -2px;
          top: 1px;
          bottom: 0;
          background: #FEE2E2;
          border-radius: 4px 4px 0 0;
          mix-blend-mode: multiply;
          z-index: -1;
        }

        .badge {
          position: absolute;
          top: -8px;
          left: 281px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 10px 0 5px;
          height: 18px;
          border-radius: 20px;
          background: #EF4444;
        }

        .badge-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
        }

        .badge-text {
          font-family: 'Open Runde', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #FCFCFC;
          line-height: 18px;
        }

        .nav-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 15px;
        }

        .nav-btn {
          width: 41px;
          height: 41px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .nav-btn-left {
          background: rgba(30, 41, 59, 0.10);
        }

        .nav-btn-right {
          background: rgba(251, 114, 50, 0.10);
        }
      `}</style>
    </div>
  );
};

export default PreviewAIConfidence;
