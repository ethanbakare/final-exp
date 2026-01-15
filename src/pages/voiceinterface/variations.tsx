import React from 'react';
import { VoiceTextBoxStandard } from '@/projects/voiceinterface/components/VoiceTextBoxStandard';

/**
 * Voice Interface Variations Test Page
 *
 * Phase 0: Testing Variation 1 (TextBox Standard)
 *
 * This page will eventually show all 3 variations side-by-side.
 * For now, we're testing the walking skeleton with Variation 1 only.
 */

export default function VoiceInterfaceVariations() {
  return (
    <>
      <div className="variations-page">
        <div className="header">
          <h1>Voice Interface Variations</h1>
          <p className="subtitle">Phase 0: Walking Skeleton Test</p>
        </div>

        <div className="variations-container">
          {/* Variation 1: TextBox Standard */}
          <div className="variation-section">
            <h2>Variation 1: TextBox Standard</h2>
            <p className="description">
              Press-to-record → transcribe → display result
            </p>
            <div className="variation-demo">
              <VoiceTextBoxStandard />
            </div>
          </div>

          {/* Variation 2: Coming in Phase 3 */}
          <div className="variation-section coming-soon">
            <h2>Variation 2: Check & Close</h2>
            <p className="description">Coming in Phase 3</p>
          </div>

          {/* Variation 3: Coming in Phase 3 */}
          <div className="variation-section coming-soon">
            <h2>Variation 3: Live Streaming</h2>
            <p className="description">Coming in Phase 3</p>
          </div>
        </div>

        <div className="instructions">
          <h3>Test Instructions:</h3>
          <ol>
            <li>Click the mic button to start recording</li>
            <li>Button morphs to RecordWave + Timer + Close button</li>
            <li>Click RecordWave (or Close to cancel) to stop recording</li>
            <li>Processing button shows (calls mock API automatically)</li>
            <li>Mock transcription appears with Clear button</li>
            <li>Click "Clear" to reset to idle</li>
          </ol>
        </div>
      </div>

      <style jsx>{`
        .variations-page {
          min-height: 100vh;
          padding: 40px 20px;
          background: #fafafa;
          font-family: 'Open Runde', 'Inter', sans-serif;
        }

        .header {
          max-width: 1200px;
          margin: 0 auto 40px;
          text-align: center;
        }

        .header h1 {
          font-size: 32px;
          font-weight: 600;
          color: #262424;
          margin-bottom: 8px;
        }

        .subtitle {
          font-size: 16px;
          color: rgba(38, 36, 36, 0.6);
          font-weight: 500;
        }

        .variations-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 40px;
          margin-bottom: 60px;
        }

        .variation-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .variation-section h2 {
          font-size: 20px;
          font-weight: 600;
          color: #262424;
          margin-bottom: 8px;
        }

        .description {
          font-size: 14px;
          color: rgba(38, 36, 36, 0.6);
          margin-bottom: 20px;
          text-align: center;
        }

        .variation-demo {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .coming-soon {
          opacity: 0.4;
        }

        .instructions {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.08);
        }

        .instructions h3 {
          font-size: 18px;
          font-weight: 600;
          color: #262424;
          margin-bottom: 16px;
        }

        .instructions ol {
          margin: 0;
          padding-left: 24px;
        }

        .instructions li {
          font-size: 14px;
          color: rgba(38, 36, 36, 0.8);
          margin-bottom: 8px;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .variations-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
