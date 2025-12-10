import React from 'react';
import styles from '@/projects/clipperstream/styles/clipper.module.css';
import { SubCopyIcon, SubDeleteRow, SubRenameIcon, SubTranscribeIcon } from './subclipbuttons';

// ClipperStream Dropdown Menu Components
// Dropdown menus triggered by triple-dot icon

/* ============================================
   INTERFACES
   ============================================ */

interface MenuRowProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
}

interface OptionsDropDownProps {
  onRenameClick?: () => void;
  onCopyClick?: () => void;
  onDeleteClick?: () => void;
  showCopyText?: boolean;  // Hide copy when clip is pending/transcribing (default: true)
  className?: string;
}

interface TranscribeDropDownProps {
  onTranscribeClick?: () => void;
  onDeleteClick?: () => void;
  className?: string;
}

/* ============================================
   MENU ROW - Reusable row component
   ============================================ */

const MenuRow: React.FC<MenuRowProps> = ({ 
  icon, 
  text, 
  onClick
}) => {
  return (
    <>
      <div 
        className="menu-row"
        onClick={onClick}
      >
        <div className="menu-icon-wrapper">
          {icon}
        </div>
        <span className={`menu-text ${styles.InterRegular16}`}>
          {text}
        </span>
      </div>

      <style jsx>{`
        .menu-row {
          /* Auto layout */
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 8px 10px 8px 6px;
          gap: 6px;
          
          height: 35px;
          
          border-radius: 6px;
          cursor: pointer;
          
          /* Inside auto layout */
          flex: none;
          align-self: stretch;
          flex-grow: 0;
          
          /* Transition for smooth hover */
          transition: background 0.15s ease;
        }
        
        /* Hover state - 5% white overlay (only on hover, no default highlight) */
        .menu-row:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        
        /* Icon wrapper */
        .menu-icon-wrapper {
          width: 18px;
          height: 18px;
          
          display: flex;
          align-items: center;
          justify-content: center;
          
          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }
        
        /* Text */
        .menu-text {
          height: 19px;
          color: var(--ClipWhite);
          
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
   OPTIONS DROPDOWN
   Contains: Rename, Copy, Delete rows
   Dynamic width based on content
   ============================================ */

export const OptionsDropDown: React.FC<OptionsDropDownProps> = ({
  onRenameClick,
  onCopyClick,
  onDeleteClick,
  showCopyText = true,  // Default: show copy text (clip is transcribed)
  className = ''
}) => {
  return (
    <>
      <div className={`options-dropdown ${className} ${styles.container}`}>
        <MenuRow 
          icon={<SubRenameIcon />}
          text="Rename"
          onClick={onRenameClick}
        />
        {/* Only show Copy Text when clip is transcribed (not pending/transcribing) */}
        {showCopyText && (
          <MenuRow 
            icon={<SubCopyIcon />}
            text="Copy Text"
            onClick={onCopyClick}
          />
        )}
        <MenuRow 
          icon={<SubDeleteRow />}
          text="Delete"
          onClick={onDeleteClick}
        />
      </div>

      <style jsx>{`
        .options-dropdown {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 4px;
          
          width: fit-content;  /* Dynamic width based on content */
          min-width: 119px;    /* Minimum width for comfortable layout */
          
          background: var(--ClipGrey);
          box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.18);
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          flex-grow: 0;
        }
      `}</style>
    </>
  );
};

/* ============================================
   TRANSCRIBE DROPDOWN
   Contains: Transcribe, Delete rows
   Dynamic width based on content
   ============================================ */

export const TranscribeDropDown: React.FC<TranscribeDropDownProps> = ({
  onTranscribeClick,
  onDeleteClick,
  className = ''
}) => {
  return (
    <>
      <div className={`transcribe-dropdown ${className} ${styles.container}`}>
        <MenuRow 
          icon={<SubTranscribeIcon />}
          text="Transcribe"
          onClick={onTranscribeClick}
        />
        <MenuRow 
          icon={<SubDeleteRow />}
          text="Delete"
          onClick={onDeleteClick}
        />
      </div>

      <style jsx>{`
        .transcribe-dropdown {
          /* Auto layout */
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 4px;
          
          width: fit-content;  /* Dynamic width based on content */
          min-width: 128px;    /* Minimum width for comfortable layout */
          
          background: var(--ClipGrey);
          box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.18);
          border-radius: 8px;
          
          /* Inside auto layout */
          flex: none;
          flex-grow: 0;
          z-index: 2;
        }
      `}</style>
    </>
  );
};

// Create a named object for default export
const clipMenuDropdown = {
  OptionsDropDown,
  TranscribeDropDown
};

export default clipMenuDropdown;

