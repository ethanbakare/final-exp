import React from 'react';
import { VoiceTextBoxStandard } from '@/projects/voiceinterface/components/VoiceTextBoxStandard';
import { VoiceTextBoxCheckClose } from '@/projects/voiceinterface/components/VoiceTextBoxCheckClose';
import { VoiceTextWrapperLive } from '@/projects/voiceinterface/components/VoiceTextWrapperLive';

/**
 * Voice Interface Variations Test Page
 *
 * Shows all 3 variations side-by-side for testing
 */

export default function VoiceInterfaceVariations() {
  return (
    <>
      <div className="variations-page">
        <div className="header">
          <h1>Voice Interface Variations</h1>
          <p className="subtitle">All Three Variations</p>
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

          {/* Variation 2: Check & Close */}
          <div className="variation-section">
            <h2>Variation 2: Check & Close</h2>
            <p className="description">
              Outlined button → check/close controls → transcribe
            </p>
            <div className="variation-demo">
              <VoiceTextBoxCheckClose />
            </div>
          </div>

          {/* Variation 3: Live Streaming */}
          <div className="variation-section">
            <h2>Variation 3: Live Streaming</h2>
            <p className="description">
              Mobile-optimized → live streaming transcription
            </p>
            <div className="variation-demo">
              <VoiceTextWrapperLive />
            </div>
          </div>
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


        @media (max-width: 768px) {
          .variations-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
