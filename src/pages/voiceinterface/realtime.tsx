import React from 'react';
import { VoiceRealtimeOpenAI } from '@/projects/voiceinterface/components/VoiceRealtimeOpenAI';

/**
 * OpenAI Realtime Voice Chat Page
 *
 * Demonstrates walkie-talkie style voice interaction with OpenAI Realtime API
 */

export default function VoiceRealtimePage() {
  return (
    <>
      <div className="realtime-page">
        <div className="header">
          <h1>OpenAI Realtime Voice Chat</h1>
          <p className="subtitle">Walkie-Talkie Style Conversation</p>
        </div>

        <div className="demo-container">
          <VoiceRealtimeOpenAI />
        </div>

        <div className="instructions">
          <h3>How to use:</h3>
          <ol>
            <li>Press the microphone button to start speaking</li>
            <li>Speak your message</li>
            <li>Release the button when done</li>
            <li>Wait for AI response</li>
            <li>Press again to continue the conversation</li>
          </ol>
        </div>
      </div>

      <style jsx>{`
        .realtime-page {
          min-height: 100vh;
          padding: 40px 20px;
          background: #fafafa;
          font-family: 'Open Runde', 'Inter', sans-serif;
        }

        .header {
          max-width: 800px;
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

        .demo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 40px auto;
        }

        .instructions {
          max-width: 600px;
          margin: 60px auto 0;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.06);
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
          color: rgba(38, 36, 36, 0.8);
        }

        .instructions li {
          margin-bottom: 8px;
          font-size: 15px;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .realtime-page {
            padding: 20px 10px;
          }
        }
      `}</style>
    </>
  );
}
