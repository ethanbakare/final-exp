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
  merchantName: string;
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

// Date - simple date text
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
          font-size: 12px;
          font-weight: 500;
          line-height: 2;
          color: var(--trace-text-primary);
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
};

// TotalFrame - Currency + Total amount
export const TotalFrame: React.FC<TotalFrameProps> = ({
  total,
  className = '',
}) => {
  return (
    <div className={`total-frame ${className} ${styles.container}`}>
      <div className="total-currency">
        <span className="currency-symbol">£</span>
      </div>
      <span className="total-amount">{total}</span>

      <style jsx>{`
        .total-frame {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 12.95px;
        }

        .total-currency {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding-top: 2px;
          gap: 10px;
        }

        .currency-symbol {
          font-family: var(--trace-font-family);
          font-size: 9px;
          font-weight: 400;
          line-height: 2.67;
          color: var(--trace-text-primary);
          text-align: right;
          vertical-align: middle;
        }

        .total-amount {
          font-family: var(--trace-font-family);
          font-size: 12px;
          font-weight: 400;
          line-height: 2;
          color: var(--trace-text-primary);
          text-align: right;
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
};

// MerchantFrame - Merchant name (e.g., "TESCOS")
export const MerchantFrame: React.FC<MerchantFrameProps> = ({
  merchantName,
  className = '',
}) => {
  return (
    <div className={`merchant-frame ${className} ${styles.container}`}>
      <span className="merchant-name">{merchantName}</span>

      <style jsx>{`
        .merchant-frame {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 12px;
        }

        .merchant-name {
          font-family: var(--trace-font-family);
          font-size: 10px;
          font-weight: 500;
          line-height: 2.4;
          color: #78716c;
          text-align: right;
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
};

// MerchantTotalFrame - Currency + Merchant total amount (used in RowIdentifier)
export const MerchantTotalFrame: React.FC<MerchantTotalFrameProps> = ({
  total,
  className = '',
}) => {
  return (
    <div className={`merchant-total-frame ${className} ${styles.container}`}>
      <div className="total-currency">
        <span className="currency-symbol">£</span>
      </div>
      <span className="total-amount">{total}</span>

      <style jsx>{`
        .merchant-total-frame {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 12px;
        }

        .total-currency {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          width: 9px;
          height: 12px;
          padding-top: 2px;
          gap: 10px;
        }

        .currency-symbol {
          font-family: var(--trace-font-family);
          font-size: 9px;
          font-weight: 500;
          line-height: 2.67;
          color: #78716c;
          text-align: right;
          vertical-align: middle;
        }

        .total-amount {
          font-family: var(--trace-font-family);
          font-size: 10px;
          font-weight: 500;
          line-height: 2.4;
          color: #78716c;
          text-align: right;
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
};

// NetPriceFrame - Currency + Net price
export const NetPriceFrame: React.FC<NetPriceFrameProps> = ({
  price,
  className = '',
}) => {
  return (
    <div className={`net-price-frame ${className} ${styles.container}`}>
      <div className="price-currency">
        <span className="currency-symbol">£</span>
      </div>
      <span className="price-amount">{price}</span>

      <style jsx>{`
        .net-price-frame {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 20px;
        }

        .price-currency {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          width: 6px;
          padding-top: 4px;
          gap: 10px;
        }

        .currency-symbol {
          font-family: var(--trace-font-family);
          font-size: 9px;
          font-weight: 400;
          line-height: 2.67;
          color: var(--trace-text-primary);
          text-align: right;
          vertical-align: middle;
        }

        .price-amount {
          font-family: var(--trace-font-family);
          font-size: 14px;
          font-weight: 500;
          line-height: 1.71;
          color: #e7e5e4;
          text-align: right;
        }
      `}</style>
    </div>
  );
};

// Quantity - e.g., "2x"
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
          font-size: 12px;
          font-weight: 400;
          line-height: 2;
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

// ItemName - e.g., "Headphones"
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
          height: 20px;
        }

        .item-text {
          font-family: var(--trace-font-family);
          font-size: 14px;
          font-weight: 500;
          line-height: 1.71;
          color: #e7e5e4;
        }
      `}</style>
    </div>
  );
};

// DiscountFrame - Item-level discount (orange, shown in PriceFrame)
export const DiscountFrame: React.FC<DiscountFrameProps> = ({
  discount,
  className = '',
}) => {
  return (
    <div className={`discount-frame ${className} ${styles.container}`}>
      <div className="discount-currency">
        <span className="currency-symbol">£</span>
      </div>
      <span className="discount-amount">{discount}</span>

      <style jsx>{`
        .discount-frame {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          height: 12px;
        }

        .discount-currency {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          width: 10px;
          padding-top: 2px;
          gap: 10px;
        }

        .currency-symbol {
          font-family: var(--trace-font-family);
          font-size: 9px;
          font-weight: 400;
          line-height: 2.67;
          color: rgba(251, 146, 60, 0.5);
          text-align: right;
          vertical-align: middle;
        }

        .discount-amount {
          font-family: var(--trace-font-family);
          font-size: 10px;
          font-weight: 400;
          line-height: 2.4;
          color: rgba(251, 146, 60, 0.5);
          text-align: right;
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
  merchantName: string;
  merchantTotal: string;
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
  className?: string;
}

export interface ContentRowProps {
  quantity: string;
  itemName: string;
  netPrice: string;
  discount?: string;
  className?: string;
}

export interface MerchantBlockProps {
  merchantName: string;
  merchantTotal: string;
  items: Array<{
    quantity: string;
    itemName: string;
    netPrice: string;
    discount?: string;
  }>;
  className?: string;
}

export interface DayBlockProps {
  date: string;
  total: string;
  merchants: Array<{
    merchantName: string;
    merchantTotal: string;
    items: Array<{
      quantity: string;
      itemName: string;
      netPrice: string;
      discount?: string;
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
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          padding: 0 10px;
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
  width = '100%',
  className = '',
}) => {
  return (
    <div className={`row-identifier ${className} ${styles.container}`}>
      <MerchantFrame merchantName={merchantName} />
      <MerchantTotalFrame total={merchantTotal} />

      <style jsx>{`
        .row-identifier {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
          padding: 6px 10px;
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
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 20px;
        }
      `}</style>
    </div>
  );
};

// PriceFrame - NetPriceFrame + optional DiscountFrame
export const PriceFrame: React.FC<PriceFrameProps> = ({
  netPrice,
  discount,
  className = '',
}) => {
  return (
    <div className={`price-frame ${className} ${styles.container}`}>
      <NetPriceFrame price={netPrice} />
      {discount && <DiscountFrame discount={discount} />}

      <style jsx>{`
        .price-frame {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          flex-direction: column;
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
  className = '',
}) => {
  return (
    <div className={`content-row ${className} ${styles.container}`}>
      <QuantityItemName quantity={quantity} itemName={itemName} />
      <PriceFrame netPrice={netPrice} discount={discount} />

      <style jsx>{`
        .content-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 100px;
          padding: 4px 10px 8px 10px;
          width: 100%;
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
  className = '',
}) => {
  return (
    <div className={`merchant-block ${className} ${styles.container}`}>
      <RowIdentifier merchantName={merchantName} merchantTotal={merchantTotal} />
      {items.map((item, index) => (
        <ContentRow
          key={index}
          quantity={item.quantity}
          itemName={item.itemName}
          netPrice={item.netPrice}
          discount={item.discount}
        />
      ))}

      <style jsx>{`
        .merchant-block {
          display: flex;
          justify-content: center;
          flex-direction: column;
          border-radius: 8px;
          background: rgba(41, 37, 36, 0.4);
          padding: 0 0 4px 0;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

// DayBlock - DayTotal + MerchantBlocks
export const DayBlock: React.FC<DayBlockProps> = ({
  date,
  total,
  merchants,
  className = '',
}) => {
  return (
    <div className={`day-block ${className} ${styles.container}`}>
      <DayTotal date={date} total={total} width="100%" />
      {merchants.map((merchant, index) => (
        <MerchantBlock
          key={index}
          merchantName={merchant.merchantName}
          merchantTotal={merchant.merchantTotal}
          items={merchant.items}
        />
      ))}

      <style jsx>{`
        .day-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }
      `}</style>
    </div>
  );
};
