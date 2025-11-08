import React from 'react';
import Link from 'next/link';

const InteractionsShowcase: React.FC = () => {
  return (
    <>
      <style jsx>{`
        .showcase-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 2rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .showcase-header {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .showcase-title {
          font-size: 2rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }
        
        .showcase-subtitle {
          color: #64748b;
          font-size: 1rem;
        }
        
        .back-link {
          display: inline-block;
          color: #0f172a;
          text-decoration: none;
          font-weight: 600;
          margin-top: 1rem;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
        
        .interactions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        
        .interaction-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .interaction-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1rem;
        }
        
        .interaction-placeholder {
          background: #f1f5f9;
          border-radius: 8px;
          padding: 3rem 1rem;
          text-align: center;
          color: #64748b;
          font-style: italic;
        }
        
        @media (max-width: 768px) {
          .interactions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      
      <div className="showcase-container">
        <div className="showcase-header">
          <h1 className="showcase-title">Interactions & States</h1>
          <p className="showcase-subtitle">
            Test recording flows, offline behavior, and state transitions
          </p>
          <Link href="/clipperstream/showcase" className="back-link">
            ← Back to Showcase
          </Link>
        </div>
        
        <div className="interactions-grid">
          <div className="interaction-card">
            <h2 className="interaction-title">Recording Flow</h2>
            <div className="interaction-placeholder">
              Record → Done → Transcribing → Complete
            </div>
          </div>
          
          <div className="interaction-card">
            <h2 className="interaction-title">Offline Queue</h2>
            <div className="interaction-placeholder">
              Test offline recording and auto-sync behavior
            </div>
          </div>
          
          <div className="interaction-card">
            <h2 className="interaction-title">Button Morphing</h2>
            <div className="interaction-placeholder">
              Test button state transitions and animations
            </div>
          </div>
          
          <div className="interaction-card">
            <h2 className="interaction-title">Error Handling</h2>
            <div className="interaction-placeholder">
              Test retry mechanisms and failure states
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InteractionsShowcase;

