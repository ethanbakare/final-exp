import React, { useState, useEffect, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'warning' | 'error' | 'file';

interface FileInfo {
  name: string;
  type: string;
}

interface ToastProps {
  type: ToastType;
  title: string;
  message: string;
  fileInfo?: FileInfo;
  action?: {
    text: string;
    onClick: () => void;
  };
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
}

const Toast: React.FC<ToastProps> = ({
  type = 'success',
  title,
  message,
  fileInfo,
  action,
  onClose,
  autoClose = false,
  autoCloseTime = 5000
}) => {
  const [visible, setVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(autoCloseTime);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  
  const handleClose = useCallback(() => {
    setVisible(false);
    if (onClose) onClose();
    
    // Clean up any pending animations
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [onClose]);

  // Handle auto-close animation
  useEffect(() => {
    if (!autoClose || !visible) return;
    
    startTimeRef.current = Date.now();
    
    const updateProgress = () => {
      if (isPaused) {
        // If paused, just request the next frame without updating
        animationFrameRef.current = requestAnimationFrame(updateProgress);
        return;
      }
      
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, autoCloseTime - elapsed);
      setTimeRemaining(remaining);
      
      // Continue animation if not yet complete
      if (remaining > 0) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };
    
    // Start the animation
    animationFrameRef.current = requestAnimationFrame(updateProgress);
    
    // Set timeout for actual closing
    timeoutRef.current = setTimeout(() => {
      if (!isPaused) {
        handleClose();
      }
    }, autoCloseTime);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoClose, autoCloseTime, handleClose, visible, isPaused]);
  
  // Pause timer on hover for non-error toasts
  const handleMouseEnter = () => {
    if (autoClose && type !== 'error') {
      setIsPaused(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };
  
  const handleMouseLeave = () => {
    if (autoClose && type !== 'error' && isPaused) {
      setIsPaused(false);
      // Reset the timer with remaining time
      const remainingTime = timeRemaining;
      startTimeRef.current = Date.now() - (autoCloseTime - remainingTime);
      
      // Set new timeout for closing
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, remainingTime);
    }
  };

  if (!visible) return null;

  // Calculate progress percentage for the timer
  const progressPercent = autoClose ? (timeRemaining / autoCloseTime) * 100 : 0;

  // Render file upload toast
  if (type === 'file' && fileInfo) {
    return (
      <div 
        className="file-upload"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="file-icon-container">
          <div className="file-icon">
            <svg width="16" height="21" viewBox="0 0 16 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 0.5C0.9 0.5 0.0100002 1.4 0.0100002 2.5L0 18.5C0 19.6 0.89 20.5 1.99 20.5H14C15.1 20.5 16 19.6 16 18.5V6.5L10 0.5H2ZM9 7.5V2L14.5 7.5H9Z" fill="white"/>
            </svg>
          </div>
        </div>
        <div className="file-info">
          <div className="file-name">{fileInfo.name}</div>
          <div className="file-type">{fileInfo.type}</div>
        </div>
        <div className="file-close" onClick={handleClose}>
          <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0.5C4.47 0.5 0 4.97 0 10.5C0 16.03 4.47 20.5 10 20.5C15.53 20.5 20 16.03 20 10.5C20 4.97 15.53 0.5 10 0.5ZM15 14.09L13.59 15.5L10 11.91L6.41 15.5L5 14.09L8.59 10.5L5 6.91L6.41 5.5L10 9.09L13.59 5.5L15 6.91L11.41 10.5L15 14.09Z" fill="#5E5E5E" fillOpacity="0.6"/>
          </svg>
        </div>
        {autoClose && (
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        )}
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
            padding: 2px 4px;
            width: 24px;
            height: 24px;
          }
          
          .file-icon svg {
            width: 16px;
            height: 21px;
            fill: #FFFFFF;
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
          
          .file-type {
            font-weight: 400;
            font-size: 13.6px;
            line-height: 17px;
            color: rgba(94, 94, 94, 0.8);
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
          
          .progress-container {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background-color: rgba(94, 94, 94, 0.1);
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            overflow: hidden;
          }
          
          .progress-bar {
            height: 100%;
            background-color: #7B61FF;
            transition: width 0.1s linear;
          }
        `}</style>
      </div>
    );
  }

  // Render standard toast types (success, warning, error)
  return (
    <div 
      className={`toast toast-${type}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="toast-content">
        <div className="toast-icon">
          {type === 'success' && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#34CD23"/>
            </svg>
          )}
          {type === 'warning' && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="#F8AC07"/>
            </svg>
          )}
          {type === 'error' && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="#C4102B"/>
            </svg>
          )}
        </div>
        <div className="toast-text">
          <div className="toast-title">{title}</div>
          <div className="toast-message">{message}</div>
          {action && (
            <div className="toast-action" onClick={action.onClick}>
              {action.text}
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="#5E5E5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
        <div className="toast-close" onClick={handleClose}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="#5E5E5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {autoClose && (
        <div className="progress-container">
          <div 
            className={`progress-bar progress-${type}`} 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      )}
      <style jsx>{`
        .toast {
          width: 261px;
          background: #FFFFFF;
          border: 1.5px solid rgba(94, 94, 94, 0.05);
          box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          position: relative;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .toast-content {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 12px;
          gap: 12px;
        }
        
        .toast-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          position: relative;
        }
        
        .toast-icon svg {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        
        .toast-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-width: calc(100% - 60px);
        }
        
        .toast-title {
          font-weight: 500;
          font-size: 15px;
          line-height: 24px;
          color: #5E5E5E;
        }
        
        .toast-message {
          font-weight: 400;
          font-size: 13.6px;
          line-height: 17px;
          color: rgba(94, 94, 94, 0.8);
        }
        
        .toast-action {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          font-weight: 500;
          font-size: 13.6px;
          color: #5E5E5E;
          cursor: pointer;
        }
        
        .toast-action svg {
          width: 16px;
          height: 16px;
        }
        
        .toast-close {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          cursor: pointer;
          padding: 4px;
          box-sizing: border-box;
        }
        
        .toast-close svg {
          width: 100%;
          height: 100%;
        }
        
        .progress-container {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background-color: rgba(94, 94, 94, 0.1);
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          transition: width 0.1s linear;
        }
        
        .progress-success {
          background-color: #34CD23;
        }
        
        .progress-warning {
          background-color: #F8AC07;
        }
        
        .progress-error {
          background-color: #C4102B;
        }
        
        .progress-file {
          background-color: #7B61FF;
        }
        
        /* Add a subtle hover effect for non-error toasts */
        .toast:not(.toast-error):hover {
          box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.1);
        }
        
        /* Add a stronger attention-getting effect for error toasts */
        .toast-error {
          border-left: 4px solid #C4102B;
        }
      `}</style>
    </div>
  );
};

export default Toast;
