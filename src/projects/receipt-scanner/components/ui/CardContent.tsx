import React, { useEffect, useRef } from 'react';
import compStyles from '../../styles/Components.module.css';
import styles from '../../styles/CardContent.module.css';
import { CurrencyItem } from '../../constants/currency-data';
import { 
  defaultCurrency,
  generateQuantityOptions
} from './CardContentUtils';
import {
  ActiveElement,
  useDebugLogs,
  useEditableFields,
  useHoverStates,
  useMobileInteraction,
  useNumericFields,
  useClipboard,
  useQuantityDropdown
} from './CardContentHooks';

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
     USE HOOKS - Component State Management
     ---------------------------------------- */
  // Ensure we always have a valid currency object
  const currentCurrency = currency || defaultCurrency;

  // Debug logs
  const { uiLogs, addLog, logsContainerRef } = useDebugLogs();
  
  // Card container reference for outside click detection
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Editable field states
  const { 
    activeElement, 
    setActiveElement,
    preEditElement,
    setPreEditElement,
    isEditable,
    focusElement
  } = useEditableFields();
  
  // Hover states
  const {
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
  } = useHoverStates();
  
  // Mobile interaction
  const {
    isMobile,
    mobileInteractionPhase,
    setMobileInteractionPhase,
    handleMobileInteraction
  } = useMobileInteraction();
  
  // Numeric fields and calculations
  const {
    items,
    subtotal,
    savings,
    tax,
    total,
    isValid,
    handleItemNameChange,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handlePriceChange, // Reserved for backend integration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleDiscountChange, // Reserved for backend integration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleSubtotalChange, // Reserved for backend integration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleSavingsChange, // Reserved for backend integration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleTaxChange, // Reserved for backend integration
    handleQuantityChange,
    handleNumericInput,
    handleNumericBlur
  } = useNumericFields(addLog);
  
  // Clipboard functionality
  const { copyLogs } = useClipboard(addLog);
  
  // Quantity dropdown functionality
  const {
    activeQuantityId,
    setActiveQuantityId,
    quantityDropdownRef,
    quantityContainerRef,
    dropdownPosition
  } = useQuantityDropdown(addLog);

  /* ----------------------------------------
     EVENT HANDLERS - Component Interactions
     ---------------------------------------- */
  // Update the handleContainerClick function
  const handleContainerClick = (
    e: React.MouseEvent,
    type: ActiveElement['type'],
    id: number | null,
    className: string
  ) => {
    // Get coordinates and element information
    const container = e.currentTarget;
    
    // Use getElementsByClassName instead of querySelector with CSS modules
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
      // Handle mobile two-tap pattern
      const shouldActivateEditing = handleMobileInteraction(
        type, 
        id, 
        textElement, 
        wasClickOnText, 
        addLog
      );
      
      if (!shouldActivateEditing) {
        // First tap - just focus
        setActiveElement({ type, id });
        setPreEditElement({ type, id });
        
        // Blur any currently focused element first
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        
        return;
      }
      
      // Second tap - already handled by handleMobileInteraction
        return;
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
    focusElement(type, id, className, wasClickOnText, addLog);
  };

  // Handle toggle of quantity dropdown
  const handleQuantityClick = (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    
    if (activeQuantityId === itemId) {
      addLog(`Closing quantity dropdown for item ${itemId}`);
      setActiveQuantityId(null);
    } else {
      addLog(`Opening quantity dropdown for item ${itemId}`);
      
      // Close any active element
      if (activeElement.type !== null) {
        addLog(`Blurring active element before opening quantity dropdown`);
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setActiveElement({ type: null, id: null });
        setPreEditElement({ type: null, id: null });
      }
      
      setActiveQuantityId(itemId);
    }
  };

  // Specific blur handler for item name
  const handleItemNameBlur = (e: React.FocusEvent<HTMLSpanElement>, id: number) => {
    addLog(`Item frame blur: id=${id}`);
    handleItemNameChange(id, e.currentTarget.textContent || items.find(item => item.id === id)?.name || '');
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
  };

  // Item name key event handler
  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    addLog(`Item keydown: key=${e.key}`);
    if (e.key === 'Enter' || e.key === 'Escape') {
      addLog(`Item - preventing default for: ${e.key}`);
      e.preventDefault();
      addLog(`Item - blurring after: ${e.key}`);
      e.currentTarget.blur();
    }
  };
  
  // Handle numeric fields blur
  const handleNumericFieldBlur = (
    e: React.FocusEvent<HTMLSpanElement>,
    fieldType: 'price' | 'discount' | 'subtotal' | 'savings' | 'tax',
    itemId?: number
  ) => {
    handleNumericBlur(
      e, 
      fieldType, 
      currentCurrency, 
      itemId, 
      setActiveElement, 
      setPreEditElement, 
      setMobileInteractionPhase, 
      isMobile
    );
  };
  
  // Numeric field key event handler
  const handleNumericKeyDown = (
    e: React.KeyboardEvent<HTMLSpanElement>,
    fieldType: string
  ) => {
    addLog(`${fieldType} keydown: key=${e.key}`);
    if (e.key === 'Enter' || e.key === 'Escape') {
      addLog(`${fieldType} - preventing default for: ${e.key}`);
      e.preventDefault();
      addLog(`${fieldType} - blurring after: ${e.key}`);
      e.currentTarget.blur();
    }
  };

  // Handle clicks outside editable elements on mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleDocumentClick = (e: MouseEvent) => {
      // If there's no focused element in mobile interaction state, no need to do anything
      if (mobileInteractionPhase.phase === 'idle') return;

      // Check if click was inside the card container
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        addLog(`Mobile outside click: Resetting mobile interaction state`);
        
        // Reset mobile interaction state
        setMobileInteractionPhase({
          element: { type: null, id: null },
          phase: 'idle'
        });
        
        // Reset other states as well
        setActiveElement({ type: null, id: null });
        setPreEditElement({ type: null, id: null });
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isMobile, mobileInteractionPhase.phase, addLog, setMobileInteractionPhase, 
      setActiveElement, setPreEditElement]);

  // Handle click on empty areas within the card
  const handleCardClick = (e: React.MouseEvent) => {
    if (!isMobile || mobileInteractionPhase.phase === 'idle') return;
    
    // Check if the click target has data-type attribute (interactive element)
    const target = e.target as HTMLElement;
    const isInteractiveElement = 
      target.hasAttribute('data-type') || 
      target.closest('[data-type]') !== null;
    
    // If click is not on an interactive element, reset mobile state
    if (!isInteractiveElement) {
      addLog(`Mobile click on non-interactive area: Resetting mobile interaction state`);
      
      // Reset mobile interaction state
      setMobileInteractionPhase({
        element: { type: null, id: null },
        phase: 'idle'
      });
      
      // Reset other states as well
      setActiveElement({ type: null, id: null });
      setPreEditElement({ type: null, id: null });
      
      // Directly remove mobileFocused classes for immediate visual feedback
      try {
        const mobileFocusedElements = document.querySelectorAll('[class*="mobileFocused"]');
        mobileFocusedElements.forEach(element => {
          const currentClasses = element.className;
          element.className = currentClasses
            .split(' ')
            .filter(className => !className.includes('mobileFocused'))
            .join(' ');
        });
      } catch (error) {
        addLog(`Error manually removing classes: ${error}`);
      }
    }
  };

  /* ----------------------------------------
     ----------------------------------------
     COMPONENT RENDER - Main JSX Structure
     ----------------------------------------
     ---------------------------------------- */
  return (
    <div className={styles.cardContent} ref={cardRef} onClick={handleCardClick}>
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
              {/* Quantity Frame - Now with dropdown functionality */}
              <div 
                className={styles.qtyFrame}
                onClick={(e) => handleQuantityClick(e, item.id)}
                ref={activeQuantityId === item.id ? quantityContainerRef : undefined}
                aria-label={`Item quantity: ${item.quantity}. Click to change.`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Space') {
                    handleQuantityClick(e as unknown as React.MouseEvent, item.id);
                  }
                }}
              >
                {item.quantity === 1 ? (
                  <span className={`${styles.qtyFrameText} ${compStyles.bodyReceiptH3} ${compStyles.secondaryH2_40}`}>-</span>
                ) : (
                  <>
                    <span className={`${styles.qtyFrameText} ${compStyles.bodyReceiptH3} ${compStyles.secondaryH2_40}`}>{item.quantity}</span>
                    <span className={`${styles.qtyFrameMultiplier} ${compStyles.bodyReceiptH3} ${compStyles.secondaryH2_40}`}>x</span>
                  </>
                )}
                
                {/* Quantity Dropdown - Displayed when active */}
                {activeQuantityId === item.id && (
                  <div 
                    className={styles.quantityDropdown}
                    ref={quantityDropdownRef}
                    style={dropdownPosition}
                    role="listbox"
                    aria-label="Select quantity"
                  >
                    <div className={styles.quantityList}>
                      {generateQuantityOptions().map((num) => (
                        <div 
                          key={num}
                          className={`${styles.quantityItem} ${item.quantity === num ? styles.selected : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(item.id, num);
                            setActiveQuantityId(null);
                            addLog(`Selected quantity ${num} for item ${item.id}`);
                          }}
                          role="option"
                          aria-selected={item.quantity === num}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Space') {
                              e.preventDefault();
                              handleQuantityChange(item.id, num);
                              setActiveQuantityId(null);
                              addLog(`Selected quantity ${num} for item ${item.id} with keyboard`);
                            }
                          }}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>
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
                  onBlur={(e) => handleItemNameBlur(e, item.id)}
                  onKeyDown={handleItemKeyDown}
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
                onBlur={(e) => handleNumericFieldBlur(e, 'price', item.id)}
              >
                {currentCurrency.SymbolPosition === 0 ? (
                  // Currency symbol before number (default)
                  <>
                    <span className={`${styles.priceCurrency} ${compStyles.bodyReceiptH1}`}>{currentCurrency.DisplayCurrencySymbol}</span>
                    <span 
                      className={`${styles.priceValue} ${compStyles.bodyReceiptH1}`}
                      contentEditable={isEditable('price', item.id)}
                      suppressContentEditableWarning={true}
                      onInput={handleNumericInput}
                      onBlur={(e) => handleNumericFieldBlur(e, 'price', item.id)}
                      onKeyDown={(e) => handleNumericKeyDown(e, 'price')}
                    >
                      {item.price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  // Currency symbol after number
                  <>
                    <span 
                      className={`${styles.priceValue} ${compStyles.bodyReceiptH1}`}
                      contentEditable={isEditable('price', item.id)}
                      suppressContentEditableWarning={true}
                      onInput={handleNumericInput}
                      onBlur={(e) => handleNumericFieldBlur(e, 'price', item.id)}
                      onKeyDown={(e) => handleNumericKeyDown(e, 'price')}
                    >
                      {item.price.toFixed(2)}
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
                onBlur={(e) => handleNumericFieldBlur(e, 'discount', item.id)}
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
                      onInput={handleNumericInput}
                      onBlur={(e) => handleNumericFieldBlur(e, 'discount', item.id)}
                      onKeyDown={(e) => handleNumericKeyDown(e, 'discount')}
                    >
                      {item.discount.toFixed(2)}
                    </span>
                  </>
                ) : (
                  // Currency symbol after number
                  <>
                    <span 
                      className={`${styles.discountValue} ${compStyles.bodyReceiptH2}`}
                      contentEditable={isEditable('discount', item.id)}
                      suppressContentEditableWarning={true}
                      onInput={handleNumericInput}
                      onBlur={(e) => handleNumericFieldBlur(e, 'discount', item.id)}
                      onKeyDown={(e) => handleNumericKeyDown(e, 'discount')}
                    >
                      {item.discount.toFixed(2)}
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
          <div className={styles.finalValues}>
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
              onBlur={(e) => handleNumericFieldBlur(e, 'subtotal')}
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
                    onInput={handleNumericInput}
                    onBlur={(e) => handleNumericFieldBlur(e, 'subtotal')}
                    onKeyDown={(e) => handleNumericKeyDown(e, 'subtotal')}
                  >
                    {subtotal.toFixed(2)}
                  </span>
                </>
              ) : (
                // Currency symbol after number
                <>
                  <span
                    className={`${styles.subtotalValue} ${compStyles.bodyReceiptH1}`}
                    contentEditable={isEditable('subtotal', null)}
                    suppressContentEditableWarning={true}
                    onInput={handleNumericInput}
                    onBlur={(e) => handleNumericFieldBlur(e, 'subtotal')}
                    onKeyDown={(e) => handleNumericKeyDown(e, 'subtotal')}
                  >
                    {subtotal.toFixed(2)}
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
              onBlur={(e) => handleNumericFieldBlur(e, 'savings')}
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
                    onInput={handleNumericInput}
                    onBlur={(e) => handleNumericFieldBlur(e, 'savings')}
                    onKeyDown={(e) => handleNumericKeyDown(e, 'savings')}
                  >
                    {savings.toFixed(2)}
                  </span>
                </>
              ) : (
                // Currency symbol after number
                <>
                  <span
                    className={`${styles.savingsValue} ${compStyles.bodyReceiptH1}`}
                    contentEditable={isEditable('savings', null)}
                    suppressContentEditableWarning={true}
                    onInput={handleNumericInput}
                    onBlur={(e) => handleNumericFieldBlur(e, 'savings')}
                    onKeyDown={(e) => handleNumericKeyDown(e, 'savings')}
                  >
                    {savings.toFixed(2)}
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
              onBlur={(e) => handleNumericFieldBlur(e, 'tax')}
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
                    onInput={handleNumericInput}
                    onBlur={(e) => handleNumericFieldBlur(e, 'tax')}
                    onKeyDown={(e) => handleNumericKeyDown(e, 'tax')}
                  >
                    {tax.toFixed(2)}
                  </span>
                </>
              ) : (
                // Currency symbol after number
                <>
                  <span
                    className={`${styles.taxValue} ${compStyles.bodyReceiptH1}`}
                    contentEditable={isEditable('tax', null)}
                    suppressContentEditableWarning={true}
                    onInput={handleNumericInput}
                    onBlur={(e) => handleNumericFieldBlur(e, 'tax')}
                    onKeyDown={(e) => handleNumericKeyDown(e, 'tax')}
                  >
                    {tax.toFixed(2)}
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
              onClick={() => copyLogs(uiLogs)}
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