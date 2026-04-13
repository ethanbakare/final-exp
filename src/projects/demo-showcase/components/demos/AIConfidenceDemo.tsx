/**
 * Embeddable AI Confidence Tracker demo — the real working product.
 * Wraps DeepReader + IntegratedDeepCard in the SpeechConfidenceProvider,
 * stripped of the full-page container so it fits inside ShowcaseSlot.
 */
import React from 'react';
import { IntegratedDeepCard } from '@/projects/ai-confidence-tracker/components/ui/IntegratedDeepCard';
import { DeepReader } from '@/projects/ai-confidence-tracker/components/ui/deepReader';
import { SpeechConfidenceProvider } from '@/projects/ai-confidence-tracker/hooks/SpeechConfidenceHooks';

export const AIConfidenceDemo: React.FC = () => (
  <SpeechConfidenceProvider>
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
