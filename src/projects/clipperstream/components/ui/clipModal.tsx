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
          <div className={`delete-title ${styles.InterMedium18}`}>
            Delete Clip
          </div>
          <div className={`delete-message ${styles.InterRegular13}`}>
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
          
          background: var(--ClipGrey);
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
          text-align: center;
          
          color: var(--RecWhite);
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .delete-message {
          max-width: 207px;
          
          text-align: center;
          
          color: var(--RecWhite_80);
          
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
          
          border-top: 1px solid var(--RecWhite_05);
          
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
            <div className={`rename-title ${styles.InterMedium18}`}>
              Rename Clip
            </div>
            <div className={`rename-message ${styles.InterRegular13}`}>
              Enter a new name
            </div>
          </div>
          
          {/* Input Field - Auto-focus and select text for easy replacement */}
          <EntryBox
            value={value}
            onChange={onChange}
            placeholder="Clip Title"
            autoFocus={true}
            autoSelect={true}
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
            Save
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
          
          background: var(--ClipGrey);
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
          
          text-align: center;
          
          color: var(--RecWhite);
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .rename-message {
          width: 207px;
          height: 16px;
          
          text-align: center;
          
          color: var(--RecWhite_80);
          
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
          
          border-top: 1px solid var(--RecWhite_05);
          
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
   CLIP DELETE MODAL FULL - Full-width variation with vertical buttons
   Width: 314px (80% of container when used in screens)
   Buttons: Stacked vertically
   Elements: Set to fill available space
   ============================================ */

interface ClipDeleteModalFullProps {
  onCancel?: () => void;
  onDelete?: () => void;
  isVisible?: boolean;
  className?: string;
}

export const ClipDeleteModalFull: React.FC<ClipDeleteModalFullProps> = ({ 
  onCancel,
  onDelete,
  isVisible = true,
  className = '' 
}) => {
  if (!isVisible) return null;

  return (
    <>
      <div className={`delete-card-full ${className} ${styles.container}`}>
        {/* Header Section */}
        <div className="delete-header-full">
          <div className={`delete-title-full ${styles.InterMedium18}`}>
            Delete Clip
          </div>
          <div className={`delete-message-full ${styles.InterRegular13}`}>
            This action will remove the clip permanently. Are you sure?
          </div>
        </div>
        
        {/* Buttons Section - Vertical stacking */}
        <div className="delete-buttons-full">
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
        .delete-card-full {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 16px;
          
          width: 314px;
          min-width: 177px;
          height: 181px;
          
          background: var(--ClipGrey);
          border-radius: 16px;
          
          /* Inside auto layout */
          flex: none;
          flex-grow: 0;
        }
        
        .delete-header-full {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 10px 0px;
          gap: 4px;
          
          width: 314px;
          height: 70px;
          
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .delete-title-full {
          text-align: center;
          
          color: var(--RecWhite);
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .delete-message-full {
          max-width: 207px;
          
          text-align: center;
          
          color: var(--RecWhite_80);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .delete-buttons-full {
          /* Box model */
          box-sizing: border-box;
          
          /* Auto layout - VERTICAL stacking */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: stretch;  /* Stretch children to fill width */
          padding: 10px;
          gap: 5px;
          
          width: 314px;
          height: 95px;
          
          border-top: 1px solid var(--RecWhite_05);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* Force buttons to fill width in vertical layout */
        .delete-buttons-full :global(button) {
          width: 100% !important;
          min-width: unset !important;
          flex: none !important;
        }
      `}</style>
    </>
  );
};

/* ============================================
   CLIP RENAME MODAL FULL - Full-width variation with vertical buttons
   Width: 314px (80% of container when used in screens)
   Buttons: Stacked vertically
   Elements: Set to fill available space
   ============================================ */

interface ClipRenameModalFullProps {
  onCancel?: () => void;
  onSave?: () => void;
  value?: string;
  onChange?: (value: string) => void;
  isVisible?: boolean;
  className?: string;
}

export const ClipRenameModalFull: React.FC<ClipRenameModalFullProps> = ({ 
  onCancel,
  onSave,
  value,
  onChange,
  isVisible = true,
  className = '' 
}) => {
  if (!isVisible) return null;

  return (
    <>
      <div className={`rename-card-full ${className} ${styles.container}`}>
        {/* Holder Section - wraps header and input */}
        <div className="rename-holder-full">
          {/* Header Section */}
          <div className="rename-header-full">
            <div className={`rename-title-full ${styles.InterMedium18}`}>
              Rename Clip
            </div>
            <div className={`rename-message-full ${styles.InterRegular13}`}>
              Enter a new name
            </div>
          </div>
          
          {/* Input Field - Auto-focus and select text for easy replacement */}
          <EntryBox
            value={value}
            onChange={onChange}
            placeholder="Clip Title"
            autoFocus={true}
            autoSelect={true}
          />
        </div>
        
        {/* Buttons Section - Vertical stacking */}
        <div className="rename-buttons-full">
          <ButtonOutline 
            onClick={onCancel}
            fullWidth
          >
            Cancel
          </ButtonOutline>
          
          <ButtonFull 
            onClick={onSave}
            fullWidth
          >
            Save
          </ButtonFull>
        </div>
      </div>
      
      <style jsx>{`
        .rename-card-full {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 16px;
          
          width: 314px;
          min-width: 177px;
          height: 234px;
          
          background: var(--ClipGrey);
          border-radius: 16px;
          
          /* Inside auto layout */
          flex: none;
          flex-grow: 0;
        }
        
        .rename-holder-full {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px 10px;
          gap: 28px;
          
          width: 314px;
          height: 120px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .rename-header-full {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 10px 0px;
          gap: 4px;
          
          width: 294px;
          height: 54px;
          
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
        
        .rename-title-full {
          text-align: center;
          
          color: var(--RecWhite);
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        .rename-message-full {
          text-align: center;
          
          color: var(--RecWhite_80);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }
        
        .rename-buttons-full {
          /* Box model */
          box-sizing: border-box;
          
          /* Auto layout - VERTICAL stacking */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: stretch;  /* Stretch children to fill width */
          padding: 10px;
          gap: 5px;
          
          width: 314px;
          height: 98px;
          
          border-top: 1px solid var(--RecWhite_05);
          
          /* Inside auto layout */
          flex: none;
          order: 1;
          align-self: stretch;
          flex-grow: 0;
        }
        
        /* Force buttons to fill width in vertical layout */
        .rename-buttons-full :global(button) {
          width: 100% !important;
          min-width: unset !important;
          flex: none !important;
        }
        
        /* Make EntryBox fill the width */
        .rename-holder-full :global(.rename-outline) {
          width: 100% !important;
        }
      `}</style>
    </>
  );
};

/* ============================================
   DEFAULT EXPORT
   ============================================ */

export default ClipDeleteModal;

