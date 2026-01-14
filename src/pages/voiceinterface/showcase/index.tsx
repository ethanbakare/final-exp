import React from 'react';
import Link from 'next/link';

// Voice Interface Showcase Index
// Navigation hub for showcase pages
// Following clipperstream/showcase/clipindex.tsx pattern

const VoiceInterfaceShowcase: React.FC = () => {
  return (
    <>
      <style jsx>{`
        .container {
          min-height: 100vh;
          background-color: #FFFFFF;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .title {
          color: #1C1C1C;
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-align: center;
        }

        .subtitle {
          color: rgba(0, 0, 0, 0.6);
          font-size: 1.125rem;
          margin-bottom: 3rem;
          text-align: center;
        }

        .links {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          max-width: 400px;
        }

        .link-card {
          padding: 1.5rem 2rem;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          color: #1C1C1C;
          text-decoration: none;
          font-size: 1.125rem;
          font-weight: 500;
          transition: all 0.2s ease;
          text-align: center;
        }

        .link-card:hover {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
        }

        .link-description {
          color: rgba(0, 0, 0, 0.5);
          font-size: 0.875rem;
          font-weight: 400;
          margin-top: 0.5rem;
        }
      `}</style>

      <div className="container">
        <h1 className="title">Voice Interface</h1>
        <p className="subtitle">Component Showcase & Documentation</p>

        <div className="links">
          <Link href="/voiceinterface/showcase/voicecomponent" className="link-card">
            Component Library
            <div className="link-description">
              Individual buttons and UI components
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default VoiceInterfaceShowcase;
