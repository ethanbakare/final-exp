import React, { useState } from 'react';
import { MorphingRecordToPillWave } from '@/projects/voiceinterface/components/ui/VoiceMorphingButtons';

/**
 * Voice Interface Morphing Buttons Showcase
 *
 * Demonstrates the morphing button animation pattern based on ClipStream's
 * MorphingTimerProcessingToStructure component.
 */

const VoiceMorphingButtonsShowcase: React.FC = () => {
  const [recordState, setRecordState] = useState<'idle' | 'recording'>('idle');

  const handleToggleRecord = () => {
    setRecordState(prev => prev === 'idle' ? 'recording' : 'idle');
  };

  return (
    <>
      <div className="showcase-page">
        <div className="showcase-header">
          <h1>Voice Interface Morphing Buttons</h1>
          <p className="subtitle">
            ClipStream-style morphing animations for smooth button state transitions
          </p>
        </div>

        <div className="section">
          <h2 className="section-title">Morphing Record → Pill Wave</h2>
          <p className="description">
            Click to see a container (38px → 114px) that naturally expands as its contents morph.
            RecordButton fades out first (0.1s), then container expands (0.2s), and Timer + RecordingWaveButton
            fade in (0.15s with 0.05s delay). Mimics timer-done-container pattern from ClipStream&apos;s recordnavbar.tsx.
          </p>
          <p className="description" style={{ marginTop: '0.5rem' }}>
            <strong>Animation sequence:</strong>
          </p>
          <ul className="bullet-list">
            <li>RecordButton fades out (0.1s)</li>
            <li>Container expands from right-aligned position (0.2s)</li>
            <li>Timer + RecordingWaveButton fade in together (0.15s, delayed 0.05s)</li>
            <li>Total duration: 0.2s</li>
          </ul>

          <div className="component-demo" onClick={handleToggleRecord}>
            <div className="demo-container">
              <MorphingRecordToPillWave
                state={recordState}
                onRecordClick={handleToggleRecord}
                onStopRecordingClick={handleToggleRecord}
              />
            </div>
            <p className="click-hint">Click anywhere to toggle</p>
          </div>

          <div className="technical-details">
            <h3>Technical Implementation</h3>
            <div className="code-block">
              <pre>{`// Container with right-aligned contents
.record-pill-container {
  display: flex;
  justify-content: flex-end;  // Right-align for natural expansion
  width: 38px;  // Idle state
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.state-recording {
  width: 114px;  // Recording state (timer + button + gap)
}

// RecordButton fades out quickly
.record-button-wrapper {
  opacity: 1;
  transition: opacity 0.1s ease;
}

// Pill Wave fades in with delay
.pill-wave-wrapper {
  opacity: 0;
  transition: opacity 0.15s ease 0.05s;
}`}</pre>
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Key Principles (ClipStream Pattern)</h2>
          <div className="principles-grid">
            <div className="principle-card">
              <h3>1. Fixed Outer Container</h3>
              <p>Prevents layout shifts in the navbar during transitions</p>
            </div>
            <div className="principle-card">
              <h3>2. Right-Aligned Contents</h3>
              <p>justify-content: flex-end makes timer glide left naturally as space opens</p>
            </div>
            <div className="principle-card">
              <h3>3. Staggered Timing</h3>
              <p>Button fades first (0.1s), then content fades in (0.15s @ 0.05s delay)</p>
            </div>
            <div className="principle-card">
              <h3>4. Smooth Easing</h3>
              <p>cubic-bezier(0.4, 0, 0.2, 1) for natural, professional feel</p>
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Comparison: Instant vs Morphing</h2>
          <div className="comparison-grid">
            <div className="comparison-card">
              <h3>Phase 0 (Instant Swap)</h3>
              <p className="comparison-desc">
                ❌ Jarring layout shift<br />
                ❌ Button suddenly appears/disappears<br />
                ❌ No visual continuity
              </p>
            </div>
            <div className="comparison-card highlight">
              <h3>Phase 1 (Morphing)</h3>
              <p className="comparison-desc">
                ✅ Smooth container expansion<br />
                ✅ Graceful fade transitions<br />
                ✅ Professional, polished feel
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .showcase-page {
          min-height: 100vh;
          padding: 3rem 2rem;
          background: #1a1a1a;
          color: #ffffff;
        }

        .showcase-header {
          max-width: 1200px;
          margin: 0 auto 3rem;
          text-align: center;
        }

        .showcase-header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.6);
          max-width: 600px;
          margin: 0 auto;
        }

        .section {
          max-width: 1200px;
          margin: 0 auto 4rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section-title {
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #ffffff;
        }

        .description {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          font-size: 1rem;
        }

        .bullet-list {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.8;
          padding-left: 1.5rem;
          margin: 1rem 0;
        }

        .bullet-list li {
          margin-bottom: 0.5rem;
        }

        .component-demo {
          margin: 2rem 0;
          padding: 3rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          cursor: pointer;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: border-color 0.2s ease;
        }

        .component-demo:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .demo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80px;
        }

        .click-hint {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.875rem;
          font-style: italic;
        }

        .technical-details {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .technical-details h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: #ffffff;
        }

        .code-block {
          background: rgba(0, 0, 0, 0.5);
          border-radius: 8px;
          padding: 1.5rem;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .code-block pre {
          margin: 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          color: #e0e0e0;
        }

        .principles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .principle-card {
          background: rgba(0, 0, 0, 0.3);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .principle-card h3 {
          font-size: 1.125rem;
          margin-bottom: 0.75rem;
          color: #ffffff;
        }

        .principle-card p {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.5;
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .comparison-card {
          background: rgba(0, 0, 0, 0.3);
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .comparison-card.highlight {
          border-color: rgba(102, 126, 234, 0.5);
          background: rgba(102, 126, 234, 0.1);
        }

        .comparison-card h3 {
          font-size: 1.125rem;
          margin-bottom: 0.75rem;
          color: #ffffff;
        }

        .comparison-desc {
          font-size: 0.9375rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.8;
        }

        @media (max-width: 768px) {
          .showcase-header h1 {
            font-size: 2rem;
          }

          .section {
            padding: 1.5rem;
          }

          .component-demo {
            padding: 2rem 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default VoiceMorphingButtonsShowcase;
