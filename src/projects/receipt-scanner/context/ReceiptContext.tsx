import * as React from 'react';
import { Receipt } from '../types/receipt';

// Extract React methods from imported React namespace
const { createContext, useContext, useState } = React;

// Define the context shape
interface ReceiptContextType {
  receipt: Receipt | null;
  setReceipt: (receipt: Receipt | null) => void;
}

// Create context with default values
const ReceiptContext = createContext<ReceiptContextType>({
  receipt: null,
  setReceipt: () => {}
});

// Custom hook to use the receipt context
export const useReceipt = () => useContext(ReceiptContext);

// Props for the context provider
interface ReceiptProviderProps {
  children: React.ReactNode;
}

/**
 * Receipt Context Provider
 * 
 * This component provides a context for sharing receipt data between components.
 * It manages the global receipt state and provides a function to update it.
 */
export const ReceiptProvider: React.FC<ReceiptProviderProps> = ({ children }) => {
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  // The value object contains the current receipt state and the setter function
  const value = {
    receipt,
    setReceipt
  };

  return (
    <ReceiptContext.Provider value={value}>
      {children}
    </ReceiptContext.Provider>
  );
};

export default ReceiptContext; 