# Numerical Fields Validation and Formatting

## Overview
This document outlines the requirements and implementation plan for enforcing proper validation and formatting on all numerical input fields in the Receipt Scanner application.

## Affected Components
- Price values in item rows
- Discount values in item rows
- Subtotal field
- Savings field
- Tax field

## Validation Rules

### Input Restrictions
- **Allowed characters**: Only numbers 0-9 and a single decimal point
- **Disallowed characters**: Letters, special characters, multiple decimal points
- **Maximum length**: Maximum of 11 digits total (including digits on both sides of decimal)

### Default Values
- If a field is emptied (all characters deleted), value reverts to "0.00" on exit/blur
- If field contains only zeros (e.g., "0", "00", "000"), value reverts to "0.00" on exit/blur
- Financial values cannot be null or empty

### Formatting Requirements
- All numeric values must display exactly 2 decimal places
- Format must be applied immediately when leaving a field (on blur)
- Ensure consistent display across all currency values

## Implementation Steps

1. **Create Utility Functions**
   - Implement numeric input validation function
   - Implement currency formatting function
   - Implement zero detection function

2. **Input Validation During Typing**
   - Prevent non-numeric characters during input
   - Allow only one decimal point
   - Enforce maximum digit limit

3. **Blur/Save Handling**
   - Apply formatting rules
   - Handle empty or zero-only input
   - Save formatted value

4. **Keyboard Event Handling**
   - Allow navigation keys (arrows, tab)
   - Allow edit keys (backspace, delete)
   - Block all other non-numeric keys

5. **Apply Consistently**
   - Update all numerical field implementations
   - Ensure consistent behavior across components

## Pseudocode

### Input Validation Function
```
function validateNumericInput(event):
  // Get current input value
  currentValue = event.target.innerText
  // Get key being pressed
  key = event.key
  
  // Allow navigation and editing keys
  if key in [ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Backspace, Delete, Tab]:
    return true
  
  // Allow only one decimal point
  if key == '.':
    if currentValue.includes('.'):
      event.preventDefault()
      return false
    return true
  
  // Allow only digits
  if key not in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
    event.preventDefault()
    return false
  
  // Check total length (excluding decimal point)
  digitCount = currentValue.replace('.', '').length
  if digitCount >= 11:
    event.preventDefault()
    return false
  
  return true
```

### Format and Save Function
```
function formatAndSaveValue(value, saveCallback, itemId = null):
  // Remove any non-numeric characters except decimal
  cleanValue = value.replace(/[^\d.]/g, '')
  
  // Handle empty or zero-only input
  if cleanValue == '' || /^0*$/.test(cleanValue) || /^0*\.0*$/.test(cleanValue):
    formattedValue = "0.00"
    numericValue = 0.00
  else:
    // Parse to number
    numericValue = parseFloat(cleanValue)
    
    // Handle NaN
    if isNaN(numericValue):
      numericValue = 0.00
    
    // Format to 2 decimal places
    formattedValue = numericValue.toFixed(2)
  
  // Call appropriate save function
  if itemId is not null:
    saveCallback(itemId, numericValue)
  else:
    saveCallback(numericValue)
  
  // Return formatted value for display
  return formattedValue
```

### Numerical Field Implementation
```
<span
  className="price-value"
  contentEditable={isEditingThisField}
  suppressContentEditableWarning={true}
  onKeyDown={(e) => {
    // Validate input while typing
    if (!validateNumericInput(e)) {
      return
    }
    
    // Handle Enter or Escape
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }}
  onBlur={(e) => {
    // Format and save value
    const formattedValue = formatAndSaveValue(
      e.currentTarget.textContent || '0',
      handlePriceChange,
      item.id
    )
    
    // Clear active element
    setActiveElement({ type: null, id: null })
  }}
>
  {value.toFixed(2)}
</span>
```

## Behavioral Edge Cases

### Handling Special Inputs
- **Multiple decimal points**: Only the first decimal should be kept
- **Partial entry** (e.g., "12."): Should format to "12.00" on blur
- **Beginning with decimal** (e.g., ".5"): Should format to "0.50" on blur

### Cursor Position
- Preserve cursor position when possible after validation
- Move cursor to end of field after formatting on focus

## Testing Checklist
- Test maximum digit enforcement
- Test decimal point restrictions
- Test empty field handling
- Test zeros-only field handling
- Test formatting consistency across all fields
- Test with various input patterns (valid and invalid)
- Ensure correct behavior on different devices/browsers

## Implementation Schedule
1. Implement utility functions
2. Apply to price fields
3. Apply to discount fields
4. Apply to calculation fields (subtotal, savings, tax)
5. Test all scenarios
6. Refine and fix edge cases 