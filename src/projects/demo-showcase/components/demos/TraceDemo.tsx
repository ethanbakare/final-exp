/**
 * Embeddable Trace demo — the real working product, mounted inside
 * the showcase. Wraps TraceApp with the kill-switch contract; strips
 * the full-page chrome so it fits inside ShowcaseSlot.
 *
 * See docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md §2.2.
 *
 * Trace's localStorage entries (`trace-expense-entries`) are durable —
 * they survive showcase swipes by design. This wrapper does NOT clear
 * them on cancellation. Cancellation only releases active resources
 * (mic stream, in-flight fetch) via TraceApp's existing
 * handleCancelRecording path.
 */
import React from 'react';
import { TraceApp } from '@/projects/trace/components/TraceApp';

interface TraceDemoProps {
  cancelSignal?: AbortSignal;
  runIdRef?: React.MutableRefObject<number>;
}

export const TraceDemo: React.FC<TraceDemoProps> = ({ cancelSignal, runIdRef }) => (
  <div className="trace-demo-wrapper">
    <TraceApp cancelSignal={cancelSignal} runIdRef={runIdRef} />

    <style jsx>{`
      .trace-demo-wrapper {
        width: 100%;
        max-width: 620px;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        position: relative;
      }

      /* TraceApp's own .trace-app uses min-height: 100vh and a fixed bottom
         nav, both of which assume a full-page mount. Inside the showcase
         slot we need it to flow as a card, not own the viewport. Scoped
         :global() overrides keep /trace-ai's own page untouched. */
      .trace-demo-wrapper :global(.trace-app) {
        min-height: auto;
        padding-bottom: 100px;
      }

      .trace-demo-wrapper :global(.trace-nav) {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
      }
    `}</style>
  </div>
);
