import { CurrencyItem } from '../../constants/currency-data';
import styles from '../../styles/CardContent.module.css';
import compStyles from '../../styles/Components.module.css';

// Default currency fallback
export const defaultCurrency: CurrencyItem = {
  DisplayCountry: "United States",
  CurrencyCode: "USD",
  DisplayCountry_CurrencyCode: "United States (USD)",
  DisplayCurrencySymbol: "$",
  SymbolPosition: 0,
  Country: "United States of America",
  CurrencySymbol: "$"
};

// Helper to get class name for each field type
export const getClassNameForField = (fieldType: string): string => {
  switch (fieldType) {
    case 'price': return styles.priceValue;
    case 'discount': return styles.discountValue;
    case 'subtotal': return styles.subtotalValue;
    case 'savings': return styles.savingsValue;
    case 'tax': return styles.taxValue;
    case 'item': return styles.itemFrameText;
    default: return '';
  }
};

// Get CSS class for a field's container
export const getContainerClassForField = (fieldType: string): string => {
  switch (fieldType) {
    case 'price': return styles.priceFrame;
    case 'discount': return styles.discountFrame;
    case 'subtotal': return styles.subtotalPriceFrame;
    case 'savings': return styles.savingPriceFrame;
    case 'tax': return styles.taxPriceFrame;
    case 'item': return styles.itemFrame;
    default: return '';
  }
};

// Get CSS class for a field's currency symbol
export const getCurrencyClassForField = (fieldType: string): string => {
  switch (fieldType) {
    case 'price': return styles.priceCurrency;
    case 'discount': return styles.discountCurrency;
    case 'subtotal': return styles.subtotalCurrency;
    case 'savings': return styles.savingsCurrency;
    case 'tax': return styles.taxCurrency;
    default: return '';
  }
};

// DOM manipulation to restore integrity after editing
export const restoreDOMIntegrity = (
  container: HTMLElement,
  className: string,
  value: string,
  currentCurrency: CurrencyItem
): HTMLElement => {
  // Find if the element still exists
  const elements = container.getElementsByClassName(className);
  
  if (elements.length === 0) {
    // If not, the DOM structure is broken - recreate it
    
    // Clear container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Determine field type to handle currency position correctly
    const fieldType = container.getAttribute('data-type') || '';
    
    // Recreate the elements based on currency position and field type
    if (fieldType === 'price' || fieldType === 'discount' || 
        fieldType === 'subtotal' || fieldType === 'savings' || 
        fieldType === 'tax') {
      
      // Add minus sign for discount and savings frames
      if ((fieldType === 'discount' || fieldType === 'savings')) {
        const minusElement = document.createElement('span');
        minusElement.className = fieldType === 'discount' ? 
          `${styles.discountMinus} ${compStyles.bodyReceiptH2}` : 
          `${styles.savingsMinus} ${compStyles.bodyReceiptH1}`;
        minusElement.textContent = '-';
        container.appendChild(minusElement);
      }
      
      // Create currency symbol and value elements based on position
      if (currentCurrency.SymbolPosition === 0) {
        // Symbol before value
        const symbolElement = document.createElement('span');
        symbolElement.className = `${getCurrencyClassForField(fieldType)} ${
          fieldType === 'discount' ? compStyles.bodyReceiptH2 : compStyles.bodyReceiptH1
        }`;
        symbolElement.textContent = currentCurrency.DisplayCurrencySymbol;
        container.appendChild(symbolElement);
        
        const valueElement = document.createElement('span');
        valueElement.className = className;
        valueElement.textContent = value;
        container.appendChild(valueElement);
        
        // Return the value element (which is what we'll want to focus)
        return container.getElementsByClassName(className)[0] as HTMLElement;
      } else {
        // Value before symbol
        const valueElement = document.createElement('span');
        valueElement.className = className;
        valueElement.textContent = value;
        container.appendChild(valueElement);
        
        const symbolElement = document.createElement('span');
        symbolElement.className = `${getCurrencyClassForField(fieldType)} ${
          fieldType === 'discount' ? compStyles.bodyReceiptH2 : compStyles.bodyReceiptH1
        }`;
        symbolElement.textContent = currentCurrency.DisplayCurrencySymbol;
        container.appendChild(symbolElement);
        
        // Return the value element (which is what we'll want to focus)
        return container.getElementsByClassName(className)[0] as HTMLElement;
      }
    } else {
      // For non-currency elements, just create a simple element
      const newElement = document.createElement('span');
      newElement.className = className;
      newElement.textContent = value;
      container.appendChild(newElement);
      return newElement;
    }
  } else {
    // Element exists, just update content
    const element = elements[0] as HTMLElement;
    element.textContent = value;
    return element;
  }
};

// Format date for UI
export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

// Check if device is mobile
export const checkMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth < 768;
};

// Create timestamp for logs
export const createTimestamp = (): string => {
  return new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
};

// Safely copy text to clipboard
export const copyToClipboard = (text: string, callback?: (success: boolean) => void): void => {
  // Try to use the Clipboard API with fallback for older browsers
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    // Modern browsers with Clipboard API
    navigator.clipboard.writeText(text)
      .then(() => {
        if (callback) callback(true);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        if (callback) callback(false);
      });
  } else {
    // Fallback for older browsers
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';  // Avoid scrolling to bottom
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Execute the copy command
      const successful = document.execCommand('copy');
      
      // Remove the temporary element
      document.body.removeChild(textArea);
      
      if (callback) callback(successful);
    } catch (err) {
      console.error('Failed to copy with fallback: ', err);
      if (callback) callback(false);
    }
  }
};

// Calculate dynamic class names for editable elements
export const getEditableClassNames = (
  styles: Record<string, string>,
  baseClass: string,
  isHovered: boolean,
  isActive: boolean,
  isMobileFocused: boolean,
  isMobileEditing: boolean
): string => {
  return `
    ${baseClass} 
    ${isHovered ? styles.hovered : ''} 
    ${isActive ? styles.focused : ''}
    ${isMobileFocused ? styles.mobileFocused : ''}
    ${isMobileEditing ? styles.mobileEditing : ''}
  `;
};

// Generate quantity options for dropdown (1-99)
export const generateQuantityOptions = (): number[] => {
  const options: number[] = [];
  for (let i = 1; i <= 99; i++) {
    options.push(i);
  }
  return options;
};

// Calculate optimal position for quantity dropdown
export const calculateQuantityDropdownPosition = (
  containerRef: React.RefObject<HTMLDivElement>,
  dropdownRef: React.RefObject<HTMLDivElement>
): React.CSSProperties => {
  if (!containerRef.current || !dropdownRef.current) {
    return {
      top: 'calc(100% + 4px)',
      left: '0',
      maxHeight: '200px',
      zIndex: 1000 // Match the CSS z-index
    };
  }
  
  const containerRect = containerRef.current.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const isMobile = window.innerWidth <= 768; // Detect mobile viewport
  
  // Determine appropriate max height and width based on device
  const maxHeight = isMobile ? Math.min(300, viewportHeight * 0.5) : 200;
  const width = isMobile ? Math.min(200, viewportWidth * 0.6) : 'auto';
  
  // Default positioning (below the element)
  const position: React.CSSProperties = {
    position: 'fixed', // Use fixed instead of absolute to avoid overflow clipping
    zIndex: 1000, // Match the CSS z-index
    maxHeight: `${maxHeight}px`,
    width: width
  };
  
  // Calculate position based on the element's position in the viewport
  position.left = `${containerRect.left}px`;
  position.top = `${containerRect.bottom + 4}px`;
  
  // Calculate available spaces
  const spaceBelow = viewportHeight - containerRect.bottom;
  const spaceAbove = containerRect.top;
  
  // Determine if dropdown should appear above instead of below
  if (spaceBelow < maxHeight && spaceAbove > spaceBelow) {
    position.top = `${containerRect.top - 4 - maxHeight}px`;
  }
  
  // Adjust for horizontal overflow
  // Use actual width for better positioning
  const dropdownWidth = isMobile ? 200 : 120; // Approximate dropdown width
  const rightEdge = containerRect.left + dropdownWidth;
  
  if (rightEdge > viewportWidth) {
    position.left = `${Math.max(0, viewportWidth - dropdownWidth - 10)}px`;
  }
  
  // For mobile, center the dropdown if it would overflow on both sides
  if (isMobile && containerRect.left < 20 && rightEdge > viewportWidth - 20) {
    const leftPosition = Math.max(10, (viewportWidth - dropdownWidth) / 2);
    position.left = `${leftPosition}px`;
  }
  
  return position;
};

// Sample data for the component
export const sampleItems = [
  { 
    id: 1, 
    name: "Wireless Headphones", 
    quantity: 1, 
    price: 14.99, 
    discount: 3.00 
  },
  { 
    id: 2, 
    name: "Notebook Set", 
    quantity: 5, 
    price: 150.00, 
    discount: 3.00 
  }
]; 