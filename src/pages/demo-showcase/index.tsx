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

// ─── Project Configuration ─────────────────────────────────
const PROJECTS = [
  {
    name: 'AI Confidence tracker',
    description: 'A grammar checker, but for how confident AI is in what it heard',
    caseStudyUrl: '#',
    placeholderColor: '#FEF3C7',
    slotHeight: 400,
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
    slotHeight: 400,
  },
  {
    name: 'ClipStream',
    description: 'Record, transcribe, and organise voice clips instantly',
    caseStudyUrl: '#',
    placeholderColor: '#DBEAFE',
    slotHeight: 400,
  },
];

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loopKey, setLoopKey] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    const el = showcaseRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPanelHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const project = PROJECTS[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % PROJECTS.length);
    setLoopKey((k) => k + 1);
    setIsDemoMode(false); // always reset to simulation when switching projects
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + PROJECTS.length) % PROJECTS.length);
    setLoopKey((k) => k + 1);
    setIsDemoMode(false);
  }, []);

  const handleLoopRestart = useCallback(() => {
    setLoopKey((k) => k + 1);
  }, []);

  const handleToggleDemo = useCallback(() => {
    setIsDemoMode((prev) => !prev);
    if (!isDemoMode) {
      // Switching TO demo mode — reset loop key so sim restarts fresh when they switch back
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

  // ── Per-project progress bar duration ────────────────────
  const getSimDuration = () => {
    if (currentIndex === 0) return SIM_DURATION;
    if (currentIndex === 1) return TRACE_SIM_DURATION;
    return 5000; // placeholder default
  };

  // ── Render the right content in the slot ──────────────────
  const renderSlotContent = () => {
    if (isDemoMode) {
      if (currentIndex === 0) return <AIConfidenceDemo key={`demo-${currentIndex}`} />;
      // Other projects: placeholder for now
      return <PlaceholderSim key={`demo-${currentIndex}`} color={project.placeholderColor} name={`${project.name} demo`} />;
    }

    // Simulation mode
    if (currentIndex === 0) return <AIConfidenceSim key={loopKey} onLoopRestart={handleLoopRestart} />;
    if (currentIndex === 1) return <TraceSim key={loopKey} onLoopRestart={handleLoopRestart} />;
    return <PlaceholderSim key={`sim-${currentIndex}`} color={project.placeholderColor} name={project.name} />;
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
            currentIndex={currentIndex}
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
              style={{ transform: `translateY(-${currentIndex * panelHeight}px)` }}
            >
              {PROJECTS.map((p, i) => (
                <div
                  key={i}
                  className="slide-panel"
                  style={panelHeight > 0 ? { height: `${panelHeight}px` } : undefined}
                >
                  {i === currentIndex && (
                    <>
                      {!isDemoMode && <ShowcaseIntro description={p.description} />}
                      <ShowcaseSlot autoHeight={isDemoMode} height={p.slotHeight}>
                        {renderSlotContent()}
                      </ShowcaseSlot>
                      {!isDemoMode && (
                        <ShowcaseProgress duration={getSimDuration()} loopKey={loopKey} />
                      )}
                    </>
                  )}
                </div>
              ))}
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
          min-height: 100vh;
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
          align-self: stretch;
          max-width: 1160px;
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
          padding: 32px 116px 15px;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .slide-panel {
            padding: 10px 16px 10px;
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
