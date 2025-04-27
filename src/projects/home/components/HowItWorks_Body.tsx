import React from 'react';
import styles from '../styles/HomePage.module.css';
// import { useSectionLoading } from '@/hooks/useSectionLoading';

const HowItWorks_Body: React.FC = () => {
  // Integrate with loading context
  // const { isLoaded } = useSectionLoading('HowItWorks_Body', [true]);
  
  return (
    <div id="how-it-works" className="howitworks_body">
      {/* ----------------------------------------
          ----------------------------------------
          SECTION CONTAINER - How It Works Header
          ----------------------------------------
          ---------------------------------------- */}
      <div className="section_container">
        <h2 className={`${styles.FrankRuhlLibre48} header_text`}>The Experiment</h2>
        
        {/* Section Body */}
        <div className="section_body">
          <p className={`${styles.InterRegular24} section_bodytext`}>
          10 builds. 90 days. <span className="nowrap">£1000 per miss.</span>
          </p>
          <p className={`${styles.InterRegular14} section_bodymicrocopytext`}>
          A public experiment in shipping, not waiting.
          </p>
        </div>
      </div>
      
      {/* ----------------------------------------
          ----------------------------------------
          RULES SECTION - The Rules Card
          ----------------------------------------
          ---------------------------------------- */}
      <div className="rules_section">
        <div className="rules_card">
          <div className="rules_header">
            <h3 className="rules_header_text">THE RULES</h3>
          </div>
          
          <div className="rules_body">
            <div className="rules_bodytext">
              <p className={`${styles.InterRegular20_H1} rule_item`}>One working project completed every week</p>
              <p className={`${styles.InterRegular20_H1} rule_item`}>Daily progress update on <a href="https://x.com/etbakare" target="_blank" rel="noopener noreferrer" className="twitter-link">Twitter</a></p>
              <p className={`${styles.InterRegular20_H1} rule_item`}>2-minute video walkthrough every Sunday</p>
              <p className={`${styles.InterRegular20_H1} rule_item`}>Every missed project = £1000 to charity</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* ----------------------------------------
          ----------------------------------------
          QUOTE SECTION - Quote Container
          ----------------------------------------
          ---------------------------------------- */}
      <div className="quote_section">
        <div className="quote_container">
          <h3 className={`${styles.InterRegular24} quote_headertext`}>Why I&apos;m Doing This.</h3>
          
          <div className="quote_body">
            <p className={`${styles.InterRegular20_H1} quote_bodytext`}>
            The traditional route says: apply, wait, hope. 
            I say: build, ship, and share instead. 
            This sprint is a public test of whether consistent output — not credentials — can break into AI design.
            </p>
            <div className="quote_bar"></div>
          </div>
        </div>
      </div>
      
      {/* Global styles for HowItWorks_Body */}
      <style jsx>{`
        .howitworks_body {
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
        
        .header_text {
          width: 321px;
          height: 45px;
          text-align: center;
          letter-spacing: -0.02em;
          color: #FFFFFF;
        }
        
        .section_body {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 1120px;
        }
        
        .section_bodytext {
          width: 100%;
          text-align: center;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .section_bodymicrocopytext {
          width: 100%;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
        }
        
        .rules_section {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 10px;
          gap: 25px;
          width: 100%;
          max-width: 1160px;
        }
        
        .rules_card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 30px;
          gap: 40px;
          width: 482px;
          max-width: 856px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
        }
        
        .rules_header {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-start;
          padding: 0px 0px 20px;
          gap: 10px;
          width: 100%;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .rules_header_text {
          font-family: 'Inter';
          font-style: normal;
          font-weight: 600;
          font-size: 16px;
          line-height: 93.75%;
          text-align: center;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
        }
        
        .rules_body {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
        }
        
        .rules_bodytext {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px 0px 32px;
          gap: 25px;
          width: 100%;
        }
        
        .rule_item {
          width: 100%;
          line-height: 24px;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .quote_section {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 72px 10px 56px;
          gap: 25px;
          width: 100%;
          max-width: 1160px;
        }
        
        .quote_container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px;
          gap: 20px;
          width: 800px;
          max-width: 856px;
          border-radius: 0px 16px 16px 0px;
        }
        
        .quote_headertext {
          width: 100%;
          text-align: center;
          color: var(--WhiteOpacity);
        }
        
        .quote_body {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px;
          gap: 16px;
          width: 100%;
        }
        
        .quote_bodytext {
          width: 582px;
          text-align: center;
          color: var(--WhiteOpacity);
        }
        
        .quote_bar {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-start;
          padding: 0px 0px 10px;
          gap: 10px;
          width: 72px;
        //   border-radius: 10px;
          border-bottom: 3px solid var(--AccentGreenOpacity60);
        }
        
        .nowrap {
          white-space: nowrap;
        }
        
        .twitter-link {
          color: var(--WhiteOpacity);
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: opacity 0.2s ease;
        }
        
        .twitter-link:hover {
          opacity: 0.8;
        }
        
        /* Responsive styles */
        @media (max-width: 576px) {

          .howitworks_body {
            padding: 30px 0px 30px 0px;
          }

          .section_container {
            gap: 24px;
          }

          .rules_card {
            width: 100%;
            padding: 30px 20px;
            max-width: 100%;
          }

          .rules_bodytext {
            padding: 0px 0px 20px;
          }                                   
 
          
          .quote_container {
            width: 100%;
          }
          
          .quote_bodytext {
            width: 100%;
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default HowItWorks_Body; 