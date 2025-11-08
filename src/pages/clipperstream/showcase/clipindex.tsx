import React from 'react';
import Link from 'next/link';

const ClipperShowcase: React.FC = () => {
  return (
    <>
      <style jsx>{`
        .showcase-nav {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .nav-container {
          background: white;
          border-radius: 20px;
          padding: 3rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .nav-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 1rem;
        }
        
        .nav-subtitle {
          font-size: 1.125rem;
          color: #64748b;
          margin-bottom: 3rem;
          line-height: 1.6;
        }
        
        .nav-options {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .nav-card {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 2rem;
          transition: all 0.3s ease;
          text-decoration: none;
          color: inherit;
        }
        
        .nav-card:hover {
          border-color: #0f172a;
          box-shadow: 0 8px 25px rgba(15, 23, 42, 0.15);
          transform: translateY(-2px);
        }
        
        .nav-card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 0.75rem;
        }
        
        .nav-card-description {
          color: #64748b;
          line-height: 1.6;
        }
        
        .nav-card-badge {
          display: inline-block;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        @media (max-width: 768px) {
          .nav-container {
            padding: 2rem 1.5rem;
            margin: 1rem;
          }
          
          .nav-title {
            font-size: 2rem;
          }
        }
      `}</style>
      
      <div className="showcase-nav">
        <div className="nav-container">
          <h1 className="nav-title">🎙️ ClipperStream Showcase</h1>
          <p className="nav-subtitle">
            Component development and testing environment for ClipperStream's 
            offline-first voice transcription system.
          </p>
          
          <div className="nav-options">
            <Link href="/clipperstream/showcase/clipcomponents" className="nav-card">
              <div>
                <h2 className="nav-card-title">Component Library</h2>
                <p className="nav-card-description">
                  Explore all UI components including morphing buttons, recording bar, 
                  clip rows, and offline indicators. Test each component independently 
                  during development.
                </p>
                <span className="nav-card-badge">Coming Soon</span>
              </div>
            </Link>
            
            <Link href="/clipperstream/showcase/interactions" className="nav-card">
              <div>
                <h2 className="nav-card-title">Interactions & States</h2>
                <p className="nav-card-description">
                  Test recording states, offline queue behavior, and user interactions. 
                  Verify morphing animations and state transitions work smoothly.
                </p>
                <span className="nav-card-badge">Coming Soon</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClipperShowcase;

