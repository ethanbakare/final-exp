/**
 * Lab page for iterating on the DemoCanvas background variations.
 * Mirrors the target demo-showcase layout: navbar at top, CTA at bottom,
 * canvas filling the middle up to a 1440px max-width.
 *
 * Not linked from anywhere — accessed directly via /demo-canvas-lab.
 */
import React, { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
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
      tintOpacity: 0.08,
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

const SWIPE_OFFSET = 100;
const SWIPE_VELOCITY = 500;

export default function DemoCanvasLab() {
  const [[activeIdx, direction], setActive] = useState<[number, number]>([0, 0]);
  const [loopKey, setLoopKey] = useState(0);
  const handleLoopRestart = useCallback(() => setLoopKey(k => k + 1), []);
  const totalRef = useRef(VARIATIONS.length);

  const go = useCallback((delta: number) => {
    setActive(([i]) => {
      const total = totalRef.current;
      const next = (i + delta + total) % total;
      return [next, delta];
    });
    setLoopKey(k => k + 1);
  }, []);

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;
      if (offset.y < -SWIPE_OFFSET || velocity.y < -SWIPE_VELOCITY) go(1);
      else if (offset.y > SWIPE_OFFSET || velocity.y > SWIPE_VELOCITY) go(-1);
    },
    [go],
  );

  const active = VARIATIONS[activeIdx];

  const variants = {
    enter: (dir: number) => ({ y: dir > 0 ? 300 : -300, opacity: 0, scale: 0.92 }),
    center: { y: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? -300 : 300, opacity: 0, scale: 0.92 }),
  };

  return (
    <div className="lab">
      {/* Target layout: navbar + canvas + CTA */}
      <ShowcaseNavbarCompact
        projectName={active.label}
        currentIndex={activeIdx}
        totalCount={VARIATIONS.length}
        onNext={() => go(1)}
        onPrev={() => go(-1)}
      />

      <div className="canvas-area">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={activeIdx}
            className="canvas-motion"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 30, opacity: { duration: 0.18 } }}
            drag="y"
            dragElastic={0.2}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
          >
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
          </motion.div>
        </AnimatePresence>
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
          background: #FFFFFF;
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
        .canvas-area {
          flex: 1;
          width: 100%;
          max-width: 1440px;
          display: flex;
          align-items: stretch;
          position: relative;
          z-index: 1;
        }
        /* Navbar + CTA sit above the sliding canvas so panels pass
           under them rather than over. Solid bg occludes the travel. */
        .lab :global(.top-navbar-compact) {
          position: relative;
          z-index: 2;
          background: #FFFFFF;
          width: 100%;
        }
        .cta-section {
          position: relative;
          z-index: 2;
          background: #FFFFFF;
        }
        .canvas-area :global(.canvas-motion) {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: stretch;
          touch-action: pan-x;
          cursor: grab;
        }
        .canvas-area :global(.canvas-motion:active) {
          cursor: grabbing;
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
