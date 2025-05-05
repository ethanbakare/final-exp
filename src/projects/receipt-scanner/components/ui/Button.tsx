import React from 'react';
import styles from '../../styles/Components.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'disabled';

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
        {type === 'icon' ? (icon || defaultIcon) : (
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

        /* Hover and Focus States */
        .icon-button-primary:hover:not(:disabled),
        .icon-button-primary:focus:not(:disabled) {
          background: #e06628; /* Slightly darker orange */
        }

        .icon-button-secondary:hover:not(:disabled),
        .icon-button-tertiary:hover:not(:disabled) {
          background: var(--baseWhite);
        }

        .icon-button-secondary:focus:not(:disabled),
        .icon-button-tertiary:focus:not(:disabled) {
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
