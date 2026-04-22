/**
 * Lab page for iterating on the DemoCanvas background variations.
 * Not linked from anywhere — accessed directly via /demo-canvas-lab.
 */
import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DemoCanvas } from '@/projects/demo-showcase/components/ui/DemoCanvas';
import { DemoIntroCard } from '@/projects/demo-showcase/components/ui/DemoIntroCard';
import { DemoProgressSection } from '@/projects/demo-showcase/components/ui/DemoProgressSection';
import { SIM_DURATION } from '@/projects/demo-showcase/components/simulations/AIConfidenceSim';

const AIConfidenceSim = dynamic(
  () => import('@/projects/demo-showcase/components/simulations/AIConfidenceSim').then(m => m.AIConfidenceSim),
  { ssr: false },
);

const HEADLINE_BROWN = 'A grammar checker, but for how confident AI is in what it heard';
const HEADLINE_LAVENDER = 'Speak about what you spent. It extracts every item';
const HEADLINE_PINK = 'A warm pink variation placeholder headline';

export default function DemoCanvasLab() {
  const [loopKey, setLoopKey] = useState(0);
  const handleLoopRestart = useCallback(() => setLoopKey(k => k + 1), []);

  return (
    <div className="lab">
      <h1>Demo Canvas Lab</h1>

      <section className="variation">
        <span className="label">Variation 1 — Warm brown 10% (AI Confidence Tracker)</span>
        <DemoCanvas tint="#2E201E" tintOpacity={0.1} textureOpacity={0.6}>
          <DemoIntroCard headline={HEADLINE_BROWN} />
          <div className="sim-slot">
            <AIConfidenceSim key={loopKey} onLoopRestart={handleLoopRestart} />
          </div>
          <DemoProgressSection duration={SIM_DURATION} loopKey={loopKey} />
        </DemoCanvas>
      </section>

      <section className="variation">
        <span className="label">Variation 2 — Lavender 20%</span>
        <DemoCanvas
          tint="#D992F0"
          tintOpacity={0.2}
          textureOpacity={0.6}
          cardBg="rgba(253, 247, 255, 0.80)"
        >
          <DemoIntroCard headline={HEADLINE_LAVENDER} />
          <div className="slot-placeholder" />
          <DemoProgressSection duration={8000} loopKey={0} />
        </DemoCanvas>
      </section>

      <section className="variation">
        <span className="label">Variation 3 — Warm pink 20% (texture flipped)</span>
        <DemoCanvas
          tint="#F09294"
          tintOpacity={0.2}
          textureOpacity={0.6}
          flipTexture
          cardBg="rgba(255, 247, 247, 0.80)"
          captionColor="rgba(23, 7, 28, 0.50)"
          progressBarBg="#F5F0F0"
          progressTrackBg="rgba(38, 10, 10, 0.10)"
          progressThumbBg="rgba(50, 12, 13, 0.50)"
        >
          <DemoIntroCard headline={HEADLINE_PINK} />
          <div className="slot-placeholder" />
          <DemoProgressSection duration={8000} loopKey={0} />
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
        @media (max-width: 768px) {
          .lab {
            padding: 40px 10px;
          }
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
        .slot-placeholder,
        .sim-slot {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
