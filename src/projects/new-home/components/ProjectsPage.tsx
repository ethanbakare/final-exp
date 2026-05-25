/**
 * Projects page — the real "all projects" page (NOT the
 * projects-component test scaffold). Route: /projects.
 *
 * Lists every project as a card in the SAME grid syntax as the brand
 * carousel (CarouselBrand): grid, repeat(3,381px), 298px rows, gap 15,
 * centered; → 2 cols ≤1200px → 1 col (aspect-ratio) ≤800px. Home-page
 * gradient background (styles.pageContainer).
 *
 * Cards (curated, one per project, with the chosen treatments):
 *   • 5 AI demos — Trace AI / Clipstream / Voice UI / Ollama /
 *     AI Confidence — each with the exact chrome treatment finalised
 *     on the projects-component scaffold + its bottom tag, linking to
 *     its real project page.
 *   • 6 brand-portfolio cards — image cards, their /portfolio2025/*
 *     (etc.) hrefs (same as CarouselBrand).
 *
 * Each card is a real link (DemoCard href → <a>). Drag-to-reorder is
 * a DEV-ONLY tool: the per-card handles + the toggle are HIDDEN in
 * production (showHandles=false; flip to true locally to reorder).
 * The reorder/persistence code is kept dormant; it can be fully
 * removed on request. Order shown = the PROJECTS array order (or a
 * localStorage-saved order on a browser that reordered in dev).
 */
import React, { useEffect, useState } from 'react';
import styles from '@/projects/new-home/styles/new-home.module.css';
import DemoCard from '@/projects/new-home/components/DemoCard';
import TraceWidget from '@/projects/trace/components/TraceWidget';
import PreviewClipstream from '@/projects/new-home/components/previews/PreviewClipstream';
import PreviewAIConfidence from '@/projects/new-home/components/previews/PreviewAIConfidence';
import PreviewOllama from '@/projects/new-home/components/previews/PreviewOllama';
import PreviewVoiceAnimated from '@/projects/new-home/components/previews/PreviewVoiceAnimated';

type LabelPosition =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right';

type Project = {
  id: string;
  className: string; // chrome class; a unique pc-card-<id> is appended
  innerBg?: string;
  label: string;
  labelBg: string;
  labelTextColor?: string;
  labelPosition?: LabelPosition;
  href: string;
  content: React.ReactNode;
};

// Trace widget scaled 0.8 to fit the 381×298 cell (same slot the
// projects-component scaffold used).
const traceSlot = (
  <div style={{ transform: 'scale(0.8)' }}>
    <TraceWidget />
  </div>
);

const brandImg = (src: string, alt: string) => (
  <img src={src} alt={alt} className="card-image" draggable={false} />
);

// Initial order. Drag-reorder persists a per-user copy in localStorage.
const PROJECTS: Project[] = [
  // ---- AI demos (chosen treatments from the scaffold) ----
  {
    id: 'aiconf',
    className: 'projects-card-aiconf',
    innerBg: 'transparent',
    label: 'AI Confidence tracker',
    labelBg: 'rgba(128, 34, 63, 0.40)',
    labelPosition: 'bottom-left',
    href: '/ai-confidence-tracker',
    content: <PreviewAIConfidence />,
  },
  {
    id: 'trace',
    className: 'projects-card-glass-bordered',
    innerBg: '#FFF6DA',
    label: 'Trace AI',
    labelBg: 'rgba(113, 113, 113, 0.50)',
    labelTextColor: 'rgba(255, 255, 255, 0.80)',
    labelPosition: 'bottom-left',
    href: '/trace',
    content: traceSlot,
  },
  {
    id: 'ollama',
    className: 'projects-card-ollamaborder',
    innerBg: 'transparent',
    label: 'Ollama',
    labelBg: 'rgba(255, 255, 255, 0.30)',
    href: '/ollama',
    content: <PreviewOllama />,
  },
  {
    id: 'clipstream',
    className: 'projects-card-clipgreige',
    innerBg: '#C5C3C0',
    label: 'Clipstream',
    labelBg: 'rgba(113, 113, 113, 0.50)',
    labelTextColor: 'rgba(255, 255, 255, 0.80)',
    href: '/clipperstream',
    content: <PreviewClipstream />,
  },
  {
    id: 'voice',
    className: 'projects-card-voice',
    innerBg: '#F7F6F4',
    label: 'Voice UI Library',
    labelBg: 'rgba(113, 113, 113, 0.50)',
    // Match the home-page Voice UI card -> the OpenAI realtime page.
    href: '/voiceinterface/realtime',
    content: <PreviewVoiceAnimated />,
  },
  // ---- Brand-portfolio (image cards, same hrefs as CarouselBrand) ----
  {
    id: 'brand-eldugo',
    className: 'projects-card-brand',
    label: 'Eldugo - Branding',
    labelBg: 'rgba(34, 34, 34, 0.70)',
    href: '/portfolio2025/eldugo',
    content: brandImg('/images/new-home/brand/eldugo.webp', 'Eldugo - Branding'),
  },
  {
    id: 'brand-logofolio',
    className: 'projects-card-brand',
    label: 'Logofolio',
    labelBg: 'rgba(34, 34, 34, 0.70)',
    href: '/portfolio2025/logo',
    content: brandImg('/images/new-home/brand/logofolio.webp', 'Logofolio'),
  },
  {
    id: 'brand-activeledger',
    className: 'projects-card-brand',
    label: 'ActiveLedger - Branding',
    labelBg: 'rgba(34, 34, 34, 0.70)',
    href: '/portfolio2025/activeledger',
    content: brandImg('/images/new-home/brand/activeledger.webp', 'ActiveLedger - Branding'),
  },
  {
    id: 'brand-magma',
    className: 'projects-card-brand',
    label: 'Magma - Pitch Deck',
    labelBg: 'rgba(34, 34, 34, 0.70)',
    href: '/portfolio2025/magmadeck',
    content: brandImg('/images/new-home/brand/magma.webp', 'Magma - Pitch Deck'),
  },
  {
    id: 'brand-act',
    className: 'projects-card-brand',
    label: 'ACT - Pitch Deck',
    labelBg: 'rgba(34, 34, 34, 0.70)',
    href: '/portfolio2025/actdeck',
    content: brandImg('/images/new-home/brand/act.webp', 'ACT - Pitch Deck'),
  },
  {
    id: 'brand-madeforhumans',
    className: 'projects-card-brand',
    label: 'Made for Humans - Illustration',
    labelBg: 'rgba(34, 34, 34, 0.70)',
    href: '/madeforhumans',
    content: brandImg('/images/new-home/brand/made-for-humans.webp', 'Made for Humans - Illustration'),
  },
];

const BY_ID = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
const DEFAULT_ORDER = PROJECTS.map((p) => p.id);
const STORAGE_KEY = 'projects-page:order:v1';

// Merge a persisted order with the current PROJECTS: keep saved
// positions for ids that still exist (de-duped), append any new ids,
// drop ids that no longer exist.
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

export default function ProjectsPage() {
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [dragId, setDragId] = useState<string | null>(null);
  // Dev-only: drag-reorder handles are HIDDEN in production. Flip to
  // `true` locally to re-enable drag-reordering; no UI toggle is
  // rendered (it's not a visitor-facing feature).
  const showHandles = false;

  // Hydrate the saved order once, on mount (client only). Read-only —
  // persistence is done imperatively in reorder() to avoid a
  // mount-time clobber under React Strict Mode.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setOrder(reconcileOrder(JSON.parse(raw)));
    } catch {
      // corrupt/unavailable storage → keep default order
    }
  }, []);

  // Move the dragged card to the dropped-on card's slot, and persist.
  // Direction-aware so every slot (incl. both ends) is reachable:
  // dragging downward drops AFTER the target, upward drops BEFORE.
  const reorder = (targetId: string) => {
    setDragId(null);
    if (!dragId || dragId === targetId) return;
    const from = order.indexOf(dragId);
    const toCard = order.indexOf(targetId);
    const without = order.filter((x) => x !== dragId);
    let at = without.indexOf(targetId);
    if (from < toCard) at += 1;
    without.splice(at, 0, dragId);
    setOrder(without);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(without));
    } catch {
      // quota/unavailable storage → order still works in-memory
    }
  };

  return (
    <div className={styles.pageContainer} style={{ paddingBottom: 120 }}>
      <div className="projects-wrap">
        <div className="projects-header">
          <span className={`${styles.InterMedium16Spaced} projects-header-label`}>
            PROJECTS
          </span>
        </div>

        <div className="projects-grid">
          {order.map((id) => {
            const p = BY_ID[id];
            const isDragging = dragId === id;
            return (
              <div
                key={id}
                className="proj-cell"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorder(id)}
                style={{
                  opacity: isDragging ? 0.4 : 1,
                  transition: 'opacity 0.15s ease',
                }}
              >
                {showHandles && (
                  <div
                    className="proj-handle"
                    draggable
                    onDragStart={(e) => {
                      setDragId(id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    title="Drag to reorder"
                  >
                    ⠿
                  </div>
                )}
                <DemoCard
                  label={p.label}
                  href={p.href}
                  labelBg={p.labelBg}
                  labelTextColor={p.labelTextColor}
                  labelPosition={p.labelPosition}
                  innerBg={p.innerBg}
                  className={`${p.className} pc-card-${p.id}`}
                >
                  {p.content}
                </DemoCard>
              </div>
            );
          })}
        </div>
      </div>

      {/* (Dev-only handles toggle removed — not a visitor-facing
          feature. Re-enable via showHandles above if reordering is
          needed locally.) */}

      <style jsx global>{`
        body,
        html {
          margin: 0;
          padding: 0;
        }
        .projects-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
          width: 100%;
          max-width: 1160px;
          padding: 120px 20px 60px;
          box-sizing: border-box;
        }
        .projects-header {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .projects-header-label {
          color: var(--white-25);
          text-align: center;
        }

        /* Grid — same syntax as CarouselBrand. */
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(3, 381px);
          grid-auto-rows: 298px;
          gap: 15px;
          justify-content: center;
        }
        @media (max-width: 1200px) {
          .projects-grid {
            grid-template-columns: repeat(2, 381px);
          }
        }
        @media (max-width: 800px) {
          .projects-grid {
            grid-template-columns: 1fr;
            grid-auto-rows: auto;
            /* Give the grid a definite width so the 1fr column fills the
               row instead of collapsing to the card's content width. */
            width: 100%;
          }
          .projects-grid .proj-cell {
            aspect-ratio: 381 / 298;
            /* Fill the row up to the normal tile size (381), then cap and
               centre. Below ~381 of usable width it shrinks to fit. */
            width: 100%;
            max-width: 381px;
            margin-left: auto;
            margin-right: auto;
          }
        }

        /* Each grid cell is the drop target (relative for the handle).
           The DemoCard wrapper + .card-outer fill it. */
        .proj-cell {
          position: relative;
        }
        .proj-cell > .projects-card-glass-bordered,
        .proj-cell > .projects-card-aiconf,
        .proj-cell > .projects-card-voice,
        .proj-cell > .projects-card-clipgreige,
        .proj-cell > .projects-card-ollamaborder,
        .proj-cell > .projects-card-brand {
          width: 100%;
          height: 100%;
        }
        .proj-handle {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 20;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.65);
          font-size: 13px;
          line-height: 1;
          cursor: grab;
          user-select: none;
        }

        /* Brand image cards — full-bleed image (DemoCard default
           chrome kept, like CarouselBrand). */
        .projects-card-brand .card-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ===== Chosen AI-card chrome treatments (curated from the
           projects-component scaffold) ===== */

        /* Shared "double border line" outer chrome — Trace(cream),
           AI Confidence, Voice UI, Clipstream, Ollama. Transparent
           fill + the DemoCard #2E2C29 border (kept — these are NOT
           stripped) + a no-glow box-shadow (2 tight inset hairlines
           + outward black-25% drop). */
        .projects-card-glass-bordered .card-outer,
        .projects-card-aiconf .card-outer,
        .projects-card-voice .card-outer,
        .projects-card-clipgreige .card-outer,
        .projects-card-ollamaborder .card-outer {
          background: transparent !important;
          box-shadow:
            0 0.5px 0.5px 1px rgba(255, 255, 255, 0.06) inset,
            0 0.25px 0.25px 1px rgba(255, 255, 255, 0.12) inset,
            0 14.211px 20.281px -5.477px rgba(0, 0, 0, 0.25) !important;
        }
        /* Ollama only: BOTH border lines at 50% (the dark #2E2C29
           border + the bright inset hairline); outward drop unchanged.
           Doubled pc-card subclass (0,3,0) out-specifies the shared
           rule above (0,2,0). */
        .pc-card-ollama.pc-card-ollama .card-outer {
          border-color: rgba(46, 44, 41, 0.5) !important;
          box-shadow:
            0 0.5px 0.5px 1px rgba(255, 255, 255, 0.03) inset,
            0 0.25px 0.25px 1px rgba(255, 255, 255, 0.06) inset,
            0 14.211px 20.281px -5.477px rgba(0, 0, 0, 0.25) !important;
        }
        /* .card-inner border stripped for the chrome-treated cards —
           the collar / preview is the inner surface, no inner border. */
        .projects-card-glass-bordered .card-inner,
        .projects-card-aiconf .card-inner,
        .projects-card-voice .card-inner,
        .projects-card-clipgreige .card-inner,
        .projects-card-ollamaborder .card-inner {
          border: none !important;
        }
        /* Ollama only: bottom text tag at 70% opacity. */
        .pc-card-ollama.pc-card-ollama .card-inner > .label {
          opacity: 0.7;
        }

        /* AI Confidence — force PreviewAIConfidence's own
           @media (max-width:620px) "mobile" transcript-box layout
           (that query can't fire inside a 381 cell on a wide
           viewport). Doubled class + !important to out-specify the
           component's styled-jsx-scoped rules. */
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
