/**
 * Projects-component TEST PAGE (scaffold — not the products page yet).
 *
 * Purpose: pick up ONE brand-design card at its stipulated size
 * (CarouselBrand grid cell = 381×298) and slot the reusable
 * <TraceWidget/> into it, so the fit can be eyeballed/iterated before
 * moving it onto the real products page.
 *
 * Route: /new-home/projects-component
 *
 * Note on sizing: the brand card's inner content area is ≈ 357×272
 * (381×298 minus the 12px card-outer padding + borders). The Trace
 * widget is a fixed 301×315 — it is ~43px taller than the card's inner
 * area, so card-inner's `overflow:hidden` will clip it top/bottom. That
 * mismatch is the thing to decide here (scale the widget down, change
 * the card size, or adjust the widget) — left raw on purpose for this
 * test, not pre-solved.
 */
import React from 'react';
import styles from '@/projects/new-home/styles/new-home.module.css';
import DemoCard from '@/projects/new-home/components/DemoCard';
import TraceWidget from '@/projects/trace/components/TraceWidget';

export default function ProjectsComponentPage() {
  return (
    <div
      className={styles.pageContainer}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 40,
      }}
    >
      <p
        style={{
          color: 'rgba(255,255,255,0.45)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          margin: 0,
          textAlign: 'center',
        }}
      >
        Projects component — Trace AI widget slotted into a brand-design
        card (381×298). Test scaffold; not the products page yet.
      </p>

      {/* Brand-design card cell — exact CarouselBrand grid size. */}
      <div style={{ width: 381, height: 298, display: 'flex' }}>
        <DemoCard label="Trace AI" className="projects-card" innerBg="transparent">
          {/* Slot-level uniform scale (whole widget, not per-element).
              TraceWidget stays its canonical Figma size; the consumer
              scales it down ~20% (scale 0.8) to fit the 381×298 card.
              Adjust the factor to taste. */}
          <div style={{ transform: 'scale(0.8)' }}>
            <TraceWidget />
          </div>
        </DemoCard>
      </div>

      <style jsx global>{`
        body,
        html {
          margin: 0;
          padding: 0;
          background: #0a0a09;
        }
        /* DemoCard's outer <div> has a fixed inline display:flex and is
           normally sized by the CarouselBrand grid cell; here we size it
           to fill the 381×298 wrapper above. */
        .projects-card {
          width: 100%;
          height: 100%;
        }
        /* Test page: strip the brand-card chrome so only the widget
           shows. .card-outer (var(--card-bg) #201F1D) + its border, and
           .card-inner's border, all to zero. !important because the
           component rules are styled-jsx-scoped and only tie otherwise.
           (Inset box-shadow on .card-outer left as-is for now.) */
        .projects-card .card-outer {
          background: transparent !important;
          border: none !important;
        }
        .projects-card .card-inner {
          border: none !important;
        }
        /* Hide the DemoCard "Trace AI" label for the time being.
           Scope to a DIRECT child of .card-inner — the widget's own
           TotalAmtSpent also uses a nested .label span, so a broad
           ".projects-card .label" would wrongly blank the "Total amt"
           pill too. */
        .projects-card .card-inner > .label {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
