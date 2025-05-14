import React, { useEffect } from 'react';
import SubProjectNavbar from './SubProjectNavbar';
import Interface from './Interface';
import { ReceiptProvider } from '../context/ReceiptContext';

const RDemo: React.FC = () => {
  // Handle viewport height calculation for mobile browsers
  useEffect(() => {
    // Function to set CSS variable with viewport height
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Set initial viewport height
    setViewportHeight();
    
    // Update viewport height on resize
    window.addEventListener('resize', setViewportHeight);
    
    // Update on orientation change (specific to mobile)
    window.addEventListener('orientationchange', setViewportHeight);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);

  return (
    <div className="rdemo-container">
      <SubProjectNavbar />
      
      <div className="content-area">
        <ReceiptProvider>
          <Interface />
        </ReceiptProvider>
      </div>
      
      <style jsx>{`
        .rdemo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          height: 100vh; /* Fallback for browsers that don't support custom properties */
          height: calc(var(--vh, 1vh) * 100); /* Use custom viewport height */
          background-color: #F8F6F0; /* Direct beige background color */
        }
        
        .content-area {
          width: 100%;
          max-width: 1160px;
          margin-top: 100px; /* Space for the navbar */
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .content-area {
            padding: 16px;
            margin-top: 70px; /* Adjusted for mobile */
          }
        }
      `}</style>
    </div>
  );
};

export default RDemo; 