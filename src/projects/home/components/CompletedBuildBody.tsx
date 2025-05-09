import React from 'react';
import styles from '../styles/HomePage.module.css';
import { useSectionLoading } from '@/hooks/useSectionLoading';

const CompletedBuildBody: React.FC = () => {
  // Integrate with loading context
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isLoaded } = useSectionLoading('CompletedBuildBody', [true]);
  
  return (
    <div className="completed_build_body">
      {/* ----------------------------------------
          ----------------------------------------
          SECTION CONTAINER - Completed Projects Header
          ----------------------------------------
          ---------------------------------------- */}
      <div className="section_container">
        <h2 className={`${styles.FrankRuhlLibre48} section_title`}>Completed Projects</h2>
      </div>
      
      {/* ----------------------------------------
          ----------------------------------------
          CURRENT PROJECT CARD - Coming Soon
          ----------------------------------------
          ---------------------------------------- */}
      <div className="completed_container">
        <div className="completed_card">
          {/* ----------------------------------------
              CARD HEADER - Coming Soon
              ---------------------------------------- */}
          <div className="completed_header">
            <div className="completed_header_text">
              <h3 className={`${styles.InterRegular28}`}>Coming Soon</h3>
            </div>
          </div>
          
          {/* ----------------------------------------
              CARD BODY - Prototype info
              ---------------------------------------- */}
          <div className="completed_body">
            <div className="completed_body_text">
              <p className={`${styles.InterRegular20_H1}`}>
                First prototype drops on Sunday, 11th May.
              </p>
              <p className={`${styles.InterRegular20_H1}`}>
                Check back to explore the builds.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Component styles */}
      <style jsx>{`
        .completed_build_body {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 72px 0px 30px;
          gap: 10px;
          width: 100%;
          margin: 0 auto;
          background: var(--DarkSecondary);
          backdrop-filter: blur(45px);
        }
        
        .section_container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 56px 20px;
          gap: 32px;
          width: 100%;
          max-width: 1160px;
        }
        
        .section_title {
          width: 100%;
          text-align: left;
          color: var(--WhiteOpacity);
          margin: 0;
        }
        
        .completed_container {
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
        
        .completed_card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 30px 50px 30px 30px;
          gap: 32px;
          width: 100%;
          max-width: 816px;
          height: auto;
          background: var(--WhiteOpacity05);
          border-radius: 16px;
        }
        
        /* Card header with border bottom */
        .completed_header {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          padding: 0px 0px 10px;
          gap: 10px;
          width: 100%;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .completed_header_text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 5px;
          width: 100%;
          flex-grow: 1;
        }
        
        .completed_header_text h3 {
          width: 100%;
          color: var(--WhiteOpacity);
          margin: 0;
        }
        
        /* Card body */
        .completed_body {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          width: 100%;
        }
        
        .completed_body_text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          gap: 16px;
          width: 100%;
        }
        
        .completed_body_text p {
          width: 100%;
          color: var(--WhiteOpacity70);
          margin: 0;
          text-align: left;
        }
        
        /* Responsive styles */
        @media (max-width: 600px) {
          .completed_build_body {
            padding: 40px 10px 30px 10px;
          }
          
          .section_container {
            padding: 52px 0px;
          }
          
          .section_title {
            text-align: left;
          }
          
          .completed_container {
            padding: 0px;
          }
          
          .completed_card {
            padding: 20px;
            max-width: 100%;
          }
          
          .completed_header {
            flex-direction: column;
            gap: 16px;
          }
          
          .completed_body_text p {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CompletedBuildBody; 