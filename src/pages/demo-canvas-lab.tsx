/**
 * Lab page for iterating on the DemoCanvas background variations.
 * Mirrors the target demo-showcase layout: navbar at top, CTA at bottom,
 * canvas filling the middle up to a 1440px max-width.
 *
 * Not linked from anywhere — accessed directly via /demo-canvas-lab.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { DemoCanvas } from '@/projects/demo-showcase/components/ui/DemoCanvas';
import { DemoIntroCard } from '@/projects/demo-showcase/components/ui/DemoIntroCard';
import { DemoProgressSection } from '@/projects/demo-showcase/components/ui/DemoProgressSection';
import { DemoProgressSectionTransparent } from '@/projects/demo-showcase/components/ui/DemoProgressSectionTransparent';
import { ShowcaseNavbarCompact } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarCompact';
import { ShowcaseNavbarCompactSmall } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarCompactSmall';
import { ShowcaseCloseBtnSmall } from '@/projects/demo-showcase/components/ui/ShowcaseCloseBtnSmall';
import { TryDemoButton, ViewCaseStudyButton } from '@/projects/demo-showcase/components/ui/ShowcaseButtons';
import { TryDemoButtonSmall, ViewCaseStudyButtonSmall } from '@/projects/demo-showcase/components/ui/ShowcaseButtonsSmall';
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
  /** Base headline — always shown on all viewports. */
  headline: string;
  /** Optional trailing text shown only on desktop. Split is purely
   *  presentational; the full string remains in the DOM on mobile
   *  (just hidden via CSS) so screen readers get the complete text. */
  headlineSuffix?: string;
  canvasProps: React.ComponentProps<typeof DemoCanvas>;
}

const VARIATIONS: VariationConfig[] = [
  {
    label: 'Warm brown',
    headline: 'A grammar checker, but for how confident AI is',
    headlineSuffix: ' in what it heard',
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

  // App-shell body lock: while this page is mounted, disable the document's
  // scroll + overscroll so iOS Safari does not trigger pull-to-refresh on
  // downward drags at slide 1. Other pages in this app need scroll, so we
  // restore the prior body state on unmount instead of using global CSS.
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const prev = {
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyTouchAction: body.style.touchAction,
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
    };
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    body.style.touchAction = 'none';
    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    return () => {
      body.style.overflow = prev.bodyOverflow;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      body.style.touchAction = prev.bodyTouchAction;
      html.style.overflow = prev.htmlOverflow;
      html.style.overscrollBehavior = prev.htmlOverscroll;
    };
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
    <div className={`lab ${isDemoMode ? 'is-demo' : ''}`}>
      {/* Target layout: navbar + canvas + CTA */}
      <div className="nav-slot nav-desktop">
        <ShowcaseNavbarCompact
          projectName={active.label}
          currentIndex={activeIdx}
          totalCount={VARIATIONS.length}
          onNext={() => go(1)}
          onPrev={() => go(-1)}
        />
      </div>
      <div className="nav-slot nav-mobile">
        {/* Flex row: close button slot (width animates 0 <-> 56 via CSS
            transition) + pill. When the slot grows, flex recompute
            shrinks the pill automatically — no calc needed. */}
        <div className="mobile-nav-row">
          <div className="close-slot" aria-hidden={!isDemoMode}>
            <ShowcaseCloseBtnSmall onClick={handleToggleDemo} />
          </div>
          <ShowcaseNavbarCompactSmall
            projectName={active.label}
            currentIndex={activeIdx}
            totalCount={VARIATIONS.length}
            onNext={() => go(1)}
            onPrev={() => go(-1)}
          />
        </div>
      </div>

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
              <div className={`chrome chrome-top ${isDemoMode ? 'chrome-hidden' : ''}`}>
                <DemoIntroCard
                  headline={active.headline}
                  headlineSuffix={active.headlineSuffix}
                />
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
              <div className={`chrome chrome-desktop ${isDemoMode ? 'chrome-hidden' : ''}`}>
                <DemoProgressSection
                  duration={activeIdx === 0 ? SIM_DURATION : 8000}
                  loopKey={loopKey}
                />
              </div>
              <div className={`chrome chrome-mobile ${isDemoMode ? 'chrome-hidden' : ''}`}>
                <DemoProgressSectionTransparent
                  duration={activeIdx === 0 ? SIM_DURATION : 8000}
                  loopKey={loopKey}
                />
              </div>
            </DemoCanvas>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="cta-section">
        <div className="cta-buttons cta-desktop">
          <TryDemoButton
            onClick={handleToggleDemo}
            label={isDemoMode ? 'Play Simulation' : 'Try Demo'}
          />
          <ViewCaseStudyButton onClick={() => {}} />
        </div>
        <div className="cta-buttons cta-mobile">
          <TryDemoButtonSmall
            onClick={handleToggleDemo}
            label={isDemoMode ? 'Play Simulation' : 'Try Demo'}
          />
          <ViewCaseStudyButtonSmall onClick={() => {}} />
        </div>
      </div>

      <style jsx>{`
        /* App-shell layout: the lab pins to the visual viewport and is
           not part of the document scroll. This disables mobile pull-
           to-refresh and overscroll rubber-band at the root — neither
           can trigger because the document itself is not a scroll
           container from the browser's point of view. */
        .lab {
          position: fixed;
          inset: 0;
          background: #FFFFFF;
          padding: 0 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow: hidden;
          overscroll-behavior: none;
        }
        /* Desktop shows ShowcaseNavbarCompact; mobile shows
           ShowcaseNavbarCompactSmall (baked-in 0.7x dimensions + edge-to-
           edge fill). CSS display toggle so no JS viewport detection. */
        /* Both nav variants sit above the canvas-area (z:1) so the
           sliding canvas passes behind them during transitions. */
        .nav-slot {
          width: 100%;
          position: relative;
          z-index: 2;
        }
        .nav-mobile { display: none; }
        @media (max-width: 768px) {
          .lab {
            padding: 0 10px;
          }
          .nav-desktop { display: none; }
          .nav-mobile { display: block; }
          /* Mobile nav row: close slot (width animates 0 <-> 56)
             + pill. Flex recompute each frame during the width
             transition makes the pill shrink/grow smoothly. */
          .mobile-nav-row {
            display: flex;
            /* flex-start (not center): the navbar wrapper has
               padding-bottom: 14px, so its pill sits at y=0 of its
               wrapper. Centering the row would center the shorter
               X button (35px) inside the taller navbar (35 + 14),
               pushing it ~7px below the pill. flex-start keeps the
               tops aligned; the 14px hangs below the row content. */
            align-items: flex-start;
            width: 100%;
          }
          /* Navbar root fills the remaining row space; min-width: 0
             lets flex shrink it past its content's intrinsic width
             when the close slot grows in. */
          .mobile-nav-row :global(.top-navbar-compact-small) {
            flex: 1 1 0;
            min-width: 0;
          }
          .close-slot {
            width: 0;
            margin-right: 0;
            overflow: hidden;
            flex-shrink: 0;
            opacity: 0;
            transition:
              width 0.22s cubic-bezier(0.22, 1, 0.36, 1),
              margin-right 0.22s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.18s cubic-bezier(0.22, 1, 0.36, 1);
          }
          .lab.is-demo .close-slot {
            width: 56px;
            margin-right: 10px;
            opacity: 1;
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
        .cta-section {
          position: relative;
          z-index: 2;
        }
        .canvas-area :global(.canvas-motion) {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: stretch;
          /* !important overrides Framer Motion's inline touch-action:pan-x
             which it sets automatically for drag="y". We want the element
             to claim ALL gestures (no browser native pan). */
          touch-action: none !important;
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
        /* Mobile: pull the intro card up 6px past the canvas-content
           16px top padding so the gap reads tighter. Keeps the canvas
           padding intact so the sim in the middle isn't disturbed. */
        @media (max-width: 768px) {
          .chrome.chrome-top {
            margin-top: -6px;
          }
        }
        /* Desktop uses DemoProgressSection; mobile uses the transparent
           edge-to-edge variant. Swap is CSS-only (display:none) so we
           don't need viewport detection in JS. */
        .chrome.chrome-mobile { display: none; }
        @media (max-width: 768px) {
          .chrome.chrome-desktop { display: none; }
          .chrome.chrome-mobile {
            display: block;
            align-self: stretch;
          }
        }
        .cta-section {
          display: flex;
          padding: 20px 0;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          align-self: stretch;
          max-height: 200px;
          opacity: 1;
          overflow: hidden;
          transition:
            max-height 0.22s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.18s ease,
            padding-top 0.22s cubic-bezier(0.22, 1, 0.36, 1),
            padding-bottom 0.22s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .cta-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
        }
        /* Desktop uses TryDemoButton + ViewCaseStudyButton at full size;
           mobile uses the Small variants (baked-in 0.8x dimensions).
           Swap via CSS display toggle — same pattern as nav + progress. */
        .cta-buttons.cta-mobile { display: none; }
        @media (max-width: 768px) {
          .cta-buttons.cta-desktop { display: none; }
          .cta-buttons.cta-mobile {
            display: flex;
            gap: 16px;
          }
          /* Top padding mirrors the navbar's 14px bottom padding for a
             symmetric rhythm. Bottom stays at 20 for viewport breathing. */
          .cta-section {
            padding-top: 14px;
          }
          /* Demo mode (mobile only): collapse the CTA section to free
             vertical space; canvas-area (flex: 1) absorbs it smoothly
             because the browser recomputes flex on each transition
             frame. Coordinates with the close-slot entrance above for
             a choreographed layout shift. */
          .lab.is-demo .cta-section {
            max-height: 0;
            opacity: 0;
            padding-top: 0;
            padding-bottom: 0;
            pointer-events: none;
          }
        }
      `}</style>
    </div>
  );
}
