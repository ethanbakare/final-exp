# Receipt Scanner Component Structure

<a id="toc"></a>
## Table of Contents

1. [Overview](#overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Components](#components)
   1. [ListItem Component](#listitem)
      - [Structure](#listitem-structure)
      - [State Management](#listitem-state)
      - [Key Functions](#listitem-functions)
      - [CSS Classes](#listitem-css)
      - [Critical Implementation Details](#listitem-critical)
      - [Edge Cases](#listitem-edge-cases)
   2. [CardContent Component](#cardcontent)
      - [Structure](#cardcontent-structure)
      - [State Management](#cardcontent-state)
      - [Key Functions](#cardcontent-functions)
      - [CSS Classes](#cardcontent-css)
      - [Critical Implementation Details](#cardcontent-critical)
      - [Edge Cases](#cardcontent-edge-cases)
   3. [DatePickerCalendar Component](#datepicker)
      - [Structure](#datepicker-structure)
      - [State Management](#datepicker-state)
      - [Key Functions](#datepicker-functions)
      - [CSS Classes](#datepicker-css)
      - [Critical Implementation Details](#datepicker-critical)
      - [Edge Cases](#datepicker-edge-cases)
4. [Currency Data Integration](#currency)
5. [Cross-Component Interactions](#cross-component)
6. [Responsive Design](#responsive)
7. [Implementation Decisions](#decisions)
8. [Component Index](#index)

<a id="overview"></a>
## Overview
[↑ Back to Table of Contents](#toc)

The Receipt Scanner is composed of three main components that work together to create a complete receipt management interface:

1. **ListItem.tsx** - The main container component that provides the card structure, editable store name, date picker, and currency selection
2. **CardContent.tsx** - Displays the purchased items and calculation details including editable price values
3. **DatePickerCalendar.tsx** - Provides date selection functionality with month navigation

The application allows users to:
- Edit receipt title (store name)
- Select date of purchase
- Choose currency
- View and edit purchased items, prices, and discounts
- See calculated subtotals, savings, taxes, and final total

<a id="component-hierarchy"></a>
## Component Hierarchy
[↑ Back to Table of Contents](#toc)

```
ListItem.tsx (Main Container Component)
├── Card Container (.card)
│   ├── Card Header (.card-header)
│   │   ├── Store With Date Container (.store-with-date)
│   │   │   ├── Store Name (.store-name)
│   │   │   │   └── Editable Title (.editable-title)
│   │   │   └── DatePickerCalendar Component
│   │   │       ├── Date Select Calendar (.date-select-calendar)
│   │   │       │   ├── Date Display (.date-display)
│   │   │       │   └── Dropdown Icon (.dropdown-icon)
│   │   │       └── Calendar Container (.calendar-container) - when open
│   │   │           ├── Calendar Month Header (.calendar-month-header)
│   │   │           │   ├── Month Nav Button (.month-nav-button) - previous
│   │   │           │   ├── Calendar Month Label (.calendar-month-label)
│   │   │           │   └── Month Nav Button (.month-nav-button) - next
│   │   │           └── Calendar Content (.calendar-content)
│   │   │               ├── Weekday Header (.weekday-header)
│   │   │               │   └── Weekday Cells (.weekday-cell) × 7
│   │   │               └── Calendar Days (.calendar-days)
│   │   │                   └── Day Cells × 42 (6 weeks)
│   │   └── Currency Select Combobox (.currency-select-combobox)
│   │       ├── Currency Display (.currency-display)
│   │       ├── Dropdown Icon (.dropdown-icon)
│   │       └── Currency Dropdown (.currency-dropdown) - when open
│   │           ├── Currency Search (.currency-search)
│   │           │   └── Search Input
│   │           └── Currency List (.currency-list)
│   │               └── Currency Items (.currency-item) × N
│   └── CardContent Component
│       ├── Card List (.cardList)
│       │   └── Content Rows (.contentRow) × N
│       │       ├── Quantity and Item (.qtyItem)
│       │       │   ├── Quantity Frame (.qtyFrame)
│       │       │   │   ├── Quantity Frame Text (.qtyFrameText)
│       │       │   │   └── Quantity Frame Multiplier (.qtyFrameMultiplier) - if quantity > 1
│       │       │   └── Item Frame (.itemFrame)
│       │       │       └── Item Frame Text (.itemFrameText)
│       │       └── Values (.values)
│       │           ├── Price Frame (.priceFrame)
│       │           │   ├── Price Currency (.priceCurrency)
│       │           │   └── Price Value (.priceValue)
│       │           └── Discount Frame (.discountFrame) - if discount exists
│       │               ├── Discount Minus (.discountMinus)
│       │               ├── Discount Currency (.discountCurrency)
│       │               └── Discount Value (.discountValue)
│       └── Card Calculation (.cardCalculation)
│           ├── Calculation Rows (.calculationRows)
│           │   ├── Subtotal Price Frame (.subtotalPriceFrame)
│           │   │   ├── Subtotal Label (.subtotalLabel)
│           │   │   ├── Subtotal Currency (.subtotalCurrency)
│           │   │   └── Subtotal Value (.subtotalValue)
│           │   ├── Saving Price Frame (.savingPriceFrame) - if savings exist
│           │   │   ├── Savings Label (.savingLabel)
│           │   │   ├── Savings Minus (.savingsMinus)
│           │   │   ├── Savings Currency (.savingsCurrency)
│           │   │   └── Savings Value (.savingsValue)
│           │   └── Tax Price Frame (.taxPriceFrame) - if tax exists
│           │       ├── Tax Label (.taxLabel)
│           │       ├── Tax Currency (.taxCurrency)
│           │       └── Tax Value (.taxValue)
│           └── Total Row (.totalRow)
│               ├── Total Label (.totalLabel)
│               ├── Total Value (.totalValue)
│               │   ├── Total Currency (.totalCurrency)
│               │   └── Total Price (.totalPrice)
│               └── Status Icon (.statusIcon) - check or error
```

<a id="components"></a>
## Components
[↑ Back to Table of Contents](#toc)

<a id="listitem"></a>
### ListItem Component
[↑ Back to Table of Contents](#toc)

The ListItem component serves as the main container for the receipt card. It manages the editable store name, date picker dropdown, and currency selection.

<a id="listitem-structure"></a>
#### Structure

- `.card` - Main container with shadow and rounded corners
  - `.card-header` - Contains title, date picker, and currency selector
    - `.store-with-date` - Left side of header
      - `.store-name` - Container for editable title
        - `.editable-title` - Actual editable text field
      - `DatePickerCalendar` component - Date selection dropdown
    - `.currency-select-combobox` - Currency selector
      - `.currency-display` - Selected currency code
      - `.dropdown-icon` - Dropdown arrow
      - `.currency-dropdown` - Currency selection list (when open)
  - `CardContent` component - Receipt content area

<a id="listitem-state"></a>
#### State Management

```typescript
// Store name state
const [receiptTitle, setReceiptTitle] = useState("Today's Receipt");
const [isTitleFocused, setIsTitleFocused] = useState(false);

// Date picker state
const [selectedDate, setSelectedDate] = useState(new Date(2025, 2, 2));
const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

// Currency selector state
const [selectedCurrencyIdentifier, setSelectedCurrencyIdentifier] = useState("United States (USD)");
const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
const [currencySearchTerm, setCurrencySearchTerm] = useState("");
const [currencyDropdownPosition, setCurrencyDropdownPosition] = useState({...});

// Refs for DOM manipulation
const titleRef = useRef<HTMLDivElement>(null);
const datePickerRef = useRef<HTMLDivElement>(null);
const currencySelectRef = useRef<HTMLDivElement>(null);
const currencyDropdownRef = useRef<HTMLDivElement>(null);
const titleContentRef = useRef<HTMLDivElement>(null);
```

<a id="listitem-functions"></a>
#### Key Functions

- `handleToggleDatePicker()` - Opens/closes the date picker dropdown
- `handleDateSelect(date)` - Updates the selected date and closes the picker
- `handleCardInteractions(e)` - Handles clicks on the card to manage focus states
- `filteredCurrencies` - Filters currency data based on search term
- `sortedCurrencies` - Sorts currencies to show selected currency at top

<a id="listitem-css"></a>
#### CSS Classes

- `.card` - Main container with shadow and rounded corners
- `.card-header` - Contains store name, date picker, and currency selector
- `.store-name` - Container for editable store name with focus styling
- `.editable-title` - The actual editable text field for store name
- `.date-select-calendar` - Date picker toggle with selected date display
- `.currency-select-combobox` - Currency selector with dropdown
- `.currency-dropdown` - Currency selection list with search

<a id="listitem-critical"></a>
#### Critical Implementation Details

##### Editable Title Interactions
```typescript
// The scrollLeft reset is critical - without it, text will remain scrolled after editing
onBlur={(e) => {
  setReceiptTitle(e.currentTarget.textContent || "Today's Receipt");
  setIsTitleFocused(false);
  e.currentTarget.scrollLeft = 0; // CRITICAL: Resets scroll position
}}

// Auto-scrolling during typing - essential for UX when text exceeds width
onInput={(e) => {
  // CRITICAL: Ensures cursor stays visible at end of text while typing
  const el = e.currentTarget;
  el.scrollLeft = el.scrollWidth;
}}

// Spellcheck toggling - must be synchronized with focus state
useEffect(() => {
  if (titleContentRef.current) {
    titleContentRef.current.spellcheck = isTitleFocused; // CRITICAL: Only enable spellcheck when focused
  }
}, [isTitleFocused]);
```

##### Event Propagation Control
```typescript
// Card interaction handler - uses specific className checking for compatibility
handleCardInteractions(e) {
  // CRITICAL: Convert className to string safely (handles both string and object class names)
  const classNameStr = typeof target.className === 'string' 
    ? target.className 
    : String(target.className);
  
  // CRITICAL: Uses indexOf instead of includes for better browser compatibility
  if ((classNameStr.indexOf('card') >= 0 && classNameStr.indexOf('editable') === -1) || 
      classNameStr.indexOf('card-header') >= 0 || 
      classNameStr.indexOf('store-with-date') >= 0) {
    
    e.preventDefault(); // CRITICAL: Prevents unwanted focus events
    
    if (titleContentRef.current && isTitleFocused) {
      titleContentRef.current.blur(); // CRITICAL: Blurs title if it's focused
    }
    
    e.stopPropagation(); // CRITICAL: Prevents event bubbling
  }
}
```

##### CSS Containment Patterns
```css
/* CRITICAL: These transitions make UI feel responsive and smooth */
.store-name {
  transition: background-color 0.2s, box-shadow 0.2s, border 0.2s, max-width 0.3s ease;
}

/* CRITICAL: Overflow handling for text that's too long */
.editable-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* CRITICAL: Changes overflow behavior when focused to allow scrolling */
.store-name.focused .editable-title {
  text-overflow: clip;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}

/* CRITICAL: Hides scrollbar in webkit browsers while maintaining functionality */
.store-name.focused .editable-title::-webkit-scrollbar {
  display: none;
}
```

<a id="listitem-edge-cases"></a>
#### Edge Cases

##### Text Overflow in Editable Title

```typescript
// Problem: Long titles exceed container width
// Solution:
// 1. When not focused: text-overflow: ellipsis shows "..."
// 2. When focused: overflow-x: auto allows scrolling
// 3. Auto-scroll to end on input
// 4. Reset scroll position on blur
```

**WARNING:** Without this implementation, long titles would either be cut off or break the layout.

<a id="cardcontent"></a>
### CardContent Component
[↑ Back to Table of Contents](#toc)

The CardContent component displays the list of purchased items and calculation details, with editable values for prices, discounts, and totals. It uses a separate CSS module file (`CardContent.module.css`) for styling.

<a id="cardcontent-structure"></a>
#### Structure

- `.cardContent` - Main container
  - `.cardList` - List of purchased items
    - `.contentRow` - Individual item row
      - `.qtyItem` - Left side with quantity and name
        - `.qtyFrame` - Quantity display
          - `.qtyFrameText` - Quantity value
          - `.qtyFrameMultiplier` - "x" symbol (if quantity > 1)
        - `.itemFrame` - Item name (editable)
          - `.itemFrameText` - The actual editable text
      - `.values` - Right side with price and discount
        - `.priceFrame` - Price container (editable)
          - `.priceCurrency` - Currency symbol
          - `.priceValue` - Editable price value
        - `.discountFrame` - Discount container (editable)
          - `.discountMinus` - Minus symbol
          - `.discountCurrency` - Currency symbol
          - `.discountValue` - Editable discount value
  - `.contentFinalRow` - Calculations section
    - `.fixedCalculations` - Labels column
      - `.subItemFrame` - Subtotal label
      - `.savingsItemFrame` - Savings label
      - `.taxItemFrame` - Tax label
    - `.values` - Values column
      - `.subtotalPriceFrame` - Subtotal (editable)
        - `.subtotalCurrency` - Currency symbol
        - `.subtotalValue` - Editable subtotal value
      - `.savingPriceFrame` - Savings (editable)
        - `.savingsMinus` - Minus symbol
        - `.savingsCurrency` - Currency symbol
        - `.savingsValue` - Editable savings value
      - `.taxPriceFrame` - Tax (editable)
        - `.taxCurrency` - Currency symbol
        - `.taxValue` - Editable tax value
  - `.cardTotal` - Total row
    - `.totalFrame` - Total label
    - `.msFrame` - Status and amount
      - `.errorFrame` - Checkmark or error icon
      - `.totalPriceFrame` - Total amount
        - `.totalCurrency` - Currency symbol
        - `.totalValue` - Total value display

<a id="cardcontent-state"></a>
#### State Management

```typescript
// UI state
const [hoveredRow, setHoveredRow] = useState<number | null>(null);
const [hoveredElement, setHoveredElement] = useState<string | null>(null);
const [hoveredSubtotal, setHoveredSubtotal] = useState<boolean>(false);
const [hoveredSavings, setHoveredSavings] = useState<boolean>(false);
const [hoveredTax, setHoveredTax] = useState<boolean>(false);

// Active element tracking
interface ActiveElement {
  type: 'item' | 'price' | 'discount' | 'subtotal' | 'savings' | 'tax' | null;
  id: number | null;
}
const [activeElement, setActiveElement] = useState<ActiveElement>({
  type: null,
  id: null
});

// Pre-edit element for hover state
const [preEditElement, setPreEditElement] = useState<ActiveElement>({
  type: null,
  id: null
});

// Mobile interaction tracking
type InteractionPhase = 'idle' | 'focused' | 'editing';
const [mobileInteractionPhase, setMobileInteractionPhase] = useState<{
  element: ActiveElement;
  phase: InteractionPhase;
}>({
  element: { type: null, id: null },
  phase: 'idle'
});

// Mobile detection
const [isMobile, setIsMobile] = useState(false);

// Content data
const [items, setItems] = useState([...]);
const [subtotal, setSubtotal] = useState(12.00);
const [savings, setSavings] = useState(10.00);
const [tax, setTax] = useState(2.00);

// Calculated total
const total = subtotal - savings + tax;

// Validation state
const [isValid, setIsValid] = useState(true);
```

<a id="cardcontent-functions"></a>
#### Key Functions

- `handleItemNameChange(id, value)` - Updates item name when edited
- `handlePriceChange(id, value)` - Updates item price when edited
- `handleDiscountChange(id, value)` - Updates item discount when edited
- `handleSubtotalChange(value)` - Updates subtotal when edited
- `handleSavingsChange(value)` - Updates savings amount when edited
- `handleTaxChange(value)` - Updates tax amount when edited
- `handleContainerClick(e, type, id, className)` - Handles click events on container elements, positioning cursor properly in editable text elements
- `focusElement(type, id, className, wasClickOnText)` - Manages focus sequence and cursor positioning for editable fields
- `isEditable(type, id)` - Helper function that determines if a specific field should be editable
- `addLog(message)` - Adds timestamped logs to the debug interface for development
- `handleNumericInput(e)` - Reusable handler for real-time filtering of numeric inputs
- `handleNumericBlur(e, fieldType, itemId)` - Reusable handler for processing numeric field values on blur
- `restoreDOMIntegrity(container, className, value)` - Maintains DOM structure after editing numeric fields
- `getClassNameForField(fieldType)` - Helper to get the appropriate CSS class name for different field types

<a id="cardcontent-css"></a>
#### CSS Classes

The component uses a separate CSS module file (`CardContent.module.css`) that defines all styling:

- Basic Structure Classes:
  - `.cardContent` - Main container with flexbox column layout
  - `.cardList` - Scrollable container for list items with overflow handling
  - `.contentRow` - Individual item row with flexbox row layout
  - `.contentFinalRow` - Row container for calculations (subtotal, savings, tax)
  - `.cardTotal` - Container for the final total amount

- Interactive Elements:
  - `.itemFrame`, `.priceFrame`, `.discountFrame` - Editable field containers
  - `.itemFrameText`, `.priceValue`, `.discountValue` - Actual editable elements
  - `.subtotalPriceFrame`, `.savingPriceFrame`, `.taxPriceFrame` - Calculation fields

- Interactive States:
  - `.hovered` - Applied to elements when hovered (desktop only)
  - `.focused` - Applied to the currently active editable element
  - `.mobileFocused` - First-tap state for mobile (highlight only)
  - `.mobileEditing` - Second-tap state for mobile (with editing active)

- Text Overflow Handling:
  - Base state uses `text-overflow: ellipsis` for clean appearance
  - Focused state uses `overflow-x: auto` for horizontal scrolling

- Responsive Design:
  - Media queries for tablet (`max-width: 768px`)
  - Media queries for mobile (`max-width: 480px`)
  - Special handling for touch devices with `@media (hover: none)`

- Debug Interface:
  - `.debugLogs` - Container for development logs
  - `.logHeader` - Header with title and copy button
  - `.copyLogsBtn` - Button to copy logs to clipboard
  - `.logEntry` - Individual log message

<a id="cardcontent-critical"></a>
#### Critical Implementation Details

##### Mobile Two-Tap Interaction Pattern
```typescript
// CRITICAL: The mobile interaction system uses a two-tap pattern
// First tap highlights element, second tap activates editing
if (isMobile) {
  const currentPhase = mobileInteractionPhase.phase;
  const isCurrentElement = 
    mobileInteractionPhase.element.type === type && 
    mobileInteractionPhase.element.id === id;
                             
  if (currentPhase === 'idle' || !isCurrentElement) {
    // CRITICAL: First tap - just highlight the element
    setMobileInteractionPhase({ 
      element: { type, id }, 
      phase: 'focused' 
    });
    return;
  }
  
  if (currentPhase === 'focused' && isCurrentElement) {
    // CRITICAL: Second tap - activate editing mode
    setMobileInteractionPhase({ 
      element: { type, id }, 
      phase: 'editing' 
    });
    
    // CRITICAL: Position cursor appropriately
    if (textElement) {
      textElement.contentEditable = 'true';
      textElement.focus();
      
      // Position cursor based on tap location
      const range = document.createRange();
      range.selectNodeContents(textElement);
      range.collapse(false);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
}
```

##### Focus Management with Delayed Execution
```typescript
// CRITICAL: Separates state update from DOM manipulation
const focusElement = (type, id, className, wasClickOnText) => {
  // First set the active element state
  setActiveElement({ type, id });
  
  // CRITICAL: Using setTimeout ensures React has updated the DOM
  // with the new contentEditable state before focusing
  setTimeout(() => {
    // Find elements using data attributes for reliability
    const container = document.querySelector(
      id !== null 
        ? `[data-type="${type}"][data-id="${id}"]` 
        : `[data-type="${type}"]`
    );
    
    // CRITICAL: Find element by className with CSS modules compatibility
    const elements = container.getElementsByClassName(className);
    const textElement = elements.length > 0 ? elements[0] : null;
    
    // Focus and position cursor
    textElement.focus();
    
    // CRITICAL: Only position cursor at end if not clicked directly on text
    if (!wasClickOnText) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textElement);
      range.collapse(false); // Position at end
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, 0);
};
```

##### Single Active Element Management
```typescript
// CRITICAL: The ActiveElement interface ensures only one element is editable at a time
interface ActiveElement {
  type: 'item' | 'price' | 'discount' | 'subtotal' | 'savings' | 'tax' | null;
  id: number | null; // For row-specific elements like items, prices, discounts
}

// CRITICAL: When setting a new active element, this causes previous element to lose focus
<div 
  onClick={() => setActiveElement({ type: 'price', id: item.id })}
  onFocus={() => setActiveElement({ type: 'price', id: item.id })}
>
  {/* ... */}
</div>

// CRITICAL: Keyboard handling for accessibility
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === 'Escape') {
    e.preventDefault(); // CRITICAL: Prevents new line insertion on Enter
    e.currentTarget.blur(); // CRITICAL: Unfocuses element
  }
}}
```

##### Number Formatting
```typescript
// CRITICAL: All numerical values must display with 2 decimal places
{item.price.toFixed(2)}

// CRITICAL: When editing prices, ensure proper number conversion
const handlePriceChange = (id: number, value: string) => {
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) { // CRITICAL: Only update if valid number
    setItems(items.map(item => 
      item.id === id ? { ...item, price: numValue } : item
    ));
  }
};
```

##### Numeric Input Filtering and Validation
```typescript
// CRITICAL: Reusable handler for real-time numeric input filtering
const handleNumericInput = (e: React.FormEvent<HTMLSpanElement>) => {
  // Get current text
  const el = e.currentTarget;
  const currentText = el.textContent || '';
  
  // Store selection for restoration
  const selection = window.getSelection();
  const cursorPosition = selection?.focusOffset || 0;
  
  // Filter out non-numeric characters
  const validChars = /^-?\d*\.?\d*$/;
  if (!validChars.test(currentText)) {
    // Remove invalid characters
    const filteredText = currentText
      .replace(/[^\d.-]/g, '')
      .replace(/\.+/g, '.')
      .replace(/^([^-]*)(-+)(.*)$/, '$1$3')
      .replace(/^-+/, '-');
      
    addLog(`Filtering: "${currentText}" → "${filteredText}"`);
    
    // Update content
    el.textContent = filteredText;
    
    // Restore cursor position (adjusted for removed characters)
    const newPosition = Math.min(cursorPosition, filteredText.length);
    if (selection && el.firstChild) {
      const range = document.createRange();
      range.setStart(el.firstChild, newPosition);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  // Always perform auto-scroll
  el.scrollLeft = el.scrollWidth;
}
```

##### DOM Integrity Restoration
```typescript
// CRITICAL: Ensures DOM structure is maintained after editing
const restoreDOMIntegrity = (
  container: HTMLElement,
  className: string,
  value: string
) => {
  // Find if the element still exists
  const elements = container.getElementsByClassName(className);
  
  if (elements.length === 0) {
    // If not, the DOM structure is broken - recreate it
    addLog(`Restoring DOM structure for ${className}`);
    
    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Create a new element with the correct class
    const newElement = document.createElement('span');
    newElement.className = className;
    newElement.textContent = value;
    
    // Add it back to container
    container.appendChild(newElement);
    
    return newElement;
  } else {
    // Element exists, just update content
    const element = elements[0] as HTMLElement;
    element.textContent = value;
    return element;
  }
}
```

<a id="cardcontent-edge-cases"></a>
#### Edge Cases

##### Numerical Value Validation and Formatting
```typescript
// Problem: User could enter invalid data, non-numbers, or experience DOM structure issues
// Solution:
// 1. Filter input in real-time with regex to allow only valid numeric characters
// 2. Parse input with parseFloat() on blur
// 3. Check for NaN before updating state
// 4. Always format display values with toFixed(2)
// 5. Default to original value if input is invalid
// 6. Restore DOM structure if needed with restoreDOMIntegrity function
```

**WARNING:** Without this robust validation and DOM restoration, invalid inputs could cause calculation errors, display issues, or render fields non-editable after the first edit.

<a id="datepicker"></a>
### DatePickerCalendar Component
[↑ Back to Table of Contents](#toc)

The DatePickerCalendar component provides date selection functionality with month navigation and adaptive positioning.

<a id="datepicker-structure"></a>
#### Structure

- `.date-picker-calendar` - Main container
  - `.date-select-calendar` - Date display and toggle
    - `.date-display` - Current date text
    - `.dropdown-icon` - Dropdown arrow
  - `.calendar-container` - Calendar dropdown (when open)
    - `.calendar-month-header` - Month navigation
      - `.month-nav-button` - Previous month
      - `.calendar-month-label` - Current month/year
      - `.month-nav-button` - Next month
    - `.calendar-content` - Days grid
      - `.weekday-header` - Day abbreviations (M-S)
      - `.calendar-days` - Grid of clickable days

<a id="datepicker-state"></a>
#### State Management

```typescript
// Current view state
const [currentViewMonth, setCurrentViewMonth] = useState(() => new Date(selectedDate));
const [dropdownPosition, setDropdownPosition] = useState({
  top: 'calc(100% + 4px)',
  left: '0',
  right: 'auto',
  bottom: 'auto'
});
const [isMobile, setIsMobile] = useState(false);

// Refs
const dropdownRef = useRef<HTMLDivElement>(null);
```

<a id="datepicker-functions"></a>
#### Key Functions

- `formatDate(date)` - Formats date as "MMM D, YYYY"
- `navigateMonth(increment, e)` - Changes the month view without selecting a date
- `generateDaysWithStyles()` - Creates the calendar day grid with styling
- `getOptimalVerticalPosition()` - Determines best position for dropdown
- `handleOutsideClick(event)` - Closes calendar when clicking outside

<a id="datepicker-css"></a>
#### CSS Classes

- `.date-picker-calendar` - Main container
- `.date-select-calendar` - Clickable date display that toggles the calendar
- `.calendar-container` - Dropdown calendar with month navigation and days grid
- `.calendar-month-header` - Contains month navigation buttons and current month
- `.weekday-header` - Row of day abbreviations (M, T, W, etc.)
- `.calendar-days` - Grid of clickable day numbers

<a id="datepicker-critical"></a>
#### Critical Implementation Details

##### Dropdown Positioning Logic
```typescript
// CRITICAL: Calculates optimal dropdown position based on viewport constraints
useEffect(() => {
  if (isOpen && containerRef.current && dropdownRef.current) {
    // Get dimensions
    const containerRect = containerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // CRITICAL: Calculate space in all directions
    const spaceBelow = viewportHeight - containerRect.bottom;
    const spaceAbove = containerRect.top;
    
    // CRITICAL: Check for overflow conditions
    const sufficientBelow = spaceBelow >= dropdownRect.height;
    const sufficientAbove = spaceAbove >= dropdownRect.height;
    
    // CRITICAL: Set position based on available space
    if (!sufficientBelow && sufficientAbove) {
      // Position above
    } else if (!sufficientBelow && !sufficientAbove) {
      // Not enough space - find best position
    }
    
    // CRITICAL: Handle height adjustment after position is set
    // Using setTimeout ensures DOM is updated before measuring
    if (!sufficientBelow && !sufficientAbove) {
      setTimeout(() => {
        if (dropdownRef.current) {
          const maxHeight = Math.max(spaceBelow, spaceAbove, viewportHeight * 0.7);
          dropdownRef.current.style.maxHeight = `${maxHeight - 16}px`;
          dropdownRef.current.style.overflowY = 'auto';
        }
      }, 0);
    }
  }
}, [isOpen, containerRef, isMobile]);
```

##### Day Generation Logic
```typescript
// CRITICAL: Generates all 42 days (6 weeks) for the calendar
// This ensures consistent grid layout regardless of month
const generateDaysWithStyles = () => {
  // CRITICAL: First day adjustment for week starting on Monday
  let firstDayOfWeek = firstDay.getDay() - 1;
  if (firstDayOfWeek < 0) firstDayOfWeek = 6; // Sunday becomes 6
  
  // CRITICAL: Previous month days to fill first row
  for (let i = 0; i < firstDayOfWeek; i++) {
    const day = prevMonthLastDate - firstDayOfWeek + i + 1;
    // Generate with faded styling...
  }
  
  // CRITICAL: Current month days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    // Generate with normal/selected styling...
  }
  
  // CRITICAL: Calculate how many next month days needed to fill grid
  const totalCells = 42; // 6 rows × 7 days
  const filledCells = firstDayOfWeek + lastDay.getDate();
  const nextMonthDays = totalCells - filledCells;
  
  // CRITICAL: Next month days to fill remaining grid
  for (let day = 1; day <= nextMonthDays; day++) {
    // Generate with faded styling...
  }
}
```

<a id="datepicker-edge-cases"></a>
#### Edge Cases

##### Dropdown Positioning at Screen Edges

```typescript
// Problem: Dropdown may appear partially off-screen
// Solution:
// 1. Check for leftOverflow and rightOverflow
// 2. If both edges constrained, center in viewport
// 3. If one edge constrained, align to that edge
// 4. Add buffer space (4px) from viewport edges
```

**WARNING:** Without these calculations, dropdowns could become inaccessible when opened near screen edges.

##### Limited Vertical Space for Dropdowns

```typescript
// Problem: Not enough space above or below for dropdown
// Solution:
// 1. Check available space in both directions
// 2. Position in direction with more space
// 3. If neither has enough space, calculate max available height
// 4. Apply maxHeight and make scrollable
```

**WARNING:** Without this handling, dropdowns could extend beyond viewport and become partially inaccessible.

<a id="currency"></a>
## Currency Data Integration
[↑ Back to Table of Contents](#toc)

The receipt scanner integrates with a comprehensive currency database defined in `currency-data.ts`.

### Currency Data Structure
```typescript
interface CurrencyItem {
  DisplayCountry: string;
  CurrencyCode: string;
  DisplayCountry_CurrencyCode: string;
  DisplayCurrencySymbol: string;
  SymbolPosition: number; // 0: symbol before number, 1: symbol after number
  Country: string;
  CurrencySymbol: string;
}
```

### Currency Utility Functions
```typescript
// Find currency by code (e.g., "USD")
function getCurrencyByCode(code: string): CurrencyItem | undefined

// Find currency by symbol (e.g., "$")
function getCurrencyBySymbol(symbol: string): CurrencyItem | undefined

// Format amount with correct currency symbol placement
function formatCurrency(amount: number, currencyCode: string): string
```

### Currency Selection and Display Flow

1. User selects a currency from the dropdown in ListItem component
2. ListItem stores both:
   - `selectedCurrencyIdentifier` (string) - For UI display and selection tracking
   - `selectedCurrency` (CurrencyItem) - Complete currency object with symbol and position info
3. The currency object is passed to CardContent as a prop
4. CardContent uses the currency information to:
   - Display the correct currency symbol (`DisplayCurrencySymbol`)
   - Position the symbol correctly based on `SymbolPosition`:
     - `0` = Symbol before number (e.g., $100.00)
     - `1` = Symbol after number (e.g., 100.00€)

### Default Currency Mechanism

The application implements a robust default currency mechanism to ensure consistent display:

1. **Initial Selection**: ListItem initializes with USD by default:
   ```typescript
   const [selectedCurrency, setSelectedCurrency] = useState<CurrencyItem>(
     CURRENCY_DATA.find(c => c.DisplayCountry_CurrencyCode === "United States (USD)") || CURRENCY_DATA[0]
   );
   ```

2. **Fallback Strategy**: CardContent has its own fallback if no currency prop is received:
   ```typescript
   const defaultCurrency = {
     DisplayCountry: "United States",
     CurrencyCode: "USD",
     DisplayCurrencySymbol: "$",
     SymbolPosition: 0,
     Country: "United States of America",
     CurrencySymbol: "$"
   };
   
   const currentCurrency = currency || defaultCurrency;
   ```

3. **Double Safety Net**: The fallback design ensures that even if there's an issue with the currency prop passing or if the selected currency can't be found in the data, the UI will still display correctly with a default symbol and position.

### Dynamic Currency Symbol Rendering

Each numerical field has conditional rendering based on the currency's symbol position:

```jsx
{currentCurrency.SymbolPosition === 0 ? (
  // Currency symbol before number (default)
  <>
    <span className="currencySymbol">{currentCurrency.DisplayCurrencySymbol}</span>
    <span className="value">{amount.toFixed(2)}</span>
  </>
) : (
  // Currency symbol after number
  <>
    <span className="value">{amount.toFixed(2)}</span>
    <span className="currencySymbol">{currentCurrency.DisplayCurrencySymbol}</span>
  </>
)}
```

### DOM Structure Preservation for Currency Changes

The `restoreDOMIntegrity` function has been enhanced to handle different currency symbol positions:

1. When a numerical field blurs, the function checks if the DOM structure is intact
2. If reconstruction is needed, it rebuilds the DOM structure based on:
   - The field type (price, discount, subtotal, etc.)
   - The current currency's symbol position
   - Special characteristics (like minus signs for discounts/savings)
3. This ensures the proper structure is maintained even after editing

### Formatting for Display

```typescript
// Always format with two decimal places for consistency
{item.price.toFixed(2)}
{subtotal.toFixed(2)}
{savings.toFixed(2)}
{tax.toFixed(2)}
{total.toFixed(2)}

// Custom currency formatting based on currency settings
function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) return `${amount}`;
  
  return currency.SymbolPosition === 0 
    ? `${currency.DisplayCurrencySymbol}${amount.toFixed(2)}`
    : `${amount.toFixed(2)}${currency.DisplayCurrencySymbol}`;
}
```

<a id="cross-component"></a>
## Cross-Component Interactions
[↑ Back to Table of Contents](#toc)

This section highlights non-obvious dependencies where changing one part of the code could break seemingly unrelated functionality.

### Focus Management Chain

```
1. User clicks on editable element
2. onClick handler sets activeElement state
3. useState setter triggers re-render
4. contentEditable becomes true for the target element
5. CSS class with 'focused' is applied
6. Focus styling (border, shadow) appears
7. Element becomes editable
8. Clicking elsewhere:
   a. Document click handler detects outside click
   b. OR another element's onClick sets a different activeElement
   c. Previous element is no longer active
   d. onBlur handler fires
   e. Changes are saved
   f. Focus styling is removed
```

**WARNING:** Breaking any link in this chain will cause editable elements to either get stuck in edit mode or fail to become editable.

### Dropdown Positioning Dependencies

```
1. User clicks to open dropdown (date picker or currency)
2. useState setter changes isOpen state
3. useEffect triggered on isOpen change
4. DOM measurements taken with getBoundingClientRect()
5. Calculations determine optimal position
6. Position state updated
7. Inline styles applied to dropdown
8. setTimeout runs after render to adjust height if needed
```

**WARNING:** This multi-step process ensures dropdowns appear in optimal positions and remain within viewport. Breaking any step could cause dropdowns to appear off-screen or with incorrect dimensions.

### Event Propagation Controls

```
ListItem's handleCardInteractions() → checks for specific class names → conditionally calls preventDefault() and stopPropagation()
```

**WARNING:** This prevents clicks on the card background from triggering unwanted focus events. Removing these controls would cause dropdowns to remain open when clicking elsewhere on the card.

<a id="responsive"></a>
## Responsive Design
[↑ Back to Table of Contents](#toc)

### Media Query Breakpoints

```css
/* Desktop (default) */
/* No media query - base styles apply */

/* Tablet */
@media (max-width: 768px) {
  .card {
    padding: 15px 8px 20px;
  }
  
  .store-name {
    max-width: 160px; /* Wider on tablet */
  }
  
  /* Calendar adjustments */
  .calendar-container {
    width: 328px; /* Larger calendar */
  }
  
  .calendar-days div {
    width: 44px;
    height: 44px; /* Larger touch targets */
  }
}

/* Mobile */
@media (max-width: 480px) {
  .card {
    padding: 12px 6px 16px;
    min-height: 320px;
  }
  
  .store-name {
    max-width: calc(100% - 145px); /* Dynamic width based on container */
  }
  
  .currency-select-combobox {
    display: none; /* Hide currency selector on mobile */
  }
}

/* Very small screens */
@media (max-width: 359px) {
  .calendar-container {
    width: calc(100vw - 32px); /* Full-width minus margins */
  }
}
```

### Dynamic Sizing Rules

1. **Text elements:**
   - No fixed widths when possible
   - text-overflow: ellipsis for truncation
   - Dynamic max-width calculations

2. **Containers:**
   - Percentage-based widths when appropriate
   - min-height and max-height constraints
   - Flex grow/shrink properties for proper distribution

3. **Interactive elements:**
   - Larger touch targets on mobile (44px minimum)
   - Adequate spacing between clickable elements
   - Visible focus states for accessibility

<a id="decisions"></a>
## Implementation Decisions
[↑ Back to Table of Contents](#toc)

This section explains non-obvious technical decisions.

### Using DOM Refs with Explicit Manipulation

**Choices:**
- Direct DOM manipulation via refs (scrollLeft, spellcheck, etc.)
- Explicit event handling (preventDefault, stopPropagation)

**Reasoning:**
1. Some behaviors (auto-scrolling text input) aren't achievable with pure React state
2. Performance optimization for smooth interactions
3. Proper cleanup of event listeners in useEffect return functions

### Class Name Checking with indexOf

**Choice:** Using `indexOf('className') >= 0` instead of `includes('className')`

**Reasoning:**
1. Better backward compatibility with older browsers
2. Handles both string and object class names safely
3. More consistent behavior across different React environments

### setTimeout for Height Adjustments

**Choice:** Using `setTimeout(() => {...}, 0)` for dropdown height adjustments

**Reasoning:**
1. Ensures DOM is fully updated before measuring
2. Prevents layout thrashing from multiple forced reflows
3. Allows for smoother transitions when adjusting heights

### CSS-in-JSX Pattern

**Choice:** Using `<style jsx>{...}</style>` instead of external CSS or CSS-in-JS libraries

**Reasoning:**
1. Component-scoped styling eliminates class name conflicts
2. Better runtime performance than many CSS-in-JS solutions
3. Allows for dynamic style generation based on component state
4. Keeps styles co-located with the components they affect

### Complex Calendar Grid Generation

**Choice:** Always generating 42 days (6 weeks) for calendar

**Reasoning:**
1. Consistent grid layout regardless of month
2. Prevents layout shifts when navigating between months
3. Allows for selecting dates from previous/next months
4. Matches standard calendar visual expectations

<a id="index"></a>
## Component Index
[↑ Back to Table of Contents](#toc)

### ListItem Component
- [Structure](#listitem-structure)
- [State Management](#listitem-state)
- [Key Functions](#listitem-functions)
- [CSS Classes](#listitem-css)
- [Critical Implementation](#listitem-critical)
- [Edge Cases](#listitem-edge-cases)

### CardContent Component
- [Structure](#cardcontent-structure)
- [State Management](#cardcontent-state)
- [Key Functions](#cardcontent-functions)
- [CSS Classes](#cardcontent-css)
- [Critical Implementation](#cardcontent-critical)
- [Edge Cases](#cardcontent-edge-cases)

### DatePickerCalendar Component
- [Structure](#datepicker-structure)
- [State Management](#datepicker-state)
- [Key Functions](#datepicker-functions)
- [CSS Classes](#datepicker-css)
- [Critical Implementation](#datepicker-critical)
- [Edge Cases](#datepicker-edge-cases)

### Other Topics
- [Component Hierarchy](#component-hierarchy)
- [Currency Integration](#currency)
- [Cross-Component Interactions](#cross-component)
- [Responsive Design](#responsive)
- [Implementation Decisions](#decisions) 