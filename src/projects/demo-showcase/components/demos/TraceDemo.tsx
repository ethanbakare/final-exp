/**
 * TraceDemo — embeddable Trace demo for the showcase carousel.
 *
 * Mounts the same TraceCore component the standalone /trace page renders,
 * so the showcase's "Try Demo" surfaces the real interactive product
 * (AnimatedTextBox + TRNavbarV2 + Speak/Upload flows), not a stripped-down
 * fork. Strips full-page chrome (centred page background, padding) so the
 * core flows naturally inside ShowcaseSlot.
 *
 * Kill-switch wiring:
 *   - cancelSignal + runIdRef are forwarded straight into TraceCore.
 *   - On abort (swipe-away / demo↔sim toggle), TraceCore's own internal
 *     listener invokes its existing handleCancelRecording path. localStorage
 *     entries persist by design — see KILL-SWITCH-ARCHITECTURE.md §2.2.
 */
import React from 'react';
import { TraceCore } from '@/projects/trace/components/TraceCore';

interface TraceDemoProps {
  cancelSignal?: AbortSignal;
  runIdRef?: React.MutableRefObject<number>;
}

export const TraceDemo: React.FC<TraceDemoProps> = ({ cancelSignal, runIdRef }) => (
  <div className="trace-demo-wrapper">
    <TraceCore cancelSignal={cancelSignal} runIdRef={runIdRef} />

    <style jsx>{`
      .trace-demo-wrapper {
        width: 100%;
        max-width: 620px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
      /* [DEMO-SHOWCASE] Clear (trash) button placement override.
         In the standalone /trace page the ClearButton sits centered below
         the card. Inside the showcase it's nicer to push it to the
         bottom-right of the demo content area so it doesn't sit directly
         under the card and crowd it. align-self: flex-end leaves it in
         the flex column flow (still appears below the card vertically)
         but pulls it to the right edge of the 620px wrapper instead of
         the centered default from align-items: center.
         Scoped to .trace-demo-wrapper via :global() so /trace stays
         unchanged. */
      .trace-demo-wrapper :global(.clear-button-below) {
        align-self: flex-end;
      }
    `}</style>
  </div>
);
