import React, { useState, useCallback } from 'react';
import styles from '../../styles/Components.module.css';

interface FileInfo {
  name: string;
  type: string;
}

interface FilePreviewErrorProps {
  fileInfo?: FileInfo;
  onClose?: () => void;
}

const FilePreviewError: React.FC<FilePreviewErrorProps> = ({
  fileInfo = { name: "Upload failed", type: "Error" },
  onClose
}) => {
  const [visible, setVisible] = useState(true);

  const handleClose = useCallback(() => {
    setVisible(false);
    if (onClose) onClose();
    console.log("FilePreviewError closed");
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="file-holder">
      <div className="file-upload">
        <div className="file-icon-container">
          <div className="file-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 22C5.45 22 4.97917 21.8042 4.5875 21.4125C4.19583 21.0208 4 20.55 4 20V4C4 3.45 4.19583 2.97917 4.5875 2.5875C4.97917 2.19583 5.45 2 6 2H14L20 8V12.35C19.6833 12.2333 19.3583 12.1458 19.025 12.0875C18.6917 12.0292 18.35 12 18 12V9H13V4H6V20H12.35C12.4833 20.3833 12.65 20.7417 12.85 21.075C13.05 21.4083 13.2833 21.7167 13.55 22H6ZM15.9 21.5L14.5 20.1L16.6 18L14.5 15.9L15.9 14.5L18 16.6L20.1 14.5L21.5 15.9L19.425 18L21.5 20.1L20.1 21.5L18 19.425L15.9 21.5Z" fill="white"/>
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
      </div>
      <div className={`file-format-note ${styles.InterRegular12}`}>
        Note: File formats allowed (JPG, JPEG, PNG or BMP) Maximum file size: 25MB
      </div>
      <style jsx>{`
        .file-holder {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 276px;
        }

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
        
        .file-format-note {
          color: #882C2C;
          padding: 0 4px;
          text-align: center;
        }
        
        .file-icon-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          padding: 0px 8px;
          gap: 10px;
          width: 40px;
          background: #B42318;
          border-radius: 4px;
          align-self: stretch;
        }
        
        .file-icon {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          padding: 2px 4px;
          width: 32px;
          height: 32px;
        }
        
        .file-icon svg {
          width: 32px;
          height: 32px;
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
      `}</style>
    </div>
  );
};

export default FilePreviewError; 