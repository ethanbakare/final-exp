/**
 * Animated Trace preview for the home page card.
 * Reuses the TraceSim auto-loop (idle → recording → processing → results → clear → restart)
 * fitted within the preview card dimensions.
 */
import React from 'react';
import traceStyles from '@/projects/trace/styles/trace.module.css';
import { TraceSim } from '@/projects/demo-showcase/components/simulations/TraceSim';

const PreviewTraceAnimated: React.FC = () => {
  return (
    <div className="preview-trace">
      <div className={`trace-frame ${traceStyles.container}`}>
        <TraceSim />
      </div>

      <style jsx>{`
        .preview-trace {
          position: absolute;
          inset: 0;
          overflow: hidden;
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
          align-items: center;
          overflow: hidden;
          pointer-events: none;
          will-change: transform;
        }

        /* Let TraceSim fill the frame width without its centering max-width */
        .trace-frame :global(.trace-sim-embed) {
          max-width: 100%;
          margin: 0;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default PreviewTraceAnimated;
