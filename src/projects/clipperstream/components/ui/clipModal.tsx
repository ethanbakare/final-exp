import React from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { ButtonOutline, ButtonFull } from './midClipButtons';
import { EntryBox } from './entrybox';

// ClipModal Component
// Modal dialogs for ClipperStream actions

/* ============================================
   CLIP DELETE MODAL - Confirmation dialog for deleting clips
   ============================================ */

interface ClipDeleteModalProps {
  onCancel?: () => void;
  onDelete?: () => void;
  isVisible?: boolean;
  className?: string;
}

export const ClipDeleteModal: React.FC<ClipDeleteModalProps> = ({ 
  onCancel,
  onDelete,
  isVisible = true,
  className = '' 
}) => {
  if (!isVisible) return null;

  return (
    <>
      <div className={`delete-card ${className} ${styles.container}`}>
        {/* Header Section */}
        <div className="delete-header">
          <div className="delete-title">
            Delete Clip
          </div>
          <div className="delete-message">
            This action will remove the clip permanently. Are you sure?
          </div>
        </div>
        
        {/* Buttons Section */}
        <div className="delete-buttons">
          <ButtonOutline 
            onClick={onCancel}
            fullWidth
          >
            Cancel
          </ButtonOutline>
          
          <ButtonFull 
            onClick={onDelete}
            fullWidth
          >
            Delete
          </ButtonFull>
        </div>
      </div>
      
      <style jsx>{`
        .delete-card {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 16px;
          
          width: 247px;
          min-width: 177px;
          height: 141px;
          
          background: #252525;
          border-radius: 16px;
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .delete-header {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 10px 0px;
          gap: 4px;
          
          width: 247px;
          height: 70px;
          
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .delete-title {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-style: normal;
          font-weight: 500;
          font-size: 18px;
          line-height: 22px;
          text-align: center;
          
          color: #FFFFFF;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .delete-message {
          max-width: 207px;
          
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-style: normal;
          font-weight: 400;
          font-size: 13px;
          line-height: 16px;
          text-align: center;
          
          color: rgba(255, 255, 255, 0.8);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .delete-buttons {
          /* Box model */
          box-sizing: border-box;
          
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-start;
          padding: 10px;
          gap: 5px;
          
          width: 247px;
          height: 55px;
          
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   CLIP RENAME MODAL - Input dialog for renaming clips
   ============================================ */

interface ClipRenameModalProps {
  onCancel?: () => void;
  onOK?: () => void;
  value?: string;
  onChange?: (value: string) => void;
  isVisible?: boolean;
  className?: string;
}

export const ClipRenameModal: React.FC<ClipRenameModalProps> = ({ 
  onCancel,
  onOK,
  value,
  onChange,
  isVisible = true,
  className = '' 
}) => {
  if (!isVisible) return null;

  return (
    <>
      <div className={`rename-card ${className} ${styles.container}`}>
        {/* Holder Section - wraps header and input */}
        <div className="rename-holder">
          {/* Header Section */}
          <div className="rename-header">
            <div className="rename-title">
              Rename Clip
            </div>
            <div className="rename-message">
              Enter a new name
            </div>
          </div>
          
          {/* Input Field */}
          <EntryBox
            value={value}
            onChange={onChange}
            placeholder="Clip Title"
          />
        </div>
        
        {/* Buttons Section */}
        <div className="rename-buttons">
          <ButtonOutline 
            onClick={onCancel}
            fullWidth
          >
            Cancel
          </ButtonOutline>
          
          <ButtonFull 
            onClick={onOK}
            fullWidth
          >
            OK
          </ButtonFull>
        </div>
      </div>
      
      <style jsx>{`
        .rename-card {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 16px;
          
          width: 247px;
          min-width: 177px;
          height: 195px;
          
          background: #252525;
          border-radius: 16px;
          
          /* Inside auto layout */
          flex: none;
          order: 2;
          flex-grow: 0;
        }
        
        .rename-holder {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px 8px;
          gap: 28px;
          
          width: 247px;
          height: 124px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .rename-header {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 10px 0px;
          gap: 4px;
          
          width: 231px;
          height: 54px;
          
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .rename-title {
          width: 108px;
          height: 22px;
          
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-style: normal;
          font-weight: 500;
          font-size: 18px;
          line-height: 22px;
          text-align: center;
          
          color: #FFFFFF;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .rename-message {
          width: 207px;
          height: 16px;
          
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-style: normal;
          font-weight: 400;
          font-size: 13px;
          line-height: 16px;
          text-align: center;
          
          color: rgba(255, 255, 255, 0.8);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .rename-buttons {
          /* Box model */
          box-sizing: border-box;
          
          /* Auto layout */
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-start;
          padding: 10px;
          gap: 5px;
          
          width: 247px;
          height: 55px;
          
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   DEFAULT EXPORT
   ============================================ */

export default ClipDeleteModal;

