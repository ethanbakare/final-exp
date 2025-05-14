import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ----------------------------------------
// MENU ITEM COMPONENT
// ----------------------------------------
interface MenuItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string;
  active?: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const MenuItem = React.forwardRef<HTMLAnchorElement, MenuItemProps>(
  ({ href, active, onClick, children, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <>
        <a
          ref={ref}
          href={href}
          onClick={onClick}
          className={`menu-item ${active ? 'active' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          {...props}
        >
          <div className="menu-item-content">
            {children}
          </div>
          {active && <div className="active-background"></div>}
        </a>
        <style jsx>{`
          .menu-item {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            height: 28px;
            transition: 0.2s ease;
          }
          
          .menu-item::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60%;
            height: 2px;
            background-color: rgba(82, 82, 82, 0.1);
            opacity: ${isHovered && !active ? '1' : '0'};
            transition: opacity 0.2s ease;
          }
          
          .menu-item-content {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 12px;
            height: 100%;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            color: #525252;
            opacity: ${active ? '1' : '0.65'};
            text-decoration: none;
            z-index: 2;
            transition: opacity 0.2s ease;
          }
          
          .menu-item:hover .menu-item-content {
            opacity: ${active ? '1' : '0.8'};
          }
          
          .active-background {
            position: absolute;
            top: -6px;
            left: 0;
            right: 0;
            bottom: -6px;
            background-color: rgba(82, 82, 82, 0.05);
            z-index: 1;
            border-radius: 8px;
          }
        `}</style>
      </>
    );
  }
);
MenuItem.displayName = "MenuItem";

// ----------------------------------------
// SUBPROJECT NAVBAR COMPONENT
// ----------------------------------------
const SubProjectNavbar: React.FC = () => {
  const [activeSection, setActiveSection] = useState('section1');
  const [windowWidth, setWindowWidth] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  // Client-side detection effect
  useEffect(() => {
    setIsClient(true);
    setWindowWidth(window.innerWidth);
  }, []);
  
  // ----------------------------------------
  // WINDOW RESIZE EFFECT
  // ----------------------------------------
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Dummy section navigation - can be expanded later
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    setActiveSection(sectionId);
    // Actual scrolling functionality can be added here when sections exist
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      // Start closing animation
      setIsMenuClosing(true);
      // After animation completes, actually close the menu
      setTimeout(() => {
        setIsMobileMenuOpen(false);
        setIsMenuClosing(false);
      }, 300); // Animation duration
    } else {
      setIsMobileMenuOpen(true);
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        !isMenuClosing &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.hamburger-button')
      ) {
        // Start closing animation
        setIsMenuClosing(true);
        // After animation completes, actually close the menu
        setTimeout(() => {
          setIsMobileMenuOpen(false);
          setIsMenuClosing(false);
        }, 300);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, isMenuClosing]);

  // Close mobile menu when a menu item is clicked
  const handleMobileMenuItemClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    scrollToSection(e, sectionId);
    
    // Start closing animation
    setIsMenuClosing(true);
    // After animation completes, actually close the menu
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsMenuClosing(false);
    }, 300);
  };

  // ----------------------------------------
  // COMPONENT RENDER
  // ----------------------------------------
  return (
    <div className="wrapper" ref={navRef}>
      <div className="navbar">
        <div className="navbar-content">
          <div className="navbar-left">
            {/* Back to Home Link */}
            <Link href="/" passHref legacyBehavior>
              <a className="back-home-link">
                <div className="back-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 8H1M1 8L8 15M1 8L8 1" stroke="#525252" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span>Back to Home</span>
              </a>
            </Link>

            {/* Desktop Navigation */}
            <nav className={isClient && windowWidth <= 768 ? 'subnavbar-main hidden' : 'subnavbar-main'}>
              <MenuItem 
                href="#section1" 
                active={activeSection === 'section1'} 
                onClick={(e) => scrollToSection(e, 'section1')}
              >
                Section 1
              </MenuItem>
              <MenuItem 
                href="#section2" 
                active={activeSection === 'section2'} 
                onClick={(e) => scrollToSection(e, 'section2')}
              >
                Section 2
              </MenuItem>
              <MenuItem 
                href="#section3" 
                active={activeSection === 'section3'} 
                onClick={(e) => scrollToSection(e, 'section3')}
              >
                Section 3
              </MenuItem>
              <MenuItem 
                href="#section4" 
                active={activeSection === 'section4'} 
                onClick={(e) => scrollToSection(e, 'section4')}
              >
                Section 4
              </MenuItem>
              <MenuItem 
                href="#section5" 
                active={activeSection === 'section5'} 
                onClick={(e) => scrollToSection(e, 'section5')}
              >
                Section 5
              </MenuItem>
            </nav>
          </div>
          
          <div className="navbar-right">
            {/* Contact Button */}
            <a 
              href="mailto:iamethanbakare@gmail.com"
              className={`subnavbar-contact ${isClient && windowWidth <= 768 ? 'mobile' : ''}`}
            >
              <span>Contact</span>
            </a>
            
            {/* Mobile Hamburger Button */}
            {isClient && windowWidth <= 768 && (
              <button 
                className="hamburger-button" 
                onClick={toggleMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-label="Menu"
                aria-controls="mobile-menu"
              >
                <span className="hamburger-line" aria-hidden="true"></span>
                <span className="hamburger-line" aria-hidden="true"></span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && windowWidth <= 768 && (
          <div 
            className={`mobile-dropdown ${isMenuClosing ? 'closing' : ''}`} 
            ref={mobileMenuRef}
          >
            <nav className="mobile-menu">
              <MenuItem 
                href="#section1" 
                active={activeSection === 'section1'} 
                onClick={(e) => handleMobileMenuItemClick(e, 'section1')}
              >
                Section 1
              </MenuItem>
              <MenuItem 
                href="#section2" 
                active={activeSection === 'section2'} 
                onClick={(e) => handleMobileMenuItemClick(e, 'section2')}
              >
                Section 2
              </MenuItem>
              <MenuItem 
                href="#section3" 
                active={activeSection === 'section3'} 
                onClick={(e) => handleMobileMenuItemClick(e, 'section3')}
              >
                Section 3
              </MenuItem>
              <MenuItem 
                href="#section4" 
                active={activeSection === 'section4'} 
                onClick={(e) => handleMobileMenuItemClick(e, 'section4')}
              >
                Section 4
              </MenuItem>
              <MenuItem 
                href="#section5" 
                active={activeSection === 'section5'} 
                onClick={(e) => handleMobileMenuItemClick(e, 'section5')}
              >
                Section 5
              </MenuItem>
            </nav>
          </div>
        )}
      </div>

      <style jsx>{`
        .wrapper {
          padding: 0 16px;
          width: 100%;
          box-sizing: border-box;
          position: absolute;
          top: 0;
          z-index: 1000;
        }

        .navbar {
          width: 100%;
          margin: 0 auto;
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          padding: 10px 0px 20px 0px;
          background: rgba(248, 246, 240, 0.9);  /* Fallback for browsers without blur support */
        }

        .navbar::before {
          content: '';
          position: absolute;
          inset: 0;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          mask-image: linear-gradient(
            to bottom,
            black 0%,
            black 70%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to bottom,
            black 0%,
            black 70%,
            transparent 100%
          );
          z-index: -1;
        }

        /* Container for flexible layout */
        .navbar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 10px;
          box-sizing: border-box;
        }

        .navbar-left {
          display: flex;
          align-items: center;
        }

        .navbar-right {
          display: flex;
          align-items: center;
        }

        /* Back to home link styles */
        .back-home-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 33px;
          margin-right: 32px;
          cursor: pointer;
          transition: opacity 0.2s ease;
          text-decoration: none;
          color: #525252;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
        }

        .back-home-link:hover {
          opacity: 0.8;
        }

        .back-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Main navigation styles */
        .subnavbar-main {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border-radius: 10px;
          padding: 0px 4px;
          height: 38px;
          width: fit-content;
          margin: 0;
        }

        /* Contact navigation styles */
        .subnavbar-contact {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid rgba(82, 82, 82, 0.1);
          background-color: rgba(82, 82, 82, 0.05);
          padding: 4px 12px;
          height: 38px;
          color: #525252;
          text-decoration: none;
          transition: background-color 0.2s ease;
          cursor: pointer;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
        }

        .subnavbar-contact:hover {
          background-color: rgba(82, 82, 82, 0.1);
        }

        /* Hamburger button styles */
        .hamburger-button {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 6px;
          width: 38px;
          height: 38px;
          background: transparent;
          border: 1px solid rgba(82, 82, 82, 0); /* Transparent border initially */
          background-color: rgba(82, 82, 82, 0);
          border-radius: 8px;
          cursor: pointer;
          margin-left: 10px;
          margin-right: 0;
          transition: border-color 0.3s ease;
        }

        /* Add border when expanded */
        .hamburger-button[aria-expanded="true"] {
          border-color: rgba(82, 82, 82, 0.1);
          background-color: rgba(82, 82, 82, 0.05);
        }

        .hamburger-line {
          width: 18px;
          height: 2px;
          background-color: #525252;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        /* Animation for open state */
        .hamburger-button[aria-expanded="true"] .hamburger-line:first-child {
          transform: translateY(4px) rotate(45deg);
        }

        .hamburger-button[aria-expanded="true"] .hamburger-line:last-child {
          transform: translateY(-4px) rotate(-45deg);
        }

        /* Mobile dropdown styles */
        .mobile-dropdown {
          position: absolute;
          top: 70px;
          right: 10px;
          left: auto;
          width: 60%;
          background-color: rgba(248, 246, 240, 0.95);
          border: 1px solid rgba(82, 82, 82, 0.05);
          border-radius: 10px;
          z-index: 20;
          overflow: hidden;
          animation: dropdownFadeIn 0.3s ease;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .mobile-dropdown.closing {
          animation: dropdownFadeOut 0.3s ease forwards;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dropdownFadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }

        .mobile-menu {
          display: flex;
          flex-direction: column;
          padding: 10px;
          gap: 16px;
        }

        /* Utility classes */
        .hidden {
          display: none;
        }

        /* Mobile styles */
        @media (max-width: 768px) {
          .back-home-link {
            margin-right: 16px;
          }
          
          .navbar-content {
            flex-direction: row;
            align-items: center;
          }

          .subnavbar-contact {
            margin-left: 0;
          }
        }
        
        /* Modern browsers - gradient blur effect */
        @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
          .navbar {
            background: linear-gradient(
              to bottom,
              rgba(248, 246, 240, 0.1) 0%,
              rgba(248, 246, 240, 0.1) 70%,
              rgba(248, 246, 240, 0) 100%
            );
          }

          .navbar::before {
            content: '';
            position: absolute;
            inset: 0;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            mask-image: linear-gradient(
              to bottom,
              black 0%,
              black 70%,
              transparent 100%
            );
            -webkit-mask-image: linear-gradient(
              to bottom,
              black 0%,
              black 70%,
              transparent 100%
            );
            z-index: -1;
          }
        }
      `}</style>
    </div>
  );
};

export default SubProjectNavbar; 