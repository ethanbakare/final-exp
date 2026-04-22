/**
 * Lab page for iterating on the DemoCanvas background variations.
 * Mirrors the target demo-showcase layout: navbar at top, CTA at bottom,
 * canvas filling the middle up to a 1440px max-width.
 *
 * Not linked from anywhere — accessed directly via /demo-canvas-lab.
 */
import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DemoCanvas } from '@/projects/demo-showcase/components/ui/DemoCanvas';
import { DemoIntroCard } from '@/projects/demo-showcase/components/ui/DemoIntroCard';
import { DemoProgressSection } from '@/projects/demo-showcase/components/ui/DemoProgressSection';
import { ShowcaseNavbarCompact } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarCompact';
import { TryDemoButton, ViewCaseStudyButton } from '@/projects/demo-showcase/components/ui/ShowcaseButtons';
import { SIM_DURATION } from '@/projects/demo-showcase/components/simulations/AIConfidenceSim';

const AIConfidenceSim = dynamic(
  () => import('@/projects/demo-showcase/components/simulations/AIConfidenceSim').then(m => m.AIConfidenceSim),
  { ssr: false },
);

interface VariationConfig {
  label: string;
  headline: string;
  canvasProps: React.ComponentProps<typeof DemoCanvas>;
}

const VARIATIONS: VariationConfig[] = [
  {
    label: 'Warm brown',
    headline: 'A grammar checker, but for how confident AI is in what it heard',
    canvasProps: {
      tint: '#2E201E',
      tintOpacity: 0.1,
      textureOpacity: 0.6,
    },
  },
  {
    label: 'Lavender',
    headline: 'Speak about what you spent. It extracts every item',
    canvasProps: {
      tint: '#D992F0',
      tintOpacity: 0.2,
      textureOpacity: 0.6,
      cardBg: 'rgba(253, 247, 255, 0.80)',
    },
  },
  {
    label: 'Warm pink',
    headline: 'A warm pink variation placeholder headline',
    canvasProps: {
      tint: '#F09294',
      tintOpacity: 0.2,
      textureOpacity: 0.6,
      flipTexture: true,
      cardBg: 'rgba(255, 247, 247, 0.80)',
      captionColor: 'rgba(23, 7, 28, 0.50)',
      progressBarBg: '#F5F0F0',
      progressTrackBg: 'rgba(38, 10, 10, 0.10)',
      progressThumbBg: 'rgba(50, 12, 13, 0.50)',
    },
  },
];

export default function DemoCanvasLab() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [loopKey, setLoopKey] = useState(0);
  const handleLoopRestart = useCallback(() => setLoopKey(k => k + 1), []);

  const active = VARIATIONS[activeIdx];

  return (
    <div className="lab">
      {/* Variation picker (lab-only) */}
      <div className="picker">
        {VARIATIONS.map((v, i) => (
          <button
            key={v.label}
            className={`picker-btn${i === activeIdx ? ' active' : ''}`}
            onClick={() => {
              setActiveIdx(i);
              setLoopKey(k => k + 1);
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Target layout: navbar + canvas + CTA */}
      <ShowcaseNavbarCompact
        projectName={active.label}
        currentIndex={activeIdx}
        totalCount={VARIATIONS.length}
        onNext={() => setActiveIdx(i => (i + 1) % VARIATIONS.length)}
        onPrev={() => setActiveIdx(i => (i - 1 + VARIATIONS.length) % VARIATIONS.length)}
      />

      <div className="canvas-area">
        <DemoCanvas {...active.canvasProps}>
          <DemoIntroCard headline={active.headline} />
          <div className="sim-slot">
            {activeIdx === 0 ? (
              <AIConfidenceSim key={loopKey} onLoopRestart={handleLoopRestart} />
            ) : null}
          </div>
          <DemoProgressSection
            duration={activeIdx === 0 ? SIM_DURATION : 8000}
            loopKey={loopKey}
          />
        </DemoCanvas>
      </div>

      <div className="cta-section">
        <div className="cta-buttons">
          <TryDemoButton onClick={() => {}} label="Try Demo" />
          <ViewCaseStudyButton onClick={() => {}} />
        </div>
      </div>

      <style jsx>{`
        .lab {
          min-height: 100vh;
          background: #F7F6F2;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        @media (max-width: 768px) {
          .lab {
            padding: 0 10px;
          }
        }
        .picker {
          display: flex;
          gap: 8px;
          padding: 12px 0;
          align-self: flex-end;
        }
        .picker-btn {
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: transparent;
          border-radius: 999px;
          padding: 4px 12px;
          font-size: 12px;
          cursor: pointer;
        }
        .picker-btn.active {
          background: #1C1917;
          color: #FFF;
          border-color: #1C1917;
        }
        .canvas-area {
          flex: 1;
          width: 100%;
          max-width: 1440px;
          display: flex;
          align-items: stretch;
        }
        .sim-slot {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cta-section {
          display: flex;
          padding: 20px 0;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          align-self: stretch;
        }
        .cta-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
        }
      `}</style>
    </div>
  );
}
