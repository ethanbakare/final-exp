import React from 'react';

/**
 * VoiceStateLabel - Display current conversation state as text
 *
 * Shows clear labels for each state in the conversation flow.
 * Text updates automatically when state changes.
 */

export type VoiceStateLabelState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking' | 'complete';

export interface VoiceStateLabelProps {
  state: VoiceStateLabelState;
}

const STATE_LABELS: Record<VoiceStateLabelState, string> = {
  idle: 'Ready when you are',
  listening: 'Listening...',
  ai_thinking: 'AI is thinking...',
  ai_speaking: 'AI is speaking...',
  complete: 'Conversation complete',
};

export const VoiceStateLabel: React.FC<VoiceStateLabelProps> = ({ state }) => {
  const isActive = state !== 'idle';

  return (
    <>
      <div className={`voice-state-label ${isActive ? 'active' : ''}`}>
        {STATE_LABELS[state]}
      </div>

      <style jsx>{`
        .voice-state-label {
          font-family: 'Open Runde', 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: var(--VoiceDarkGrey_30);  /* rgba(38,36,36,0.3) */
          text-align: center;
          opacity: 1;
          transition: color 200ms ease-out, opacity 200ms ease-out;
        }

        .voice-state-label.active {
          color: var(--VoiceDarkGrey_90);  /* rgba(38,36,36,0.9) when active */
        }
      `}</style>
    </>
  );
};
