import React from 'react';
import styles from '@/projects/demo-showcase/styles/showcase.module.css';

interface ShowcaseIntroProps {
  description: string;
}

export const ShowcaseIntro: React.FC<ShowcaseIntroProps> = ({ description }) => (
  <div className="demo-intro">
    <span className={`demo-description ${styles.OpenRunde600_16}`}>{description}</span>

    <style jsx>{`
      .demo-intro {
        display: flex;
        max-width: 1160px;
        padding: 15px 116px;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        align-self: stretch;
      }
      .demo-description {
        color: #5E5E5C;
        text-align: center;
      }
      @media (max-width: 768px) {
        .demo-intro {
          padding: 15px 20px;
        }
      }
    `}</style>
  </div>
);
