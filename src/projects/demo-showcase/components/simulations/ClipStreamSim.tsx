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

export const ClipStreamSim: React.FC<ClipStreamSimProps> = () => {
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
        {mounted ? <ClipMasterScreen /> : null}
      </SimErrorBoundary>
      <style jsx>{`
        .clipstream-sim-frame :global(.master-screen) {
          width: 314px;
          height: 552px;
          min-height: 552px;
          max-height: 552px;
          /* 8 -> 16 all corners (desktop); matches the record-bar's
             16px top radius for a consistent rounded feel. */
          border-radius: 16px;
        }
        /* Record bar shrunk 15% (160 -> 136). Padding scales with it
           (24/12 -> 20/10) so the RECORD button doesn't touch the
           edges. Scoped override — /clipperstream stays at 160. */
        .clipstream-sim-frame :global(.master-screen .record-bar) {
          height: 136px;
          padding: 20px 10px 0px;
        }
      `}</style>
    </div>
  );
};
