/**
 * Lab page for iterating on the DemoCanvas background variations.
 * Not linked from anywhere — accessed directly via /demo-canvas-lab.
 */
import React from 'react';
import { DemoCanvas } from '@/projects/demo-showcase/components/ui/DemoCanvas';
import { ShowcaseProgress } from '@/projects/demo-showcase/components/ui/ShowcaseProgress';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

const HEADLINE = 'A grammar checker, but for how confident AI is in what it heard';

export default function DemoCanvasLab() {
  return (
    <div className="lab">
      <h1>Demo Canvas Lab</h1>

      <section className="variation">
        <span className="label">Variation 1 — Warm brown 10% (with features)</span>
        <DemoCanvas tint="#2E201E" tintOpacity={0.1} textureOpacity={0.6}>
          <div className="intro-card">
            <span className={`${styles.OpenRunde600_16} intro-text`}>{HEADLINE}</span>
          </div>
          <div className="slot-placeholder" />
          <ShowcaseProgress duration={8000} loopKey={0} />
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
        .intro-card {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 15px 25px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.80);
          max-width: 526px;
        }
        .intro-text {
          color: rgba(94, 94, 92, 0.80);
          text-align: center;
        }
        .slot-placeholder {
          flex: 1;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
