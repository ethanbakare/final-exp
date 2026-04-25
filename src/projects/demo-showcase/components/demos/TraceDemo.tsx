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
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TraceCore } from '@/projects/trace/components/TraceCore';
import { ClearButton } from '@/projects/trace/components/ui/tracebuttons';

interface TraceDemoProps {
  cancelSignal?: AbortSignal;
  runIdRef?: React.MutableRefObject<number>;
}

export const TraceDemo: React.FC<TraceDemoProps> = ({ cancelSignal, runIdRef }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [canvasContentEl, setCanvasContentEl] = useState<Element | null>(null);
  const [clearButtonEl, setClearButtonEl] = useState<HTMLButtonElement | null>(null);

  useEffect(() => {
    setCanvasContentEl(wrapperRef.current?.closest('.canvas-content') ?? null);
    setClearButtonEl(
      wrapperRef.current?.querySelector<HTMLButtonElement>('.clear-button-below .clear-button') ?? null,
    );
  }, []);

  return (
    <div className="trace-demo-wrapper" ref={wrapperRef}>
      <div className="trace-demo-content">
        <TraceCore
          cancelSignal={cancelSignal}
          runIdRef={runIdRef}
          // Suppress TraceCore's internal MicPermissionBanner — the
          // showcase renders its own navbar-slot variant (Stage 2+) so
          // the fixed-position floater doesn't collide with the showcase
          // top chrome. Standalone /trace is unaffected.
          hideMicBanner={true}
        />
      </div>
      {canvasContentEl ? createPortal(
        <div className="showcase-clear-button">
          <ClearButton onClick={() => clearButtonEl?.click()} />
        </div>,
        canvasContentEl,
      ) : null}

      <style jsx>{`
        .trace-demo-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100%;
        }
        .trace-demo-content {
          width: 100%;
          max-width: 620px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .trace-demo-wrapper :global(.clear-button-below) {
          display: none;
        }
        .showcase-clear-button {
          position: absolute;
          right: 20px;
          bottom: 20px;
          z-index: 20;
        }
      `}</style>
    </div>
  );
};
