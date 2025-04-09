import React, { useState } from 'react';

interface TextCardProps {
  onTextChange?: (text: string) => void;
  className?: string;
  placeholder?: string;
}

const TextCard: React.FC<TextCardProps> = ({ 
  onTextChange, 
  className = '',
  placeholder = 'Type your message here.'
}) => {
  const [text, setText] = useState('');
  
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setText(newText);
    if (onTextChange) {
      onTextChange(newText);
    }
  };
  
  return (
    <div className={`card ${className}`}>
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder={placeholder}
        className="textarea"
      />

      <style jsx>{`
        .card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          width: 100%;
          max-width: 600px;
          min-height: 336px;
          background: #FFFFFF;
          border-radius: 10px;
          box-sizing: border-box;
        }
        
        .textarea {
          display: flex;
          min-height: 296px;
          width: 100%;
          resize: none;
          border-radius: 6px;
          border: 1.2px solid rgba(94, 94, 94, 0.2);
          background-color: transparent;
          padding: 20px;
          font-size: 16px;
          line-height: 1.5;
          font-family: 'Inter';
          color: #5E5E5E;
          transition: border-color 0.2s, box-shadow 0.2s;
          caret-color:rgb(81, 50, 40);
        }

        .textarea::placeholder {
          color: rgba(94, 94, 94, 0.3);
        }

        .textarea:focus {
          outline: none;
          border-color:#94a3b8;
          box-shadow: 0 0 0 2.4px rgba(148, 163, 184, 0.35);
        }

        .textarea:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default TextCard; 