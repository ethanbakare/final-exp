import React, { useState, useEffect, useRef } from 'react';
import { useSectionLoading } from '@/hooks/useSectionLoading';

interface MenuItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string
  active?: boolean
}

const MenuItem = React.forwardRef<HTMLAnchorElement, MenuItemProps>(
  ({ href, active, children, ...props }, ref) => {
    const menuItemStyle: React.CSSProperties = {
      display: "inline-flex",
      height: "auto",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "8px",
      padding: "6px 12px",
      fontSize: "14px",
      fontWeight: "500",
      color: "white",
      fontFamily:
        "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      transition: "background-color 0.2s ease",
      textDecoration: "none",
      backgroundColor: active ? "rgba(255, 255, 255, 0.1)" : "transparent",
    }

    const hoverStyle: React.CSSProperties = {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    }

    const [isHovered, setIsHovered] = useState(false)

    return (
      <a
        ref={ref}
        href={href}
        style={{
          ...menuItemStyle,
          ...(isHovered ? hoverStyle : {}),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {children}
      </a>
    )
  },
)
MenuItem.displayName = "MenuItem"

const MainNavBar: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home');
  const navRef = useRef<HTMLDivElement>(null);
  
  // Report loading status to LoadingContext
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isLoaded } = useSectionLoading('MainNavBar', [true]);
  
  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      // Get all main sections to determine which one is in view
      const sections = {
        home: document.getElementById('home')?.offsetTop || 0,
        projects: document.getElementById('projects')?.offsetTop || 0,
        completed: document.getElementById('completed-projects')?.offsetTop || 0,
        how: document.getElementById('how-it-works')?.offsetTop || 0
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
      } else {
        setActiveSection('how');
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
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Smooth scroll to section
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

  // Style for the navbar exactly as provided
  const navStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)", // For Safari
    padding: "4px",
    zIndex: 10,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    position: "fixed",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    maxWidth: "90%",
    margin: "0 auto",
  }

  // For small screens
  const mobileNavStyle: React.CSSProperties = {
    ...navStyle,
    flexWrap: "wrap",
    justifyContent: "center",
    padding: "4px 8px",
  }

  // Use responsive styles based on screen size
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

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

  const currentNavStyle = windowWidth <= 768 ? mobileNavStyle : navStyle;

  return (
    <div ref={navRef} style={{ padding: "0 16px", width: "100%", boxSizing: "border-box", position: "absolute", top: 0, zIndex: 1000 }}>
      <nav style={currentNavStyle}>
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
          Profiles
        </MenuItem>
        <MenuItem 
          href="#about" 
          active={activeSection === 'about'} 
          onClick={(e) => scrollToSection(e, 'about')}
        >
          About
        </MenuItem>
      </nav>
    </div>
  );
};

export default MainNavBar; 