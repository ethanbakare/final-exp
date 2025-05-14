import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import styles from '../../styles/Components.module.css';
import FilePreviewLoad from '../ui/FilePreviewLoad';
import FilePreviewError from '../ui/FilePreviewError';

interface ReceiptCardProps {
  onFileSelect?: (file: File | null) => void;
  className?: string;
}

// Define the ref type for external control
export interface ReceiptCardRef {
  triggerFileSelect: () => void;
}

// List of allowed file types and maximum size
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileValidationResult {
  valid: boolean;
  errorTitle?: string;
  errorMessage?: string;
}

const ReceiptCard = forwardRef<ReceiptCardRef, ReceiptCardProps>(({ 
  onFileSelect, 
  className = ''
}, ref) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'error' | 'complete'>('idle');
  const [errorDetails, setErrorDetails] = useState<{ title: string; message: string } | null>(null);
  const uploadStartTimeRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Expose methods via ref for external control
  useImperativeHandle(ref, () => ({
    triggerFileSelect: () => {
      if (uploadStatus === 'idle' && fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  }));
  
  const validateFile = (file: File): FileValidationResult => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { 
        valid: false,
        errorTitle: 'Invalid File Type',
        errorMessage: 'Please upload a JPG, JPEG, PNG, or BMP image'
      };
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return { 
        valid: false,
        errorTitle: 'File Too Large',
        errorMessage: `Maximum size is ${maxSizeMB}MB, your file is ${actualSizeMB}MB`
      };
    }
    
    // Check for empty or corrupt files
    if (file.size === 0) {
      return {
        valid: false,
        errorTitle: 'Empty File',
        errorMessage: 'The file appears to be empty or corrupt'
      };
    }
    
    return { valid: true };
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate the file
      const validation = validateFile(file);
      
      if (!validation.valid) {
        setUploadStatus('error');
        setErrorDetails({
          title: validation.errorTitle || 'Invalid File',
          message: validation.errorMessage || 'The selected file cannot be processed'
        });
        return;
      }
      
      // Start upload process
      startFileUpload(file);
    }
    // If no files were selected (canceled), we do nothing
    // This maintains the current state without transitions
  };
  
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate the file
      const validation = validateFile(file);
      
      if (!validation.valid) {
        setUploadStatus('error');
        setErrorDetails({
          title: validation.errorTitle || 'Invalid File',
          message: validation.errorMessage || 'The selected file cannot be processed'
        });
        return;
      }
      
      // Start upload process
      startFileUpload(file);
    }
  };
  
  const startFileUpload = (file: File) => {
    setSelectedFile(file);
    setUploadStatus('uploading');
    uploadStartTimeRef.current = Date.now();
    
    // Calculate real upload time based on file size (simulated)
    // Minimum 2 seconds as required
    const fileSize = file.size;
    const uploadSpeed = 1024 * 1024; // 1MB per second (simulated speed)
    const calculatedUploadTime = Math.max(2000, (fileSize / uploadSpeed) * 1000);
    
    // Simulate upload completion after calculated time
    setTimeout(() => {
      setUploadStatus('complete');
      // Only trigger onFileSelect when upload is truly complete
      if (onFileSelect) {
        onFileSelect(file);
      }
      console.log(`Selected file: ${file.name} (${file.type}, ${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
    }, calculatedUploadTime);
  };
  
  const handleFilePreviewClose = () => {
    setUploadStatus('idle');
    setSelectedFile(null);
    setErrorDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Notify parent that file was removed
    if (onFileSelect) {
      onFileSelect(null);
    }
  };
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const handleLabelClick = () => {
    if (uploadStatus === 'idle' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className={`receipt-card ${styles.container} ${className}`}>
      <div className="outline-box-container">
        {/* Hidden file input */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".jpg,.jpeg,.png,.bmp" 
          onChange={handleFileChange} 
          style={{ display: 'none' }}
        />
        
        {uploadStatus === 'idle' ? (
          <div 
            className={`outline-box ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleLabelClick}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_191_445)">
                <path d="M9 16H15V10H19L12 3L5 10H9V16ZM5 18H19V20H5V18Z" fill="#5E5E5E" fillOpacity="0.8"/>
              </g>
              <defs>
                <clipPath id="clip0_191_445">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            
            <div className="text-container">
              <div className={`primary-text ${styles.bodyH1}`}>Click to select receipt</div>
              <div className={`secondary-text ${styles.bodyH1}`}>
                JPG, JPEG, PNG or BMP (max {MAX_FILE_SIZE / (1024 * 1024)}MB)
              </div>
            </div>
          </div>
        ) : uploadStatus === 'uploading' || uploadStatus === 'complete' ? (
          <div className="outline-box">
            <div className="preview-container">
              {selectedFile && (
                <FilePreviewLoad 
                  fileInfo={{
                    name: selectedFile.name,
                    size: formatFileSize(selectedFile.size)
                  }}
                  onClose={handleFilePreviewClose}
                  simulateLoadTime={Math.max(2000, (selectedFile.size / (1024 * 1024)) * 1000)} // Min 2 seconds
                />
              )}
            </div>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="outline-box">
            <div className="preview-container">
              <FilePreviewError 
                fileInfo={{
                  name: errorDetails?.title || "Upload failed",
                  type: errorDetails?.message || "Unsupported file format"
                }}
                onClose={handleFilePreviewClose}
              />
            </div>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .receipt-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          gap: 20px;
          width: 100%;
          max-width: 600px;
          height: 336px;
          background: #FFFFFF;
          border-radius: 10px;
          box-sizing: border-box;
          margin: 0 auto;
        }
        
        .outline-box-container {
          width: 100%;
          height: 296px;
        }
        
        .outline-box {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 0px 0px;
          gap: 10px;
          width: 100%;
          height: 100%;
          border: 1.5px dashed rgba(94, 94, 94, 0.2);
          border-radius: 6px;
          cursor: pointer;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }
        
        .outline-box.drag-over {
          border-color: rgba(94, 94, 94, 0.5);
          background-color: rgba(94, 94, 94, 0.05);
        }
        
        .text-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px;
          gap: 4px;
          margin-top: 10px;
        }
        
        .primary-text {
          color: rgba(94, 94, 94, 0.8);
        }
        
        .secondary-text {
          color: rgba(94, 94, 94, 0.4);
          font-size: 13.6px;
        }
        
        .preview-container {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </div>
  );
});

// Add displayName for the component
ReceiptCard.displayName = 'ReceiptCard';

export default ReceiptCard;
