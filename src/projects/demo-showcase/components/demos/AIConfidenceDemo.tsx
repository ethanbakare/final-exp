/**
 * Embeddable AI Confidence Tracker demo — the real working product.
 * Wraps DeepReader + IntegratedDeepCard in the SpeechConfidenceProvider,
 * stripped of the full-page container so it fits inside ShowcaseSlot.
 *
 * Kill-switch: see docs/demo-showcase/KILL-SWITCH-ARCHITECTURE.md §2.1.
 * Accepts optional cancelSignal + runIdRef and forwards them to the
 * provider. Standalone use (omit both) is unchanged.
 */
import React from 'react';
import { IntegratedDeepCard } from '@/projects/ai-confidence-tracker/components/ui/IntegratedDeepCard';
import { DeepReader } from '@/projects/ai-confidence-tracker/components/ui/deepReader';
import { SpeechConfidenceProvider } from '@/projects/ai-confidence-tracker/hooks/SpeechConfidenceHooks';

interface AIConfidenceDemoProps {
  cancelSignal?: AbortSignal;
  runIdRef?: React.MutableRefObject<number>;
}

export const AIConfidenceDemo: React.FC<AIConfidenceDemoProps> = ({ cancelSignal, runIdRef }) => (
  <SpeechConfidenceProvider cancelSignal={cancelSignal} runIdRef={runIdRef}>
    <div className="demo-wrapper">
      <DeepReader />
      <IntegratedDeepCard />

      <style jsx>{`
        .demo-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
          max-width: 620px;
        }
      `}</style>
    </div>
  </SpeechConfidenceProvider>
);
