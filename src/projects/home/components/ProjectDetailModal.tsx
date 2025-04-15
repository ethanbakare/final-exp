import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/HomePage.module.css';
import { useProjectProgress } from '@/hooks/useProjectProgress';

// ----------------------------------------
// INTERFACES
// ----------------------------------------

// Props definition for the ProjectDetailModal component
interface ProjectDetailModalProps {
  onClose: () => void; // Function to call when the modal should be closed
}

// ----------------------------------------
// COMPONENT DEFINITION
// ----------------------------------------
const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ onClose }) => {
  
  // ----------------------------------------
  // REFS
  // ----------------------------------------
  // Reference to the modal container for fixing height
  const modalRef = useRef<HTMLDivElement>(null);
  
  // ----------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------
  // State to track which task containers are expanded (by their index)
  const [expandedTasks, setExpandedTasks] = useState<number[]>([]); // All tasks closed by default
  // State to track if initial height has been set
  const [heightFixed, setHeightFixed] = useState(false);
  
  // ----------------------------------------
  // DATA FETCHING
  // ----------------------------------------
  // Fetch project progress data from Sanity
  const { data: projectProgress, loading, error } = useProjectProgress();
  
  // ----------------------------------------
  // EVENT HANDLERS
  // ----------------------------------------
  // Toggle task expansion state based on its index - only one task can be expanded at a time
  const toggleTaskExpansion = (taskIndex: number) => {
    setExpandedTasks(prev => 
      // If this task is already expanded, close it
      prev.includes(taskIndex)
        ? []
        // Otherwise, expand only this task (close all others)
        : [taskIndex]
    );
  };
  
  // ----------------------------------------
  // SIDE EFFECTS
  // ----------------------------------------
  // Prevent background body scrolling when the modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    // Cleanup function to restore scrolling when the component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []); // Empty dependency array means this effect runs only once on mount

  // Fix the modal height after initial render to prevent content jumps
  useEffect(() => {
    if (modalRef.current && !heightFixed) {
      const initialHeight = modalRef.current.offsetHeight;
      modalRef.current.style.height = `${initialHeight}px`;
      modalRef.current.style.overflowY = 'auto'; // Ensure overflow is enabled
      setHeightFixed(true);
    }
  }, [heightFixed]);

  // ----------------------------------------
  // LOADING AND ERROR STATES
  // ----------------------------------------
  if (loading) {
    return (
      <div className="modal_overlay">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading project details...</p>
        </div>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #212121;
            padding: 40px;
            border-radius: 16px;
            color: white;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.2);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !projectProgress) {
    return (
      <div className="modal_overlay">
        <div className="error-container">
          <p>Error loading project details. Please try again later.</p>
          <button onClick={onClose}>Close</button>
        </div>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #212121;
            padding: 40px;
            border-radius: 16px;
            color: white;
          }
          button {
            margin-top: 20px;
            padding: 8px 16px;
            background-color: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 4px;
            color: white;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  // ----------------------------------------
  // RENDER LOGIC
  // ----------------------------------------
  return (
    // Modal Overlay: Dims the background and handles closing when clicked outside the modal content
    <div className="modal_overlay" onClick={onClose}>
      {/* Main Modal Container: Holds all modal content and prevents closing when clicked inside */}
      <div className="first_modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        
        {/* ----------------------------------------
            MODAL PICTURE SECTION
            Top area with background and close button
            ---------------------------------------- */}
        <div className="modal_picture" style={projectProgress.modalImage && projectProgress.modalImage.asset && projectProgress.modalImage.asset.url ? { 
          backgroundImage: `url(${projectProgress.modalImage.asset.url})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        } : {}}>
          {/* Close Button */}
          <button className="modal_cancel" onClick={onClose}>
            {/* Close Icon SVG */}
            <svg width="43" height="42" viewBox="0 0 43 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_1600_1394)">
                <path d="M26.5575 28.525C27.24 29.2075 28.3425 29.2075 29.025 28.525C29.69 27.8425 29.69 26.7225 29.025 26.0575L23.9675 21L29.025 15.9425C29.7075 15.26 29.7075 14.1575 29.025 13.475C28.3425 12.7925 27.24 12.7925 26.5575 13.475L21.5 18.5325L16.4425 13.475C15.76 12.7925 14.6575 12.7925 13.975 13.475C13.2925 14.1575 13.2925 15.26 13.975 15.9425L19.0325 21L13.975 26.0575C13.2925 26.74 13.2925 27.8425 13.975 28.525C14.6575 29.2075 15.76 29.2075 16.4425 28.525L21.5 23.4675L26.5575 28.525Z" fill="white" fillOpacity="0.4"/>
                <path d="M21.5 3.5C11.8225 3.5 4 11.3225 4 21C4 30.6775 11.8225 38.5 21.5 38.5C31.1775 38.5 39 30.6775 39 21C39 11.3225 31.1775 3.5 21.5 3.5ZM29.025 28.525C28.3425 29.2075 27.24 29.2075 26.5575 28.525L21.5 23.4675L16.4425 28.525C15.76 29.2075 14.6575 29.2075 13.975 28.525C13.2925 27.8425 13.2925 26.74 13.975 26.0575L19.0325 21L13.975 15.9425C13.2925 15.26 13.2925 14.1575 13.975 13.475C14.6575 12.7925 15.76 12.7925 16.4425 13.475L21.5 18.5325L26.5575 13.475C27.24 12.7925 28.3425 12.7925 29.025 13.475C29.7075 14.1575 29.7075 15.26 29.025 15.9425L23.9675 21L29.025 26.0575C29.69 26.7225 29.69 27.8425 29.025 28.525Z" fill="#323232" fillOpacity="0.4"/>
              </g>
              <defs>
                <clipPath id="clip0_1600_1394">
                  <rect width="42" height="42" fill="white" transform="translate(0.5)"/>
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>
        
        {/* ----------------------------------------
            MODAL CONTENT SECTION
            Contains the main details: header, progress, task list
            ---------------------------------------- */}
        <div className="first_modal_content">
          
          {/* Modal Header: Displays the main title */}
          <div className="modal_header">
            <div className={`${styles.InterRegular20} modal_header_text`}>
              {/* Use dynamic title from Sanity */}
              {projectProgress.title}
            </div>
          </div>
          
          {/* Modal Linear Progress: Shows overall task progress */}
          <div className="modal_linear_progress">
            {/* Progress Text: Shows percentage and task counts */}
            <div className="molin_progress_text">
              <div className={`${styles.InterRegular16} progress_percentage`}>Progress {projectProgress.progressPercentage}%</div>
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
          
          {/* ----------------------------------------
              MODAL TASK LIST
              Displays expandable task sections
              ---------------------------------------- */}
          <div className="modal_list">
            {/* Map through the tasks array to render each task container */}
            {projectProgress.tasks.map((task, taskIndex) => (
              // Task Container: Holds a single task and its subtasks
              <div 
                key={taskIndex} // Unique key for React list rendering
                // Dynamically set class based on expansion state for styling/animation
                className={`modal_list_task_container ${expandedTasks.includes(taskIndex) ? 'open' : 'closed'}`}
              >
                {/* Task Header Area: Clickable area to toggle expansion */}
                <div className="modal_list_task">
                  {/* Task Header Row: Contains title and dropdown icon */}
                  <div className="modal_list_task_header">
                    {/* Task Title */}
                    <div className={`${styles.InterRegular20} modal_list_task_header_text`}>{task.title}</div>
                    {/* Dropdown/Toggle Icon: Click triggers expansion toggle */}
                    <div 
                      className="modal_list_dropdown" 
                      onClick={() => toggleTaskExpansion(taskIndex)}
                    >
                      {/* Dropdown Icon SVG */}
                      <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_1523_960)">
                          <path d="M18.5 13H13.5V18C13.5 18.55 13.05 19 12.5 19C11.95 19 11.5 18.55 11.5 18V13H6.5C5.95 13 5.5 12.55 5.5 12C5.5 11.45 5.95 11 6.5 11H11.5V6C11.5 5.45 11.95 5 12.5 5C13.05 5 13.5 5.45 13.5 6V11H18.5C19.05 11 19.5 11.45 19.5 12C19.5 12.55 19.05 13 18.5 13Z" fill="white" fillOpacity="0.7"/>
                        </g>
                        <defs>
                          <clipPath id="clip0_1523_960">
                            <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                  </div>
                  {/* Task Status Row: Displays subtask count and overall status badge */}
                  <div className="modal_list_task_status">
                    {/* Subtask Count Badge */}
                    <div className="modal_list_task_status_number">
                      <span className={`${styles.InterRegular14} modal_list_count`}>{task.completedCount}</span>
                      <span className={`${styles.InterRegular14} modal_list_slash`}>/</span>
                      <span className={`${styles.InterRegular14} modal_list_count_total`}>{task.totalCount}</span>
                    </div>
                    
                    {/* Status Badge - Completed: Conditionally rendered */}
                    {task.status === "completed" && (
                      <div className="modal_list_task_status_complete">
                        <div className="complete_icon">
                          <div className="complete_icon_outer_circle"></div>
                          <div className="complete_icon_inner_circle"></div>
                        </div>
                        <span className={`${styles.InterRegular14}`}>Completed</span>
                      </div>
                    )}
                    
                    {/* Status Badge - In Progress: Conditionally rendered */}
                    {task.status === "inProgress" && (
                      <div className="modal_list_task_status_in_progress">
                        {/* Pulsing icon container */}
                        <div className="in_progress_icon">
                          <div className="in_progress_icon_outer_circle"></div>
                          <div className="in_progress_icon_inner_circle"></div>
                        </div>
                        <span className={`${styles.InterRegular14}`}>In Progress</span>
                      </div>
                    )}
                    
                    {/* Status Badge - Not Started: Conditionally rendered */}
                    {task.status === "notStarted" && (
                      <div className="modal_list_task_status_not_started">
                        <div className="not_started_icon">
                          <div className="not_started_icon_outer_circle"></div>
                          <div className="not_started_icon_inner_circle"></div>
                        </div>
                        <span className={`${styles.InterRegular14}`}>Not Started</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* ----------------------------------------
                    SUBTASK LIST SECTION
                    Conditionally rendered only when the task is expanded
                    ---------------------------------------- */}
                {expandedTasks.includes(taskIndex) && (
                  // Subtask List Container
                  <div className="modal_list_subtask">
                    {/* Map through the subtasks array for the current task */}
                    {task.subtasks.map((subtask, subtaskIndex) => (
                      // Subtask Row: Contains icon and text for a single subtask
                      <div 
                        key={subtaskIndex} 
                        className="modal_subtask_row"
                      >
                        
                        {/* Completed Subtask Icon: Conditionally rendered */}
                        {subtask.completed && task.status === "completed" && (
                          <div className="complete_check_circle">
                            {/* Checkmark Icon SVG */}
                            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g clipPath="url(#clip0_2067_468)">
                                <path fillRule="evenodd" clipRule="evenodd" d="M2.5 12C2.5 6.4875 6.9875 2 12.5 2C18.0125 2 22.5 6.4875 22.5 12C22.5 17.5125 18.0125 22 12.5 22C6.9875 22 2.5 17.5125 2.5 12ZM10.5 14.1701L16.38 8.29006C16.77 7.90006 17.41 7.90006 17.8 8.29006C18.19 8.68006 18.19 9.31006 17.8 9.70006L11.21 16.2901C10.82 16.6801 10.19 16.6801 9.79998 16.2901L7.20998 13.7001C6.81998 13.3101 6.81998 12.6801 7.20998 12.2901C7.59998 11.9001 8.22998 11.9001 8.61998 12.2901L10.5 14.1701Z" fill="white" fillOpacity="0.2"/>
                                <path d="M16.38 8.29006L10.5 14.1701L8.61998 12.2901C8.22998 11.9001 7.59998 11.9001 7.20998 12.2901C6.81998 12.6801 6.81998 13.3101 7.20998 13.7001L9.79998 16.2901C10.19 16.6801 10.82 16.6801 11.21 16.2901L17.8 9.70006C18.19 9.31006 18.19 8.68006 17.8 8.29006C17.41 7.90006 16.77 7.90006 16.38 8.29006Z" fill="white"/>
                              </g>
                              <defs>
                                <clipPath id="clip0_2067_468">
                                  <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                        )}
                        
                        {/* In Progress Subtask Icon: Conditionally rendered */}
                        {subtask.completed && task.status === "inProgress" && (
                          <div className="in_progress_check_circle">
                            {/* In Progress Icon SVG */}
                            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g clipPath="url(#clip0_2067_473)">
                                <path fillRule="evenodd" clipRule="evenodd" d="M2.5 12C2.5 6.4875 6.9875 2 12.5 2C18.0125 2 22.5 6.4875 22.5 12C22.5 17.5125 18.0125 22 12.5 22C6.9875 22 2.5 17.5125 2.5 12ZM10.5 14.1701L16.38 8.29006C16.77 7.90006 17.41 7.90006 17.8 8.29006C18.19 8.68006 18.19 9.31006 17.8 9.70006L11.21 16.2901C10.82 16.6801 10.19 16.6801 9.79998 16.2901L7.20998 13.7001C6.81998 13.3101 6.81998 12.6801 7.20998 12.2901C7.59998 11.9001 8.22998 11.9001 8.61998 12.2901L10.5 14.1701Z" fill="#22D817" fillOpacity="0.3"/>
                                <path d="M16.38 8.29006L10.5 14.1701L8.61998 12.2901C8.22998 11.9001 7.59998 11.9001 7.20998 12.2901C6.81998 12.6801 6.81998 13.3101 7.20998 13.7001L9.79998 16.2901C10.19 16.6801 10.82 16.6801 11.21 16.2901L17.8 9.70006C18.19 9.31006 18.19 8.68006 17.8 8.29006C17.41 7.90006 16.77 7.90006 16.38 8.29006Z" fill="#22D817"/>
                              </g>
                              <defs>
                                <clipPath id="clip0_2067_473">
                                  <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                        )}
                        
                        {/* Uncompleted Subtask Icon: Conditionally rendered */}
                        {!subtask.completed && (
                          <div className="uncompleted_check_circle_outline">
                            {/* Outline Icon SVG */}
                            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g clipPath="url(#clip0_2043_1583)">
                                <path d="M12.5 2C6.98 2 2.5 6.48 2.5 12C2.5 17.52 6.98 22 12.5 22C18.02 22 22.5 17.52 22.5 12C22.5 6.48 18.02 2 12.5 2ZM12.5 20C8.09 20 4.5 16.41 4.5 12C4.5 7.59 8.09 4 12.5 4C16.91 4 20.5 7.59 20.5 12C20.5 16.41 16.91 20 12.5 20ZM16.38 8.29L10.5 14.17L8.62 12.29C8.23 11.9 7.6 11.9 7.21 12.29C6.82 12.68 6.82 13.31 7.21 13.7L9.8 16.29C10.19 16.68 10.82 16.68 11.21 16.29L17.8 9.7C18.19 9.31 18.19 8.68 17.8 8.29C17.41 7.9 16.77 7.9 16.38 8.29Z" fill="white" fillOpacity="0.3"/>
                              </g>
                              <defs>
                                <clipPath id="clip0_2043_1583">
                                  <rect width="24" height="24" fill="white" transform="translate(0.5)"/>
                                </clipPath>
                              </defs>
                            </svg>
                          </div>
                        )}
                        
                        {/* Subtask Text: Styled differently based on completion status */}
                        <div className={`${styles.InterRegular18} subtask_text ${subtask.completed ? 'completed_subtask' : 'uncompleted_subtask'}`}>
                          {subtask.title}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
        </div>
      </div>
      
      {/* ----------------------------------------
          MODAL STYLES (Using JSX Styles)
          ---------------------------------------- */}
      <style jsx>{`
        // ----------------------------------------
        // OVERLAY STYLES
        // ----------------------------------------
        .modal_overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.85); // Dark overlay background
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000; // Ensure modal is on top
          padding: 20px; // Padding around the modal
        }
        
        // ----------------------------------------
        // MAIN MODAL CONTAINER (1st_Modal)
        // ----------------------------------------
        .first_modal {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          width: 720px; // Fixed width
          max-width: 720px;
          // Height will be set dynamically via JavaScript
          max-height: 90vh; // Limit height to 90% of viewport height
          overflow-y: auto; // This will be set by JavaScript after measuring
          background: #212121; // Dark background color
          border-radius: 16px; // Rounded corners
          position: relative;
          overflow-x: hidden; // Prevent horizontal scrolling
        }
        
        // ----------------------------------------
        // MODAL PICTURE SECTION STYLES
        // ----------------------------------------
        .modal_picture {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: flex-end; // Position close button to the right
          padding: 20px;
          gap: 40px;
          width: 100%;
          height: 132px; // Fixed height for the picture area
          min-height: 132px;
          background: url('/images/final_modal_picture.png'); // Image from public folder
          background-position: center; // Center the image
          background-size: cover; // Cover the entire area
          background-repeat: no-repeat; // Don't repeat the image
          border-bottom: 1px solid rgba(255, 255, 255, 0.1); // Subtle bottom border
          border-radius: 16px 16px 0px 0px; // Rounded top corners
          flex-shrink: 0; // Prevent header from shrinking
        }
        
        // Close button styles
        .modal_cancel {
          width: 42px;
          height: 42px;
          background: var(--WhiteOpacity70);
          border: none;
          padding: 0;
          cursor: pointer;
          position: relative;
        }
        
        // ----------------------------------------
        // MODAL CONTENT SECTION STYLES
        // ----------------------------------------
        .first_modal_content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 20px 40px; // Padding inside the content area
          gap: 30px; // Spacing between content elements
          width: 100%;
          height: auto;
          flex: 1; // Take up available space
        }
        
        // ----------------------------------------
        // MODAL HEADER STYLES
        // ----------------------------------------
        .modal_header {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px 0px 10px; // Bottom padding
          gap: 10px;
          width: 100%;
        }
        
        // Modal header text styles
        .modal_header_text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 5px;
          width: 100%;
          height: auto;
          color: var(--WhiteOpacity); // Use CSS variable for color
        }
        
        // ----------------------------------------
        // LINEAR PROGRESS BAR STYLES
        // ----------------------------------------
        .modal_linear_progress {
          display: flex;
        //   border: 1px solid rgba(239, 5, 5, 0.96);
          flex-direction: column;
          align-items: flex-start;
          padding: 0px 0px 10px;
          width: 100%;
          gap: 0px;
        //   height: 64px; // Fixed height for progress section
        }
        
        // Progress text container (holds percentage and count)
        .molin_progress_text {
          display: flex;
          flex-direction: row;
          justify-content: space-between; // Space out text elements
          align-items: center;
          padding: 0px;
          white-space: nowrap;
          gap: 10px;
          width: 100%;
          height: 39px;
        }
        
        // Progress percentage text
        .progress_percentage {
          text-align: left;
          color: var(--WhiteOpacity70); // Use CSS variable for color
        }
        
        // Tasks count text
        .tasks_count {
          color: var(--WhiteOpacity70); // Use CSS variable for color
          text-align: right;
        }
        
        // Progress bar container
        .molin_progress_bar {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px;
          width: 100%;
          height: 15px;
          background: var(--WhiteOpacity10); // Background of the bar track
          border-radius: 12px;
        }
        
        // Filled portion of the progress bar
        .green_bar {
          height: 15px;
          background: var(--AccentGreenOpacity60); // Green fill color
          border-radius: 32px 0px 0px 32px; // Rounded left edge
          transition: width 0.5s ease; // Smooth transition on width change
        }
        
        // ----------------------------------------
        // ANIMATION KEYFRAMES
        // ----------------------------------------
        // Define pulse animation keyframes for the in-progress icon
        @keyframes radar-pulse {
          0% {
            transform: scale(1); // Start at normal size
            opacity: 1; // Start slightly faded
          }
          50% {
            transform: scale(1.2); // Scale up slightly
            opacity: 1; // Become fully opaque
            box-shadow: 0 0 6px 2px var(--AccentGreenOpacity25); // Add green glow
          }
          100% {
            transform: scale(1); // Return to normal size
            opacity: 1; // Fade back slightly
          }
        }
        
        // ----------------------------------------
        // MODAL LIST STYLES (Task sections)
        // ----------------------------------------
        .modal_list {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 16px; // Spacing between task containers
          width: 100%;
          height: auto;
        }
        
        // Individual task container
        .modal_list_task_container {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px 0px 32px; // Bottom padding for separation
          gap: 10px; // Spacing within the container
          width: 100%;
          height: auto;
          border-bottom: 1.2px solid rgba(255, 255, 255, 0.1); // Bottom border separator
          transition: all 0.3s ease; // Smooth transition for potential height changes (though handled by subtask visibility)
          border-radius: 8px 8px 0px 0px;
        }
        
        // HOVER EFFECT
        /*--------------------------------
        ----------------------------------
        ----------------------------------
        ----------------------------------
        ----------------------------------
        ----------------------------------
        ----------------------------------
        ----------------------------------


        // // Hover effect for task containers (desktop only)
        // @media (hover: hover) {
        //   .modal_list_task_container:hover {
        //     background-color: var(--WhiteOpacity02); // Slight highlight on hover
        //     transition: background-color 0.2s ease; // Smooth transition for hover effect
        //   }
        }
        /*--------------------------------
        ----------------------------------
        ----------------------------------
        ----------------------------------
        HOVER EFFECT END
        ----------------------------------
        ----------------------------------
        ----------------------------------
        ----------------------------------*/

        // Remove bottom border from the last task container
        .modal_list_task_container:last-child {
          border-bottom: none; // No border needed for the last item
        //   padding-bottom: 0; // Can also remove the bottom padding if desired
        }
        
        // Task header area (title, status, toggle)
        .modal_list_task {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 8px 4px;
  
          gap: 10px;
          width: 100%;
          border-radius: 8px;
        }
        
        // Row containing task title and dropdown icon
        .modal_list_task_header {
          display: flex;
        //   border: 1px solid rgba(239, 5, 5, 0.96);
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          padding: 0px;
          gap: 10px;
          width: 100%;
          height: auto;
        }
        
        // Task title text
        .modal_list_task_header_text {
          width: 100%;
          height: auto;
          color: var(--WhiteOpacity);
          margin-right: 10px; /* Ensure space before dropdown */
          overflow: hidden; /* Prevent long text overflowing */
        //   text-overflow: ellipsis; /* Show ellipsis for overflow */
        //   white-space: nowrap; /* Keep title on one line */
        }
        
        /* Modal_List_DropDown */
        .modal_list_dropdown {
          width: 24px;
          height: 24px;
          flex-shrink: 0; /* Prevent icon from shrinking */
          cursor: pointer;
          transition: transform 0.3s ease; // Animate rotation
        }
        
        /* Rotate dropdown icon when task is expanded */
        .open .modal_list_dropdown {
          transform: rotate(45deg); // Rotate to form an 'X' like shape
        }
        
        // Row containing task status badges
        .modal_list_task_status {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 10px;
          width: 100%;
          height: 25px;
        }
        
        /* Modal_List_Task_Status_Number  count badge (e.g., 3/5)*/
        .modal_list_task_status_number {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px 16px;
          gap: 4px;
          height: 25px;
          background: var(--WhiteOpacity05); // Faded background
          border-radius: 32px; // Pill shape
        }
        
        /* Modal_List_Count */
        // Text styles for counts and slash in the badge
        .modal_list_count, .modal_list_slash, .modal_list_count_total {
          color: var(--WhiteOpacity);
        }
        
        // ----------------------------------------
        // STATUS BADGE STYLES (Complete, In Progress, Not Started)
        // ----------------------------------------
        
        // Base styles for all status badges
        .modal_list_task_status_complete,
        .modal_list_task_status_in_progress,
        .modal_list_task_status_not_started {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 4px 16px 4px 8px; // Padding (more on right)
          gap: 8px;
          height: 25px;
          background: var(--WhiteOpacity05);
          border-radius: 32px;
        }
        
        // Icon container styles (base for all status icons)
        .complete_icon,
        .in_progress_icon,
        .not_started_icon {
          width: 13px;
          height: 13px;
          position: relative;
          flex-shrink: 0;
        }
        
        // Styles for the 'Completed' status
        .complete_icon_outer_circle {
          position: absolute;
          width: 13px;
          height: 13px;
          left: 0;
          top: 0;
          background: var(--WhiteOpacity10); // Faded white outer ring
          border-radius: 50%;
        }
        
        /* Complete_Icon_InnerCircle */
        .complete_icon_inner_circle {
          position: absolute;
          width: 5px;
          height: 5px;
          left: 4px;
          top: 4px;
          background: #FFFFFF; // Solid white inner dot
          border-radius: 50%;
        }
        
        // Styles for the 'In Progress' status
        .in_progress_icon_outer_circle {
          position: absolute;
          width: 13px;
          height: 13px;
          left: 0;
          top: 0;
          background: var(--AccentGreenOpacity10); // Faded green outer ring
          border-radius: 50%;
          animation: radar-pulse 2s infinite ease-in-out; // Apply pulsing animation
        }
        
        .in_progress_icon_inner_circle {
          position: absolute;
          width: 5px;
          height: 5px;
          left: 4px;
          top: 4px;
          background: var(--AccentGreen); // Solid green inner dot
          border-radius: 50%;
        }
        
        // Styles for the 'Not Started' status
        .not_started_icon_outer_circle {
          box-sizing: border-box;
          position: absolute;
          width: 13px;
          height: 13px;
          left: 0;
          top: 0;
          border: 1px solid var(--WhiteOpacity10); // Faded white border (no fill)
          border-radius: 50%;
        }
        .not_started_icon_inner_circle {
          position: absolute;
          width: 5px;
          height: 5px;
          left: 4px;
          top: 4px;
          background: var(--WhiteOpacity30); // Dimmed white inner dot
          border-radius: 50%;
        }
        
        // Text styles for status badges
        .modal_list_task_status_complete span,
        .modal_list_task_status_in_progress span {
          color: var(--WhiteOpacity);
        }
        .modal_list_task_status_not_started span {
          color: var(--WhiteOpacity50); // Dimmed text color for not started
        }
        
        /* Modal_List_Task_Status_Complete */
        /* Modal_List_Task_Status_In_Progress */
        /* Modal_List_Task_Status_Not_Started */
        // ----------------------------------------
        // Modal_List_SubTask -- SUBTASK LIST STYLES
        // ----------------------------------------
        .modal_list_subtask {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 0px 0px 0px 24px; // Indent subtasks
          gap: 10px; // Spacing between subtask rows
          width: 100%;
          height: auto;
          margin-top: 10px; // Add space above subtask list when expanded
        }
        
        /* Modal_SubTask_Row */
        // Individual subtask row
        .modal_subtask_row {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0px;
          gap: 10px;
          width: 100%;
          margin-bottom: 8px; // Spacing below each subtask row
        }
        
        // Container for subtask check circle icons
        .complete_check_circle,
        .in_progress_check_circle,
        .uncompleted_check_circle_outline {
          width: 24px;
          height: 24px;
          position: relative;
          flex-shrink: 0;
        }
        
        // Subtask text styles
        .subtask_text {
          width: calc(100% - 34px); // Fill remaining space after icon
          height: auto;
        }
        
        // Styling for completed subtasks (dimmed)
        .completed_subtask {
          color: var(--WhiteOpacity40);
        }
        
        // Styling for uncompleted subtasks
        .uncompleted_subtask {
          color: var(--WhiteOpacity70);
        }
        
        // ----------------------------------------
        // RESPONSIVE ADJUSTMENTS
        // ----------------------------------------
        @media (max-width: 768px) {
          // Adjust modal width for smaller screens
          .first_modal {
            width: 100%;
            max-width: 100%;
          }
          
          // Reduce padding on smaller screens
          .first_modal_content {
            padding: 20px;
          }
          
          // Adjust font sizes for readability
          .modal_header_text {
            font-size: 18px;
            line-height: 22px;
          }
          .modal_list_task_header_text {
            font-size: 18px;
            line-height: 22px;
          }
          .subtask_text {
            font-size: 16px;
            line-height: 20px;
          }
        }
        
        @media (max-width: 480px) {
          // Reduce header height on very small screens
          .modal_picture {
            min-height: 72px;
            height: 100px;
          }

          .modal_list_subtask {
            padding-left: 4px; // Indent subtasks
          }
        
        //   .modal_subtask_row {
        //     align-items: flex-start;
        //   }

          .modal_linear_progress {
            height: auto;
            gap: 5px;
          }
          // Keep progress text horizontal
          .molin_progress_text {
            // flex-direction: column;
            // align-items: flex-start;
            height: auto;
            gap: 0;
          }
          .progress_percentage,
          .tasks_count {
            line-height: 24px;
          }
          
          // Allow status badges to wrap
          .modal_list_task_status {
            flex-wrap: wrap;
            height: auto;
            gap: 5px 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectDetailModal; 