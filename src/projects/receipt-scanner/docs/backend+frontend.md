# Receipt Scanner Integration Specification

## Document Purpose
This document provides a comprehensive technical specification for the integration between the Receipt Scanner's frontend and backend components. It serves as:
1. A detailed architectural reference for developers implementing the integration
2. A pseudocode explanation of the complete data flow from image upload to display
3. A guide for understanding how user interactions trigger specific processes
4. A reference for API contract and data structures shared between frontend and backend

## 1. Overview
This document outlines the technical specification for integrating the Receipt Scanner API (FastAPI backend) with the Receipt Scanner Frontend (Next.js). The integration will enable users to upload receipt images, process them through OCR and AI analysis, and display structured data in an interactive, editable interface.

## 2. System Architecture

### 2.1 High-Level Architecture
```
┌─────────────────┐      ┌─────────────────┐      ┌────────────────┐
│                 │      │                 │      │                │
│  React Frontend │──────│ Next.js API     │──────│ FastAPI        │
│  Components     │      │ Proxy Routes    │      │ Backend        │
│                 │      │                 │      │                │
└─────────────────┘      └─────────────────┘      └────────────────┘
```

### 2.2 Component Structure

#### Frontend (Next.js)
- **Page Components**: Main application pages
  - `src/pages/receipt-scanner/index.tsx`: Main entry point
- **UI Components**: Reusable interface elements
  - `src/projects/receipt-scanner/components/layout/Header.tsx`: Navigation header
  - `src/projects/receipt-scanner/components/layout/ReceiptCard.tsx`: Receipt upload component
  - `src/projects/receipt-scanner/components/layout/ReceiptNavbar.tsx`: Action controls for receipts
  - `src/projects/receipt-scanner/components/ui/ListItem.tsx`: Receipt display component
  - `src/projects/receipt-scanner/components/ui/CardContent.tsx`: Receipt item display
  - `src/projects/receipt-scanner/components/ui/Toast.tsx`: Notification component for validation messages
  - `src/projects/receipt-scanner/components/Interface.tsx`: Main orchestrator component
  - `src/projects/receipt-scanner/components/ReceiptDisplay.tsx`: Component to display processed receipt (to be created)
- **API Services**: Functions for API communication
  - `src/projects/receipt-scanner/services/apiService.ts`: API client service (to be created)
- **Types**: TypeScript interfaces mirroring API response structures
  - `src/projects/receipt-scanner/types/receipt.ts`: Receipt data interfaces (to be created)

#### API Proxy (Next.js API Routes)
- **Process Endpoint**: Forwards receipt images to backend
  - `src/pages/api/receipt-scanner/process.ts`: Proxy endpoint (to be created)

#### Backend (FastAPI)
- **OCR Processing**: Extracts text from images
  - `receipt-scanner-api/app/receipt_processor.py`: OCR with Google Cloud Vision
- **AI Analysis**: Structures data with GPT-4o-mini
  - `receipt-scanner-api/app/receipt_processor.py`: AI processing function
- **Validation**: Ensures numeric data consistency
  - `receipt-scanner-api/app/receipt_processor.py`: Validation functions

## 3. Data Flow

### 3.1 User Upload Flow
1. User selects or drags receipt image into `ReceiptCard` component
2. Frontend validates file type (JPG, PNG, BMP) in `handleFileChange()` function
3. "Process Receipt" button in `ReceiptNavbar` triggers processing
4. `Interface` component calls `processReceiptImage()` from apiService
5. Request is sent to FastAPI backend through API service
6. Backend processes image through OCR pipeline
7. Backend returns structured receipt data
8. Frontend receives response and updates state in `Interface` component
9. `ReceiptDisplay` component renders with data flowing to `ListItem` and `CardContent`
10. Toast notification displays validation status
11. User can view and edit receipt details

### 3.2 Image Processing Flow (Detailed)
```
┌─────────────────┐      ┌────────────────┐      ┌────────────────┐
│  ReceiptCard    │      │  ReceiptNavbar │      │   Interface    │
│  Component      │──────│  Component     │──────│   Component    │
│  (Upload UI)    │      │  (Actions)     │      │   (State Mgmt) │
└─────────────────┘      └────────────────┘      └────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐      ┌────────────────┐      ┌────────────────┐
│  1. Select File │      │ 3. Process Btn │      │ 4. API Service │
│  handleFileSelect│      │   clicked     │      │   processImage │
└─────────────────┘      └────────────────┘      └────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐      ┌────────────────┐      ┌────────────────┐
│  2. File Stored │      │    Backend     │      │  8. Response   │
│  in State       │      │    API Call    │      │     Parsing    │
└─────────────────┘      └────────────────┘      └────────────────┘
                                 │                       │
                                 ▼                       ▼
                          ┌────────────────┐      ┌────────────────┐
                          │  5. OCR Text   │      │  9. Update UI  │
                          │    Extraction  │      │     Components  │
                          └────────────────┘      └────────────────┘
                                 │                       │
                                 ▼                       ▼
                          ┌────────────────┐      ┌────────────────┐
                          │  6. AI Data    │      │ 10. Toast      │
                          │    Structuring │      │     Notification│
                          └────────────────┘      └────────────────┘
                                 │                       
                                 ▼                       
                          ┌────────────────┐      
                          │  7. Data       │      
                          │    Validation  │      
                          └────────────────┘      
```

#### Image Upload Flow Pseudocode
```javascript
// Step 1: User selects file in ReceiptCard
function handleFileSelect(file) {
  validateFileType(file); // Check if JPG, PNG, BMP
  setSelectedFile(file);  // Update state in Interface component
  
  // State change triggers navbar to update to READY_TO_PROCESS
  // This happens via useEffect in Interface component
}

// Step 2: User clicks "Process Receipt" in ReceiptNavbar
function handleProcessReceipt() {
  setIsProcessing(true);  // Show loading indicator
  
  processReceiptImage(selectedFile)  // API call via service
    .then(data => {
      setReceiptData(data);  // Store structured data
      showValidationToast(data.validation_ui);  // Display validation status
      setNavbarState(NavbarState.TABLE_VIEW);  // Update UI state
    })
    .catch(error => {
      showErrorToast(error);
    })
    .finally(() => {
      setIsProcessing(false);  // Hide loading indicator  
    });
}

// Step 3: Backend processes the image
// This happens on the server side
function processImageOnBackend(imageFile) {
  const textData = extractTextFromImage(imageFile);  // OCR with Google Vision
  const structuredData = processWithGPT(textData);   // AI processing with GPT
  const validatedData = validateAndCleanReceipt(structuredData);  // Validate calculations
  
  return {
    ...validatedData,
    validation_ui: generateValidationMessage(validatedData)
  };
}

// Step 4: Frontend displays the processed data
function displayProcessedReceipt(receiptData) {
  // Render ReceiptDisplay component with data
  // Pass specific parts of data to child components:
  //  - Store name and date to ListItem header
  //  - Items array to CardContent items
  //  - Subtotal, savings, tax to CardContent totals
  //  - Validation message to Toast component
}
```

### 3.3 Data Transformation
- Raw image → OCR text extraction (Google Cloud Vision `extract_text_from_image()`)
- OCR text → Structured data (GPT-4o-mini `process_with_gpt()`)
- Structured data → Validated receipt data (`validate_and_clean_receipt()`)
- Backend response → Frontend state (via `setReceiptData()` in Interface component)
- Frontend state → UI rendering (through props to `ReceiptDisplay`, `ListItem`, and `CardContent`)
- Validation message → Toast notification (success, warning, or error)

## 4. Component Specifications

### 4.1 Main Interface Component
**File Path**: `src/projects/receipt-scanner/components/Interface.tsx`

**Purpose**: Entry point for the receipt scanner application that orchestrates the image upload and processing flow

**Core Functionality**:
- Manages the file upload state
- Coordinates the transition between navbar states
- Triggers API calls when "Process Receipt" is clicked
- Distributes receipt data to child components
- Handles validation notifications

**State Management**:
```typescript
// File state
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [navbarState, setNavbarState] = useState<NavbarState>(NavbarState.INITIAL);

// Processing state
const [isProcessing, setIsProcessing] = useState<boolean>(false);
const [processingError, setProcessingError] = useState<string | null>(null);

// Receipt data state
const [receiptData, setReceiptData] = useState<ReceiptApiResponse | null>(null);

// Validation notification
const [validationToast, setValidationToast] = useState<{
  visible: boolean;
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
} | null>(null);
```

**Image Upload Event Handlers**:
```typescript
// Triggered when user selects a file via ReceiptCard
const handleFileSelect = (file: File | null) => {
  setSelectedFile(file);
  // When file is selected, navbar automatically transitions to READY_TO_PROCESS
  // via useEffect below
};

// Automatic state transition when file is selected
useEffect(() => {
  if (selectedFile) {
    setNavbarState(NavbarState.READY_TO_PROCESS);
  } else {
    setNavbarState(NavbarState.INITIAL);
  }
}, [selectedFile]);

// Triggered when "Upload Receipt" button is clicked
const handleUploadClick = () => {
  // Programmatically trigger file selection dialog in ReceiptCard
  if (receiptCardRef.current) {
    receiptCardRef.current.triggerFileSelect();
  }
};

// Triggered when "Process Receipt" button is clicked
const handleProcessReceipt = async () => {
  if (!selectedFile) return;
  
  setIsProcessing(true);
  setProcessingError(null);
  
  try {
    // Call the API service to process the receipt image
    const data = await processReceiptImage(selectedFile);
    
    // Store the receipt data in state
    setReceiptData(data);
    
    // Set validation toast notification based on API response
    if (data.validation_ui) {
      setValidationToast({
        visible: true,
        type: data.validation_ui.status as 'success' | 'warning' | 'error',
        title: data.validation_ui.header,
        message: data.validation_ui.body
      });
    }
    
    // Update navbar state to show receipt data UI
    setNavbarState(NavbarState.TABLE_VIEW);
  } catch (error) {
    console.error('Error processing receipt:', error);
    setProcessingError(error instanceof Error ? error.message : 'Unknown error');
    
    // Show error toast notification
    setValidationToast({
      visible: true,
      type: 'error',
      title: 'Processing Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  } finally {
    setIsProcessing(false);
  }
};
```

**Component Integration**:
```tsx
return (
  <div className={`interface ${styles.container}`}>
    <div className="subinterface">
      <Header initialActiveTab={activeTab} onTabChange={handleTabChange} />
      
      {activeTab === 'scan' && (
        <>
          {navbarState === NavbarState.TABLE_VIEW && receiptData ? (
            // When processing is complete, show the receipt data
            <ReceiptDisplay receiptData={receiptData} />
          ) : (
            // Otherwise show the file upload component
            <ReceiptCard 
              ref={receiptCardRef}
              onFileSelect={handleFileSelect}
              showFileInfo={true}
            />
          )}
        </>
      )}
    </div>
    
    <div className="navbar-container">
      {activeTab === 'scan' && (
        <ReceiptNavbar 
          initialState={navbarState}
          selectedFile={selectedFile}
          onProcessReceipt={handleProcessReceipt} // New handler for processing
          isProcessing={isProcessing}
          processingError={processingError}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onEditStart={handleEditStart}
          onEditEnd={handleEditEnd}
          onUploadClick={handleUploadClick}
        />
      )}
    </div>
    
    {/* Toast notification for validation status */}
    {validationToast && validationToast.visible && (
      <Toast 
        type={validationToast.type}
        title={validationToast.title}
        message={validationToast.message}
        autoClose={validationToast.type !== 'error'}
        autoCloseTime={5000}
        onClose={() => setValidationToast(null)}
      />
    )}
  </div>
);
```

### 4.2 API Service Component
**File Path**: `src/projects/receipt-scanner/services/apiService.ts` (New file)

**Purpose**: Manages API communication with the backend for image processing

**Implementation**:
```typescript
// Type definitions for API response
export interface ReceiptApiResponse {
  store_name: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    original_price?: number;
    discount?: number;
    price: number;
    price_per_unit?: string;
  }[];
  subtotal: number;
  tax_and_fees: number;
  savings: number;
  total: number;
  currency: {
    code: string;
    symbol: string;
  };
  validation_message: string;
  validation_ui: {
    header: string;
    body: string;
    status: string;
  };
}

/**
 * Processes a receipt image through the API
 * 
 * This function:
 * 1. Takes the image file from the user upload
 * 2. Creates a FormData object with the file
 * 3. Sends it to the backend API
 * 4. Returns the structured data response
 */
export const processReceiptImage = async (file: File): Promise<ReceiptApiResponse> => {
  // Create form data for file upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('advanced_parsing', 'true');
  
  // Send to the API endpoint
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
```

### 4.3 ReceiptNavbar Component Enhancement
**File Path**: `src/projects/receipt-scanner/components/layout/ReceiptNavbar.tsx`

**Purpose**: Provides actions for receipt processing based on the current state

**Navbar States and Image Processing Sequence**:
1. **INITIAL State**: Shows "Upload Receipt" button
   - When clicked, triggers file selection dialog in ReceiptCard
   - After file is selected, transitions to READY_TO_PROCESS
  
2. **READY_TO_PROCESS State**: Shows "Process Receipt" button 
   - When clicked, triggers API call to process the image
   - Shows loading indicator during processing
   - After processing, transitions to TABLE_VIEW
  
3. **TABLE_VIEW State**: Shows receipt data controls
   - Download button to export receipt data
   - Edit button to modify receipt entries
   - Delete button to reset and upload a new receipt

4. **EDIT_MODE State**: Shows editing controls
   - Apply changes button to save edits
   - Download and delete buttons remain available

**Modifications**:
```typescript
export interface ReceiptNavbarProps {
  // Existing props...
  onProcessReceipt?: () => void; // New handler for processing
  isProcessing?: boolean;        // Loading state indicator
  processingError?: string | null; // Error message if processing fails
}

// In the READY_TO_PROCESS state section:
{state === NavbarState.READY_TO_PROCESS && (
  <>
    <div className="left-buttons">
      <Button 
        variant="disabled" 
        type="icon" 
        icon={downloadIcon}
      />
    </div>
    <div className="right-buttons">
      <Button 
        variant="primary" 
        type="text" 
        onClick={onProcessReceipt}
        disabled={isProcessing}
        className={isProcessing ? 'processing' : ''}
      >
        {isProcessing ? 'Processing...' : 'Process Receipt'}
      </Button>
      
      {processingError && (
        <div className="error-message">{processingError}</div>
      )}
    </div>
  </>
)}
```

**Image Processing Flow via Navbar States**:
```
┌───────────────┐     ┌────────────────┐     ┌───────────────┐     ┌───────────────┐
│   INITIAL     │     │ READY_TO_PROCESS│     │  TABLE_VIEW   │     │   EDIT_MODE   │
│ "Upload Btn"  │────▶│ "Process Btn"   │────▶│ Receipt Data  │────▶│ Editing Mode  │
└───────────────┘     └────────────────┘     └───────────────┘     └───────────────┘
        ▲                                             │                    │
        │                                             │                    │
        └─────────────────────────────────────────────┴────────────────────
                              Delete Button
```

### 4.4 Toast Component Integration
**File Path**: `src/projects/receipt-scanner/components/ui/Toast.tsx`

**Purpose**: Displays validation messages from the API

**Usage**:
- Used for displaying three types of validation messages:
  1. **Success**: "Validation complete: All values match"
  2. **Warning**: Calculation warnings when values don't match perfectly
  3. **Error**: Serious receipt errors or processing failures

**Integration with API Response**:
- The receipt_processor.py backend generates a validation_ui object:
  ```json
  "validation_ui": {
    "header": "Validation complete",
    "body": "All values match",
    "status": "success"
  }
  ```
- This structure maps directly to the Toast component props:
  ```typescript
  <Toast
    type={data.validation_ui.status as 'success' | 'warning' | 'error'}
    title={data.validation_ui.header}
    message={data.validation_ui.body}
    autoClose={true}
    autoCloseTime={5000}
    onClose={() => setValidationToast(null)}
  />
  ```

**Validation Message Examples**:
- **Success Case**:
  - Title: "Validation complete"
  - Message: "All values match"
  - Type: "success"

- **Warning Case**:
  - Title: "Validation warning"
  - Message: "Sum of item discounts ($12.00) don't match total savings ($15.00)"
  - Type: "warning"

- **Error Case**:
  - Title: "Receipt error"
  - Message: "Receipt total ($164.89) doesn't match calculated sum ($85.89)"
  - Type: "error"

### 4.5 ReceiptDisplay Component
**File Path**: `src/projects/receipt-scanner/components/ReceiptDisplay.tsx` (New file)

**Purpose**: Displays processed receipt data

**Implementation**:
```typescript
import React from 'react';
import ListItem from './ui/ListItem';
import Toast from './ui/Toast';
import { ReceiptApiResponse } from '../services/apiService';
import styles from '../styles/Components.module.css';

interface ReceiptDisplayProps {
  receiptData: ReceiptApiResponse;
}

const ReceiptDisplay: React.FC<ReceiptDisplayProps> = ({ receiptData }) => {
  // Transform API response data to ListItem format
  const transformToCurrencyData = (currencyInfo: ReceiptApiResponse['currency']) => {
    return {
      DisplayCountry: "Unknown",
      CurrencyCode: currencyInfo.code,
      DisplayCountry_CurrencyCode: `Unknown (${currencyInfo.code})`,
      DisplayCurrencySymbol: currencyInfo.symbol,
      SymbolPosition: 0, // Assume prefix position by default
      Country: "Unknown",
      CurrencySymbol: currencyInfo.symbol
    };
  };

  // Transform items for CardContent
  const transformItems = receiptData.items.map((item, index) => ({
    id: index,
    name: item.name,
    quantity: item.quantity || 1,
    price: item.price,
    discount: item.discount || 0,
    original_price: item.original_price
  }));

  return (
    <div className={styles.receiptDisplay}>
      <ListItem 
        initialTitle={receiptData.store_name}
        initialDate={new Date(receiptData.date.split('-').reverse().join('-'))}
        initialCurrency={transformToCurrencyData(receiptData.currency)}
        initialItems={transformItems}
        initialSubtotal={receiptData.subtotal}
        initialSavings={receiptData.savings}
        initialTax={receiptData.tax_and_fees}
      />
      
      {/* Validation message display */}
      <div className={`${styles.validationMessage} ${styles[receiptData.validation_ui.status]}`}>
        <h3>{receiptData.validation_ui.header}</h3>
        <p>{receiptData.validation_ui.body}</p>
      </div>
    </div>
  );
};

export default ReceiptDisplay;
```

### 4.6 ListItem Component Enhancement
**File Path**: `src/projects/receipt-scanner/components/ui/ListItem.tsx`

**Purpose**: Display and edit receipt details

**Modifications**:
- Update interface to add new props:
  ```typescript
  interface ListItemProps {
    initialTitle?: string;
    initialDate?: Date;
    initialCurrency?: CurrencyItem;
    initialItems?: {
      id: number;
      name: string;
      quantity: number;
      price: number;
      discount: number;
    }[];
    initialSubtotal?: number;
    initialSavings?: number;
    initialTax?: number;
  }
  ```
- Update useState initializers:
  ```typescript
  const [receiptTitle, setReceiptTitle] = useState(props.initialTitle || "Today's Receipt");
  const [selectedDate, setSelectedDate] = useState(props.initialDate || new Date());
  
  // Update initialCurrency handling
  const [selectedCurrencyIdentifier, setSelectedCurrencyIdentifier] = useState(() => {
    if (props.initialCurrency) {
      return props.initialCurrency.DisplayCountry_CurrencyCode;
    }
    return "United States (USD)";
  });
  ```
- Pass props to CardContent:
  ```typescript
  <CardContent 
    currency={selectedCurrency}
    initialItems={props.initialItems}
    initialSubtotal={props.initialSubtotal}
    initialSavings={props.initialSavings}
    initialTax={props.initialTax}
  />
  ```

### 4.7 CardContent Component Enhancement
**File Path**: `src/projects/receipt-scanner/components/ui/CardContent.tsx`

**Purpose**: Display receipt items and calculations with an editable interface

**Data Population Process**:
1. Receives structured receipt data from the API via props
2. Maps API item format to internal component format
3. Initializes component state with the API data
4. Renders editable fields populated with the API data
5. Provides editing functions for each field

**Data Flow Diagram**:
```
┌────────────────┐     ┌────────────────┐     ┌─────────────────┐
│  API Response  │     │  ReceiptDisplay │     │   ListItem      │
│  JSON Data     │────▶│  Component     │────▶│   Component     │
└────────────────┘     └────────────────┘     └─────────────────┘
                                                      │
                                                      ▼
┌────────────────┐     ┌────────────────┐     ┌─────────────────┐
│ Editable UI    │◀────│ useNumericFields│◀────│   CardContent   │
│ Fields         │     │ Hook (State)    │     │   Component     │
└────────────────┘     └────────────────┘     └─────────────────┘
```

**Component Props Enhancement**:
```typescript
interface CardContentProps {
  currency?: CurrencyItem;
  // New props for initial values from API
  initialItems?: {
    id: number;
    name: string;
    quantity: number;
    price: number;
    discount: number;
  }[];
  initialSubtotal?: number;
  initialSavings?: number;
  initialTax?: number;
}
```

**Data Population Implementation**:
```tsx
// CardContent component
const CardContent: React.FC<CardContentProps> = (props) => {
  // Initialize state with API data or defaults
  const {
    items,
    setItems,
    subtotal,
    setSubtotal,
    savings,
    setSavings,
    tax,
    setTax,
    total,
    isValid,
    // Event handlers...
  } = useNumericFields(
    addLog,
    props.initialItems, // Pass API items to hook
    props.initialSubtotal, // Pass API subtotal
    props.initialSavings, // Pass API savings
    props.initialTax // Pass API tax
  );

  // Rendering receipt items from API data
  return (
    <div className={styles.cardContent}>
      {/* Item rows populated from API data */}
      <div className={styles.listSection}>
        {items.map((item) => (
          <div 
            key={item.id} 
            className={styles.listItem}
          >
            {/* Item name from API */}
            <div 
              data-type="item"
              data-id={item.id}
              className={getEditableClassNames(/*...*/)}
            >
              <span className={styles.itemFrameText}>{item.name}</span>
            </div>
            
            {/* Item quantity from API */}
            <div className={styles.quantityFrame}>
              <span>{item.quantity}</span>
            </div>
            
            {/* Item price from API */}
            <div 
              data-type="price"
              data-id={item.id}
              className={getEditableClassNames(/*...*/)}
            >
              <span className={styles.priceCurrency}>
                {props.currency?.DisplayCurrencySymbol || '$'}
              </span>
              <span className={styles.priceValue}>{item.price.toFixed(2)}</span>
            </div>
            
            {/* Item discount from API */}
            <div 
              data-type="discount"
              data-id={item.id}
              className={getEditableClassNames(/*...*/)}
            >
              <span className={styles.discountMinus}>-</span>
              <span className={styles.discountCurrency}>
                {props.currency?.DisplayCurrencySymbol || '$'}
              </span>
              <span className={styles.discountValue}>{item.discount.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Totals section populated from API data */}
      <div className={styles.totalsSection}>
        {/* Subtotal from API */}
        <div className={styles.subtotalSection}>
          <span className={styles.subtotalLabel}>Subtotal</span>
          <div 
            data-type="subtotal"
            className={getEditableClassNames(/*...*/)}
          >
            <span className={styles.subtotalCurrency}>
              {props.currency?.DisplayCurrencySymbol || '$'}
            </span>
            <span className={styles.subtotalValue}>{subtotal.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Savings from API */}
        <div className={styles.savingsSection}>
          <span className={styles.savingsLabel}>Savings</span>
          <div 
            data-type="savings"
            className={getEditableClassNames(/*...*/)}
          >
            <span className={styles.savingsMinus}>-</span>
            <span className={styles.savingsCurrency}>
              {props.currency?.DisplayCurrencySymbol || '$'}
            </span>
            <span className={styles.savingsValue}>{savings.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Tax from API */}
        <div className={styles.taxSection}>
          <span className={styles.taxLabel}>Tax</span>
          <div 
            data-type="tax"
            className={getEditableClassNames(/*...*/)}
          >
            <span className={styles.taxCurrency}>
              {props.currency?.DisplayCurrencySymbol || '$'}
            </span>
            <span className={styles.taxValue}>{tax.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Total is calculated from above values */}
        <div className={styles.totalSection}>
          <span className={styles.totalLabel}>Total</span>
          <div className={styles.totalFrame}>
            <span className={styles.totalCurrency}>
              {props.currency?.DisplayCurrencySymbol || '$'}
            </span>
            <span className={styles.totalValue}>{total.toFixed(2)}</span>
            
            {/* Validation indicator */}
            <div className={`${styles.statusIndicator} ${isValid ? styles.valid : styles.invalid}`}>
              {isValid ? '✓' : '!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 4.8 CardContentHooks Update
**File Path**: `src/projects/receipt-scanner/components/ui/CardContentHooks.ts`

**Purpose**: Provides state management for the CardContent component

**Data Population from API to UI**:
The `useNumericFields` hook is responsible for:
1. Initializing component state with API data
2. Providing a stable interface for accessing and modifying the data
3. Handling calculations and validations of receipt totals
4. Transforming API data into UI-friendly format

**Hook Enhancement for API Data**:
```typescript
export function useNumericFields(
  addLog?: (message: string) => void,
  initialItems?: {
    id: number;
    name: string;
    quantity: number;
    price: number;
    discount: number;
  }[],
  initialSubtotal?: number,
  initialSavings?: number,
  initialTax?: number
) {
  // Initialize with API data or default values
  const [items, setItems] = useState(initialItems || sampleItems);
  const [subtotal, setSubtotal] = useState(initialSubtotal || 12.00);
  const [savings, setSavings] = useState(initialSavings || 10.00);
  const [tax, setTax] = useState(initialTax || 2.00);
  
  // Calculate total from the current values
  const total = subtotal - savings + tax;
  
  // Validation logic - check if the calculated total matches API total
  const [isValid, setIsValid] = useState(true);
  
  // Run validation on initial load and when values change
  useEffect(() => {
    // Simple validation - subtotal minus savings plus tax should equal total
    const calculatedTotal = subtotal - savings + tax;
    const calculatedItemTotal = items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);
      
    // Validate item total against subtotal (with small tolerance for rounding)
    const isItemTotalValid = Math.abs(calculatedItemTotal - subtotal) < 0.02;
    
    // Set overall validation state
    setIsValid(isItemTotalValid);
    
    if (addLog) {
      addLog(`Validation: calculatedTotal=${calculatedTotal.toFixed(2)}, 
              itemTotal=${calculatedItemTotal.toFixed(2)}, 
              subtotal=${subtotal.toFixed(2)}, 
              isValid=${isItemTotalValid}`);
    }
  }, [items, subtotal, savings, tax, addLog]);
  
  // Event handlers for user edits
  // ... existing handlers ...
  
  return {
    items,
    setItems,
    subtotal,
    setSubtotal,
    savings,
    setSavings,
    tax,
    setTax,
    total,
    isValid,
    setIsValid,
    // ... event handlers ...
  };
}
```

### 4.9 API Proxy Route
**File Path**: `src/pages/api/receipt-scanner/process.ts` (New file)

**Purpose**: Proxies image requests to the backend API

**Detailed Image Processing Sequence**:
1. Receives the image file from the frontend
2. Validates the file format and size
3. Creates a FormData object with the image
4. Forwards the request to the FastAPI backend
5. Returns the structured receipt data to the frontend

**Implementation**:
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form with formidable
    const form = new formidable.IncomingForm();
    form.maxFileSize = 10 * 1024 * 1024; // 10MB max file size
    
    const { fields, files } = await new Promise<{ 
      fields: formidable.Fields; 
      files: formidable.Files 
    }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // Get file and options
    const file = files.file as formidable.File;
    
    // Validate file
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/bmp'];
    const fileType = await getFileType(file.filepath);
    
    if (!validTypes.includes(fileType)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Please upload a JPG, PNG, or BMP image.' 
      });
    }
    
    const advancedParsing = fields.advanced_parsing === 'true';

    // Create form data for backend request
    const formData = new FormData();
    formData.append(
      'file', 
      new Blob([fs.readFileSync(file.filepath)]), 
      file.originalFilename || 'receipt.jpg'
    );
    formData.append('advanced_parsing', String(advancedParsing));

    // Forward to backend
    const backendResponse = await axios.post(
      'http://localhost:8000/api/receipts/process',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Increase timeout for OCR processing
        timeout: 30000, // 30 seconds
      }
    );

    // Return backend response
    return res.status(200).json(backendResponse.data);
  } catch (error) {
    console.error('Error processing receipt:', error);
    return res.status(500).json({ 
      error: 'Failed to process receipt',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Utility to check file type from buffer
async function getFileType(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  
  // Check file signature
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return 'image/jpeg';
  }
  
  if (
    buffer[0] === 0x89 && 
    buffer[1] === 0x50 && 
    buffer[2] === 0x4E && 
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
    return 'image/bmp';
  }
  
  return 'application/octet-stream';
}
```

## 5. API Integration

### 5.1 Endpoint Configuration
- **Receipt Processing Endpoint**: `/api/receipt-scanner/process` (Frontend proxy)
- **Backend Endpoint**: `http://localhost:8000/api/receipts/process` (FastAPI backend)
- **Method**: POST
- **Request Format**: multipart/form-data
- **Request Parameters**:
  - `file`: Receipt image file
  - `advanced_parsing`: Boolean, optional (default: true)

### 5.2 Backend CORS Configuration
**File Path**: `receipt-scanner-api/app/main.py`

**Modifications**:
```python
# Update CORS settings to match your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://your-production-domain.com"  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 5.3 Response Structure
```json
{
  "store_name": string,
  "date": string,
  "items": [
    {
      "name": string,
      "quantity": number,
      "original_price": number (optional),
      "discount": number (optional),
      "price": number,
      "price_per_unit": string (optional)
    }
  ],
  "subtotal": number,
  "tax_and_fees": number,
  "savings": number,
  "total": number,
  "currency": {
    "code": string,
    "symbol": string
  },
  "validation_message": string,
  "validation_ui": {
    "header": string,
    "body": string,
    "status": "success" | "warning" | "error"
  }
}
```

### 5.4 Error Response Structure
```json
{
  "error": string,
  "detail": string (optional)
}
```

### 5.5 Validation Response Examples

#### Example 1: Successful Validation
```json
{
  "validation_message": "✅ Validation complete: All values match.",
  "validation_ui": {
    "header": "Validation complete",
    "body": "All values match",
    "status": "success"
  }
}
```

#### Example 2: Validation Warning
```json
{
  "validation_message": "⚠️ Validation Warning: Sum of item discounts ($12.00) don't match total savings ($15.00)",
  "validation_ui": {
    "header": "Validation warning",
    "body": "Sum of item discounts ($12.00) don't match total savings ($15.00)",
    "status": "warning"
  }
}
```

#### Example 3: Receipt Error
```json
{
  "validation_message": "⚠️ Validation Warning: Sum of items ($72.00) + tax ($13.89) - savings ($0.0) = $85.89 does not match total ($164.89).",
  "validation_ui": {
    "header": "Receipt error",
    "body": "Receipt total ($164.89) doesn't match calculated sum ($85.89)",
    "status": "error"
  }
}
```

## 6. State Management Strategy

### 6.1 Component State Distribution
- **Interface Component**: Manages global application state
  - `selectedFile`: Uploaded receipt file
  - `navbarState`: Current UI state (initial, ready, processing, display)
  - `receiptData`: Processed receipt data from API
  - `isProcessing`: Loading indicator
  - `processingError`: Error message if processing fails
  - `validationToast`: State for displaying validation messages

- **ListItem Component**: Receipt header state
  - `receiptTitle`: Store name
  - `selectedDate`: Receipt date
  - `selectedCurrency`: Currency information

- **CardContent Component**: Receipt items state
  - `items`: List of purchased items
  - `subtotal`: Sum before discounts
  - `savings`: Total discounts
  - `tax`: Tax amount
  - `total`: Final total
  - `isValid`: Validation status

### 6.2 State Initialization Strategy
- Initialize all component states from props where available
- Provide sensible defaults for missing values
- Maintain original API response for potential reset functionality

### 6.3 Toast Notification Strategy
- Display validation messages immediately after processing
- Use the appropriate Toast type based on validation status:
  - `success`: All values match
  - `warning`: Minor discrepancies
  - `error`: Significant discrepancies or processing errors
- Auto-close success/warning toasts after a few seconds
- Keep error toasts visible until dismissed
- Allow user to manually dismiss all Toast notifications

## 7. Error Handling Strategy

### 7.1 Upload Phase Errors
**File Path**: `src/projects/receipt-scanner/components/layout/ReceiptCard.tsx`
- Validate file type in `handleFileChange()` and `handleDrop()`
- Display appropriate error messages for invalid file types
- Handle file size limitations with user feedback

### 7.2 Processing Phase Errors
**File Path**: `src/projects/receipt-scanner/components/Interface.tsx`
- Wrap API calls in try/catch blocks
- Set `processingError` state with specific error messages
- Display appropriate UI feedback through ReceiptNavbar
- Show error toasts with specific error details

### 7.3 Rendering Phase Errors
**File Path**: `src/projects/receipt-scanner/components/ReceiptDisplay.tsx`
- Implement fallback values for missing data
- Handle edge cases like missing currency information
- Display validation warnings from API response

### 7.4 Validation Error Handling
**File Path**: `src/projects/receipt-scanner/components/Interface.tsx`
- Display Toast notifications based on validation status
- Map backend validation status to appropriate Toast types
- Display detailed validation messages from the backend
- Allow users to acknowledge validation issues while still viewing the receipt

## 8. Implementation Steps

### 8.1 Backend Preparation
1. Ensure FastAPI backend is running on port 8000
2. Update CORS settings in `receipt-scanner-api/app/main.py`
3. Verify API endpoint functionality with direct testing

### 8.2 Frontend Implementation
1. Create API service file (`apiService.ts`)
2. Update `Interface.tsx` with new state and handlers
3. Create `ReceiptDisplay.tsx` component
4. Modify `ReceiptNavbar.tsx` to handle process action
5. Update `ListItem.tsx` and `CardContent.tsx` to accept initial data
6. Create API proxy route (`/api/receipt-scanner/process.ts`)
7. Implement Toast notifications for validation status
8. Implement updated types and interfaces

### 8.3 Testing Flow
1. Upload image in ReceiptCard
2. Trigger processing via ReceiptNavbar
3. Verify data flows correctly to ListItem/CardContent
4. Test Toast notifications for different validation scenarios
5. Test error handling scenarios

## 9. Additional Considerations

### 9.1 Performance Optimization
- Implement lazy loading for components
- Add debounce for user interactions
- Optimize image handling before upload

### 9.2 Accessibility Enhancements
- Add proper ARIA attributes to all interactive elements
- Ensure keyboard navigation throughout the flow
- Provide clear loading and error states

### 9.3 Security Considerations
- Implement file type and size validation
- Sanitize input/output data
- Use environment variables for API endpoints

## 10. Deployment Strategy

### 10.1 Development Environment
- Frontend: `npm run dev` (Next.js development server)
- Backend: `uvicorn app.main:app --reload` (FastAPI development server)
- API URL: `http://localhost:8000/api/receipts/process`

### 10.2 Production Environment
- Frontend: Deploy to Vercel or similar platform
- Backend: Deploy to appropriate container/serverless platform
- API URL: Configure through environment variables
- CORS: Update with production domain

### 10.3 Configuration Management
**File Path**: `src/projects/receipt-scanner/config.ts` (New file)
```typescript
// Environment-specific configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
export const RECEIPT_PROCESS_URL = `${API_BASE_URL}/api/receipts/process`;
```

## 11. Complete Image Processing Flow Summary

### 11.1 End-to-End Flow Diagram
```
┌───────────────────────────────────┐
│        User Interaction           │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│ 1. Upload Receipt (Initial State) │
│    - User uploads image file      │
│    - File stored in state         │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│ 2. Process Receipt Button         │
│    - NavbarState.READY_TO_PROCESS │
│    - Triggers API call            │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│ 3. Frontend API Service           │
│    - FormData with image created  │
│    - Request sent to proxy route  │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│ 4. Next.js API Proxy              │
│    - Validates file type/size     │
│    - Forwards to FastAPI backend  │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│ 5. FastAPI Backend Processing     │
│    - OCR text extraction          │
│    - AI structured data parsing   │
│    - Receipt validation           │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│ 6. JSON Response Returned         │
│    - Structured receipt data      │
│    - Validation status included   │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│ 7. Frontend State Updates         │
│    - receiptData state populated  │
│    - Validation toast shown       │
│    - NavbarState → TABLE_VIEW     │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│ 8. UI Components Populate         │
│    - ReceiptDisplay component     │
│    - ListItem header data         │
│    - CardContent displays items   │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│ 9. User Interactions Available    │
│    - Edit receipt entries         │
│    - Download receipt data        │
│    - Delete and start over        │
└───────────────────────────────────┘
```

### 11.2 Image Upload Flow Summary

1. **Initial Upload Phase**:
   - User clicks "Upload Receipt" button in ReceiptNavbar (INITIAL state)
   - ReceiptCard component opens file selection dialog
   - User selects a receipt image file (JPG, PNG, BMP)
   - File is validated for type and size
   - File information is displayed (name, size)
   - ReceiptNavbar transitions to READY_TO_PROCESS state

2. **Processing Phase**:
   - User clicks "Process Receipt" button
   - Button shows loading state ("Processing...")
   - Receipt image is packaged in FormData
   - Request is sent to backend API via Next.js proxy
   - Backend extracts text from image using OCR
   - AI processing structures the receipt data
   - Validation checks are performed (items sum, totals, etc.)
   - Structured data with validation status is returned

3. **Display Phase**:
   - Interface component receives API response data
   - Data is stored in component state
   - Validation toast notification appears
     - Success (green): All calculations match
     - Warning (yellow): Minor discrepancies detected
     - Error (red): Major discrepancies or processing error
   - ReceiptNavbar transitions to TABLE_VIEW state
   - ReceiptDisplay component renders with data
   - ListItem displays store name and date
   - CardContent populates with items and totals

4. **User Interaction Phase**:
   - User can view the structured receipt data
   - Edit mode allows modifying any values
   - Download functionality exports receipt data
   - Delete function resets the process
   - Toast notifications provide validation feedback

### 11.3 Data Population Process

```
┌────────────────────┐     ┌────────────────────┐
│                    │     │                    │
│  Raw Receipt Image │────▶│  OCR Text          │
│  (JPG/PNG)         │     │  Extraction        │
│                    │     │                    │
└────────────────────┘     └──────────┬─────────┘
                                      │
                                      ▼
┌────────────────────┐     ┌────────────────────┐
│                    │     │                    │
│  Validation Status │◀────│  AI Structured     │
│  (Success/Warning) │     │  Data Processing   │
│                    │     │                    │
└─────────┬──────────┘     └──────────┬─────────┘
          │                           │
          │                           ▼
┌─────────▼──────────┐     ┌────────────────────┐
│                    │     │                    │
│  Toast             │     │  Interface         │
│  Notification      │     │  Component State   │
│                    │     │                    │
└────────────────────┘     └──────────┬─────────┘
                                      │
              ┌─────────────────────────────────────┐
              │                                     │
              ▼                                     ▼
┌─────────────────────┐               ┌─────────────────────┐
│                     │               │                     │
│  ListItem           │               │  CardContent        │
│  Store/Date/Currency│               │  Items/Totals       │
│                     │               │                     │
└─────────────────────┘               └─────────────────────┘
```

The key to this integration is the structured flow of data from the raw image all the way to the UI components. The process ensures that:

1. **Image capture is reliable**: Users can upload receipt images easily
2. **Processing is robust**: OCR and AI ensure accurate data extraction
3. **Validation is thorough**: Mathematical checks ensure data integrity
4. **User feedback is clear**: Toast notifications communicate validation status
5. **UI is interactive**: Users can view and edit all receipt data
6. **Data flow is traceable**: Each piece of information has a clear path from backend to UI

This comprehensive approach creates a seamless user experience while maintaining data integrity throughout the receipt scanning and processing workflow.

### 11.4 Implementation Checklist

To fully implement the image upload and processing flow:

1. ✅ Update Interface.tsx with new state variables and handlers
2. ✅ Create apiService.ts for backend communication
3. ✅ Enhance ReceiptNavbar.tsx to support processing state
4. ✅ Create ReceiptDisplay.tsx component
5. ✅ Update ListItem.tsx to accept initial data
6. ✅ Update CardContent.tsx to accept and display API data
7. ✅ Modify CardContentHooks.ts to handle initial values
8. ✅ Create API proxy endpoint for secure image processing
9. ✅ Implement Toast notifications for validation feedback
10. ✅ Add loading states and error handling throughout

This implementation will create a robust, user-friendly receipt scanning experience with clear feedback and reliable data processing.