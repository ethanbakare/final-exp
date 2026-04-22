/**
 * Lab page for iterating on the DemoCanvas background variations.
 * Not linked from anywhere — accessed directly via /demo-canvas-lab.
 */
import React from 'react';
import { DemoCanvas } from '@/projects/demo-showcase/components/ui/DemoCanvas';

export default function DemoCanvasLab() {
  return (
    <div className="lab">
      <h1>Demo Canvas Lab</h1>

      <section className="variation">
        <span className="label">Variation 1 — Lavender</span>
        <DemoCanvas tint="#E8D2E9">
          <div className="placeholder">content area</div>
        </DemoCanvas>
      </section>

      <style jsx>{`
        .lab {
          min-height: 100vh;
          background: #F7F6F2;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        h1 {
          margin: 0;
          font-size: 20px;
          color: #333;
        }
        .variation {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 1160px;
        }
        .label {
          font-size: 13px;
          color: #777;
        }
        .placeholder {
          text-align: center;
          color: rgba(0, 0, 0, 0.35);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
