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
        Projects component — Trace AI widget in a brand-design card
        (381×298), four variants. Test scaffold; not the products page yet.
      </p>

      {/* Two variants side by side: chrome stripped vs full brand-card
          chrome. Both use the same TraceWidget, slot-scaled 0.8 to fit
          the 381×298 cell. */}
      <div
        style={{
          display: 'flex',
          gap: 56,
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {/* Variant A — chrome stripped (transparent bg, no border, label
            hidden). Uses .projects-card + innerBg="transparent". */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ width: 381, height: 298, display: 'flex' }}>
            <DemoCard
              label="Trace AI"
              className="projects-card"
              innerBg="transparent"
            >
              <div style={{ transform: 'scale(0.8)' }}>
                <TraceWidget />
              </div>
            </DemoCard>
          </div>
          <span
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
            }}
          >
            Chrome stripped
          </span>
        </div>

        {/* Variant B — full brand-card chrome kept (default DemoCard bg,
            borders + label). .projects-card-chrome only sizes it; no
            stripping overrides, no innerBg. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ width: 381, height: 298, display: 'flex' }}>
            <DemoCard label="Trace AI" className="projects-card-chrome">
              <div style={{ transform: 'scale(0.8)' }}>
                <TraceWidget />
              </div>
            </DemoCard>
          </div>
          <span
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
            }}
          >
            Full card chrome
          </span>
        </div>

        {/* Variant C — full chrome, but card-inner recoloured to
            #F7F6F4 via DemoCard's innerBg prop (the selected element). */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ width: 381, height: 298, display: 'flex' }}>
            <DemoCard
              label="Trace AI"
              className="projects-card-chrome"
              innerBg="#F7F6F4"
            >
              <div style={{ transform: 'scale(0.8)' }}>
                <TraceWidget />
              </div>
            </DemoCard>
          </div>
          <span
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
            }}
          >
            Inner #F7F6F4
          </span>
        </div>

        {/* Variant D — stripped like A, but .card-outer (the selected
            element) gets a white-5% background instead of transparent. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ width: 381, height: 298, display: 'flex' }}>
            <DemoCard
              label="Trace AI"
              className="projects-card-glass"
              innerBg="transparent"
            >
              <div style={{ transform: 'scale(0.8)' }}>
                <TraceWidget />
              </div>
            </DemoCard>
          </div>
          <span
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
            }}
          >
            Outer white 5%
          </span>
        </div>
      </div>

      <style jsx global>{`
        body,
        html {
          margin: 0;
          padding: 0;
          background: #0a0a09;
        }
        /* DemoCard's outer <div> has a fixed inline display:flex and is
           normally sized by the CarouselBrand grid cell; here both
           variants are sized to fill their 381×298 wrapper. */
        .projects-card,
        .projects-card-chrome,
        .projects-card-glass {
          width: 100%;
          height: 100%;
        }
        /* Stripped variants (A & D) — remove the brand-card chrome so
           only the widget shows; B/C (.projects-card-chrome) keep the
           default DemoCard bg/borders/label. !important because the
           component rules are styled-jsx-scoped and only tie otherwise.
           A's .card-outer is transparent; D's is white-5% (the only
           difference between them). Border AND the inset box-shadow
           (the faint edge line) both removed. */
        .projects-card .card-outer,
        .projects-card-glass .card-outer {
          border: none !important;
          box-shadow: none !important;
        }
        .projects-card .card-outer {
          background: transparent !important;
        }
        .projects-card-glass .card-outer {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .projects-card .card-inner,
        .projects-card-glass .card-inner {
          border: none !important;
        }
        /* Hide the DemoCard "Trace AI" label. Scope to a DIRECT child of
           .card-inner — the widget's own TotalAmtSpent also uses a
           nested .label span, so a broad descendant selector would
           wrongly blank the "Total amt" pill too. */
        .projects-card .card-inner > .label,
        .projects-card-glass .card-inner > .label {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
