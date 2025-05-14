import React, { useState, useCallback } from 'react';

interface FileInfo {
  name: string;
  size: string;
}

interface FilePreviewProps {
  fileInfo?: FileInfo;
  onClose?: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  fileInfo = { name: "receipt_photo.jpg", size: "2.4 MB" },
  onClose
}) => {
  const [visible, setVisible] = useState(true);

  const handleClose = useCallback(() => {
    setVisible(false);
    if (onClose) onClose();
    console.log("FilePreview closed");
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="file-upload">
      <div className="file-icon-container">
        <div className="file-icon">
          <svg width="16" height="21" viewBox="0 0 16 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 0.5C0.9 0.5 0.0100002 1.4 0.0100002 2.5L0 18.5C0 19.6 0.89 20.5 1.99 20.5H14C15.1 20.5 16 19.6 16 18.5V6.5L10 0.5H2ZM9 7.5V2L14.5 7.5H9Z" fill="white"/>
          </svg>
        </div>
      </div>
      <div className="file-info">
        <div className="file-name">{fileInfo.name}</div>
        <div className="file-size">{fileInfo.size}</div>
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
        
        .file-size {
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

export default FilePreview; 