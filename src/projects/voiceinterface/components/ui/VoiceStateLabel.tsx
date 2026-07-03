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
      {/* v4.2.1 IMR Site 3 — the aria-live region is now the OUTER,
       * PERSISTENT div. The inner `key={state}` div still remounts to
       * trigger the fade animation, but SRs monitor the outer region for
       * text changes — a more reliable announcement pattern across
       * VoiceOver / NVDA / JAWS. Previously the aria-live region itself
       * was remounted on each state change, which some SR/browser combos
       * do NOT announce. */}
      <div className="voice-state-live-region" aria-live="polite" role="status">
        <div key={state} className="voice-state-label">
          {STATE_LABELS[state]}
        </div>
      </div>

      <style jsx>{`
        .voice-state-live-region {
          /* Persistent wrapper — never remounts. Layout-transparent. */
          width: 100%;
        }
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
