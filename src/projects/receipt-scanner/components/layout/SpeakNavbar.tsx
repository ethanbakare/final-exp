import React from 'react';
import Button from '../ui/Button';

interface SpeakNavbarProps {
  className?: string;
}

const SpeakNavbar: React.FC<SpeakNavbarProps> = ({
  className = '',
}) => {
  // Material Icons for download button
  const downloadIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
    </svg>
  );

  return (
    <div className={`speak-navbar-container ${className}`}>
      <div className="left-buttons">
        <Button 
          variant="disabled" 
          type="icon" 
          icon={downloadIcon}
        />
      </div>
      <div className="right-buttons">
        <Button 
          variant="primary" 
          type="text" 
          onClick={() => console.log('Record button clicked')}
        >
          Record
        </Button>
      </div>

      <style jsx>{`
        .speak-navbar-container {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          padding: 5px;
          gap: 10px;
          width: 100%;
          max-width: 528px;
          height: 50px;
          min-height: 50px;
          background: rgba(94, 94, 94, 0.1);
          border-radius: 12px;
          margin: 0 auto;
        }
        
        .left-buttons {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 10px;
          height: 40px;
        }
        
        .right-buttons {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 10px;
          height: 40px;
        }

        @media (max-width: 540px) {
          .speak-navbar-container {
            padding: 5px;
            gap: 5px;
            min-width: auto;
          }
          
          .left-buttons,
          .right-buttons {
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default SpeakNavbar; 