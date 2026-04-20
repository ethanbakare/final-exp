import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { ShowcaseNavbar } from '@/projects/demo-showcase/components/ui/ShowcaseNavbar';
import { ShowcaseNavbarCompact } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarCompact';
import { TryDemoButton, ViewCaseStudyButton } from '@/projects/demo-showcase/components/ui/ShowcaseButtons';
import { ShowcaseProgress } from '@/projects/demo-showcase/components/ui/ShowcaseProgress';
import { ShowcaseIntro } from '@/projects/demo-showcase/components/ui/ShowcaseIntro';
import { ShowcaseSlot } from '@/projects/demo-showcase/components/ui/ShowcaseSlot';

// Dynamic imports (SSR-unsafe components)
const AIConfidenceSim = dynamic(
  () => import('@/projects/demo-showcase/components/simulations/AIConfidenceSim').then(m => m.AIConfidenceSim),
  { ssr: false }
);
const AIConfidenceDemo = dynamic(
  () => import('@/projects/demo-showcase/components/demos/AIConfidenceDemo').then(m => m.AIConfidenceDemo),
  { ssr: false }
);
const TraceSim = dynamic(
  () => import('@/projects/demo-showcase/components/simulations/TraceSim').then(m => m.TraceSim),
  { ssr: false }
);
const TraceDemo = dynamic(
  () => import('@/pages/trace/index').then(m => m.default),
  { ssr: false }
);

// Timing constants
import { SIM_DURATION } from '@/projects/demo-showcase/components/simulations/AIConfidenceSim';
import { TRACE_SIM_DURATION } from '@/projects/demo-showcase/components/simulations/TraceSim';

// Slide transition — keep in sync with CSS transition-duration on .slide-track
const SLIDE_DURATION_MS = 420;

// ─── Project Configuration ─────────────────────────────────
const PROJECTS = [
  {
    name: 'AI Confidence tracker',
    description: 'A grammar checker, but for how confident AI is in what it heard',
    caseStudyUrl: '#',
    placeholderColor: '#FEF3C7',
    slotHeight: 500,
  },
  {
    name: 'Trace',
    description: 'Voice-powered finance journal. Know exactly what you spend.',
    caseStudyUrl: '#',
    placeholderColor: '#1C1917',
    slotHeight: 500,
  },
  {
    name: 'Voice Interface',
    description: 'A voice-first conversational interface',
    caseStudyUrl: '#',
    placeholderColor: '#EDE9FE',
    slotHeight: 500,
  },
  {
    name: 'ClipStream',
    description: 'Record, transcribe, and organise voice clips instantly',
    caseStudyUrl: '#',
    placeholderColor: '#DBEAFE',
    slotHeight: 500,
  },
];

// Virtual track layout: [clone-of-last, ...PROJECTS, clone-of-first].
// Sliding past the last real panel lands on the right clone (which looks like
// the first real panel); once the slide settles, we snap back to the real
// first panel with transitions disabled so the loop feels continuous.
const LEFT_CLONE = 0;
const FIRST_REAL = 1;
const LAST_REAL = PROJECTS.length;
const RIGHT_CLONE = PROJECTS.length + 1;

const virtualToReal = (v: number): number => {
  if (v === LEFT_CLONE) return PROJECTS.length - 1;
  if (v === RIGHT_CLONE) return 0;
  return v - 1;
};

// ─── Placeholder Simulation ────────────────────────────────
const PlaceholderSim: React.FC<{ color: string; name: string }> = ({ color, name }) => (
  <div className="placeholder-sim">
    <span className="placeholder-label">{name} simulation</span>
    <style jsx>{`
      .placeholder-sim {
        width: 100%;
        height: 333px;
        border-radius: 16px;
        background: ${color};
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .placeholder-label {
        font-family: 'Open Runde', 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.3);
      }
    `}</style>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────
export default function DemoShowcasePage() {
  const [virtualIndex, setVirtualIndex] = useState(FIRST_REAL);
  const [activeSimIndex, setActiveSimIndex] = useState(0);
  const [loopKey, setLoopKey] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const [noTransition, setNoTransition] = useState(true);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const realIndex = virtualToReal(virtualIndex);
  const project = PROJECTS[realIndex];

  // Measure panel height; keep in sync with viewport resizes
  useEffect(() => {
    const el = showcaseRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPanelHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Enable transitions once the track has a real size, and after any snap
  useEffect(() => {
    if (panelHeight > 0 && noTransition) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setNoTransition(false));
      });
    }
  }, [panelHeight, noTransition]);

  // After the slide lands: swap the active sim, and if we're on a clone
  // panel, snap back to the matching real panel with transitions off.
  useEffect(() => {
    if (realIndex === activeSimIndex) return;
    const t = setTimeout(() => {
      setActiveSimIndex(realIndex);
      setLoopKey((k) => k + 1);
      if (virtualIndex === LEFT_CLONE) {
        setNoTransition(true);
        setVirtualIndex(LAST_REAL);
      } else if (virtualIndex === RIGHT_CLONE) {
        setNoTransition(true);
        setVirtualIndex(FIRST_REAL);
      }
    }, SLIDE_DURATION_MS);
    return () => clearTimeout(t);
  }, [virtualIndex, activeSimIndex, realIndex]);

  const handleNext = useCallback(() => {
    setVirtualIndex((v) => Math.min(v + 1, RIGHT_CLONE));
    setIsDemoMode(false);
  }, []);

  const handlePrev = useCallback(() => {
    setVirtualIndex((v) => Math.max(v - 1, LEFT_CLONE));
    setIsDemoMode(false);
  }, []);

  const handleLoopRestart = useCallback(() => {
    setLoopKey((k) => k + 1);
  }, []);

  const handleToggleDemo = useCallback(() => {
    setIsDemoMode((prev) => !prev);
    if (!isDemoMode) {
      setLoopKey((k) => k + 1);
    }
  }, [isDemoMode]);

  const handleViewCaseStudy = useCallback(() => {
    window.location.href = project.caseStudyUrl;
  }, [project.caseStudyUrl]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 50) {
      if (delta > 0) handleNext();
      else handlePrev();
    }
  }, [handleNext, handlePrev]);

  const getSimDuration = (idx: number) => {
    if (idx === 0) return SIM_DURATION;
    if (idx === 1) return TRACE_SIM_DURATION;
    return 5000;
  };

  const renderSimForPanel = (idx: number) => {
    const p = PROJECTS[idx];
    if (isDemoMode) {
      if (idx === 0) return <AIConfidenceDemo key={`demo-${idx}`} />;
      return <PlaceholderSim key={`demo-${idx}`} color={p.placeholderColor} name={`${p.name} demo`} />;
    }
    if (idx === 0) return <AIConfidenceSim key={loopKey} onLoopRestart={handleLoopRestart} />;
    if (idx === 1) return <TraceSim key={loopKey} onLoopRestart={handleLoopRestart} />;
    return <PlaceholderSim key={`sim-${idx}`} color={p.placeholderColor} name={p.name} />;
  };

  // Clones render the same intro and slot frame but never mount the sim
  // or progress bar — they only exist to give the slide somewhere to land.
  const renderPanel = (realIdx: number, keyName: string, isClone: boolean) => {
    const p = PROJECTS[realIdx];
    return (
      <div
        key={keyName}
        className="slide-panel"
        style={panelHeight > 0 ? { height: `${panelHeight}px` } : undefined}
      >
        {!isDemoMode && <ShowcaseIntro description={p.description} />}
        <ShowcaseSlot autoHeight={isDemoMode} height={p.slotHeight}>
          {!isClone && realIdx === activeSimIndex ? renderSimForPanel(realIdx) : null}
        </ShowcaseSlot>
        {!isDemoMode && !isClone && realIdx === activeSimIndex && (
          <ShowcaseProgress duration={getSimDuration(realIdx)} loopKey={loopKey} />
        )}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Demo Showcase</title>
        <meta name="description" content="Interactive demos of our projects" />
      </Head>

      <div className="demo-banner">
        <div className="demo-project">
          <div className="bg-pattern" aria-hidden="true" />
          <ShowcaseNavbarCompact
            projectName={project.name}
            currentIndex={realIndex}
            totalCount={PROJECTS.length}
            onNext={handleNext}
            onPrev={handlePrev}
          />

          <div
            className="demo-showcase"
            ref={showcaseRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="slide-track"
              style={{
                transform: `translateY(-${virtualIndex * panelHeight}px)`,
                transition: noTransition ? 'none' : undefined,
              }}
            >
              {renderPanel(PROJECTS.length - 1, 'clone-left', true)}
              {PROJECTS.map((_, i) => renderPanel(i, `real-${i}`, false))}
              {renderPanel(0, 'clone-right', true)}
            </div>
          </div>

          <div className="cta-section">
            <div className="cta-buttons">
              <TryDemoButton
                onClick={handleToggleDemo}
                label={isDemoMode ? 'Play Simulation' : 'Try Demo'}
              />
              <ViewCaseStudyButton onClick={handleViewCaseStudy} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .demo-banner {
          display: flex;
          height: 100vh;
          flex-direction: column;
          align-items: center;
          backdrop-filter: blur(45px);
        }
        .demo-project {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          flex: 1;
          min-height: 0;
          width: 100%;
          max-width: 1440px;
          background: #FFF;
          overflow: hidden;
          position: relative;
        }
        .bg-pattern {
          position: absolute;
          inset: 0;
          background: url('/images/demo-showcase/demo-bg-pattern.webp') center / cover no-repeat;
          opacity: 0.03;
          pointer-events: none;
          z-index: 0;
        }
        .demo-project > :global(*:not(.bg-pattern)) {
          position: relative;
          z-index: 1;
        }
        .demo-showcase {
          flex: 1;
          min-height: 0;
          align-self: stretch;
          max-width: 1160px;
          width: 100%;
          margin: 0 auto;
          overflow: hidden;
          position: relative;
        }
        .slide-track {
          display: flex;
          flex-direction: column;
          width: 100%;
          transition: transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change: transform;
        }
        .slide-panel {
          width: 100%;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 0 116px;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .slide-panel {
            padding: 0 16px;
            gap: 16px;
          }
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
    </>
  );
}
