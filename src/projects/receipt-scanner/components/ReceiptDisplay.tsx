import * as React from 'react';
import * as ListItemModule from './ui/ListItem';
import { useReceipt } from '../context/ReceiptContext';

// Use CommonJS modules
const ListItem = ListItemModule.default || ListItemModule;

// Define inline styles to avoid CSS module issues
const styles = {
  receiptDisplay: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%'
  },
  receiptListItem: {},
  validationMessage: {
    marginTop: '16px',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.05)',
    transition: 'all 0.2s ease'
  },
  validationTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 600
  },
  validationText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.4
  },
  success: {
    backgroundColor: 'rgba(0, 184, 126, 0.1)',
    border: '1px solid #00B87E',
    color: '#00B87E'
  },
  warning: {
    backgroundColor: 'rgba(255, 171, 0, 0.1)',
    border: '1px solid #FFAB00',
    color: '#FFAB00'
  },
  error: {
    backgroundColor: 'rgba(235, 87, 87, 0.1)',
    border: '1px solid #EB5757',
    color: '#EB5757'
  }
};

/**
 * ReceiptDisplay Component
 * 
 * Displays the processed receipt data by:
 * 1. Rendering the ListItem component for showing receipt details
 * 2. Displaying validation messages from the API
 */
const ReceiptDisplay: React.FC = () => {
  // Get receipt data from context
  const { receipt } = useReceipt();

  // If there's no receipt data, don't render anything
  if (!receipt) {
    return null;
  }

  // Get validation style based on status
  const getValidationStyle = (status: string) => {
    switch (status) {
      case 'success':
        return styles.success;
      case 'warning':
        return styles.warning;
      case 'error':
        return styles.error;
      default:
        return {};
    }
  };

  return (
    <div style={styles.receiptDisplay}>
      {/* ListItem component now automatically consumes data from ReceiptContext */}
      <ListItem />
      
      {/* Validation message display */}
      {receipt.validation_ui && (
        <div style={{...styles.validationMessage, ...getValidationStyle(receipt.validation_ui.status)}}>
          <h3 style={styles.validationTitle}>{receipt.validation_ui.header}</h3>
          <p style={styles.validationText}>{receipt.validation_ui.body}</p>
        </div>
      )}
    </div>
  );
};

export default ReceiptDisplay; 