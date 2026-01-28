/**
 * Trace UI - Master Total Block Components
 * Grand total summary displayed above FinanceBox
 * Atomic pattern: TotalAmtSpent (atom), MasterTotalPrice (atom), MasterBlockHolder (molecule)
 */

import React from 'react';
import styles from '@/projects/trace/styles/trace.module.css';

/* ==================== TYPE DEFINITIONS ==================== */

export interface TotalAmtSpentProps {
  className?: string;
}

export interface MasterTotalPriceProps {
  total: string;
  className?: string;
}

export interface MasterBlockHolderProps {
  total: string;
  fullWidth?: boolean;
  className?: string;
}

/* ==================== ATOMS ==================== */

// TotalAmtSpent - Red indicator pill + "Total Amount Spent" label
export const TotalAmtSpent: React.FC<TotalAmtSpentProps> = ({
  className = '',
}) => {
  return (
    <div className={`total-amt-spent ${className} ${styles.container}`}>
      <div className="indicator" />
      <span className="label">Total Amount Spent</span>

      <style jsx>{`
        .total-amt-spent {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          gap: 5px;
          border-radius: 20px;
        }

        .indicator {
          width: 3px;
          height: 12px;
          background: var(--trace-accent-red); /* #EF4444 */
          border-radius: 16px;
          flex: none;
        }

        .label {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-small); /* 10px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: 24px;
          color: var(--trace-text-muted); /* #A8A29E */
          white-space: nowrap;
          flex: none;
        }
      `}</style>
    </div>
  );
};

// MasterTotalPrice - Currency symbol (£) + Amount value
export const MasterTotalPrice: React.FC<MasterTotalPriceProps> = ({
  total,
  className = '',
}) => {
  return (
    <div className={`master-total-price ${className} ${styles.container}`}>
      <span className="master-currency">£</span>
      <span className="master-amount">{total}</span>

      <style jsx>{`
        .master-total-price {
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          align-items: center;
        }

        .master-currency {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-master-currency); /* 18px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: 48px;
          text-align: right;
          color: var(--trace-text-primary); /* #FFFFFF */
          padding-top: 8px; /* Baseline-align with larger amount */
          flex: none;
        }

        .master-amount {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-master-amount); /* 28px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: 48px;
          text-align: right;
          color: var(--trace-text-primary); /* #FFFFFF */
          flex: none;
        }
      `}</style>
    </div>
  );
};

/* ==================== MOLECULE ==================== */

// MasterBlockHolder - Composes TotalAmtSpent + MasterTotalPrice
// fullWidth: when true, stretches to fill parent (use inside TextBox)
export const MasterBlockHolder: React.FC<MasterBlockHolderProps> = ({
  total,
  fullWidth = false,
  className = '',
}) => {
  return (
    <div className={`master-block-holder ${fullWidth ? 'full-width' : ''} ${className} ${styles.container}`}>
      <div className="master-block">
        <div className="master-total-frame">
          <TotalAmtSpent />
          <MasterTotalPrice total={total} />
        </div>
      </div>

      <style jsx>{`
        .master-block-holder {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px 12px 0px;
          gap: 10px;

          width: 301px;
          height: 78.95px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }

        /* When called inside TextBox, inherit parent width */
        .master-block-holder.full-width {
          width: 100%;
        }

        .master-block {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 26px 0px 20px;

          width: 100%;
          height: 66.95px;

          background: linear-gradient(180deg, rgba(189, 180, 169, 0.06) 0%, rgba(87, 83, 78, 0.03) 100%);
          border-bottom: 1px solid rgba(206, 206, 206, 0.1);
          border-radius: 8px 8px 0px 0px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }

        .master-total-frame {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-end;
          padding: 0px 10px;
          gap: 14px;

          width: 100%;
          height: 20.95px;

          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }
      `}</style>
    </div>
  );
};
