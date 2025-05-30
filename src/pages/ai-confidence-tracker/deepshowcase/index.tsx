import React from 'react';
import Link from 'next/link';

const DeepShowcase: React.FC = () => {
  return (
    <>
      <style jsx>{`
        .showcase-nav {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          background: linear-gradient(135deg, #667eea, #764ba2);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
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
          border-color: #667eea;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
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
          background: linear-gradient(135deg, #667eea, #764ba2);
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
          <h1 className="nav-title">Deep Showcase</h1>
          <p className="nav-subtitle">
            Explore our sophisticated AI confidence tracking components with 
            interactive demos and technical documentation.
          </p>
          
          <div className="nav-options">
            <Link href="/ai-confidence-tracker/deepshowcase/deepLibrary" className="nav-card">
              <div>
                <h2 className="nav-card-title">Component Library</h2>
                <p className="nav-card-description">
                  Comprehensive showcase of all UI components including buttons, badges, 
                  animations, and interactive elements. Perfect for exploring the complete 
                  design system and implementation details.
                </p>
                <span className="nav-card-badge">Complete Collection</span>
              </div>
            </Link>
            
            <Link href="/ai-confidence-tracker/deepshowcase/deepmaster" className="nav-card">
              <div>
                <h2 className="nav-card-title">DeepCard Master</h2>
                <p className="nav-card-description">
                  Focused showcase of the flagship DeepCard component featuring 
                  symbiotic text-badge interactions, advanced positioning algorithms, 
                  and responsive design excellence.
                </p>
                <span className="nav-card-badge">Featured Component</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeepShowcase; 