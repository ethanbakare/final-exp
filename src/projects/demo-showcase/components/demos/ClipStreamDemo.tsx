import React, { useEffect, useState } from 'react';
import { ClipMasterScreen } from '@/projects/clipperstream/components/ui/ClipMasterScreen';

interface ClipStreamDemoProps {
  cancelSignal?: AbortSignal;
}

class DemoErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ClipStreamDemo] caught error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, color: '#b91c1c', fontSize: 12, fontFamily: 'monospace' }}>
          ClipStreamDemo crashed: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export const ClipStreamDemo: React.FC<ClipStreamDemoProps> = ({ cancelSignal }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="clipstream-demo-frame">
      <DemoErrorBoundary>
        {mounted ? <ClipMasterScreen cancelSignal={cancelSignal} /> : null}
      </DemoErrorBoundary>
      <style jsx>{`
        .clipstream-demo-frame :global(.master-screen) {
          height: 652px;
          min-height: 652px;
          max-height: 652px;
        }
        .clipstream-demo-frame {
          transform: scale(0.8);
          transform-origin: center center;
        }
        @media (max-width: 768px) {
          .clipstream-demo-frame {
            transform: scale(0.68);
          }
          .clipstream-demo-frame :global(.master-screen) {
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
};
