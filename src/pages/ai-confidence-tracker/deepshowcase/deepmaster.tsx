import React from 'react';
import { IntegratedDeepCard } from '@/projects/ai-confidence-tracker/components/ui/IntegratedDeepCard';
import { DeepReader } from '@/projects/ai-confidence-tracker/components/ui/deepReader';
import { SpeechConfidenceProvider } from '@/projects/ai-confidence-tracker/hooks/SpeechConfidenceHooks';

const DeepMaster: React.FC = () => {
  return (
    <>
      <style jsx>{`
        .deepmaster-container {
          background: #ffffff;
          min-height: 100vh;
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
          .deepmaster-container {
            padding: 15px;
            gap: 20px;
          }
        }
      `}</style>
      
      <div className="deepmaster-container">
        <SpeechConfidenceProvider>
          <div className="content-wrapper">
            <DeepReader />
            <IntegratedDeepCard />
          </div>
        </SpeechConfidenceProvider>
      </div>
    </>
  );
};

export default DeepMaster; 