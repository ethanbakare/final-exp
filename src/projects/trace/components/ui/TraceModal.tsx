import React from 'react';
import styles from '@/projects/trace/styles/trace.module.css';

// TraceModal Component
// Modal dialogs for Trace actions
// Adapted from ClipModal for Trace design system

/* ============================================
   MODAL BUTTON COMPONENTS
   Inline button components for modal actions
   ============================================ */

interface ModalButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'outline' | 'filled';
  fullWidth?: boolean;
  className?: string;
}

const TraceModalButton: React.FC<ModalButtonProps> = ({
  onClick,
  children,
  variant = 'outline',
  fullWidth = false,
  className = ''
}) => {
  return (
    <>
      <button
        className={`modal-button modal-button--${variant} ${fullWidth ? 'full-width' : ''} ${className}`}
        onClick={onClick}
        type="button"
      >
        {children}
      </button>

      <style jsx>{`
        .modal-button {
          /* Box model */
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          gap: 6px;

          /* Typography */
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-button); /* 16px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: 1.44;

          /* Size */
          height: 35px;
          min-width: 111px;
          border-radius: 23px;

          /* Interaction */
          cursor: pointer;
          user-select: none;
          transition: var(--trace-transition-fast);

          /* Reset */
          border: none;
          outline: none;
        }

        .modal-button.full-width {
          width: 100%;
          min-width: unset;
        }

        /* Outline variant - light border with reduced opacity, transparent background */
        .modal-button--outline {
          background: transparent;
          border: 1px solid rgba(245, 245, 244, 0.35); /* stone-50 @ 35% opacity */
          color: var(--trace-btn-light);
        }

        .modal-button--outline:hover {
          background: rgba(245, 245, 244, 0.1); /* subtle hover */
        }

        .modal-button--outline:active {
          background: rgba(245, 245, 244, 0.2);
        }

        /* Filled variant - white background with dark text */
        .modal-button--filled {
          background: var(--trace-btn-light); /* stone-50 white */
          border: 1px solid transparent;
          color: var(--trace-border-primary); /* stone-700 dark text */
        }

        .modal-button--filled:hover {
          background: rgba(245, 245, 244, 0.9); /* slightly dimmed */
        }

        .modal-button--filled:active {
          background: rgba(245, 245, 244, 0.8);
        }
      `}</style>
    </>
  );
};

/* ============================================
   TRACE CLEAR EXPENSES MODAL - Confirmation dialog for clearing all expenses
   ============================================ */

interface TraceClearExpensesModalProps {
  onCancel?: () => void;
  onDelete?: () => void;
  isVisible?: boolean;
  className?: string;
}

export const TraceClearExpensesModal: React.FC<TraceClearExpensesModalProps> = ({
  onCancel,
  onDelete,
  isVisible = true,
  className = ''
}) => {
  if (!isVisible) return null;

  return (
    <>
      <div className={`clear-card ${className} ${styles.container}`}>
        {/* Header Section */}
        <div className="clear-header">
          <div className={`clear-title ${styles.OpenRundeMedium18}`}>
            Clear Expenses
          </div>
          <div className={`clear-message ${styles.OpenRundeRegular14}`}>
            This permanently removes all your expenses
          </div>
        </div>

        {/* Buttons Section */}
        <div className="clear-buttons">
          <TraceModalButton
            onClick={onCancel}
            variant="outline"
            fullWidth
          >
            Cancel
          </TraceModalButton>

          <TraceModalButton
            onClick={onDelete}
            variant="filled"
            fullWidth
          >
            Delete
          </TraceModalButton>
        </div>
      </div>

      <style jsx>{`
        .clear-card {
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

          background: var(--trace-bg-dark); /* #1c1917 */
          border: 1px solid var(--trace-border-primary); /* #44403c */
          border-radius: 16px;

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }

        .clear-header {
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

        .clear-title {
          text-align: center;

          color: var(--trace-text-primary); /* white */

          /* Inside auto layout */
          flex: none;
          order: 0;
          flex-grow: 0;
        }

        .clear-message {
          max-width: 207px;

          text-align: center;

          color: var(--trace-text-secondary); /* #e7e5e4 */

          /* Inside auto layout */
          flex: none;
          order: 1;
          flex-grow: 0;
        }

        .clear-buttons {
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

          border-top: 1px solid rgba(255, 255, 255, 0.05); /* subtle separator */

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
   DEFAULT EXPORT
   ============================================ */

export default TraceClearExpensesModal;
