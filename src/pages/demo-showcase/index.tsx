import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { ShowcaseNavbar } from '@/projects/demo-showcase/components/ui/ShowcaseNavbar';
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

// Timing constants
import { SIM_DURATION } from '@/projects/demo-showcase/components/simulations/AIConfidenceSim';

// ─── Project Configuration ─────────────────────────────────
const PROJECTS = [
  {
    name: 'AI Confidence tracker',
    description: 'A grammar checker, but for how confident AI is in what it heard',
    caseStudyUrl: '#',
    placeholderColor: '#FEF3C7',
  },
  {
    name: 'Trace',
    description: 'Voice-powered finance journal. Know exactly what you spend.',
    caseStudyUrl: '#',
    placeholderColor: '#1C1917',
  },
  {
    name: 'Voice Interface',
    description: 'A voice-first conversational interface',
    caseStudyUrl: '#',
    placeholderColor: '#EDE9FE',
  },
  {
    name: 'ClipStream',
    description: 'Record, transcribe, and organise voice clips instantly',
    caseStudyUrl: '#',
    placeholderColor: '#DBEAFE',
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

  // ── Render the right content in the slot ──────────────────
  const renderSlotContent = () => {
    if (isDemoMode) {
      // Show the actual interactive demo for the current project
      if (currentIndex === 0) return <AIConfidenceDemo key={`demo-${currentIndex}`} />;
      // Other projects: placeholder for now
      return <PlaceholderSim key={`demo-${currentIndex}`} color={project.placeholderColor} name={`${project.name} demo`} />;
    }

    // Simulation mode
    if (currentIndex === 0) return <AIConfidenceSim key={loopKey} onLoopRestart={handleLoopRestart} />;
    return <PlaceholderSim key={`sim-${currentIndex}`} color={project.placeholderColor} name={project.name} />;
  };

  return (
    <>
      <Head>
        <title>Demo Showcase</title>
        <meta name="description" content="Interactive demos of our projects" />
      </Head>

      <div className="hero-banner">
        <div className="hero-card">
          <ShowcaseNavbar
            projectName={project.name}
            currentIndex={currentIndex}
            totalCount={PROJECTS.length}
            onNext={handleNext}
            onPrev={handlePrev}
          />

          <div className="demo-showcase">
            {/* Description + progress bar only show in simulation mode */}
            {!isDemoMode && <ShowcaseIntro description={project.description} />}

            <ShowcaseSlot>
              {renderSlotContent()}
            </ShowcaseSlot>

            {!isDemoMode && (
              <ShowcaseProgress
                duration={SIM_DURATION}
                loopKey={loopKey}
              />
            )}
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
        .hero-banner {
          display: flex;
          min-height: 100vh;
          flex-direction: column;
          align-items: center;
          background: #0F0E0D;
          backdrop-filter: blur(45px);
        }
        .hero-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          flex: 1;
          width: 100%;
          max-width: 1440px;
          border-radius: 12px;
          background: #FFF;
          overflow: hidden;
          position: relative;
        }
        .hero-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url('/images/demo-showcase/demo-bg-pattern.webp') center / cover no-repeat;
          opacity: 0.06;
          pointer-events: none;
          z-index: 0;
        }
        .hero-card > :global(*) {
          position: relative;
          z-index: 1;
        }
        .demo-showcase {
          display: flex;
          max-width: 1160px;
          padding: 50px 116px 15px;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 34px;
          flex: 1;
          align-self: stretch;
          margin: 0 auto;
        }
        .cta-section {
          display: flex;
          padding: 40px 0;
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
        @media (max-width: 768px) {
          .demo-showcase {
            padding: 30px 20px 15px;
          }
        }
      `}</style>
    </>
  );
}
