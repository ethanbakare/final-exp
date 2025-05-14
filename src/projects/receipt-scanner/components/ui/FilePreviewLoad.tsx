import React, { useState, useCallback, useEffect, useRef } from 'react';

interface FileInfo {
  name: string;
  size: string;
}

interface FilePreviewLoadProps {
  fileInfo?: FileInfo;
  onClose?: () => void;
  simulateLoadTime?: number; // Time in ms to simulate complete loading
}

// @refresh reset
const FilePreviewLoad: React.FC<FilePreviewLoadProps> = ({
  fileInfo = { name: "receipt_photo.jpg", size: "2.4 MB" },
  onClose,
  simulateLoadTime = 3000 // Default 3 seconds to complete loading
}) => {
  const [visible, setVisible] = useState(true);
  const [percentage, setPercentage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Store simulation time in a ref to avoid recreating the animate callback
  const simulateTimeRef = useRef(Math.max(2000, simulateLoadTime));
  
  // Pre-calculate constants for the circle
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  
  // Handle animation frame for smooth percentage update
  // Remove the dependency on actualSimulateTime by using the ref instead
  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / simulateTimeRef.current, 1);
    const currentPercentage = Math.floor(progress * 100);
    
    setPercentage(currentPercentage);
    
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsComplete(true);
    }
  }, []); // No dependencies means the function is stable and won't be recreated

  // Start the animation on mount
  useEffect(() => {
    // Set the simulation time once on mount
    simulateTimeRef.current = Math.max(2000, simulateLoadTime);
    
    // Start the animation
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, simulateLoadTime]); // Add simulateLoadTime to the dependency array

  const handleClose = useCallback(() => {
    // Cancel the animation when closing
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setVisible(false);
    if (onClose) onClose();
    console.log("FilePreviewLoad closed");
  }, [onClose]);

  if (!visible) return null;

  // Calculate the circle path for the progress indicator
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="file-upload">
      <div className="file-icon-container">
        <div className="file-icon">
          {/* Loading spinner - always present but fades out when complete */}
          <div className={`spinner-container ${isComplete ? 'fade-out' : 'visible'}`}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinner">
              {/* Background circle */}
              <circle cx="20" cy="20" r="15" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="3" fill="none" />
              
              {/* Progress circle */}
              <circle 
                cx="20" 
                cy="20" 
                r="15" 
                stroke="white" 
                strokeWidth="3" 
                fill="none" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="progress-circle"
                transform="rotate(-90 20 20)"
              />
            </svg>
          </div>

          {/* File icon - always present but fades in when complete */}
          <div className={`file-svg-container ${isComplete ? 'visible' : 'fade-out'}`}>
            <svg width="16" height="21" viewBox="0 0 16 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 0.5C0.9 0.5 0.0100002 1.4 0.0100002 2.5L0 18.5C0 19.6 0.89 20.5 1.99 20.5H14C15.1 20.5 16 19.6 16 18.5V6.5L10 0.5H2ZM9 7.5V2L14.5 7.5H9Z" fill="white"/>
            </svg>
          </div>
        </div>
      </div>
      <div className="file-info">
        <div className="file-name">{fileInfo.name}</div>
        <div className="file-percentage">
          {isComplete ? (
            <div className="format-text">{fileInfo.size}</div>
          ) : (
            <div className="loading-text">Loading: {percentage}%</div>
          )}
        </div>
      </div>
      <div className="file-close" onClick={handleClose}>
        <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 0.5C4.47 0.5 0 4.97 0 10.5C0 16.03 4.47 20.5 10 20.5C15.53 20.5 20 16.03 20 10.5C20 4.97 15.53 0.5 10 0.5ZM15 14.09L13.59 15.5L10 11.91L6.41 15.5L5 14.09L8.59 10.5L5 6.91L6.41 5.5L10 9.09L13.59 5.5L15 6.91L11.41 10.5L15 14.09Z" fill="#5E5E5E" fillOpacity="0.6"/>
        </svg>
      </div>
      <style jsx>{`
        .file-upload {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          padding: 12px;
          gap: 12px;
          width: 276px;
          background: rgba(94, 94, 94, 0.05);
          border-radius: 8px;
          height: 67px;
          position: relative;
          border: 1.5px solid rgba(94, 94, 94, 0.10);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .file-icon-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          padding: 0px 8px;
          gap: 10px;
          width: 40px;
          background: #7B61FF;
          border-radius: 4px;
          align-self: stretch;
        }
        
        .file-icon {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          padding: 2px 4px;
          width: 30px;
          height: 30px;
          position: relative;
        }

        /* Fade transitions */
        .visible {
          opacity: 1;
          visibility: visible;
          transition: opacity 0.5s ease, visibility 0s;
        }
        
        .fade-out {
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.5s ease, visibility 0s 0.5s;
        }

        /* Spinner container */
        .spinner-container, .file-svg-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          animation: ${isComplete ? 'none' : 'spin 2s linear infinite'};
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        .progress-circle {
          transition: stroke-dashoffset 0.1s ease;
        }

        /* File icon styles */
        .file-svg-container svg {
          width: 16px;
          height: 21px;
          transform: scale(1);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .file-svg-container.visible svg {
          transform: scale(1);
        }

        .file-svg-container.fade-out svg {
          transform: scale(0);
        }
        
        .file-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          min-width: 0;
          overflow: hidden;
          margin-right: 24px;
        }
        
        .file-name {
          font-weight: 500;
          font-size: 15px;
          line-height: 24px;
          color: #5E5E5E;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        
        .file-percentage {
          font-weight: 400;
          font-size: 13.6px;
          line-height: 17px;
          color: rgba(94, 94, 94, 0.8);
          transition: all 0.3s ease;
          min-height: 17px;
          position: relative;
        }

        .loading-text, .format-text {
          animation: fadeChange 0.3s ease;
        }

        @keyframes fadeChange {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        .file-close {
          position: absolute;
          right: -10px;
          top: -10px;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 24px;
          height: 24px;
          cursor: pointer;
          background-color: #FFFFFF;
          border-radius: 16px;
        }
        
        .file-close svg {
          width: 20px;
          height: 20px;
          opacity: 0.4;
          transition: fill 0.2s ease;
        }
        
        .file-close:hover svg path {
          fill: #D45959 !important;
          fillOpacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default FilePreviewLoad; 