/**
 * "Back to home" control for the demo page (/demo-showcase), which
 * deliberately does NOT show the site-wide navbar (see
 * src/projects/site-nav/SiteNavGate.tsx).
 *
 * It is drawn as a sibling of the project selector pill and copies that
 * pill's material exactly, so the two read as one family:
 *   variant="desktop" — 51px square chip, radius 20, #F7F6F2 (ShowcaseNavbarCompact .selector-pill).
 *   variant="compact" — 37px square chip, radius 14, #F7F6F2 (ShowcaseNavbarCompactSmall .selector-pill).
 * Flat on purpose: no inset shadow (operator: "not required for the home button").
 * Icon: Lucide "House", stroke matched to the pill's own arrow/chevron
 * icons (about 1.4px rendered at phone size, 1.9px at desktop size).
 * Icon-only; the accessible name is "Back to home". The visible chip keeps
 * the pill's size; an invisible ::before extends the tap area to 44px.
 */
import React from 'react';
import { House } from 'lucide-react';

type Props = { variant: 'desktop' | 'compact' };

export const BackToHomeLink: React.FC<Props> = ({ variant }) => (
  <>
    {/* plain <a>: a full load of "/" keeps the home hero font correct (see SiteNavGlass NavAnchor) */}
    <a href="/" className={`back-home back-home-${variant}`} aria-label="Back to home" data-back-home>
      {variant === 'desktop' ? (
        <House size={18} strokeWidth={2.5} color="#5E5E5C" aria-hidden="true" />
      ) : (
        <House size={15} strokeWidth={2.2} color="#5E5E5C" aria-hidden="true" />
      )}
    </a>
    <style jsx global>{`
      .back-home {
        position: relative;
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        background: #f7f6f2;
        text-decoration: none;
        transition: background-color 0.15s ease, transform 0.12s ease-out;
      }
      .back-home:hover {
        background: #efeeea;
      }
      .back-home:active {
        transform: scale(0.96);
      }
      .back-home:focus-visible {
        outline: 2px solid rgba(28, 25, 23, 0.4);
        outline-offset: 2px;
      }
      /* Invisible tap-area extension to 44px; the visible chip matches the pill. */
      .back-home::before {
        content: '';
        position: absolute;
      }
      .back-home-desktop {
        width: 51px;
        height: 51px;
        border-radius: 20px;
      }
      .back-home-desktop::before {
        inset: 0;
      }
      .back-home-compact {
        width: 37px;
        height: 37px;
        margin-right: 8px;
        border-radius: 14px;
      }
      /* 37 -> 44: extend sideways and downward only, because the chip sits at
         the very top of the page and an upward extension would be off-screen. */
      .back-home-compact::before {
        top: 0;
        bottom: -7px;
        left: -3.5px;
        right: -3.5px;
      }
    `}</style>
  </>
);
