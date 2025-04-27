import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from '../styles/HomePage.module.css';
import { motion } from 'framer-motion';
import { useCurrentProject, useProjectItems, FOCUS_BADGE_COLORS } from '@/hooks/useProjects';
import ProjectDetailModal from './ProjectDetailModal';
import { useSectionLoading } from '@/hooks/useSectionLoading';
import { useProjectProgress } from '@/hooks/useProjectProgress';

// Helper function to get the color values for a badge
const getBadgeColors = (colorName: string | undefined) => {
  const defaultColor = 'green';
  const color = colorName && FOCUS_BADGE_COLORS[colorName as keyof typeof FOCUS_BADGE_COLORS] 
    ? colorName as keyof typeof FOCUS_BADGE_COLORS 
    : defaultColor;
  return FOCUS_BADGE_COLORS[color];
};

// Tooltip component for focus badges using portals for reliable positioning
const FocusBadgeTooltip = ({ 
  children, 
  colorName,
  tooltipText
}: { 
  children: React.ReactNode,
  colorName?: string,
  tooltipText?: string
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ 
    top: 0, 
    left: 0,
    bottom: 0
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle component mount state for client-side rendering
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  const handleMouseEnter = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a brief delay before showing the tooltip
    timerRef.current = setTimeout(() => {
      setShowTooltip(true);
      updateTooltipPosition();
    }, 200); // 200ms delay
  };
  
  const handleMouseLeave = () => {
    // Clear the timer if mouse leaves before tooltip is shown
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowTooltip(false);
  };
  
  // Handle tap/click for mobile devices
  const handleTap = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent document click from immediately closing tooltip
    
    if (showTooltip) {
      setShowTooltip(false);
    } else {
      setShowTooltip(true);
      // We need to calculate position after setting state
      setTimeout(updateTooltipPosition, 0);
    }
  };
  
  // Update tooltip position based on badge position
  const updateTooltipPosition = () => {
    if (!triggerRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 281; // Width of tooltip
    
    // Use bottom-up positioning - position tooltip ABOVE the badge
    // We don't need to estimate height since we're positioning from the bottom up
    let left = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);
    
    // Apply boundary corrections to keep tooltip within viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Ensure tooltip doesn't go off right edge
    if (left + tooltipWidth > viewport.width - 10) {
      left = viewport.width - tooltipWidth - 10;
    }
    
    // Ensure tooltip doesn't go off left edge
    if (left < 10) {
      left = 10;
    }
    
    // Position from the bottom of the trigger element
    // The space between badge top and tooltip bottom is fixed
    const bottom = window.innerHeight - triggerRect.top + 12; // 12px spacing
    
    // Use bottom positioning which doesn't depend on tooltip height
    setTooltipPosition({ 
      bottom: bottom,
      left: left,
      top: 0 // We're using bottom positioning, but include top for type compatibility
    });
  };
  
  // Handle clicks outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    
    // Only add the event listener if tooltip is showing
    if (showTooltip) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showTooltip]);
  
  // Recalculate position on window resize
  useEffect(() => {
    if (!showTooltip) return;
    
    const handleResize = () => {
      updateTooltipPosition();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [showTooltip]);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  return (
    <>
      <div 
        ref={triggerRef}
        className="focus-badge-tooltip-container"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleTap}
        role="button"
        tabIndex={0}
        aria-expanded={showTooltip}
      >
        {children}
      </div>
      
      {/* Portal for tooltip to avoid positioning constraints */}
      {isMounted && showTooltip && ReactDOM.createPortal(
        <div 
          ref={tooltipRef}
          className="portal-tooltip"
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            bottom: `${tooltipPosition.bottom}px`,
            left: `${tooltipPosition.left}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '281px',
            height: 'auto',
            minHeight: '38px',
            padding: '4px 8px',
            background: 'rgba(16, 16, 16, 0.95)',
            boxShadow: '0px 4px 10.7px rgba(0, 0, 0, 0.1)',
            borderRadius: '6px',
            zIndex: 9999,
            opacity: 0,
            transformOrigin: 'center bottom',
            animation: 'tooltipFadeIn 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
          }}
        >
          <p style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: window.innerWidth <= 768 ? '14px' : '13.6px',
            lineHeight: '1.4',
            textAlign: 'center',
            color: '#FFFFFF',
            margin: '0',
            padding: '0',
            width: window.innerWidth <= 768 ? '240px' : '265px',
            whiteSpace: 'normal'
          }}>
            {tooltipText || getBadgeColors(colorName).description}
          </p>
        </div>,
        document.body
      )}
      
      <style jsx global>{`
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: scaleY(0.7) translateY(30%);
          }
          to {
            opacity: 1;
            transform: scaleY(1) translateY(0);
          }
        }
        
        .focus-badge-tooltip-container {
          position: relative;
          display: inline-flex;
          cursor: pointer;
          outline: none;
        }
      `}</style>
    </>
  );
};

const ProjectBody: React.FC = () => {
  const { currentProject, loading: currentLoading, error: currentError } = useCurrentProject();
  const { 
    projects, 
    loading: projectsLoading, 
    error: projectsError, 
    handleVote,
    hasReachedVoteLimit 
  } = useProjectItems();
  
  // Add useProjectProgress hook to fetch progress data
  const { 
    data: projectProgress, 
    loading: progressLoading, 
    error: progressError 
  } = useProjectProgress(currentProject?.projectProgressId);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Integrate with loading context
  const dataLoaded = !currentLoading && !projectsLoading && !progressLoading;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isLoaded } = useSectionLoading('ProjectBody', [dataLoaded]);
  
  // Handle errors but don't display loading state (handled by LoadingScreen)
  const hasError = currentError || projectsError || progressError;
  
  if (hasError) {
    return <div className="error-state">Error loading content: {currentError || projectsError || progressError}</div>;
  }

  return (
    <div className="project_body">
      {/* ----------------------------------------
          ----------------------------------------
          SECTION TITLE - Current Project Header
          ----------------------------------------
          ---------------------------------------- */}
      <div className="section_container">
        <h2 className={`${styles.FrankRuhlLibre48} section_title`}>This week&apos;s build</h2>
        <p className={`${styles.InterRegular26} section_subtitle`}>Week 1 of 13</p>
      </div>
      
      {/* ----------------------------------------
          ----------------------------------------
          CURRENT PROJECT CARD - Project details
          ----------------------------------------
          Main card containing project information
          Title, description, days left, question
          ----------------------------------------
          ---------------------------------------- */}
      <div className="day_current_container">
        <div className="day_current_card">
          {/* ----------------------------------------
              DAY HEADER - Project title and time badge
              ---------------------------------------- */}
          <div className="day_header">
            <div className="day_header_text">
              <h3 className={`${styles.InterRegular28}`}>{currentProject?.title || 'Loading...'}</h3>
              <p className={`${styles.InterRegular20_H1}`}>{currentProject?.subtitle || ''}</p>
            </div>
            <div className="date_and_time_badge">
              <div className="date_badge">
                <span className={`${styles.InterRegular14}`}>{currentProject?.dateRange || 'TBD'}</span>
              </div>
              <div className="day_badge">
                <div className="time_icon">
                  <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_2985_2040)">
                    <path d="M7.99301 1.83331C4.31301 1.83331 1.33301 4.81998 1.33301 8.49998C1.33301 12.18 4.31301 15.1666 7.99301 15.1666C11.6797 15.1666 14.6663 12.18 14.6663 8.49998C14.6663 4.81998 11.6797 1.83331 7.99301 1.83331ZM7.99967 13.8333C5.05301 13.8333 2.66634 11.4466 2.66634 8.49998C2.66634 5.55331 5.05301 3.16665 7.99967 3.16665C10.9463 3.16665 13.333 5.55331 13.333 8.49998C13.333 11.4466 10.9463 13.8333 7.99967 13.8333ZM7.85301 5.16665H7.81301C7.54634 5.16665 7.33301 5.37998 7.33301 5.64665V8.79331C7.33301 9.02665 7.45301 9.24665 7.65967 9.36665L10.4263 11.0266C10.653 11.16 10.9463 11.0933 11.0797 10.8666C11.2197 10.64 11.1463 10.34 10.913 10.2066L8.33301 8.67331V5.64665C8.33301 5.37998 8.11967 5.16665 7.85301 5.16665V5.16665Z" fill="white" fill-opacity="0.75"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_2985_2040">
                    <rect width="16" height="16" fill="white" transform="translate(0 0.5)"/>
                    </clipPath>
                    </defs>
                  </svg>
                </div>
                <span className={`${styles.InterRegular14}`}>{currentProject?.daysLeft || 0} days left</span>
              </div>
            </div>
          </div>
          
          {/* ----------------------------------------
              DAY BODY - Question and action button
              Main content and CTA button
              ---------------------------------------- */}
          <div className="day_body">
            <div className="day_body_text">
              <p className={`${styles.InterRegular20_H1}`}>
                {currentProject?.description || ''}
              </p>
              
              {/* Modal Linear Progress component */}
              {projectProgress && (
                <div className="modal_linear_progress">
                  {/* Progress Text: Shows percentage and task counts */}
                  <div className="molin_progress_text">
                    {/* <div className={`${styles.InterRegular16} progress_percentage`}>Progress {projectProgress.progressPercentage}%</div> */}
                    <div className={`${styles.InterRegular16} tasks_count`}>{projectProgress.completedTaskCount} of {projectProgress.totalTaskCount} tasks done</div>
                  </div>
                  {/* Progress Bar Visual */}
                  <div className="molin_progress_bar">
                    {/* Filled portion of the bar, width based on percentage */}
                    <div 
                      className="green_bar" 
                      style={{ 
                        width: `${projectProgress.progressPercentage}%`,
                        borderRadius: projectProgress.progressPercentage === 100 ? '32px' : '32px 0px 0px 32px'
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            <div className="day_button_container">
              <button className="day_button" onClick={() => setIsModalOpen(true)}>
                <span className={`${styles.InterRegular17}`}>View Details</span>
                <div className="plus_icon"></div>
              </button>
            </div>
          </div>
          
          {/* ----------------------------------------
              DAY FOOTER - Focus area badge
              Shows the project's primary focus
              ---------------------------------------- */}
          <div className="day_footer">
            <FocusBadgeTooltip colorName={currentProject?.focusBadge?.color} tooltipText={currentProject?.focusBadge?.tooltipText}>
              <div className="day_footer_badge" style={{ 
                backgroundColor: getBadgeColors(currentProject?.focusBadge?.color).background 
              }}>
                <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_1183_327)">
                    <path d="M7.33331 5.16683H8.66665V6.50016H7.33331V5.16683ZM7.99998 11.8335C8.36665 11.8335 8.66665 11.5335 8.66665 11.1668V8.50016C8.66665 8.1335 8.36665 7.8335 7.99998 7.8335C7.63331 7.8335 7.33331 8.1335 7.33331 8.50016V11.1668C7.33331 11.5335 7.63331 11.8335 7.99998 11.8335ZM7.99998 1.8335C4.31998 1.8335 1.33331 4.82016 1.33331 8.50016C1.33331 12.1802 4.31998 15.1668 7.99998 15.1668C11.68 15.1668 14.6666 12.1802 14.6666 8.50016C14.6666 4.82016 11.68 1.8335 7.99998 1.8335ZM7.99998 13.8335C5.05998 13.8335 2.66665 11.4402 2.66665 8.50016C2.66665 5.56016 5.05998 3.16683 7.99998 3.16683C10.94 3.16683 13.3333 5.56016 13.3333 8.50016C13.3333 11.4402 10.94 13.8335 7.99998 13.8335Z" 
                    fill={getBadgeColors(currentProject?.focusBadge?.color).iconBackground}
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_1183_327">
                      <rect width="16" height="16" fill="white" transform="translate(0 0.5)"/>
                    </clipPath>
                  </defs>
                </svg>
                <span className={`${styles.InterRegular14}`} style={{ 
                  color: getBadgeColors(currentProject?.focusBadge?.color).text 
                }}>
                  {currentProject?.focusBadge?.title || 'Reducing Friction'}
                </span>
              </div>
            </FocusBadgeTooltip>
          </div>
        </div>
      </div>

      {/* ----------------------------------------
          ----------------------------------------
          LIST SECTION TITLE - What's Next Header
          ----------------------------------------
          ---------------------------------------- */}
      <div id="whats-next" className="list_section_container">
        <h2 className={`${styles.FrankRuhlLibre48} list_section_title`}>Next week&apos;s build</h2>
        <p className={`${styles.InterRegular26} list_section_subtitle`}>Choose what gets built next.
        Top-voted idea locked in by Sunday </p>
      </div>

      {/* ************************************************
      *******************************************************
      ** VOTE LIMIT INDICATOR - CURRENTLY HIDDEN
      ** Displays remaining votes for the day and a reset button in dev mode
      ** Uncomment this section if you want to re-enable the vote limit feature
      *******************************************************
      ************************************************ */}
      {/* 
      {remainingVotes < 20 && (
        <div className="vote_limit_indicator">
          <p className={`${styles.InterRegular14}`}>
            {remainingVotes > 0 
              ? `You have ${remainingVotes} votes remaining today` 
              : 'You have reached your daily vote limit'}
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={() => {
                localStorage.removeItem('voteHistory');
                window.location.reload();
              }}
              className="reset_votes_button"
            >
              Reset Votes
            </button>
          )}
        </div>
      )}
      */}

      {/* Wrapper to handle overall list layout */}
      <div className="project_list_wrapper">
        {projects.map((project, index) => (
          <motion.div
            layout
            key={project.id}
            className="project_item_motion_wrapper" 
            transition={{ duration: 0.5, type: "spring", stiffness: 70 }}
            style={{ width: '100%', maxWidth: '856px' }}
          >

            {/* ----------------------------------------
                LIST CARD STYLES (Primary)
                ---------------------------------------- */}
            <div className={index === 0 ? "list_card" : "secondary_list_card"}>

              {/* ----------------------------------------
                  LIST MAIN STYLES
                  ---------------------------------------- */}
              <div className={index === 0 ? "list_main" : "secondary_list_main"}>

                {/* ----------------------------------------
                    LIST HEADER STYLES
                    ---------------------------------------- */}

                <div className={index === 0 ? "list_header" : "secondary_list_header"}>

                  {/* ----------------------------------------
                      LIST HEADER TEXT STYLES
                      ---------------------------------------- */}
                  <div className={index === 0 ? "list_header_text" : "secondary_list_header_text"}>
                    <h3 className={`${styles.InterRegular24_H1}`}>{project.title}</h3>
                  </div>

                  {/* ----------------------------------------
                      LIST HEADER BUTTONS STYLES
                      ---------------------------------------- */}
                  <div className={index === 0 ? "list_header_buttons" : "secondary_list_header_buttons"}>
                    <button 
                      className={index === 0 ? "vote_button" : "secondary_vote_button"}
                      onClick={() => handleVote(project.id)}
                      disabled={hasReachedVoteLimit()}
                      style={{ 
                        opacity: hasReachedVoteLimit() ? 0.5 : 1,
                        cursor: hasReachedVoteLimit() ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="vote_thumb_icon">
                        <g clipPath="url(#clip0_459_1823)">
                          <path d="M9 21.5312H18C18.83 21.5312 19.54 21.0312 19.84 20.3113L22.86 13.2612C22.95 13.0312 23 12.7913 23 12.5312V10.5312C23 9.43125 22.1 8.53125 21 8.53125H14.69L15.64 3.96125L15.67 3.64125C15.67 3.23125 15.5 2.85125 15.23 2.58125L14.17 1.53125L7.58 8.12125C7.22 8.48125 7 8.98125 7 9.53125V19.5312C7 20.6313 7.9 21.5312 9 21.5312ZM9 9.53125L13.34 5.19125L12 10.5312H21V12.5312L18 19.5312H9V9.53125ZM1 9.53125H5V21.5312H1V9.53125Z" />
                        </g>
                        <defs>
                          <clipPath id="clip0_459_1823">
                            <rect width="24" height="24" fill="white" transform="translate(0 0.53125)"/>
                          </clipPath>
                        </defs>
                      </svg>
                      <span className={`${styles.InterRegular18}`}>{project.votes}</span>
                    </button>
                  </div>
                </div>

                {/* ----------------------------------------
                    LIST BODY STYLES
                    ---------------------------------------- */}
                <p className={`${styles.InterRegular20_H1} ${index === 0 ? "list_body_text" : "secondary_list_body_text"}`}>
                  {project.description}
                </p>
              </div>  

              {/* ----------------------------------------
                  LIST FOOTER STYLES
                  ---------------------------------------- */}
              <div className={index === 0 ? "list_footer" : "secondary_list_footer"}>
                <div className={index === 0 ? "footer_day_badge" : "secondary_footer_day_badge"}>
                  <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_859_159)">
                      <path d="M13.3333 2.50002H12.6666V1.83335C12.6666 1.46669 12.3666 1.16669 11.9999 1.16669C11.6333 1.16669 11.3333 1.46669 11.3333 1.83335V2.50002H4.66659V1.83335C4.66659 1.46669 4.36659 1.16669 3.99992 1.16669C3.63325 1.16669 3.33325 1.46669 3.33325 1.83335V2.50002H2.66659C1.93325 2.50002 1.33325 3.10002 1.33325 3.83335V14.5C1.33325 15.2334 1.93325 15.8334 2.66659 15.8334H13.3333C14.0666 15.8334 14.6666 15.2334 14.6666 14.5V3.83335C14.6666 3.10002 14.0666 2.50002 13.3333 2.50002ZM12.6666 14.5H3.33325C2.96659 14.5 2.66659 14.2 2.66659 13.8334V5.83335H13.3333V13.8334C13.3333 14.2 13.0333 14.5 12.6666 14.5Z" fill="white" fillOpacity="0.75"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_859_159">
                        <rect width="16" height="16" fill="white" transform="translate(0 0.5)"/>
                      </clipPath>
                    </defs>
                  </svg>
                  <span className={`${styles.InterRegular14}`}>{project.days} days</span>
                </div>

                {/* ----------------------------------------
                    LIST FOOTER BADGE STYLES
                    ---------------------------------------- */}
                <FocusBadgeTooltip colorName={project.focusBadge?.color} tooltipText={project.focusBadge?.tooltipText}>
                  <div className={index === 0 ? "list_footer_badge" : "secondary_list_footer_badge"} style={{ 
                    backgroundColor: getBadgeColors(project.focusBadge?.color).background 
                  }}>
                    <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip0_1183_327)">
                        <path d="M7.33331 5.16683H8.66665V6.50016H7.33331V5.16683ZM7.99998 11.8335C8.36665 11.8335 8.66665 11.5335 8.66665 11.1668V8.50016C8.66665 8.1335 8.36665 7.8335 7.99998 7.8335C7.63331 7.8335 7.33331 8.1335 7.33331 8.50016V11.1668C7.33331 11.5335 7.63331 11.8335 7.99998 11.8335ZM7.99998 1.8335C4.31998 1.8335 1.33331 4.82016 1.33331 8.50016C1.33331 12.1802 4.31998 15.1668 7.99998 15.1668C11.68 15.1668 14.6666 12.1802 14.6666 8.50016C14.6666 4.82016 11.68 1.8335 7.99998 1.8335ZM7.99998 13.8335C5.05998 13.8335 2.66665 11.4402 2.66665 8.50016C2.66665 5.56016 5.05998 3.16683 7.99998 3.16683C10.94 3.16683 13.3333 5.56016 13.3333 8.50016C13.3333 11.4402 10.94 13.8335 7.99998 13.8335Z" 
                        fill={getBadgeColors(project.focusBadge?.color).iconBackground}
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_1183_327">
                          <rect width="16" height="16" fill="white" transform="translate(0 0.5)"/>
                        </clipPath>
                      </defs>
                    </svg>
                    <span className={`${styles.InterRegular14}`} style={{ 
                      color: getBadgeColors(project.focusBadge?.color).text 
                    }}>
                      {project.focusBadge?.title || 'Category'}
                    </span>
                  </div>
                </FocusBadgeTooltip>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ----------------------------------------
          ----------------------------------------
          COMPONENT STYLES - Project body section
          ----------------------------------------
          ---------------------------------------- */}
      <style jsx>{`
        /* ==========================================
           PROJECT BODY SECTION STYLES
           ========================================== */
        .project_body {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 800px;
          height: auto;
          background-color: var(--DarkSecondary);
          margin: 0 auto;
          padding: 72px 0px;
          align-items: center;
        }
        
        /* ==========================================
           SECTION CONTAINER STYLES - Title area
           ========================================== */
        .section_container {
          width: 100%;
          max-width: 1160px;
          padding: 52px 20px;
        }
        
        /* Section title */
        .section_title, .list_section_title {
          width: 100%;
          text-align: left;
          color: var(--WhiteOpacity);
          margin: 0;
        }

        .section_subtitle {
          color: var(--WhiteOpacity70);
          margin: 24px 0 0 0;
          text-align: left;
        }

        .list_section_container {
          width: 100%;
          max-width: 1160px;
          padding: 132px 20px 52px 20px;
        }
        
        .list_section_subtitle {
          color: var(--WhiteOpacity70);
          margin: 24px 0 0 0;
          text-align: left;
        }

        /* ==========================================
           CURRENT PROJECT CARD STYLES
           ========================================== */
        .day_current_container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 20px 10px;
          gap: 25px;
          width: 100%;
          max-width: 1160px;
          height: auto;
        }
        
        .day_current_card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 30px 50px 30px 30px;
          gap: 32px;
          width: 100%;
          max-width: 816px;
          height: auto;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
        }
        
        /* ----------------------------------------
           Day header - Title and time remaining badge
           ---------------------------------------- */
        .day_header {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px 0px 10px;
          gap: 10px;
          width: 100%;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .day_header_text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 5px;
          width: 100%;
          flex-grow: 1;
        }
        
        .day_header_text h3 {
          width: 100%;
          color: var(--WhiteOpacity);
          margin: 0;
        }
        
        .day_header_text p {
          width: 100%;
          color: var(--WhiteOpacity);
          margin: 0;
          text-align: left;
        }
        
        .date_and_time_badge {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px;
          gap: 12px;
          width: auto;
          height: auto;
        }
        
        .date_badge {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px 8px 4px 8px;
          gap: 10px;
          width: auto;
          height: auto;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          /* Transparent background as required */
          background: transparent;
        }
        
        .date_badge span {
          color: var(--WhiteOpacity75);
          white-space: nowrap;
          text-align: center;
          letter-spacing: -0.01em;
          vertical-align: middle;
        }
        
        .day_badge {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px 8px;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 6px;
        }
        
        .time_icon {
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
        }
    
        .day_badge span {
          color: var(--WhiteOpacity75);
          white-space: nowrap;
          text-align: center;
          letter-spacing: -0.01em;
          vertical-align: middle;
        }
        
        /* ----------------------------------------
           Day body - Question and button
           ---------------------------------------- */
        .day_body {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          width: 100%;
          // border: 1px solid red;
        }
        
        /* Day body text container */
        .day_body_text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px 0px 24px;
          gap: 25px;
          width: 100%;
        }
        
        /* Modal Linear Progress styles */
        .modal_linear_progress {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 10px 0px;
          width: 100%;
          max-width: 640px;
          gap: 8px;
        }
        
        /* Progress text container (holds percentage and count) */
        .molin_progress_text {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 0px;
          gap: 10px;
          width: 100%;
          height: 39px;
        }
        
        /* Progress percentage text */
        .progress_percentage {
          text-align: left;
          color: var(--WhiteOpacity70);
        }
        
        /* Tasks count text */
        .tasks_count {
          color: var(--WhiteOpacity70);
          text-align: right;
        }
        
        /* Progress bar container */
        .molin_progress_bar {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px;
          width: 100%;
          height: 8px;
          background: var(--WhiteOpacity10);
          border-radius: 12px;
        }
        
        /* Filled portion of the progress bar */
        .green_bar {
          height: 8px;
          background: var(--AccentGreenOpacity60);
          border-radius: 32px 0px 0px 32px;
          transition: width 0.5s ease;
        }
        
        /* Day body question text */
        .day_body_text p {
          width: 100%;
          color: var(--WhiteOpacity70);
          margin: 0;
          text-align: left;
        }
        
        .day_button_container {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px 0px 16px;
          gap: 20px;
          width: 100%;
        }
        
        .day_button {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 16px;
          gap: 10px;
          // height: 40px;
          background-color: var(--WhiteOpacity75);
          border-radius: 32px;
          cursor: pointer;
        }
        
        .day_button span {
          color: var(--DarkSecondary);
        }
        
        .plus_icon {
          position: relative;
          width: 14px;
          height: 14px;
        }
        
        .plus_icon:before,
        .plus_icon:after {
          content: '';
          position: absolute;
          background-color: var(--DarkSecondary);
          border-radius: 1px;
        }
        
        .plus_icon:before {
          width: 14px;
          height: 1.6px;
          top: 6.2px;
          left: 0;
        }
        
        .plus_icon:after {
          width: 1.6px;
          height: 14px;
          top: 0;
          left: 6.2px;
        }
        
        /* ----------------------------------------
           Day footer with focus badge
           ---------------------------------------- */
        .day_footer {
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          align-items: center;
          padding: 8px 0px 0px 0px;
          gap: 10px;
          width: 100%;
          // border: 1px solid red;
        }
        
        .day_footer_badge {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 4px 8px;
          gap: 4px;
          border-radius: 8px;
          opacity: 0.6;
        }
        
        .day_footer_badge svg {
          vertical-align: middle;
        }
        
        .day_footer_badge span {
          text-align: center;
          vertical-align: middle;
        }
        



        /* ==========================================
           LIST CONTAINER STYLES - Common for all list containers
           ========================================== */
        .list_container, .secondary_list_container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 20px 10px;
          gap: 25px;
          width: 100%;
          max-width: 1160px;
          height: auto;
        }
        
        /* Common card styles for both primary and secondary cards */
        .list_card, .secondary_list_card {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 30px 50px 20px 30px;
          gap: 40px;
          width: 100%;
          max-width: 856px;
          height: auto;
          border: 1.6px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
        }
        
        /* ----------------------------------------
           List main section styles - Common grid layout
           ---------------------------------------- */
        .list_main, .secondary_list_main {
          box-sizing: border-box;
          display: grid;
          grid-template-areas: 
            "title buttons" 
            "body ." ;
          grid-template-columns: 1fr auto;
          gap: 0px 10px;
          width: 100%;
          padding: 0px 0px 10px;
        }
        
        /* Common header text styles */
        .list_header_text, .secondary_list_header_text {
          grid-area: title;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 5px;
          width: 100%;
        }
        
        /* Secondary-specific header style */
        .secondary_list_header_text {
          justify-content: center;
        }
        
        /* Common header buttons styles */
        .list_header_buttons, .secondary_list_header_buttons {
          grid-area: buttons;
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px;
          gap: 10px;
        }
        
        /* Common body text styles */
        .list_body_text, .secondary_list_body_text {
          grid-area: body;
          width: 100%;
          color: var(--WhiteOpacity70);
          margin: 0;
          text-align: left;
          max-width: calc(100% - 60px); /* Prevent text from getting too close to where button would be */
        }
        
        /* Secondary-specific body text style */
        .secondary_list_body_text {
          padding: 0px;
        }
        
        /* Headers with grid areas */
        .list_header, .secondary_list_header {
          display: contents; /* This makes the container "disappear" but keeps its children in the DOM */
        }
        
        /* ----------------------------------------
           Vote counter and button styles - Primary
           ---------------------------------------- */
        .vote_button {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 16px;
          gap: 10px;
          height: 40px;
          border: none;
          border-radius: 32px;
          background: var(--WhiteOpacity75); 
          cursor: pointer;
        }
        
        /* Primary vote button text */
        .vote_button span {
          color: var(--DarkSecondary); 
        }

        .vote_button .vote_thumb_icon path {
          fill: var(--DarkSecondary); 
        }

        /* ----------------------------------------
           Secondary vote button styles
           ---------------------------------------- */
        .secondary_vote_button {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 16px; 
          gap: 10px;
          height: 40px;
          border: 1px solid var(--WhiteOpacity70); 
          border-radius: 32px;
          background: transparent; 
          cursor: pointer;
        }
        
        /* Secondary vote button text */
        .secondary_vote_button span {
          color: var(--WhiteOpacity70);
        }
        
        .secondary_vote_button .vote_thumb_icon path {
          fill: var(--WhiteOpacity70);
        }

        /* ----------------------------------------
           List footer styles - Common
           ---------------------------------------- */
        .list_footer, .secondary_list_footer {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 8px 0px;
          gap: 16px;
          width: 100%;
        }
        
        /* Common day badge styles */
        .footer_day_badge, .secondary_footer_day_badge {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px 8px;
          gap: 8px;
          height: 24px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          opacity: 0.7;
        }
        
        .footer_day_badge svg, .secondary_footer_day_badge svg {
          vertical-align: middle;
        }
        
        .footer_day_badge span, .secondary_footer_day_badge span {
          color: var(--WhiteOpacity75);
          white-space: nowrap;
          text-align: center;
          vertical-align: middle;
        }
        
        /* Common footer badge styles */
        .list_footer_badge, .secondary_list_footer_badge {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px 8px;
          gap: 4px;
          border: none;
          height: 25px;
          border-radius: 6px;
          opacity: 0.6;
        }
        
        .list_footer_badge span, .secondary_list_footer_badge span {
          text-align: center;
        }
        
        /* Common heading text color */
        .list_header_text h3, .secondary_list_header_text h3 {
          color: var(--WhiteOpacity);
          margin: 0 0 8px 0;
          width: 100%;
        }
        
        /* ==========================================
           PROJECT LIST WRAPPER - Controls alignment and spacing
           ========================================== */
        .project_list_wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-start;  /* Left align cards */
          padding: 20px 10px;
          gap: 25px;  /* Controls vertical spacing between cards */
          width: 100%;
          max-width: 1160px;
        }

        /* Style for the motion div itself */
        .project_item_motion_wrapper {
          width: 100%;
          max-width: 856px; /* Match max-width of the cards for alignment */
        }
        
        /* ==========================================
           MOBILE STYLES - Responsive adjustments
           ========================================== */
        @media (max-width: 600px) {
          /* Project body mobile adjustments */
          .project_body {
            padding: 40px 10px;
          }

          .section_container {
            padding: 52px 0px;
          }

          .section_subtitle, 
          .list_section_subtitle {
            margin: 20px 0 0 0;
            text-align: left;
          }

          .list_section_container {
            padding: 132px 0px 52px 0px;
          }
          
          /* ----------------------------------------
             Mobile styles for current project card
             ---------------------------------------- */
          .day_current_container {
            padding: 0px;
          }
          
          .day_current_card {
            padding: 20px;
            max-width: 100%;
          }
          
          .day_header {
            flex-direction: column;
            gap: 16px;
          }
          
          .day_badge {
            align-self: flex-start;
          }
          
          .day_body_text p {
            width: 100%;
            color: var(--WhiteOpacity70);
            margin: 0;
            text-align: left;
          }

          /* ----------------------------------------
             Mobile styles for list cards - Common
             ---------------------------------------- */
          .list_container, .secondary_list_container {
            padding: 20px 0px;
          }
          
          .list_card, .secondary_list_card {
            padding: 20px;
            max-width: 100%;
            gap: 24px;
          }
     
          /* Fix text color */
          .list_header_text h3, .secondary_list_header_text h3 {
            color: var(--WhiteOpacity);
            margin: 0 0 0px 0;
            width: 100%;
          }

          /* ----------------------------------------
             Mobile styles for list main - Common
             ---------------------------------------- */
          .list_main, .secondary_list_main {
            grid-template-areas: 
              "title"
              "body"
              "buttons";
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 0px 0px 5px;
          }
          
          .list_header_text, .secondary_list_header_text {
            width: 100%;
          }
          
          .list_body_text, .secondary_list_body_text {
            padding: 0px;
            max-width: 100%; /* Allow full width on mobile */
          }

          /* Ensure wrapper has correct padding on mobile */
          .project_list_wrapper {
            padding: 20px 0px; /* Match mobile padding */
            gap: 16px; /* Match mobile gap */
          }

          /* Adjust motion wrapper max-width on mobile */
          .project_item_motion_wrapper {
            max-width: 100%;
          }

          /* Mobile styles for modal linear progress */
          .modal_linear_progress {
            max-width: 100%;
            padding: 15px 0px 5px;
          }
          
          .molin_progress_text {
            height: auto;
            flex-wrap: wrap;
            gap: 5px;
          }
          
          .progress_percentage,
          .tasks_count {
            font-size: 14px;
            line-height: 20px;
          }
        }

        /* Vote limit indicator styles */
        .vote_limit_indicator {
          width: 100%;
          max-width: 1160px;
          padding: 0 20px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .vote_limit_indicator p {
          color: var(--AccentGreen);
          background-color: rgba(34, 216, 23, 0.1);
          padding: 8px 16px;
          border-radius: 8px;
          display: inline-block;
        }
        
        .reset_votes_button {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--WhiteOpacity75);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .reset_votes_button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        /* Add styles for disabled vote buttons */
        .vote_button:disabled,
        .secondary_vote_button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }
      `}</style>

      {/* ************************************************
      *******************************************************
      ** TESTING BUTTON - CURRENTLY HIDDEN
      ** This button resets the vote history in localStorage 
      ** Only for development and testing purposes
      *******************************************************
      ************************************************ */}
      {/* 
      <button 
        onClick={() => {
          localStorage.removeItem('voteHistory');
          window.location.reload();
        }}
        style={{padding: '8px', margin: '10px'}}
      >
        Reset Votes (Testing Only)
      </button>
      */}
      
      {isModalOpen && (
        <ProjectDetailModal
          onClose={() => setIsModalOpen(false)}
          projectProgressId={currentProject?.projectProgressId}
        />
      )}
    </div>
  );
};

export default ProjectBody; 