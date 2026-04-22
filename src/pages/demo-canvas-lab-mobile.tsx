/**
 * Mobile-focused variation of the demo canvas lab — duplicated so we can
 * iterate on a denser vertical layout for small screens without touching
 * the desktop lab. Accessed directly via /demo-canvas-lab-mobile.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
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

const AIConfidenceDemo = dynamic(
  () => import('@/projects/demo-showcase/components/demos/AIConfidenceDemo').then(m => m.AIConfidenceDemo),
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
    headline: 'A grammar checker, but for how confident AI is',
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

export default function DemoCanvasLabMobile() {
  const [[activeIdx, direction], setActive] = useState<[number, number]>([0, 0]);
  const [loopKey, setLoopKey] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const handleLoopRestart = useCallback(() => setLoopKey(k => k + 1), []);
  const totalRef = useRef(VARIATIONS.length);

  const go = useCallback((delta: number) => {
    setActive(([i]) => {
      const total = totalRef.current;
      const next = (i + delta + total) % total;
      return [next, delta];
    });
    setLoopKey(k => k + 1);
    // Navigation always resets to simulation — user has to click Try Demo
    // each time to enter demo mode for the current variation.
    setIsDemoMode(false);
  }, []);

  const handleToggleDemo = useCallback(() => {
    setIsDemoMode(m => !m);
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

  // Measure canvas-area height so neighbours enter/exit exactly one
  // "card height + gap" away, mimicking a stacked strip.
  // Target visual edge-to-edge gap between outgoing and incoming panels.
  // Since panels are at ~scale 0.8 combined mid-transit, edge gap =
  // offset − 0.8 × H, so offset = 0.8H + PANEL_GAP.
  const PANEL_GAP = 100;
  const areaRef = useRef<HTMLDivElement>(null);
  const [areaH, setAreaH] = useState(720);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    setAreaH(el.getBoundingClientRect().height);
    const ro = new ResizeObserver(entries => {
      setAreaH(entries[0].contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const offset = areaH * 0.8 + PANEL_GAP;

  const variants = {
    enter: (dir: number) => ({ y: dir > 0 ? offset : -offset, opacity: 0, scale: 0.6 }),
    center: { y: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? -offset : offset, opacity: 0, scale: 0.6 }),
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

      <div className="canvas-area" ref={areaRef}>
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={activeIdx}
            className="canvas-motion"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 30, opacity: { duration: 0.35, ease: 'easeIn' } }}
            drag="y"
            dragElastic={0.2}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
          >
            <DemoCanvas {...active.canvasProps}>
              {/* Intro + progress always mounted; CSS opacity hides them in
                  demo mode so the flex layout never shifts. */}
              <div className={`chrome ${isDemoMode ? 'chrome-hidden' : ''}`}>
                <DemoIntroCard headline={active.headline} />
              </div>
              <div className="sim-slot">
                {/* Both sim and demo mount once and stay; only opacity
                    toggles. No unmount = no re-mount jitter. */}
                {activeIdx === 0 && (
                  <>
                    <div className={`layer ${isDemoMode ? 'layer-hidden' : ''}`}>
                      <AIConfidenceSim key={loopKey} onLoopRestart={handleLoopRestart} />
                    </div>
                    <div className={`layer ${!isDemoMode ? 'layer-hidden' : ''}`}>
                      <AIConfidenceDemo />
                    </div>
                  </>
                )}
              </div>
              <div className={`chrome ${isDemoMode ? 'chrome-hidden' : ''}`}>
                <DemoProgressSection
                  duration={activeIdx === 0 ? SIM_DURATION : 8000}
                  loopKey={loopKey}
                />
              </div>
            </DemoCanvas>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="cta-section">
        <div className="cta-buttons">
          <TryDemoButton
            onClick={handleToggleDemo}
            label={isDemoMode ? 'Play Simulation' : 'Try Demo'}
          />
          <ViewCaseStudyButton onClick={() => {}} />
        </div>
      </div>

      <style jsx>{`
        .lab {
          height: 100vh;
          background: #FFFFFF;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
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
        /* Navbar + CTA sit above the sliding canvas via z-index only —
           no solid bg, so the panel remains visible as it slides behind
           them. Only the navbar pill and CTA buttons (their own bgs)
           render on top of the travelling canvas. */
        .lab :global(.top-navbar-compact) {
          position: relative;
          z-index: 2;
          width: 100%;
        }
        /* Mobile: drop the navbar wrapper's 16px horizontal padding so
           the pill fills edge-to-edge within the lab's inner content area. */
        @media (max-width: 768px) {
          .lab :global(.top-navbar-compact) {
            padding-left: 0;
            padding-right: 0;
          }
        }
        .cta-section {
          position: relative;
          z-index: 2;
        }
        .canvas-area :global(.canvas-motion) {
          position: absolute;
          inset: 0;
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
          position: relative;
        }
        /* Sim and demo both live in the slot, stacked. Opacity toggles
           which is visible; pointer-events disables the hidden one. */
        .sim-slot :global(.layer) {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          transition: opacity 0.25s ease;
          pointer-events: auto;
        }
        .sim-slot :global(.layer.layer-hidden) {
          opacity: 0;
          pointer-events: none;
        }
        /* Intro + progress wrappers — opacity toggle only, so their
           flex slots remain reserved in the layout in both modes. */
        .chrome {
          opacity: 1;
          transition: opacity 0.25s ease;
        }
        .chrome.chrome-hidden {
          opacity: 0;
          pointer-events: none;
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
