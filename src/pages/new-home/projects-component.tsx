/**
 * Projects-component TEST PAGE (scaffold — not the products page yet).
 *
 * Purpose: pick up ONE brand-design card at its stipulated size
 * (CarouselBrand grid cell = 381×298) and slot the reusable
 * <TraceWidget/> into it, across several card-chrome variants, so the
 * fit/treatment can be eyeballed/iterated before moving onto the real
 * products page.
 *
 * Route: /new-home/projects-component
 *
 * Reorder: each card has a drag handle in its top-right corner. Drag a
 * handle onto another card to reorder (native HTML5 DnD, local state
 * only — purely a test-scaffold convenience, nothing persisted).
 */
import React, { useState } from 'react';
import styles from '@/projects/new-home/styles/new-home.module.css';
import DemoCard from '@/projects/new-home/components/DemoCard';
import TraceWidget from '@/projects/trace/components/TraceWidget';
import PreviewClipstream from '@/projects/new-home/components/previews/PreviewClipstream';
import PreviewAIConfidence from '@/projects/new-home/components/previews/PreviewAIConfidence';

type Variant = {
  id: string;
  className: string;
  innerBg?: string;
  caption: string;
  content: React.ReactNode; // the widget slotted into the card
};

// Trace widget slot, scaled 0.8 to fit the 381×298 card (shared by the
// first five chrome variants).
const traceSlot = (
  <div style={{ transform: 'scale(0.8)' }}>
    <TraceWidget />
  </div>
);

// Order here is the initial order; the page keeps its own reorderable
// copy in state.
const VARIANTS: Variant[] = [
  { id: 'stripped', className: 'projects-card', innerBg: 'transparent', caption: 'Chrome stripped', content: traceSlot },
  { id: 'chrome', className: 'projects-card-chrome', caption: 'Full card chrome', content: traceSlot },
  { id: 'innerCream', className: 'projects-card-chrome', innerBg: '#F7F6F4', caption: 'Inner #F7F6F4', content: traceSlot },
  { id: 'glass', className: 'projects-card-glass', innerBg: 'transparent', caption: 'Outer white 2.5%', content: traceSlot },
  {
    id: 'glassBordered',
    className: 'projects-card-glass-bordered',
    innerBg: 'transparent',
    caption: 'White 2.5% + chrome border',
    content: traceSlot,
  },
  // #1 Eclipse Dream — Clipstream voice-clip in the outer-white style.
  // Rendered via PreviewClipstream (the same wrapper the demos carousel
  // uses): position:absolute inset:0 fills the card-inner and centres
  // VoiceTextBoxClip at its NATURAL wide size — no scale, no width
  // change (a bare <VoiceTextBoxClip> collapsed to a square; this keeps
  // its normal shape). It's ~393 wide vs the ~357 card-inner so it may
  // clip slightly at the edges — the fit is the next thing to iterate,
  // not by squashing the width.
  {
    id: 'clipstream',
    className: 'projects-card-glass',
    innerBg: 'transparent',
    caption: 'Clipstream — outer white',
    content: <PreviewClipstream />,
  },
  // #2 AI Confidence Tracker. PreviewAIConfidence already paints its
  // OWN picture background (.bg-image = wt1.webp) + a white transcript
  // box, position:absolute inset:0 → it fills the card-inner. So use
  // the STRIPPED card (transparent, no chrome) — the preview's picture
  // bg becomes the card surface (NOT the outer-white). The page then
  // forces the component's own `@media (max-width:620px)` "mobile"
  // transcript-box layout (it can't fire off viewport width inside a
  // 381 card) via a scoped override — see .projects-card-aiconf CSS.
  {
    id: 'aiConfidence',
    className: 'projects-card-aiconf',
    innerBg: 'transparent',
    caption: 'AI Confidence — picture bg + mobile style',
    content: <PreviewAIConfidence />,
  },
];

const BY_ID = Object.fromEntries(VARIANTS.map((v) => [v.id, v]));

export default function ProjectsComponentPage() {
  const [order, setOrder] = useState<string[]>(VARIANTS.map((v) => v.id));
  const [dragId, setDragId] = useState<string | null>(null);
  const [showHandles, setShowHandles] = useState(true);

  // Move the dragged card to the dropped-on card's slot.
  const reorder = (targetId: string) => {
    setDragId(null);
    if (!dragId || dragId === targetId) return;
    setOrder((prev) => {
      const without = prev.filter((x) => x !== dragId);
      const at = without.indexOf(targetId);
      without.splice(at, 0, dragId);
      return without;
    });
  };

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
      {/* Fixed toggle (bottom-right) — show/hide the per-card drag
          handles so the cards can be viewed clean. */}
      <button
        type="button"
        onClick={() => setShowHandles((s) => !s)}
        title={showHandles ? 'Hide drag handles' : 'Show drag handles'}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.7)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 13, lineHeight: 1 }}>⠿</span>
        {showHandles ? 'Handles: On' : 'Handles: Off'}
      </button>

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
        (381×298), seven variants. Drag a card's top-right handle onto
        another to reorder. Test scaffold; not the products page yet.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 56,
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {order.map((id) => {
          const v = BY_ID[id];
          const isDragging = dragId === id;
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                opacity: isDragging ? 0.4 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorder(id)}
                style={{
                  position: 'relative',
                  width: 381,
                  height: 298,
                  display: 'flex',
                }}
              >
                {/* Drag handle — top-right corner. Only this element is
                    draggable; drop onto any card to reorder. Hidden when
                    the page-level toggle is off (view cards clean). */}
                {showHandles && (
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDragId(id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    title="Drag to reorder"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 20,
                      width: 26,
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.65)',
                      fontSize: 13,
                      lineHeight: 1,
                      cursor: 'grab',
                      userSelect: 'none',
                    }}
                  >
                    ⠿
                  </div>
                )}

                <DemoCard
                  label="Trace AI"
                  className={v.className}
                  innerBg={v.innerBg}
                >
                  {v.content}
                </DemoCard>
              </div>
              <span
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                }}
              >
                {v.caption}
              </span>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        body,
        html {
          margin: 0;
          padding: 0;
          background: #0a0a09;
        }
        /* DemoCard's outer <div> has a fixed inline display:flex and is
           normally sized by the CarouselBrand grid cell; here all
           variants are sized to fill their 381×298 wrapper. */
        .projects-card,
        .projects-card-chrome,
        .projects-card-glass,
        .projects-card-glass-bordered,
        .projects-card-aiconf {
          width: 100%;
          height: 100%;
        }
        /* Variant E — white-2.5% .card-outer like D, but the DemoCard
           default border + inset shadow ("extreme outer borderline")
           are NOT stripped (kept from the full-chrome variant). Label
           hidden + inner border none, matching the glass look. */
        .projects-card-glass-bordered .card-outer {
          background: rgba(255, 255, 255, 0.025) !important;
        }
        /* Stripped variants (A & D) — remove the brand-card chrome so
           only the widget shows; B/C (.projects-card-chrome) keep the
           default DemoCard bg/borders/label. !important because the
           component rules are styled-jsx-scoped and only tie otherwise.
           A's .card-outer is transparent; D's is white-2.5% (the only
           difference between them). Border AND the inset box-shadow
           (the faint edge line) both removed. */
        .projects-card .card-outer,
        .projects-card-glass .card-outer,
        .projects-card-aiconf .card-outer {
          border: none !important;
          box-shadow: none !important;
        }
        .projects-card .card-outer,
        .projects-card-aiconf .card-outer {
          background: transparent !important;
        }
        .projects-card-glass .card-outer {
          background: rgba(255, 255, 255, 0.025) !important;
        }
        .projects-card .card-inner,
        .projects-card-glass .card-inner,
        .projects-card-glass-bordered .card-inner,
        .projects-card-aiconf .card-inner {
          border: none !important;
        }
        /* Hide the DemoCard "Trace AI" label. Scope to a DIRECT child of
           .card-inner — the widget's own TotalAmtSpent also uses a
           nested .label span, so a broad descendant selector would
           wrongly blank the "Total amt" pill too. */
        .projects-card .card-inner > .label,
        .projects-card-glass .card-inner > .label,
        .projects-card-glass-bordered .card-inner > .label,
        .projects-card-aiconf .card-inner > .label {
          display: none !important;
        }

        /* #2 AI Confidence — force PreviewAIConfidence's own
           @media (max-width:620px) "mobile" transcript-box layout. That
           media query can't fire inside a 381px card on a wide viewport,
           so mirror its exact values here, scoped to this variant.
           Doubled class + !important to out-specify the component's
           styled-jsx-scoped rules. */
        .projects-card-aiconf.projects-card-aiconf .transcript-box {
          width: 93.68% !important;
          height: 92.2% !important;
          right: -6.87% !important;
          bottom: -25.89% !important;
          padding: 25.551px 19.163px !important;
          border-radius: 20.441px !important;
        }
        .projects-card-aiconf.projects-card-aiconf .transcript-content {
          gap: 12.775px !important;
        }
        .projects-card-aiconf.projects-card-aiconf .text-area {
          padding: 28px 23px 12px 23px !important;
        }
      `}</style>
    </div>
  );
}
