import React, { useState, useRef, useEffect } from 'react';
import Header from './layout/Header';
import TextCard from './layout/TextCard';
import ReceiptCard, { ReceiptCardRef } from './layout/ReceiptCard';
import ReceiptNavbar, { NavbarState } from './layout/ReceiptNavbar';
import SpeakNavbar from './layout/SpeakNavbar';
import ReceiptDisplay from './ReceiptDisplay';
import Toast from './ui/Toast';
import { processReceiptImage } from '../services/apiService';
import { useReceipt } from '../context/ReceiptContext';
import styles from '../styles/Components.module.css';

// Constants for validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];

const Interface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'speak'>('scan');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [navbarState, setNavbarState] = useState<NavbarState>(NavbarState.INITIAL);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [validationToast, setValidationToast] = useState<{
    visible: boolean;
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    autoClose?: boolean;
    autoCloseTime?: number;
  } | null>(null);
  
  const { setReceipt } = useReceipt();
  const receiptCardRef = useRef<ReceiptCardRef>(null);

  const handleTabChange = (tab: 'scan' | 'speak') => {
    setActiveTab(tab);
  };

  // Update navbar state when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      setNavbarState(NavbarState.READY_TO_PROCESS);
    } else {
      setNavbarState(NavbarState.INITIAL);
    }
  }, [selectedFile]);

  // Validate file type and size before setting it
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Invalid file format. Please upload a JPG, JPEG, PNG, or BMP image.' 
      };
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
      };
    }
    
    return { valid: true };
  };

  const handleFileSelect = (file: File | null) => {
    // Reset previous errors when selecting a new file
    setProcessingError(null);
    
    if (!file) {
      setSelectedFile(null);
      console.log('File selection cleared');
      return;
    }
    
    // Validate the file before accepting it
    const validation = validateFile(file);
    
    if (!validation.valid) {
      // Display error toast
      setValidationToast({
        visible: true,
        type: 'error',
        title: 'File Error',
        message: validation.error || 'Invalid file',
        autoClose: true,
        autoCloseTime: 5000
      });
      console.error(`File validation error: ${validation.error}`);
      return;
    }
    
    // Set the validated file
    setSelectedFile(file);
    console.log(`Selected file: ${file.name} (${file.type}, ${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
  };

  const handleUploadClick = () => {
    // Trigger file selection dialog in ReceiptCard
    if (receiptCardRef.current) {
      receiptCardRef.current.triggerFileSelect();
    }
  };

  const handleProcessReceipt = async () => {
    if (!selectedFile) return;
    
    // Validate the file again before processing
    const validation = validateFile(selectedFile);
    
    if (!validation.valid) {
      setValidationToast({
        visible: true,
        type: 'error',
        title: 'File Error',
        message: validation.error || 'Invalid file',
        autoClose: true,
        autoCloseTime: 5000
      });
      return;
    }
    
    // Start processing
    setIsProcessing(true);
    setProcessingError(null);
    setNavbarState(NavbarState.PROCESSING);
    
    // Show processing toast
    setValidationToast({
      visible: true,
      type: 'warning',
      title: 'Processing Receipt',
      message: 'Please wait while we analyze your receipt...',
      autoClose: false
    });
    
    try {
      // Call the API service to process the receipt image
      const data = await processReceiptImage(selectedFile);
      
      // Store the receipt data in context
      setReceipt(data);
      
      // Configure toast notification based on API validation status
      if (data.validation_ui) {
        // Configure auto-close behavior based on the validation status
        let autoClose = true;
        let autoCloseTime = 5000;
        
        // Errors should stay longer or require user dismissal
        if (data.validation_ui.status === 'error') {
          autoClose = false; // Require user to dismiss errors
        } else if (data.validation_ui.status === 'warning') {
          autoCloseTime = 8000; // Warnings stay longer but auto-close
        }
        
        setValidationToast({
          visible: true,
          type: data.validation_ui.status,
          title: data.validation_ui.header,
          message: data.validation_ui.body,
          autoClose,
          autoCloseTime
        });
      } else {
        // If no validation_ui, show a success message
        setValidationToast({
          visible: true,
          type: 'success',
          title: 'Receipt Processed',
          message: 'Your receipt has been successfully analyzed.',
          autoClose: true,
          autoCloseTime: 5000
        });
      }
      
      // Update navbar state to show receipt data UI
      setNavbarState(NavbarState.TABLE_VIEW);
      
      console.log('File processed successfully');
    } catch (error) {
      console.error('Error processing receipt:', error);
      
      // Extract detailed error message 
      let errorMessage = 'An unexpected error occurred';
      let errorTitle = 'Processing Error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for network errors
        if (error.name === 'AbortError') {
          errorTitle = 'Connection Timeout';
          errorMessage = 'The request took too long to complete. Please try again.';
        } else if (error.message.includes('NetworkError')) {
          errorTitle = 'Network Error';
          errorMessage = 'Could not connect to the server. Please check your internet connection.';
        } else if (error.message.includes('404')) {
          errorTitle = 'Service Unavailable';
          errorMessage = 'The receipt processing service is currently unavailable. Please try again later.';
        } else if (error.message.includes('500')) {
          errorTitle = 'Server Error';
          errorMessage = 'Our servers encountered an error. Please try again later.';
        }
      }
      
      setProcessingError(errorMessage);
      
      // Show error toast notification with more user-friendly message
      setValidationToast({
        visible: true,
        type: 'error',
        title: errorTitle,
        message: errorMessage,
        autoClose: false // Errors require manual dismissal
      });
      
      // Revert to READY_TO_PROCESS state on error
      setNavbarState(NavbarState.READY_TO_PROCESS);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    console.log('File download requested');
  };

  const handleDelete = () => {
    setSelectedFile(null);
    setNavbarState(NavbarState.INITIAL);
    setReceipt(null);
    setValidationToast(null);
    console.log('File deleted');
  };

  const handleEditStart = () => {
    setNavbarState(NavbarState.EDIT_MODE);
    console.log('Edit mode started');
  };

  const handleEditEnd = () => {
    setNavbarState(NavbarState.TABLE_VIEW);
    console.log('Edit mode ended');
  };

  const handleToastClose = () => {
    setValidationToast(null);
  };

  return (
    <div className={`interface ${styles.container}`}>
      <div className="subinterface">
        <Header 
          initialActiveTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        
        {activeTab === 'scan' && (
          <>
            {navbarState === NavbarState.TABLE_VIEW || navbarState === NavbarState.EDIT_MODE ? (
              <ReceiptDisplay />
            ) : (
              <ReceiptCard 
                ref={receiptCardRef}
                onFileSelect={handleFileSelect}
              />
            )}
          </>
        )}
        
        {activeTab === 'speak' && (
          <TextCard 
            placeholder="Type your message here or click to speak..." 
            showPreview={false}
          />
        )}
      </div>
      
      <div className="navbar-container">
        {activeTab === 'scan' ? (
          <ReceiptNavbar 
            initialState={navbarState}
            selectedFile={selectedFile}
            onProcessReceipt={handleProcessReceipt}
            isProcessing={isProcessing}
            processingError={processingError}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onEditStart={handleEditStart}
            onEditEnd={handleEditEnd}
            onUploadClick={handleUploadClick}
          />
        ) : (
          <SpeakNavbar />
        )}
      </div>
      
      {/* Toast notification for validation status */}
      {validationToast && validationToast.visible && (
        <div className="toast-container">
          <Toast 
            type={validationToast.type}
            title={validationToast.title}
            message={validationToast.message}
            autoClose={validationToast.autoClose ?? validationToast.type !== 'error'}
            autoCloseTime={validationToast.autoCloseTime ?? 5000}
            onClose={handleToastClose}
            action={
              validationToast.type === 'error' ? {
                text: 'Try Again',
                onClick: () => {
                  handleToastClose();
                  setProcessingError(null);
                }
              } : undefined
            }
          />
        </div>
      )}
      
      <style jsx>{`
        .interface {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 600px;
        }
        
        .subinterface {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          gap: 12px;
          margin-bottom: 32px;
        }
        
        .navbar-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        
        .toast-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }
      `}</style>
    </div>
  );
};

export default Interface; 