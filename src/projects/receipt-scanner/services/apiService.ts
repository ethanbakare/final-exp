import { Receipt } from '../types/receipt';

/**
 * Processes a receipt image through the API
 * 
 * This function:
 * 1. Takes the image file from the user upload
 * 2. Creates a FormData object with the file
 * 3. Sends it to the backend API via the Next.js proxy
 * 4. Returns the structured data response
 */
export const processReceiptImage = async (file: File): Promise<Receipt> => {
  // Create form data for file upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('advanced_parsing', 'true');
  
  // Send to the API endpoint via Next.js proxy
  const response = await fetch('/api/receipt-scanner/process', {
    method: 'POST',
    body: formData,
  });
  
  // Handle errors
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `API error: ${response.status}`);
  }
  
  // Parse and return the response data
  return await response.json();
};

/**
 * Direct API call to the backend
 * This is used by the Next.js API proxy endpoint
 * 
 * @param formData - FormData with the receipt image
 * @returns Promise with the backend response
 */
export const callBackendApi = async (formData: FormData): Promise<Receipt> => {
  const url = `http://localhost:8000/api/receipts/process`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      // Don't set Content-Type header for FormData
      // The browser will set it with the correct boundary
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Backend API error: ${response.status}`);
  }
  
  return await response.json();
}; 