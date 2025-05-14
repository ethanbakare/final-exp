import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';

// Navbar state enum
export enum NavbarState {
  INITIAL = 'INITIAL',
  READY_TO_PROCESS = 'READY_TO_PROCESS',
  PROCESSING = 'PROCESSING',
  TABLE_VIEW = 'TABLE_VIEW',
  EDIT_MODE = 'EDIT_MODE'
}

interface ReceiptNavbarProps {
  initialState?: NavbarState;
  selectedFile?: File | null;
  onProcessReceipt?: () => void;
  isProcessing?: boolean;
  processingError?: string | null;
  onDownload?: () => void;
  onDelete?: () => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onUploadClick?: () => void;
  className?: string;
}

const ReceiptNavbar: React.FC<ReceiptNavbarProps> = ({
  initialState = NavbarState.INITIAL,
  selectedFile = null,
  onProcessReceipt,
  isProcessing = false,
  processingError = null,
  onDownload,
  onDelete,
  onEditStart,
  onEditEnd,
  onUploadClick,
  className = '',
}) => {
  const [state, setState] = useState<NavbarState>(initialState);

  // Update state if selected file changes externally or initial state changes
  useEffect(() => {
    setState(initialState);
  }, [initialState]);
  
  // Update state if selectedFile changes
  useEffect(() => {
    if (selectedFile && state === NavbarState.INITIAL) {
      setState(NavbarState.READY_TO_PROCESS);
    } else if (!selectedFile && state !== NavbarState.INITIAL) {
      setState(NavbarState.INITIAL);
    }
  }, [selectedFile, state]);

  // Event handlers with state transitions
  const handleUpload = () => {
    // Call the external onUploadClick handler if provided
    if (onUploadClick) {
      onUploadClick();
    }
    
    console.log('Upload button clicked');
    // No automatic state transition - will be controlled by selectedFile
  };

  const handleProcess = () => {
    // Don't update state here - will be controlled by Interface component
    console.log('Process button clicked');
    if (onProcessReceipt) {
      onProcessReceipt();
    }
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

  // Function to render the Ready to Process / Processing state UI
  const renderProcessingUI = () => (
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
          disabled={isProcessing || state === NavbarState.PROCESSING}
          className={isProcessing || state === NavbarState.PROCESSING ? 'processing' : ''}
        >
          {isProcessing || state === NavbarState.PROCESSING ? 'Processing...' : 'Process Receipt'}
        </Button>
        
        {processingError && (
          <div className="error-message">{processingError}</div>
        )}
      </div>
    </>
  );

  return (
    <div className={`receipt-navbar-container ${className}`}>
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

      {/* Ready to Process and Processing States share the same UI with minor differences */}
      {(state === NavbarState.READY_TO_PROCESS || state === NavbarState.PROCESSING) && renderProcessingUI()}

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
        .receipt-navbar-container {
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
          .receipt-navbar-container {
            padding: 5px;
            gap: 5px;
            min-width: auto;
          }
          
          .left-buttons,
          .right-buttons {
            gap: 5px;
          }
        }

        /* Add processing button styles */
        .processing {
          opacity: 0.7;
          position: relative;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #B42318;
          font-size: 12px;
          margin-top: 4px;
        }
        `}
      </style>
    </div>
  );
};

export default ReceiptNavbar;
