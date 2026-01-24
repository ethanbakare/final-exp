/**
 * Trace UI - Finance Display Components
 * Following atomic design pattern for receipt/transaction UI
 */

import React from 'react';
import styles from '@/projects/trace/styles/trace.module.css';

/* ==================== TYPE DEFINITIONS ==================== */

export interface DateProps {
  date: string;
  className?: string;
}

export interface TotalFrameProps {
  total: string;
  className?: string;
}

export interface MerchantFrameProps {
  merchantName?: string; // Optional - if undefined, displays "- - -"
  className?: string;
}

export interface MerchantTotalFrameProps {
  total: string;
  className?: string;
}

export interface NetPriceFrameProps {
  price: string;
  className?: string;
}

export interface QuantityProps {
  quantity: string;
  className?: string;
}

export interface ItemNameProps {
  itemName: string;
  className?: string;
}

export interface DiscountFrameProps {
  discount: string;
  className?: string;
}

/* ==================== ATOMS ==================== */

// Date - simple date text (12px)
export const Date: React.FC<DateProps> = ({
  date,
  className = '',
}) => {
  return (
    <div className={`date ${className} ${styles.container}`}>
      <span className="date-text">{date}</span>

      <style jsx>{`
        .date {
          display: flex;
          align-items: center;
          gap: 4px;
          border-radius: 4px;
        }

        .date-text {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-body); /* 12px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: var(--trace-lh-body); /* 2.0 */
          color: var(--trace-text-primary);
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
};

// TotalFrame - Currency + Total amount (9px + 12px)
// Modern CSS: Single container with baseline alignment, no nested divs
export const TotalFrame: React.FC<TotalFrameProps> = ({
  total,
  className = '',
}) => {
  return (
    <div className={`total-frame ${className} ${styles.container}`}>
      <span className="currency">£</span>
      <span className="amount">{total}</span>

      <style jsx>{`
        .total-frame {
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          height: 12.95px;
        }

        .currency {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-currency); /* 9px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: var(--trace-lh-currency); /* 2.67 */
          color: var(--trace-text-primary);
          text-align: right;
          /* Add transform only if baseline isn't perfect after testing */
          /* transform: translateY(1px); */
        }

        .amount {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-body); /* 12px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: var(--trace-lh-body); /* 2.0 */
          color: var(--trace-text-primary);
          text-align: right;
        }
      `}</style>
    </div>
  );
};

// MerchantFrame - Merchant name (e.g., "TESCOS") or "- - -" if undefined (12px)
export const MerchantFrame: React.FC<MerchantFrameProps> = ({
  merchantName,
  className = '',
}) => {
  return (
    <div className={`merchant-frame ${className} ${styles.container}`}>
      <span className="merchant-name">{merchantName ?? '- - -'}</span>

      <style jsx>{`
        .merchant-frame {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 12px;
        }

        .merchant-name {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-body); /* 12px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: var(--trace-lh-small); /* 2.4 */
          color: var(--trace-text-tertiary);
          text-align: right;
          vertical-align: middle;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};

// MerchantTotalFrame - Currency + Merchant total amount (used in RowIdentifier) (9px + 12px)
// Modern CSS: Single container with baseline alignment, no nested divs
export const MerchantTotalFrame: React.FC<MerchantTotalFrameProps> = ({
  total,
  className = '',
}) => {
  return (
    <div className={`merchant-total-frame ${className} ${styles.container}`}>
      <span className="currency">£</span>
      <span className="amount">{total}</span>

      <style jsx>{`
        .merchant-total-frame {
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          height: 12px;
        }

        .currency {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-currency); /* 9px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: var(--trace-lh-currency); /* 2.67 */
          color: var(--trace-text-tertiary);
          text-align: right;
          /* Add transform only if baseline isn't perfect after testing */
          /* transform: translateY(1px); */
        }

        .amount {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-body); /* 12px */
          font-weight: var(--trace-fw-medium); /* 500 */
          line-height: var(--trace-lh-small); /* 2.4 */
          color: var(--trace-text-tertiary);
          text-align: right;
        }
      `}</style>
    </div>
  );
};

// NetPriceFrame - Currency + Net price (10px + 16px)
// Modern CSS: Single container with baseline alignment, no nested divs
export const NetPriceFrame: React.FC<NetPriceFrameProps> = ({
  price,
  className = '',
}) => {
  return (
    <div className={`net-price-frame ${className} ${styles.container}`}>
      <span className="currency">£</span>
      <span className="amount">{price}</span>

      <style jsx>{`
        .net-price-frame {
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          height: 20px;
          /* DEBUG: Red border to visualize price container */
          border: .2px solid red;
        }

        .currency {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-small); /* 10px */
          font-weight: var(--trace-fw-normal); /* 400 */
          line-height: var(--trace-lh-currency); /* 2.67 */
          color: var(--trace-text-second);
          text-align: right;
          /* Add transform only if baseline isn't perfect after testing */
          /* transform: translateY(1px); */
        }

        .amount {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-button); /* 16px */
          font-weight: var(--trace-fw-normal); /* 400 */
          line-height: var(--trace-lh-medium); /* 1.71 */
          color: var(--trace-text-second);
          text-align: right;
        }
      `}</style>
    </div>
  );
};

// Quantity - e.g., "2x" (12px)
export const Quantity: React.FC<QuantityProps> = ({
  quantity,
  className = '',
}) => {
  return (
    <div className={`quantity ${className} ${styles.container}`}>
      <span className="quantity-text">{quantity}</span>

      <style jsx>{`
        .quantity {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          height: 100%;
          width: 12px;
          padding-top: 2px;
          gap: 10px;
        }

        .quantity-text {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-body); /* 12px */
          font-weight: var(--trace-fw-normal); /* 400 */
          line-height: var(--trace-lh-body); /* 2.0 */
          color: var(--trace-text-qty);
        }
      `}</style>
    </div>
  );
};

// ItemName - e.g., "Headphones" (16px)
export const ItemName: React.FC<ItemNameProps> = ({
  itemName,
  className = '',
}) => {
  return (
    <div className={`item-name ${className} ${styles.container}`}>
      <span className="item-text">{itemName}</span>

      <style jsx>{`
        .item-name {
          display: flex;
          justify-content: center;
          flex-direction: column;
          height: 24px; /* Increased from 20px to accommodate line-height (14px * 1.71 ≈ 24px) */
          flex: 1;  /* Grow to fill available space in parent QuantityItemName */
          min-width: 0;  /* Allow shrinking below content size for ellipsis */
        }

        .item-text {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-itemname); /* 14px */
          font-weight: var(--trace-fw-normal); /* 400 */
          line-height: var(--trace-lh-medium); /* 1.71 */
          color: var(--trace-text-secondary);
          /* DEBUG: Red border to visualize text bounding box */
          border: .2px solid red;
          /* Ellipsis overflow - width determined by parent flex layout */
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

// DiscountFrame - Item-level discount (orange, shown in PriceFrame) (9px + 12px)
// Modern CSS: Single container with baseline alignment, no nested divs
export const DiscountFrame: React.FC<DiscountFrameProps> = ({
  discount,
  className = '',
}) => {
  return (
    <div className={`discount-frame ${className} ${styles.container}`}>
      <span className="currency">-£</span>
      <span className="amount">{discount}</span>

      <style jsx>{`
        .discount-frame {
          display: flex;
          align-items: baseline;

          justify-content: flex-end;
          height: 12px;
        }

        .currency {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-currency); /* 9px */
          font-weight: var(--trace-fw-normal); /* 400 */
          line-height: var(--trace-lh-currency); /* 2.67 */
          color: var(--trace-discount-orange);
          /* Add transform only if baseline isn't perfect after testing */
          /* transform: translateY(1px); */
        }

        .amount {
          font-family: var(--trace-font-family);
          font-size: var(--trace-fs-body); /* 12px */
          font-weight: var(--trace-fw-normal); /* 400 */
          line-height: var(--trace-lh-small); /* 2.4 */
          color: var(--trace-discount-orange);
        }
      `}</style>
    </div>
  );
};

/* ==================== MOLECULES ==================== */

export interface DayTotalProps {
  date: string;
  total: string;
  width?: string; // Default: 277px, can be overridden to "100%" or other values
  className?: string;
}

export interface RowIdentifierProps {
  merchantName?: string; // Optional - if undefined, displays "- - -"
  merchantTotal: string;
  showRowIdentifier?: boolean; // Default: true, set to false to hide this component entirely
  width?: string; // Default: 100%, can be overridden
  className?: string;
}

export interface QuantityItemNameProps {
  quantity: string;
  itemName: string;
  className?: string;
}

export interface PriceFrameProps {
  netPrice: string;
  discount?: string; // Optional discount
  width?: number; // Optional width override (in px) - only allows values SMALLER than 85px
  className?: string;
}

export interface ContentRowProps {
  quantity: string;
  itemName: string;
  netPrice: string;
  discount?: string;
  isFirst?: boolean; // Differentiate first row padding from subsequent rows
  isLast?: boolean; // Hide bottom border on last row
  width?: string; // Default: 277px (matches TextBox inner width), pass "100%" when inside parent
  priceFrameWidth?: number; // Optional PriceFrame width override (in px) - only allows values SMALLER than 85px
  className?: string;
}

export interface MerchantBlockProps {
  merchantName?: string; // Optional - if undefined, shows "- - -" or hides based on showRowIdentifier
  merchantTotal: string;
  items: Array<{
    quantity: string;
    itemName: string;
    netPrice: string;
    discount?: string;
  }>;
  showRowIdentifier?: boolean; // Default: true, controls whether RowIdentifier is shown
  width?: string; // Default: 277px (matches TextBox inner width), pass "100%" when inside parent
  priceFrameWidth?: number; // Optional PriceFrame width override (in px) - only allows values SMALLER than 85px
  className?: string;
}

export interface DayExpensesProps {
  merchants: Array<{
    merchantName?: string; // Optional merchant name
    merchantTotal: string;
    items: Array<{
      quantity: string;
      itemName: string;
      netPrice: string;
      discount?: string;
    }>;
  }>;
  width?: string; // Default: 277px (matches TextBox inner width), pass "100%" when inside parent
  priceFrameWidth?: number; // Optional PriceFrame width override (in px) - only allows values SMALLER than 85px
  className?: string;
}

export interface DayBlockProps {
  date: string;
  total: string;
  merchants: Array<{
    merchantName?: string; // Optional merchant name
    merchantTotal: string;
    items: Array<{
      quantity: string;
      itemName: string;
      netPrice: string;
      discount?: string;
    }>;
  }>;
  width?: string; // Default: 277px (matches TextBox inner width), pass "100%" when inside parent
  className?: string;
}

export interface FinanceBoxProps {
  days: Array<{
    date: string;
    total: string;
    merchants: Array<{
      merchantName?: string; // Optional merchant name
      merchantTotal: string;
      items: Array<{
        quantity: string;
        itemName: string;
        netPrice: string;
        discount?: string;
      }>;
    }>;
  }>;
  className?: string;
}

export interface TextBoxProps {
  days: Array<{
    date: string;
    total: string;
    merchants: Array<{
      merchantName?: string; // Optional merchant name
      merchantTotal: string;
      items: Array<{
        quantity: string;
        itemName: string;
        netPrice: string;
        discount?: string;
      }>;
    }>;
  }>;
  className?: string;
}

// DayTotal - Date + TotalFrame
export const DayTotal: React.FC<DayTotalProps> = ({
  date,
  total,
  width = '277px',
  className = '',
}) => {
  return (
    <div className={`day-total ${className} ${styles.container}`}>
      <Date date={date} />
      <TotalFrame total={total} />

      <style jsx>{`
        .day-total {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 4px;
          padding: var(--trace-daytotal-padding);
          border-radius: 8px;
          width: ${width};
        }
      `}</style>
    </div>
  );
};

// RowIdentifier - MerchantFrame + MerchantTotalFrame
export const RowIdentifier: React.FC<RowIdentifierProps> = ({
  merchantName,
  merchantTotal,
  showRowIdentifier = true,
  width = '100%',
  className = '',
}) => {
  // Hide this component entirely if showRowIdentifier is false
  if (!showRowIdentifier) {
    return null;
  }

  return (
    <div className={`row-identifier ${className} ${styles.container}`}>
      <MerchantFrame merchantName={merchantName} />
      <MerchantTotalFrame total={merchantTotal} />

      <style jsx>{`
        .row-identifier {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 4px;
          padding: 6px 0;
          border-radius: 8px 8px 0 0;
          width: ${width};
        }
      `}</style>
    </div>
  );
};

// QuantityItemName - Quantity + ItemName
export const QuantityItemName: React.FC<QuantityItemNameProps> = ({
  quantity,
  itemName,
  className = '',
}) => {
  return (
    <div className={`quantity-item-name ${className} ${styles.container}`}>
      <Quantity quantity={quantity} />
      <ItemName itemName={itemName} />

      <style jsx>{`
        .quantity-item-name {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 10px;
          flex: 1;  /* Grow to fill available space */
          min-width: 0;  /* Allow flex items to shrink below content size */
          /* DEBUG: Green border to visualize QuantityItemName container */
          border: .2px solid green;
        }
      `}</style>
    </div>
  );
};

// PriceFrame - NetPriceFrame + optional DiscountFrame
export const PriceFrame: React.FC<PriceFrameProps> = ({
  netPrice,
  discount,
  width,
  className = '',
}) => {
  return (
    <div className={`price-frame ${className} ${styles.container}`}>
      <NetPriceFrame price={netPrice} />
      {discount && (
        <div className="discount-wrapper">
          <DiscountFrame discount={discount} />
        </div>
      )}

      <style jsx>{`
        .price-frame {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          flex-direction: column;
          width: ${width ? `${width}px` : 'var(--trace-priceframe-width)'};  /* Dynamic width based on data, fallback to 85px */
          flex-shrink: 0;  /* Prevent shrinking when space is limited */
          /* DEBUG: Blue border to visualize PriceFrame container (outer) */
          border: .2px solid blue;
        }

        .discount-wrapper {
          margin-top: var(--trace-priceframe-discount-offset);
        }
      `}</style>
    </div>
  );
};

// ContentRow - QuantityItemName + PriceFrame
export const ContentRow: React.FC<ContentRowProps> = ({
  quantity,
  itemName,
  netPrice,
  discount,
  isFirst = false,
  isLast = false,
  width = '277px',
  priceFrameWidth,
  className = '',
}) => {
  // Determine padding based on position and discount presence
  const getPadding = () => {
    if (isFirst && discount) return 'var(--trace-contentrow-padding-first-with-discount)';
    if (isFirst && !discount) return 'var(--trace-contentrow-padding-first)';
    if (!isFirst && discount) return 'var(--trace-contentrow-padding-subsequent-with-discount)';
    return 'var(--trace-contentrow-padding-subsequent)';
  };

  return (
    <div className={`content-row ${className} ${styles.container}`}>
      <QuantityItemName quantity={quantity} itemName={itemName} />
      <PriceFrame netPrice={netPrice} discount={discount} width={priceFrameWidth} />

      <style jsx>{`
        .content-row {
          display: flex;
          align-items: baseline;
          gap: var(--trace-contentrow-gap);
          padding: ${getPadding()};
          width: ${width};
          /* OPTIONAL: Bottom border between rows - comment out to disable */
          border-bottom: ${isLast ? 'none' : 'var(--trace-contentrow-border-width) solid var(--trace-contentrow-border-color)'};
        }
      `}</style>
    </div>
  );
};

// MerchantBlock - RowIdentifier + ContentRows
export const MerchantBlock: React.FC<MerchantBlockProps> = ({
  merchantName,
  merchantTotal,
  items,
  showRowIdentifier = true,
  width = '277px',
  priceFrameWidth,
  className = '',
}) => {
  // When RowIdentifier is hidden, add 6px top padding to preserve spacing
  const paddingTop = showRowIdentifier ? '0px' : '6px';

  return (
    <div className={`merchant-block ${className} ${styles.container}`}>
      <RowIdentifier
        merchantName={merchantName}
        merchantTotal={merchantTotal}
        showRowIdentifier={showRowIdentifier}
      />
      {items.map((item, index) => (
        <ContentRow
          key={index}
          quantity={item.quantity}
          itemName={item.itemName}
          netPrice={item.netPrice}
          discount={item.discount}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          width="100%"
          priceFrameWidth={priceFrameWidth}
        />
      ))}

      <style jsx>{`
        .merchant-block {
          display: flex;
          justify-content: center;
          flex-direction: column;
          border-radius: 8px;
          background: var(--trace-bg-merchant);
          padding: var(--trace-merchantblock-padding);
          padding-top: ${paddingTop};
          width: ${width};
        }
      `}</style>
    </div>
  );
};

// DayExpenses - Wrapper for MerchantBlocks with larger gap between them
export const DayExpenses: React.FC<DayExpensesProps> = ({
  merchants,
  width = '277px',
  priceFrameWidth,
  className = '',
}) => {
  return (
    <div className={`day-expenses ${className} ${styles.container}`}>
      {merchants.map((merchant, index) => {
        // Determine if RowIdentifier should be shown:
        // - Hide if there's only 1 merchant AND merchantName is undefined
        // - Show in all other cases (multiple merchants, or single merchant with name)
        const showRowIdentifier = !(merchants.length === 1 && !merchant.merchantName);

        return (
          <MerchantBlock
            key={index}
            merchantName={merchant.merchantName}
            merchantTotal={merchant.merchantTotal}
            items={merchant.items}
            showRowIdentifier={showRowIdentifier}
            width="100%"
            priceFrameWidth={priceFrameWidth}
          />
        );
      })}

      <style jsx>{`
        .day-expenses {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: ${width};
        }
      `}</style>
    </div>
  );
};

// DayBlock - DayTotal + DayExpenses
export const DayBlock: React.FC<DayBlockProps> = ({
  date,
  total,
  merchants,
  width = '277px',
  className = '',
}) => {
  // Calculate optimal PriceFrame width based on longest price in this day
  const calculateOptimalPriceWidth = (): number | undefined => {
    const DEFAULT_WIDTH = 85;
    const allPrices: string[] = [];

    // Collect all netPrice values from all merchants and items
    merchants.forEach(merchant => {
      merchant.items.forEach(item => {
        allPrices.push(item.netPrice);
      });
    });

    if (allPrices.length === 0) return undefined; // Use CSS variable default

    // Find the longest price string
    const maxPriceLength = Math.max(...allPrices.map(p => p.length));

    // Calculate width based on character count
    // Examples: "2.50" (4) → 50px, "14.99" (5) → 55px, "104.99" (6) → 65px, "499.99" (6) → 65px
    let calculatedWidth: number;
    if (maxPriceLength <= 4) {
      calculatedWidth = 50; // "2.50" → 50px
    } else if (maxPriceLength <= 5) {
      calculatedWidth = 55; // "14.99" → 55px
    } else if (maxPriceLength <= 6) {
      calculatedWidth = 65; // "104.99", "499.99" → 65px
    } else if (maxPriceLength <= 7) {
      calculatedWidth = 75; // "9999.99" → 75px
    } else {
      calculatedWidth = 85; // "99999.99" or longer → 85px (max)
    }

    // CRITICAL CONSTRAINT: Only return width if it's SMALLER than default
    // Never allow width to be larger than 85px
    return calculatedWidth < DEFAULT_WIDTH ? calculatedWidth : undefined;
  };

  const priceFrameWidth = calculateOptimalPriceWidth();

  return (
    <div className={`day-block ${className} ${styles.container}`}>
      <DayTotal date={date} total={total} width="100%" />
      <DayExpenses merchants={merchants} width="100%" priceFrameWidth={priceFrameWidth} />

      <style jsx>{`
        .day-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: ${width};
        }
      `}</style>
    </div>
  );
};

// FinanceBox - Padding container for DayBlocks (no background)
export const FinanceBox: React.FC<FinanceBoxProps> = ({
  days,
  className = '',
}) => {
  return (
    <div className={`finance-box ${className} ${styles.container}`}>
      {days.map((day, index) => (
        <DayBlock
          key={index}
          date={day.date}
          total={day.total}
          merchants={day.merchants}
          width="100%"
        />
      ))}

      <style jsx>{`
        .finance-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 24px;
          padding: var(--trace-financebox-padding-vertical) calc(var(--trace-financebox-padding-horizontal) + 2px) var(--trace-financebox-padding-vertical) var(--trace-financebox-padding-horizontal); /* 32px 14px 32px 12px - extra 2px right for scrollbar breathing room */
          border-radius: var(--trace-financebox-radius); /* 6px */
          width: 100%;
          height: 100%;

          /* Scrollable container */
          overflow-y: auto;
          overflow-x: hidden;

          /* Smooth scroll on iOS */
          -webkit-overflow-scrolling: touch;
        }

        /* Custom scrollbar styling - Modern iOS-style pill scrollbar */
        .finance-box::-webkit-scrollbar {
          width: 4px;
        }

        .finance-box::-webkit-scrollbar-track {
          background: transparent;
        }

        .finance-box::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);  /* White @ 20% opacity */
          border-radius: 9999px;  /* Pill shape - fully rounded ends */
        }

        .finance-box::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);  /* White @ 40% opacity on hover */
        }

        /* Firefox scrollbar support */
        .finance-box {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
      `}</style>
    </div>
  );
};

// TextBox - Dark container with border and shadow
export const TextBox: React.FC<TextBoxProps> = ({
  days,
  className = '',
}) => {
  return (
    <div className={`text-box ${className} ${styles.container}`}>
      <FinanceBox days={days} />

      <style jsx>{`
        .text-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: var(--trace-textbox-width); /* 301px */
          height: var(--trace-textbox-height); /* 421px */
          background: var(--trace-bg-dark); /* #1c1917 */
          border: var(--trace-textbox-border) solid var(--trace-border-primary); /* 1px solid #44403c */
          border-radius: var(--trace-textbox-radius); /* 16px */
          box-shadow: var(--trace-shadow-textbox); /* 0px 4px 10.5px rgba(0, 0, 0, 0.06) */
        }
      `}</style>
    </div>
  );
};
