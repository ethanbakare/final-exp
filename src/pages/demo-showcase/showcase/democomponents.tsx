/**
 * Demo Showcase — Demo Components
 *
 * Renders every UI component used by the /demo-showcase carousel in
 * isolation. Mirrors the convention from /pages/voiceinterface/showcase/
 * voicecomponent.tsx — WHITE page bg (the demo-showcase components are
 * mostly designed for light surfaces), thin subtle dark cell borders,
 * tiny dark-faded labels at the bottom of each cell.
 *
 * Route: /demo-showcase/showcase/democomponents
 *
 * Add a new GridBox here whenever a new showcase component ships.
 */

import React from 'react';
import Head from 'next/head';
import showcaseStyles from '@/projects/demo-showcase/styles/showcase.module.css';
import { ShowcaseNavbarCompact } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarCompact';
import { ShowcaseNavbarCompactSmall } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarCompactSmall';
import { ShowcaseNavbarMicBanner } from '@/projects/demo-showcase/components/ui/ShowcaseNavbarMicBanner';
import { ShowcaseCloseBtnSmall } from '@/projects/demo-showcase/components/ui/ShowcaseCloseBtnSmall';
import { TryDemoButton, ViewCaseStudyButton } from '@/projects/demo-showcase/components/ui/ShowcaseButtons';
import { TryDemoButtonSmall, ViewCaseStudyButtonSmall } from '@/projects/demo-showcase/components/ui/ShowcaseButtonsSmall';
import { DemoIntroCard } from '@/projects/demo-showcase/components/ui/DemoIntroCard';
import { DemoProgressSection } from '@/projects/demo-showcase/components/ui/DemoProgressSection';
import { DemoProgressSectionTransparent } from '@/projects/demo-showcase/components/ui/DemoProgressSectionTransparent';

const noop = () => {};

/* Atomic cell sizes for components smaller than their container
   (buttons, close icon). Navbar variants use fullWidth instead so
   they're responsive like production. */
const NAVBAR_MOBILE_CELL_WIDTH = 360;

/* ─────────────────────────────────────────────────────────────────────
   GridBox — fixed-size cell with thin border + bottom label.
   Voice-components pattern: subtle dark border on white, dark faded label.
   ──────────────────────────────────────────────────────────────────── */
/* GridBox cell with two orthogonal layout knobs:
   - `width`: fixed cell width in px. Omit for fluid (100% of grid).
     Fluid = navbar variants (responsive like production). Fixed = atomic
     components shown at a specific size (buttons, close button, mobile
     project pill at 360 to mimic phone width).
   - `stretch`: when true, the inner content area is column-flex with
     align-items: stretch — children take 100% of cell width. Used for
     components that are designed to fill their parent (the navbar
     variants and mobile project pill — which has width:100% in its
     own CSS but needs a parent that gives it room to expand). When
     false (default), content is centred at its natural size — used
     for atomic components like buttons. */
type GridBoxProps = {
  children: React.ReactNode;
  label: string;
  height: number;
  width?: number;
  stretch?: boolean;
  canvasBackdrop?: boolean;
};

function GridBox({
  children,
  label,
  height,
  width,
  stretch = false,
  canvasBackdrop = false,
}: GridBoxProps) {
  const fluid = width === undefined;
  return (
    <div
      className={`grid-box ${canvasBackdrop ? 'grid-box-canvas' : ''} ${fluid ? 'grid-box-fluid' : ''}`}
      style={fluid ? { height } : { width, height }}
    >
      <div
        className={`grid-box-content ${stretch ? 'grid-box-content-stretch' : ''} ${canvasBackdrop ? showcaseStyles.demoCanvasRoot : ''}`}
      >
        {children}
      </div>
      <span className="grid-box-label">{label}</span>
      <style jsx>{`
        .grid-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0.8px solid rgba(38, 36, 36, 0.05);
          flex-shrink: 0;
          box-sizing: border-box;
          background: transparent;
        }
        /* Fluid cells claim the full row of the seamless-grid (which is
           display:flex). flex: 1 0 100% gives them the entire row width. */
        .grid-box-fluid {
          width: 100%;
          flex: 1 0 100%;
        }
        .grid-box-canvas {
          background: #F2EFE9;
        }
        /* Default content area: flex-centred. Atomic children stay at
           their natural size, vertically + horizontally centred. */
        .grid-box-content {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        /* Stretch content area: flex-column with align-items: stretch
           so children fill the cell width. The component's own CSS
           (justify-content: center, max-width caps) handles inner
           layout — no per-class :global() overrides needed. */
        .grid-box-content-stretch {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: stretch;
          width: 100%;
          height: 100%;
        }
        .grid-box-label {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Inter', sans-serif;
          font-size: 9px;
          font-weight: 400;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(94, 94, 94, 0.5);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SectionTitle — orange accent bar + uppercase label, dark text on white.
   ──────────────────────────────────────────────────────────────────── */
function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="section-title">
      <span className="section-accent" />
      {children}
      <style jsx>{`
        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(28, 28, 28, 0.65);
          margin: 0 0 28px;
        }
        .section-accent {
          width: 3px;
          height: 16px;
          background: #FB7232;
          border-radius: 2px;
          flex-shrink: 0;
        }
      `}</style>
    </h2>
  );
}

export default function DemoShowcaseComponentsPage() {
  return (
    <>
      <Head>
        <title>Demo Showcase — Demo Components</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="showcase-page">
        <h1 className="page-title">Demo Showcase — Demo Components</h1>
        <p className="page-subtitle">All components displayed in isolation</p>

        {/* ═══════════════════════════════════════════════════════════
            TOP NAVBAR — DESKTOP (4 STATES, all share .top-navbar-compact
            outer chrome ≈ 700×91 with full-width pill capped at 668px)
            ═══════════════════════════════════════════════════════════ */}
        <div className="section">
          <SectionTitle>Top Navbar — Desktop</SectionTitle>
          <div className="seamless-grid">
            <GridBox label="granted (project pill)" stretch height={100}>
              <ShowcaseNavbarCompact
                projectName="Trace"
                currentIndex={1}
                totalCount={3}
                onNext={noop}
                onPrev={noop}
              />
            </GridBox>
            <GridBox label="mic state · unknown" stretch height={100}>
              <ShowcaseNavbarMicBanner
                micState="unknown"
                onEnable={noop}
                onDismiss={noop}
                onReshow={noop}
                onDismissBlocked={noop}
              />
            </GridBox>
            <GridBox label="mic state · dismissed" stretch height={100}>
              <ShowcaseNavbarMicBanner
                micState="dismissed"
                onEnable={noop}
                onDismiss={noop}
                onReshow={noop}
                onDismissBlocked={noop}
              />
            </GridBox>
            <GridBox label="mic state · blocked" stretch height={100}>
              <ShowcaseNavbarMicBanner
                micState="blocked"
                onEnable={noop}
                onDismiss={noop}
                onReshow={noop}
                onDismissBlocked={noop}
              />
            </GridBox>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            TOP NAVBAR — MOBILE
            Cell width is constrained via contentMaxWidth so the mobile
            pill renders at its actual mobile-viewport width (343px),
            not stretched to the desktop cell width.
            ═══════════════════════════════════════════════════════════ */}
        <div className="section">
          <SectionTitle>Top Navbar — Mobile</SectionTitle>
          <div className="seamless-grid">
            <GridBox
              label="project pill (granted) · 0.7×"
              width={NAVBAR_MOBILE_CELL_WIDTH}
              height={100}
              stretch
            >
              <ShowcaseNavbarCompactSmall
                projectName="Trace"
                currentIndex={1}
                totalCount={3}
                onNext={noop}
                onPrev={noop}
              />
            </GridBox>
            <GridBox label="close button (demo mode)" width={120} height={100}>
              <ShowcaseCloseBtnSmall onClick={noop} />
            </GridBox>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CTA BUTTONS — DESKTOP
            ═══════════════════════════════════════════════════════════ */}
        <div className="section">
          <SectionTitle>CTA Buttons — Desktop</SectionTitle>
          <div className="seamless-grid">
            <GridBox label="try demo (sim mode)" width={240} height={100}>
              <TryDemoButton onClick={noop} label="Try Demo" />
            </GridBox>
            <GridBox label="play simulation (demo mode)" width={240} height={100}>
              <TryDemoButton onClick={noop} label="Play Simulation" />
            </GridBox>
            <GridBox label="view case study" width={240} height={100}>
              <ViewCaseStudyButton onClick={noop} />
            </GridBox>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CTA BUTTONS — MOBILE
            ═══════════════════════════════════════════════════════════ */}
        <div className="section">
          <SectionTitle>CTA Buttons — Mobile</SectionTitle>
          <div className="seamless-grid">
            <GridBox label="try demo small" width={200} height={100}>
              <TryDemoButtonSmall onClick={noop} label="Try Demo" />
            </GridBox>
            <GridBox label="play simulation small" width={200} height={100}>
              <TryDemoButtonSmall onClick={noop} label="Play Simulation" />
            </GridBox>
            <GridBox label="view case study small" width={200} height={100}>
              <ViewCaseStudyButtonSmall onClick={noop} />
            </GridBox>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            DEMO INTRO CARD
            ═══════════════════════════════════════════════════════════ */}
        <div className="section">
          <SectionTitle>Demo Intro Card</SectionTitle>
          <div className="seamless-grid">
            <GridBox label="headline only" width={500} height={120} canvasBackdrop>
              <DemoIntroCard headline="Voice-powered finance journal" />
            </GridBox>
            <GridBox
              label="headline + suffix (desktop-only)"
              width={720}
              height={120}
              canvasBackdrop
            >
              <DemoIntroCard
                headline="A grammar checker, but for how confident AI is"
                headlineSuffix=" in what it heard"
              />
            </GridBox>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            DEMO PROGRESS
            ═══════════════════════════════════════════════════════════ */}
        <div className="section">
          <SectionTitle>Demo Progress</SectionTitle>
          <div className="seamless-grid">
            <GridBox label="default (desktop)" width={720} height={120} canvasBackdrop>
              <DemoProgressSection duration={6000} loopKey={0} />
            </GridBox>
            <GridBox label="transparent (mobile)" width={400} height={120} canvasBackdrop>
              <DemoProgressSectionTransparent duration={6000} loopKey={0} />
            </GridBox>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body, html { margin: 0; padding: 0; background-color: #FFFFFF; }
      `}</style>

      <style jsx>{`
        .showcase-page {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 80px 24px 120px;
          box-sizing: border-box;
        }

        .page-title {
          font-family: 'Inter', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: #1C1C1C;
          margin: 0 0 6px;
        }

        .page-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(28, 28, 28, 0.45);
          margin: 0 0 64px;
        }

        .section {
          margin-bottom: 0;
          padding: 48px 0;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .section:first-of-type {
          border-top: none;
          padding-top: 0;
        }

        /* Seamless grid — Trace / new-home / voice pattern. Cell borders
           touch. display: flex (block-level) so the grid fills the
           section width — necessary for fullWidth cells which take 100%
           of the grid. Atomic cells still wrap as normal flex children. */
        .seamless-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0;
          margin-left: -0.8px;
          margin-top: -0.8px;
        }

        @media (max-width: 768px) {
          .seamless-grid {
            display: flex;
            justify-content: center;
            max-width: 100%;
            overflow-x: auto;
          }
        }
      `}</style>
    </>
  );
}
