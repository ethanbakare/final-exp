import React, { useState, useRef, useEffect } from 'react';
import compStyles from '../../styles/Components.module.css';
import styles from '../../styles/CardContent.module.css';
import { CurrencyItem } from '../../constants/currency-data';


/* ----------------------------------------
   ----------------------------------------
   COMPONENT INTERFACE - CardContent Props
   ----------------------------------------
   ---------------------------------------- */
interface CardContentProps {
  // This interface will be populated with props as needed in the future
  currency?: CurrencyItem; // Optional currency prop with default fallback
}

/* ----------------------------------------
   ----------------------------------------
   MAIN COMPONENT - Card Content
   ----------------------------------------
   Displays the list of purchased items and totals
   ---------------------------------------- */
const CardContent: React.FC<CardContentProps> = ({ currency }) => {
  /* ----------------------------------------
     STATE MANAGEMENT - Component State
     ---------------------------------------- */
  // Use default USD currency if none provided
  const defaultCurrency = {
    DisplayCountry: "United States",
    CurrencyCode: "USD",
    DisplayCountry_CurrencyCode: "United States (USD)",
    DisplayCurrencySymbol: "$",
    SymbolPosition: 0,
    Country: "United States of America",
    CurrencySymbol: "$"
  };
  
  // Ensure we always have a valid currency object
  const currentCurrency = currency || defaultCurrency;

  // Track which elements have hover state
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [hoveredSubtotal, setHoveredSubtotal] = useState<boolean>(false);
  const [hoveredSavings, setHoveredSavings] = useState<boolean>(false);
  const [hoveredTax, setHoveredTax] = useState<boolean>(false);
  
  // UI logs for debugging
  const [uiLogs, setUiLogs] = useState<string[]>([]);
  
  // Helper function to add logs
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
    setUiLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]); // Keep last 10 logs
  };
  
  // Define active element type for tracking focused/editing states
  interface ActiveElement {
    type: 'item' | 'price' | 'discount' | 'subtotal' | 'savings' | 'tax' | null;
    id: number | null; // For row-specific elements like items, prices, discounts
  }
  
  // Mobile interaction phases
  type InteractionPhase = 'idle' | 'focused' | 'editing';
  
  // Add a mobile interaction state
  const [mobileInteractionPhase, setMobileInteractionPhase] = useState<{
    element: ActiveElement;
    phase: InteractionPhase;
  }>({
    element: { type: null, id: null },
    phase: 'idle' // 'idle', 'focused', 'editing'
  });
  
  // Single state to track the currently active editable element
  const [activeElement, setActiveElement] = useState<ActiveElement>({
    type: null,
    id: null
  });
  
  // Track when elements are hovered for pre-emptive contentEditable
  const [preEditElement, setPreEditElement] = useState<ActiveElement>({
    type: null,
    id: null
  });

  // Add this helper function to determine if a field is editable 
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
    className: string, // Changed from textSelector to className
    wasClickOnText: boolean
  ) => {
    addLog(`Focus manager: focusing ${type} with id=${id}, direct text click: ${wasClickOnText}`);
    
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
        addLog(`Focus manager: couldn't find container for ${type} with id=${id}`);
        return;
      }
      
      // CRITICAL: Find element by className with CSS modules
      const elements = container.getElementsByClassName(className);
      const textElement = elements.length > 0 ? elements[0] as HTMLElement : null;
      
      if (!textElement) {
        addLog(`Focus manager: couldn't find text element with class ${className}`);
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
        
        addLog(`Focus manager: moved cursor to end of text`);
      } else {
        addLog(`Focus manager: kept cursor at natural click position`);
      }
      
      addLog(`Focus manager: focused ${type} with id=${id} ✓`);
    }, 0);
  };

  // Add this utility to detect mobile devices
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      addLog(`Device detected: ${isMobileDevice ? 'Mobile' : 'Desktop'}`);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Sample item data - in a real app, this would come from props
  const [items, setItems] = useState([
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
  ]);
  
  // Totals data
  const [subtotal, setSubtotal] = useState(12.00);
  const [savings, setSavings] = useState(10.00);
  const [tax, setTax] = useState(2.00);
  
  // Calculated total
  const total = subtotal - savings + tax;
  
  // Status (check or error) - in a real app would be determined by validation
  const [isValid] = useState(true);

  /* ----------------------------------------
     EVENT HANDLERS - Component Interactions
     ---------------------------------------- */
  // Handle editing of item names
  const handleItemNameChange = (id: number, value: string) => {
    addLog(`Item name change: id=${id}, value=${value}`);
    setItems(items.map(item => 
      item.id === id ? { ...item, name: value } : item
    ));
  };
  
  // Handle editing of prices
  const handlePriceChange = (id: number, value: string) => {
    addLog(`Price change: id=${id}, value=${value}`);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setItems(items.map(item => 
        item.id === id ? { ...item, price: numValue } : item
      ));
    }
  };
  
  // Handle editing of subtotal
  const handleSubtotalChange = (value: string) => {
    addLog(`Subtotal change: value=${value}`);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSubtotal(numValue);
    }
  };
  
  // Handle editing of savings
  const handleSavingsChange = (value: string) => {
    addLog(`Savings change: value=${value}`);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSavings(numValue);
    }
  };
  
  // Handle editing of tax
  const handleTaxChange = (value: string) => {
    addLog(`Tax change: value=${value}`);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setTax(numValue);
    }
  };

  // Handle editing of discounts
  const handleDiscountChange = (id: number, value: string) => {
    addLog(`Discount change: id=${id}, value=${value}`);
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setItems(items.map(item => 
        item.id === id ? { ...item, discount: numValue } : item
      ));
    }
  };

  // Update the handleContainerClick function
  const handleContainerClick = (
    e: React.MouseEvent,
    type: ActiveElement['type'],
    id: number | null,
    className: string // Changed from textSelector to className
  ) => {
    // Get coordinates and element information
    const container = e.currentTarget;
    
    // CRITICAL: Use getElementsByClassName instead of querySelector with CSS modules
    const elements = container.getElementsByClassName(className);
    const textElement = elements.length > 0 ? elements[0] as HTMLElement : null;
    
    if (!textElement) {
      addLog(`Could not find text element with class: ${className}`);
      return;
    }
    
    // Check if click happened on the text itself by checking if target is the text element
    // or one of its children
    const target = e.target as Node;
    const wasClickOnText = textElement === target || (textElement.contains && textElement.contains(target));
    
    addLog(`Click on ${type}: id=${id}, directly on text: ${wasClickOnText}`);

    // Prevent default behaviors
    e.preventDefault();
    e.stopPropagation();
    
    if (isMobile) {
      const currentPhase = mobileInteractionPhase.phase;
      const isCurrentElement = 
        mobileInteractionPhase.element.type === type && 
        mobileInteractionPhase.element.id === id;
                               
      if (currentPhase === 'idle' || !isCurrentElement) {
        // First tap - just focus
        addLog(`Mobile first tap: Setting focus phase for ${type} with id=${id}`);
        setActiveElement({ type, id });
        setPreEditElement({ type, id });
        setMobileInteractionPhase({ 
          element: { type, id }, 
          phase: 'focused' 
        });
        
        // Blur any currently focused element first
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        
        return;
      }
      
      if (currentPhase === 'focused' && isCurrentElement) {
        // Second tap - activate editing
        addLog(`Mobile second tap: Activating edit phase for ${type} with id=${id}`);
        setMobileInteractionPhase({ 
          element: { type, id }, 
          phase: 'editing' 
        });
        
        // Force contentEditable to be true for text element
        if (textElement) {
          if (textElement instanceof HTMLElement) {
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
        }
        
        return;
      }
    }
    
    // If there is an active element that's different from this one, blur it first
    if (activeElement.type !== null && 
        (activeElement.type !== type || activeElement.id !== id)) {
      addLog(`Blurring current active element (${activeElement.type}, ${activeElement.id}) before activating (${type}, ${id})`);
      
      // Use document.activeElement to find and blur any currently focused element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
    
    // Use the focus manager to focus this element, passing whether click was on text
    focusElement(type, id, className, wasClickOnText);
  };

  /* ----------------------------------------
     ----------------------------------------
     COMPONENT RENDER - Main JSX Structure
     ----------------------------------------
     ---------------------------------------- */
  // Add a ref for the logs container 
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Add an effect to auto-scroll logs to bottom whenever logs change
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [uiLogs]);

  // Add a cleanup function to fix DOM structure after editing
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
          symbolElement.className = `${styles[`${fieldType}Currency`]} ${
            fieldType === 'discount' ? compStyles.bodyReceiptH2 : compStyles.bodyReceiptH1
          }`;
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
          symbolElement.className = `${styles[`${fieldType}Currency`]} ${
            fieldType === 'discount' ? compStyles.bodyReceiptH2 : compStyles.bodyReceiptH1
          }`;
          symbolElement.textContent = currentCurrency.DisplayCurrencySymbol;
          container.appendChild(symbolElement);
        }
        
        // Return the value element (which is what we'll want to focus)
        return container.getElementsByClassName(className)[0] as HTMLElement;
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

  // Modify handleNumericBlur to use this restoration
  const handleNumericBlur = (
    e: React.FocusEvent<HTMLSpanElement>,
    fieldType: 'price' | 'discount' | 'subtotal' | 'savings' | 'tax',
    itemId?: number
  ) => {
    // Log the blur event
    const logPrefix = itemId !== undefined ? `${fieldType} value blur: id=${itemId}` : `${fieldType} value blur`;
    addLog(logPrefix);
    
    // Get input value
    const inputValue = e.currentTarget.textContent || '';
    addLog(`Original input: "${inputValue}"`);
    
    // Parse the input
    const numValue = parseFloat(inputValue);
    
    // Find container element (parent of the input field)
    const container = e.currentTarget.parentElement;
    
    if (!container) {
      addLog('Error: Could not find container element');
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
      restoreDOMIntegrity(container, className, numValue.toFixed(2));
    } else {
      // Invalid number - reset to original value
      addLog(`Invalid input - resetting to original value`);
      const className = getClassNameForField(fieldType);
      restoreDOMIntegrity(container, className, originalValue.toFixed(2));
    }
    
    // Reset interactive states
    setActiveElement({ type: null, id: null });
    setPreEditElement({ type: null, id: null });
    
    // Reset mobile state
    if (isMobile) {
      setMobileInteractionPhase({
        element: { type: null, id: null },
        phase: 'idle'
      });
    }
  };

  // Helper to get class name for each field type
  const getClassNameForField = (fieldType: string): string => {
    switch (fieldType) {
      case 'price': return styles.priceValue;
      case 'discount': return styles.discountValue;
      case 'subtotal': return styles.subtotalValue;
      case 'savings': return styles.savingsValue;
      case 'tax': return styles.taxValue;
      default: return '';
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
  };

  return (
    <div className={styles.cardContent}>
      {/* ----------------------------------------
          CARD LIST - Items list
          ---------------------------------------- */}
      <div className={styles.cardList}>
        {/* Individual item rows */}
        {items.map((item) => (
          <div 
            key={item.id}
            className={styles.contentRow}
            onMouseEnter={() => setHoveredRow(item.id)}
            onMouseLeave={() => setHoveredRow(null)}
          >
            {/* Quantity and Item */}
            <div className={styles.qtyItem}>
              <div className={styles.qtyFrame}>
                {item.quantity === 1 ? (
                  <span className={`${styles.qtyFrameText} ${compStyles.bodyReceiptH3} ${compStyles.secondaryH2_40}`}>-</span>
                ) : (
                  <>
                    <span className={`${styles.qtyFrameText} ${compStyles.bodyReceiptH3} ${compStyles.secondaryH2_40}`}>{item.quantity}</span>
                    <span className={`${styles.qtyFrameMultiplier} ${compStyles.bodyReceiptH3} ${compStyles.secondaryH2_40}`}>x</span>
                  </>
                )}
              </div>
              
              {/* CRITICAL: Apply conditional classes for item frame */}
              <div 
                className={`
                  ${styles.itemFrame} 
                  ${hoveredRow === item.id && hoveredElement === `item-${item.id}` ? styles.hovered : ''} 
                  ${activeElement.type === 'item' && activeElement.id === item.id ? styles.focused : ''}
                  ${isMobile && mobileInteractionPhase.element.type === 'item' && 
                    mobileInteractionPhase.element.id === item.id && 
                    mobileInteractionPhase.phase === 'focused' ? styles.mobileFocused : ''}
                  ${isMobile && mobileInteractionPhase.element.type === 'item' && 
                    mobileInteractionPhase.element.id === item.id && 
                    mobileInteractionPhase.phase === 'editing' ? styles.mobileEditing : ''}
                `}
                data-type="item"
                data-id={item.id}
                onMouseEnter={() => {
                  if (!isMobile) {
                    setHoveredElement(`item-${item.id}`);
                    addLog(`Item frame hover: id=${item.id}`);
                    setPreEditElement({ type: 'item', id: item.id });
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile) {
                    setHoveredElement(null);
                    if (preEditElement.type === 'item' && preEditElement.id === item.id) {
                      setPreEditElement({ type: null, id: null });
                    }
                  }
                }}
                onClick={(e) => handleContainerClick(e, 'item', item.id, styles.itemFrameText)}
              >
                <span 
                  className={`${styles.itemFrameText} ${compStyles.bodyReceiptH1}`}
                  contentEditable={isEditable('item', item.id)}
                  suppressContentEditableWarning={true}
                  onInput={(e) => {
                    // For item name, we only need to handle auto-scrolling
                    // No numeric filtering here as item names can contain any characters
                    const el = e.currentTarget;
                    el.scrollLeft = el.scrollWidth;
                  }}
                  onBlur={(e) => {
                    addLog(`Item frame blur: id=${item.id}`);
                    handleItemNameChange(item.id, e.currentTarget.textContent || item.name);
                    setActiveElement({ type: null, id: null });
                    setPreEditElement({ type: null, id: null });
                    // Reset mobile interaction state on blur
                    if (isMobile) {
                      setMobileInteractionPhase({
                        element: { type: null, id: null },
                        phase: 'idle'
                      });
                    }
                    e.currentTarget.scrollLeft = 0; // Reset scroll position on blur
                  }}
                  onKeyDown={(e) => {
                    addLog(`Item keydown: key=${e.key}`);
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      addLog(`Item - preventing default for: ${e.key}`);
                      e.preventDefault();
                      addLog(`Item - blurring after: ${e.key}`);
                      e.currentTarget.blur();
                    }
                  }}
                  onFocus={() => {
                    const isCaretActive = isEditable('item', item.id);
                    addLog(`Item frame focus: id=${item.id} ${isCaretActive ? '✓CARET ACTIVE' : '✗NO CARET'}`);
                    setActiveElement({ type: 'item', id: item.id });
                    setPreEditElement({ type: null, id: null });
                  }}
                >
                  {item.name}
                </span>
              </div>
            </div>
            
            {/* Values (Price and Discount) */}
            <div className={styles.values}>
              <div 
                className={`
                  ${styles.priceFrame} 
                  ${hoveredRow === item.id && hoveredElement === `price-${item.id}` ? styles.hovered : ''} 
                  ${activeElement.type === 'price' && activeElement.id === item.id ? styles.focused : ''}
                  ${isMobile && mobileInteractionPhase.element.type === 'price' && 
                    mobileInteractionPhase.element.id === item.id && 
                    mobileInteractionPhase.phase === 'focused' ? styles.mobileFocused : ''}
                  ${isMobile && mobileInteractionPhase.element.type === 'price' && 
                    mobileInteractionPhase.element.id === item.id && 
                    mobileInteractionPhase.phase === 'editing' ? styles.mobileEditing : ''}
                `}
                data-type="price"
                data-id={item.id}
                onMouseEnter={() => {
                  if (!isMobile) {
                    setHoveredElement(`price-${item.id}`);
                    addLog(`Price frame hover: id=${item.id}`);
                    setPreEditElement({ type: 'price', id: item.id });
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile) {
                    setHoveredElement(null); 
                    if (preEditElement.type === 'price' && preEditElement.id === item.id) {
                      setPreEditElement({ type: null, id: null });
                    }
                  }
                }}
                onClick={(e) => handleContainerClick(e, 'price', item.id, styles.priceValue)}
                onFocus={() => {
                  const isCaretActive = isEditable('price', item.id);
                  addLog(`Price value focus: id=${item.id} ${isCaretActive ? '✓CARET ACTIVE' : '✗NO CARET'}`);
                  setActiveElement({ type: 'price', id: item.id });
                  setPreEditElement({ type: null, id: null });
                }}
                onBlur={(e) => handleNumericBlur(e, 'price', item.id)}
              >
                {currentCurrency.SymbolPosition === 0 ? (
                  // Currency symbol before number (default)
                  <>
                    <span className={`${styles.priceCurrency} ${compStyles.bodyReceiptH1}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                    <span 
                      className={`${styles.priceValue} ${compStyles.bodyReceiptH1}`}
                      contentEditable={isEditable('price', item.id)}
                      suppressContentEditableWarning={true}
                      onInput={(e) => handleNumericInput(e)}
                      onBlur={(e) => handleNumericBlur(e, 'price', item.id)}
                      onKeyDown={(e) => {
                        addLog(`Price keydown: key=${e.key}`);
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          addLog(`Price - preventing default for: ${e.key}`);
                          e.preventDefault();
                          addLog(`Price - blurring after: ${e.key}`);
                          e.currentTarget.blur();
                        }
                      }}
                    >
                      {activeElement.type === 'price' && activeElement.id === item.id 
                        ? item.price.toFixed(2)
                        : item.price.toFixed(2)
                      }
                    </span>
                  </>
                ) : (
                  // Currency symbol after number
                  <>
                    <span 
                      className={`${styles.priceValue} ${compStyles.bodyReceiptH1}`}
                      contentEditable={isEditable('price', item.id)}
                      suppressContentEditableWarning={true}
                      onInput={(e) => handleNumericInput(e)}
                      onBlur={(e) => handleNumericBlur(e, 'price', item.id)}
                      onKeyDown={(e) => {
                        addLog(`Price keydown: key=${e.key}`);
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          addLog(`Price - preventing default for: ${e.key}`);
                          e.preventDefault();
                          addLog(`Price - blurring after: ${e.key}`);
                          e.currentTarget.blur();
                        }
                      }}
                    >
                      {activeElement.type === 'price' && activeElement.id === item.id 
                        ? item.price.toFixed(2)
                        : item.price.toFixed(2)
                      }
                    </span>
                    <span className={`${styles.priceCurrency} ${compStyles.bodyReceiptH1}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                  </>
                )}
              </div>
              
              <div 
                className={`
                  ${styles.discountFrame} 
                  ${hoveredRow === item.id && hoveredElement === `discount-${item.id}` ? styles.hovered : ''} 
                  ${activeElement.type === 'discount' && activeElement.id === item.id ? styles.focused : ''}
                  ${isMobile && mobileInteractionPhase.element.type === 'discount' && 
                    mobileInteractionPhase.element.id === item.id && 
                    mobileInteractionPhase.phase === 'focused' ? styles.mobileFocused : ''}
                  ${isMobile && mobileInteractionPhase.element.type === 'discount' && 
                    mobileInteractionPhase.element.id === item.id && 
                    mobileInteractionPhase.phase === 'editing' ? styles.mobileEditing : ''}
                `}
                data-type="discount"
                data-id={item.id}
                onMouseEnter={() => {
                  if (!isMobile) {
                    setHoveredElement(`discount-${item.id}`);
                    addLog(`Discount frame hover: id=${item.id}`);
                    setPreEditElement({ type: 'discount', id: item.id });
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile) {
                    setHoveredElement(null);
                    if (preEditElement.type === 'discount' && preEditElement.id === item.id) {
                      setPreEditElement({ type: null, id: null });
                    }
                  }
                }}
                onFocus={() => {
                  const isCaretActive = isEditable('discount', item.id);
                  addLog(`Discount value focus: id=${item.id} ${isCaretActive ? '✓CARET ACTIVE' : '✗NO CARET'}`);
                  setActiveElement({ type: 'discount', id: item.id });
                  setPreEditElement({ type: null, id: null });
                }}
                onBlur={(e) => handleNumericBlur(e, 'discount', item.id)}
                onClick={(e) => handleContainerClick(e, 'discount', item.id, styles.discountValue)}
              >
                <span className={`${styles.discountMinus} ${compStyles.bodyReceiptH2}`}>-</span>
                {currentCurrency.SymbolPosition === 0 ? (
                  // Currency symbol before number (default)
                  <>
                    <span className={`${styles.discountCurrency} ${compStyles.bodyReceiptH2}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                    <span 
                      className={`${styles.discountValue} ${compStyles.bodyReceiptH2}`}
                      contentEditable={isEditable('discount', item.id)}
                      suppressContentEditableWarning={true}
                      onInput={(e) => handleNumericInput(e)}
                      onBlur={(e) => handleNumericBlur(e, 'discount', item.id)}
                      onKeyDown={(e) => {
                        addLog(`Discount keydown: key=${e.key}`);
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          addLog(`Discount - preventing default for: ${e.key}`);
                          e.preventDefault();
                          addLog(`Discount - blurring after: ${e.key}`);
                          e.currentTarget.blur();
                        }
                      }}
                    >
                      {activeElement.type === 'discount' && activeElement.id === item.id 
                        ? item.discount.toFixed(2)
                        : item.discount.toFixed(2)
                      }
                    </span>
                  </>
                ) : (
                  // Currency symbol after number
                  <>
                    <span 
                      className={`${styles.discountValue} ${compStyles.bodyReceiptH2}`}
                      contentEditable={isEditable('discount', item.id)}
                      suppressContentEditableWarning={true}
                      onInput={(e) => handleNumericInput(e)}
                      onBlur={(e) => handleNumericBlur(e, 'discount', item.id)}
                      onKeyDown={(e) => {
                        addLog(`Discount keydown: key=${e.key}`);
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          addLog(`Discount - preventing default for: ${e.key}`);
                          e.preventDefault();
                          addLog(`Discount - blurring after: ${e.key}`);
                          e.currentTarget.blur();
                        }
                      }}
                    >
                      {activeElement.type === 'discount' && activeElement.id === item.id 
                        ? item.discount.toFixed(2)
                        : item.discount.toFixed(2)
                      }
                    </span>
                    <span className={`${styles.discountCurrency} ${compStyles.bodyReceiptH2}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Final row with subtotal, savings, tax */}
        <div className={styles.contentFinalRow}>
          {/* Fixed calculations labels */}
          <div className={styles.fixedCalculations}>
            <div className={`${styles.subItemFrame} ${compStyles.bodyReceiptH1}`}>Subtotal</div>
            <div className={`${styles.savingsItemFrame} ${compStyles.bodyReceiptH1}`}>Savings</div>
            <div className={`${styles.taxItemFrame} ${compStyles.bodyReceiptH1}`}>Tax (Sales)</div>
          </div>
          
          {/* Values for calculations */}
          <div className={styles.values}>
            <div 
              className={`
                ${styles.subtotalPriceFrame} 
                ${hoveredSubtotal ? styles.hovered : ''} 
                ${activeElement.type === 'subtotal' ? styles.focused : ''}
                ${isMobile && mobileInteractionPhase.element.type === 'subtotal' && 
                  mobileInteractionPhase.phase === 'focused' ? styles.mobileFocused : ''}
                ${isMobile && mobileInteractionPhase.element.type === 'subtotal' && 
                  mobileInteractionPhase.phase === 'editing' ? styles.mobileEditing : ''}
              `}
              data-type="subtotal"
              onMouseEnter={() => {
                if (!isMobile) {
                  setHoveredSubtotal(true);
                  addLog(`Subtotal frame hover`);
                  setPreEditElement({ type: 'subtotal', id: null });
                }
              }}
              onMouseLeave={() => {
                if (!isMobile) {
                  setHoveredSubtotal(false);
                  if (preEditElement.type === 'subtotal') {
                    setPreEditElement({ type: null, id: null });
                  }
                }
              }}
              onFocus={() => {
                const isCaretActive = isEditable('subtotal', null);
                addLog(`Subtotal value focus ${isCaretActive ? '✓CARET ACTIVE' : '✗NO CARET'}`);
                setActiveElement({ type: 'subtotal', id: null });
                setPreEditElement({ type: null, id: null });
              }} 
              onBlur={(e) => handleNumericBlur(e, 'subtotal')}
              onClick={(e) => handleContainerClick(e, 'subtotal', null, styles.subtotalValue)}
            >
              {currentCurrency.SymbolPosition === 0 ? (
                // Currency symbol before number (default)
                <>
                  <span className={`${styles.subtotalCurrency} ${compStyles.bodyReceiptH1}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                  <span
                    className={`${styles.subtotalValue} ${compStyles.bodyReceiptH1}`}
                    contentEditable={isEditable('subtotal', null)}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleNumericInput(e)}
                    onBlur={(e) => handleNumericBlur(e, 'subtotal')}
                    onKeyDown={(e) => {
                      addLog(`Subtotal keydown: key=${e.key}`);
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        addLog(`Subtotal - preventing default for: ${e.key}`);
                        e.preventDefault();
                        addLog(`Subtotal - blurring after: ${e.key}`);
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {activeElement.type === 'subtotal' && activeElement.id === null 
                      ? subtotal.toFixed(2)
                      : subtotal.toFixed(2)
                    }
                  </span>
                </>
              ) : (
                // Currency symbol after number
                <>
                  <span
                    className={`${styles.subtotalValue} ${compStyles.bodyReceiptH1}`}
                    contentEditable={isEditable('subtotal', null)}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleNumericInput(e)}
                    onBlur={(e) => handleNumericBlur(e, 'subtotal')}
                    onKeyDown={(e) => {
                      addLog(`Subtotal keydown: key=${e.key}`);
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        addLog(`Subtotal - preventing default for: ${e.key}`);
                        e.preventDefault();
                        addLog(`Subtotal - blurring after: ${e.key}`);
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {activeElement.type === 'subtotal' && activeElement.id === null 
                      ? subtotal.toFixed(2)
                      : subtotal.toFixed(2)
                    }
                  </span>
                  <span className={`${styles.subtotalCurrency} ${compStyles.bodyReceiptH1}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                </>
              )}
            </div>
            
            <div 
              className={`
                ${styles.savingPriceFrame} 
                ${hoveredSavings ? styles.hovered : ''} 
                ${activeElement.type === 'savings' ? styles.focused : ''}
                ${isMobile && mobileInteractionPhase.element.type === 'savings' && 
                  mobileInteractionPhase.phase === 'focused' ? styles.mobileFocused : ''}
                ${isMobile && mobileInteractionPhase.element.type === 'savings' && 
                  mobileInteractionPhase.phase === 'editing' ? styles.mobileEditing : ''}
              `}
              data-type="savings"
              onMouseEnter={() => {
                if (!isMobile) {
                  setHoveredSavings(true);
                  addLog(`Savings frame hover`);
                  setPreEditElement({ type: 'savings', id: null });
                }
              }}
              onMouseLeave={() => {
                if (!isMobile) {
                  setHoveredSavings(false);
                  if (preEditElement.type === 'savings') {
                    setPreEditElement({ type: null, id: null });
                  }
                }
              }}
              onFocus={() => {
                const isCaretActive = isEditable('savings', null);
                addLog(`Savings value focus ${isCaretActive ? '✓CARET ACTIVE' : '✗NO CARET'}`);
                setActiveElement({ type: 'savings', id: null });
                setPreEditElement({ type: null, id: null });
              }}
              onBlur={(e) => handleNumericBlur(e, 'savings')}
              onClick={(e) => handleContainerClick(e, 'savings', null, styles.savingsValue)}
            >
              <span className={`${styles.savingsMinus} ${compStyles.bodyReceiptH1}`}>-</span>
              {currentCurrency.SymbolPosition === 0 ? (
                // Currency symbol before number (default)
                <>
                  <span className={`${styles.savingsCurrency} ${compStyles.bodyReceiptH1}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                  <span
                    className={`${styles.savingsValue} ${compStyles.bodyReceiptH1}`}
                    contentEditable={isEditable('savings', null)}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleNumericInput(e)}
                    onBlur={(e) => handleNumericBlur(e, 'savings')}
                    onKeyDown={(e) => {
                      addLog(`Savings keydown: key=${e.key}`);
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        addLog(`Savings - preventing default for: ${e.key}`);
                        e.preventDefault();
                        addLog(`Savings - blurring after: ${e.key}`);
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {activeElement.type === 'savings' && activeElement.id === null 
                      ? savings.toFixed(2)
                      : savings.toFixed(2)
                    }
                  </span>
                </>
              ) : (
                // Currency symbol after number
                <>
                  <span
                    className={`${styles.savingsValue} ${compStyles.bodyReceiptH1}`}
                    contentEditable={isEditable('savings', null)}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleNumericInput(e)}
                    onBlur={(e) => handleNumericBlur(e, 'savings')}
                    onKeyDown={(e) => {
                      addLog(`Savings keydown: key=${e.key}`);
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        addLog(`Savings - preventing default for: ${e.key}`);
                        e.preventDefault();
                        addLog(`Savings - blurring after: ${e.key}`);
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {activeElement.type === 'savings' && activeElement.id === null 
                      ? savings.toFixed(2)
                      : savings.toFixed(2)
                    }
                  </span>
                  <span className={`${styles.savingsCurrency} ${compStyles.bodyReceiptH1}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                </>
              )}
            </div>
            
            <div 
              className={`
                ${styles.taxPriceFrame} 
                ${hoveredTax ? styles.hovered : ''} 
                ${activeElement.type === 'tax' ? styles.focused : ''}
                ${isMobile && mobileInteractionPhase.element.type === 'tax' && 
                  mobileInteractionPhase.phase === 'focused' ? styles.mobileFocused : ''}
                ${isMobile && mobileInteractionPhase.element.type === 'tax' && 
                  mobileInteractionPhase.phase === 'editing' ? styles.mobileEditing : ''}
              `}
              data-type="tax"
              onMouseEnter={() => {
                if (!isMobile) {
                  setHoveredTax(true);
                  addLog(`Tax frame hover`);
                  setPreEditElement({ type: 'tax', id: null });
                }
              }}
              onMouseLeave={() => {
                if (!isMobile) {
                  setHoveredTax(false);
                  if (preEditElement.type === 'tax') {
                    setPreEditElement({ type: null, id: null });
                  }
                }
              }}
              onFocus={() => {
                const isCaretActive = isEditable('tax', null);
                addLog(`Tax value focus ${isCaretActive ? '✓CARET ACTIVE' : '✗NO CARET'}`);
                setActiveElement({ type: 'tax', id: null });
                setPreEditElement({ type: null, id: null });
              }}
              onBlur={(e) => handleNumericBlur(e, 'tax')}
              onClick={(e) => handleContainerClick(e, 'tax', null, styles.taxValue)}
            >
              {currentCurrency.SymbolPosition === 0 ? (
                // Currency symbol before number (default)
                <>
                  <span className={`${styles.taxCurrency} ${compStyles.bodyReceiptH1}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                  <span
                    className={`${styles.taxValue} ${compStyles.bodyReceiptH1}`}
                    contentEditable={isEditable('tax', null)}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleNumericInput(e)}
                    onBlur={(e) => handleNumericBlur(e, 'tax')}
                    onKeyDown={(e) => {
                      addLog(`Tax keydown: key=${e.key}`);
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        addLog(`Tax - preventing default for: ${e.key}`);
                        e.preventDefault();
                        addLog(`Tax - blurring after: ${e.key}`);
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {activeElement.type === 'tax' && activeElement.id === null 
                      ? tax.toFixed(2)
                      : tax.toFixed(2)
                    }
                  </span>
                </>
              ) : (
                // Currency symbol after number
                <>
                  <span
                    className={`${styles.taxValue} ${compStyles.bodyReceiptH1}`}
                    contentEditable={isEditable('tax', null)}
                    suppressContentEditableWarning={true}
                    onInput={(e) => handleNumericInput(e)}
                    onBlur={(e) => handleNumericBlur(e, 'tax')}
                    onKeyDown={(e) => {
                      addLog(`Tax keydown: key=${e.key}`);
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        addLog(`Tax - preventing default for: ${e.key}`);
                        e.preventDefault();
                        addLog(`Tax - blurring after: ${e.key}`);
                        e.currentTarget.blur();
                      }
                    }}
                  >
                    {activeElement.type === 'tax' && activeElement.id === null 
                      ? tax.toFixed(2)
                      : tax.toFixed(2)
                    }
                  </span>
                  <span className={`${styles.taxCurrency} ${compStyles.bodyReceiptH1}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* ----------------------------------------
          CARD TOTAL - Total amount and status
          ---------------------------------------- */}
      <div className={styles.cardTotal}>
        <div className={`${styles.totalFrame} ${compStyles.headerH1Semibold}`}>Total</div>
        
        <div className={styles.msFrame}>
          <div className={styles.errorFrame}>
            {isValid ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_1492_568)">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" fill="#469C3D" fillOpacity="0.7"/>
                </g>
                <defs>
                  <clipPath id="clip0_1492_568">
                    <rect width="24" height="24" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z" fill="#FD1F1F"/>
              </svg>
            )}
          </div>
          
          <div className={`${styles.totalPriceFrame} ${compStyles.primaryH1}`}>
            {currentCurrency.SymbolPosition === 0 ? (
              // Currency symbol before number (default)
              <>
                <span className={`${styles.totalCurrency} ${compStyles.headerH1Semibold}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                <span className={`${styles.totalValue} ${compStyles.headerH1Semibold}`}>{total.toFixed(2)}</span>
              </>
            ) : (
              // Currency symbol after number
              <>
                <span className={`${styles.totalValue} ${compStyles.headerH1Semibold}`}>{total.toFixed(2)}</span>
                <span className={`${styles.totalCurrency} ${compStyles.headerH1Semibold}`}>{currentCurrency.DisplayCurrencySymbol}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Debug logs display */}
      {uiLogs.length > 0 && (
        <div className={styles.debugLogs} ref={logsContainerRef}>
          <div className={styles.logHeader}>
            Debug Logs
            <button 
              className={styles.copyLogsBtn}
              onClick={() => {
                const logsText = uiLogs.join('\n');
                
                // Try to use the Clipboard API with fallback for older browsers
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                  // Modern browsers with Clipboard API
                  navigator.clipboard.writeText(logsText)
                    .then(() => {
                      const btn = document.querySelector(`.${styles.debugLogs} .${styles.copyLogsBtn}`) as HTMLButtonElement;
                      if (btn) {
                        const originalText = btn.textContent;
                        btn.textContent = 'Copied!';
                        setTimeout(() => {
                          btn.textContent = originalText;
                        }, 1000);
                      }
                      addLog('Logs copied to clipboard');
                    })
                    .catch(err => {
                      console.error('Failed to copy logs: ', err);
                      addLog(`Failed to copy logs: ${err.message}`);
                    });
                } else {
                  // Fallback for older browsers
                  try {
                    // Create a temporary textarea element
                    const textArea = document.createElement('textarea');
                    textArea.value = logsText;
                    textArea.style.position = 'fixed';  // Avoid scrolling to bottom
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    
                    // Execute the copy command
                    const successful = document.execCommand('copy');
                    
                    // Remove the temporary element
                    document.body.removeChild(textArea);
                    
                    if (successful) {
                      const btn = document.querySelector(`.${styles.debugLogs} .${styles.copyLogsBtn}`) as HTMLButtonElement;
                      if (btn) {
                        const originalText = btn.textContent;
                        btn.textContent = 'Copied!';
                        setTimeout(() => {
                          btn.textContent = originalText;
                        }, 1000);
                      }
                      addLog('Logs copied to clipboard (fallback method)');
                    } else {
                      addLog('Failed to copy logs (fallback method failed)');
                    }
                  } catch (err) {
                    console.error('Failed to copy logs with fallback: ', err);
                    addLog('Failed to copy logs: fallback method failed');
                  }
                }
              }}
            >
              Copy Logs
            </button>
          </div>
          {uiLogs.map((log, i) => (
            <div key={i} className={styles.logEntry}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardContent; 