/**
 * Animated Trace preview for the home page card.
 * Reuses the TraceSim auto-loop (idle → recording → processing → results → clear → restart)
 * fitted within the preview card dimensions.
 */
import React from 'react';
import { TraceSim } from '@/projects/demo-showcase/components/simulations/TraceSim';

const PreviewTraceAnimated: React.FC = () => {
  return (
    <div className="preview-trace">
      <div className="trace-frame">
        <TraceSim />
      </div>

      <style jsx>{`
        .preview-trace {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .trace-frame {
          position: absolute;
          left: -72px;
          bottom: 27px;
          width: 301px;
          height: 530px;
          border-radius: 16px;
          border: 1px solid #44403C;
          background: #1C1917;
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          pointer-events: none;
          will-change: transform;
        }

        /* Fill the card frame instead of TraceSim's default centering */
        .trace-frame :global(.trace-sim-embed) {
          max-width: 100%;
          margin: 0;
        }

        /* Fit the TextBox to the preview card */
        .trace-frame :global(.text-box),
        .trace-frame :global(.text-box--with-navbar) {
          width: 100% !important;
          height: 100% !important;
          border-radius: 0 !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default PreviewTraceAnimated;
