/**
 * Demo Showcase — Components page
 *
 * Renders every UI component used by the /demo-showcase carousel side-by-side
 * with all of its variants/states, so design + dev can review them without
 * having to drive the carousel into specific states (mic permissions,
 * recording, etc.).
 *
 * Route: /demo-showcase/showcase/components
 *
 * Pattern follows /pages/new-home/showcase/components.tsx, /pages/trace/
 * showcase/tracecomponent.tsx, etc.
 *
 * Add a new section here whenever a new showcase UI component is created.
 */

import React from 'react';
import Head from 'next/head';
import { ShowcaseNavbarCompact } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarCompact';
import { ShowcaseNavbarCompactSmall } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarCompactSmall';
import { ShowcaseNavbarMicBanner } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarMicBanner';
import { ShowcaseCloseBtnSmall } from '@/projects/demo-showcase/components/ui/ShowcaseCloseBtnSmall';
import { TryDemoButton, ViewCaseStudyButton } from '@/projects/demo-showcase/components/ui/ShowcaseButtons';
import { TryDemoButtonSmall, ViewCaseStudyButtonSmall } from '@/projects/demo-showcase/components/ui/ShowcaseButtonsSmall';
import { DemoIntroCard } from '@/projects/demo-showcase/components/ui/DemoIntroCard';
import { DemoProgressSection } from '@/projects/demo-showcase/components/ui/DemoProgressSection';
import { DemoProgressSectionTransparent } from '@/projects/demo-showcase/components/ui/DemoProgressSectionTransparent';

// Stable noop for components that need a callback we don't care about here.
const noop = () => {};

// Mobile-width container — used to constrain the previews of the *Small
// component variants so they render at their intended viewport width
// instead of stretching to fill the desktop preview column.
const MobileFrame: React.FC<{ children: React.ReactNode; width?: number }> = ({
  children,
  width = 360,
}) => (
  <div className="mobile-frame">
    {children}
    <style jsx>{`
      .mobile-frame {
        width: ${width}px;
        border: 1px dashed rgba(0, 0, 0, 0.12);
        border-radius: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.4);
      }
    `}</style>
  </div>
);

interface VariantProps {
  label: string;
  children: React.ReactNode;
}

const Variant: React.FC<VariantProps> = ({ label, children }) => (
  <div className="variant">
    <span className="variant-label">{label}</span>
    <div className="variant-stage">{children}</div>
    <style jsx>{`
      .variant {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .variant-label {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 12px;
        font-weight: 500;
        color: #6B6B68;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .variant-stage {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
    `}</style>
  </div>
);

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, description, children }) => (
  <section className="section">
    <header className="section-head">
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-desc">{description}</p>}
    </header>
    <div className="section-body">{children}</div>
    <style jsx>{`
      .section {
        padding: 32px 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      }
      .section:last-child {
        border-bottom: none;
      }
      .section-head {
        margin-bottom: 24px;
      }
      .section-title {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 20px;
        font-weight: 600;
        color: #2A2927;
        margin: 0 0 6px;
      }
      .section-desc {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 14px;
        color: #6B6B68;
        margin: 0;
        max-width: 720px;
        line-height: 1.5;
      }
      .section-body {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
    `}</style>
  </section>
);

export default function ShowcaseComponentsPage() {
  return (
    <>
      <Head>
        <title>Demo Showcase — Components</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="page">
        <header className="page-head">
          <h1 className="page-title">Demo Showcase — Components</h1>
          <p className="page-desc">
            Every UI component used by the <code>/demo-showcase</code> carousel,
            with all variants. Add new sections here whenever a new showcase
            component is built.
          </p>
        </header>

        {/* ──────────────────────────────────────────────────────────────
            TOP NAVBAR — DESKTOP
            ────────────────────────────────────────────────────────────── */}
        <Section
          title="Top navbar — desktop"
          description="Outer pill chrome stays constant across all four states; only the inner content swaps based on the active project + mic permission state. ShowcaseNavbarMicBanner replaces the project pill while a mic-needing demo is active and permission isn't yet granted."
        >
          <Variant label="Granted (default — project pill)">
            <ShowcaseNavbarCompact
              projectName="Trace"
              currentIndex={1}
              totalCount={3}
              onNext={noop}
              onPrev={noop}
            />
          </Variant>
          <Variant label="Mic state: unknown">
            <ShowcaseNavbarMicBanner
              micState="unknown"
              onEnable={noop}
              onDismiss={noop}
              onReshow={noop}
              onDismissBlocked={noop}
            />
          </Variant>
          <Variant label="Mic state: dismissed">
            <ShowcaseNavbarMicBanner
              micState="dismissed"
              onEnable={noop}
              onDismiss={noop}
              onReshow={noop}
              onDismissBlocked={noop}
            />
          </Variant>
          <Variant label="Mic state: blocked">
            <ShowcaseNavbarMicBanner
              micState="blocked"
              onEnable={noop}
              onDismiss={noop}
              onReshow={noop}
              onDismissBlocked={noop}
            />
          </Variant>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
            TOP NAVBAR — MOBILE
            ────────────────────────────────────────────────────────────── */}
        <Section
          title="Top navbar — mobile"
          description="Compact mobile variant of the navbar (~0.7× baked-in dimensions). The X close button sits to the left when the user is in demo mode. Mobile mic-banner variant lives in Stage 3 of the kill-switch / banner work and isn't yet built."
        >
          <Variant label="Project pill (granted)">
            <MobileFrame>
              <ShowcaseNavbarCompactSmall
                projectName="Trace"
                currentIndex={1}
                totalCount={3}
                onNext={noop}
                onPrev={noop}
              />
            </MobileFrame>
          </Variant>
          <Variant label="Close button (mobile demo mode)">
            <MobileFrame width={120}>
              <ShowcaseCloseBtnSmall onClick={noop} />
            </MobileFrame>
          </Variant>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
            CTA BUTTONS — DESKTOP
            ────────────────────────────────────────────────────────────── */}
        <Section
          title="CTA buttons — desktop"
          description='The primary CTA flips its label between "Try Demo" (sim playing) and "Play Simulation" (in demo mode), driven from the parent. View Case Study sits alongside.'
        >
          <Variant label="Try Demo (sim mode)">
            <TryDemoButton onClick={noop} label="Try Demo" />
          </Variant>
          <Variant label="Play Simulation (demo mode)">
            <TryDemoButton onClick={noop} label="Play Simulation" />
          </Variant>
          <Variant label="View Case Study">
            <ViewCaseStudyButton onClick={noop} />
          </Variant>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
            CTA BUTTONS — MOBILE
            ────────────────────────────────────────────────────────────── */}
        <Section
          title="CTA buttons — mobile"
          description="Mobile variants of the CTAs. Same label-swap pattern as desktop with an animated label crossfade."
        >
          <Variant label="Try Demo Small">
            <MobileFrame width={200}>
              <TryDemoButtonSmall onClick={noop} label="Try Demo" />
            </MobileFrame>
          </Variant>
          <Variant label="Play Simulation Small">
            <MobileFrame width={200}>
              <TryDemoButtonSmall onClick={noop} label="Play Simulation" />
            </MobileFrame>
          </Variant>
          <Variant label="View Case Study Small">
            <MobileFrame width={200}>
              <ViewCaseStudyButtonSmall onClick={noop} />
            </MobileFrame>
          </Variant>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
            DEMO INTRO CARD
            ────────────────────────────────────────────────────────────── */}
        <Section
          title="Demo intro card"
          description="Headline pill shown above the demo. headlineSuffix is desktop-only — kept in DOM for screen readers but visually hidden on mobile."
        >
          <Variant label="Headline only">
            <DemoIntroCard headline="Voice-powered finance journal" />
          </Variant>
          <Variant label="Headline + suffix (desktop-only)">
            <DemoIntroCard
              headline="A grammar checker, but for how confident AI is"
              headlineSuffix=" in what it heard"
            />
          </Variant>
        </Section>

        {/* ──────────────────────────────────────────────────────────────
            DEMO PROGRESS SECTION
            ────────────────────────────────────────────────────────────── */}
        <Section
          title="Demo progress"
          description="Sim-progress bar with caption. Default variant has a contained background; transparent variant drops the bg for mobile edge-to-edge layout."
        >
          <Variant label="Default (desktop)">
            <DemoProgressSection duration={6000} loopKey={0} />
          </Variant>
          <Variant label="Transparent (mobile)">
            <MobileFrame>
              <DemoProgressSectionTransparent duration={6000} loopKey={0} />
            </MobileFrame>
          </Variant>
        </Section>

        <style jsx>{`
          .page {
            min-height: 100vh;
            padding: 48px 32px 80px;
            background: #F2EFE9;
            font-family: 'Inter', system-ui, sans-serif;
          }
          .page-head {
            max-width: 880px;
            margin: 0 auto 32px;
          }
          .page-title {
            font-size: 28px;
            font-weight: 600;
            color: #1F1E1C;
            margin: 0 0 8px;
          }
          .page-desc {
            font-size: 14px;
            color: #6B6B68;
            line-height: 1.55;
            margin: 0;
          }
          .page-desc code {
            background: rgba(0, 0, 0, 0.05);
            padding: 1px 6px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            font-size: 13px;
          }
          .page :global(section) {
            max-width: 880px;
            margin: 0 auto;
          }
        `}</style>
      </main>
    </>
  );
}
