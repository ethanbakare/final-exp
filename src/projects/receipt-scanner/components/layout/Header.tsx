import React, { useState } from 'react';
import styles from '../../styles/Components.module.css';

interface HeaderProps {
  initialActiveTab?: 'scan' | 'speak';
  onTabChange?: (tab: 'scan' | 'speak') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  initialActiveTab = 'scan', 
  onTabChange 
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'speak'>(initialActiveTab);

  const handleTabClick = (tab: 'scan' | 'speak') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className={`header-container ${styles.container}`}>
      <div className={`tab scan-receipt-tab ${activeTab === 'scan' ? 'active' : 'inactive'}`} 
           onClick={() => handleTabClick('scan')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="receipt-icon">
          <g clipPath="url(#clip0_250_311)">
            <path d="M19.5 3.5L18 2L16.5 3.5L15 2L13.5 3.5L12 2L10.5 3.5L9 2L7.5 3.5L6 2V16H3V19C3 20.66 4.34 22 6 22H18C19.66 22 21 20.66 21 19V2L19.5 3.5ZM15 20H6C5.45 20 5 19.55 5 19V18H15V20ZM19 19C19 19.55 18.55 20 18 20C17.45 20 17 19.55 17 19V16H8V5H19V19Z" fill="rgba(46, 41, 28, 0.8)"/>
            <path d="M15 7H9V9H15V7Z" fill="rgba(46, 41, 28, 0.8)"/>
            <path d="M18 7H16V9H18V7Z" fill="rgba(46, 41, 28, 0.8)"/>
            <path d="M15 10H9V12H15V10Z" fill="rgba(46, 41, 28, 0.8)"/>
            <path d="M18 10H16V12H18V10Z" fill="rgba(46, 41, 28, 0.8)"/>
          </g>
          <defs>
            <clipPath id="clip0_250_311">
              <rect width="24" height="24" fill="white"/>
            </clipPath>
          </defs>
        </svg>
        <span className={`tab-text ${styles.headerH1Medium}`}>Scan receipt</span>
      </div>
      
      <div className={`tab speak-type-tab ${activeTab === 'speak' ? 'active' : 'inactive'}`}
           onClick={() => handleTabClick('speak')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mic-icon">
          <g clipPath="url(#clip0_252_298)">
            <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM11 5C11 4.45 11.45 4 12 4C12.55 4 13 4.45 13 5V11C13 11.55 12.55 12 12 12C11.45 12 11 11.55 11 11V5ZM17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17V11Z" fill="rgba(46, 41, 28, 0.8)"/>
          </g>
          <defs>
            <clipPath id="clip0_252_298">
              <rect width="24" height="24" fill="white"/>
            </clipPath>
          </defs>
        </svg>
        <span className={`tab-text ${styles.headerH1Medium}`}>Speak or Type</span>
      </div>

      <style jsx>{`
        .header-container {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 0px;
          gap: 0px;
          width: 100%;
          height: 34px;
          flex: none;
          order: 0;
          align-self: stretch;
          flex-grow: 0;
        }

        .tab {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 5px 0px;
          gap: 8px;
          width: 50%;
          height: 34px;
          flex: none;
          flex-grow: 1;
          cursor: pointer;
        }

        .scan-receipt-tab.active {
          border-bottom: 1.5px solid var(--orangeElectric);
        }

        .speak-type-tab.active {
          border-bottom: 1.5px solid var(--orangeElectric);
        }

        .tab.inactive {
          opacity: 0.4;
          border-bottom: 1.5px solid var(--darkGrey50);
        }

        .tab :global(svg) {
          width: 24px;
          height: 24px;
          flex: none;
          order: 0;
          flex-grow: 0;
        }

        .tab-text {
          text-align: center;
          color: rgba(46, 41, 28, 0.8);
          flex: none;
          order: 1;
          flex-grow: 0;
        }
      `}</style>
    </div>
  );
};

export default Header;
