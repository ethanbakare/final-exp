# CardContent Component Implementation Documentation

## Overview
This document details the implementation of the `CardContent` component in our receipt scanner application. The component displays the list of purchased items, calculations, and totals with inline editing capabilities.

## Component Architecture
The CardContent component has been refactored into a modular three-file architecture to improve maintainability and code organization:

1. **CardContent.tsx** - Main component file with JSX rendering and UI logic
2. **CardContentHooks.ts** - Custom hooks for state management and business logic
3. **CardContentUtils.ts** - Pure utility functions and constants

This separation of concerns improves code maintainability, makes testing easier, and follows React best practices. The component uses React hooks for state management and implements complex UI interactions.

## Key Features
The component implements the following features:

1. **Editable Fields**
   - Item names are editable
   - Prices and discounts are editable with numeric validation
   - Subtotal, savings, and tax are editable with numeric validation
   - Quantity selection via unified dropdown interface for all devices

2. **Responsive Design**
   - Desktop: Hover states preview interactivity
   - Mobile: Two-tap pattern for focusing and editing
   - Optimized for various screen sizes

3. **Accessibility**
   - Keyboard navigation
   - ARIA attributes
   - Focus management

4. **Performance Optimizations**
   - DOM manipulation is minimized
   - Renders are optimized

## Interaction Patterns

### Desktop Editing Flow
1. **Hover** - Element shows hover state
2. **Click** - Element becomes focused and editable
3. **Edit** - User modifies content (with validation in real-time for numeric fields)
4. **Blur/Enter/Escape** - Changes are applied and element returns to normal state

### Mobile Editing Flow
1. **First Tap** - Element shows focused state
2. **Second Tap** - Element becomes editable
3. **Edit** - User modifies content
4. **Blur/Enter/Escape** - Changes are applied and element returns to normal state

### Quantity Editing Flow
1. **Click/Tap on Quantity** - Opens dropdown menu with numbers 1-99 on both desktop and mobile
2. **Select Value** - Choose a quantity between 1-99 from the dropdown list
3. **Click Away/Select** - Changes are applied and dropdown closes

## Detailed Implementation

### Main CardContent Component 
The main component in `CardContent.tsx` orchestrates the rendering and handles user interactions. It leverages several custom hooks from `CardContentHooks.ts` to manage various aspects of state and behavior.

### Key Hooks
1. **useEditableFields** - Manages which fields are currently editable
2. **useHoverStates** - Manages hover states for interactive elements
3. **useMobileInteraction** - Handles mobile-specific interaction patterns
4. **useNumericFields** - Manages numerical values and validation
5. **useQuantityDropdown** - Manages the quantity selection dropdown functionality
6. **useClipboard** - Handles clipboard operations for debugging
7. **useDebugLogs** - Manages debug information display (development only)

### Event Handlers
1. **handleContainerClick** - Central click handler for editable elements
2. **handleItemNameBlur** - Processes item name edits on blur
3. **handleNumericFieldBlur** - Processes numeric edits with validation
4. **handleQuantityClick** - Manages quantity dropdown interactions
5. **handleMobileQuantityChange** - Handles mobile-specific quantity updates

### DOM Structure

#### Item Row
    ```jsx
<div className={styles.contentRow}>
  <div className={styles.qtyItem}>
    {/* Quantity element with dropdown */}
    <div className={styles.qtyFrame}>...</div>
    
    {/* Item name */}
    <div className={styles.itemFrame}>...</div>
  </div>
  
  <div className={styles.values}>
    {/* Price */}
    <div className={styles.priceFrame}>...</div>
    
    {/* Discount */}
    <div className={styles.discountFrame}>...</div>
  </div>
</div>
```

#### Calculation Row
```jsx
<div className={styles.contentFinalRow}>
  {/* Labels */}
  <div className={styles.fixedCalculations}>
    <div className={styles.subItemFrame}>Subtotal</div>
    <div className={styles.savingsItemFrame}>Savings</div>
    <div className={styles.taxItemFrame}>Tax (Sales)</div>
  </div>
  
  {/* Calculation values */}
  <div className={styles.finalValues}>
    <div className={styles.subtotalPriceFrame}>...</div>
    <div className={styles.savingPriceFrame}>...</div>
    <div className={styles.taxPriceFrame}>...</div>
  </div>
</div>
```

#### Quantity Dropdown Implementation
The quantity element supports a unified interaction model across all devices:

- Click/tap on quantity shows a dropdown with numbers 1-99
- Numbers are displayed in a scrollable container with enhanced touch targets on mobile
- Current value is highlighted
- Click/tap on a number selects it and closes the dropdown

The implementation uses the `useQuantityDropdown` hook for state management:
- `activeQuantityId` tracks which dropdown is open
- `quantityDropdownRef` and `quantityContainerRef` manage positioning with React refs
- `dropdownPosition` calculates optimal dropdown placement in the viewport

Key implementation details:
- Uses `position: fixed` positioning to ensure the dropdown is always visible regardless of parent overflow constraints
- High z-index (1000) to prevent any clipping or layering issues
- Responsive design with larger touch targets and font sizes on mobile
- Dynamic positioning based on available viewport space

## CSS Architecture
The component uses CSS Modules for style encapsulation. Styles are organized in `CardContent.module.css` with the following structure:

1. **Layout Containers**
   - `.cardContent` - Main container
   - `.cardList` - List of items
   - `.contentRow` - Individual item row

2. **Item Components**
   - `.qtyItem` - Container for quantity and item
   - `.qtyFrame` - Quantity indicator/selector
   - `.itemFrame` - Item name
   - `.values` - Container for price and discount
   - `.priceFrame` - Price container
   - `.discountFrame` - Discount container

3. **Quantity Dropdown**
   - `.quantityDropdown` - Container for dropdown menu
   - `.quantityList` - Scrollable list of options
   - `.quantityItem` - Individual number option
   - `.mobileQuantityOverlay` - Mobile overlay container
   - `.mobileQuantityContainer` - Mobile number picker container

4. **Interaction States**
   - `.hovered` - Mouse hover state
   - `.focused` - Focus/active state
   - `.mobileFocused` - First tap state on mobile
   - `.mobileEditing` - Second tap state on mobile
   - `.selected` - Selected state for dropdown items

All colors use CSS variables from the main theme to maintain consistency across the application.

## Implementation Notes

### Quantity Display Logic
- When quantity is 1, only a dash (-) is shown
- When quantity is >1, the value is shown with an "x" suffix

### Dropdown Positioning
The dropdown position is calculated dynamically to ensure it's always visible within the viewport:
- Appears below the quantity by default
- Flips to above if there's not enough space below
- Adjusts horizontally if it would overflow the viewport

### Mobile Considerations
- Uses a modal-like overlay for quantity selection
- Leverages native number input for better mobile UX
- Prevents scroll-through with proper event handling

## Edge Cases

1. **Overflow Handling**
   - Long item names have ellipsis with horizontal scroll on focus
   - Numeric values have proper alignment for currency symbols

2. **Validation**
   - Numeric inputs filter non-numeric characters in real-time
   - Formats to proper decimal places on blur
   - Quantity is restricted to 1-99 range

3. **Accessibility**
   - Keyboard navigation through tab, arrow keys, enter and escape
   - ARIA roles and labels for screen readers
   - Focus trapping in dropdowns for keyboard users

4. **Cross-Browser**
   - ContentEditable behavior is normalized across browsers
   - Mobile detection handles iOS/Android differences
   - Proper CSS prefixing for cross-browser compatibility

4. **Z-index and Overflow Handling**
   - Dropdown uses fixed positioning to avoid parent overflow constraints
   - High z-index ensures dropdown remains visible above other elements
   - Proper stacking context established for parent containers
   - Dynamic position calculations prevent dropdowns from extending beyond viewport