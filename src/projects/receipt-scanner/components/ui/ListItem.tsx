import React, { useState, useRef, useEffect } from 'react';
import { CURRENCY_DATA, CurrencyItem } from '../../constants/currency-data';
import DatePickerCalendar from './DatePickerCalendar';
import CardContent from './CardContent';
import { useReceipt } from '../../context/ReceiptContext';
import styles from '../../styles/Components.module.css';

/* ----------------------------------------
   ----------------------------------------
   UTILITY FUNCTIONS
   ----------------------------------------
   ---------------------------------------- */
/**
 * Safely parses a date string in DD-MM-YYYY format
 * @param dateStr The date string to parse
 * @returns A valid Date object or null if invalid
 */
const parseDateSafely = (dateStr: string): Date | null => {
  try {
    const parts = dateStr.split('-');
    
    // Validate that we have 3 parts and they're all valid numbers
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      
      // Check if any part is NaN or invalid date range
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
          day > 0 && day <= 31 && 
          month > 0 && month <= 12 && 
          year > 1900 && year < 2100) {
        const date = new Date(year, month - 1, day);
        
        // Extra validation: check if resulting date is valid
        // This catches edge cases like February 30th
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    console.warn(`Invalid date format: ${dateStr}`);
    return null;
  } catch (error) {
    console.error("Error parsing date:", error);
    return null;
  }
};

/* ----------------------------------------
   ----------------------------------------
   COMPONENT INTERFACE - ListItem Props
   ----------------------------------------
   ---------------------------------------- */
interface ListItemProps {
  className?: string;
  // Add more as needed for testing
};

/* ----------------------------------------
   ----------------------------------------
   MAIN COMPONENT - Receipt List Item
   ----------------------------------------
   A card component that displays receipt information
   with editable title, date picker, and currency selection
   ---------------------------------------- */
const ListItem: React.FC<ListItemProps> = ({ className = '' }) => {
  /* ----------------------------------------
     STATE MANAGEMENT - Component State
     ---------------------------------------- */
  // Get receipt data from context
  const { receipt } = useReceipt();
  
  // UI logs for debugging
  const [uiLogs, setUiLogs] = useState<string[]>([]);
  
  // Helper function to add logs
  const addLog = (message: string) => {
    setUiLogs(prev => [...prev.slice(-9), message]); // Keep last 10 logs
  };
     
  // State for the editable title
  const [receiptTitle, setReceiptTitle] = useState(() => receipt?.store_name || "Today's Receipt");
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  
  // State for the date picker - parse date from receipt if available
  const [selectedDate, setSelectedDate] = useState(() => {
    if (receipt?.date) {
      const parsedDate = parseDateSafely(receipt.date);
      if (parsedDate) {
        return parsedDate;
      }
    }
    return new Date(); // Use current date as fallback
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // State for the currency selector - use receipt currency if available
  const [selectedCurrencyIdentifier, setSelectedCurrencyIdentifier] = useState(() => {
    if (receipt?.currency?.code) {
      // Try to find the currency in CURRENCY_DATA
      const currencyItem = CURRENCY_DATA.find(c => c.CurrencyCode === receipt.currency.code);
      if (currencyItem) {
        return currencyItem.DisplayCountry_CurrencyCode;
      }
    }
    return "United States (USD)"; // Default fallback
  });
  
  // Store the full currency object - with receipt currency if available
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyItem>(() => {
    if (receipt?.currency?.code) {
      // Try to find the currency in CURRENCY_DATA
      const currencyItem = CURRENCY_DATA.find(c => c.CurrencyCode === receipt.currency.code);
      if (currencyItem) {
        return currencyItem;
      }
    }
    return CURRENCY_DATA.find(c => c.DisplayCountry_CurrencyCode === "United States (USD)") || CURRENCY_DATA[0];
  });
  
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearchTerm, setCurrencySearchTerm] = useState("");
  
  // Position state for the currency dropdown
  const [currencyDropdownPosition, setCurrencyDropdownPosition] = useState({
    top: 'calc(100% + 4px)',
    left: 'auto',
    right: '0',
    bottom: 'auto'
  });
  
  // Refs for handling outside clicks
  const titleRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const currencySelectRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const titleContentRef = useRef<HTMLDivElement>(null);

  /* ----------------------------------------
     EFFECT HOOKS - Update from Receipt Data
     ---------------------------------------- */
  // Update state when receipt data changes
  useEffect(() => {
    if (receipt) {
      // Update store name if available
      if (receipt.store_name) {
        setReceiptTitle(receipt.store_name);
      }
      
      // Update date if available
      if (receipt.date) {
        const parsedDate = parseDateSafely(receipt.date);
        if (parsedDate) {
          setSelectedDate(parsedDate);
        }
      }
      
      // Update currency if available
      if (receipt.currency?.code) {
        const currencyItem = CURRENCY_DATA.find(c => c.CurrencyCode === receipt.currency.code);
        if (currencyItem) {
          setSelectedCurrencyIdentifier(currencyItem.DisplayCountry_CurrencyCode);
          setSelectedCurrency(currencyItem);
        }
      }
      
      addLog(`Receipt data loaded: ${receipt.store_name}, ${receipt.date}`);
    }
  }, [receipt]);

  /* ----------------------------------------
     EFFECT HOOKS - Dropdown Positioning
     ---------------------------------------- */
  // Calculate and set the optimal position for the currency dropdown
  useEffect(() => {
    if (isCurrencyDropdownOpen && currencySelectRef.current && currencyDropdownRef.current) {
      // Get container and dropdown dimensions
      const containerRect = currencySelectRef.current.getBoundingClientRect();
      const dropdownRect = currencyDropdownRef.current.getBoundingClientRect();
      
      // Get viewport dimensions
      const viewportHeight = window.innerHeight;
      
      // Calculate available space in each direction
      const spaceBelow = viewportHeight - containerRect.bottom;
      const spaceAbove = containerRect.top;
      const spaceLeft = containerRect.left;
      
      // Default position (below and right-aligned)
      let newPosition = {
        top: 'calc(100% + 4px)',
        left: 'auto',
        right: '0',
        bottom: 'auto'
      };
      
      // Check if dropdown fits below
      if (spaceBelow < dropdownRect.height && spaceAbove > dropdownRect.height) {
        // Position above if there's more space
        newPosition = {
          top: 'auto',
          bottom: 'calc(100% + 4px)',
          left: 'auto',
          right: '0'
        };
      }
      
      // Check horizontal overflow (left side)
      if (containerRect.right - dropdownRect.width < 0 && spaceLeft + containerRect.width > dropdownRect.width) {
        // Align to left edge of container if it would overflow left viewport edge
        newPosition.left = '0';
        newPosition.right = 'auto';
      }
      
      // Update position state
      setCurrencyDropdownPosition(newPosition);
    }
  }, [isCurrencyDropdownOpen, currencySelectRef]);

  /* ----------------------------------------
     EFFECT HOOKS - Outside Click Handlers
     ---------------------------------------- */
  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Handle title focus
      if (titleRef.current && !titleRef.current.contains(event.target as Node)) {
        setIsTitleFocused(false);
      }
      
      // Handle currency selector dropdown
      if (currencySelectRef.current && !currencySelectRef.current.contains(event.target as Node) && isCurrencyDropdownOpen) {
        setIsCurrencyDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCurrencyDropdownOpen]);

  // Reset search term when dropdown closes
  useEffect(() => {
    if (!isCurrencyDropdownOpen) {
      setCurrencySearchTerm("");
    }
  }, [isCurrencyDropdownOpen]);

  useEffect(() => {
    if (titleContentRef.current) {
      titleContentRef.current.spellcheck = isTitleFocused;
    }
  }, [isTitleFocused]);

  /* ----------------------------------------
     DATA PROCESSING - Currency Filtering
     ---------------------------------------- */
  // Filter currencies based on search term
  const filteredCurrencies = CURRENCY_DATA.filter((currency: CurrencyItem) => {
    if (!currencySearchTerm) return true;
    
    const searchTerm = currencySearchTerm.toLowerCase();
    
    // Search by both Country and CurrencyCode
    return (
      currency.Country.toLowerCase().includes(searchTerm) ||
      currency.CurrencyCode.toLowerCase().includes(searchTerm)
    );
  });


  // Sort currencies to show selected currency at top of the list
  const sortedCurrencies = [...filteredCurrencies].sort((a, b) => {
    // If a is the selected currency, it should come first
    if (a.DisplayCountry_CurrencyCode === selectedCurrencyIdentifier) return -1;
    // If b is the selected currency, it should come first
    if (b.DisplayCountry_CurrencyCode === selectedCurrencyIdentifier) return 1;
    // Otherwise, maintain alphabetical order
    return a.DisplayCountry_CurrencyCode.localeCompare(b.DisplayCountry_CurrencyCode);
  });

  /* ----------------------------------------
     EVENT HANDLERS - Component interactions
     ---------------------------------------- */
  // Toggle date picker dropdown
  const handleToggleDatePicker = () => {
    addLog(`Toggle date picker: ${!isDatePickerOpen}`);
    setIsDatePickerOpen(!isDatePickerOpen);
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    addLog(`Date selected: ${date.toLocaleDateString()}`);
    setSelectedDate(date);
    setIsDatePickerOpen(false);
  };

  const handleCardInteractions = (e: React.MouseEvent) => {
    // Get the actual target element
    const target = e.target as HTMLElement;
    
    // Convert className to string safely if it's not already
    const classNameStr = typeof target.className === 'string' 
      ? target.className 
      : String(target.className);
    
    // Check for class names using indexOf instead of includes for better compatibility
    if ((classNameStr.indexOf('card') >= 0 && classNameStr.indexOf('editable') === -1) || 
        classNameStr.indexOf('card-header') >= 0 || 
        classNameStr.indexOf('store-with-date') >= 0) {
      
      // Prevent the default behavior which might trigger focus
      e.preventDefault();
      
      // If the editable title is currently focused, blur it
      if (titleContentRef.current && isTitleFocused) {
        addLog(`Card interaction blurring title`);
        titleContentRef.current.blur();
      }
      
      // Stop event propagation to prevent any other handlers from firing
      e.stopPropagation();
    }
    
    // Also handle currency dropdown when clicking on card
    if (isCurrencyDropdownOpen) {
      const currencyTarget = e.target as Node;
      if (currencySelectRef.current && !currencySelectRef.current.contains(currencyTarget)) {
        addLog(`Card interaction closing currency dropdown`);
        setIsCurrencyDropdownOpen(false);
      }
    }
    
    // Handle date picker calendar when clicking on card
    if (isDatePickerOpen) {
      const datePickerTarget = e.target as Node;
      if (datePickerRef.current && !datePickerRef.current.contains(datePickerTarget)) {
        addLog(`Card interaction closing date picker`);
        setIsDatePickerOpen(false);
      }
    }
  };

  /* ----------------------------------------
     ----------------------------------------
     COMPONENT RENDER - Main JSX Structure
     ----------------------------------------
     ---------------------------------------- */
  return (
    <div 
      className={`card ${styles.container} ${className}`}
      onMouseDown={handleCardInteractions}
    >
      {/* ----------------------------------------
          CARD HEADER - Title, date, and currency
          ---------------------------------------- */}
      <div className="card-header">
        <div className="store-with-date">
          {/* Editable Title */}
          <div 
            ref={titleRef}
            className={`store-name ${isTitleFocused ? 'focused' : ''}`}
          >
            <div 
              className={`editable-title ${styles.headerH1Semibold}`}
              contentEditable={true}
              suppressContentEditableWarning={true}
              spellCheck={isTitleFocused}
              ref={titleContentRef}
              style={{ cursor: 'text' }}
              onFocus={() => {
                addLog(`Title focused`);
                setIsTitleFocused(true);
              }}
              onBlur={(e) => {
                addLog(`Title blur`);
                setReceiptTitle(e.currentTarget.textContent || "Today's Receipt");
                setIsTitleFocused(false);
                e.currentTarget.scrollLeft = 0;
              }}
              onInput={(e) => {
                // Automatically scroll to the end when typing
                const el = e.currentTarget;
                el.scrollLeft = el.scrollWidth;
              }}
              onKeyDown={(e) => {
                // Exit edit mode when Enter or Escape is pressed
                if (e.key === 'Enter' || e.key === 'Escape') {
                  addLog(`Title keydown: ${e.key} - preventing default`);
                  e.preventDefault(); // Prevent new line for Enter key
                  addLog(`Title keydown: ${e.key} - setting focused to false`);
                  setIsTitleFocused(false); // Update React state to remove focused UI
                  addLog(`Title keydown: ${e.key} - blurring element`);
                  e.currentTarget.blur(); // Unfocus the element (triggers onBlur)
                }
              }}
            >
              {receiptTitle}
            </div>
          </div>
          
          {/* ----------------------------------------
              DATE PICKER - Calendar component 
              ---------------------------------------- */}
          <div ref={datePickerRef}>
            <DatePickerCalendar
              selectedDate={selectedDate}
              isOpen={isDatePickerOpen}
              containerRef={datePickerRef as React.RefObject<HTMLDivElement>}
              onDateSelect={handleDateSelect}
              onToggleCalendar={handleToggleDatePicker}
            />
          </div>
        </div>
        
        {/* ----------------------------------------
            CURRENCY SELECTOR - Currency dropdown
            ---------------------------------------- */}
        <div 
          ref={currencySelectRef}
          className="currency-select-combobox"
          onClick={() => {
            addLog(`Currency selector clicked: ${!isCurrencyDropdownOpen}`);
            setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen);
          }}
        >
          <div className={`currency-display ${styles.headerH1Semibold}`}>
            {selectedCurrencyIdentifier.split("(")[1].replace(")", "")}
          </div>
          <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_307_575)">
              <path d="M16.59 8.59003L12 13.17L7.41 8.59003L6 10L12 16L18 10L16.59 8.59003Z" fill="#5E5E5E" fillOpacity="0.4"/>
            </g>
            <defs>
              <clipPath id="clip0_307_575">
                <rect width="24" height="24" fill="white"/>
              </clipPath>
            </defs>
          </svg>
          
          {/* ----------------------------------------
              CURRENCY DROPDOWN - Currency selection list
              ---------------------------------------- */}
          {isCurrencyDropdownOpen && (
            <div 
              ref={currencyDropdownRef}
              className="currency-dropdown"
              style={{
                top: currencyDropdownPosition.top,
                bottom: currencyDropdownPosition.bottom,
                left: currencyDropdownPosition.left,
                right: currencyDropdownPosition.right
              }}
            >
              <div className="currency-search">
                <input 
                  type="text" 
                  placeholder="Search currency..." 
                  value={currencySearchTerm}
                  onChange={(e) => setCurrencySearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="currency-list">
                {filteredCurrencies.length > 0 ? (
                  sortedCurrencies.map((currency: CurrencyItem, index: number) => (
                    <div 
                      key={index} 
                      className={`currency-item ${selectedCurrencyIdentifier === currency.DisplayCountry_CurrencyCode ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        addLog(`Currency selected: ${currency.DisplayCountry_CurrencyCode}`);
                        setSelectedCurrencyIdentifier(currency.DisplayCountry_CurrencyCode);
                        setSelectedCurrency(currency); // Update the selected currency object
                        setIsCurrencyDropdownOpen(false);
                      }}
                    >
                      {/* Display using column 3 (DisplayCountry_CurrencyCode) */}
                      {currency.DisplayCountry_CurrencyCode}
                    </div>
                  ))
                ) : (
                  <div className="no-results">No currencies found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------
          CARD CONTENT - Items list and totals
          ---------------------------------------- */}
      <CardContent 
        currency={selectedCurrency} 
        initialItems={receipt?.items} 
        initialSubtotal={receipt?.subtotal}
        initialSavings={receipt?.savings}
        initialTax={receipt?.tax_and_fees} 
      />
      
      {/* Debug logs display */}
      {uiLogs.length > 0 && (
        <div className="debug-logs listitem-logs">
          <div className="log-header">
            ListItem Logs
            <button 
              className="copy-logs-btn"
              onClick={() => {
                const logsText = uiLogs.join('\n');
                
                // Try to use the Clipboard API with fallback for older browsers
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                  // Modern browsers with Clipboard API
                  navigator.clipboard.writeText(logsText)
                    .then(() => {
                      const btn = document.querySelector('.debug-logs.listitem-logs .copy-logs-btn') as HTMLButtonElement;
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
                      const btn = document.querySelector('.debug-logs.listitem-logs .copy-logs-btn') as HTMLButtonElement;
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
          {uiLogs.map((log, index) => (
            <div key={index} className="log-entry">{log}</div>
          ))}
        </div>
      )}

      {/* ----------------------------------------
          ----------------------------------------
          COMPONENT STYLES - CSS-in-JSX Styling
          ----------------------------------------
          ---------------------------------------- */}
      <style jsx>{`
        /* ==========================================
           CARD CONTAINER STYLES - Main container
           ========================================== */
        .card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px 10px 24px;
          gap: 20px;
          position: relative;
          width: 100%;
          max-width: 600px;
          height: auto;
          min-height: 350px;
          background: var(--baseWhite);
          border-radius: 10px;
          transition: width 0.3s ease;
        }
        
        /* ==========================================
           CARD HEADER STYLES - Title and controls
           ========================================== */
        .card-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 2px 10px 2px 6px;
          width: 100%;
          max-width: 580px;
          height: 36px;
          transition: padding 0.3s ease;
        }
        
        /* ==========================================
           STORE AND DATE STYLES - Left side of header
           ========================================== */
        .store-with-date {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 17px;
          width: auto;
          flex-grow: 1;
          height: 32px;
        }
        
        /* ==========================================
           STORE NAME STYLES - Editable title
           ========================================== */
        .store-name {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          gap: 10px;
          max-width: 144px;
          width: 100%; /* Allow shrinking with parent */
          height: 32px;
          position: relative;
          transition: background-color 0.2s, box-shadow 0.2s, border 0.2s, max-width 0.3s ease;
        }

        .store-name:not(.focused):hover {
          background-color: var(--darkGrey05); /* DarkGrey05 */
          border-radius: 4px;
        }

        .store-name.focused {
          border-radius: 4px;
          border: 1px solid var(--darkGrey50);
          box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.35);
          background-color: transparent;
        }
        
        .editable-title {
          width: 100%;
          height: 32px;
          display: block; /* Changed from flex for text handling */
          white-space: nowrap;
          overflow: hidden; /* CRITICAL - prevents text overflow */
          text-overflow: ellipsis; /* CRITICAL - adds ellipsis */
          color: var(--primaryH1);
          outline: none;
          line-height: 32px; /* Ensure text is vertically centered */
          padding: 0;
          margin: 0;
        }
        
        /* Add styling for focused state - removes ellipsis and allows scrolling */
        .store-name.focused .editable-title {
          text-overflow: clip;
          overflow-x: auto;
          /* Ensures cursor is visible at the end of text while typing */
          scrollbar-width: none; /* Firefox */
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .store-name.focused .editable-title::-webkit-scrollbar {
          display: none;
        }
        
        /* ==========================================
           CURRENCY SELECTOR STYLES - Right side of header
           ========================================== */
        .currency-select-combobox {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          width: 74px;
          height: 32px;
          border-radius: 4px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.2s ease; /* Add smooth transition */
        }

        .currency-select-combobox:hover {
          background-color: var(--darkGrey05); /* DarkGrey05 */
        }

        .currency-select-combobox:focus-within {
          background-color: var(--darkGrey10); /* DarkGrey10 */
          outline: none;
        }

        .currency-display {
          width: 34px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          color: var(--darkGrey50);
        }

        /* Add dropdown icon styling */
        .dropdown-icon {
          width: 24px;
          height: 24px;
        }

        /* ==========================================
           CURRENCY DROPDOWN STYLES - Currency selection list
           ========================================== */
        .currency-dropdown {
          position: absolute;
          z-index: 10;
          background: var(--baseWhite);
          border-radius: 8px;
          border: 1px solid var(--darkGrey05);
          box-shadow: 0 4px 6px var(--darkGrey10);
          padding: 8px;
          width: 240px;
          /* Position is now managed dynamically via inline styles */
        }
        
        .currency-search {
          padding-bottom: 8px;
          border-bottom: 1px solid var(--darkGrey20);
        }
        
        .currency-search input {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--darkGrey10);
          border-radius: 4px;
          font-size: 13.6px;
          color: var(--primaryH1);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .currency-search input:focus {
          outline: none;
          border: 1px solid var(--darkGrey50);
          box-shadow: 0 0 0 2.4px rgba(148, 163, 184, 0.3);
        }

        .currency-list {
          max-height: 200px;
          overflow-y: auto;
          margin-top: 8px;
        }
        
        .currency-item {
          padding: 6px 8px;
          cursor: pointer;
          font-size: 13.6px;
          border-radius: 4px;
          color: var(--primaryH1);
        }
        
        .currency-item:hover {
          background-color: var(--darkGrey05);
        }
        
        .currency-item.selected {
          background-color: var(--darkGrey08);
          font-weight: 600;
          color: var(--primaryH1);
        }
        
        .currency-item:first-child {
          border-bottom: 2px solid var(--darkGrey10);
          margin-bottom: 4px;
          padding-bottom: 8px;
        }
        
        .no-results {
          padding: 8px;
          text-align: center;
          color: var(--darkGrey50);
        }
        
        /* Debug logs */
        .debug-logs.listitem-logs {
          position: fixed;
          bottom: 10px;
          right: 10px; /* Position on the right side */
          width: 300px;
          max-height: 200px;
          background-color: rgba(0, 0, 0, 0.8);
          color: #0ff; /* Different color from CardContent logs */
          border-radius: 5px;
          padding: 10px;
          font-family: monospace;
          font-size: 12px;
          z-index: 9999;
          overflow-y: auto;
        }

        .log-header {
          font-weight: bold;
          border-bottom: 1px solid #0ff;
          margin-bottom: 5px;
          padding-bottom: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          background-color: rgba(0, 0, 0, 0.8);
          z-index: 1;
          padding-top: 5px;
        }

        .copy-logs-btn {
          background-color: rgba(0, 255, 255, 0.2);
          color: #0ff;
          border: 1px solid #0ff;
          border-radius: 3px;
          padding: 2px 6px;
          font-size: 10px;
          cursor: pointer;
          font-family: monospace;
          transition: background-color 0.2s;
        }

        .copy-logs-btn:hover {
          background-color: rgba(0, 255, 255, 0.3);
        }

        .log-entry {
          margin: 3px 0;
          word-break: break-word;
        }

        /* ==========================================
           RESPONSIVE STYLES - For various screen sizes
           ========================================== */
        @media (max-width: 768px) {
          .card {
            padding: 15px 8px 20px;
          }
          
          .card-header {
            padding: 2px 8px 2px 4px;
          }
          
          .store-with-date {
            gap: 12px;
            width: 100%;
            justify-content: space-between;
          }
          
          .store-name {
            max-width: 160px;
          }
        }
        
        @media (max-width: 480px) {
          .card {
            padding: 12px 6px 16px;
            min-height: 320px;
          }
          
          .card-header {
            padding: 2px 6px 2px 4px;
          }
          
          .store-with-date {
            gap: 8px;
            width: 100%;
          }
          
          .store-name {
            max-width: calc(100% - 145px);
            flex-grow: 1;
          }
          
          .currency-select-combobox {
            display: none; /* Hide currency selector on mobile */
          }
        }
      `}</style>
    </div>
  );
};

export default ListItem;