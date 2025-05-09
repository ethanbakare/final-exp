import React from 'react';
import styles from '../../styles/Components.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'done' | 'close' | 'delete';

interface ButtonProps {
  variant?: ButtonVariant;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  type?: 'icon' | 'text';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  onClick,
  icon,
  className = '',
  disabled = false,
  children,
  type = 'icon',
}) => {
  // Default icon with improved SVG structure
  const defaultIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_button_download)">
        <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
      </g>
      <defs>
        <clipPath id="clip0_button_download">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );

  // Check icon for the "done" button
  const checkIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1684_1478)">
        <path d="M9.00016 16.17L4.83016 12L3.41016 13.41L9.00016 19L21.0002 7L19.5902 5.59L9.00016 16.17Z" fill="currentColor"/>
      </g>
      <defs>
        <clipPath id="clip0_1684_1478">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );

  // Close icon for the "close" button
  const closeIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1684_1475)">
        <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
      </g>
      <defs>
        <clipPath id="clip0_1684_1475">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );

  // Delete icon for the "delete" button
  const deleteIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_1684_1480)">
        <path d="M16 9V19H8V9H16ZM14.5 3H9.5L8.5 4H5V6H19V4H15.5L14.5 3ZM18 7H6V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7Z" fill="currentColor"/>
      </g>
      <defs>
        <clipPath id="clip0_1684_1480">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );

  // Determine the appropriate icon based on the variant
  const getIconForVariant = (variant: ButtonVariant) => {
    switch (variant) {
      case 'done':
        return checkIcon;
      case 'close':
        return closeIcon;
      case 'delete':
        return deleteIcon;
      default:
        return icon || defaultIcon;
    }
  };

  // Determine button class based on variant and type
  let buttonClass = '';
  
  if (type === 'icon') {
    // Icon button classes (preserve existing functionality)
    buttonClass = 'icon-button';
    
    switch (variant) {
      case 'primary':
        buttonClass += ' icon-button-primary';
        break;
      case 'secondary':
        buttonClass += ' icon-button-secondary';
        break;
      case 'tertiary':
        buttonClass += ' icon-button-tertiary';
        break;
      case 'disabled':
        buttonClass += ' icon-button-disabled';
        disabled = true;
        break;
      case 'done':
        buttonClass += ' icon-button-done';
        break;
      case 'close':
        buttonClass += ' icon-button-close';
        break;
      case 'delete':
        buttonClass += ' icon-button-delete';
        break;
      default:
        buttonClass += ' icon-button-primary';
    }
  } else {
    // Text button classes (new functionality)
    buttonClass = 'text-button';
    
    switch (variant) {
      case 'primary': // active0
        buttonClass += ' text-button-primary';
        break;
      case 'secondary': // active1
        buttonClass += ' text-button-secondary';
        break;
      case 'tertiary': // active2
        buttonClass += ' text-button-tertiary';
        break;
      case 'disabled': // dormant
        buttonClass += ' text-button-disabled';
        disabled = true;
        break;
      default:
        buttonClass += ' text-button-primary';
    }
  }

  return (
    <>
      <button 
        className={`${buttonClass} ${styles.container} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {type === 'icon' ? (getIconForVariant(variant)) : (
          <span className={`ButtonH1_Regular ${styles.buttonH1Regular}`}>{children}</span>
        )}
      </button>
      
      <style jsx>{`
        /* Icon Button Styles - Preserve existing styles */
        .icon-button {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px;
          gap: 10px;
          position: relative;
          width: 40px;
          min-width: 40px;
          height: 40px;
          min-height: 40px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }

        .icon-button :global(svg) {
          width: 24px;
          height: 24px;
          flex: none;
          order: 0;
          flex-grow: 0;
        }

        /* Primary Button (active_icon0) */
        .icon-button-primary {
          background: var(--orangeElectric);
        }

        .icon-button-primary :global(svg) {
          color: var(--baseWhite_90);
        }

        /* Secondary Button (active_icon1) */
        .icon-button-secondary {
          background: var(--baseWhite_90);
        }

        .icon-button-secondary :global(svg) {
          color: var(--orangeElectric);
        }

        /* Tertiary Button (active_icon2) */
        .icon-button-tertiary {
          background: var(--baseWhite_90);
        }

        .icon-button-tertiary :global(svg) {
          color: var(--darkGrey80);
        }

        /* Disabled Button (dormant_icon) */
        .icon-button-disabled {
          background: var(--beigeBackground);
          cursor: not-allowed;
        }

        .icon-button-disabled :global(svg) {
          color: var(--darkGrey30);
        }

        /* Done Button */
        .icon-button-done {
          background: #FB7232; /* OrangeElectric */
        }

        .icon-button-done :global(svg) {
          color: #FFFFFF; /* BaseWhite */
        }

        /* Close Button */
        .icon-button-close {
          background: #882C2C; /* MaroonRed */
        }

        .icon-button-close :global(svg) {
          color: #FFFFFF; /* BaseWhite */
        }

        /* Delete Button */
        .icon-button-delete {
          background: rgba(255, 255, 255, 0.9); /* BaseWhite_90 */
        }

        .icon-button-delete :global(svg) {
          color: rgba(94, 94, 94, 0.8); /* DarkGrey80 */
        }

        /* Hover and Focus States */
        .icon-button-primary:hover:not(:disabled),
        .icon-button-primary:focus:not(:disabled),
        .icon-button-done:hover:not(:disabled),
        .icon-button-done:focus:not(:disabled) {
          background: #e06628; /* Slightly darker orange */
        }

        .icon-button-close:hover:not(:disabled),
        .icon-button-close:focus:not(:disabled) {
          background: #772727; /* Slightly darker maroon */
        }

        .icon-button-secondary:hover:not(:disabled),
        .icon-button-tertiary:hover:not(:disabled),
        .icon-button-delete:hover:not(:disabled) {
          background: var(--baseWhite);
        }

        .icon-button-secondary:focus:not(:disabled),
        .icon-button-tertiary:focus:not(:disabled),
        .icon-button-delete:focus:not(:disabled) {
          outline: 1px solid var(--darkGrey20);
        }

        /* Text Button Styles - New styles based on your specifications */
        .text-button {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 16px;
          gap: 6px;
          position: relative;
          height: 40px;
          min-height: 40px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          text-align: center;
        }

        /* Primary Text Button (active0) */
        .text-button-primary {
          background: var(--orangeElectric);
        }

        .text-button-primary :global(span) {
          color: var(--baseWhite_90);
        }

        /* Secondary Text Button (active1) */
        .text-button-secondary {
          background: var(--baseWhite_90);
        }

        .text-button-secondary :global(span) {
          color: var(--orangeElectric);
        }

        /* Tertiary Text Button (active2) */
        .text-button-tertiary {
          background: var(--baseWhite_90);
        }

        .text-button-tertiary :global(span) {
          color: var(--darkGrey80);
        }

        /* Disabled Text Button (dormant) */
        .text-button-disabled {
          background: var(--beigeBackground);
          cursor: not-allowed;
        }

        .text-button-disabled :global(span) {
          color: var(--darkGrey30);
        }

        /* Hover and Focus States for Text Buttons */
        .text-button-primary:hover:not(:disabled),
        .text-button-primary:focus:not(:disabled) {
          background: #e06628; /* Slightly darker orange */
        }

        .text-button-secondary:hover:not(:disabled),
        .text-button-tertiary:hover:not(:disabled) {
          background: var(--baseWhite);
        }

        .text-button-secondary:focus:not(:disabled),
        .text-button-tertiary:focus:not(:disabled) {
          outline: 1px solid var(--darkGrey20);
        }
      `}</style>
    </>
  );
};

export default Button;
