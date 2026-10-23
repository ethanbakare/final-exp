import React from 'react';
import { IntegratedDeepCard } from '@/projects/ai-confidence-tracker/components/ui/IntegratedDeepCard';
import { DeepReader } from '@/projects/ai-confidence-tracker/components/ui/deepReader';
import { SpeechConfidenceProvider } from '@/projects/ai-confidence-tracker/hooks/SpeechConfidenceHooks';
import ProjectPageBackground from '@/projects/new-home/components/ProjectPageBackground';

/**
 * Main AI Confidence Tracker page
 * Features the latest integrated version with retry functionality
 * and comprehensive error handling
 */
const AIConfidenceTrackerPage: React.FC = () => {
  return (
    <>
      <style jsx>{`
        .ai-tracker-container {
          /* Background = the home-page AI DEMOS card (pink watercolour),
             painted by <ProjectPageBackground> behind this layer. */
          /* Sits inside the framed background (ProjectPageBackground
             owns the nav offset and the 20px frame inset). */
          box-sizing: border-box;
          width: 100%;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 30px;
        }
        
        .content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
          max-width: 620px;
        }
        
        @media (max-width: 768px) {
          .ai-tracker-container {
            padding: 15px;
            gap: 20px;
          }
        }
      `}</style>
      
      {/* Legibility overrides for THIS page only. The demo components and
          ai-tracker.module.css are shared (home AI DEMOS card preview,
          showcase sim, /simulation, /looper), so their grey tokens stay
          untouched; captions are darkened here, scoped under
          .ai-tracker-container. !important is needed to beat the
          components' scoped styles and inline colours. Targets >= 4.5:1
          on the watercolour. Decorative dots/borders/icons stay faint. */}
      <style jsx global>{`
        .ai-tracker-container .read-text-label,
        .ai-tracker-container .swipe-hint,
        .ai-tracker-container .transcript-microcopy span {
          color: #4a4a4a !important;
          opacity: 1 !important;
        }
        .ai-tracker-container .model-copy {
          color: #4a4a4a !important;
        }
        /* The legend sits inside .legend, which the component fades to
           opacity 0.8, so its colours are darker to compensate. */
        .ai-tracker-container .legend-key span {
          color: #262626 !important;
          opacity: 1 !important;
        }
        .ai-tracker-container .legend-holder .mid span {
          color: #3d2703 !important;
        }
        .ai-tracker-container .legend-holder .low span {
          color: #4a0404 !important;
        }
        .ai-tracker-container .text-content,
        .ai-tracker-container .text-content-previous,
        .ai-tracker-container .reload-text {
          color: #5e5e5e !important;
        }
        @media (hover: hover) {
          .ai-tracker-container .reload-button:hover .reload-text {
            color: #404040 !important;
          }
        }
        .ai-tracker-container .initial-text,
        .ai-tracker-container .status-text,
        .ai-tracker-container .error-text {
          color: #6b6b6b !important;
        }
      `}</style>
      <ProjectPageBackground variant="ai-confidence">
        <div className="ai-tracker-container">
          <SpeechConfidenceProvider>
            <div className="content-wrapper">
              <DeepReader />
              <IntegratedDeepCard />
            </div>
          </SpeechConfidenceProvider>
        </div>
      </ProjectPageBackground>
    </>
  );
};

export default AIConfidenceTrackerPage; 