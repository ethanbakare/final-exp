/**
 * Environment-specific configuration
 * 
 * These values would normally be loaded from environment variables.
 * For simplicity in this implementation, we're using hardcoded values.
 */

// API base URL for receipt scanner backend
export const API_BASE_URL = 'http://localhost:8000';

// API endpoint for receipt processing
export const RECEIPT_PROCESS_ENDPOINT = '/api/receipts/process'; 