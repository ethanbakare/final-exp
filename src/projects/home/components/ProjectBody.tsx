import React, { useState } from 'react';
import styles from '../styles/HomePage.module.css';
import { motion } from 'framer-motion';
import { useCurrentProject, useProjectItems } from '@/hooks/useProjects';
import ProjectDetailModal from './ProjectDetailModal';

const ProjectBody: React.FC = () => {
  const { currentProject, loading: currentLoading, error: currentError } = useCurrentProject();
  const { 
    projects, 
    loading: projectsLoading, 
    error: projectsError, 
    handleVote,
    hasReachedVoteLimit 
  } = useProjectItems();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const isLoading = currentLoading || projectsLoading;
  const hasError = currentError || projectsError;
  
  if (isLoading) {
    return <div className="loading-state">Loading...</div>;
  }
  
  if (hasError) {
    return <div className="error-state">Error loading content: {currentError || projectsError}</div>;
  }

  return (
    <div className="project_body">
      {/* ----------------------------------------
          ----------------------------------------
          SECTION TITLE - Current Project Header
          ----------------------------------------
          ---------------------------------------- */}
      <div className="section_container">
        <h2 className={`${styles.FrankRuhlLibre48} section_title`}>Current Project</h2>
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
              <p className={`${styles.InterRegular20}`}>{currentProject?.subtitle || ''}</p>
            </div>
            <div className="day_badge">
              <div className="calendar_icon">
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
              </div>
              <span className={`${styles.InterRegular14}`}>{currentProject?.daysLeft || 0} days left</span>
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
            </div>
            <div className="day_button_container">
              <button className="day_button" onClick={() => setIsModalOpen(true)}>
                <span className={`${styles.InterRegular18}`}>View Progress</span>
                <div className="plus_icon"></div>
              </button>
            </div>
          </div>
          
          {/* ----------------------------------------
              DAY FOOTER - Focus area badge
              Shows the project's primary focus
              ---------------------------------------- */}
          <div className="day_footer">
            <div className="day_footer_badge">
              <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_1183_327)">
                  <path d="M7.33331 5.16683H8.66665V6.50016H7.33331V5.16683ZM7.99998 11.8335C8.36665 11.8335 8.66665 11.5335 8.66665 11.1668V8.50016C8.66665 8.1335 8.36665 7.8335 7.99998 7.8335C7.63331 7.8335 7.33331 8.1335 7.33331 8.50016V11.1668C7.33331 11.5335 7.63331 11.8335 7.99998 11.8335ZM7.99998 1.8335C4.31998 1.8335 1.33331 4.82016 1.33331 8.50016C1.33331 12.1802 4.31998 15.1668 7.99998 15.1668C11.68 15.1668 14.6666 12.1802 14.6666 8.50016C14.6666 4.82016 11.68 1.8335 7.99998 1.8335ZM7.99998 13.8335C5.05998 13.8335 2.66665 11.4402 2.66665 8.50016C2.66665 5.56016 5.05998 3.16683 7.99998 3.16683C10.94 3.16683 13.3333 5.56016 13.3333 8.50016C13.3333 11.4402 10.94 13.8335 7.99998 13.8335Z" fill="#22D817" fillOpacity="0.75"/>
                </g>
                <defs>
                  <clipPath id="clip0_1183_327">
                    <rect width="16" height="16" fill="white" transform="translate(0 0.5)"/>
                  </clipPath>
                </defs>
              </svg>
              <span className={`${styles.InterRegular14}`}>
                {currentProject?.focusBadge?.title || 'Reducing Friction'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------
          ----------------------------------------
          LIST SECTION TITLE - What's Next Header
          ----------------------------------------
          ---------------------------------------- */}
      <div id="whats-next" className="list_section_container">
        <h2 className={`${styles.FrankRuhlLibre48} list_section_title`}>Pick what I build next</h2>
        <p className={`${styles.InterRegular28} list_section_subtitle`}>Top goes first. The rest follow by votes.</p>
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
                <div className={index === 0 ? "list_footer_badge" : "secondary_list_footer_badge"}>
                  <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_1183_327)">
                      <path d="M7.33331 5.16683H8.66665V6.50016H7.33331V5.16683ZM7.99998 11.8335C8.36665 11.8335 8.66665 11.5335 8.66665 11.1668V8.50016C8.66665 8.1335 8.36665 7.8335 7.99998 7.8335C7.63331 7.8335 7.33331 8.1335 7.33331 8.50016V11.1668C7.33331 11.5335 7.63331 11.8335 7.99998 11.8335ZM7.99998 1.8335C4.31998 1.8335 1.33331 4.82016 1.33331 8.50016C1.33331 12.1802 4.31998 15.1668 7.99998 15.1668C11.68 15.1668 14.6666 12.1802 14.6666 8.50016C14.6666 4.82016 11.68 1.8335 7.99998 1.8335ZM7.99998 13.8335C5.05998 13.8335 2.66665 11.4402 2.66665 8.50016C2.66665 5.56016 5.05998 3.16683 7.99998 3.16683C10.94 3.16683 13.3333 5.56016 13.3333 8.50016C13.3333 11.4402 10.94 13.8335 7.99998 13.8335Z" fill="#22D817" fillOpacity="0.75"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_1183_327">
                        <rect width="16" height="16" fill="white" transform="translate(0 0.5)"/>
                      </clipPath>
                    </defs>
                  </svg>
                  <span className={`${styles.InterRegular14}`}>
                    {project.focusBadge?.title || 'Category'}
                  </span>
                </div>
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
          color: var(--WhiteOpacity);
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
          padding: 30px 60px 30px 40px;
          gap: 32px;
          width: 100%;
          max-width: 856px;
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
          color: var(--WhiteOpacity70);
          margin: 0;
          text-align: left;
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
        
        .calendar_icon {
          // position: relative;
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
        }
        
        .day_body_text {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px 0px 32px;
          gap: 25px;
          width: 100%;
        }
        
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
          justify-content: flex-start;
          align-items: center;
          padding: 8px 0px;
          gap: 10px;
          width: 100%;
        }
        
        .day_footer_badge {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 4px 8px;
          gap: 4px;
          background-color:  rgba(34, 216, 23, 0.1);
          // border: 1px solid var(--AccentGreen);
          border-radius: 8px;
          opacity: 0.6;
        }
        
        .day_footer_badge svg {
          vertical-align: middle;
        }
        
        .day_footer_badge span {
          color: var(--AccentGreen);
          text-align: center;
          vertical-align: middle;
        }
        



        /* ==========================================
           LIST CONTAINER STYLES
           ========================================== */
        .list_container {
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
        
        .list_card, .secondary_list_card {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 30px 70px 20px 40px;
          gap: 40px;
          width: 100%;
          max-width: 856px;
          height: auto;
          border: 1.6px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
        }
        
        /* ----------------------------------------
           List main section styles - Grid layout
           ---------------------------------------- */
        .list_main {
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
        
        /* Assign grid areas to the elements */
        .list_header_text {
          grid-area: title;
          display: flex;
          // border: 1px solid red;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 5px;
        }
        
        .list_header_buttons {
          grid-area: buttons;
          display: flex;
          flex-direction: row;
          // border: 1px solid blue;
          align-items: flex-start;
          padding: 0px;
          gap: 10px;
        }
        
        .list_body_text {
          grid-area: body;
          width: 100%;
          color: var(--WhiteOpacity70);
          margin: 0;
          text-align: left;
          max-width: calc(100% - 60px); /* Prevent text from getting too close to where button would be */
        }
        
        /* You don't need the list_header anymore since we're using grid areas */
        .list_header {
          display: contents; /* This makes the container "disappear" but keeps its children in the DOM */
        }
        
        /* ----------------------------------------
           Vote counter and button styles
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
        
        /* This now styles the vote COUNT */
        .vote_button span {
          color: var(--DarkSecondary); 
        }

        .vote_button .vote_thumb_icon path {
          fill: var(--DarkSecondary); 
        }


        /* ----------------------------------------
           List footer styles with badges
           ---------------------------------------- */
        .list_footer {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 8px 0px;
          gap: 16px;
          width: 100%;
        }
        
        .footer_day_badge {
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
        
        .footer_day_badge svg {
          vertical-align: middle;
        }
        
        .footer_day_badge span {
          color: var(--WhiteOpacity75);
          white-space: nowrap;
          text-align: center;
          vertical-align: middle;
        }
        
        .list_footer_badge {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px 8px;
          gap: 4px;
          background-color: rgba(34, 216, 23, 0.1);
          border: none;
          border-line: 1px solid var(--AccentGreen);
          height: 25px;
          border-radius: 6px;
          opacity: 0.6;
        }
        
        .list_footer_badge span {
          color: var(--AccentGreen);
          text-align: center;
        }
        
        /* Fix text color */
        .list_header_text h3, .secondary_list_header_text h3 {
          color: var(--WhiteOpacity);
          margin: 0 0 8px 0;
          width: 100%;
        }

        /* ==========================================
           SECONDARY LIST CONTAINER STYLES
           ========================================== */
        .secondary_list_container {
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
        
        // .secondary_list_card {
        //   box-sizing: border-box;
        //   display: flex;
        //   flex-direction: column;
        //   align-items: flex-start;
        //   padding: 30px 70px 20px 40px;
        //   gap: 40px;
        //   width: 100%;
        //   max-width: 856px;
        //   height: auto;
        //   border: 1.6px solid rgba(255, 255, 255, 0.1);
        //   border-radius: 16px;
        // }
        
        /* ----------------------------------------
           Secondary list main section styles - Grid layout
           ---------------------------------------- */
        .secondary_list_main {
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
        
        /* Assign grid areas to the elements */
        .secondary_list_header_text {
          grid-area: title;
          display: flex;
          // border: 1px solid red;
          justify-content: center;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 5px;
        }
        
        .secondary_list_header_buttons {
          grid-area: buttons;
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px;
          gap: 10px;
        }
        
        .secondary_list_body_text {
          grid-area: body;
          width: 100%;
          color: var(--WhiteOpacity70);
          margin: 0;
          text-align: left;
          padding: 0px;
          max-width: calc(100% - 60px); /* Prevent text from getting too close to where button would be */
        }
        
        /* Secondary list header works with grid areas */
        .secondary_list_header {
          display: contents; /* This makes the container "disappear" but keeps its children in the DOM */
        }
        
        /* ----------------------------------------
           Secondary vote counter and button styles
           ---------------------------------------- */
        .secondary_vote_button {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 8px 16px; 
          gap: 10px; /* Adjust gap if needed */
          height: 40px;
          border: 1px solid var(--WhiteOpacity70); 
          border-radius: 32px;
          background: transparent; 
          cursor: pointer;
        }
        
        /* This now styles the vote COUNT */
        .secondary_vote_button span {
          color: var(--WhiteOpacity70);
        }
        
        .secondary_vote_button .vote_thumb_icon path {
          fill: var(--WhiteOpacity70);
        }
        
        /* ----------------------------------------
           Secondary list footer styles with badges
           ---------------------------------------- */
        .secondary_list_footer {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 8px 0px;
          gap: 16px;
          width: 100%;
        }
        
        {/* ----------------------------------------
            Secondary list footer badge styles
            ---------------------------------------- */}  

        
        .secondary_footer_day_badge {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px 8px;
          gap: 8px;
          background: rgba(255, 255, 255, 0.08);
          height: 24px;
          border-radius: 6px;
          opacity: 0.7;
        }
        
        .secondary_footer_day_badge svg {
          vertical-align: middle;
        }
        
        .secondary_footer_day_badge span {
          color: var(--WhiteOpacity75);
          white-space: nowrap;
          text-align: center;
          vertical-align: middle;
        }
        
        .secondary_list_footer_badge {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px 8px;
          gap: 4px;
          background-color: rgba(34, 216, 23, 0.1);
          border: none;
          height: 25px;
          border-radius: 6px;
          opacity: 0.6;
        }
        
        .secondary_list_footer_badge span {
          color: var(--AccentGreen);
          text-align: center;
        }
        
  
 
        /* ==========================================
           PROJECT LIST WRAPPER
           ========================================== */
        .project_list_wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 20px 10px; /* Replicates padding from list_container */
          gap: 25px;          /* Replicates gap from list_container */
          width: 100%;
          max-width: 1160px; /* Replicates max-width from list_container */
        }

        /* Style for the motion div itself */
        .project_item_motion_wrapper {
          width: 100%; /* Ensure it takes full width within the wrapper */
          max-width: 856px; /* Match max-width of the cards for alignment */
          /* Margin bottom could be added here if not using gap on parent */
          /* margin-bottom: 25px; */
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

          .list_section_container {
            padding: 132px 0px 52px 0px;
          }

          .list_section_subtitle {
          margin: 20px 0 0 0;
          text-align: left;
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
             Mobile styles for list card
             ---------------------------------------- */
          .list_container {
            padding: 20px 0px;
          }
          
          .list_card {
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
             Mobile styles for list main
             ---------------------------------------- */

          .list_main {
            grid-template-areas: 
              "title"
              "buttons"
              "body";
            grid-template-columns: 1fr;
            gap: 24px;
            padding: 0px 0px 5px;
          }
          
          .list_header_text {
            width: 100%;
          }
          
          .list_body_text {
            padding: 0px;
            max-width: 100%; /* Allow full width on mobile */
          }

          /* ----------------------------------------
             Mobile styles for secondary list card
             ---------------------------------------- */
          .secondary_list_container {
            padding: 20px 0px;
          }
          
          .secondary_list_card {
            padding: 20px;
            max-width: 100%;
            gap: 24px;
          }
          
          .secondary_list_main {
            grid-template-areas: 
              "title"
              "buttons"
              "body";
            grid-template-columns: 1fr;
            gap: 24px;
            padding: 0px 0px 5px;
          }
          
          .secondary_list_header_text {
            width: 100%;
          }
          
          .secondary_list_body_text {
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

          /* Keep mobile styles for list_card and secondary_list_card */
          .list_card,
          .secondary_list_card {
            padding: 20px;
            max-width: 100%;
            gap: 24px;
          }
          
          .list_main,
          .secondary_list_main {
            grid-template-areas: 
              "title"
              "body"
              "buttons";
            grid-template-columns: 1fr;
            gap: 16px;
            padding: 0px 0px 5px;
          }
          
          .list_header_text,
          .secondary_list_header_text {
            width: 100%;
          }
          
          .list_body_text,
          .secondary_list_body_text {
            padding: 0px;
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
        />
      )}
    </div>
  );
};

export default ProjectBody; 