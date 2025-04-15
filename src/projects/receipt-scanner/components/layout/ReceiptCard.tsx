import React, { useState } from 'react';

interface ReceiptItem {
  id: string;
  quantity: string;
  name: string;
  price: string;
  discount: string;
}

interface ReceiptCardProps {
  className?: string;
  onValueChange?: (field: string, value: string) => void;
  initialItems?: ReceiptItem[];
}

const ReceiptCard: React.FC<ReceiptCardProps> = ({
  className = '',
  onValueChange,
  initialItems = [
    { id: '1', quantity: '10', name: 'Coffee Beans (Premium)', price: '14.99', discount: '3.00' },
    { id: '2', quantity: '-', name: 'Wireless Headphones', price: '14.99', discount: '3.00' },
    { id: '3', quantity: '5', name: 'Notebook Set', price: '12.00', discount: '3.00' }
  ]
}) => {
  const [items, setItems] = useState(initialItems);
  const [storeName, setStoreName] = useState("Today's Receipt");
  const [date, setDate] = useState("Mar 2, 2025");
  const [currency, setCurrency] = useState("USD[$]");
  const [subtotal, setSubtotal] = useState("12.00");
  const [savings, setSavings] = useState("10.00");
  const [tax, setTax] = useState("2.00");
  const [total, setTotal] = useState("240.36");

  const handleInputChange = (field: string, value: string) => {
    if (onValueChange) {
      onValueChange(field, value);
    }
  };

  const handleItemChange = (id: string, field: 'quantity' | 'name' | 'price' | 'discount', value: string) => {
    const updatedItems = items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
    
    if (onValueChange) {
      onValueChange(`item-${id}-${field}`, value);
    }
  };

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div className="store-with-date">
          <div className="store-name">
            <input
              type="text"
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                handleInputChange('storeName', e.target.value);
              }}
              className="store-name-input"
            />
          </div>
          <div className="date-select">
            <input
              type="text"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                handleInputChange('date', e.target.value);
              }}
              className="date-input"
            />
            <div className="arrow-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="rgba(94, 94, 94, 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
        <div className="currency-select">
          <input
            type="text"
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              handleInputChange('currency', e.target.value);
            }}
            className="currency-input"
          />
          <div className="arrow-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="rgba(94, 94, 94, 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="card-content">
        <div className="card-list">
          {items.map((item) => (
            <div className="content-row" key={item.id}>
              <div className="qty-item">
                <div className="qty-frame">
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                    className="qty-input"
                  />
                  {item.quantity !== '-' && <span className="qty-x">x</span>}
                </div>
                <div className="item-frame">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                    className="item-input"
                  />
                </div>
              </div>
              <div className="values">
                <div className="price-frame">
                  <span className="currency-symbol">$</span>
                  <input
                    type="text"
                    value={item.price}
                    onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                    className="price-input"
                  />
                </div>
                <div className="discount-frame">
                  <span className="minus">-</span>
                  <span className="currency-symbol">$</span>
                  <input
                    type="text"
                    value={item.discount}
                    onChange={(e) => handleItemChange(item.id, 'discount', e.target.value)}
                    className="discount-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="content-final-row">
          <div className="summary-labels">
            <div className="sub-item-frame">
              <span className="summary-label">Subtotal</span>
            </div>
            <div className="savings-item-frame">
              <span className="summary-label savings-label">Savings</span>
            </div>
            <div className="tax-item-frame">
              <span className="summary-label tax-label">Tax (Sales)</span>
            </div>
          </div>
          <div className="summary-values">
            <div className="subtotal-price-frame">
              <span className="currency-symbol">$</span>
              <input
                type="text"
                value={subtotal}
                onChange={(e) => {
                  setSubtotal(e.target.value);
                  handleInputChange('subtotal', e.target.value);
                }}
                className="subtotal-input"
              />
            </div>
            <div className="saving-price-frame">
              <span className="minus">-</span>
              <span className="currency-symbol">$</span>
              <input
                type="text"
                value={savings}
                onChange={(e) => {
                  setSavings(e.target.value);
                  handleInputChange('savings', e.target.value);
                }}
                className="savings-input"
              />
            </div>
            <div className="tax-price-frame">
              <span className="currency-symbol">$</span>
              <input
                type="text"
                value={tax}
                onChange={(e) => {
                  setTax(e.target.value);
                  handleInputChange('tax', e.target.value);
                }}
                className="tax-input"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card-total">
        <div className="total-frame">
          <span className="total-label">Total</span>
        </div>
        <div className="ms-frame">
          <div className="error-frame">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z" fill="#FD1F1F"/>
            </svg>
          </div>
          <div className="total-price-frame">
            <span className="currency-symbol">$</span>
            <input
              type="text"
              value={total}
              onChange={(e) => {
                setTotal(e.target.value);
                handleInputChange('total', e.target.value);
              }}
              className="total-input"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px 20px 24px;
          gap: 20px;
          width: 100%;
          max-width: 600px;
          min-height: 350px;
          background: #FFFFFF;
          border-radius: 10px;
          box-sizing: border-box;
        }
        
        .card-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 2px 0px;
          width: 100%;
          height: 36px;
        }
        
        .store-with-date {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 17px;
          height: 32px;
        }
        
        .store-name {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          height: 32px;
        }
        
        .store-name-input {
          width: 123px;
          height: 32px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 600;
          font-size: 16px;
          line-height: 32px;
          display: flex;
          align-items: center;
          color: #525252;
          border: none;
          background: transparent;
          padding: 0;
          outline: none;
        }
        
        .date-select {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          height: 32px;
          border-radius: 4px;
        }
        
        .date-input {
          width: 93px;
          height: 32px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 600;
          font-size: 16px;
          line-height: 32px;
          display: flex;
          align-items: center;
          text-align: center;
          color: #525252;
          border: none;
          background: transparent;
          padding: 0;
          outline: none;
        }
        
        .currency-select {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          height: 32px;
          border-radius: 4px;
        }
        
        .currency-input {
          width: 57px;
          height: 32px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 600;
          font-size: 16px;
          line-height: 32px;
          display: flex;
          align-items: center;
          text-align: center;
          color: rgba(82, 82, 82, 0.4);
          border: none;
          background: transparent;
          padding: 0;
          outline: none;
        }
        
        .arrow-icon {
          width: 24px;
          height: 24px;
        }
        
        .card-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 10px;
          width: 100%;
        }
        
        .card-list {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          width: 100%;
          min-height: 200px;
          max-height: 292px;
          overflow-y: auto;
        }
        
        .content-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0px 4px;
          gap: 20px;
          width: 100%;
          min-height: 68px;
        }
        
        .qty-item {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 8px 0px 0px;
          gap: 2px;
          flex: 1;
        }
        
        .qty-frame {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 2px;
          width: 25px;
          height: 13px;
          background: rgba(15, 23, 42, 0.1);
          border-radius: 2.18182px;
          margin-right: 4px;
        }
        
        .qty-input {
          width: 13px;
          height: 26px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 500;
          font-size: 11px;
          line-height: 25px;
          display: flex;
          align-items: center;
          color: rgba(15, 23, 42, 0.4);
          border: none;
          background: transparent;
          padding: 0;
          outline: none;
        }
        
        .qty-x {
          width: 7px;
          height: 26px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 500;
          font-size: 11px;
          line-height: 25px;
          display: flex;
          align-items: center;
          color: rgba(15, 23, 42, 0.4);
        }
        
        .item-frame {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          gap: 10px;
          height: 24px;
          border-radius: 3px;
        }
        
        .item-input {
          width: 100%;
          height: 24px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 500;
          font-size: 13.6px;
          line-height: 24px;
          display: flex;
          align-items: center;
          color: #0F172A;
          border: none;
          background: transparent;
          padding: 0;
          outline: none;
        }
        
        .values {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 8px 0px 12px;
          flex: 1;
        }
        
        .price-frame {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          height: 24px;
          border-radius: 3px;
        }
        
        .currency-symbol {
          font-family: 'Inter';
          font-style: normal;
          font-weight: 500;
          font-size: 13.6px;
          line-height: 24px;
          display: flex;
          align-items: center;
          text-align: right;
          color: #0F172A;
          margin-right: 2px;
        }
        
        .price-input {
          width: 36px;
          height: 24px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 500;
          font-size: 13.6px;
          line-height: 24px;
          display: flex;
          align-items: center;
          text-align: right;
          color: #0F172A;
          border: none;
          background: transparent;
          padding: 0;
          outline: none;
        }
        
        .discount-frame {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          height: 24px;
          border-radius: 3px;
          margin-top: 4px;
        }
        
        .minus {
          width: 6px;
          height: 20px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 400;
          font-size: 11.9px;
          line-height: 20px;
          display: flex;
          align-items: center;
          text-align: right;
          color: rgba(15, 23, 40, 0.5);
          margin-right: 2px;
        }
        
        .discount-input {
          width: 26px;
          height: 20px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 400;
          font-size: 11.9px;
          line-height: 20px;
          display: flex;
          align-items: center;
          text-align: right;
          color: rgba(15, 23, 40, 0.5);
          border: none;
          background: transparent;
          padding: 0;
          outline: none;
        }
        
        .content-final-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0px 4px;
          gap: 20px;
          width: 100%;
          height: 88px;
          background: #FFFFFF;
        }
        
        .summary-labels {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 12px 0px 4px;
          flex: 1;
        }
        
        .sub-item-frame {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          height: 24px;
          border-radius: 3px;
        }
        
        .summary-label {
          height: 24px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 500;
          font-size: 13.6px;
          line-height: 24px;
          display: flex;
          align-items: center;
          color: #0F172A;
        }
        
        .savings-label, .tax-label {
          color: rgba(15, 23, 40, 0.2);
        }
        
        .savings-item-frame, .tax-item-frame {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          height: 24px;
          border-radius: 3px;
          margin-top: 4px;
        }
        
        .summary-values {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 12px 0px 4px;
          flex: 1;
        }
        
        .subtotal-price-frame, .saving-price-frame, .tax-price-frame {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          height: 24px;
          border-radius: 3px;
          margin-bottom: 4px;
        }
        
        .subtotal-input, .savings-input, .tax-input {
          width: 36px;
          height: 24px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 500;
          font-size: 13.6px;
          line-height: 24px;
          display: flex;
          align-items: center;
          text-align: right;
          border: none;
          background: transparent;
          padding: 0;
          outline: none;
        }
        
        .subtotal-input {
          color: #0F172A;
        }
        
        .savings-input, .tax-input {
          color: rgba(15, 23, 40, 0.2);
        }
        
        .card-total {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 2px 4px;
          width: 100%;
          height: 36px;
        }
        
        .total-frame {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 10px;
          height: 32px;
        }
        
        .total-label {
          width: 39px;
          height: 32px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 600;
          font-size: 16px;
          line-height: 32px;
          display: flex;
          align-items: center;
          color: #525252;
        }
        
        .ms-frame {
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          align-items: center;
          padding: 0px;
          gap: 5px;
          height: 32px;
        }
        
        .error-frame {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px;
          width: 24px;
          height: 24px;
          border-radius: 4px;
        }
        
        .total-price-frame {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          height: 32px;
          border-radius: 4px;
        }
        
        .total-input {
          width: 56px;
          height: 32px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 600;
          font-size: 16px;
          line-height: 32px;
          display: flex;
          align-items: center;
          text-align: right;
          color: #525252;
          border: none;
          background: transparent;
          padding: 0;
          outline: none;
        }
        
        /* Focus styles for editable elements */
        input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.35);
          border-radius: 3px;
        }
        
        /* Editable field hover style */
        .store-name-input:hover, .date-input:hover, .currency-input:hover,
        .qty-input:hover, .item-input:hover, .price-input:hover, .discount-input:hover,
        .subtotal-input:hover, .savings-input:hover, .tax-input:hover, .total-input:hover {
          background-color: rgba(148, 163, 184, 0.05);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default ReceiptCard; 