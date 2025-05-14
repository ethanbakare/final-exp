import { useState, useRef, useEffect, useCallback } from 'react';
import { CurrencyItem } from '../../constants/currency-data';
import { ReceiptItem } from '../../types/receipt';
import { 
  getClassNameForField, 
  restoreDOMIntegrity, 
  createTimestamp, 
  checkMobile,
  sampleItems,
  calculateQuantityDropdownPosition
} from './CardContentUtils';

// Type definitions
export interface ActiveElement {
  type: 'item' | 'price' | 'discount' | 'subtotal' | 'savings' | 'tax' | null;
  id: number | null; // For row-specific elements like items, prices, discounts
}

export type InteractionPhase = 'idle' | 'focused' | 'editing';

// Hook for managing editable fields state and interactions
export function useEditableFields() {
  const [activeElement, setActiveElement] = useState<ActiveElement>({
    type: null,
    id: null
  });
  
  // Track when elements are hovered for pre-emptive contentEditable
  const [preEditElement, setPreEditElement] = useState<ActiveElement>({
    type: null,
    id: null
  });

  // Helper function to determine if a field is editable 
  const isEditable = (type: ActiveElement['type'], id: number | null) => {
    // Check if element is either active (clicked) or pre-active (hovered)
    return (
      (activeElement.type === type && activeElement.id === id) || 
      (preEditElement.type === type && preEditElement.id === id)
    );
  };

  // Focus manager function to handle the sequence of operations
  const focusElement = (
    type: ActiveElement['type'], 
    id: number | null, 
    className: string,
    wasClickOnText: boolean,
    addLog?: (message: string) => void
  ) => {
    if (addLog) addLog(`Focus manager: focusing ${type} with id=${id}, direct text click: ${wasClickOnText}`);
    
    // First set the active element state - this will make the element contentEditable in the next render
    setActiveElement({ type, id });
    
    // Clear pre-edit state
    setPreEditElement({ type: null, id: null });
    
    // Use setTimeout to give React time to update the DOM with the new contentEditable state
    setTimeout(() => {
      // Find the container element using data attributes
      const container = document.querySelector(
        id !== null 
          ? `[data-type="${type}"][data-id="${id}"]` 
          : `[data-type="${type}"]`
      );
      
      if (!container) {
        if (addLog) addLog(`Focus manager: couldn't find container for ${type} with id=${id}`);
        return;
      }
      
      // Find element by className with CSS modules
      const elements = container.getElementsByClassName(className);
      const textElement = elements.length > 0 ? elements[0] as HTMLElement : null;
      
      if (!textElement) {
        if (addLog) addLog(`Focus manager: couldn't find text element with class ${className}`);
        return;
      }
      
      // Focus the text element
      textElement.focus();
      
      // Only position cursor at the end if the click was NOT directly on the text
      if (!wasClickOnText) {
        // Position cursor at end of text
        const selection = window.getSelection();
        const range = document.createRange();
        
        // Select the text node contents
        range.selectNodeContents(textElement);
        range.collapse(false); // false = collapse to end of range
        
        // Apply the selection
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        if (addLog) addLog(`Focus manager: moved cursor to end of text`);
      } else {
        if (addLog) addLog(`Focus manager: kept cursor at natural click position`);
      }
      
      if (addLog) addLog(`Focus manager: focused ${type} with id=${id} ✓`);
    }, 0);
  };

  return {
    activeElement,
    setActiveElement,
    preEditElement,
    setPreEditElement,
    isEditable,
    focusElement
  };
}

// Hook for hover states
export function useHoverStates() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [hoveredSubtotal, setHoveredSubtotal] = useState<boolean>(false);
  const [hoveredSavings, setHoveredSavings] = useState<boolean>(false);
  const [hoveredTax, setHoveredTax] = useState<boolean>(false);

  return {
    hoveredRow,
    setHoveredRow,
    hoveredElement,
    setHoveredElement,
    hoveredSubtotal,
    setHoveredSubtotal,
    hoveredSavings,
    setHoveredSavings,
    hoveredTax,
    setHoveredTax
  };
}

// Hook for mobile interaction
export function useMobileInteraction(addLog?: (message: string) => void) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileInteractionPhase, setMobileInteractionPhase] = useState<{
    element: ActiveElement;
    phase: InteractionPhase;
  }>({
    element: { type: null, id: null },
    phase: 'idle' // 'idle', 'focused', 'editing'
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(checkMobile());
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function to reset the mobile interaction state
  const resetMobileInteraction = useCallback(() => {
    if (addLog) addLog(`Explicitly resetting mobile interaction state to idle`);
    
    // First reset the state in React
    setMobileInteractionPhase({
      element: { type: null, id: null },
      phase: 'idle'
    });
    
    // IMPORTANT: Directly remove mobile-focused classes from DOM elements
    // This ensures visual state updates even if React state changes aren't immediately reflected
    try {
      const mobileFocusedElements = document.querySelectorAll('[class*="mobileFocused"]');
      mobileFocusedElements.forEach(element => {
        const currentClasses = element.className;
        // Remove any classes containing 'mobileFocused'
        element.className = currentClasses
          .split(' ')
          .filter(className => !className.includes('mobileFocused'))
          .join(' ');
        
        if (addLog) addLog(`Manually removed mobileFocused class from element`);
      });
    } catch (error) {
      if (addLog) addLog(`Error manually removing classes: ${error}`);
    }
    
    // IMPORTANT: To ensure this change takes effect immediately, also force a re-render
    // by triggering a state update on a dummy state variable
    const forceUpdate = () => {
      // Create an identical state object to force a render
      setMobileInteractionPhase({
        element: mobileInteractionPhase.element,
        phase: mobileInteractionPhase.phase
      });
    };
    
    // Use requestAnimationFrame to ensure the DOM has a chance to update
    requestAnimationFrame(() => {
      forceUpdate();
      if (addLog) addLog('Forced component update after resetting mobile state');
    });
  }, [addLog, setMobileInteractionPhase, mobileInteractionPhase.element, mobileInteractionPhase.phase]);

  const handleMobileInteraction = (
    type: ActiveElement['type'],
    id: number | null,
    textElement: HTMLElement | null,
    wasClickOnText: boolean,
    addLog?: (message: string) => void
  ) => {
    const currentPhase = mobileInteractionPhase.phase;
    const isCurrentElement = 
      mobileInteractionPhase.element.type === type && 
      mobileInteractionPhase.element.id === id;
                             
    if (currentPhase === 'idle' || !isCurrentElement) {
      // First tap - just focus
      if (addLog) addLog(`Mobile first tap: Setting focus phase for ${type} with id=${id}`);
      setMobileInteractionPhase({ 
        element: { type, id }, 
        phase: 'focused' 
      });
      
      return false; // Indicate no editing yet
    }
    
    if (currentPhase === 'focused' && isCurrentElement) {
      // Second tap - activate editing
      if (addLog) addLog(`Mobile second tap: Activating edit phase for ${type} with id=${id}`);
      setMobileInteractionPhase({ 
        element: { type, id }, 
        phase: 'editing' 
      });
      
      // Force contentEditable to be true for text element
      if (textElement) {
        textElement.contentEditable = 'true';
        textElement.focus();
        
        // Position cursor based on where clicked
        if (!wasClickOnText) {
          // Position at end if clicked outside text
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
      
      return true; // Indicate editing is activated
    }
    
    return false; // Default case
  };

  return {
    isMobile,
    mobileInteractionPhase,
    setMobileInteractionPhase,
    handleMobileInteraction,
    resetMobileInteraction
  };
}

// Hook for debugging logs
export function useDebugLogs() {
  const [uiLogs, setUiLogs] = useState<string[]>([]);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  
  // Helper function to add logs
  const addLog = (message: string) => {
    const timestamp = createTimestamp();
    setUiLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]); // Keep last 10 logs
  };
  
  // Auto-scroll logs to bottom whenever logs change
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [uiLogs]);

  return {
    uiLogs,
    setUiLogs,
    addLog,
    logsContainerRef
  };
}

// Hook for numeric fields and calculations
export function useNumericFields(
  addLog?: (message: string) => void,
  initialItems?: ReceiptItem[],
  initialSubtotal?: number,
  initialSavings?: number,
  initialTax?: number
) {
  // Transform API items format to internal format if provided
  const transformedItems = initialItems ? initialItems.map((item, index) => ({
    id: index,
    name: item.name,
    quantity: item.quantity || 1,
    price: item.price,
    discount: item.discount || 0,
    original_price: item.original_price
  })) : sampleItems;

  // Sample item data with initialItems as fallback
  const [items, setItems] = useState(transformedItems);
  
  // Totals data with initial values from API
  const [subtotal, setSubtotal] = useState(initialSubtotal !== undefined ? initialSubtotal : 12.00);
  const [savings, setSavings] = useState(initialSavings !== undefined ? initialSavings : 10.00);
  const [tax, setTax] = useState(initialTax !== undefined ? initialTax : 2.00);
  
  // Calculated total
  const total = subtotal - savings + tax;
  
  // Calculate validation status based on items and total
  useEffect(() => {
    // Calculate sum of items
    const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Check if calculated total roughly matches subtotal (accounting for rounding)
    const isItemTotalValid = Math.abs(itemsTotal - subtotal) < 0.02;
    
    // Update validation status
    setIsValid(isItemTotalValid);
    
    if (addLog) {
      addLog(`Validation: calculatedTotal=${total.toFixed(2)}, itemTotal=${itemsTotal.toFixed(2)}, valid=${isItemTotalValid}`);
    }
  }, [items, subtotal, savings, tax, total, addLog]);
  
  // Status (check or error) - determined by validation
  const [isValid, setIsValid] = useState(true);

  // Handle editing of item names
  const handleItemNameChange = (id: number, value: string) => {
    if (addLog) addLog(`Item name change: id=${id}, value=${value}`);
    setItems(items.map(item => 
      item.id === id ? { ...item, name: value } : item
    ));
  };
  
  // Handle editing of prices
  const handlePriceChange = (id: number, value: string) => {
    if (addLog) addLog(`Price change: id=${id}, value=${value}`);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setItems(items.map(item => 
        item.id === id ? { ...item, price: numValue } : item
      ));
    }
  };
  
  // Handle editing of discounts
  const handleDiscountChange = (id: number, value: string) => {
    if (addLog) addLog(`Discount change: id=${id}, value=${value}`);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setItems(items.map(item => 
        item.id === id ? { ...item, discount: numValue } : item
      ));
    }
  };
  
  // Handle editing of subtotal
  const handleSubtotalChange = (value: string) => {
    if (addLog) addLog(`Subtotal change: value=${value}`);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSubtotal(numValue);
    }
  };
  
  // Handle editing of savings
  const handleSavingsChange = (value: string) => {
    if (addLog) addLog(`Savings change: value=${value}`);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSavings(numValue);
    }
  };
  
  // Handle editing of tax
  const handleTaxChange = (value: string) => {
    if (addLog) addLog(`Tax change: value=${value}`);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setTax(numValue);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (id: number, value: number) => {
    if (addLog) addLog(`Quantity change: id=${id}, value=${value}`);
    if (value >= 1 && value <= 99) {
      setItems(items.map(item => 
        item.id === id ? { ...item, quantity: value } : item
      ));
    }
  };

  // Shared handler for real-time numeric input filtering
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
        
      if (addLog) addLog(`Filtering: "${currentText}" → "${filteredText}"`);
      
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
  };

  // Reusable blur handler for numeric fields
  const handleNumericBlur = (
    e: React.FocusEvent<HTMLSpanElement>,
    fieldType: 'price' | 'discount' | 'subtotal' | 'savings' | 'tax',
    currentCurrency: CurrencyItem,
    itemId?: number,
    setActiveElement?: (element: ActiveElement) => void,
    setPreEditElement?: (element: ActiveElement) => void,
    setMobileInteractionPhase?: (phase: {
      element: ActiveElement;
      phase: InteractionPhase;
    }) => void,
    isMobile?: boolean
  ) => {
    // Log the blur event
    const logPrefix = itemId !== undefined ? `${fieldType} value blur: id=${itemId}` : `${fieldType} value blur`;
    if (addLog) addLog(logPrefix);
    
    // Get input value
    const inputValue = e.currentTarget.textContent || '';
    if (addLog) addLog(`Original input: "${inputValue}"`);
    
    // Parse the input
    const numValue = parseFloat(inputValue);
    
    // Find container element (parent of the input field)
    const container = e.currentTarget.parentElement;
    
    if (!container) {
      if (addLog) addLog('Error: Could not find container element');
      return;
    }
    
    // Determine original value and update handler based on field type
    let originalValue: number;
    let updater: (value: string) => void;
    
    if (fieldType === 'price' && itemId !== undefined) {
      const item = items.find(i => i.id === itemId);
      originalValue = item?.price || 0;
      updater = (val) => handlePriceChange(itemId, val);
    } else if (fieldType === 'discount' && itemId !== undefined) {
      const item = items.find(i => i.id === itemId);
      originalValue = item?.discount || 0;
      updater = (val) => handleDiscountChange(itemId, val);
    } else if (fieldType === 'subtotal') {
      originalValue = subtotal;
      updater = handleSubtotalChange;
    } else if (fieldType === 'savings') {
      originalValue = savings;
      updater = handleSavingsChange;
    } else if (fieldType === 'tax') {
      originalValue = tax;
      updater = handleTaxChange;
    } else {
      // Fallback (shouldn't happen)
      originalValue = 0;
      updater = () => {};
    }
    
    if (!isNaN(numValue)) {
      // Update state
      updater(numValue.toString());
      
      // Get appropriate class name based on field type
      const className = getClassNameForField(fieldType);
      
      // Restore DOM structure and set value
      restoreDOMIntegrity(container, className, numValue.toFixed(2), currentCurrency);
    } else {
      // Invalid number - reset to original value
      if (addLog) addLog(`Invalid input - resetting to original value`);
      const className = getClassNameForField(fieldType);
      restoreDOMIntegrity(container, className, originalValue.toFixed(2), currentCurrency);
    }
    
    // Reset interactive states
    if (setActiveElement) setActiveElement({ type: null, id: null });
    if (setPreEditElement) setPreEditElement({ type: null, id: null });
    
    // Reset mobile state
    if (isMobile && setMobileInteractionPhase) {
      if (addLog) addLog(`Resetting mobile interaction phase to idle`);
      setMobileInteractionPhase({
        element: { type: null, id: null },
        phase: 'idle'
      });
    }
  };

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
    handleItemNameChange,
    handlePriceChange,
    handleDiscountChange,
    handleSubtotalChange,
    handleSavingsChange,
    handleTaxChange,
    handleQuantityChange,
    handleNumericInput,
    handleNumericBlur
  };
}

// Hook for clipboard operations
export function useClipboard(addLog?: (message: string) => void) {
  const copyLogs = (logs: string[]) => {
    const logsText = logs.join('\n');
    
    // Try to use the Clipboard API with fallback for older browsers
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      // Modern browsers with Clipboard API
      navigator.clipboard.writeText(logsText)
        .then(() => {
          const btn = document.querySelector('.copyLogsBtn') as HTMLButtonElement;
          if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
              btn.textContent = originalText;
            }, 1000);
          }
          if (addLog) addLog('Logs copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy logs: ', err);
          if (addLog) addLog(`Failed to copy logs: ${err.message}`);
        });
    } else {
      // Fallback for older browsers...
      if (addLog) addLog('Using fallback clipboard method');
      try {
        // Create temporary textarea
        const textArea = document.createElement('textarea');
        textArea.value = logsText;
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          const btn = document.querySelector('.copyLogsBtn') as HTMLButtonElement;
          if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
              btn.textContent = originalText;
            }, 1000);
          }
          if (addLog) addLog('Logs copied to clipboard (fallback method)');
        } else {
          if (addLog) addLog('Failed to copy logs (fallback method failed)');
        }
      } catch (err) {
        console.error('Failed to copy logs with fallback: ', err);
        if (addLog) addLog('Failed to copy logs: fallback method failed');
      }
    }
  };

  return {
    copyLogs
  };
}

// Hook for quantity dropdown
export function useQuantityDropdown(addLog?: (message: string) => void) {
  const [activeQuantityId, setActiveQuantityId] = useState<number | null>(null);
  const quantityDropdownRef = useRef<HTMLDivElement>(null);
  const quantityContainerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<React.CSSProperties>({});
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (activeQuantityId === null) return;
    
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        quantityDropdownRef.current && 
        !quantityDropdownRef.current.contains(e.target as Node) &&
        quantityContainerRef.current && 
        !quantityContainerRef.current.contains(e.target as Node)
      ) {
        if (addLog) addLog(`Closing quantity dropdown from outside click`);
        setActiveQuantityId(null);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeQuantityId, addLog]);
  
  // Update dropdown position when opened
  useEffect(() => {
    if (activeQuantityId === null) return;
    
    if (addLog) addLog(`Positioning quantity dropdown for item ${activeQuantityId}`);
    
    // Fix the linter error by ensuring the refs are not null
    if (quantityContainerRef.current && quantityDropdownRef.current) {
      setDropdownPosition(
        calculateQuantityDropdownPosition(
          quantityContainerRef as React.RefObject<HTMLDivElement>, 
          quantityDropdownRef as React.RefObject<HTMLDivElement>
        )
      );
    } else {
      // Default positioning if refs are not ready
      setDropdownPosition({
        top: 'calc(100% + 4px)',
        left: '0',
        maxHeight: '200px'
      });
    }
  }, [activeQuantityId, addLog]);
  
  // Handle keyboard navigation for dropdown
  useEffect(() => {
    if (activeQuantityId === null || !quantityDropdownRef.current) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (addLog) addLog(`Closing quantity dropdown with Escape key`);
        setActiveQuantityId(null);
        e.preventDefault();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeQuantityId, addLog]);
  
  return {
    activeQuantityId,
    setActiveQuantityId,
    quantityDropdownRef,
    quantityContainerRef,
    dropdownPosition
  };
} 