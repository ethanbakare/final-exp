import React from 'react';
import styles from '../styles/HomePage.module.css';
import { useSectionLoading } from '@/hooks/useSectionLoading';

const RulesAboutBody: React.FC = () => {
  // Integrate with loading context
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isLoaded } = useSectionLoading('RulesAboutBody', [true]);
  
  return (
    <div className="rulesabout_body">
      {/* ----------------------------------------
          ----------------------------------------
          EXPERIMENT CONTAINER
          ----------------------------------------
          ---------------------------------------- */}
      <div className="experiment_container">
        <h2 className={`${styles.FrankRuhlLibre48} experiment_text`}>The Experiment</h2>
        
        {/* Rules Main */}
        <div className="rules_main">
          <h3 className={`${styles.InterRegular24_H1} rules_text`}>Rules</h3>
          <div className="rules_body">
            <p className={`${styles.InterRegular20_H1} rule_item`}>One working project completed every week</p>
            <p className={`${styles.InterRegular20_H1} rule_item`}>Daily progress update on <a href="https://x.com/etbakare" target="_blank" rel="noopener noreferrer" className="twitter-link">Twitter</a></p>
            <p className={`${styles.InterRegular20_H1} rule_item`}>2-minute video walkthrough every Sunday</p>
            <p className={`${styles.InterRegular20_H1} rule_item`}>Every missed project = £1000 to charity</p>
          </div>
        </div>
      </div>
      
      {/* ----------------------------------------
          ----------------------------------------
          ABOUT CONTAINER
          ----------------------------------------
          ---------------------------------------- */}
      <div className="about_container">
        <div className="about_card">
          <div className="about_card_header">
            <h3 className={`${styles.InterRegular20_H1_SemiBold} rules_text`}>ABOUT ME</h3>
          </div>
          
          <div className="about_body">
            <div className="about_body_text">
              <p className={`${styles.InterRegular16} about_text_paragraph`}>
                I live between clarity and obsession. 
              </p>
              <p className={`${styles.InterRegular16} about_text_paragraph`}>
                I like pulling things apart until they make sense.
              </p>
              <p className={`${styles.InterRegular16} about_text_paragraph`}>
                I&apos;m not good at half-caring — if something feels real, I give it everything.
              </p>
              <p className={`${styles.InterRegular16} about_text_paragraph`}>
                Some ideas I tried to bury. They never stayed buried.
              </p>
              <p className={`${styles.InterRegular16} about_text_paragraph`}>
                Most of what I build starts with a question I couldn&apos;t ignore.
              </p>
              <p className={`${styles.InterRegular16} about_text_paragraph`}>
                If you&apos;re building long-term and want someone who burns for the work — let&apos;s talk.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Global styles for RulesAboutBody */}
      <style jsx>{`
        .rulesabout_body {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 74px 0px 30px;
          gap: 10px;
          width: 100%;
          margin: 0 auto;
          background: var(--DarkSecondary);
        }
        
        .experiment_container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 57px 10px;
          gap: 64px;
          width: 100%;
          max-width: 1160px;
        }
        
        .experiment_text {
          width: 321px;
          height: 45px;
          text-align: center;
          letter-spacing: -0.02em;
          color: var(--WhiteOpacity);
        }
        
        .rules_main {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0px;
          gap: 28px;
          width: 422px;
        }
        
        .rules_text {
          width: 100%;
          text-align: center;
          color: var(--WhiteOpacity);
        }
        
        .rules_body {
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
          color: var(--WhiteOpacity70);
        }
        
        .about_container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px 10px 48px;
          gap: 25px;
          width: 100%;
          max-width: 1160px;
        }
        
        .about_card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 30px 60px 30px 40px;
          gap: 40px;
          width: 496px;
          max-width: 856px;
          background: var(--WhiteOpacity03);
          border-radius: 16px;
        }
        
        .about_card_header {
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: flex-start;
          padding: 0px 0px 16px;
          gap: 10px;
          width: 100%;
          border-bottom: 1px solid var(--WhiteOpacity10);
        }
        
        .about_body {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px;
          width: 100%;
        }
        
        .about_body_text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0px 0px 32px;
          gap: 25px;
          width: 100%;
        }
        
        .about_text_paragraph {
          width: 100%;
          line-height: 129%;
          color: var(--WhiteOpacity70);
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
        
        .about_card_header_text {
          width: 100%;
          text-align: center;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--WhiteOpacity40);
        }
        
        /* Responsive styles */
        @media (max-width: 576px) {

          .rulesabout_body {
            // border: 1px solid red;
            padding: 40px 0px 30px 0px;
          }
          
          .experiment_container {
            // border: 1px solid blue;
            padding: 30px 0px;
            gap: 56px;
          }
          
          .rules_main {
            width: 100%;
            max-width: 100%;
            padding: 0px 10px;
          }
          
          .rules_body {
            width: 100%;
            padding: 0px 10px;
            // border: 1px solid green;
          }
          
          .about_card {
            width: 100%;
            max-width: 100%;
            padding: 20px;
          }
          
          .about_body_text {
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default RulesAboutBody; 