import React from 'react';

/**
 * VoiceStateLabel - Display current conversation state as text
 *
 * Shows clear labels for each state in the conversation flow.
 * Text updates with a quick opacity fade transition.
 */

export type VoiceStateLabelState = 'idle' | 'connecting' | 'listening' | 'ai_thinking' | 'ai_speaking';

export interface VoiceStateLabelProps {
  state: VoiceStateLabelState;
}

const STATE_LABELS: Record<VoiceStateLabelState, string> = {
  idle: 'Ready when you are',
  connecting: 'Connecting',
  listening: 'Listening...',
  ai_thinking: 'Thinking...',
  ai_speaking: 'Speaking...',
};

export const VoiceStateLabel: React.FC<VoiceStateLabelProps> = ({ state }) => {
  return (
    <>
      {/* Key forces re-render on state change, triggering fade animation.
       * aria-live="polite" + role="status" so SR users hear the state
       * transitions — load-bearing because focus drops to <body> when
       * the button component swaps between MorphingRecordWideSimple and
       * ProcessingButtonDark during warming. */}
      <div
        key={state}
        className="voice-state-label"
        aria-live="polite"
        role="status"
      >
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
