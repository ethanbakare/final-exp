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
  return (
    <SimErrorBoundary>
      {mounted ? <ClipMasterScreen /> : null}
    </SimErrorBoundary>
  );
};
