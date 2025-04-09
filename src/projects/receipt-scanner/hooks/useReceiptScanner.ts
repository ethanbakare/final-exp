import { useState } from 'react';
import axios from 'axios';
import { Receipt, ReceiptUploadResponse } from '../types/receipt';

// API endpoint for the receipt scanner
const API_URL = 'http://localhost:8000/api/receipts/process';

interface UseReceiptScannerReturn {
  receipt: Receipt | null;
  isLoading: boolean;
  error: string | null;
  uploadReceipt: (file: File, advancedParsing?: boolean) => Promise<void>;
  resetState: () => void;
}

export function useReceiptScanner(): UseReceiptScannerReturn {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setReceipt(null);
    setError(null);
  };

  const uploadReceipt = async (file: File, advancedParsing: boolean = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('advanced_parsing', String(advancedParsing));
      
      const response = await axios.post<Receipt>(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setReceipt(response.data);
    } catch (err) {
      console.error('Error uploading receipt:', err);
      
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Failed to process receipt. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    receipt,
    isLoading,
    error,
    uploadReceipt,
    resetState,
  };
} 