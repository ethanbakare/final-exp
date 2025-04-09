import React, { useState } from 'react';

interface CardProps {
  onFileSelect?: (file: File) => void;
  className?: string;
}

const Card: React.FC<CardProps> = ({ onFileSelect, className = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && onFileSelect) {
      onFileSelect(files[0]);
    }
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
    if (files && files.length > 0 && onFileSelect) {
      onFileSelect(files[0]);
    }
  };
  
  return (
    <div className={`card ${className}`}>
      <label 
        className={`outline-box ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept=".jpg,.jpeg,.png,.bmp" 
          onChange={handleFileChange} 
          style={{ display: 'none' }}
        />
        
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
          <div className="primary-text">Click to select receipt</div>
          <div className="secondary-text">JPG, JPEG, PNG or BMP</div>
        </div>
      </label>

      <style jsx>{`
        .card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          gap: 20px;
          width: 100%;
          max-width: 600px;
          min-height: 336px;
          background: #FFFFFF;
          border-radius: 10px;
          box-sizing: border-box;
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
          min-height: 296px;
          border: 1.5px dashed rgba(94, 94, 94, 0.2);
          border-radius: 6px;
          flex-grow: 1;
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
          font-family: 'Inter';
          font-style: normal;
          font-weight: 400;
          font-size: 16px;
          line-height: 143.75%;
          text-align: center;
          letter-spacing: -0.01em;
          color: #5E5E5E;
          opacity: 0.82;
        }
        
        .secondary-text {
          font-family: 'Inter';
          font-style: normal;
          font-weight: 400;
          font-size: 16px;
          line-height: 143.75%;
          text-align: center;
          letter-spacing: -0.01em;
          color: rgba(94, 94, 94, 0.5);
          opacity: 0.82;
        }
      `}</style>
    </div>
  );
};

export default Card;
