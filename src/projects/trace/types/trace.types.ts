/**
 * Trace UI TypeScript Interfaces
 * Following atomic design pattern
 */

/* ==================== NAVBAR STATES ==================== */

export type TRNavbarState =
  | 'idle'
  | 'recording'
  | 'processing_audio'
  | 'processing_image';

export type TraceAppState =
  | 'idle'
  | 'recording'
  | 'processing_audio'
  | 'processing_image'
  | 'error';


/* ==================== BUTTON PROPS ==================== */

export interface BaseButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export interface UploadButtonProps extends BaseButtonProps {}

export interface SpeakButtonProps extends BaseButtonProps {}

export interface CloseButtonProps extends BaseButtonProps {}

export interface ClearButtonProps extends BaseButtonProps {}

export interface SendAudioButtonProps extends BaseButtonProps {
  isRecording?: boolean;
}

export interface ProcessingButtonProps {
  text: string;
  className?: string;
}


/* ==================== FINANCE DISPLAY ATOMS ==================== */

export interface DateLabelProps {
  date: string;
  className?: string;
}

export interface CurrencyLabelProps {
  currency: string;
  size?: 'small' | 'medium' | 'discount';
  className?: string;
}

export interface QuantityBadgeProps {
  quantity: number;
  className?: string;
}

export interface ItemNameTextProps {
  name: string;
  merchant?: string; // Optional sub-text (currently unused in design)
  className?: string;
}


/* ==================== FINANCE DISPLAY MOLECULES ==================== */

export interface TotalFrameProps {
  currency: string;
  amount: number;
  className?: string;
}

export interface NetPriceFrameProps {
  currency: string;
  price: number;
  className?: string;
}

export interface DiscountFrameProps {
  currency: string;
  discount: number;
  className?: string;
}

export interface PriceFrameProps {
  currency: string;
  netPrice: number;
  discount?: number; // Optional - only shown if present
  className?: string;
}

export interface QtyItemNameProps {
  quantity: number;
  itemName: string;
  className?: string;
}

export interface DayTotalProps {
  date: string;
  currency: string;
  total: number;
  className?: string;
}

export interface RowIdentifierProps {
  merchant: string;
  currency: string;
  total: number;
  className?: string;
}

export interface ContentRowProps {
  quantity: number;
  itemName: string;
  currency: string;
  netPrice: number;
  discount?: number; // Optional
  isFirstItem?: boolean; // Affects padding (4px vs 0px top)
  className?: string;
}


/* ==================== FINANCE DISPLAY ORGANISMS ==================== */

export interface Item {
  quantity: number;
  name: string;
  unit_price: number;
  total_price: number;
  discount: number;
}

export interface MerchantBlockProps {
  merchant: string;
  merchantTotal: number;
  currency: string;
  items: Item[];
  className?: string;
}

export interface Merchant {
  merchant: string;
  merchantTotal: number;
  items: Item[];
}

export interface DayBlockProps {
  date: string;
  dayTotal: number;
  currency: string;
  merchants: Merchant[];
  className?: string;
}

export interface Day {
  date: string;
  dayTotal: number;
  merchants: Merchant[];
}

export interface FinanceBoxProps {
  days: Day[];
  currency?: string; // Optional, defaults to '£'
  onDelete?: (dayId: string) => void;
  className?: string;
}


/* ==================== NAVBAR PROPS ==================== */

export interface TRNavbarProps {
  state: TRNavbarState;
  onUploadClick?: () => void;
  onSpeakClick?: () => void;
  onCloseClick?: () => void;
  onSendAudioClick?: () => void; // Parent component manages audio blob from recording state
  disabled?: boolean;
  fullWidth?: boolean; // When true, processing state expands to 100% of parent instead of fixed 247px
  className?: string;
}


/* ==================== APP LEVEL TYPES ==================== */

export interface ExpenseEntry {
  id: string;
  date: string;
  merchant: string | null;
  currency: string;
  total: number;
  items: Item[];
  source: 'voice' | 'camera';
  createdAt?: string;
}

export interface TraceAppProps {
  initialEntries?: ExpenseEntry[];
  apiKey?: string;
  onError?: (error: string) => void;
}


/* ==================== HELPER TYPES ==================== */

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface AudioRecordingState {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
}

export interface ImageUploadState {
  isProcessing: boolean;
  imageData: string | null;
  fileName: string | null;
}


/* ==================== SHOWCASE TYPES ==================== */

export interface ButtonGridProps {
  label: string;
  children: React.ReactNode;
  showToggle?: boolean;
  toggleState?: boolean;
  onToggle?: () => void;
}

export interface ComponentGridProps {
  label: string;
  children: React.ReactNode;
  description?: string;
}
