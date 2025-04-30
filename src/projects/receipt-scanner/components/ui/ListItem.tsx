import React, { useState, useRef, useEffect } from 'react';
import { CURRENCY_DATA, CurrencyItem } from '../../constants/currency-data';
import DatePickerCalendar from './DatePickerCalendar';
import styles from '../../styles/Components.module.css';

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
  // State for the editable title
  const [receiptTitle, setReceiptTitle] = useState("Today's Receipt");
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  
  // State for the date picker
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 2, 2)); // March 2, 2025
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // State for the currency selector
  const [selectedCurrencyIdentifier, setSelectedCurrencyIdentifier] = useState("United States (USD)");
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
    setIsDatePickerOpen(!isDatePickerOpen);
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
            setSelectedDate(date);
            setIsDatePickerOpen(false);
  };

  /* ----------------------------------------
     ----------------------------------------
     COMPONENT RENDER - Main JSX Structure
     ----------------------------------------
     ---------------------------------------- */
  return (
    <div className={`card ${styles.container} ${className}`}>
      {/* ----------------------------------------
          CARD HEADER - Title, date, and currency
          ---------------------------------------- */}
      <div className="card-header">
        <div className="store-with-date">
          {/* Editable Title */}
          <div 
            ref={titleRef}
            className={`store-name ${isTitleFocused ? 'focused' : ''}`}
            onClick={() => setIsTitleFocused(true)}
          >
            <div 
              className={`editable-title ${styles.headerH1Medium}`}
              contentEditable={true}
              suppressContentEditableWarning={true}
              onBlur={(e) => setReceiptTitle(e.currentTarget.textContent || "Today's Receipt")}
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
          onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
        >
          <div className="currency-display" style={{ 
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            fontSize: '16px', 
            fontWeight: 600, 
            lineHeight: '32px',
            color: 'rgba(94, 94, 94, 0.5)' 
          }}>
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
                        setSelectedCurrencyIdentifier(currency.DisplayCountry_CurrencyCode);
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

      {/* Card content will be implemented in next phase */}

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
          width: 600px;
          height: auto;
          min-height: 350px;
          background: var(--baseWhite);
          border-radius: 10px;
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
          width: 580px;
          
          height: 36px;
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

          width: 289px;
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
          width: 139px;
          height: 32px;
          position: relative;
        }
        
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
          transition: background-color 0.2s, box-shadow 0.2s, border 0.2s;
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
          background-color: var(--darkGrey10); /* DarkGrey10 */
        }

        .currency-select-combobox:focus-within {
          background-color: var(--darkGrey10); /* DarkGrey10 */
          outline: none;
        }

        .currency-display {
          width: 34px;
          height: 32px;
          font-family: 'Inter';
          font-style: normal;
          font-weight: 600;
          font-size: 16px;
          line-height: 32px;
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
          color: #525252;
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
          color: #525252;
        }
        
        .currency-item:hover {
          background-color: var(--darkGrey05);
        }
        
        .currency-item.selected {
          background-color: var(--darkGrey08);
          font-weight: 600;
          color: #525252;
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
      `}</style>
    </div>
  );
};

export default ListItem;