import React, { useState, useRef, useEffect } from 'react';
import { CURRENCY_DATA, CurrencyItem } from '../../constants/currency-data';


interface ListItemProps {
  className?: string;
  // Add more as needed for testing
};

const ListItem: React.FC<ListItemProps> = ({ className = '' }) => {
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
  
  // Refs for handling outside clicks
  const titleRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const currencySelectRef = useRef<HTMLDivElement>(null);

  // Format date as "MMM D, YYYY"
  const formatDate = (date: Date): string => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // Handle title focus
      if (titleRef.current && !titleRef.current.contains(event.target as Node)) {
        setIsTitleFocused(false);
      }
      
      // Handle date picker dropdown
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node) && isDatePickerOpen) {
        setIsDatePickerOpen(false);
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
  }, [isDatePickerOpen, isCurrencyDropdownOpen]);

  // Reset search term when dropdown closes
  useEffect(() => {
    if (!isCurrencyDropdownOpen) {
      setCurrencySearchTerm("");
    }
  }, [isCurrencyDropdownOpen]);

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

  // New function to generate calendar days with direct styling
  const generateDaysWithStyles = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    // First, force calendar to always show the month that contains the selected date
    const currentViewMonth = new Date(year, month, 1);
    
    // Get first day of month and last day of month
    const firstDay = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth(), 1);
    const lastDay = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth() + 1, 0);
    
    // Adjust for Monday as first day of week (0 = Monday, 6 = Sunday)
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6; // Sunday becomes 6
    
    // Get the previous month's last date
    const prevMonthLastDate = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth(), 0).getDate();
    
    // Get today's date for highlighting current day
    const today = new Date();
    const isToday = (date: Date) => {
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };
    
    // Check if two dates are the same day
    const isSameDay = (date1: Date, date2: Date) => {
      return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
      );
    };
    
    const days = [];
    
    // Base styles for day container
    const baseContainerStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '36px',
      height: '36px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    };
    
    // Base styles for day number
    const baseNumberStyle = {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      fontSize: '11.9px',
      fontWeight: 400,
      lineHeight: '20px',
      color: '#0F172A', // SecondaryH2
      textAlign: 'center' as const
    };
    
    // Render previous month's days
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = prevMonthLastDate - firstDayOfWeek + i + 1;
      const date = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth() - 1, day);
      
      days.push(
        <div 
          key={`prev-${day}`}
          style={baseContainerStyle}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDate(date);
            setIsDatePickerOpen(false);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.05)'; // SecondaryH4_05
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
        >
          <span style={{
            ...baseNumberStyle,
            color: 'rgba(94, 94, 94, 0.3)' // DarkGrey30 for previous month
          }}>
            {day}
          </span>
        </div>
      );
    }
    
    // Render current month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth(), day);
      const selected = isSameDay(date, selectedDate);
      const current = isToday(date);
      
      // Create container style based on state
      const containerStyle = {...baseContainerStyle};
      if (selected) {
        containerStyle.backgroundColor = '#0F172A'; // SecondaryH2 for selected day
      }
      
      // Create number style based on state
      const numberStyle = {...baseNumberStyle};
      if (selected) {
        numberStyle.color = '#FFFFFF'; // White for selected day
        numberStyle.fontWeight = 600;
      } else if (current) {
        numberStyle.fontWeight = 600; // SemiBold for current day
      }
      
      days.push(
        <div 
          key={`current-${day}`}
          style={containerStyle}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDate(date);
            setIsDatePickerOpen(false);
          }}
          onMouseEnter={(e) => {
            if (!selected) {
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.05)'; // SecondaryH4_05
            }
          }}
          onMouseLeave={(e) => {
            if (!selected) {
              e.currentTarget.style.backgroundColor = '';
            }
          }}
        >
          <span style={numberStyle}>
            {day}
          </span>
        </div>
      );
    }
    
    // Calculate how many days from next month we need to fill the grid
    // We need 6 rows of 7 days = 42 total cells
    const totalCells = 42;
    const filledCells = firstDayOfWeek + lastDay.getDate();
    const nextMonthDays = totalCells - filledCells;
    
    // Render next month's days
    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth() + 1, day);
      
      days.push(
        <div 
          key={`next-${day}`}
          style={baseContainerStyle}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDate(date);
            setIsDatePickerOpen(false);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.05)'; // SecondaryH4_05
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
        >
          <span style={{
            ...baseNumberStyle,
            color: 'rgba(94, 94, 94, 0.3)' // DarkGrey30 for next month
          }}>
            {day}
          </span>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div className="store-with-date">
          {/* Editable Title */}
          <div 
            ref={titleRef}
            className={`store-name ${isTitleFocused ? 'focused' : ''}`}
            onClick={() => setIsTitleFocused(true)}
          >
            <div 
              className="editable-title"
              style={{ 
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                fontSize: '16px', 
                fontWeight: 600, 
                lineHeight: '32px',
              }}
              contentEditable={true}
              suppressContentEditableWarning={true}
              onBlur={(e) => setReceiptTitle(e.currentTarget.textContent || "Today's Receipt")}
            >
              {receiptTitle}
            </div>
          </div>
          
          {/* Date Picker */}
          <div 
            ref={datePickerRef}
            className="date-select-calendar"
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
          >
            <div className="date-display">
              {formatDate(selectedDate)}
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
            
            {isDatePickerOpen && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0px',
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: '0',
                width: '276px',
                
                zIndex: 10,
                background: '#FFFFFF',
                border: '1px solid rgba(94, 94, 94, 0.1)',
                boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px'
              }}>
                {/* Month header with navigation */}
                <div style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  gap: '2px',
                  width: '276px',
                  height: '44px',
                  borderBottom: '1px solid rgba(94, 94, 94, 0.1)'
                }}>
                  {/* Previous month button */}
                  <button 
                    className="month-nav-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, selectedDate.getDate());
                      setSelectedDate(newDate);
                    }}
                    aria-label="Previous month"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_313_1466)">
                        <path d="M12.842 6.175L11.667 5L6.66699 10L11.667 15L12.842 13.825L9.02533 10L12.842 6.175Z" fill="#0F172A"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_313_1466">
                          <rect width="20" height="20" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                  </button>
                  
                  {/* Month display with direct Calendar_MonthSemibold styling */}
                  <div 
                    style={{
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                      fontSize: '13.6px',
                      fontWeight: 600,
                      lineHeight: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      textAlign: 'center',
                      color: '#0F172A' // SecondaryH2
                    }}
                  >
                    {new Date(selectedDate.getFullYear(), selectedDate.getMonth()).toLocaleString('default', { month: 'long' })}
                  </div>
                  
                  {/* Next month button */}
                  <button 
                    className="month-nav-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate());
                      setSelectedDate(newDate);
                    }}
                    aria-label="Next month"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_315_412)">
                        <path d="M8.3332 5L7.1582 6.175L10.9749 10L7.1582 13.825L8.3332 15L13.3332 10L8.3332 5Z" fill="#0F172A"/>
                      </g>
                      <defs>
                        <clipPath id="clip0_315_412">
                          <rect width="20" height="20" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                  </button>
                </div>
                

                {/* CALENDAR MONTH HEADER CODE START */}
                {/* ||||||||||||||||||||||||||||||||||||||||||||| */}

                {/* Calendar content */}
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0px 4px 4px 4px',
                    width: '276px',
                    // height: '256px'
                  }}
                >

                {/* CALENDAR WEEKDAY HEADER CODE START */}
                {/* ||||||||||||||||||||||||||||||||||||||||||||| */}

                  {/* Weekday headers with direct Calendar_Medium styling */}
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 36px)',
                      gridGap: '2px',
                      width: '268px',
                      justifyContent: 'space-between',
                      marginBottom: '2px'
                    }}
                  >
                    {/* Monday through Sunday abbreviated with Calendar_Medium styling */}
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                      <div 
                        key={`weekday-${index}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: '36px',
                          height: '36px',
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                          fontSize: '10px',
                          fontWeight: 500,
                          lineHeight: '20px',
                          color: 'rgba(15, 23, 42, 0.4)' // SecondaryH2_40
                        }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  

                  {/* CALENDAR DAYS GRID CODE START */}
                  {/* ||||||||||||||||||||||||||||||||||||||||||||| */}

                  {/* Calendar days grid */}
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 36px)',
                      // border: '1px solid rgba(255, 6, 6, 0.88)',
                      gridGap: '2px',
                      width: '268px',
                      justifyContent: 'space-between',
                    }}
                  >
                    {/* Generate calendar days with direct styling */}
                    {generateDaysWithStyles()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Currency Selector */}
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
          
          {isCurrencyDropdownOpen && (
            <div className="currency-dropdown">
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

      <style jsx>{`
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
          background: #FFFFFF;
          border-radius: 10px;
        }
        
        .card-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 2px 10px 2px 6px;
          width: 580px;
          
          height: 36px;
        }
        
        .store-with-date {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 17px;

          width: 289px;
          height: 32px;
        }
        
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
          background-color: rgba(94, 94, 94, 0.05); /* DarkGrey10 */
          border-radius: 4px;
        }

        .store-name.focused {
          border-radius: 4px;
          border: 1px solid rgba(94, 94, 94, 0.5);
          box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.35);
          background-color: transparent;
        }


        
        .editable-title {
          font-family: 'Inter';
          width: 100%;
          height: 32px;
          font-style: normal;
          font-weight: 600;
          font-size: 16px;
          line-height: 32px;
          display: block; /* Changed from flex for text handling */
          white-space: nowrap;
          overflow: hidden; /* CRITICAL - prevents text overflow */
          text-overflow: ellipsis; /* CRITICAL - adds ellipsis */
          color: #525252;
          outline: none;
        }
        
        .date-select-calendar {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 0px 8px;
          width: 145px;
          height: 32px;
          border-radius: 4px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.2s ease; /* Add smooth transition */
        }
        
        .date-select-calendar:hover {
          background-color: rgba(94, 94, 94, 0.05); /* DarkGrey10 */
        }

        .date-select-calendar:focus-within {
          background-color: rgba(94, 94, 94, 0.05); /* DarkGrey10 */
          outline: none;
        }

        .date-display {
          height: 32px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-style: normal;
          font-weight: 600;
          font-size: 16px;
          line-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          color: #525252;
        }
        
        .dropdown-icon {
          width: 24px;
          height: 24px;
        }
        
        .calendar-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px;
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          width: 276px;
          z-index: 10;
          background: #FFFFFF;
          border: 1px solid rgba(94, 94, 94, 0.1);
          box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }
        
        .calendar-month-header {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          gap: 2px;
          width: 276px;
          height: 44px;
          border-bottom: 1px solid rgba(94, 94, 94, 0.1);
        }
        
        .month-nav-button {
          width: 20px;
          height: 20px;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .month-nav-button:hover {
          background-color: rgba(15, 23, 42, 0.05);
        }
        
        .calendar-month-label {
          font-family: 'Inter';
          font-size: 13.6px;
          font-weight: 600;
          line-height: 24px;
          display: flex;
          align-items: center;
          text-align: center;
          color: #0F172A;
        }
        
        .calendar-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4px;
          width: 276px;
          height: 256px;
        }
        
        .weekday-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 268px;
          height: 36px;
          margin-bottom: 2px;
        }
        
        .weekday-cell {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 36px;
          height: 36px;
          font-size: 10px;
          font-weight: 500;
          line-height: 20px;
          color: rgba(15, 23, 42, 0.4);
        }
        
        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 36px);
          grid-gap: 2px;
          width: 268px;
        }
        
        .day-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .day-container:hover {
          background-color: rgba(15, 23, 42, 0.05);
        }
        
        .day-container.selected {
          background-color: #0F172A;
        }
        
        .day-number {
          font-size: 11.9px;
          font-weight: 400;
          line-height: 20px;
          color: #0F172A;
          text-align: center;
        }
        
        .other-month .day-number {
          color: rgba(94, 94, 94, 0.3);
        }
        
        .selected .day-number {
          color: #FFFFFF;
          font-weight: 600;
        }
        
        .current-day .day-number {
          font-weight: 600;
        }
        
        /* CURRENCY TICKER CODE START */
        
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
          background-color: rgba(94, 94, 94, 0.05); /* DarkGrey10 */
        }

        .currency-select-combobox:focus-within {
          background-color: rgba(94, 94, 94, 0.05); /* DarkGrey10 */
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
          text-align: center;
          color: rgba(94, 94, 94, 0.5);
        }


        /* CURRENCY TICKER CODE END */


        /* CURRENCY DROPDOWN CODE START */
        .currency-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          z-index: 10;
          background: #FFFFF;
          border-radius: 8px;
          border: 1px solid rgba(94, 94, 94, 0.05);
          box-shadow: 0 4px 6px rgba(94, 94, 94, 0.1);
          padding: 8px;
          margin-top: 4px;
          width: 240px;
        }
        
        .currency-search {
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(94, 94, 94, 0.2);
        }
        
        .currency-search input {
          width: 100%;
          padding: 8px;
          border: 1px solid rgba(94, 94, 94, 0.1);
          border-radius: 4px;
          font-size: 13.6px;
          color: #525252;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .currency-search input:focus {
          outline: none;
          border: 1px solid rgba(94, 94, 94, 0.5);
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
          background-color: rgba(94, 94, 94, 0.05);
        }
        
        .currency-item.selected {
          background-color: rgba(94, 94, 94, 0.08);
          font-weight: 600;
          color: #525252;
        }
        
        .currency-item:first-child {
          border-bottom: 2px solid rgba(94, 94, 94, 0.1);
          margin-bottom: 4px;
          padding-bottom: 8px;
        }
        
        .no-results {
          padding: 8px;
          text-align: center;
          color: rgba(94, 94, 94, 0.5);
        }


        /* CURRENCY DROPDOWN CODE END */

      `}</style>
    </div>
  );
};

export default ListItem;
