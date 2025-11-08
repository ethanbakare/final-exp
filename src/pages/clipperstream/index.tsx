import React from 'react';

const ClipperStream: React.FC = () => {
  return (
    <>
      <style jsx>{`
        .clipper-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 2rem;
        }
        
        .clipper-content {
          background: white;
          border-radius: 20px;
          padding: 3rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
          max-width: 600px;
        }
        
        .clipper-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 1rem;
        }
        
        .clipper-subtitle {
          font-size: 1.125rem;
          color: #64748b;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .status-badge {
          display: inline-block;
          background: #fcd34d;
          color: #78350f;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-top: 1rem;
        }
        
        @media (max-width: 768px) {
          .clipper-content {
            padding: 2rem 1.5rem;
          }
          
          .clipper-title {
            font-size: 2rem;
          }
        }
      `}</style>
      
      <div className="clipper-container">
        <div className="clipper-content">
          <h1 className="clipper-title">🎙️ ClipperStream</h1>
          <p className="clipper-subtitle">
            Offline-first voice transcription PWA. Record voice snippets and 
            auto-transcribe when online. Like taking a screenshot, but for your voice.
          </p>
          <span className="status-badge">🚧 Under Construction</span>
        </div>
      </div>
    </>
  );
};

export default ClipperStream;

