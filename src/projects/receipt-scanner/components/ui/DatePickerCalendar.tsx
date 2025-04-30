import React, { useEffect, useState, useRef } from 'react';
import styles from '../../styles/Components.module.css';

/* ----------------------------------------
   ----------------------------------------
   COMPONENT INTERFACE - DatePickerCalendar Props
   ----------------------------------------
   ---------------------------------------- */
interface DatePickerCalendarProps {
  /** Currently selected date */
  selectedDate: Date;
  
  /** Whether the calendar dropdown is currently open */
  isOpen: boolean;
  
  /** Reference to the container element for handling outside clicks */
  containerRef: React.RefObject<HTMLDivElement>;
  
  /** Callback when a date is selected */
  onDateSelect: (date: Date) => void;
  
  /** Callback to toggle the calendar dropdown */
  onToggleCalendar: () => void;
}

/* ----------------------------------------
   ----------------------------------------
   MAIN COMPONENT - Date Picker Calendar
   ----------------------------------------
   A dropdown calendar component that displays a month view
   with interactive date selection and month navigation
   ---------------------------------------- */
const DatePickerCalendar: React.FC<DatePickerCalendarProps> = ({
  selectedDate,
  isOpen,
  containerRef,
  onDateSelect,
  onToggleCalendar
}) => {
  // State to track the currently displayed month (separate from selected date)
  const [currentViewMonth, setCurrentViewMonth] = useState(() => new Date(selectedDate));
  
  // Position state for the dropdown
  const [dropdownPosition, setDropdownPosition] = useState<{
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    width?: string;
    maxHeight?: string;
  }>({
    top: 'calc(100% + 4px)',
    left: '0',
    right: 'auto',
    bottom: 'auto'
  });
  
  // Reference to the actual dropdown element
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // State to track if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  // Reset view month when selectedDate changes
  useEffect(() => {
    setCurrentViewMonth(new Date(selectedDate));
  }, [selectedDate]);
  
  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  /* ----------------------------------------
     EFFECT HOOKS - Dropdown Positioning
     ---------------------------------------- */
  // Calculate and set the optimal position for the dropdown
  useEffect(() => {
    if (isOpen && containerRef.current && dropdownRef.current) {
      // Get container and dropdown dimensions
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      
      // Get viewport dimensions
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate available space in each direction
      const spaceBelow = viewportHeight - containerRect.bottom;
      const spaceAbove = containerRect.top;
      
      // Calculate horizontal space
      const containerCenterX = containerRect.left + (containerRect.width / 2);
      const halfDropdownWidth = dropdownRect.width / 2;
      const leftOverflow = halfDropdownWidth > containerCenterX;
      const rightOverflow = (containerCenterX + halfDropdownWidth) > viewportWidth;
      
      // Determine optimal horizontal position
      let horizontalPosition = {};
      
      // For optimal centering relative to the date picker
      if (!leftOverflow && !rightOverflow) {
        // Ideal case: Center the calendar on the date picker
        const leftOffset = containerCenterX - halfDropdownWidth;
        horizontalPosition = {
          left: `${leftOffset - containerRect.left}px`,
          right: 'auto'
        };
      } else if (leftOverflow && !rightOverflow) {
        // Left edge constrained: Align to left edge of viewport with small buffer
        horizontalPosition = {
          left: `${4 - containerRect.left}px`,
          right: 'auto'
        };
      } else if (!leftOverflow && rightOverflow) {
        // Right edge constrained: Align to right edge of viewport with small buffer
        const rightOffset = viewportWidth - 4;
        const rightPosition = containerRect.right - rightOffset;
        horizontalPosition = {
          left: 'auto',
          right: `${rightPosition}px`
        };
      } else {
        // Both edges constrained: Center in viewport with buffer
        const availableWidth = viewportWidth - 8; // 4px buffer on each side
        const leftOffset = 4;
        horizontalPosition = {
          left: `${leftOffset - containerRect.left}px`,
          right: 'auto',
          width: `${availableWidth}px`
        };
      }
      
      // Determine vertical position - default to below
      let verticalPosition = {
        top: 'calc(100% + 4px)',
        bottom: 'auto'
      };
      
      // Check if there's sufficient space below, above, or neither
      const sufficientBelow = spaceBelow >= dropdownRect.height;
      const sufficientAbove = spaceAbove >= dropdownRect.height;
      
      if (!sufficientBelow && sufficientAbove) {
        // Not enough space below, but enough above - position above
        verticalPosition = {
          top: 'auto',
          bottom: 'calc(100% + 4px)'
        };
      } else if (!sufficientBelow && !sufficientAbove) {
        // Not enough space below or above - find best position
        const optimalVerticalPosition = getOptimalVerticalPosition(
          containerRect, 
          dropdownRect, 
          viewportHeight
        );
        verticalPosition = optimalVerticalPosition;
      }
      
      // Combine positions and update state
      setDropdownPosition({
        ...horizontalPosition,
        ...verticalPosition
      });
      
      // If we need to adjust height for overflow, do it after position is set
      if (!sufficientBelow && !sufficientAbove) {
        setTimeout(() => {
          if (dropdownRef.current) {
            const maxHeight = Math.max(spaceBelow, spaceAbove, viewportHeight * 0.7);
            dropdownRef.current.style.maxHeight = `${maxHeight - 16}px`;
            dropdownRef.current.style.overflowY = 'auto';
          }
        }, 0);
      } else {
        // Reset any previously set maxHeight
        setTimeout(() => {
          if (dropdownRef.current) {
            dropdownRef.current.style.maxHeight = '';
            dropdownRef.current.style.overflowY = '';
          }
        }, 0);
      }
    }
  }, [isOpen, containerRef, isMobile]);
  
  // Helper function to determine the optimal vertical position in constrained spaces
  const getOptimalVerticalPosition = (
    containerRect: DOMRect, 
    dropdownRect: DOMRect, 
    viewportHeight: number
  ) => {
    const spaceBelow = viewportHeight - containerRect.bottom;
    const spaceAbove = containerRect.top;
    
    // Determine which placement shows more of the calendar
    if (spaceBelow >= spaceAbove) {
      // Position below with max available space
      return {
        top: 'calc(100% + 4px)',
        bottom: 'auto',
        maxHeight: `${spaceBelow - 16}px` // 16px buffer
      };
    } else {
      // Position above with max available space
      return {
        top: 'auto',
        bottom: 'calc(100% + 4px)',
        maxHeight: `${spaceAbove - 16}px` // 16px buffer
      };
    }
  };
  
  /* ----------------------------------------
     EFFECT HOOKS - Outside Click Handler
     ---------------------------------------- */
  // Handle clicks outside of the calendar to close it
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (isOpen && 
          containerRef.current && 
          !containerRef.current.contains(event.target as Node)) {
        onToggleCalendar();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, containerRef, onToggleCalendar]);

  /* ----------------------------------------
     UTILITY FUNCTIONS - Helper Methods
     ---------------------------------------- */
  // Format date as "MMM D, YYYY"
  const formatDate = (date: Date): string => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };
  
  // Navigate to previous/next month without selecting a date
  const navigateMonth = (increment: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newMonth = new Date(currentViewMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentViewMonth(newMonth);
  };

  /* ----------------------------------------
     CALENDAR RENDERER - Calendar Day Generation
     ---------------------------------------- */
  // Function to generate calendar days with direct styling
  const generateDaysWithStyles = () => {
    const year = currentViewMonth.getFullYear();
    const month = currentViewMonth.getMonth();
    
    // First, force calendar to always show the month that contains the selected date
    const monthStart = new Date(year, month, 1);
    
    // Get first day of month and last day of month
    const firstDay = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
    const lastDay = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    
    // Adjust for Monday as first day of week (0 = Monday, 6 = Sunday)
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6; // Sunday becomes 6
    
    // Get the previous month's last date
    const prevMonthLastDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), 0).getDate();
    
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
    
    // Base styles for day container - now responsive to mobile
    const baseContainerStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: isMobile ? '44px' : '36px',
      height: isMobile ? '44px' : '36px',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    };
    
    // Base styles for day number - now responsive to mobile
    const baseNumberStyle = {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      fontSize: isMobile ? '16px' : '11.9px',
      fontWeight: 400,
      lineHeight: '20px',
      color: '#0F172A', // SecondaryH2
      textAlign: 'center' as const
    };
    
    /* ----------------------------------------
       CALENDAR DAYS - Previous Month Days
       ---------------------------------------- */
    // Render previous month's days
    for (let i = 0; i < firstDayOfWeek; i++) {
      const day = prevMonthLastDate - firstDayOfWeek + i + 1;
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, day);
      
      days.push(
        <div 
          key={`prev-${day}`}
          style={baseContainerStyle}
          onClick={(e) => {
            e.stopPropagation();
            onDateSelect(date);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.05)'; // SecondaryH4_05
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.1)';
          }}
          onTouchEnd={(e) => {
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
    
    /* ----------------------------------------
       CALENDAR DAYS - Current Month Days
       ---------------------------------------- */
    // Render current month's days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
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
            onDateSelect(date);
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
          onTouchStart={(e) => {
            if (!selected) {
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.1)';
            }
          }}
          onTouchEnd={(e) => {
            if (!selected) {
              e.currentTarget.style.backgroundColor = selected ? '#0F172A' : '';
            }
          }}
        >
          <span style={numberStyle}>
            {day}
          </span>
        </div>
      );
    }
    
    /* ----------------------------------------
       CALENDAR DAYS - Next Month Days
       ---------------------------------------- */
    // Calculate how many days from next month we need to fill the grid
    // We need 6 rows of 7 days = 42 total cells
    const totalCells = 42;
    const filledCells = firstDayOfWeek + lastDay.getDate();
    const nextMonthDays = totalCells - filledCells;
    
    // Render next month's days
    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, day);
      
      days.push(
        <div 
          key={`next-${day}`}
          style={baseContainerStyle}
          onClick={(e) => {
            e.stopPropagation();
            onDateSelect(date);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.05)'; // SecondaryH4_05
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.1)';
          }}
          onTouchEnd={(e) => {
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

  /* ----------------------------------------
     ----------------------------------------
     COMPONENT RENDER - Main JSX Structure
     ----------------------------------------
     ---------------------------------------- */
  return (
    <div className={`date-picker-calendar ${styles.container}`}>
      {/* Date display with dropdown toggle */}
      <div 
        className="date-select-calendar"
        onClick={onToggleCalendar}
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
        
        {/* ----------------------------------------
            DATE PICKER DROPDOWN - Calendar UI
            ---------------------------------------- */}
        {isOpen && (
          <div 
            ref={dropdownRef}
            className="calendar-container"
            style={{
              top: dropdownPosition.top,
              bottom: dropdownPosition.bottom,
              left: dropdownPosition.left,
              right: dropdownPosition.right,
              width: dropdownPosition.width,
              maxHeight: dropdownPosition.maxHeight
            }}
          >
            {/* Month header with navigation */}
            <div className="calendar-month-header">
              {/* Previous month button */}
              <button 
                className="month-nav-button"
                onClick={(e) => navigateMonth(-1, e)}
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
              <div className="calendar-month-label">
                {new Date(currentViewMonth.getFullYear(), currentViewMonth.getMonth()).toLocaleString('default', { month: 'long' })}
              </div>
              
              {/* Next month button */}
              <button 
                className="month-nav-button"
                onClick={(e) => navigateMonth(1, e)}
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
            
            {/* ----------------------------------------
                CALENDAR MONTH CONTENT - Days grid
                ---------------------------------------- */}
            {/* Calendar content */}
            <div className="calendar-content">
              {/* Weekday headers with direct Calendar_Medium styling */}
              <div className="weekday-header">
                {/* Monday through Sunday abbreviated with Calendar_Medium styling */}
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                  <div 
                    key={`weekday-${index}`}
                    className="weekday-cell"
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* ----------------------------------------
                  CALENDAR DAYS GRID - Date selection
                  ---------------------------------------- */}
              {/* Calendar days grid */}
              <div className="calendar-days">
                {/* Generate calendar days with direct styling */}
                {generateDaysWithStyles()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------------------------------
          ----------------------------------------
          COMPONENT STYLES - CSS-in-JSX Styling
          ----------------------------------------
          ---------------------------------------- */}
      <style jsx>{`
        /* ==========================================
           DATE PICKER STYLES - Calendar dropdown
           ========================================== */
        .date-picker-calendar {
          position: relative;
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
          transition: background-color 0.2s ease;
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
        
        /* ==========================================
           CALENDAR CONTAINER STYLES
           ========================================== */
        .calendar-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px;
          position: absolute;
          width: ${isMobile ? '328px' : '276px'};
          z-index: 10;
          background: var(--baseWhite);
          border: 1px solid rgba(94, 94, 94, 0.1);
          box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          transition: max-height 0.2s ease;
          /* Position is now managed dynamically via inline styles */
        }
        
        .calendar-month-header {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          gap: 2px;
          width: ${isMobile ? '328px' : '276px'};
          height: ${isMobile ? '56px' : '44px'};
          border-bottom: 1px solid rgba(94, 94, 94, 0.1);
        }
        
        .month-nav-button {
          width: ${isMobile ? '44px' : '20px'};
          height: ${isMobile ? '44px' : '20px'};
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
        
        .month-nav-button:active {
          background-color: rgba(15, 23, 42, 0.1);
        }
        
        .calendar-month-label {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: ${isMobile ? '15px' : '13.6px'};
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
          padding: 0px 4px 4px 4px;
          width: ${isMobile ? '328px' : '276px'};
        }
        
        .weekday-header {
          display: grid;
          grid-template-columns: repeat(7, ${isMobile ? '44px' : '36px'});
          grid-gap: 2px;
          width: ${isMobile ? '320px' : '268px'};
          justify-content: space-between;
          margin-bottom: 2px;
        }
        
        .weekday-cell {
          display: flex;
          justify-content: center;
          align-items: center;
          width: ${isMobile ? '44px' : '36px'};
          height: ${isMobile ? '44px' : '36px'};
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: ${isMobile ? '16px' : '10px'};
          font-weight: 500;
          line-height: 20px;
          color: rgba(15, 23, 42, 0.4);
        }
        
        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, ${isMobile ? '44px' : '36px'});
          grid-gap: 2px;
          width: ${isMobile ? '320px' : '268px'};
          justify-content: space-between;
        }
        
        @media (max-width: 767px) {
          .month-nav-button:hover {
            background-color: transparent;
          }
          
          .month-nav-button:active {
            background-color: rgba(15, 23, 42, 0.1);
          }
        }
        
        @media (max-width: 359px) {
          .calendar-container {
            width: calc(100vw - 32px);
            max-width: 328px;
          }
          
          .calendar-month-header {
            width: 100% !important;
          }
          
          .calendar-content {
            width: 100% !important;
          }
          
          .weekday-header, .calendar-days {
            width: calc(100% - 8px) !important;
            justify-content: space-between;
          }
        }
        
        @media (max-height: 600px) {
          .calendar-container {
            overflow-y: auto;
            max-height: 90vh !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DatePickerCalendar; 