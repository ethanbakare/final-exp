import React from 'react';

/**
 * VoiceStateLabel - Display current conversation state as text
 *
 * Shows clear labels for each state in the conversation flow.
 * Text updates with a quick opacity fade transition.
 */

export type VoiceStateLabelState = 'idle' | 'listening' | 'ai_thinking' | 'ai_speaking';

export interface VoiceStateLabelProps {
  state: VoiceStateLabelState;
}

const STATE_LABELS: Record<VoiceStateLabelState, string> = {
  idle: 'Ready when you are',
  listening: 'Listening...',
  ai_thinking: 'Thinking...',
  ai_speaking: 'Speaking...',
};

export const VoiceStateLabel: React.FC<VoiceStateLabelProps> = ({ state }) => {
  return (
    <>
      {/* Key forces re-render on state change, triggering fade animation */}
      <div key={state} className="voice-state-label">
        {STATE_LABELS[state]}
      </div>

      <style jsx>{`
        .voice-state-label {
          font-family: 'Open Runde', 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: var(--VoiceDarkGrey_30, rgba(38, 36, 36, 0.3));
          text-align: center;
          animation: fadeIn 150ms ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
