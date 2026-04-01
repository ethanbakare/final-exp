import React from 'react';
import { VoiceRealtimeOpenAI } from '@/projects/voiceinterface/components/VoiceRealtimeOpenAI';

/**
 * OpenAI Realtime Voice Chat Page
 *
 * Clean page with just the voice interface card - no headers or instructions.
 */

export default function VoiceRealtimePage() {
  return (
    <>
      <div className="realtime-page">
        <div className="demo-container">
          <VoiceRealtimeOpenAI />
        </div>
      </div>

      <style jsx>{`
        .realtime-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: #fafafa;
          font-family: 'Open Runde', 'Inter', sans-serif;
        }

        .demo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        @media (max-width: 768px) {
          .realtime-page {
            padding: 10px;
          }
        }
      `}</style>
    </>
  );
}
