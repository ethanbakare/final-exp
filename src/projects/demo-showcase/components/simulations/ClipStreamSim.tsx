/**
 * ClipStreamSim — dedicated "play simulation" wrapper for the
 * ClipStream project, rendered inside the demo-showcase carousel.
 *
 * For now this is a thin passthrough to ClipMasterScreen (the same
 * component the live /clipperstream page renders) so the sim theme
 * matches the real app 1:1.
 *
 * Once we start diverging the sim's behaviour (auto-loop, canned
 * recording, scripted states, etc.), those changes live here and
 * should NOT touch any file under src/projects/clipperstream or the
 * /clipperstream page itself. If a piece of ClipMasterScreen's
 * internals needs to be modified for the sim, fork just that piece
 * into a local component in this folder and render it here.
 *
 * Matches the interface of AIConfidenceSim / TraceSim so the
 * showcase can wire it the same way: optional onLoopRestart prop
 * and an exported CLIPSTREAM_SIM_DURATION for the progress bar.
 */
import React, { useEffect, useState } from 'react';
import { ClipMasterScreen } from '@/projects/clipperstream/components/ui/ClipMasterScreen';

// Placeholder. The real value will be defined once scripted-loop
// logic is written (sum of idle + recording + processing + rest
// phase durations, same pattern as AIConfidenceSim).
export const CLIPSTREAM_SIM_DURATION = 8000;

interface ClipStreamSimProps {
  onLoopRestart?: () => void;
  /** Kill-switch cancel signal from the showcase (Phase 1c step 4).
   *  Forwarded into ClipMasterScreen so swipe-away cancellation flows
   *  through the product's existing handleCloseClick path. */
  cancelSignal?: AbortSignal;
}

// Minimal error boundary so a crash inside ClipMasterScreen surfaces
// as a readable message instead of cascading to the page-level error
// boundary and blanking the showcase panel.
class SimErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ClipStreamSim] caught error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, color: '#b91c1c', fontSize: 12, fontFamily: 'monospace' }}>
          ClipStreamSim crashed: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export const ClipStreamSim: React.FC<ClipStreamSimProps> = ({ cancelSignal }) => {
  // Defer ClipMasterScreen mount until after hydration — mirrors the
  // `mounted` gate used on /clipperstream. Without it, some hooks
  // inside ClipMasterScreen (mic, storage, zustand rehydration) can
  // run before the browser-only globals they need are safe to touch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // onLoopRestart is accepted but unused until the scripted loop
  // logic is added — keeps the signature uniform with sister sims.
  //
  // Height override: ClipMasterScreen locks itself to 852px on
  // desktop (see .master-screen in that file). That height exceeds
  // the showcase sim-slot, so the phone frame was being cropped top
  // and bottom. We reduce the desktop height by 200 (652px) via a
  // scoped :global() override on a wrapper — keeps /clipperstream
  // untouched. The record bar (160px, flex:none) and header sit at
  // their natural sizes; the flex:1 .screen-container in the middle
  // absorbs the 200px reduction, so it's the clip list / empty
  // state region that shrinks.
  return (
    <div className="clipstream-sim-frame">
      <SimErrorBoundary>
        {mounted ? <ClipMasterScreen cancelSignal={cancelSignal} /> : null}
      </SimErrorBoundary>
      <style jsx>{`
        .clipstream-sim-frame :global(.master-screen) {
          height: 652px;
          min-height: 652px;
          max-height: 652px;
        }
        /* Whole-frame scale — visual experiment on both desktop and
           mobile. Scales the entire ClipMasterScreen uniformly
           (header + list + record bar together). Layout box stays
           at the original size; only the paint is shrunk. */
        .clipstream-sim-frame {
          transform: scale(0.8);
          transform-origin: center center;
        }
        /* Mobile override: /clipperstream sets border-radius: 0 on
           mobile because it occupies the full viewport. In the
           showcase the frame floats inside a canvas, so it should
           look like a rounded phone card on mobile too. */
        @media (max-width: 768px) {
          .clipstream-sim-frame :global(.master-screen) {
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
};
