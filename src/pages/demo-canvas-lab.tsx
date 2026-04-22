/**
 * Lab page for iterating on the DemoCanvas background variations.
 * Not linked from anywhere — accessed directly via /demo-canvas-lab.
 */
import React from 'react';
import { DemoCanvas } from '@/projects/demo-showcase/components/ui/DemoCanvas';
import { DemoIntroCard } from '@/projects/demo-showcase/components/ui/DemoIntroCard';
import { DemoProgressSection } from '@/projects/demo-showcase/components/ui/DemoProgressSection';

const HEADLINE = 'A grammar checker, but for how confident AI is in what it heard';

export default function DemoCanvasLab() {
  return (
    <div className="lab">
      <h1>Demo Canvas Lab</h1>

      <section className="variation">
        <span className="label">Variation 1 — Warm brown 10% (with features)</span>
        <DemoCanvas tint="#2E201E" tintOpacity={0.1} textureOpacity={0.6}>
          <DemoIntroCard headline={HEADLINE} />
          <div className="slot-placeholder" />
          <DemoProgressSection duration={8000} loopKey={0} />
        </DemoCanvas>
      </section>

      <section className="variation">
        <span className="label">Variation 2 — Lavender 20%</span>
        <DemoCanvas tint="#D992F0" tintOpacity={0.2} textureOpacity={0.6} />
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
        .slot-placeholder {
          flex: 1;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
