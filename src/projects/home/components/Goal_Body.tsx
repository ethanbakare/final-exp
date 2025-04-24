import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/HomePage.module.css';
import { useSectionLoading } from '@/hooks/useSectionLoading';

const Goal_Body: React.FC = () => {
  // State to track which goal is expanded
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);

  // Integrate with loading context
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isLoaded } = useSectionLoading('Goal_Body', [true]);

  // Toggle function for expanding/collapsing goals
  const toggleGoal = (goalIndex: number) => {
    if (expandedGoal === goalIndex) {
      setExpandedGoal(null); // Collapse if already expanded
    } else {
      setExpandedGoal(goalIndex); // Expand the clicked goal
    }
  };

  // Animation variants for content
  const contentVariants = {
    hidden: { 
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    visible: { 
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.5,
        ease: "easeInOut" 
      }
    }
  };

  return (
    <div className="goal_body">
      {/* ----------------------------------------
          ----------------------------------------
          SECTION CONTAINER - Goals Header
          ----------------------------------------
          ---------------------------------------- */}
      <div className="section_container">
        <h2 className={`${styles.FrankRuhlLibre48} section_headertext`}>Goals</h2>
        <p className={`${styles.InterRegular24} section_bodytext`}>
         What Success Looks Like in 90 Days?
        </p>
      </div>
      
      {/* ----------------------------------------
          ----------------------------------------
          GOALS CONTAINER - Two Goals Side by Side
          ----------------------------------------
          ---------------------------------------- */}
      <div className="goals_container">
        {/* ----------------------------------------
            FIRST GOAL - Skills I'm Building
            ---------------------------------------- */}
        <div className="goal_item first_goal">
          {/* Goal Picture Section */}
          <div className="goal_picture">
            <div className="goal_image_container">
              <Image
                src="/images/1stPic.png"
                alt="Skills I'm currently Building"
                width={486}
                height={96}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                priority
              />
            </div>
          </div>
          
          {/* Goal Content Section */}
          <div className="goal_content">
            {/* Goal Header with Dropdown Toggle */}
            <div 
              className="goal_header" 
              onClick={() => toggleGoal(1)}
              role="button"
              tabIndex={0}
              aria-expanded={expandedGoal === 1}
            >
              <h3 className={`${styles.InterRegular20} goal_header_text`}>Skills I&apos;m currently Building</h3>
              <motion.div 
                className="dropdown_icon"
                animate={{ rotate: expandedGoal === 1 ? 90 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.79006 15.88L13.6701 12L9.79006 8.11998C9.40006 7.72998 9.40006 7.09998 9.79006 6.70998C10.1801 6.31998 10.8101 6.31998 11.2001 6.70998L15.7901 11.3C16.1801 11.69 16.1801 12.32 15.7901 12.71L11.2001 17.3C10.8101 17.69 10.1801 17.69 9.79006 17.3C9.41006 16.91 9.40006 16.27 9.79006 15.88Z" fill="white" fillOpacity="0.7"/>
                </svg>
              </motion.div>
            </div>
            
            {/* Goal Body (Visible only when expanded) */}
            <AnimatePresence>
              {expandedGoal === 1 && (
                <motion.div 
                  className="goal_body_content"
                  key="goal1-content"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={contentVariants}
                  style={{
                    padding: '10px 10px 0px 10px',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <div className="SubGoal">
                    <div className="SubGoal_Circle">
                      <div className="Circle"></div>
                    </div>
                    <p className={`${styles.InterRegular18} goal_body_item`}>Build working AI prototypes fast — even from raw, ambiguous ideas</p>
                  </div>
                  <div className="SubGoal">
                    <div className="SubGoal_Circle">
                      <div className="Circle"></div>
                    </div>
                    <p className={`${styles.InterRegular18} goal_body_item`}>Translate user friction and fuzzy problems into testable prototypes</p>
                  </div>
                  <div className="SubGoal">
                    <div className="SubGoal_Circle">
                      <div className="Circle"></div>
                    </div>
                    <p className={`${styles.InterRegular18} goal_body_item`}>Develop strong model intuition — knowing what works, where, and why</p>
                  </div>
                  <div className="SubGoal">
                    <div className="SubGoal_Circle">
                      <div className="Circle"></div>
                    </div>
                    <p className={`${styles.InterRegular18} goal_body_item`}>Design flows where memory, voice, and agents feel seamless and natural</p>
                  </div>
                  <div className="SubGoal">
                    <div className="SubGoal_Circle">
                      <div className="Circle"></div>
                    </div>
                    <p className={`${styles.InterRegular18} goal_body_item`}>Stress-test AI interactions for latency, immersion, and failure recovery</p>
                  </div>
                  <div className="SubGoal">
                    <div className="SubGoal_Circle">
                      <div className="Circle"></div>
                    </div>
                    <p className={`${styles.InterRegular18} goal_body_item`}>Run basic AI evals to test model accuracy and variability</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* ----------------------------------------
            SECOND GOAL - What Should Happen
            ---------------------------------------- */}
        <div className="goal_item second_goal">
          {/* Goal Picture Section */}
          <div className="goal_picture">
            <div className="goal_image_container">
              <Image
                src="/images/2ndPic.png"
                alt="Outcomes I'm Working Towards"
                width={486}
                height={96}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                priority
              />
            </div>
          </div>
          
          {/* Goal Content Section */}
          <div className="goal_content">
            {/* Goal Header with Dropdown Toggle */}
            <div 
              className="goal_header" 
              onClick={() => toggleGoal(2)}
              role="button"
              tabIndex={0}
              aria-expanded={expandedGoal === 2}
            >
              <h3 className={`${styles.InterRegular20} goal_header_text`}>Outcomes I&apos;m Working Towards</h3>
              <motion.div 
                className="dropdown_icon"
                animate={{ rotate: expandedGoal === 2 ? 90 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.79006 15.88L13.6701 12L9.79006 8.11998C9.40006 7.72998 9.40006 7.09998 9.79006 6.70998C10.1801 6.31998 10.8101 6.31998 11.2001 6.70998L15.7901 11.3C16.1801 11.69 16.1801 12.32 15.7901 12.71L11.2001 17.3C10.8101 17.69 10.1801 17.69 9.79006 17.3C9.41006 16.91 9.40006 16.27 9.79006 15.88Z" fill="white" fillOpacity="0.7"/>
                </svg>
              </motion.div>
            </div>
            
            {/* Goal Body (Visible only when expanded) */}
            <AnimatePresence>
              {expandedGoal === 2 && (
                <motion.div 
                  className="goal_body_content"
                  key="goal2-content"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={contentVariants}
                  style={{
                    padding: '10px 10px 0px 10px',
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <div className="SubGoal">
                    <div className="SubGoal_Circle">
                      <div className="Circle"></div>
                    </div>
                    <p className={`${styles.InterRegular18} goal_body_item`}>Land a job as an AI designer</p>
                  </div>
                  <div className="SubGoal">
                    <div className="SubGoal_Circle">
                      <div className="Circle"></div>
                    </div>
                    <p className={`${styles.InterRegular18} goal_body_item`}>Get 100+ people to test my prototypes</p>
                  </div>
                  <div className="SubGoal">
                    <div className="SubGoal_Circle">
                      <div className="Circle"></div>
                    </div>
                    <p className={`${styles.InterRegular18} goal_body_item`}>Feedback or guidance from 20 top-tier AI designers and/or PMs</p>
                  </div>
                  <div className="SubGoal">
                    <div className="SubGoal_Circle">
                      <div className="Circle"></div>
                    </div>
                    <p className={`${styles.InterRegular18} goal_body_item`}>Collaborate with engineers or PMs on 1 to 2 projects</p>
                  </div>
                  <div className="SubGoal">
                    <div className="SubGoal_Circle">
                      <div className="Circle"></div>
                    </div>
                    <p className={`${styles.InterRegular18} goal_body_item`}>Build a portfolio of 10+ prototypes</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* ----------------------------------------
          COMPONENT STYLES - Goal section styles
          ---------------------------------------- */}
      <style jsx>{`
        /* Main container */
        .goal_body {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 72px 0px 36px;
          gap: 10px;
          width: 100%;
          margin: 0 auto;
          background: var(--DarkSecondary);
          backdrop-filter: blur(45px);
        }
        
        /* Section container for header and body text */
        .section_container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 57px 20px;
          gap: 32px;
          width: 100%;
          max-width: 1160px;
        }
        
        .section_headertext {
          width: auto;
          text-align: center;
          letter-spacing: -0.02em;
          color: var(--WhiteOpacity);
        }
        
        .section_bodytext {
          width: 100%;
          max-width: 1120px;
          text-align: center;
          color: var(--WhiteOpacity70);
        }
        
        /* Goals container for the two goal cards */
        .goals_container {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-start;
          padding: 20px 10px;
          gap: 25px;
          width: 100%;
          max-width: 1160px;
        }
        
        /* Individual goal item */
        .goal_item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          width: 486px;
          min-width: 300px; /* minimum width for small screens */
        }
        
        /* Goal picture section */
        .goal_picture {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 96px;
          background: var(--WhiteOpacity03);
          border-radius: 16px 16px 0px 0px;
          overflow: hidden;
          position: relative;
        }
        
        .goal_image_container {
          width: 100%;
          height: 100%;
          opacity: 0.6;
          position: relative;
        }
        
        /* Goal content section */
        .goal_content {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 20px 30px;
          gap: 20px;
          width: 100%;
          height: 100%;
          background: var(--WhiteOpacity03);
          border-radius: 0px 0px 16px 16px;
        }
        
        /* Goal header with dropdown */
        .goal_header {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          padding: 0px;
          gap: 8px;
          width: 100%;
          height: auto;
          cursor: pointer;
        //   border: 1px solid red;
        }
        
        .goal_header_text {
          color: var(--WhiteOpacity);
        }
        
        // .nowrap {
        //   white-space: nowrap;
        // }
        
        /* Goal body content - list of items */
        .goal_body_content {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          width: 100%;
        }
        
        /* SubGoal container */
        .SubGoal {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px;
          width: 100%;
          height: auto;
          min-height: 44px;
          align-self: stretch;
        }
        
        /* Circle container */
        .SubGoal_Circle {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
          padding: 10px 8px 8px 0px;
          gap: 10px;
          width: 12px;
          height: 22px;
          flex: none;
        }
        
        /* Circle dot */
        .Circle {
          width: 4px;
          height: 4px;
          border-radius: 100%;
          background: var(--WhiteOpacity70);
          flex: none;
        }
        
        .goal_body_item {
          width: 100%;
          line-height: 22px;
          color: var(--WhiteOpacity70);
          margin-bottom: 16px; /* Use margin instead of gap */
        }
        
        /* Last item in the list should not have bottom margin */
        .SubGoal:last-child .goal_body_item {
          margin-bottom: 0;
        }
        
        /* Responsive styles */
        @media (max-width: 996px) {
          .goals_container {
            flex-direction: column;
            align-items: center;
          }
          
          .goals_container {
            gap: 0px;
          }

          .goal_item {
            width: 100%;
            max-width: 486px;
            margin-bottom: 25px;
          }
        }
        
        @media (max-width: 576px) {
          .goal_body {
            padding: 30px 0px 30px 0px;
          }
          
          .section_container {
            padding: 30px 20px;
          }
          
          .goal_content {
            padding: 24px 16px 24px;
          }
          
          .goal_body_content {
            padding: 0px 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default Goal_Body; 