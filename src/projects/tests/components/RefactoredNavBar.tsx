import React, { useState, useEffect, useRef } from 'react';
import styles from '@/projects/home/styles/HomePage.module.css';
import { useSectionLoading } from '@/hooks/useSectionLoading';
import Image from 'next/image';

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
          <div className={`menu-item-content ${styles.InterMedium14_H1}`}>
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
            background-color: rgba(255, 255, 255, 0.1);
            opacity: ${isHovered && !active ? '1' : '0'};
            transition: opacity 0.2s ease;
          }
          
          .menu-item-content {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 12px;
            height: 100%;
            color: white;
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
            background-color: rgba(255, 255, 255, 0.05);
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
// MAIN NAVBAR COMPONENT
// ----------------------------------------
const RefactoredNavBar: React.FC = () => {
  // ----------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------
  const [activeSection, setActiveSection] = useState('home');
  const [windowWidth, setWindowWidth] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  // Report loading status to LoadingContext
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isLoaded } = useSectionLoading('MainNavBar', [true]);
  
  // Client-side detection effect
  useEffect(() => {
    setIsClient(true);
    setWindowWidth(window.innerWidth);
  }, []);
  
  // ----------------------------------------
  // SCROLL TRACKING EFFECT
  // ----------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      // Get all main sections to determine which one is in view
      const sections = {
        home: document.getElementById('home')?.offsetTop || 0,
        projects: document.getElementById('projects')?.offsetTop || 0,
        completed: document.getElementById('completed-projects')?.offsetTop || 0,
        how: document.getElementById('how-it-works')?.offsetTop || 0,
        about: document.getElementById('about')?.offsetTop || 0
      };
      
      // Add a buffer to make the detection a bit more forgiving
      const buffer = 200;
      const scrollPosition = window.scrollY + buffer;
      
      // Determine active section based on scroll position
      if (scrollPosition < sections.projects) {
        setActiveSection('home');
      } else if (scrollPosition < sections.completed) {
        setActiveSection('projects');
      } else if (scrollPosition < sections.how) {
        setActiveSection('completed');
      } else if (scrollPosition < sections.about) {
        setActiveSection('how');
      } else {
        setActiveSection('about');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Set up section IDs if they don't exist
    if (!document.getElementById('home')) {
      const heroSection = document.querySelector('.hero_banner');
      if (heroSection) heroSection.id = 'home';
    }
    
    if (!document.getElementById('projects')) {
      const projectSection = document.querySelector('.project_body');
      if (projectSection) projectSection.id = 'projects';
    }
    
    if (!document.getElementById('completed-projects')) {
      const completedSection = document.querySelector('.completed_build_body');
      if (completedSection) completedSection.id = 'completed-projects';
    }
    
    if (!document.getElementById('how-it-works')) {
      const howSection = document.querySelector('.howitworks_body');
      if (howSection) howSection.id = 'how-it-works';
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
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

  // ----------------------------------------
  // SMOOTH SCROLL FUNCTION
  // ----------------------------------------
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) return;
    
    const startPosition = window.pageYOffset;
    const targetPosition = targetSection.getBoundingClientRect().top + startPosition;
    const distance = targetPosition - startPosition;
    const duration = 1000; // ms
    let startTime: number | null = null;
    
    // Easing function for smooth acceleration and deceleration
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    const animateScroll = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);
      
      window.scrollTo(0, startPosition + distance * easeProgress);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animateScroll);
      }
    };
    
    requestAnimationFrame(animateScroll);
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
            {/* Logo */}
            <div 
              className="logo-container focus-visible-only" 
              onClick={(e) => {
                scrollToSection(e as unknown as React.MouseEvent<HTMLAnchorElement>, 'about');
                // Remove focus after click
                (e.target as HTMLElement).blur();
              }}
              role="button"
              tabIndex={0}
              aria-label="Scroll to About section"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  scrollToSection(e as unknown as React.MouseEvent<HTMLAnchorElement>, 'about');
                }
              }}
            >
              <Image 
                src="/images/portrait.png" 
                alt="Profile" 
                className="logo-image"
                width={33}
                height={33}
                style={{ borderRadius: '50%' }}
              />
            </div>

            {/* Desktop Navigation */}
            <nav className={isClient && windowWidth <= 768 ? 'subnavbar-main hidden' : 'subnavbar-main'}>
              <MenuItem 
                href="#home" 
                active={activeSection === 'home'} 
                onClick={(e) => scrollToSection(e, 'home')}
              >
                Home
              </MenuItem>
              <MenuItem 
                href="#projects" 
                active={activeSection === 'projects'} 
                onClick={(e) => scrollToSection(e, 'projects')}
              >
                Projects
              </MenuItem>
              <MenuItem 
                href="#completed-projects" 
                active={activeSection === 'completed'} 
                onClick={(e) => scrollToSection(e, 'completed-projects')}
              >
                Rules
              </MenuItem>
              <MenuItem 
                href="#how-it-works" 
                active={activeSection === 'how'} 
                onClick={(e) => scrollToSection(e, 'how-it-works')}
              >
                About
              </MenuItem>
              <MenuItem 
                href="#about" 
                active={activeSection === 'about'} 
                onClick={(e) => scrollToSection(e, 'about')}
              >
                More
              </MenuItem>
            </nav>
          </div>
          
          <div className="navbar-right">
            {/* Contact Button */}
            <a 
              href="mailto:iamethanbakare@gmail.com"
              className={`subnavbar-contact ${isClient && windowWidth <= 768 ? 'mobile' : ''}`}
            >
              <span className={styles.InterMedium14_H1}>Contact</span>
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
                href="#home" 
                active={activeSection === 'home'} 
                onClick={(e) => handleMobileMenuItemClick(e, 'home')}
              >
                Home
              </MenuItem>
              <MenuItem 
                href="#projects" 
                active={activeSection === 'projects'} 
                onClick={(e) => handleMobileMenuItemClick(e, 'projects')}
              >
                Projects
              </MenuItem>
              <MenuItem 
                href="#completed-projects" 
                active={activeSection === 'completed'} 
                onClick={(e) => handleMobileMenuItemClick(e, 'completed-projects')}
              >
                Rules
              </MenuItem>
              <MenuItem 
                href="#how-it-works" 
                active={activeSection === 'how'} 
                onClick={(e) => handleMobileMenuItemClick(e, 'how-it-works')}
              >
                About
              </MenuItem>
              <MenuItem 
                href="#about" 
                active={activeSection === 'about'} 
                onClick={(e) => handleMobileMenuItemClick(e, 'about')}
              >
                More
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
          background: #141414;  /* Fallback */
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

        /* Logo container and image styles */
        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 33px;
          width: 33px;
          margin-right: 32px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .logo-container:hover {
          transform: scale(1.05);
        }

        /* Only show focus styles when using keyboard navigation */
        .focus-visible-only:focus:not(:focus-visible) {
          outline: none;
        }

        .focus-visible-only:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.3);
          outline-offset: 2px;
        }
        
        .logo-image {
          height: 100%;
          width: 100%;
          object-fit: cover;
          border-radius: 50%;
          border: 0px solid rgba(255, 255, 255, 0.1);
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
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.05);
          padding: 4px 12px;
          height: 38px;
          text-decoration: none;
          transition: background-color 0.2s ease;
          cursor: pointer;
        }

        .subnavbar-contact:hover {
          background-color: rgba(255, 255, 255, 0.2);
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
          border: 1px solid rgba(255, 255, 255, 0); /* Transparent border initially */
          background-color: rgba(255, 255, 255, 0);
          border-radius: 8px;
          cursor: pointer;
          margin-left: 10px;
          margin-right: 0;
          transition: border-color 0.3s ease; /* Transition only the border color */
        }

        /* Add border when expanded */
        .hamburger-button[aria-expanded="true"] {
          border-color: rgba(255, 255, 255, 0.1); /* Only change the color, not the border itself */
          background-color: rgba(255, 255, 255, 0.05);
        }

        .hamburger-line {
          width: 18px;
          height: 2px;
          background-color: white;
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
          top: 70px; /* Position below the navbar */
          right: 10px; /* Position from the right with margin */
          left: auto; /* Remove left positioning */
          width: 60%;
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
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
        .subnavbar-main.mobile,
        .subnavbar-contact.mobile {
          flex-wrap: wrap;
          justify-content: center;
          padding: 4px 8px;
        }

        /* Modern browsers - gradient blur effect */
        @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
          .navbar {
            background: linear-gradient(
              to bottom,
              rgba(20, 20, 20, 0.1) 0%,
              rgba(20, 20, 20, 0.1) 70%,
              rgba(20, 20, 20, 0) 100%
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

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .navbar-content {
            flex-direction: row;
            align-items: center;
          }

          .subnavbar-contact {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default RefactoredNavBar; 