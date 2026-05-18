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
 * handle onto another card to reorder (native HTML5 DnD). The order is
 * PERSISTED to localStorage (STORAGE_KEY below) so it survives reloads.
 * New ids added to VARIANTS are auto-appended; removed ids dropped
 * (see reconcileOrder) so the saved order stays valid over time.
 */
import React, { useEffect, useState } from 'react';
import styles from '@/projects/new-home/styles/new-home.module.css';
import DemoCard from '@/projects/new-home/components/DemoCard';
import TraceWidget from '@/projects/trace/components/TraceWidget';
import PreviewClipstream from '@/projects/new-home/components/previews/PreviewClipstream';
import PreviewAIConfidence from '@/projects/new-home/components/previews/PreviewAIConfidence';
import PreviewOllama from '@/projects/new-home/components/previews/PreviewOllama';
import PreviewVoiceAnimated from '@/projects/new-home/components/previews/PreviewVoiceAnimated';

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
    innerBg: '#131312',
    caption: 'Inner collar #131312 + outer border',
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
  // #1b Eclipse Dream — Clipstream, ALT outer collar #C5C3C0 (a warm
  // greige) instead of the white-2.5%. Same projects-card-glass chrome
  // so it inherits ALL the stripping (border/shadow none, inner border
  // none, label hidden); only .card-outer's bg is recoloured, via the
  // unique pc-card-clipstreamGreige subclass (doubled-class in the CSS
  // so it deterministically beats .projects-card-glass .card-outer).
  {
    id: 'clipstreamGreige',
    className: 'projects-card-glass',
    innerBg: 'transparent',
    caption: 'Clipstream — outer #C5C3C0',
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
    caption: 'AI Confidence — picture bg, mobile + outer border',
    content: <PreviewAIConfidence />,
  },
  // #3 Ollama (llama). PreviewOllama is position:absolute inset:0 and
  // paints its OWN background (.preview-ollama bg = --preview-ollama-bg
  // #1A1A19, dark) with the 3 expression PNGs cross-fading every 4s →
  // it fills the card-inner. Per the roadmap, start simple: the
  // outer-white style (projects-card-glass = white-2.5% .card-outer,
  // chrome stripped, label hidden), innerBg transparent. So the inner
  // is the preview's own #1A1A19 + llama; the 12px outer ring is the
  // white-2.5%. "Go with outer-white for now and see" — iterate per
  // review.
  {
    id: 'ollama',
    className: 'projects-card-glass',
    innerBg: 'transparent',
    caption: 'Ollama — outer white',
    content: <PreviewOllama />,
  },
  // #4 Voice URL library (Voice UI). PreviewVoiceAnimated is
  // position:absolute inset:0 but paints NO background of its own — it
  // relies on the card surface. Its design bg is --preview-voice-bg
  // (#F7F6F4, the Whimsy white). DEDICATED chrome class
  // `projects-card-voice` (its own profile — NOT the shared
  // `projects-card` stripped class) so it carries the SAME shared
  // double-border outer chrome as AI Confidence (transparent +
  // #2E2C29 border + 2 inset hairlines + outward drop, no glow), with
  // innerBg #F7F6F4 so the WebGL LoopingBlob sits on the Whimsy white
  // inside the framed outer. (LoopingBlob is R3F/WebGL; the headless
  // screenshot probe needs SwiftShader flags or the canvas won't
  // render.)
  {
    id: 'voice',
    className: 'projects-card-voice',
    innerBg: '#F7F6F4',
    caption: 'Voice UI — #F7F6F4 + outer border',
    content: <PreviewVoiceAnimated />,
  },
];

const BY_ID = Object.fromEntries(VARIANTS.map((v) => [v.id, v]));

const DEFAULT_ORDER = VARIANTS.map((v) => v.id);
// Bump the version suffix if the persisted shape ever changes.
const STORAGE_KEY = 'projects-component:order:v1';

// Merge a persisted order with the CURRENT VARIANTS: keep saved
// positions for ids that still exist (de-duped), append any NEW ids
// (in VARIANTS order) not in the saved list, and drop ids that no
// longer exist. Keeps the saved order valid as variants are added or
// removed (e.g. the upcoming roadmap cards).
const reconcileOrder = (saved: unknown): string[] => {
  if (!Array.isArray(saved)) return DEFAULT_ORDER;
  const valid = new Set(DEFAULT_ORDER);
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const id of saved) {
    if (typeof id === 'string' && valid.has(id) && !seen.has(id)) {
      kept.push(id);
      seen.add(id);
    }
  }
  for (const id of DEFAULT_ORDER) if (!seen.has(id)) kept.push(id);
  return kept;
};

export default function ProjectsComponentPage() {
  // SSR-safe: start from the default order (matches the server HTML so
  // there's no hydration mismatch), then hydrate from localStorage on
  // mount. There's a one-frame flash of default order on a custom-order
  // reload — acceptable for a test scaffold.
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [dragId, setDragId] = useState<string | null>(null);
  const [showHandles, setShowHandles] = useState(true);

  // Hydrate the saved order once, on mount (client only). NOTE: we do
  // NOT persist via a useEffect([order]) — under Next dev's React
  // Strict Mode that effect runs on mount with the DEFAULT order and
  // (double-invoked) races this read, clobbering storage back to
  // default. Instead persistence is done imperatively in reorder()
  // below, the only place the user changes the order. This effect is
  // therefore read-only and can't be clobbered by a mount write.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setOrder(reconcileOrder(JSON.parse(raw)));
    } catch {
      // Corrupt/unavailable storage → keep the default order.
    }
  }, []);

  // Move the dragged card to the dropped-on card's slot, and persist
  // the new order immediately (same array we commit to state). `order`
  // is the current state — reorder() only runs from an event handler.
  const reorder = (targetId: string) => {
    setDragId(null);
    if (!dragId || dragId === targetId) return;
    const without = order.filter((x) => x !== dragId);
    const at = without.indexOf(targetId);
    without.splice(at, 0, dragId);
    setOrder(without);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(without));
    } catch {
      // Quota/unavailable storage → order still works in-memory.
    }
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
        (381×298), eight variants. Drag a card's top-right handle onto
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

                {/* Each card carries its shared chrome class PLUS a
                    unique `pc-card-<id>` subclass. The shared class drives
                    the chrome treatment; the unique one lets the element
                    picker / CSS target exactly ONE variant even when two
                    share chrome (glass+clipstream, chrome+innerCream).
                    Convention: every new variant auto-gets pc-card-<id>. */}
                <DemoCard
                  label="Trace AI"
                  className={`${v.className} pc-card-${v.id}`}
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
        .projects-card-aiconf,
        .projects-card-voice {
          width: 100%;
          height: 100%;
        }
        /* Shared "double border line" outer chrome — used by the Trace
           card (glassBordered, variant E) AND the AI Confidence card.
           .card-outer: transparent fill + the DemoCard #2E2C29 border
           (kept — these selectors are NOT in the strip group below) +
           a no-glow box-shadow: two TIGHT inset hairlines (white-06 @
           .5px, white-12 @ .25px, 1px spread → the bright "second"
           border line just inside the dark #2E2C29 border) + the
           outward black-25% drop. NO soft glow. The 12px .card-outer
           padding ring is see-through (page shows between the outer
           border and the inner). glassBordered also moves the #131312
           collar onto .card-inner via innerBg; AI Confidence's inner
           is its own PreviewAIConfidence picture/transcript (untouched
           here). Voice UI (.projects-card-voice) also shares this
           chrome, with a #F7F6F4 inner (the WebGL blob's Whimsy white)
           inside the framed outer. Label hidden via the label-hide
           group. */
        .projects-card-glass-bordered .card-outer,
        .projects-card-aiconf .card-outer,
        .projects-card-voice .card-outer {
          background: transparent !important;
          box-shadow:
            0 0.5px 0.5px 1px rgba(255, 255, 255, 0.06) inset,
            0 0.25px 0.25px 1px rgba(255, 255, 255, 0.12) inset,
            0 14.211px 20.281px -5.477px rgba(0, 0, 0, 0.25) !important;
        }
        /* Stripped variants — remove the brand-card chrome so only the
           widget shows; .projects-card-chrome keeps the default
           DemoCard bg/borders/label. !important because the component
           rules are styled-jsx-scoped and only tie otherwise. A's
           .card-outer is transparent; the glass variant's is
           white-2.5%. (AI Confidence is NO LONGER stripped here — it
           now uses the shared double-border outer chrome above.)
           Border AND the inset box-shadow (the faint edge line) both
           removed. */
        .projects-card .card-outer,
        .projects-card-glass .card-outer {
          border: none !important;
          box-shadow: none !important;
        }
        .projects-card .card-outer {
          background: transparent !important;
        }
        .projects-card-glass .card-outer {
          background: rgba(255, 255, 255, 0.025) !important;
        }
        /* Clipstream ALT collar — #C5C3C0 greige outer instead of the
           white-2.5%. Doubled unique subclass (0,3,0) out-specifies
           .projects-card-glass .card-outer (0,2,0) regardless of source
           order. Scoped to this one variant only. */
        .pc-card-clipstreamGreige.pc-card-clipstreamGreige .card-outer {
          background: #c5c3c0 !important;
        }
        /* .card-inner border stripped for these variants. glassBordered
           is included here so that "move the collar to the inner" moves
           ONLY the colour — the inner gets the #131312 fill (via its
           innerBg prop) and NO border; the border stays solely on
           .card-outer (not moved). Without this, .card-inner falls back
           to DemoCard's default 1px #403D3A border (an unintended 2nd
           border). */
        .projects-card .card-inner,
        .projects-card-glass .card-inner,
        .projects-card-glass-bordered .card-inner,
        .projects-card-aiconf .card-inner,
        .projects-card-voice .card-inner {
          border: none !important;
        }
        /* Hide the DemoCard "Trace AI" label. Scope to a DIRECT child of
           .card-inner — the widget's own TotalAmtSpent also uses a
           nested .label span, so a broad descendant selector would
           wrongly blank the "Total amt" pill too. */
        .projects-card .card-inner > .label,
        .projects-card-glass .card-inner > .label,
        .projects-card-glass-bordered .card-inner > .label,
        .projects-card-aiconf .card-inner > .label,
        .projects-card-voice .card-inner > .label {
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
