import React, { useState } from 'react';
import { ClipListItem } from './cliplist';
import { ButtonFull } from './midClipButtons';

// ClipVarList Demo Component
// Interactive demo showing title fade transition
// Demonstrates AI-generated title replacing default "Clip 001"

export const ClipVarListDemo: React.FC = () => {
  const [showAITitle, setShowAITitle] = useState(false);
  
  const currentTitle = showAITitle 
    ? 'Morning thoughts on productivity'
    : 'Clip 001';
  
  return (
    <>
      <div className="demo-container">
        <h3 style={{ color: '#FFFFFF', marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>
          Title Fade Transition Demo
        </h3>
        
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
          Demonstrates the opacity fade when AI-generated title replaces the default "Clip 001" name. 
          Click the button to toggle between states and observe the smooth transition.
        </p>
        
        <div className="clip-demo">
          <ClipListItem
            id="demo-1"
            title={currentTitle}
            date="Dec 10, 2024"
            status={null}
          />
        </div>
        
        <div className="button-container">
          <ButtonFull 
            onClick={() => setShowAITitle(!showAITitle)}
          >
            {showAITitle ? 'Reset to Default' : 'Generate AI Title'}
          </ButtonFull>
        </div>
      </div>
      
      <style jsx>{`
        .demo-container {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 500px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        
        .clip-demo {
          width: 100%;
          max-width: 361px;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }
        
        .button-container {
          width: 200px;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
          .demo-container {
            padding: 1.5rem 1rem;
          }
          
          .clip-demo {
            width: 100%;
          }
          
          .button-container {
            width: 100%;
            max-width: 200px;
          }
        }
      `}</style>
    </>
  );
};

export default ClipVarListDemo;

