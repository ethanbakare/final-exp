# CardContent Component Implementation Documentation

## Overview
This document details the implementation of the `CardContent` component in our receipt scanner application. The component displays the list of purchased items, calculations, and totals with inline editing capabilities.

## Component Structure
The `CardContent` component is a React functional component that manages the display and editing of receipt data. It allows for inline editing of item names, prices, discounts, subtotal, savings, and tax values.

## State Management
The component uses several useState hooks to manage its state:

- `hoveredRow` (number | null): Tracks the currently hovered row by ID
- `hoveredElement` (string | null): Tracks the specific hovered element
- `hoveredSubtotal`, `hoveredSavings`, `hoveredTax` (boolean): Track hover state for calculation rows
- `uiLogs` (string[]): Stores debug logs for development and troubleshooting
- `activeElement` (ActiveElement): Tracks the currently active editable element
- `preEditElement` (ActiveElement): Tracks hovered elements for potential editing
- `isMobile` (boolean): Detects if the user is on a mobile device
- `mobileInteractionPhase` (object): Tracks the interaction phase on mobile devices (idle, focused, editing)
- `items` (array): Sample item data with properties for id, name, quantity, price, discount
- `subtotal`, `savings`, `tax` (number): Values for receipt calculations
- `isValid` (boolean): Status flag for validation

## Props
The component accepts the following props:

- `currency` (CurrencyItem, optional): The selected currency object containing symbol and position information
  - If not provided, a default USD currency object is used as fallback

## Key Functions

### Event Handlers
- `addLog(message)`: Adds timestamped logs to the debug interface
- `handleItemNameChange(id, value)`: Updates item name when edited
- `handlePriceChange(id, value)`: Updates item price when edited
- `handleDiscountChange(id, value)`: Updates item discount when edited
- `handleSubtotalChange(value)`: Updates subtotal when edited
- `handleSavingsChange(value)`: Updates savings when edited
- `handleTaxChange(value)`: Updates tax when edited
- `handleContainerClick(e, type, id, className)`: Handles click events on container elements, positioning cursor properly in editable text elements
- `focusElement(type, id, className, wasClickOnText)`: Manages focus sequence for editable elements

### Reusable Numeric Handlers
- `handleNumericInput(e)`: Centralized handler for filtering numeric input in real-time, removing non-numeric characters
- `handleNumericBlur(e, fieldType, itemId)`: Shared handler for processing numeric field values on blur
- `restoreDOMIntegrity(container, className, value)`: Utility to ensure DOM structure remains intact after editing
- `getClassNameForField(fieldType)`: Helper to retrieve the appropriate CSS class name based on field type

### Helper Functions
- `isEditable(type, id)`: Determines if a field is currently editable
- `checkMobile()`: Utility function to detect mobile devices

## UI Features

### Editable Fields
The component implements inline editing for:
- Item names
- Item prices
- Item discounts
- Subtotal amount
- Savings amount
- Tax amount

### Hover States
The component implements hover states that:
- Highlight the hovered row/element
- On desktop, pre-emptively set elements as potentially editable
- Use `preEditElement` state to track elements that could be edited on click
- Completely disabled on mobile devices for better performance

### Focus Management
The component handles focus states by:
- Visually distinguishing focused elements with CSS
- Positioning cursor at the end of text when clicking on a container
- Handling keyboard events (Enter/Escape to confirm/cancel)
- Automatically scrolling horizontally to view overflow content when editing item names

### Text Overflow Handling
The component implements a smart text overflow solution:
- When item names are not being edited:
  - Uses `white-space: nowrap` to prevent text wrapping
  - Applies `overflow: hidden` and `text-overflow: ellipsis` to show an ellipsis (...) for long text
  - Maintains clean visual appearance in the list view
- When item names are focused/being edited:
  - Switches from ellipsis to horizontal scrolling with `text-overflow: clip` and `overflow-x: auto`
  - Enables viewing and editing the entire content regardless of length
  - Auto-scrolls to the end of text when typing with `el.scrollLeft = el.scrollWidth` in the `onInput` handler
  - Resets scroll position to beginning on blur with `e.currentTarget.scrollLeft = 0`
- This dual-state approach provides optimal UX for both viewing and editing modes

### Real-time Numeric Input Validation
The component now implements a sophisticated real-time validation system for numeric inputs:

- Filters out non-numeric characters as the user types:
  - Uses regex pattern `/^-?\d*\.?\d*$/` to validate input
  - Only allows digits, a single decimal point, and a leading minus sign
  - Maintains cursor position after filtering invalid characters
  - Provides immediate feedback by removing invalid characters in real-time
  - Prevents users from entering letters or special characters in numeric fields
  - Handles special cases like duplicate decimal points or multiple minus signs

- Applies validation consistently across all numeric fields:
  - Item prices
  - Item discounts
  - Subtotal
  - Savings
  - Tax

- Separates concerns by field type:
  - Item name fields allow any characters (text)
  - All numeric fields share the same validation logic via DRY principle
  - Each field type still maintains proper state updates via dedicated handler functions

### DOM Structure Preservation
A critical new feature ensures that the DOM structure remains intact after editing:

- Problem: After editing numeric fields, the DOM structure could become corrupted
  - Text was no longer editable after first edit
  - Styling was lost
  - Focus management broke

- Solution: DOM restoration system
  - `restoreDOMIntegrity` function checks if expected DOM elements exist
  - If elements are missing, rebuilds the DOM structure correctly
  - Restores proper CSS classes ensuring styling is maintained
  - Sets appropriate text content with formatted numeric value
  - Ensures fields remain editable after multiple edit cycles
  - All numeric fields benefit from this robustness improvement

### Caret Positioning Solution
One of the key challenges addressed was proper caret positioning:
- Previously, users had to click twice to see the caret: once to focus the element, again to actually position the caret
- Solution implemented in `handleContainerClick`:
  - Detects if the click happened directly on text or elsewhere in the container
  - When clicking outside text but within container, programmatically:
    - Prevents default behavior with `e.preventDefault()` and `e.stopPropagation()`
    - Uses `textElement.focus()` to focus the editable text element
    - Creates a selection range with `document.createRange()`
    - Positions caret at the end of text with `range.selectNodeContents()` and `range.collapse(false)`
    - Applies the selection with `selection.removeAllRanges()` and `selection.addRange(range)`
  - This approach ensures users can click anywhere in the container to edit text with proper caret positioning

### Click Handling Improvements
Specific issues addressed in the click handling mechanism:
- The DOM structure was causing click events to be mishandled
- Solution uses event delegation and target detection:
  - Checks if target is the text element or one of its children with `wasClickOnText` logic
  - Only applies custom caret positioning when clicking container but not directly on text
  - Properly blurs currently active elements before focusing new ones
  - Logs all interactions for debugging

### Mobile Optimization
The component detects mobile devices and:
- Implements a two-tap interaction pattern specifically for mobile:
  - First tap enters "focused" state (highlights element with mobileFocused class)
  - Second tap enters "editing" state (activates editing with mobileEditing class)
- Uses a dedicated state object `mobileInteractionPhase` to track:
  - The current element being interacted with (type and ID)
  - The current interaction phase (idle, focused, editing)
- Applies different CSS classes for different mobile interaction phases:
  - `.mobileFocused` for first-tap highlight state
  - `.mobileEditing` for second-tap edit state
- Properly resets mobile interaction state on blur events
- Disables hover-based edit preparation on mobile
- Applies responsive styling for different screen sizes
- Implements a specific user agent check to identify mobile devices
- Falls back to screen width detection if user agent detection is unreliable

### Debug Interface
The component includes a debug interface that:
- Shows timestamped UI interaction logs with HH:MM:SS.mmm format
- Auto-scrolls to show most recent logs using a ref and useEffect
- Maintains the last 10 logs only to prevent memory/performance issues
- Is fixed to the bottom left of the screen
- Color-codes logs for better readability (using #0f0 green color)
- Logs all key user interactions including hover, focus, blur, and keyboard events
- Includes a "Copy Logs" button that copies all current log entries to clipboard
  - Positioned at the top-right of each debug log panel in a sticky header that remains visible when scrolling
  - Uses navigator.clipboard.writeText() API with document.execCommand fallback for older browsers
  - Provides visual feedback when logs are copied (brief button text change)
  - Handles copy failure gracefully with console error logging

## Cross-Component Communication

### Debug Logs System
We implemented a coordinated logging system across components:

- **ListItem Component**:
  - Has its own `uiLogs` state array and `addLog` function similar to CardContent
  - Positions its logs at the bottom right corner of the screen (vs. bottom left for CardContent)
  - Uses cyan color (#0ff) for logs to differentiate from CardContent logs (which use green)
  - Includes a "ListItem Logs" header to clearly separate log sources
  - Uses the CSS class `.debug-logs.listitem-logs` for styling
  - Includes matching "Copy Logs" button with the same functionality as CardContent

- **ui.tsx Page Component**:
  - Implements a toggle button to show/hide all debug logs
  - Uses a state variable `showDebugLogs` to control log visibility
  - Applies global styling with important flag to ensure proper toggling:
    ```jsx
    <style jsx global>{`
      .debug-logs {
        display: ${showDebugLogs ? 'block' : 'none'} !important;
      }
    `}</style>
    ```
  - Provides a clear control in the UI labeled "Show Debug Logs" or "Hide Debug Logs"

- **Log System Benefits**:
  - Allows developers to track interactions across different components
  - Color-coding makes it easy to identify which component is logging
  - Toggle functionality prevents logs from cluttering the UI during demos
  - Each component maintains its own logs but shares a consistent styling pattern
  - Logs automatically scroll to show most recent entries

## CSS Implementation
The component uses CSS-in-JSX for styling with responsive design considerations:
- Flexbox layout for positioning elements
- Media queries for responsive adjustments 
- Consistent styling for editable fields
- Visual feedback for hover/focus states
- Custom scrolling behavior for text overflow:
  - Uses `text-overflow: clip` and `overflow-x: auto` when focused
  - Hides scrollbar for cleaner UI with `::-webkit-scrollbar` and `scrollbar-width: none`
  - Resets scroll position on blur
- Mobile-specific adaptations:
  - Special classes for different mobile interaction phases (mobileFocused, mobileEditing)
  - Disables hover effects completely on touch devices
  - Uses the `@media (hover: none)` query to ensure hover styles never appear on touch devices
  - Maintains different interaction patterns for mobile vs. desktop

## Known Issues and Future Improvements
- Text overflow handling for long item names needs refinement
- Validation logic needs to be connected to real data checks
- Consider implementing tab navigation between fields
- Improve visual feedback for valid/invalid inputs

## Focus Management Implementation
The component implements a sophisticated focus management system that provides a smooth editing experience:

### Focus Manager with setTimeout
- Implements a focus manager function that uses setTimeout(0) to respect React's rendering cycle
- Properly sequences operations: blur current element → update state → render → focus new element
- Ensures contentEditable state is properly applied before focusing elements
- Uses data-attributes for reliable element selection after React renders
- Provides detailed logging of each step in the focus sequence

### Intelligent Cursor Positioning
- Detects if clicks occur directly on text vs. elsewhere in the container
- For clicks on text: preserves natural cursor positioning where the user clicked
- For clicks on container (but not on text): positions cursor at the end of content
- Enables both easy activation of editable fields and precise cursor placement
- Results in a more natural and intuitive editing experience

### Mobile vs. Desktop Interaction Patterns
- Implements different interaction patterns optimized for each device type:
  - **Desktop**: Hover states provide visual feedback before editing, single-click activates editing
  - **Mobile**: Two-tap pattern (first tap highlights, second tap activates) prevents accidental edits
- Detects mobile devices using both user agent detection and screen width
- Completely disables hover state management on mobile for better performance
- Uses distinct phases for mobile interactions:
  - **Phase 1 (idle)**: Default state, no interaction
  - **Phase 2 (focused)**: First tap highlights the element (visual feedback)
  - **Phase 3 (editing)**: Second tap activates editing mode with cursor

This implementation represents best practices for handling editable content in React applications, balancing React's declarative paradigm with the necessary imperative DOM operations for proper focus management.

## Performance Considerations
- The component minimizes re-renders by separating hover state from edit state
- Uses refs to access DOM elements directly when necessary
- Efficiently handles event propagation and defaults
- Limits the number of debug logs to prevent memory issues
- Uses conditional logging to reduce overhead in production
- Completely disables hover-related state changes on mobile devices
- Implements device-specific optimizations for touch vs. pointer interfaces
- Uses the `setTimeout(0)` pattern to properly sequence operations that require DOM updates
- Applies DRY principle to reduce code duplication in numeric handling functions
- Uses centralized logic for numeric validation, improving maintainability

## Code Organization Improvements
The recent refactoring has significantly improved the component's organization:

- **DRY Implementation**: Centralized numeric input handlers reduce code duplication
  - Before: Each numeric field had separate but identical input handling logic
  - After: Shared handlers for all numeric fields, reducing code by ~50 lines

- **Separation of Concerns**:
  - Text input handling separated from numeric input handling
  - Real-time filtering separated from blur/persistence logic
  - DOM integrity management separated from event handling

- **Dynamic Field Type Handling**:
  - `getClassNameForField` function maps field types to appropriate CSS classes
  - Future-proofed for dynamic data by using consistent patterns

- **Maintainability Benefits**:
  - Bug fixes now only needed in one place rather than for each field type
  - Adding new numeric field types requires minimal code changes
  - Consistent behavior across all numeric fields
  - Better alignment with future dynamic data requirements

This document will be updated as new features are implemented or existing ones are modified.

## Dynamic Currency Implementation

### Currency Prop Handling
- The component accepts a `currency` prop from the parent ListItem component
- A default currency (USD) is used as fallback if no currency prop is provided:
  ```typescript
  const defaultCurrency = {
    DisplayCountry: "United States",
    CurrencyCode: "USD",
    DisplayCountry_CurrencyCode: "United States (USD)",
    DisplayCurrencySymbol: "$",
    SymbolPosition: 0,
    Country: "United States of America",
    CurrencySymbol: "$"
  };
  
  const currentCurrency = currency || defaultCurrency;
  ```

### Conditional Symbol Rendering
Each numerical field implements conditional rendering based on the currency's symbol position:

```jsx
{currentCurrency.SymbolPosition === 0 ? (
  // Currency symbol before number (default)
  <>
    <span className={`${styles.priceCurrency} ${compStyles.bodyReceiptH1}`}>
      {currentCurrency.DisplayCurrencySymbol}
    </span>
    <span className={`${styles.priceValue} ${compStyles.bodyReceiptH1}`}>
      {amount.toFixed(2)}
    </span>
  </>
) : (
  // Currency symbol after number
  <>
    <span className={`${styles.priceValue} ${compStyles.bodyReceiptH1}`}>
      {amount.toFixed(2)}
    </span>
    <span className={`${styles.priceCurrency} ${compStyles.bodyReceiptH1}`}>
      {currentCurrency.DisplayCurrencySymbol}
    </span>
  </>
)}
```

This pattern is implemented in:
- Item price frames
- Item discount frames
- Subtotal frame
- Savings frame
- Tax frame
- Total frame

### DOM Restoration for Dynamic Currency
The `restoreDOMIntegrity` function has been enhanced to handle different currency positions:

1. When reconstructing a numerical field after editing, it checks the field type
2. Based on the field type and currency position, it builds the appropriate DOM structure:
   - For fields with minus signs (discounts, savings), it adds the minus sign first
   - For SymbolPosition = 0, it adds the currency symbol before the value
   - For SymbolPosition = 1, it adds the value before the currency symbol
3. This ensures proper DOM structure is maintained even with different currencies

```typescript
// Create elements based on currency position and field type
if (currentCurrency.SymbolPosition === 0) {
  // Symbol before value
  const symbolElement = document.createElement('span');
  symbolElement.className = `${styles[`${fieldType}Currency`]} ${/*...*/}`;
  symbolElement.textContent = currentCurrency.DisplayCurrencySymbol;
  container.appendChild(symbolElement);
  
  const valueElement = document.createElement('span');
  valueElement.className = className;
  valueElement.textContent = value;
  container.appendChild(valueElement);
} else {
  // Value before symbol
  const valueElement = document.createElement('span');
  valueElement.className = className;
  valueElement.textContent = value;
  container.appendChild(valueElement);
  
  const symbolElement = document.createElement('span');
  symbolElement.className = `${styles[`${fieldType}Currency`]} ${/*...*/}`;
  symbolElement.textContent = currentCurrency.DisplayCurrencySymbol;
  container.appendChild(symbolElement);
}
```

### Edge Cases and Special Considerations

#### RTL Language Support
The implementation supports Right-to-Left (RTL) languages through proper DOM structure:
- The currency position system works correctly regardless of text direction
- For SymbolPosition = 1, the currency appears after the number even in RTL contexts
- DOM structure (not CSS positioning) determines the relationship between values and symbols

#### Unicode Currency Symbols
The system handles a wide variety of Unicode currency symbols:
- Some currencies have multi-character symbols (e.g., "Fr", "Kr", "ден")
- Some have special Unicode characters (e.g., "₹", "₽", "﷼")
- The display works correctly regardless of symbol complexity
- The appropriate CSS classes ensure proper spacing and alignment

#### Preserving Numeric Input Validation
The numeric validation system works seamlessly with the dynamic currency implementation:
- Only the numerical value is editable, never the currency symbol
- Input validation is handled by the shared `handleNumericInput` function:
  ```typescript
  const handleNumericInput = (e: React.FormEvent<HTMLSpanElement>) => {
    // Get current text and cursor position
    const el = e.currentTarget;
    const currentText = el.textContent || '';
    const selection = window.getSelection();
    const cursorPosition = selection?.focusOffset || 0;
    
    // Filter out non-numeric characters
    const validChars = /^-?\d*\.?\d*$/;
    if (!validChars.test(currentText)) {
      // Remove invalid characters while preserving cursor position
      const filteredText = currentText
        .replace(/[^\d.-]/g, '')
        .replace(/\.+/g, '.')
        .replace(/^([^-]*)(-+)(.*)$/, '$1$3')
        .replace(/^-+/, '-');
        
      el.textContent = filteredText;
      
      // Restore cursor position intelligently
      const newPosition = Math.min(cursorPosition, filteredText.length);
      if (selection && el.firstChild) {
        const range = document.createRange();
        range.setStart(el.firstChild, newPosition);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // Always perform auto-scrolling for better UX
    el.scrollLeft = el.scrollWidth;
  };
  ```

#### Currency Symbol Accessibility
The implementation enhances accessibility by:
- Maintaining clear visual separation between currency symbols and values
- Using semantic HTML structure that preserves meaning for screen readers
- Applying proper CSS classes for consistent font weights and sizes
- Ensuring that only the numerical part is editable, reducing potential confusion

### Symbol Positioning Guidelines
The component follows these currency formatting guidelines:

1. For negative values (like discounts and savings):
   - Minus sign always appears first
   - Then currency symbol or number depending on SymbolPosition

2. For SymbolPosition = 0 (symbol before number):
   - Format: [minus sign (if applicable)] → [currency symbol] → [numerical value]
   - Example: -$10.00

3. For SymbolPosition = 1 (symbol after number):
   - Format: [minus sign (if applicable)] → [numerical value] → [currency symbol]
   - Example: -10.00€ 