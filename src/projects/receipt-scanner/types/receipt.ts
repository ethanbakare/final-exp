export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  original_price?: number;
  discount?: number;
  price_per_unit?: string;
}

export interface Currency {
  code: string | null;
  symbol: string | null;
}

export interface ValidationUI {
  header: string;
  body: string;
  status: 'success' | 'warning' | 'error';
  discount_warning?: {
    header: string;
    body: string;
  };
}

export interface Receipt {
  store_name: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax_and_fees: number;
  savings: number;
  total: number;
  currency: Currency;
  validation_message: string;
  validation_ui: ValidationUI;
  error?: string;
}

export interface ReceiptUploadResponse {
  success: boolean;
  data?: Receipt;
  error?: string;
} 