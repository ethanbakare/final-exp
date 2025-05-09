import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';

// Navbar state enum
export enum NavbarState {
  INITIAL = 'INITIAL',
  READY_TO_PROCESS = 'READY_TO_PROCESS',
  TABLE_VIEW = 'TABLE_VIEW',
  EDIT_MODE = 'EDIT_MODE'
}

interface NavbarProps {
  initialState?: NavbarState;
  selectedFile?: File | null;
  onFileProcessed?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({
  initialState = NavbarState.INITIAL,
  selectedFile = null,
  onFileProcessed,
  onDownload,
  onDelete,
  onEditStart,
  onEditEnd,
  className = '',
}) => {
  const [state, setState] = useState<NavbarState>(initialState);

  // Update state if selectedFile changes externally
  useEffect(() => {
    if (selectedFile && state === NavbarState.INITIAL) {
      setState(NavbarState.READY_TO_PROCESS);
    }
  }, [selectedFile, state]);

  // Event handlers with state transitions
  const handleUpload = () => {
    // This would typically trigger a file selector
    console.log('Upload button clicked');
    
    // For demo purposes, simulate file selection
    setTimeout(() => {
      setState(NavbarState.READY_TO_PROCESS);
    }, 500);
  };

  const handleProcess = () => {
    setState(NavbarState.TABLE_VIEW);
    console.log('Process button clicked');
    onFileProcessed?.();
  };

  const handleEdit = () => {
    setState(NavbarState.EDIT_MODE);
    console.log('Edit button clicked');
    onEditStart?.();
  };

  const handleApplyChanges = () => {
    setState(NavbarState.TABLE_VIEW);
    console.log('Apply changes button clicked');
    onEditEnd?.();
  };

  const handleDownload = () => {
    console.log('Download button clicked');
    onDownload?.();
  };

  const handleDelete = () => {
    setState(NavbarState.INITIAL);
    console.log('Delete button clicked');
    onDelete?.();
  };

  // Material Icons for download button
  const downloadIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
    </svg>
  );

  return (
    <div className={`navbar-container ${className}`}>
      {/* Initial State: Disabled download + Upload Receipt */}
      {state === NavbarState.INITIAL && (
        <>
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
              onClick={handleUpload}
            >
              Upload Receipt
            </Button>
          </div>
        </>
      )}

      {/* Ready to Process State: Disabled download + Process Receipt */}
      {state === NavbarState.READY_TO_PROCESS && (
        <>
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
              onClick={handleProcess}
            >
              Process Receipt
            </Button>
          </div>
        </>
      )}

      {/* Table View State: Download + Edit + Delete */}
      {state === NavbarState.TABLE_VIEW && (
        <>
          <div className="left-buttons">
            <Button 
              variant="secondary" 
              type="icon" 
              onClick={handleDownload}
              icon={downloadIcon}
            />
            <Button 
              variant="tertiary" 
              type="text" 
              onClick={handleEdit}
            >
              Edit results
            </Button>
          </div>
          <div className="right-buttons">
            <Button 
              variant="delete" 
              type="icon" 
              onClick={handleDelete}
            />
          </div>
        </>
      )}

      {/* Edit Mode State: Download + Apply Changes + Delete */}
      {state === NavbarState.EDIT_MODE && (
        <>
          <div className="left-buttons">
            <Button 
              variant="secondary" 
              type="icon" 
              onClick={handleDownload}
              icon={downloadIcon}
            />
            <Button 
              variant="primary" 
              type="text" 
              onClick={handleApplyChanges}
            >
              Apply changes
            </Button>
          </div>
          <div className="right-buttons">
            <Button 
              variant="delete" 
              type="icon" 
              onClick={handleDelete}
            />
          </div>
        </>
      )}

      <style jsx>{`
        .navbar-container {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          padding: 5px;
          gap: 10px;
          
          width: 100%;
          max-width: 528px;
          height: 50px;
          min-height: 50px;
        //   box-sizing: border-box;
          
          background: rgba(94, 94, 94, 0.1);
          border-radius: 12px;
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
          .navbar-container {
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

export default Navbar;
