/**
 * DemoIntroCard — pill card that sits at the top of a DemoCanvas
 * and announces the project headline.
 *
 * Figma: demo-intro (3077:411).
 *
 * When the headline / dark variant changes (driven by ClipStreamSim's
 * narrative beats), the swap is masked with a brief blur + opacity
 * dim per Emil Kowalski's design-engineering "use blur to mask
 * imperfect crossfades" principle. The text content + dark class
 * flip at PEAK blur (~100ms in) so the eye perceives a single
 * smooth transformation rather than two distinct text strings
 * crossfading on a transitioning background. See
 * docs/skills/emil-design-eng.md §"Use blur to mask imperfect
 * transitions".
 */
import React, { useEffect, useRef, useState } from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface DemoIntroCardProps {
  headline: string;
  /** Optional trailing text shown only on desktop (>768px). Stays in
   *  the DOM so assistive tech reads the full headline; hidden via
   *  CSS on mobile for space. */
  headlineSuffix?: string;
  /** Dark pill variant — used by ClipStreamSim to call out the
   *  recording/transcribing narrative beats. Pill flips to ClipGrey
   *  (#252525) with white text. */
  dark?: boolean;
}

// Timings calibrated against Emil's ceiling of <300ms for UI motion.
// 100ms blur fade-in → swap → 100ms blur fade-out (with 50ms hold).
const SWAP_DELAY_MS = 100;
const TRANSITION_END_MS = 150;

export const DemoIntroCard: React.FC<DemoIntroCardProps> = ({ headline, headlineSuffix, dark = false }) => {
  // Display state lags behind props during the swap so the actual
  // text + dark class change happens at peak blur (masked from the
  // eye). Without this stagger the new text appears against the old
  // background, producing the "two distinct objects" crossfade Emil
  // warns about.
  const [displayHeadline, setDisplayHeadline] = useState(headline);
  const [displayHeadlineSuffix, setDisplayHeadlineSuffix] = useState(headlineSuffix);
  const [displayDark, setDisplayDark] = useState(dark);
  const [transitioning, setTransitioning] = useState(false);

  // Track previous props in a ref so the change-detection effect
  // depends ONLY on incoming props, never on display state. The
  // earlier dep-array including displayHeadline et al caused the
  // effect to clean up its own timers when the swapTimer's setState
  // landed — leaving transitioning stuck on forever.
  const prevPropsRef = useRef({ headline, headlineSuffix, dark });
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevPropsRef.current;
    const changed =
      headline !== prev.headline ||
      headlineSuffix !== prev.headlineSuffix ||
      dark !== prev.dark;
    if (!changed) return;

    prevPropsRef.current = { headline, headlineSuffix, dark };

    // Cancel any in-flight timers from a still-running prior transition
    // before scheduling new ones.
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    if (endTimerRef.current) clearTimeout(endTimerRef.current);

    setTransitioning(true);

    swapTimerRef.current = setTimeout(() => {
      setDisplayHeadline(headline);
      setDisplayHeadlineSuffix(headlineSuffix);
      setDisplayDark(dark);
    }, SWAP_DELAY_MS);

    endTimerRef.current = setTimeout(() => {
      setTransitioning(false);
    }, TRANSITION_END_MS);
  }, [headline, headlineSuffix, dark]);

  // Clear any pending timers on unmount — only fires once.
  useEffect(() => {
    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, []);

  return (
    <div
      className={[
        styles.demoIntroCard,
        displayDark ? styles.demoIntroCardDark : '',
        transitioning ? styles.demoIntroCardTransitioning : '',
      ].filter(Boolean).join(' ')}
    >
      <div className={styles.demoHeadline}>
        <span className={`${styles.OpenRunde600_16} ${styles.demoHeadlineText}`}>
          {displayHeadline}
          {displayHeadlineSuffix && (
            <span className={styles.demoHeadlineSuffix}>{displayHeadlineSuffix}</span>
          )}
        </span>
      </div>
    </div>
  );
};
