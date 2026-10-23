/**
 * Framed page background for a project's standalone demo page, matching
 * that project's card in the home page "AI DEMOS" section, so a
 * visitor who clicks a card lands on the same surface.
 *
 * Framing is ported from the Ollama landing hero (ollama-hero-banner >
 * ollama-hero-card): a 20px inset from the viewport edge, a 12px radius,
 * overflow hidden; at 768px and below it is edge to edge with no radius,
 * as the Ollama hero is. Around the frame is white, as around the Ollama card
 * (its banner gradient resolves to #FFFFFF at the bottom of the card).
 * The frame starts below the site navbar: the outer wrapper pads its top
 * by var(--site-nav-h, 0px) (unset where no bar is mounted).
 *
 * The page's interface is passed as children and is centred inside the
 * frame. The frame grows with its content, so when the content is taller
 * than the viewport the whole frame scrolls with the page (nothing clips).
 *
 * Values are copied from the cards — keep them in sync:
 *   ai-confidence → previews/PreviewAIConfidence.tsx  (.bg-image:
 *                   /images/voice-interface/wt1.webp, rotate(-90deg))
 *   clipstream    → CarouselDemos.tsx .clipstream-bg + new-home.module.css
 *                   (--preview-clipstream-bg #F0EBEB,
 *                    --preview-clipstream-dots rgba(0,0,0,0.08), 16px grid)
 *   trace         → CarouselDemos.tsx card-trace innerBg
 *                   var(--preview-trace-bg) = #965935
 */
import React from 'react';

export type ProjectBackgroundVariant = 'ai-confidence' | 'clipstream' | 'trace';

const ProjectPageBackground: React.FC<{
  variant: ProjectBackgroundVariant;
  children?: React.ReactNode;
}> = ({ variant, children }) => (
  <>
    <div className="ppb-outer">
      <div className="ppb-frame">
        <div className={`ppb ppb-${variant}`} aria-hidden="true">
          {variant === 'ai-confidence' && (
            <img
              src="/images/voice-interface/wt1.webp"
              alt=""
              className="ppb-image"
              draggable={false}
            />
          )}
        </div>
        <div className="ppb-content">{children}</div>
      </div>
    </div>

    <style jsx global>{`
      html,
      body {
        background-color: #ffffff;
      }
    `}</style>
    <style jsx>{`
      .ppb-outer {
        box-sizing: border-box;
        width: 100%;
        min-height: 100vh;
        min-height: 100dvh;
        display: flex;
        padding: calc(20px + var(--site-nav-h, 0px)) 20px 20px;
      }

      .ppb-frame {
        position: relative;
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        border-radius: 12px;
        overflow: hidden;
      }
      /* Phones and small tablets: edge to edge, as the Ollama hero does at
         this breakpoint (ollama.module.css @media max-width 768px: banner
         padding 0, card radius 0). The frame runs up under the floating
         navbar; the content starts below it. */
      @media (max-width: 768px) {
        .ppb-outer {
          padding: 0;
        }
        .ppb-frame {
          border-radius: 0;
        }
        .ppb-content {
          padding-top: var(--site-nav-h, 0px);
        }
      }
      /* Very narrow phones (320px): the frame is narrower than the
         360px Trace card, so let the frame scroll sideways rather than
         clip its controls. */
      @media (max-width: 400px) {
        .ppb-frame {
          overflow-x: auto;
        }
      }

      /* Background layer: fills the frame, behind the content. */
      .ppb {
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: hidden;
        pointer-events: none;
        container-type: size;
      }

      .ppb-content {
        position: relative;
        /* z-index auto on purpose: no stacking context here, so modals and
           toasts inside the page (z 200 / 1000+) can sit above the site
           navbar (150). Still paints above .ppb by DOM order. */
        z-index: auto;
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      /* AI Confidence — same asset and same -90deg rotation as the
         card. The image box is sized with SWAPPED frame dimensions
         (width = frame height, height = frame width, via container
         query units) and centred, so after rotating -90deg it covers
         the frame exactly with object-fit: cover. */
      .ppb-image {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100cqh;
        height: 100cqw;
        /* Global img reset caps width at 100% — on a portrait phone
           that squashes the swapped box to a square band. */
        max-width: none;
        max-height: none;
        object-fit: cover;
        transform: translate(-50%, -50%) rotate(-90deg);
        transform-origin: center center;
        user-select: none;
      }

      .ppb-clipstream {
        background-color: #F0EBEB;
        background-image: radial-gradient(circle, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
        background-size: 16px 16px;
      }

      .ppb-trace {
        background: #965935;
      }
    `}</style>
  </>
);

export default ProjectPageBackground;
