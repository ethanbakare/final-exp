/**
 * Demo showcase — production page. Ports the layout and mobile polish
 * proven in /demo-canvas-lab to real projects. Three projects right
 * now: AI Confidence Tracker, Trace, ClipStream. Voice Interface is
 * deferred (not yet "inline demo"-ready).
 *
 * Only AI Confidence has a full sim + demo wired in. Trace renders
 * its sim; its inline demo is not yet built. ClipStream is a
 * placeholder on both axes. Adding more demos is additive: wire a
 * new activeIdx branch in the sim-slot + pass a canvasProps entry.
 *
 * The kill-switch architecture (AbortSignal contract) is tracked
 * separately at docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md and
 * will be added after this port is verified.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
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
import { TRACE_SIM_DURATION } from '@/projects/demo-showcase/components/simulations/TraceSim';
import { CLIPSTREAM_SIM_DURATION } from '@/projects/demo-showcase/components/simulations/ClipStreamSim';
import { useActiveAbortSignal } from '@/projects/demo-showcase/hooks/useActiveAbortSignal';
import { useRunId } from '@/projects/demo-showcase/hooks/useRunId';
import { ShowcaseNavbarMicBanner } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarMicBanner';
import { ShowcaseNavbarMicBannerSmall } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarMicBannerSmall';
import { useMicPermission } from '@/projects/new-home/hooks/useMicPermission';

// Dynamic imports — SSR-unsafe sims/demos.
const AIConfidenceSim = dynamic(
  () => import('@/projects/demo-showcase/components/simulations/AIConfidenceSim').then(m => m.AIConfidenceSim),
  { ssr: false },
);
const AIConfidenceDemo = dynamic(
  () => import('@/projects/demo-showcase/components/demos/AIConfidenceDemo').then(m => m.AIConfidenceDemo),
  { ssr: false },
);
const TraceSim = dynamic(
  () => import('@/projects/demo-showcase/components/simulations/TraceSim').then(m => m.TraceSim),
  { ssr: false },
);
const TraceDemo = dynamic(
  () => import('@/projects/demo-showcase/components/demos/TraceDemo').then(m => m.TraceDemo),
  { ssr: false },
);
// ClipStream sim — dedicated wrapper so future edits to the
// carousel's ClipStream appearance / behaviour don't leak into the
// real /clipperstream page.
const ClipStreamSim = dynamic(
  () => import('@/projects/demo-showcase/components/simulations/ClipStreamSim').then(m => m.ClipStreamSim),
  { ssr: false },
);

interface ProjectConfig {
  label: string;
  headline: string;
  headlineSuffix?: string;
  caseStudyUrl: string;
  simDuration: number;
  canvasProps: React.ComponentProps<typeof DemoCanvas>;
  /** Whether the demo for this project requires microphone access.
   *  Drives whether the showcase shows the navbar-slot mic permission
   *  UI in place of the project pill while in demo mode. */
  needsMic?: boolean;
}

const PROJECTS: ProjectConfig[] = [
  {
    label: 'AI Confidence tracker',
    headline: 'A grammar checker, but for how confident AI is',
    headlineSuffix: ' in what it heard',
    caseStudyUrl: '#',
    simDuration: SIM_DURATION,
    needsMic: true,
    canvasProps: {
      tint: '#2E201E',
      tintOpacity: 0.08,
      textureOpacity: 0.6,
    },
  },
  {
    label: 'Trace',
    headline: 'Voice-powered finance journal',
    caseStudyUrl: '#',
    simDuration: TRACE_SIM_DURATION,
    needsMic: true,
    canvasProps: {
      tint: '#1C1917',
      tintOpacity: 0.06,
      textureOpacity: 0.6,
    },
  },
  {
    label: 'ClipStream',
    // Placeholder headline — keep under one mobile line; tune later.
    headline: 'Record and transcribe voice clips',
    caseStudyUrl: '#',
    simDuration: CLIPSTREAM_SIM_DURATION,
    // Warm pink variation from the lab — same colour family we proved
    // out there (#F09294 tint, flipped texture for pattern variety,
    // light pink card + muted dark-plum progress tokens).
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

export default function DemoShowcasePage() {
  const [[activeIdx, direction], setActive] = useState<[number, number]>([0, 0]);
  const [loopKey, setLoopKey] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const handleLoopRestart = useCallback(() => setLoopKey(k => k + 1), []);
  const totalRef = useRef(PROJECTS.length);

  // Kill-switch: one cancel signal + run-id ref per active demo slot.
  // See docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md.
  // - AI Confidence (idx 0): demo-mode-gated — sim and demo are mounted
  //   simultaneously when activeIdx === 0; toggling demo→sim must abort
  //   even though the demo isn't unmounting, hence the && isDemoMode.
  const aiConfidenceActive = activeIdx === 0 && isDemoMode;
  const aiConfidenceCancelSignal = useActiveAbortSignal(aiConfidenceActive);
  const aiConfidenceRunIdRef = useRunId(aiConfidenceActive);
  // - Trace (idx 1): demo-mode-gated like AI Confidence — sim and demo
  //   are mounted simultaneously; toggling demo→sim must abort even
  //   though the demo isn't unmounting.
  const traceActive = activeIdx === 1 && isDemoMode;
  const traceCancelSignal = useActiveAbortSignal(traceActive);
  const traceRunIdRef = useRunId(traceActive);
  // - ClipStream (idx 2): NOT demo-mode-gated — the sim slot mounts the
  //   real ClipMasterScreen; there is no separate demo. Cancellation fires
  //   when the user swipes away from ClipStream entirely. ClipStream's
  //   adapter routes abort into its existing handleCloseClick (X-button)
  //   path, which discards partial recording per product policy and
  //   preserves pending clips / IndexedDB / zustand store (durable state).
  const clipStreamActive = activeIdx === 2;
  const clipStreamCancelSignal = useActiveAbortSignal(clipStreamActive);

  // Mic permission state — single hook instance, lifted here so the
  // navbar slot and any future consumer share one source of truth.
  // The standalone /trace page renders its own MicPermissionBanner
  // which calls this hook independently; that's fine because it
  // doesn't run on the showcase page.
  const {
    micState,
    handleEnable,
    handleDismiss,
    handleReshow,
    handleDismissBlocked,
  } = useMicPermission();

  const go = useCallback((delta: number) => {
    setActive(([i]) => {
      const total = totalRef.current;
      const next = (i + delta + total) % total;
      return [next, delta];
    });
    setLoopKey(k => k + 1);
    // Navigation always resets to simulation — user must click Try Demo
    // each time to enter demo mode for the current project.
    setIsDemoMode(false);
  }, []);

  const handleToggleDemo = useCallback(() => {
    setIsDemoMode(m => !m);
  }, []);

  const handleViewCaseStudy = useCallback(() => {
    const url = PROJECTS[activeIdx].caseStudyUrl;
    if (url && url !== '#') window.location.href = url;
  }, [activeIdx]);

  // App-shell body lock: while this page is mounted, disable document
  // scroll + overscroll so iOS Safari does not trigger pull-to-refresh
  // on downward drags. Other pages in this app need scroll, so we
  // restore body state on unmount instead of using global CSS.
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

  const active = PROJECTS[activeIdx];

  // Show the navbar-slot mic banner instead of the project pill when:
  // (a) we're in demo mode, (b) the active project requires mic access,
  // and (c) permission isn't already granted (and we're not still
  // checking — `loading` falls through to the project pill to avoid
  // flashing the banner on first paint).
  const showMicInNavbar =
    isDemoMode &&
    active.needsMic === true &&
    (micState === 'unknown' || micState === 'dismissed' || micState === 'blocked');

  // Measure canvas-area height so neighbours enter/exit exactly one
  // "card height + gap" away — mimics a stacked film strip.
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
    <>
      <Head>
        <title>Demo Showcase</title>
        <meta name="description" content="Interactive demos of our projects" />
      </Head>

      <div className={`showcase ${isDemoMode ? 'is-demo' : ''}`}>
        <div className="nav-slot nav-desktop">
          {showMicInNavbar ? (
            <ShowcaseNavbarMicBanner
              // showMicInNavbar already narrows micState to the three
              // "needs UI" states; assert for the prop's narrower union.
              micState={micState as 'unknown' | 'dismissed' | 'blocked'}
              onEnable={handleEnable}
              onDismiss={handleDismiss}
              onReshow={handleReshow}
              onDismissBlocked={handleDismissBlocked}
            />
          ) : (
            <ShowcaseNavbarCompact
              projectName={active.label}
              currentIndex={activeIdx}
              totalCount={PROJECTS.length}
              onNext={() => go(1)}
              onPrev={() => go(-1)}
            />
          )}
        </div>
        <div className="nav-slot nav-mobile">
          <div className="mobile-nav-row">
            <div className="close-slot" aria-hidden={!isDemoMode}>
              <ShowcaseCloseBtnSmall onClick={handleToggleDemo} />
            </div>
            {showMicInNavbar ? (
              <ShowcaseNavbarMicBannerSmall
                micState={micState as 'unknown' | 'dismissed' | 'blocked'}
                onEnable={handleEnable}
                onDismiss={handleDismiss}
                onReshow={handleReshow}
                onDismissBlocked={handleDismissBlocked}
              />
            ) : (
              <ShowcaseNavbarCompactSmall
                projectName={active.label}
                currentIndex={activeIdx}
                totalCount={PROJECTS.length}
                onNext={() => go(1)}
                onPrev={() => go(-1)}
              />
            )}
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
                <div className={`chrome chrome-top ${isDemoMode ? 'chrome-hidden' : ''}`}>
                  <DemoIntroCard
                    headline={active.headline}
                    headlineSuffix={active.headlineSuffix}
                  />
                </div>
                <div className="sim-slot">
                  {/* AI Confidence tracker — sim + demo both mounted,
                      opacity toggles which is visible. */}
                  {activeIdx === 0 && (
                    <>
                      <div className={`layer layer-sim ${isDemoMode ? 'layer-hidden' : ''}`}>
                        <AIConfidenceSim key={loopKey} onLoopRestart={handleLoopRestart} />
                      </div>
                      <div className={`layer layer-demo ${!isDemoMode ? 'layer-hidden' : ''}`}>
                        <AIConfidenceDemo cancelSignal={aiConfidenceCancelSignal} runIdRef={aiConfidenceRunIdRef} />
                      </div>
                    </>
                  )}
                  {/* Trace — sim + demo. Same opacity-toggle pattern as
                      AI Confidence. Both layers mount when activeIdx === 1
                      so the demo→sim toggle is a visibility flip, not a
                      mount cycle. */}
                  {activeIdx === 1 && (
                    <>
                      <div className={`layer layer-sim ${isDemoMode ? 'layer-hidden' : ''}`}>
                        <TraceSim key={loopKey} onLoopRestart={handleLoopRestart} />
                      </div>
                      <div className={`layer layer-demo ${!isDemoMode ? 'layer-hidden' : ''}`}>
                        <TraceDemo cancelSignal={traceCancelSignal} runIdRef={traceRunIdRef} />
                      </div>
                    </>
                  )}
                  {/* ClipStream sim. Inline demo not yet split out. */}
                  {activeIdx === 2 && (
                    <div className="layer layer-sim">
                      <ClipStreamSim key={loopKey} onLoopRestart={handleLoopRestart} cancelSignal={clipStreamCancelSignal} />
                    </div>
                  )}
                </div>
                <div className={`chrome chrome-desktop ${isDemoMode ? 'chrome-hidden' : ''}`}>
                  <DemoProgressSection
                    duration={active.simDuration}
                    loopKey={loopKey}
                  />
                </div>
                <div className={`chrome chrome-mobile ${isDemoMode ? 'chrome-hidden' : ''}`}>
                  <DemoProgressSectionTransparent
                    duration={active.simDuration}
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
            <ViewCaseStudyButton onClick={handleViewCaseStudy} />
          </div>
          <div className="cta-buttons cta-mobile">
            <TryDemoButtonSmall
              onClick={handleToggleDemo}
              label={isDemoMode ? 'Play Simulation' : 'Try Demo'}
            />
            <ViewCaseStudyButtonSmall onClick={handleViewCaseStudy} />
          </div>
        </div>

        <style jsx>{`
          /* App-shell layout: pin to the visual viewport and stay out
             of document scroll. Disables iOS pull-to-refresh and
             overscroll rubber-band because there is no scroll
             container for the browser to act on. */
          .showcase {
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
          .nav-slot {
            width: 100%;
            position: relative;
            z-index: 2;
          }
          .nav-mobile { display: none; }
          @media (max-width: 768px) {
            .showcase {
              padding: 0 10px;
            }
            .nav-desktop { display: none; }
            .nav-mobile { display: block; }
            .mobile-nav-row {
              display: flex;
              align-items: flex-start;
              width: 100%;
            }
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
            .showcase.is-demo .close-slot {
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
          .showcase :global(.top-navbar-compact) {
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
            /* !important beats Framer Motion's inline touch-action:pan-x
               for drag="y". JS owns all gestures on this element. */
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
          @media (max-width: 768px) {
            .sim-slot :global(.layer.layer-demo) {
              transform: scale(0.8);
            }
            .sim-slot :global(.layer.layer-sim) {
              transform: scale(0.9);
            }
          }
          .chrome {
            opacity: 1;
            transition: opacity 0.25s ease;
          }
          .chrome.chrome-hidden {
            opacity: 0;
            pointer-events: none;
          }
          @media (max-width: 768px) {
            .chrome.chrome-top {
              margin-top: -6px;
            }
          }
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
          .cta-buttons.cta-mobile { display: none; }
          @media (max-width: 768px) {
            .cta-buttons.cta-desktop { display: none; }
            .cta-buttons.cta-mobile {
              display: flex;
              gap: 16px;
            }
            .cta-section {
              padding-top: 14px;
            }
            .showcase.is-demo .cta-section {
              max-height: 0;
              opacity: 0;
              padding-top: 0;
              padding-bottom: 0;
              pointer-events: none;
            }
          }
        `}</style>
      </div>
    </>
  );
}
